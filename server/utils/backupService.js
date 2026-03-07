import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import pool from '../config/db.js';
import * as BackupModel from '../models/BackupModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_ROOT = path.resolve(__dirname, '../backups');
const BACKUP_SCOPE_TABLES = {
  settings: ['company_info', 'contact_info', 'shamcash_config', 'seo_settings', 'store_settings', 'user_preferences'],
  products: ['products', 'supplies'],
  orders: ['orders', 'order_items'],
  customers: ['users', 'addresses'],
  content: [
    'articles',
    'hero_slides',
    'policies',
    'offers',
    'services',
    'page_contents',
    'filter_groups',
    'filter_options',
    'custom_categories',
    'custom_species',
    'team_members',
    'media_folders',
    'media_items',
  ],
};
const BACKUP_TYPE_SCOPE = {
  full: ['settings', 'products', 'orders', 'customers', 'content'],
  products: ['products'],
  orders: ['orders'],
  customers: ['customers'],
  settings: ['settings'],
};
const DELETE_ORDER = [
  'order_items',
  'orders',
  'addresses',
  'media_items',
  'media_folders',
  'filter_options',
  'filter_groups',
  'offers',
  'policies',
  'page_contents',
  'services',
  'hero_slides',
  'articles',
  'custom_categories',
  'custom_species',
  'team_members',
  'products',
  'supplies',
  'users',
  'user_preferences',
  'company_info',
  'contact_info',
  'shamcash_config',
  'seo_settings',
  'store_settings',
];
const INSERT_ORDER = [...DELETE_ORDER].reverse();

let schedulerHandle = null;
let isAutomaticBackupRunning = false;

function ensureDirectory() {
  if (!fs.existsSync(BACKUP_ROOT)) {
    fs.mkdirSync(BACKUP_ROOT, { recursive: true });
  }
}

function unique(items) {
  return Array.from(new Set(items));
}

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

function clampDayOfMonth(day) {
  const numericDay = Number(day || 1);
  return Math.min(28, Math.max(1, Number.isFinite(numericDay) ? numericDay : 1));
}

function normalizeTime(value) {
  return /^\d{2}:\d{2}$/.test(String(value || '')) ? String(value) : '03:00';
}

function normalizeFrequency(value) {
  const frequency = String(value || '').trim().toLowerCase();
  return ['weekly', 'biweekly', 'monthly'].includes(frequency) ? frequency : 'weekly';
}

function normalizeScopes(value) {
  const raw = Array.isArray(value) ? value : [];
  const scopes = raw
    .map((scope) => String(scope || '').trim())
    .filter((scope) => Object.prototype.hasOwnProperty.call(BACKUP_SCOPE_TABLES, scope));
  return scopes.length > 0 ? unique(scopes) : ['settings', 'products', 'orders', 'customers'];
}

function normalizeBackupSettings(value) {
  const dayOfWeek = Number(value?.dayOfWeek);
  return {
    ...(value || {}),
    enabled: value?.enabled !== false,
    frequency: normalizeFrequency(value?.frequency),
    timeOfDay: normalizeTime(value?.timeOfDay),
    dayOfWeek: Number.isFinite(dayOfWeek) ? Math.min(6, Math.max(0, dayOfWeek)) : 6,
    dayOfMonth: clampDayOfMonth(value?.dayOfMonth),
    retentionCount: Math.max(1, Number(value?.retentionCount || 4)),
    includedScopes: normalizeScopes(value?.includedScopes),
    lastRunAt: formatDate(value?.lastRunAt),
    lastStatus: String(value?.lastStatus || 'idle'),
    lastError: String(value?.lastError || ''),
    nextRunAt: formatDate(value?.nextRunAt),
  };
}

function nextWeeklyOccurrence(referenceDate, dayOfWeek, timeOfDay, intervalDays = 7) {
  const [hours, minutes] = timeOfDay.split(':').map((part) => Number(part));
  const base = new Date(referenceDate);
  base.setHours(hours, minutes, 0, 0);
  const diff = (dayOfWeek - base.getDay() + 7) % 7;
  base.setDate(base.getDate() + diff);
  if (base.getTime() <= referenceDate.getTime()) {
    base.setDate(base.getDate() + intervalDays);
  }
  return base;
}

function nextMonthlyOccurrence(referenceDate, dayOfMonth, timeOfDay) {
  const [hours, minutes] = timeOfDay.split(':').map((part) => Number(part));
  const candidate = new Date(referenceDate);
  candidate.setHours(hours, minutes, 0, 0);
  candidate.setDate(clampDayOfMonth(dayOfMonth));
  if (candidate.getTime() <= referenceDate.getTime()) {
    candidate.setMonth(candidate.getMonth() + 1, clampDayOfMonth(dayOfMonth));
  }
  return candidate;
}

export function computeNextRunAt(settings, referenceDate = new Date()) {
  const normalized = normalizeBackupSettings(settings);
  const reference = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);

  if (!normalized.enabled) return null;

  if (normalized.frequency === 'monthly') {
    return nextMonthlyOccurrence(reference, normalized.dayOfMonth, normalized.timeOfDay);
  }

  return nextWeeklyOccurrence(
    reference,
    normalized.dayOfWeek,
    normalized.timeOfDay,
    normalized.frequency === 'biweekly' ? 14 : 7
  );
}

function resolveScopesForType(type) {
  const scopes = BACKUP_TYPE_SCOPE[type];
  if (!scopes) {
    throw new Error('نوع النسخة الاحتياطية غير مدعوم');
  }
  return scopes;
}

function resolveTablesForScopes(scopes) {
  return unique(scopes.flatMap((scope) => BACKUP_SCOPE_TABLES[scope] || []));
}

function serializeDbValue(value) {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return value;
}

async function dumpTables(tableNames) {
  const payload = {};
  for (const tableName of tableNames) {
    const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
    payload[tableName] = Array.isArray(rows) ? rows : [];
  }
  return payload;
}

async function insertRows(connection, tableName, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const columns = unique(rows.flatMap((row) => Object.keys(row)));
  const placeholders = columns.map(() => '?').join(', ');
  const statement = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

  for (const row of rows) {
    const values = columns.map((column) => serializeDbValue(row[column]));
    await connection.query(statement, values);
  }
}

function readArchiveFile(filePath) {
  const compressed = fs.readFileSync(filePath);
  const raw = zlib.gunzipSync(compressed).toString('utf8');
  return JSON.parse(raw);
}

export async function getBackupSettings() {
  const current = normalizeBackupSettings(await BackupModel.getSettings());
  const nextRunAt = computeNextRunAt(
    current,
    current.lastRunAt ? new Date(current.lastRunAt) : new Date()
  );

  if (current.enabled && nextRunAt && current.nextRunAt !== nextRunAt.toISOString()) {
    return BackupModel.setSettings({
      ...current,
      nextRunAt: nextRunAt.toISOString(),
    });
  }

  return current;
}

export async function saveBackupSettings(value) {
  const current = normalizeBackupSettings(await BackupModel.getSettings());
  const nextSettings = normalizeBackupSettings({
    ...current,
    ...value,
  });

  const nextRunAt = nextSettings.enabled
    ? computeNextRunAt(
        nextSettings,
        nextSettings.lastRunAt ? new Date(nextSettings.lastRunAt) : new Date()
      )
    : null;

  return BackupModel.setSettings({
    ...nextSettings,
    lastStatus: nextSettings.enabled ? current.lastStatus || 'idle' : 'paused',
    nextRunAt: nextRunAt ? nextRunAt.toISOString() : null,
  });
}

export async function listBackups() {
  return BackupModel.findAll();
}

async function pruneAutomaticBackups(retentionCount) {
  const completedAutomaticBackups = await BackupModel.findAll({ automaticOnly: true, completedOnly: true });
  const backupsToDelete = completedAutomaticBackups.slice(retentionCount);

  for (const backup of backupsToDelete) {
    await deleteBackup(backup.id);
  }
}

export async function createBackup({ type, triggeredBy = null, isAutomatic = false, description = '', scopesOverride }) {
  ensureDirectory();
  const scopes = scopesOverride && scopesOverride.length > 0 ? normalizeScopes(scopesOverride) : resolveScopesForType(type);
  const tables = resolveTablesForScopes(scopes);
  const backupId = `backup-${Date.now()}`;
  const name = `نسخة ${type === 'full' ? 'كاملة' : type} - ${new Date().toLocaleString('sv-SE').replace(' ', '_')}`;

  await BackupModel.create({
    id: backupId,
    name,
    type,
    status: 'in_progress',
    description: description || (isAutomatic ? 'نسخة احتياطية تلقائية مضغوطة' : 'نسخة احتياطية يدوية مضغوطة'),
    fileName: null,
    filePath: null,
    sizeBytes: 0,
    scope: scopes,
    isAutomatic,
    triggeredBy,
    startedAt: new Date().toISOString(),
    completedAt: null,
  });

  try {
    const rows = await dumpTables(tables);
    const archive = {
      version: 1,
      createdAt: new Date().toISOString(),
      type,
      scope: scopes,
      tables: rows,
    };
    const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(archive), 'utf8'), { level: 9 });
    const fileName = `${backupId}.json.gz`;
    const filePath = path.join(BACKUP_ROOT, fileName);
    fs.writeFileSync(filePath, compressed);

    const savedBackup = await BackupModel.update(backupId, {
      status: 'completed',
      fileName,
      filePath,
      sizeBytes: compressed.length,
      completedAt: new Date().toISOString(),
    });

    if (isAutomatic) {
      const settings = normalizeBackupSettings(await BackupModel.getSettings());
      await pruneAutomaticBackups(settings.retentionCount);
    }

    return savedBackup;
  } catch (error) {
    await BackupModel.update(backupId, {
      status: 'failed',
      restoreError: error?.message || 'فشل إنشاء النسخة الاحتياطية',
      completedAt: new Date().toISOString(),
    });
    throw error;
  }
}

export async function restoreBackup(id) {
  const backup = await BackupModel.findById(id);
  if (!backup) {
    throw new Error('النسخة الاحتياطية غير موجودة');
  }
  if (!backup.filePath || !fs.existsSync(backup.filePath)) {
    throw new Error('ملف النسخة الاحتياطية غير متوفر على الخادم');
  }

  const archive = readArchiveFile(backup.filePath);
  const tables = Object.keys(archive.tables || {});
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const tableName of DELETE_ORDER) {
      if (tables.includes(tableName)) {
        await connection.query(`DELETE FROM ${tableName}`);
      }
    }

    for (const tableName of INSERT_ORDER) {
      if (tables.includes(tableName)) {
        await insertRows(connection, tableName, archive.tables[tableName]);
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();

    return BackupModel.update(id, {
      restoredAt: new Date().toISOString(),
      restoreStatus: 'completed',
      restoreError: null,
    });
  } catch (error) {
    await connection.rollback();
    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch {
      // ignore cleanup failure
    }
    await BackupModel.update(id, {
      restoredAt: new Date().toISOString(),
      restoreStatus: 'failed',
      restoreError: error?.message || 'فشل استعادة النسخة الاحتياطية',
    });
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteBackup(id) {
  const backup = await BackupModel.findById(id);
  if (!backup) return false;

  if (backup.filePath && fs.existsSync(backup.filePath)) {
    fs.unlinkSync(backup.filePath);
  }

  return BackupModel.remove(id);
}

export async function getDownloadInfo(id) {
  const backup = await BackupModel.findById(id);
  if (!backup) {
    throw new Error('النسخة الاحتياطية غير موجودة');
  }
  if (!backup.filePath || !fs.existsSync(backup.filePath)) {
    throw new Error('ملف النسخة الاحتياطية غير متوفر');
  }
  return backup;
}

async function runAutomaticBackupIfDue() {
  if (isAutomaticBackupRunning) return;

  const settings = normalizeBackupSettings(await getBackupSettings());
  if (!settings.enabled || !settings.nextRunAt) return;

  const nextRunAt = new Date(settings.nextRunAt);
  if (!Number.isFinite(nextRunAt.getTime()) || nextRunAt.getTime() > Date.now()) return;

  isAutomaticBackupRunning = true;

  try {
    await BackupModel.setSettings({
      ...settings,
      lastStatus: 'running',
      lastError: '',
    });

    await createBackup({
      type: 'full',
      triggeredBy: 'system',
      isAutomatic: true,
      description: 'نسخة احتياطية تلقائية مجدولة',
      scopesOverride: settings.includedScopes,
    });

    const lastRunAt = new Date();
    const nextScheduledRun = computeNextRunAt(settings, lastRunAt);
    await BackupModel.setSettings({
      ...settings,
      lastRunAt: lastRunAt.toISOString(),
      lastStatus: 'completed',
      lastError: '',
      nextRunAt: nextScheduledRun ? nextScheduledRun.toISOString() : null,
    });
  } catch (error) {
    const failedAt = new Date();
    const nextScheduledRun = computeNextRunAt(settings, failedAt);
    await BackupModel.setSettings({
      ...settings,
      lastRunAt: settings.lastRunAt,
      lastStatus: 'failed',
      lastError: error?.message || 'فشل تنفيذ النسخة الاحتياطية التلقائية',
      nextRunAt: nextScheduledRun ? nextScheduledRun.toISOString() : null,
    });
    console.error('[backup] Automatic backup failed:', error);
  } finally {
    isAutomaticBackupRunning = false;
  }
}

export function startBackupScheduler() {
  if (schedulerHandle) return schedulerHandle;

  ensureDirectory();
  runAutomaticBackupIfDue().catch((error) => {
    console.error('[backup] Failed to initialize scheduler:', error);
  });

  schedulerHandle = setInterval(() => {
    runAutomaticBackupIfDue().catch((error) => {
      console.error('[backup] Scheduler tick failed:', error);
    });
  }, 60 * 1000);

  return schedulerHandle;
}

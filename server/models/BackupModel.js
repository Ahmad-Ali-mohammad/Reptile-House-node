import pool from '../config/db.js';
import { read, write } from '../store.js';
import { rowToCamel, rowsToCamel } from '../utils/rowMapper.js';

const SETTINGS_STORE_KEY = 'backup_settings';
const BACKUPS_STORE_KEY = 'backups';
const DEFAULT_SETTINGS = {
  id: 1,
  enabled: true,
  frequency: 'weekly',
  timeOfDay: '03:00',
  dayOfWeek: 6,
  dayOfMonth: 1,
  retentionCount: 4,
  includedScopes: ['settings', 'products', 'orders', 'customers'],
  lastRunAt: null,
  lastStatus: 'idle',
  lastError: '',
  nextRunAt: null,
  updatedAt: null,
};

function toIsoOrNull(value) {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

function normalizeScopes(value) {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : value.split(',');
          } catch {
            return value.split(',');
          }
        })()
      : [];

  const scopes = raw
    .map((scope) => String(scope || '').trim())
    .filter(Boolean);

  return scopes.length > 0 ? Array.from(new Set(scopes)) : [...DEFAULT_SETTINGS.includedScopes];
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value <= 0) return '0 MB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function normalizeSettingsRow(row) {
  const normalized = rowToCamel(row || {});
  return {
    ...DEFAULT_SETTINGS,
    ...normalized,
    enabled: normalized.enabled !== false,
    frequency: ['weekly', 'biweekly', 'monthly'].includes(normalized.frequency) ? normalized.frequency : DEFAULT_SETTINGS.frequency,
    timeOfDay: /^\d{2}:\d{2}$/.test(String(normalized.timeOfDay || '')) ? String(normalized.timeOfDay) : DEFAULT_SETTINGS.timeOfDay,
    dayOfWeek: Number.isFinite(Number(normalized.dayOfWeek)) ? Number(normalized.dayOfWeek) : DEFAULT_SETTINGS.dayOfWeek,
    dayOfMonth: Number.isFinite(Number(normalized.dayOfMonth)) ? Number(normalized.dayOfMonth) : DEFAULT_SETTINGS.dayOfMonth,
    retentionCount: Math.max(1, Number(normalized.retentionCount || DEFAULT_SETTINGS.retentionCount)),
    includedScopes: normalizeScopes(normalized.includedScopes),
    lastRunAt: toIsoOrNull(normalized.lastRunAt),
    lastStatus: String(normalized.lastStatus || DEFAULT_SETTINGS.lastStatus),
    lastError: String(normalized.lastError || ''),
    nextRunAt: toIsoOrNull(normalized.nextRunAt),
    updatedAt: toIsoOrNull(normalized.updatedAt),
  };
}

function normalizeBackupRow(row) {
  if (!row) return null;
  const normalized = row.filePath ? row : rowToCamel(row);
  const sizeBytes = Number(normalized.sizeBytes || 0);
  return {
    id: String(normalized.id),
    name: String(normalized.name || ''),
    type: String(normalized.type || 'full'),
    status: String(normalized.status || 'failed'),
    description: String(normalized.description || ''),
    fileName: normalized.fileName ? String(normalized.fileName) : null,
    filePath: normalized.filePath ? String(normalized.filePath) : null,
    sizeBytes,
    sizeLabel: formatBytes(sizeBytes),
    scope: normalizeScopes(normalized.scope),
    isAutomatic: normalized.isAutomatic === true,
    triggeredBy: normalized.triggeredBy ? String(normalized.triggeredBy) : null,
    startedAt: toIsoOrNull(normalized.startedAt),
    completedAt: toIsoOrNull(normalized.completedAt),
    restoredAt: toIsoOrNull(normalized.restoredAt),
    restoreStatus: normalized.restoreStatus ? String(normalized.restoreStatus) : null,
    restoreError: normalized.restoreError ? String(normalized.restoreError) : null,
    createdAt: toIsoOrNull(normalized.createdAt) || new Date().toISOString(),
    updatedAt: toIsoOrNull(normalized.updatedAt),
  };
}

function readSettings() {
  return normalizeSettingsRow(read(SETTINGS_STORE_KEY, DEFAULT_SETTINGS));
}

function writeSettings(value) {
  return write(SETTINGS_STORE_KEY, normalizeSettingsRow(value));
}

function readBackups() {
  const rows = read(BACKUPS_STORE_KEY, []);
  return Array.isArray(rows) ? rows.map(normalizeBackupRow).filter(Boolean) : [];
}

function writeBackups(rows) {
  return write(BACKUPS_STORE_KEY, rows.map(normalizeBackupRow).filter(Boolean));
}

export async function getSettings() {
  try {
    const [rows] = await pool.query('SELECT * FROM backup_settings WHERE id = 1');
    if (rows[0]) return normalizeSettingsRow(rows[0]);
  } catch {
    return readSettings();
  }

  return readSettings();
}

export async function setSettings(data) {
  const nextSettings = normalizeSettingsRow(data);

  try {
    await pool.query(
      `
        INSERT INTO backup_settings (
          id, enabled, frequency, time_of_day, day_of_week, day_of_month,
          retention_count, included_scopes, last_run_at, last_status, last_error, next_run_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          enabled = VALUES(enabled),
          frequency = VALUES(frequency),
          time_of_day = VALUES(time_of_day),
          day_of_week = VALUES(day_of_week),
          day_of_month = VALUES(day_of_month),
          retention_count = VALUES(retention_count),
          included_scopes = VALUES(included_scopes),
          last_run_at = VALUES(last_run_at),
          last_status = VALUES(last_status),
          last_error = VALUES(last_error),
          next_run_at = VALUES(next_run_at)
      `,
      [
        1,
        nextSettings.enabled ? 1 : 0,
        nextSettings.frequency,
        nextSettings.timeOfDay,
        nextSettings.dayOfWeek,
        nextSettings.dayOfMonth,
        nextSettings.retentionCount,
        JSON.stringify(nextSettings.includedScopes),
        nextSettings.lastRunAt,
        nextSettings.lastStatus,
        nextSettings.lastError || null,
        nextSettings.nextRunAt,
      ]
    );
    return getSettings();
  } catch {
    return writeSettings(nextSettings);
  }
}

export async function findAll(options = {}) {
  const automaticOnly = options.automaticOnly === true;
  const completedOnly = options.completedOnly === true;

  try {
    const where = [];
    if (automaticOnly) where.push('is_automatic = 1');
    if (completedOnly) where.push("status = 'completed'");
    const [rows] = await pool.query(
      `
        SELECT *
        FROM backups
        ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY created_at DESC
      `
    );
    return rowsToCamel(rows).map(normalizeBackupRow).filter(Boolean);
  } catch {
    return readBackups()
      .filter((row) => (!automaticOnly || row.isAutomatic) && (!completedOnly || row.status === 'completed'))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
}

export async function findById(id) {
  try {
    const [rows] = await pool.query('SELECT * FROM backups WHERE id = ?', [id]);
    return rows[0] ? normalizeBackupRow(rows[0]) : null;
  } catch {
    return readBackups().find((row) => row.id === id) || null;
  }
}

export async function create(data) {
  const row = normalizeBackupRow({
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
    startedAt: data.startedAt || new Date().toISOString(),
  });

  try {
    await pool.query(
      `
        INSERT INTO backups (
          id, name, type, status, description, file_name, file_path, size_bytes,
          scope, is_automatic, triggered_by, started_at, completed_at, restored_at,
          restore_status, restore_error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        row.id,
        row.name,
        row.type,
        row.status,
        row.description,
        row.fileName,
        row.filePath,
        row.sizeBytes,
        JSON.stringify(row.scope),
        row.isAutomatic ? 1 : 0,
        row.triggeredBy,
        row.startedAt,
        row.completedAt,
        row.restoredAt,
        row.restoreStatus,
        row.restoreError,
      ]
    );
    return findById(row.id);
  } catch {
    const rows = readBackups();
    rows.unshift(row);
    writeBackups(rows);
    return row;
  }
}

export async function update(id, data) {
  const existing = await findById(id);
  if (!existing) return null;

  const row = normalizeBackupRow({
    ...existing,
    ...data,
    id,
  });

  try {
    await pool.query(
      `
        UPDATE backups
        SET
          name = ?,
          type = ?,
          status = ?,
          description = ?,
          file_name = ?,
          file_path = ?,
          size_bytes = ?,
          scope = ?,
          is_automatic = ?,
          triggered_by = ?,
          started_at = ?,
          completed_at = ?,
          restored_at = ?,
          restore_status = ?,
          restore_error = ?
        WHERE id = ?
      `,
      [
        row.name,
        row.type,
        row.status,
        row.description,
        row.fileName,
        row.filePath,
        row.sizeBytes,
        JSON.stringify(row.scope),
        row.isAutomatic ? 1 : 0,
        row.triggeredBy,
        row.startedAt,
        row.completedAt,
        row.restoredAt,
        row.restoreStatus,
        row.restoreError,
        id,
      ]
    );
    return findById(id);
  } catch {
    const rows = readBackups();
    const index = rows.findIndex((item) => item.id === id);
    if (index === -1) return null;
    rows[index] = row;
    writeBackups(rows);
    return row;
  }
}

export async function remove(id) {
  try {
    const [result] = await pool.query('DELETE FROM backups WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch {
    const rows = readBackups();
    const nextRows = rows.filter((row) => row.id !== id);
    if (nextRows.length === rows.length) return false;
    writeBackups(nextRows);
    return true;
  }
}

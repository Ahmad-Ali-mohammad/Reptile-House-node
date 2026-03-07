import crypto from 'crypto';
import pool from '../config/db.js';
import { read, write } from '../store.js';
import { rowToCamel, rowsToCamel } from '../utils/rowMapper.js';

const STORE_KEY = 'api_keys';
const VALID_PERMISSIONS = new Set(['read', 'write', 'delete']);

function nowIso(value = new Date()) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizePermissions(value) {
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

  const filtered = raw
    .map((permission) => String(permission || '').trim().toLowerCase())
    .filter((permission) => VALID_PERMISSIONS.has(permission));

  return filtered.length > 0 ? Array.from(new Set(filtered)) : ['read'];
}

function toIsoOrNull(value) {
  if (!value) return null;
  try {
    return nowIso(value);
  } catch {
    return null;
  }
}

function normalizeRow(row) {
  if (!row) return null;
  const normalized = row.keyHash ? row : rowToCamel(row);
  const permissions = normalizePermissions(normalized.permissions);
  const keyPrefix = String(normalized.keyPrefix || '').trim();

  return {
    id: String(normalized.id),
    name: String(normalized.name || ''),
    keyPrefix,
    keyHash: String(normalized.keyHash || ''),
    maskedKey: keyPrefix ? `${keyPrefix}...` : 'sk_live_***',
    permissions,
    createdAt: toIsoOrNull(normalized.createdAt) || nowIso(),
    lastUsedAt: toIsoOrNull(normalized.lastUsedAt),
    usageCount: Number(normalized.usageCount || 0),
    isActive: normalized.isActive !== false,
    expiresAt: normalized.expiresAt ? String(normalized.expiresAt).slice(0, 10) : null,
    createdBy: normalized.createdBy ? String(normalized.createdBy) : null,
    updatedAt: toIsoOrNull(normalized.updatedAt),
  };
}

function readKeys() {
  const rows = read(STORE_KEY, []);
  return Array.isArray(rows) ? rows.map(normalizeRow).filter(Boolean) : [];
}

function writeKeys(rows) {
  return write(STORE_KEY, rows.map(normalizeRow).filter(Boolean));
}

export function hashSecret(secret) {
  return crypto.createHash('sha256').update(String(secret || '')).digest('hex');
}

function isExpired(row) {
  if (!row?.expiresAt) return false;
  const expiresAt = new Date(`${row.expiresAt}T23:59:59.999Z`);
  return Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now();
}

export async function findAll() {
  try {
    const [rows] = await pool.query('SELECT * FROM api_keys ORDER BY created_at DESC');
    return rowsToCamel(rows).map(normalizeRow).filter(Boolean);
  } catch {
    return readKeys().sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
}

export async function findById(id) {
  try {
    const [rows] = await pool.query('SELECT * FROM api_keys WHERE id = ?', [id]);
    return rows[0] ? normalizeRow(rows[0]) : null;
  } catch {
    return readKeys().find((row) => row.id === id) || null;
  }
}

export async function findActiveBySecret(secret) {
  const keyHash = hashSecret(secret);

  try {
    const [rows] = await pool.query(
      `
        SELECT *
        FROM api_keys
        WHERE key_hash = ?
          AND is_active = 1
          AND (expires_at IS NULL OR expires_at >= CURDATE())
        LIMIT 1
      `,
      [keyHash]
    );
    return rows[0] ? normalizeRow(rows[0]) : null;
  } catch {
    const row = readKeys().find((item) => item.keyHash === keyHash && item.isActive && !isExpired(item));
    return row || null;
  }
}

export async function create(data) {
  const row = normalizeRow({
    ...data,
    permissions: normalizePermissions(data.permissions),
    usageCount: 0,
    isActive: data.isActive !== false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  try {
    await pool.query(
      `
        INSERT INTO api_keys (
          id, name, key_prefix, key_hash, permissions,
          usage_count, last_used_at, is_active, expires_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        row.id,
        row.name,
        row.keyPrefix,
        row.keyHash,
        JSON.stringify(row.permissions),
        row.usageCount,
        row.lastUsedAt,
        row.isActive ? 1 : 0,
        row.expiresAt,
        row.createdBy,
      ]
    );
    return findById(row.id);
  } catch {
    const rows = readKeys();
    rows.unshift(row);
    writeKeys(rows);
    return row;
  }
}

export async function update(id, data) {
  const existing = await findById(id);
  if (!existing) return null;

  const nextRow = normalizeRow({
    ...existing,
    ...data,
    id,
    permissions: data.permissions !== undefined ? normalizePermissions(data.permissions) : existing.permissions,
    updatedAt: nowIso(),
  });

  try {
    await pool.query(
      `
        UPDATE api_keys
        SET name = ?, permissions = ?, is_active = ?, expires_at = ?
        WHERE id = ?
      `,
      [
        nextRow.name,
        JSON.stringify(nextRow.permissions),
        nextRow.isActive ? 1 : 0,
        nextRow.expiresAt,
        id,
      ]
    );
    return findById(id);
  } catch {
    const rows = readKeys();
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return null;
    rows[index] = nextRow;
    writeKeys(rows);
    return nextRow;
  }
}

export async function updateSecret(id, data) {
  const existing = await findById(id);
  if (!existing) return null;

  const nextRow = normalizeRow({
    ...existing,
    ...data,
    id,
    isActive: true,
    updatedAt: nowIso(),
  });

  try {
    await pool.query(
      `
        UPDATE api_keys
        SET key_prefix = ?, key_hash = ?, is_active = 1
        WHERE id = ?
      `,
      [nextRow.keyPrefix, nextRow.keyHash, id]
    );
    return findById(id);
  } catch {
    const rows = readKeys();
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return null;
    rows[index] = nextRow;
    writeKeys(rows);
    return nextRow;
  }
}

export async function touchUsage(id) {
  const existing = await findById(id);
  if (!existing) return null;

  const lastUsedAt = nowIso();

  try {
    await pool.query(
      'UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = ? WHERE id = ?',
      [lastUsedAt, id]
    );
    return findById(id);
  } catch {
    const rows = readKeys();
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return null;
    rows[index] = normalizeRow({
      ...rows[index],
      usageCount: Number(rows[index].usageCount || 0) + 1,
      lastUsedAt,
      updatedAt: nowIso(),
    });
    writeKeys(rows);
    return rows[index];
  }
}

export async function remove(id) {
  try {
    const [result] = await pool.query('DELETE FROM api_keys WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch {
    const rows = readKeys();
    const nextRows = rows.filter((row) => row.id !== id);
    if (nextRows.length === rows.length) return false;
    writeKeys(nextRows);
    return true;
  }
}

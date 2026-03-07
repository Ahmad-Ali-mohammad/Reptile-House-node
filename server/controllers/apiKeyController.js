import crypto from 'crypto';
import * as ApiKeyModel from '../models/ApiKeyModel.js';

const VALID_PERMISSIONS = new Set(['read', 'write', 'delete']);

function generateSecret() {
  return `sk_live_${crypto.randomBytes(24).toString('hex')}`;
}

function sanitizeApiKey(row) {
  if (!row) return null;
  const { keyHash, ...safe } = row;
  return {
    ...safe,
    maskedKey: safe.maskedKey || (safe.keyPrefix ? `${safe.keyPrefix}...` : 'sk_live_***'),
  };
}

function normalizePermissions(value) {
  const source = Array.isArray(value) ? value : [];
  const permissions = source
    .map((permission) => String(permission || '').trim().toLowerCase())
    .filter((permission) => VALID_PERMISSIONS.has(permission));
  return permissions.length > 0 ? Array.from(new Set(permissions)) : ['read'];
}

function normalizeDate(value) {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

export async function list(req, res) {
  try {
    const rows = await ApiKeyModel.findAll();
    res.json(rows.map(sanitizeApiKey));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'يرجى تحديد اسم للمفتاح' });
    }

    const secret = generateSecret();
    const row = await ApiKeyModel.create({
      id: `key-${Date.now()}`,
      name,
      keyPrefix: secret.slice(0, 20),
      keyHash: ApiKeyModel.hashSecret(secret),
      permissions: normalizePermissions(req.body?.permissions),
      expiresAt: normalizeDate(req.body?.expiresAt),
      isActive: true,
      createdBy: req.authUser?.id || null,
    });

    res.status(201).json({
      apiKey: sanitizeApiKey(row),
      secret,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const row = await ApiKeyModel.update(req.params.id, {
      name: typeof req.body?.name === 'string' ? req.body.name.trim() : undefined,
      permissions: req.body?.permissions !== undefined ? normalizePermissions(req.body.permissions) : undefined,
      isActive: typeof req.body?.isActive === 'boolean' ? req.body.isActive : undefined,
      expiresAt: req.body?.expiresAt === null ? null : normalizeDate(req.body?.expiresAt),
    });

    if (!row) return res.status(404).json({ error: 'مفتاح الواجهة البرمجية غير موجود' });
    res.json(sanitizeApiKey(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function regenerate(req, res) {
  try {
    const secret = generateSecret();
    const row = await ApiKeyModel.updateSecret(req.params.id, {
      keyPrefix: secret.slice(0, 20),
      keyHash: ApiKeyModel.hashSecret(secret),
    });

    if (!row) return res.status(404).json({ error: 'مفتاح الواجهة البرمجية غير موجود' });
    res.json({
      apiKey: sanitizeApiKey(row),
      secret,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const ok = await ApiKeyModel.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'مفتاح الواجهة البرمجية غير موجود' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

import jwt from 'jsonwebtoken';
import * as ApiKeyModel from '../models/ApiKeyModel.js';

function getTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

function getApiKeyFromHeader(req) {
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string' && apiKeyHeader.trim()) {
    return apiKeyHeader.trim();
  }

  const header = req.headers.authorization || '';
  if (header.startsWith('ApiKey ')) {
    return header.slice('ApiKey '.length).trim();
  }

  return null;
}

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || '').trim();
  return secret || null;
}

export function getPermissionForMethod(method) {
  const normalizedMethod = String(method || '').toUpperCase();
  if (normalizedMethod === 'DELETE') return 'delete';
  if (['POST', 'PUT', 'PATCH'].includes(normalizedMethod)) return 'write';
  return 'read';
}

function apiKeyAllowsRequest(apiKey, method) {
  if (!apiKey || apiKey.isActive === false) return false;
  const permission = getPermissionForMethod(method);
  return Array.isArray(apiKey.permissions) && apiKey.permissions.includes(permission);
}

export async function attachApiKey(req, res, next) {
  const rawApiKey = getApiKeyFromHeader(req);
  if (!rawApiKey) {
    return next();
  }

  try {
    const apiKey = await ApiKeyModel.findActiveBySecret(rawApiKey);
    if (!apiKey) {
      return res.status(401).json({ error: 'مفتاح الواجهة البرمجية غير صالح أو منتهي الصلاحية' });
    }

    req.apiKey = apiKey;
    await ApiKeyModel.touchUsage(apiKey.id);
    return next();
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'فشل التحقق من مفتاح الواجهة البرمجية' });
  }
}

export function requireAuth(req, res, next) {
  if (req.apiKey) {
    if (!apiKeyAllowsRequest(req.apiKey, req.method)) {
      return res.status(403).json({ error: 'مفتاح الواجهة البرمجية لا يملك الصلاحية الكافية لهذا الطلب' });
    }
    return next();
  }

  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ error: 'غير مصرح. يرجى تسجيل الدخول.' });

  const secret = getJwtSecret();
  if (!secret) return res.status(500).json({ error: 'JWT secret is not configured on server' });

  try {
    const payload = jwt.verify(token, secret);
    req.authUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'رمز الدخول غير صالح أو منتهي الصلاحية' });
  }
}

export function requireRoles(...roles) {
  const allowedRoles = new Set(roles);
  return (req, res, next) => {
    if (req.apiKey) {
      if (!apiKeyAllowsRequest(req.apiKey, req.method)) {
        return res.status(403).json({ error: 'مفتاح الواجهة البرمجية لا يملك الصلاحية الكافية لهذا الطلب' });
      }
      return next();
    }

    requireAuth(req, res, () => {
      if (!req.authUser || !allowedRoles.has(req.authUser.role)) {
        return res.status(403).json({ error: 'لا تملك صلاحية تنفيذ هذا الإجراء' });
      }
      return next();
    });
  };
}

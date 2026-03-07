import * as UserModel from '../models/UserModel.js';

function sanitize(user) {
  if (!user) return user;
  const { passwordHash, passwordSalt, ...safe } = user;
  return safe;
}

function canManageUsers(req) {
  return req.authUser?.role === 'admin' || req.authUser?.role === 'manager';
}

export async function list(req, res) {
  try {
    const rows = await UserModel.findAll();
    res.json(rows.map(sanitize));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function get(req, res) {
  try {
    const canManage = canManageUsers(req);
    const isSelf = req.authUser?.id === req.params.id;
    if (!canManage && !isSelf) {
      return res.status(403).json({ error: 'لا تملك صلاحية عرض هذا المستخدم' });
    }

    const row = await UserModel.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json(sanitize(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const canManage = canManageUsers(req);
    const isSelf = req.authUser?.id === req.params.id;
    if (!canManage && !isSelf) {
      return res.status(403).json({ error: 'لا تملك صلاحية تعديل هذا المستخدم' });
    }

    const payload = canManage
      ? req.body
      : {
          name: req.body?.name,
          email: req.body?.email,
          avatarUrl: req.body?.avatarUrl,
        };

    const row = await UserModel.update(req.params.id, payload);
    if (!row) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json(sanitize(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    if (user.role === 'admin') {
      const users = await UserModel.findAll();
      const adminCount = users.filter((row) => row.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'لا يمكن حذف آخر حساب مسؤول في النظام' });
      }
    }

    const ok = await UserModel.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

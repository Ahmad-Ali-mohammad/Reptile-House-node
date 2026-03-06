import * as OrderModel from '../models/OrderModel.js';

export async function list(req, res) {
  try {
    const rows = await OrderModel.findAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function listMine(req, res) {
  try {
    const customerId = req.authUser?.id;
    const rows = await OrderModel.findByCustomerId(customerId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function get(req, res) {
  try {
    const row = await OrderModel.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  try {
    const body = {
      ...req.body,
      id: req.body.id || 'RH-' + Date.now(),
      customerId: req.authUser?.id || null,
    };
    const row = await OrderModel.create(body);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const row = await OrderModel.update(req.params.id, req.body);
    if (!row) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateStatus(req, res) {
  try {
    const row = await OrderModel.updateStatus(req.params.id, req.body);
    if (!row) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const ok = await OrderModel.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

import pool from '../config/db.js';
import { rowToCamel, rowsToCamel, objToSnake } from '../utils/rowMapper.js';

let hasCustomerIdColumnCache = null;

async function hasCustomerIdColumn() {
  if (hasCustomerIdColumnCache !== null) return hasCustomerIdColumnCache;
  try {
    let [rows] = await pool.query("SHOW COLUMNS FROM orders LIKE 'customer_id'");
    let exists = Array.isArray(rows) && rows.length > 0;

    if (!exists) {
      try {
        await pool.query('ALTER TABLE orders ADD COLUMN customer_id VARCHAR(64) DEFAULT NULL');
      } catch {
        // Ignore when migration was already applied concurrently or alter is not allowed.
      }
      try {
        await pool.query('CREATE INDEX idx_orders_customer_id ON orders(customer_id)');
      } catch {
        // Ignore when index already exists or cannot be created.
      }
      [rows] = await pool.query("SHOW COLUMNS FROM orders LIKE 'customer_id'");
      exists = Array.isArray(rows) && rows.length > 0;
    }

    hasCustomerIdColumnCache = exists;
  } catch {
    hasCustomerIdColumnCache = false;
  }
  return hasCustomerIdColumnCache;
}

async function attachItems(orders) {
  if (!orders?.length) return orders;
  const ids = orders.map((o) => o.id);
  const placeholders = ids.map(() => '?').join(',');
  const [itemRows] = await pool.query(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`,
    ids
  );
  const byOrder = {};
  for (const r of itemRows) {
    const row = rowToCamel(r);
    if (!byOrder[row.orderId]) byOrder[row.orderId] = [];
    byOrder[row.orderId].push({
      reptileId: row.reptileId,
      name: row.name,
      quantity: row.quantity,
      price: Number(row.price),
      imageUrl: row.imageUrl || '',
    });
  }
  return orders.map((o) => ({ ...o, items: byOrder[o.id] || [] }));
}

export async function findAll() {
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  const list = rowsToCamel(rows);
  return attachItems(list);
}

export async function findByCustomerId(customerId) {
  if (!customerId) return [];
  const canFilterByCustomer = await hasCustomerIdColumn();
  if (!canFilterByCustomer) return [];

  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
    [String(customerId)]
  );
  const list = rowsToCamel(rows);
  return attachItems(list);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  const order = rows[0] ? rowToCamel(rows[0]) : null;
  if (!order) return null;
  const [list] = await attachItems([order]);
  return list[0];
}

export async function create(data) {
  const d = objToSnake(data);
  const canUseCustomerId = await hasCustomerIdColumn();
  const fallbackStatus = 'pending';
  const fallbackPaymentStatus = 'review';

  if (canUseCustomerId) {
    await pool.query(
      `INSERT INTO orders (id, customer_id, date, status, total, payment_confirmation_image, payment_method, payment_verification_status, rejection_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.id,
        d.customer_id ?? null,
        d.date,
        d.status ?? fallbackStatus,
        d.total ?? 0,
        d.payment_confirmation_image ?? null,
        d.payment_method ?? null,
        d.payment_verification_status ?? fallbackPaymentStatus,
        d.rejection_reason ?? null,
      ]
    );
  } else {
    await pool.query(
      `INSERT INTO orders (id, date, status, total, payment_confirmation_image, payment_method, payment_verification_status, rejection_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.id,
        d.date,
        d.status ?? fallbackStatus,
        d.total ?? 0,
        d.payment_confirmation_image ?? null,
        d.payment_method ?? null,
        d.payment_verification_status ?? fallbackPaymentStatus,
        d.rejection_reason ?? null,
      ]
    );
  }

  const items = data.items || [];
  for (const it of items) {
    await pool.query(
      'INSERT INTO order_items (order_id, reptile_id, name, quantity, price, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [data.id, it.reptileId, it.name, it.quantity ?? 1, it.price, it.imageUrl ?? '']
    );
  }

  return findById(data.id);
}

export async function update(id, data) {
  const existing = await findById(id);
  if (!existing) return null;

  const d = objToSnake(data);
  const fields = [
    'date',
    'status',
    'total',
    'payment_confirmation_image',
    'payment_method',
    'payment_verification_status',
    'rejection_reason',
  ];
  const set = [];
  const vals = [];
  for (const f of fields) {
    if (d[f] !== undefined) {
      set.push(`${f} = ?`);
      vals.push(d[f]);
    }
  }

  if (set.length > 0) {
    vals.push(id);
    await pool.query(`UPDATE orders SET ${set.join(', ')} WHERE id = ?`, vals);
  }

  if (data.items && Array.isArray(data.items)) {
    await pool.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    for (const it of data.items) {
      await pool.query(
        'INSERT INTO order_items (order_id, reptile_id, name, quantity, price, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [id, it.reptileId, it.name, it.quantity ?? 1, it.price, it.imageUrl ?? '']
      );
    }
  }

  return findById(id);
}

export async function updateStatus(id, payload) {
  const existing = await findById(id);
  if (!existing) return null;

  const updates = {};
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.paymentVerificationStatus !== undefined) updates.paymentVerificationStatus = payload.paymentVerificationStatus;
  if (payload.rejectionReason !== undefined) updates.rejectionReason = payload.rejectionReason;
  if (Object.keys(updates).length === 0) return existing;

  const d = objToSnake(updates);
  const set = Object.keys(d).map((k) => `${k} = ?`).join(', ');
  const vals = [...Object.values(d), id];
  await pool.query(`UPDATE orders SET ${set} WHERE id = ?`, vals);
  return findById(id);
}

export async function remove(id) {
  await pool.query('DELETE FROM order_items WHERE order_id = ?', [id]);
  const [r] = await pool.query('DELETE FROM orders WHERE id = ?', [id]);
  return r.affectedRows > 0;
}

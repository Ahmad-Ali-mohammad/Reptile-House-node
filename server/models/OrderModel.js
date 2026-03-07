import pool from '../config/db.js';
import { rowToCamel, rowsToCamel, objToSnake } from '../utils/rowMapper.js';

let hasCustomerIdColumnCache = null;
let hasExtendedColumnsCache = null;

const ORDER_STATUS_MAP = {
  'قيد المعالجة': 'قيد المعالجة',
  'تم التأكيد': 'تم التأكيد',
  'تم الشحن': 'تم الشحن',
  'تم التوصيل': 'تم التوصيل',
  pending: 'قيد المعالجة',
  processing: 'قيد المعالجة',
  review: 'قيد المعالجة',
  confirmed: 'تم التأكيد',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  completed: 'تم التوصيل',
};

const PAYMENT_STATUS_MAP = {
  'قيد المراجعة': 'قيد المراجعة',
  'مقبول': 'مقبول',
  'مرفوض': 'مرفوض',
  review: 'قيد المراجعة',
  pending: 'قيد المراجعة',
  approved: 'مقبول',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

export function normalizeOrderStatus(value) {
  return ORDER_STATUS_MAP[String(value || '').trim()] || 'قيد المعالجة';
}

export function normalizePaymentStatus(value) {
  return PAYMENT_STATUS_MAP[String(value || '').trim()] || 'قيد المراجعة';
}

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

async function ensureExtendedColumns() {
  if (hasExtendedColumnsCache) return;
  const statements = [
    "ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(64) DEFAULT NULL",
    "ALTER TABLE orders ADD COLUMN shipping_address VARCHAR(512) DEFAULT NULL",
    "ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(128) DEFAULT NULL",
    "ALTER TABLE orders ADD COLUMN shipping_country VARCHAR(128) DEFAULT NULL",
    "ALTER TABLE orders ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT NULL",
  ];

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch {
      // Ignore if the column already exists or the alter cannot be applied now.
    }
  }

  hasExtendedColumnsCache = true;
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
  return orders.map((o) => ({
    ...o,
    status: normalizeOrderStatus(o.status),
    paymentVerificationStatus: normalizePaymentStatus(o.paymentVerificationStatus),
    items: byOrder[o.id] || [],
  }));
}

export async function findAll() {
  await ensureExtendedColumns();
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  const list = rowsToCamel(rows);
  return attachItems(list);
}

export async function findPendingReviewSummary(limit = 10) {
  await ensureExtendedColumns();
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Number.parseInt(String(limit), 10), 1), 20)
    : 10;
  const pendingReviewStatus = normalizePaymentStatus('review');

  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS total FROM orders WHERE payment_verification_status = ?',
    [pendingReviewStatus]
  );
  const [rows] = await pool.query(
    `SELECT
      id,
      date,
      total,
      paid_amount,
      customer_name,
      customer_email,
      customer_phone,
      payment_verification_status,
      created_at
    FROM orders
    WHERE payment_verification_status = ?
    ORDER BY created_at DESC
    LIMIT ?`,
    [pendingReviewStatus, safeLimit]
  );

  return {
    count: Number(countRows?.[0]?.total || 0),
    orders: rowsToCamel(rows).map((row) => ({
      id: row.id,
      date: row.date,
      total: Number(row.total || 0),
      paidAmount: row.paidAmount === null || row.paidAmount === undefined ? undefined : Number(row.paidAmount),
      customerName: row.customerName || undefined,
      customerEmail: row.customerEmail || undefined,
      customerPhone: row.customerPhone || undefined,
      paymentVerificationStatus: normalizePaymentStatus(row.paymentVerificationStatus),
      createdAt: row.createdAt,
    })),
  };
}

export async function findByCustomerId(customerId) {
  if (!customerId) return [];
  await ensureExtendedColumns();
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
  await ensureExtendedColumns();
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  const order = rows[0] ? rowToCamel(rows[0]) : null;
  if (!order) return null;
  const [withItems] = await attachItems([order]);
  return withItems || null;
}

export async function create(data) {
  await ensureExtendedColumns();
  const d = objToSnake(data);
  const canUseCustomerId = await hasCustomerIdColumn();
  const fallbackStatus = 'قيد المعالجة';
  const fallbackPaymentStatus = 'قيد المراجعة';
  const normalizedStatus = normalizeOrderStatus(d.status ?? fallbackStatus);
  const normalizedPaymentStatus = normalizePaymentStatus(d.payment_verification_status ?? fallbackPaymentStatus);

  if (canUseCustomerId) {
    await pool.query(
      `INSERT INTO orders (
        id, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_country,
        date, status, total, paid_amount, payment_confirmation_image, payment_method, payment_verification_status, rejection_reason
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.id,
        d.customer_id ?? null,
        d.customer_name ?? null,
        d.customer_email ?? null,
        d.customer_phone ?? null,
        d.shipping_address ?? null,
        d.shipping_city ?? null,
        d.shipping_country ?? null,
        d.date,
        normalizedStatus,
        d.total ?? 0,
        d.paid_amount ?? null,
        d.payment_confirmation_image ?? null,
        d.payment_method ?? null,
        normalizedPaymentStatus,
        d.rejection_reason ?? null,
      ]
    );
  } else {
    await pool.query(
      `INSERT INTO orders (
        id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_country,
        date, status, total, paid_amount, payment_confirmation_image, payment_method, payment_verification_status, rejection_reason
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.id,
        d.customer_name ?? null,
        d.customer_email ?? null,
        d.customer_phone ?? null,
        d.shipping_address ?? null,
        d.shipping_city ?? null,
        d.shipping_country ?? null,
        d.date,
        normalizedStatus,
        d.total ?? 0,
        d.paid_amount ?? null,
        d.payment_confirmation_image ?? null,
        d.payment_method ?? null,
        normalizedPaymentStatus,
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
  await ensureExtendedColumns();
  const existing = await findById(id);
  if (!existing) return null;

  const d = objToSnake(data);
  const fields = [
    'customer_name',
    'customer_email',
    'customer_phone',
    'shipping_address',
    'shipping_city',
    'shipping_country',
    'date',
    'status',
    'total',
    'paid_amount',
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
      if (f === 'status') vals.push(normalizeOrderStatus(d[f]));
      else if (f === 'payment_verification_status') vals.push(normalizePaymentStatus(d[f]));
      else vals.push(d[f]);
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
  await ensureExtendedColumns();
  const existing = await findById(id);
  if (!existing) return null;

  const updates = {};
  if (payload.status !== undefined) updates.status = normalizeOrderStatus(payload.status);
  if (payload.paymentVerificationStatus !== undefined) updates.paymentVerificationStatus = normalizePaymentStatus(payload.paymentVerificationStatus);
  if (payload.rejectionReason !== undefined) updates.rejectionReason = payload.rejectionReason;
  if (payload.paidAmount !== undefined) updates.paidAmount = payload.paidAmount;
  if (payload.paymentVerificationStatus !== undefined && normalizePaymentStatus(payload.paymentVerificationStatus) === 'مقبول' && payload.rejectionReason === undefined) {
    updates.rejectionReason = null;
  }
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

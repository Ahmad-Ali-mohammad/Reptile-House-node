/**
 * تنفيذ schema قاعدة البيانات من Node (لا حاجة لأمر mysql في الطرفية)
 * تشغيل: cd server && npm run db:schema
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyUtf8Session, MYSQL_CHARSET, MYSQL_COLLATION } from '../config/mysqlCharset.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// تحميل .env من مجلد server إن وُجد
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
    });
  }
} catch (_) {}

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  charset: MYSQL_CHARSET,
};

async function applyUtf8Migrations(conn) {
  const statements = [
    `ALTER TABLE products MODIFY status VARCHAR(32) CHARACTER SET ${MYSQL_CHARSET} COLLATE ${MYSQL_COLLATION} NOT NULL DEFAULT 'متوفر'`,
    `ALTER TABLE supplies MODIFY status VARCHAR(32) CHARACTER SET ${MYSQL_CHARSET} COLLATE ${MYSQL_COLLATION} NOT NULL DEFAULT 'متوفر'`,
    `ALTER TABLE orders MODIFY status VARCHAR(32) CHARACTER SET ${MYSQL_CHARSET} COLLATE ${MYSQL_COLLATION} NOT NULL DEFAULT 'قيد المعالجة'`,
    `ALTER TABLE orders MODIFY payment_verification_status VARCHAR(32) CHARACTER SET ${MYSQL_CHARSET} COLLATE ${MYSQL_COLLATION} NOT NULL DEFAULT 'قيد المراجعة'`,
    `UPDATE products
      SET status = 'متوفر'
      WHERE is_available = 1
        AND (status IS NULL OR TRIM(status) = '' OR status = 'Available' OR status REGEXP '^[?]+$')`,
    `UPDATE products
      SET status = 'غير متوفر'
      WHERE is_available = 0
        AND (status IS NULL OR TRIM(status) = '' OR status = 'Unavailable' OR status REGEXP '^[?]+$')`,
    `UPDATE supplies
      SET status = 'متوفر'
      WHERE is_available = 1
        AND (status IS NULL OR TRIM(status) = '' OR status = 'Available' OR status REGEXP '^[?]+$')`,
    `UPDATE supplies
      SET status = 'غير متوفر'
      WHERE is_available = 0
        AND (status IS NULL OR TRIM(status) = '' OR status = 'Unavailable' OR status REGEXP '^[?]+$')`,
    `UPDATE orders SET status = 'قيد المعالجة' WHERE status IN ('pending', 'processing', 'review') OR status REGEXP '^[?]+$'`,
    `UPDATE orders SET status = 'تم التأكيد' WHERE status = 'confirmed'`,
    `UPDATE orders SET status = 'تم الشحن' WHERE status = 'shipped'`,
    `UPDATE orders SET status = 'تم التوصيل' WHERE status IN ('delivered', 'completed')`,
    `UPDATE orders SET payment_verification_status = 'قيد المراجعة' WHERE payment_verification_status IN ('review', 'pending') OR payment_verification_status REGEXP '^[?]+$'`,
    `UPDATE orders SET payment_verification_status = 'مقبول' WHERE payment_verification_status IN ('accepted', 'approved')`,
    `UPDATE orders SET payment_verification_status = 'مرفوض' WHERE payment_verification_status = 'rejected'`,
  ];

  for (const statement of statements) {
    await conn.query(statement);
  }
}

async function run() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection(config);
  await applyUtf8Session(conn);
  console.log('Running schema...');
  await conn.query(sql);
  await applyUtf8Migrations(conn);
  // Backward-compatible migration for customer-linked orders.
  try {
    await conn.query('ALTER TABLE orders ADD COLUMN customer_id VARCHAR(64) DEFAULT NULL');
  } catch {}
  try {
    await conn.query('CREATE INDEX idx_orders_customer_id ON orders(customer_id)');
  } catch {}
  for (const statement of [
    'ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255) DEFAULT NULL',
    'ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255) DEFAULT NULL',
    'ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(64) DEFAULT NULL',
    'ALTER TABLE orders ADD COLUMN shipping_address VARCHAR(512) DEFAULT NULL',
    'ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(128) DEFAULT NULL',
    'ALTER TABLE orders ADD COLUMN shipping_country VARCHAR(128) DEFAULT NULL',
    'ALTER TABLE orders ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT NULL',
  ]) {
    try {
      await conn.query(statement);
    } catch {}
  }
  await conn.end();
  console.log('Database semo_reptile_house created and schema applied.');
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

import pool from '../config/db.js';
import { rowToCamel, rowsToCamel, objToSnake } from '../utils/rowMapper.js';

const DEFAULT_AVAILABLE_STATUS = 'متوفر';

function normalizeStatus(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : DEFAULT_AVAILABLE_STATUS;
}

function statusMeansAvailable(value) {
  const normalized = normalizeStatus(value).toLowerCase();
  return !['غير متوفر', 'نفذ من المخزون', 'نفذت من المخزون', 'out of stock', 'unavailable', 'sold out'].includes(normalized);
}

export async function findAll() {
  const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
  return rowsToCamel(rows);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [Number(id)]);
  return rows[0] ? rowToCamel(rows[0]) : null;
}

export async function create(data) {
  const d = objToSnake(data);
  const normalizedStatus = normalizeStatus(d.status);
  const normalizedIsAvailable = d.is_available !== undefined ? Boolean(d.is_available) : statusMeansAvailable(normalizedStatus);
  const [r] = await pool.query(
    `INSERT INTO products (name, species, description, price, image_url, rating, is_available, status, category, specifications, reviews, care_instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.name,
      d.species,
      d.description ?? null,
      d.price ?? 0,
      d.image_url ?? '',
      d.rating ?? 5,
      normalizedIsAvailable ? 1 : 0,
      normalizedStatus,
      d.category,
      d.specifications ? JSON.stringify(d.specifications) : null,
      d.reviews ? JSON.stringify(d.reviews) : null,
      d.care_instructions ?? null,
    ]
  );
  return findById(r.insertId);
}

export async function update(id, data) {
  const existing = await findById(id);
  if (!existing) return null;
  const d = objToSnake({ ...existing, ...data, id: undefined });
  d.status = normalizeStatus(d.status);
  d.is_available = d.is_available !== undefined ? Boolean(d.is_available) : statusMeansAvailable(d.status);
  const fields = ['name', 'species', 'description', 'price', 'image_url', 'rating', 'is_available', 'status', 'category', 'specifications', 'reviews', 'care_instructions'];
  const set = [];
  const vals = [];
  for (const f of fields) {
    if (d[f] === undefined) continue;
    set.push(`${f} = ?`);
    if (f === 'is_available') vals.push(d[f] ? 1 : 0);
    else if (f === 'specifications' || f === 'reviews') vals.push(d[f] != null ? JSON.stringify(d[f]) : null);
    else vals.push(d[f]);
  }
  if (set.length === 0) return existing;
  vals.push(Number(id));
  await pool.query(`UPDATE products SET ${set.join(', ')} WHERE id = ?`, vals);
  return findById(id);
}

export async function remove(id) {
  const [r] = await pool.query('DELETE FROM products WHERE id = ?', [Number(id)]);
  return r.affectedRows > 0;
}

import pool from '../config/db.js';
import { rowToCamel, rowsToCamel, objToSnake } from '../utils/rowMapper.js';
import { deleteManagedUpload } from '../utils/mediaStorage.js';

export async function findAll(folderId = null, category = null) {
  let query = 'SELECT * FROM media_items';
  const params = [];
  const conditions = [];

  if (folderId) {
    conditions.push('folder_id = ?');
    params.push(folderId);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY created_at DESC';

  const [rows] = await pool.query(query, params);
  return rowsToCamel(rows);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM media_items WHERE id = ?', [id]);
  return rows[0] ? rowToCamel(rows[0]) : null;
}

export async function search(searchTerm) {
  const term = `%${searchTerm}%`;
  const [rows] = await pool.query(
    `SELECT * FROM media_items
     WHERE name LIKE ? OR alt_text LIKE ? OR description LIKE ?
     ORDER BY created_at DESC`,
    [term, term, term]
  );
  return rowsToCamel(rows);
}

export async function create(data) {
  const d = objToSnake(data);
  const id = d.id || `img-${Date.now()}`;

  await pool.query(
    `INSERT INTO media_items
     (id, url, name, size, file_type, mime_type, alt_text, description, category, folder_id, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      d.url,
      d.name,
      d.size,
      d.file_type || 'image',
      d.mime_type || null,
      d.alt_text || null,
      d.description || null,
      d.category || null,
      d.folder_id || null,
      d.date || new Date().toLocaleDateString('ar-SY')
    ]
  );
  return findById(id);
}

export async function update(id, data) {
  const d = objToSnake(data);
  await pool.query(
    `UPDATE media_items
     SET name = ?, alt_text = ?, description = ?, category = ?, folder_id = ?
     WHERE id = ?`,
    [d.name, d.alt_text, d.description, d.category, d.folder_id, id]
  );
  return findById(id);
}

export async function remove(id) {
  const existing = await findById(id);
  const [r] = await pool.query('DELETE FROM media_items WHERE id = ?', [id]);
  if (r.affectedRows > 0 && existing?.url) {
    await deleteManagedUpload(existing.url).catch((error) => {
      console.error('Failed to remove media file:', error);
    });
  }
  return r.affectedRows > 0;
}

export async function bulkDelete(ids) {
  const [rows] = await pool.query('SELECT url FROM media_items WHERE id IN (?)', [ids]);
  const [r] = await pool.query(
    'DELETE FROM media_items WHERE id IN (?)',
    [ids]
  );
  await Promise.allSettled(
    (rows || []).map((row) =>
      deleteManagedUpload(row.url).catch((error) => {
        console.error('Failed to remove media file:', error);
      })
    )
  );
  return r.affectedRows;
}

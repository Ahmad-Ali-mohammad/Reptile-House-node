import pool from '../config/db.js';
import { rowToCamel, objToSnake } from '../utils/rowMapper.js';

const BLOCKED_COLUMNS = new Set(['id', 'created_at', 'updated_at']);

const SINGLE_ROW_ALLOWLISTS = {
  company_info: new Set([
    'name',
    'name_english',
    'description',
    'founded_year',
    'mission',
    'vision',
    'story',
    'logo_url',
    'mascot_url',
  ]),
  contact_info: new Set([
    'phone',
    'email',
    'address',
    'city',
    'country',
    'working_hours',
    'social_media',
  ]),
  shamcash_config: new Set([
    'barcode_image_url',
    'account_code',
    'is_active',
    'account_holder_name',
    'phone_number',
    'payment_instructions',
  ]),
  seo_settings: new Set([
    'site_name',
    'default_title',
    'title_separator',
    'default_description',
    'default_keywords',
    'canonical_base_url',
    'default_og_image',
    'twitter_handle',
    'robots_index',
    'robots_follow',
    'google_verification',
    'bing_verification',
    'yandex_verification',
    'locale',
    'theme_color',
    'organization_name',
    'organization_logo',
    'organization_description',
    'sitemap_enabled',
    'excluded_paths',
    'custom_robots_txt',
  ]),
};

async function getSingle(table, id = 1) {
  const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return rows[0] ? rowToCamel(rows[0]) : null;
}

function sanitizeSingleRowPayload(table, data) {
  const allowlist = SINGLE_ROW_ALLOWLISTS[table];
  const snakeData = objToSnake(data);
  const sanitized = {};

  for (const [key, value] of Object.entries(snakeData)) {
    if (value === undefined) continue;
    if (BLOCKED_COLUMNS.has(key)) continue;
    if (allowlist && !allowlist.has(key)) continue;
    sanitized[key] = value;
  }

  return sanitized;
}

async function setSingle(table, id, data) {
  const sanitized = sanitizeSingleRowPayload(table, data);
  const cols = Object.keys(sanitized);
  if (cols.length === 0) return getSingle(table, id);
  const set = cols.map(c => `${c} = ?`).join(', ');
  const vals = cols.map(c => {
    const v = sanitized[c];
    if (typeof v === 'object' && v !== null && !(v instanceof Date)) return JSON.stringify(v);
    return v;
  });
  vals.push(id);
  await pool.query(`UPDATE ${table} SET ${set} WHERE id = ?`, vals);
  return getSingle(table, id);
}

export const companyInfo = {
  get: () => getSingle('company_info'),
  set: (data) => setSingle('company_info', 1, data),
};

export const contactInfo = {
  get: () => getSingle('contact_info'),
  set: (data) => setSingle('contact_info', 1, data),
};

export const shamcashConfig = {
  get: () => getSingle('shamcash_config'),
  set: (data) => setSingle('shamcash_config', 1, data),
};

export const seoSettings = {
  get: () => getSingle('seo_settings'),
  set: (data) => setSingle('seo_settings', 1, data),
};

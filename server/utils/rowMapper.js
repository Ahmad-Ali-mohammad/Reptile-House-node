export function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function toSnake(str) {
  return str.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

const BOOLEAN_KEYS = new Set([
  'is_available',
  'is_active',
  'is_default',
  'active',
  'robots_index',
  'robots_follow',
  'sitemap_enabled',
  'enable_notifications',
  'enable_email_notifications',
  'enable_sms_notifications',
  'maintenance_mode',
  'allow_guest_checkout',
  'require_email_verification',
  'dark_mode',
]);

const NUMERIC_KEYS = new Set([
  'price',
  'rating',
  'total',
  'paid_amount',
  'discount_percentage',
  'founded_year',
  'tax_rate',
  'shipping_fee',
  'free_shipping_threshold',
  'sort_order',
  'quantity',
]);

export function rowToCamel(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = toCamel(k);
    if (BOOLEAN_KEYS.has(k)) {
      out[key] = !!v;
      continue;
    }

    if (NUMERIC_KEYS.has(k) && v !== null && v !== '') {
      const nextValue = Number(v);
      out[key] = Number.isNaN(nextValue) ? v : nextValue;
      continue;
    }

    out[key] = v;
  }
  return out;
}

export function rowsToCamel(rows) {
  return Array.isArray(rows) ? rows.map(rowToCamel) : [];
}

export function objToSnake(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[toSnake(k)] = v;
  }
  return out;
}

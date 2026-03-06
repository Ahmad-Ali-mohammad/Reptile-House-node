const API_BASE = (
  process.env.API_BASE ||
  (process.env.BACKEND_URL ? `${String(process.env.BACKEND_URL).replace(/\/+$/, '')}/api` : '') ||
  'http://127.0.0.1:3001/api'
).replace(/\/+$/, '');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function request(path, { method = 'GET', body, token, expected = [200] } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!expected.includes(response.status)) {
    const message = typeof data === 'object' && data?.error ? data.error : text || `HTTP ${response.status}`;
    throw new Error(`${method} ${path} failed: ${response.status} - ${message}`);
  }

  return { status: response.status, data };
}

async function login() {
  requireEnv('ADMIN_EMAIL', ADMIN_EMAIL);
  requireEnv('ADMIN_PASSWORD', ADMIN_PASSWORD);
  const result = await request('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    expected: [200],
  });

  const token = result.data?.token;
  assert(token, 'Login succeeded without a token');
  return token;
}

async function verifyCompanyAllowlist(token) {
  const injectedTimestamp = '2099-03-06T10:11:12.000Z';
  const original = await request('/settings/company', { token });
  const current = original.data;

  const update = await request('/settings/company', {
    method: 'PUT',
    token,
    expected: [200],
    body: {
      ...current,
      id: 999,
      updatedAt: injectedTimestamp,
      createdAt: injectedTimestamp,
      ignoredField: 'should-not-stick',
    },
  });

  assert(update.data?.id === current.id, 'Company id changed unexpectedly');
  assert(update.data?.name === current.name, 'Company name changed unexpectedly');
  assert(update.data?.updatedAt !== injectedTimestamp, 'Company updatedAt was written from transport payload');
  assert(update.data?.ignoredField === undefined, 'Unknown company field leaked into response');
}

async function verifyContactAllowlist(token) {
  const injectedTimestamp = '2099-03-06T11:12:13.000Z';
  const original = await request('/settings/contact', { token });
  const current = original.data;

  const update = await request('/settings/contact', {
    method: 'PUT',
    token,
    expected: [200],
    body: {
      ...current,
      id: 999,
      updatedAt: injectedTimestamp,
      createdAt: injectedTimestamp,
      ignoredField: 'should-not-stick',
    },
  });

  assert(update.data?.phone === current.phone, 'Contact phone changed unexpectedly');
  assert(update.data?.email === current.email, 'Contact email changed unexpectedly');
  assert(update.data?.updatedAt !== injectedTimestamp, 'Contact updatedAt was written from transport payload');
  assert(update.data?.ignoredField === undefined, 'Unknown contact field leaked into response');
}

async function main() {
  const token = await login();
  await verifyCompanyAllowlist(token);
  await verifyContactAllowlist(token);
  console.log('Settings allowlist smoke passed.');
}

main().catch((error) => {
  console.error('Settings allowlist smoke failed:', error.message);
  process.exitCode = 1;
});

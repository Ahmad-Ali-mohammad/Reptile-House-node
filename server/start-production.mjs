import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isEnabled(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function waitForDatabase() {
  const maxAttempts = toPositiveInt(process.env.STARTUP_DB_MAX_ATTEMPTS, 30);
  const retryMs = toPositiveInt(process.env.STARTUP_DB_RETRY_MS, 2000);
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: toPositiveInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  };

  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const conn = await mysql.createConnection(config);
      await conn.query('SELECT 1');
      await conn.end();
      console.log(`[startup] Database is ready after attempt ${attempt}/${maxAttempts}`);
      return;
    } catch (error) {
      lastError = error;
      console.log(`[startup] Waiting for database (${attempt}/${maxAttempts}): ${error.message}`);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, retryMs));
      }
    }
  }

  throw new Error(`Database did not become ready: ${lastError?.message || 'unknown error'}`);
}

async function runNodeScript(relativeScriptPath) {
  const fullPath = path.join(__dirname, relativeScriptPath);
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fullPath], {
      cwd: __dirname,
      env: process.env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${relativeScriptPath} exited with code ${code}`));
    });
  });
}

async function bootstrap() {
  await waitForDatabase();

  if (isEnabled(process.env.AUTO_APPLY_SCHEMA, true)) {
    console.log('[startup] Applying database schema');
    await runNodeScript('database/runSchema.js');
  }

  if (isEnabled(process.env.AUTO_SEED, true)) {
    console.log('[startup] Applying seed/default rows');
    await runNodeScript('database/seed.js');
  }

  console.log('[startup] Starting application server');
  await import('./index.js');
}

bootstrap().catch((error) => {
  console.error('[startup] Fatal error:', error);
  process.exit(1);
});

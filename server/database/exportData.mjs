import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2';
import mysqlPromise from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { applyUtf8Session, MYSQL_COLLATION } from '../config/mysqlCharset.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .forEach((line) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match && !process.env[match[1].trim()]) {
          process.env[match[1].trim()] = match[2].trim();
        }
      });
  }
} catch {}

const dbName = process.env.DB_NAME || 'semo_reptile_house';
const outputPath = path.join(__dirname, 'current-data.sql');
function escapeIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, '``')}\``;
}

function formatValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
  if (value instanceof Date) return mysql.escape(value.toISOString().slice(0, 19).replace('T', ' '));
  if (typeof value === 'object') return mysql.escape(JSON.stringify(value));
  return mysql.escape(value);
}

async function run() {
  const conn = await mysqlPromise.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    charset: MYSQL_COLLATION,
  });
  await applyUtf8Session(conn);

  const [tables] = await conn.query(
    `SELECT table_name AS tableName
     FROM information_schema.tables
     WHERE table_schema = ?
     ORDER BY table_name`,
    [dbName]
  );

  const chunks = [
    '-- Generated from current local database state',
    'SET NAMES utf8mb4;',
    `USE ${escapeIdentifier(dbName)};`,
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
  ];

  for (const { tableName } of tables) {
    const [rows] = await conn.query(`SELECT * FROM ${escapeIdentifier(tableName)}`);
    if (!rows.length) continue;

    const columns = Object.keys(rows[0]);
    const columnList = columns.map(escapeIdentifier).join(', ');
    const updateList = columns
      .map((column) => `${escapeIdentifier(column)} = VALUES(${escapeIdentifier(column)})`)
      .join(', ');
    const valuesList = rows
      .map((row) => `(${columns.map((column) => formatValue(row[column])).join(', ')})`)
      .join(',\n');

    chunks.push(`INSERT INTO ${escapeIdentifier(tableName)} (${columnList}) VALUES`);
    chunks.push(`${valuesList}`);
    chunks.push(`ON DUPLICATE KEY UPDATE ${updateList};`);
    chunks.push('');
  }

  chunks.push('SET FOREIGN_KEY_CHECKS = 1;');
  chunks.push('');

  fs.writeFileSync(outputPath, chunks.join('\n'), 'utf8');
  await conn.end();

  console.log(`Database export written to ${outputPath}`);
}

run().catch((error) => {
  console.error('Failed to export current data:', error);
  process.exit(1);
});

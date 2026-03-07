/**
 * Script to apply schema.sql to database
 * Run: node server/apply-schema.js
 */
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyUtf8Session, MYSQL_COLLATION } from './config/mysqlCharset.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function applySchema() {
  let conn;

  try {
    // Read environment variables
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'semo_reptile_house',
      multipleStatements: true, // Important for executing multiple SQL statements
      charset: MYSQL_COLLATION
    };

    console.log('Connecting to database...');
    conn = await mysql.createConnection(dbConfig);
    await applyUtf8Session(conn);
    console.log('✓ Connected to database');

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    console.log(`Reading schema from: ${schemaPath}`);
    const schema = await fs.readFile(schemaPath, 'utf8');

    console.log('Applying schema...');
    await conn.query(schema);
    console.log('✓ Schema applied successfully');

    // Show tables
    const [tables] = await conn.query('SHOW TABLES');
    console.log(`\n✓ Database has ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

  } catch (error) {
    console.error('Error applying schema:', error.message);
    process.exit(1);
  } finally {
    if (conn) {
      await conn.end();
      console.log('\n✓ Connection closed');
    }
  }
}

applySchema();

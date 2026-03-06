import mysql from 'mysql2';
import { MYSQL_CHARSET, MYSQL_SESSION_SQL } from './mysqlCharset.js';

const rawPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'semo_reptile_house',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: MYSQL_CHARSET,
});

rawPool.on('connection', (connection) => {
  connection.query(MYSQL_SESSION_SQL, (error) => {
    if (error) {
      console.error('[db] Failed to apply UTF-8 session settings:', error.message);
    }
  });
});

const pool = rawPool.promise();

export function isDbConfigured() {
  return !!(process.env.DB_HOST || process.env.DB_USER || process.env.DB_NAME);
}

export default pool;

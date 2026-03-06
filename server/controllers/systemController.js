import pool, { isDbConfigured } from '../config/db.js';

const DEFAULT_DB_HOST = 'localhost';
const DEFAULT_DB_PORT = 3306;
const DEFAULT_DB_NAME = 'semo_reptile_house';
const DEFAULT_DB_USER = 'root';

const toPort = (value) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_DB_PORT;
};

export async function getDatabaseStatus(req, res) {
  const includeDetails = String(req.query.includeDetails || '').toLowerCase() === 'true';
  const startedAt = Date.now();
  const host = process.env.DB_HOST || DEFAULT_DB_HOST;
  const port = toPort(process.env.DB_PORT);
  const database = process.env.DB_NAME || DEFAULT_DB_NAME;
  const user = process.env.DB_USER || DEFAULT_DB_USER;

  const baseStatus = {
    connected: false,
    checkedAt: new Date().toISOString(),
    latencyMs: null,
    dbType: 'mysql',
    connectionMethod: 'mysql2/promise pool',
    configured: isDbConfigured(),
    host,
    port,
    database,
    user,
    passwordConfigured: Boolean(process.env.DB_PASSWORD),
    sslEnabled: Boolean(process.env.DB_SSL || process.env.DB_SSL_CA),
    pool: {
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    },
    runtime: {
      nodeVersion: process.version,
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
    },
    error: null,
  };

  try {
    const [serverRows] = await pool.query(`
      SELECT
        VERSION() AS version,
        @@version_comment AS versionComment,
        DATABASE() AS currentDatabase,
        @@hostname AS serverHost,
        @@port AS serverPort,
        @@character_set_server AS characterSet,
        @@collation_server AS collation,
        CURRENT_USER() AS currentUser
    `);
    let tables = [];
    let tableSummary;

    if (includeDetails) {
      const [tableRows] = await pool.query(
        `
          SELECT
            TABLE_NAME AS tableName,
            ENGINE AS engine,
            TABLE_ROWS AS approxRows,
            ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS sizeMb,
            TABLE_COLLATION AS collation,
            CREATE_TIME AS createdAt,
            UPDATE_TIME AS updatedAt
          FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = DATABASE()
          ORDER BY TABLE_NAME
        `
      );

      tables = Array.isArray(tableRows) ? tableRows : [];
      const summary = tables.reduce(
        (acc, table) => {
          acc.totalApproxRows += Number(table.approxRows || 0);
          acc.totalSizeMb += Number(table.sizeMb || 0);
          return acc;
        },
        { count: tables.length, totalApproxRows: 0, totalSizeMb: 0 }
      );

      tableSummary = {
        ...summary,
        totalSizeMb: Number(summary.totalSizeMb.toFixed(2)),
      };
    }

    const latencyMs = Date.now() - startedAt;
    const server = Array.isArray(serverRows) && serverRows.length ? serverRows[0] : {};
    const payload = {
      ...baseStatus,
      connected: true,
      latencyMs,
      server,
    };

    if (includeDetails) {
      payload.tables = tables;
      payload.tableSummary = tableSummary;
    }

    return res.json(payload);
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    return res.json({
      ...baseStatus,
      connected: false,
      latencyMs,
      error: {
        message: error?.message || 'Unknown database error',
        code: error?.code || null,
        errno: error?.errno || null,
        sqlState: error?.sqlState || null,
        syscall: error?.syscall || null,
      },
    });
  }
}

import pool, { isDbConfigured } from '../config/db.js';
import * as OrderModel from '../models/OrderModel.js';

const DEFAULT_DB_HOST = 'localhost';
const DEFAULT_DB_PORT = 3306;
const DEFAULT_DB_NAME = 'semo_reptile_house';
const DEFAULT_DB_USER = 'root';
const BASIC_DB_STATUS_CACHE_TTL_MS = 10 * 1000;
const ADMIN_OVERVIEW_CACHE_TTL_MS = 10 * 1000;

const basicDbStatusCache = {
  expiresAt: 0,
  value: null,
  inFlight: null,
};

const adminOverviewCache = {
  expiresAt: 0,
  value: null,
  inFlight: null,
};

const toPort = (value) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_DB_PORT;
};

async function buildDatabaseStatus(includeDetails = false) {
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
      charset: 'utf8mb4_unicode_ci',
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

    return payload;
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    return {
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
    };
  }
}

async function getCachedBasicDatabaseStatus() {
  const now = Date.now();
  if (basicDbStatusCache.value && basicDbStatusCache.expiresAt > now) {
    return basicDbStatusCache.value;
  }
  if (basicDbStatusCache.inFlight) {
    return basicDbStatusCache.inFlight;
  }

  basicDbStatusCache.inFlight = buildDatabaseStatus(false)
    .then((payload) => {
      basicDbStatusCache.value = payload;
      basicDbStatusCache.expiresAt = Date.now() + BASIC_DB_STATUS_CACHE_TTL_MS;
      return payload;
    })
    .finally(() => {
      basicDbStatusCache.inFlight = null;
    });

  return basicDbStatusCache.inFlight;
}

async function buildAdminOverview() {
  const databaseStatusPromise = getCachedBasicDatabaseStatus();
  const pendingReviewPromise = OrderModel.findPendingReviewSummary(10).catch((error) => {
    console.error('Failed to load pending review summary:', error);
    return { count: 0, orders: [] };
  });

  const [databaseStatus, pendingReview] = await Promise.all([databaseStatusPromise, pendingReviewPromise]);

  return {
    checkedAt: new Date().toISOString(),
    databaseStatus,
    pendingReviewCount: pendingReview.count,
    pendingOrders: pendingReview.orders,
  };
}

async function getCachedAdminOverview() {
  const now = Date.now();
  if (adminOverviewCache.value && adminOverviewCache.expiresAt > now) {
    return adminOverviewCache.value;
  }
  if (adminOverviewCache.inFlight) {
    return adminOverviewCache.inFlight;
  }

  adminOverviewCache.inFlight = buildAdminOverview()
    .then((payload) => {
      adminOverviewCache.value = payload;
      adminOverviewCache.expiresAt = Date.now() + ADMIN_OVERVIEW_CACHE_TTL_MS;
      return payload;
    })
    .finally(() => {
      adminOverviewCache.inFlight = null;
    });

  return adminOverviewCache.inFlight;
}

export async function getDatabaseStatus(req, res) {
  const includeDetails = String(req.query.includeDetails || '').toLowerCase() === 'true';
  const payload = includeDetails
    ? await buildDatabaseStatus(true)
    : await getCachedBasicDatabaseStatus();
  return res.json(payload);
}

export async function getAdminOverview(req, res) {
  const payload = await getCachedAdminOverview();
  return res.json(payload);
}

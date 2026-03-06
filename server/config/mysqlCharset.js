export const MYSQL_CHARSET = 'utf8mb4';
export const MYSQL_COLLATION = 'utf8mb4_unicode_ci';
export const MYSQL_SESSION_SQL = `SET NAMES ${MYSQL_CHARSET} COLLATE ${MYSQL_COLLATION}`;

export async function applyUtf8Session(connection) {
  await connection.query(MYSQL_SESSION_SQL);
}

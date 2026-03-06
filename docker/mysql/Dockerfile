FROM mysql:8.4

COPY docker/mysql/00-server.cnf /etc/mysql/conf.d/00-server.cnf
COPY server/database/schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY server/database/current-data.sql /docker-entrypoint-initdb.d/02-current-data.sql

# Production Release v2026.03.06-production

## Scope

- Production Docker stack for the full project
- Dedicated MySQL image with packaged schema and current baseline data
- Caddy reverse proxy with automatic HTTPS for the production domain
- Frontend and API served behind the same public entrypoint

## Services

- `caddy`: TLS termination, HTTP to HTTPS, reverse proxy to the Node app
- `app`: React frontend build + Express API + media storage
- `db`: MySQL 8.4 image initialized with `schema.sql` and `current-data.sql`

## Production Defaults

- Public domain comes from `DOMAIN`
- TLS email comes from `ACME_EMAIL`
- The packaged database name is `semo_reptile_house`
- Application schema migration stays enabled on startup
- Application seed is disabled by default to avoid overwriting packaged data

## Included Database State

- Core singleton settings rows
- Primary admin account
- User preference rows
- No demo products or smoke-test content rows

## Admin Login

- Email: `owner@reptilehouse.sy`
- Password: `Owner@2026!`

## Deployment

```bash
copy .env.docker.example .env
docker compose up -d --build
```

## Tag

- `v2026.03.06-production`

# VPS Deploy

## One-Time Setup

1. Copy `deploy/vps-deploy.example.json` to `.vps-deploy.json`.
2. Fill in the VPS connection values.
3. If the public site is served from a static `public_html` outside Docker, set `staticFrontendDir` as well.
3. Keep `.vps-deploy.json` local only. It is ignored by git.

## Commands

App-only deploy with pre-deploy DB backup:

```bash
npm run deploy:vps
```

Dry run without touching the server:

```bash
npm run deploy:vps:dry
```

Destructive reseed deploy:

```bash
npm run deploy:vps:reseed
```

## What The Script Does

- Verifies local git state
- Optionally pushes the current branch to configured remotes
- Packs tracked repo files and streams them to the VPS
- Creates a MySQL dump before deployment
- Rebuilds the Docker app service
- Optionally builds local `dist/` and syncs it to a static frontend directory such as `public_html`
- Waits for container health checks
- Verifies `/health`
- Optionally verifies admin endpoints if admin credentials are configured

## Notes

- `deploy:vps` rebuilds `app` only and keeps the existing MySQL volume.
- `deploy:vps:reseed` resets Docker volumes and is only for full reprovisioning.
- The script reads config from `.vps-deploy.json` by default, or from `VPS_*` environment variables.
- For this VPS, the live domain serves frontend assets from a static directory, so future deploys should set `staticFrontendDir` to `/home/user/web/reptile-house.com/public_html`.

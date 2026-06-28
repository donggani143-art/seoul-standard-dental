# Cafe24 Deploy

This project must run as a Node.js server. Static export is not supported because it uses:

- App Router API routes in `src/app/api`
- `cookies()` and `headers()`
- `src/proxy.js`
- SQLite via `wonjudental.db`

## Local build

```powershell
npm.cmd run build
Copy-Item public .next\standalone\public -Recurse -Force
New-Item .next\standalone\.next -ItemType Directory -Force | Out-Null
Copy-Item .next\static .next\standalone\.next\static -Recurse -Force
Copy-Item wonjudental.db .next\standalone\wonjudental.db -Force
```

Upload the contents of `.next/standalone` to the server.

## Required env

Create a `.env.production` file next to `server.js`.

```dotenv
HOSTNAME=0.0.0.0
PORT=3000
SITE_URL=https://metalink3.mycafe24.com
NEXT_PUBLIC_SITE_URL=https://metalink3.mycafe24.com
ADMIN_PASSWORD=change-this-admin-password
```

## Server start

Run the app from the uploaded directory:

```bash
node server.js
```

For a persistent process, use `pm2` or `systemd` if the hosting plan allows it.

## Reverse proxy

Point nginx or Apache to the Node app on port `3000`.

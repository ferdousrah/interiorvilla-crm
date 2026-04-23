# Deploying to VPS via Coolify (no Docker)

## 1. Push code to Git

Make sure `nixpacks.toml` and `.env.example` are committed (they are).
Never commit `.env`.

```bash
git add .
git commit -m "chore: nixpacks + deployment config"
git push
```

## 2. Coolify dashboard

### A. Create the MySQL database
- **+ New Resource → Database → MySQL 8**
- Name: `interior-villa-mysql`
- Note the connection details (host = service name, port = 3306, username, password)

### B. Create the application
- **+ New Resource → Application → Public Git Repo** (or GitHub App if private)
- Paste repo URL + branch
- **Build Pack: Nixpacks** (default — leave it)
- **Ports Exposes:** `8000`

### C. Environment Variables
Paste everything from `.env.example` into the Env Vars tab. Fill in:

| Variable | Value |
|---|---|
| `APP_KEY` | run `php artisan key:generate --show` locally, paste the `base64:…` |
| `APP_URL` | `https://erp.yourdomain.com` |
| `DB_HOST` | MySQL service name from step A (e.g. `interior-villa-mysql`) |
| `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | from MySQL resource |
| `MAIL_PASSWORD` | SMTP password / API key |
| `GOOGLE_MAPS_API_KEY` | from Google Cloud Console (optional) |

### D. Persistent Storage
- **Persistent Storage → + Add → Volume Mount**
- Name: `interiorvilla-storage`
- Source Path: *(leave empty)*
- Destination Path: `/app/storage`

### E. Domain
- **Configuration → Domains → Generate / Add Domain**
- Point DNS A-record to VPS IP
- Coolify auto-provisions Let's Encrypt SSL on first deploy

### F. Deploy
- Click **Deploy** (top right) and watch the logs.
- First build takes ~4-6 min (downloading PHP + Node + npm + composer).
- Subsequent deploys ~1-2 min.

## 3. First-time setup (after first successful deploy)

Open **Configuration → Terminal** in Coolify (or SSH into the app container):

```bash
# Seed sample roles + users (optional but recommended once)
php artisan db:seed --class=RoleSeeder --force
php artisan db:seed --class=SampleUsersSeeder --force

# Seed default categories, units, accounts, etc. (optional)
php artisan db:seed --class=AccountSeeder --force
php artisan db:seed --class=ExpenseCategoriesSeeder --force
php artisan db:seed --class=InventoryCategoriesSeeder --force
php artisan db:seed --class=LeaveTypeSeeder --force
```

Default admin login:
- Email: `admin@interiorvilla.com`
- Password: `Admin@123`

**Change this password immediately after logging in.**

## 4. Troubleshooting

**Build fails on `npm run build`** → increase memory (Coolify → Resource Limits → bump to 1 GB). Vite needs ≥512 MB.

**500 error after deploy** → check `APP_KEY` is set, DB credentials correct, and logs in Coolify's Logs tab.

**Uploaded logos/PDFs disappear after redeploy** → verify the `/app/storage` volume mount is attached.

**Migrations didn't run** → `nixpacks.toml` runs `php artisan migrate --force` on every container boot. Check logs for migration output. Run manually via Terminal if needed.

**Slow under load** → `php artisan serve` is single-threaded. For >50 concurrent users, switch to PHP-FPM + Nginx (separate config needed).

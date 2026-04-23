# Deploy IVMS to cPanel (crm.technocratsbd.com)

## Folder Structure on Server

```
/home/username/
├── interiorvilla/          ← Laravel app (NOT in public_html)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env
│   └── ...
│
└── crm.technocratsbd.com/  ← Subdomain document root (symlinked to public/)
    └── (contents of public/ folder)
```

## Step-by-Step

### 1. Create MySQL Database in cPanel
- Go to **MySQL Databases** in cPanel
- Create database: `username_ivms`
- Create user: `username_ivms_user`  
- Add user to database with **ALL PRIVILEGES**
- Note: database, username, password

### 2. Upload Project Files
**Option A: Via Git (recommended)**
```bash
cd /home/username
git clone https://github.com/ferdousrah/interiorvilla-crm.git interiorvilla
```

**Option B: Via ZIP upload**
- Zip the entire project (excluding node_modules, vendor, .env)
- Upload via cPanel File Manager to `/home/username/`
- Extract as `interiorvilla/`

### 3. SSH into Server (Terminal in cPanel)
Go to **cPanel → Terminal** or SSH via PuTTY:

```bash
cd /home/username/interiorvilla

# Install PHP dependencies
composer install --no-dev --optimize-autoloader --no-interaction

# Copy environment file
cp .env.production .env

# Edit .env with your database credentials
nano .env
# Set: DB_DATABASE, DB_USERNAME, DB_PASSWORD

# Generate app key (if needed)
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed roles & permissions (first time only)
php artisan db:seed

# Create storage link
php artisan storage:link

# Cache config for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chmod -R 775 storage bootstrap/cache
```

### 4. Point Subdomain to Laravel's public/ folder

**Method A: Change Document Root (Recommended)**
- Go to **cPanel → Subdomains**
- Find `crm.technocratsbd.com`
- Change **Document Root** to: `/home/username/interiorvilla/public`
- Save

**Method B: Symlink (if you can't change document root)**
```bash
# Remove default subdomain folder
rm -rf /home/username/crm.technocratsbd.com

# Create symlink to Laravel's public folder
ln -s /home/username/interiorvilla/public /home/username/crm.technocratsbd.com
```

### 5. SSL Certificate
- Go to **cPanel → SSL/TLS** or **Let's Encrypt**
- Issue certificate for `crm.technocratsbd.com`
- Or use **AutoSSL** if available

### 6. Set Cron Job for Scheduler
- Go to **cPanel → Cron Jobs**
- Add: run every minute
```
* * * * * cd /home/username/interiorvilla && php artisan schedule:run >> /dev/null 2>&1
```

### 7. PHP Version
- Go to **cPanel → MultiPHP Manager** or **Select PHP Version**
- Set `crm.technocratsbd.com` to **PHP 8.3**
- Enable extensions: `bcmath`, `gd`, `intl`, `mbstring`, `pdo_mysql`, `xml`, `zip`, `opcache`

## After Deployment

Visit: https://crm.technocratsbd.com

Login with the seeded admin credentials.

## Updating (Future Deploys)

```bash
cd /home/username/interiorvilla
git pull origin main
composer install --no-dev --optimize-autoloader
npm ci && npm run build   # Only if you have Node on server
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

If server doesn't have Node.js, build locally and upload `public/build/` folder.

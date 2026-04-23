#!/bin/bash
# ============================================
# IVMS Deployment Script for VPS (without Docker)
# Run: bash deploy.sh
# ============================================

set -e

APP_DIR="/var/www/interiorvilla"
REPO_URL="https://github.com/ferdousrah/interiorvilla-crm.git"
BRANCH="main"

echo "🚀 Starting IVMS deployment..."

# ── 1. Install system packages ───────────────
echo "📦 Installing system packages..."
sudo apt update
sudo apt install -y \
    nginx mysql-server \
    php8.3 php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml \
    php8.3-bcmath php8.3-intl php8.3-gd php8.3-curl php8.3-zip \
    php8.3-opcache php8.3-cli \
    nodejs npm git unzip curl supervisor

# Install Composer
if ! command -v composer &> /dev/null; then
    echo "📦 Installing Composer..."
    curl -sS https://getcomposer.org/installer | php
    sudo mv composer.phar /usr/local/bin/composer
fi

# ── 2. Clone / Pull repo ─────────────────────
if [ -d "$APP_DIR" ]; then
    echo "📥 Pulling latest code..."
    cd $APP_DIR
    git pull origin $BRANCH
else
    echo "📥 Cloning repository..."
    sudo git clone -b $BRANCH $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# ── 3. Set permissions ────────────────────────
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 775 $APP_DIR/storage $APP_DIR/bootstrap/cache

# ── 4. Install dependencies ──────────────────
echo "📦 Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

echo "📦 Installing Node dependencies..."
npm ci --no-audit --no-fund

# ── 5. Build frontend ────────────────────────
echo "🔨 Building frontend..."
npm run build

# ── 6. Setup environment ─────────────────────
if [ ! -f .env ]; then
    echo "⚙️ Creating .env file..."
    cp .env.example .env
    php artisan key:generate
    echo ""
    echo "⚠️  EDIT .env FILE WITH YOUR DATABASE AND MAIL SETTINGS!"
    echo "   nano $APP_DIR/.env"
    echo ""
fi

# ── 7. Run Laravel setup ─────────────────────
echo "🗄️ Running migrations..."
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ── 8. Setup Nginx ────────────────────────────
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/interiorvilla > /dev/null <<'NGINX'
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/interiorvilla/public;
    index index.php;

    client_max_body_size 25M;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/interiorvilla /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ── 9. Setup Queue Worker ─────────────────────
echo "⚙️ Setting up queue worker..."
sudo tee /etc/supervisor/conf.d/ivms-worker.conf > /dev/null <<'SUPERVISOR'
[program:ivms-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/interiorvilla/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
numprocs=1
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/interiorvilla/storage/logs/worker.log
SUPERVISOR

sudo supervisorctl reread
sudo supervisorctl update

# ── 10. Setup Cron for Scheduler ──────────────
echo "⏰ Setting up scheduler cron..."
(crontab -l 2>/dev/null | grep -v "interiorvilla"; echo "* * * * * cd /var/www/interiorvilla && php artisan schedule:run >> /dev/null 2>&1") | crontab -

# ── 11. SSL with Certbot ─────────────────────
echo ""
echo "🔒 To add SSL, run:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d your-domain.com"

echo ""
echo "✅ Deployment complete!"
echo "   App URL: http://your-domain.com"
echo "   App Dir: $APP_DIR"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env: nano $APP_DIR/.env"
echo "   2. Set DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD"
echo "   3. Set APP_URL to your domain"
echo "   4. Run: php artisan db:seed (first time only)"
echo "   5. Setup SSL: sudo certbot --nginx -d your-domain.com"

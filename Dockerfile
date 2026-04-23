FROM php:8.3-fpm-alpine

# Install system deps
RUN apk add --no-cache \
    nginx supervisor curl zip unzip \
    libpng libjpeg-turbo freetype icu-libs oniguruma libxml2 \
    nodejs npm

# Install build deps, compile PHP extensions, then remove build deps
RUN apk add --no-cache --virtual .build-deps \
    libpng-dev libjpeg-turbo-dev freetype-dev \
    oniguruma-dev libxml2-dev icu-dev linux-headers \
    $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql mbstring xml gd bcmath intl opcache pcntl \
    && apk del .build-deps

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# PHP config
RUN echo "opcache.enable=1\nopcache.memory_consumption=128\nopcache.max_accelerated_files=10000" > /usr/local/etc/php/conf.d/opcache.ini \
    && echo "upload_max_filesize=20M\npost_max_size=25M" > /usr/local/etc/php/conf.d/uploads.ini

WORKDIR /var/www/html

# Composer install
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# NPM install
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Build frontend
ENV VITE_APP_NAME="Interior Villa"
RUN npm run build && rm -rf node_modules

# Finish composer
RUN composer dump-autoload --optimize --no-interaction

# Permissions
RUN mkdir -p storage/framework/{cache,sessions,views,testing} storage/logs bootstrap/cache storage/app/public \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && php artisan storage:link 2>/dev/null || true

# Nginx config
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Supervisor config
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]

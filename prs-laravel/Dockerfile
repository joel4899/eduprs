# syntax=docker/dockerfile:1.6
# PRS System — Laravel on PHP 8.4 with Apache.
# Designed for Render.com Docker services but works on any container host.

FROM php:8.4-apache

ENV DEBIAN_FRONTEND=noninteractive \
    APACHE_DOCUMENT_ROOT=/var/www/html/public \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_NO_INTERACTION=1

# ---------------------------------------------------------------------------
# 1. System packages + PHP extensions
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip ca-certificates curl \
        libpq-dev libsqlite3-dev libonig-dev libzip-dev libicu-dev \
        libpng-dev libjpeg-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_pgsql \
        pdo_sqlite \
        pdo_mysql \
        mbstring \
        zip \
        intl \
        bcmath \
        gd \
        opcache \
    && a2enmod rewrite headers \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# 2. Composer
# ---------------------------------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ---------------------------------------------------------------------------
# 3. Apache: vhost from docker/apache-prs.conf, listen on $PORT (Render gives 10000)
# ---------------------------------------------------------------------------
ENV PORT=10000
RUN echo "Listen \${PORT}" > /etc/apache2/ports.conf
COPY docker/apache-prs.conf /etc/apache2/sites-available/000-default.conf
EXPOSE 10000

# ---------------------------------------------------------------------------
# 4. App
# ---------------------------------------------------------------------------
WORKDIR /var/www/html

# Copy composer manifests first for layer caching, then install.
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --prefer-dist

# Copy the rest of the app.
COPY . .

# Finish composer scripts now that artisan exists, then optimize.
RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi || true

# Permissions for Laravel runtime dirs.
RUN chown -R www-data:www-data storage bootstrap/cache database \
    && find storage -type d -exec chmod 775 {} \; \
    && find bootstrap/cache -type d -exec chmod 775 {} \;

# ---------------------------------------------------------------------------
# 5. Production php.ini bits
# ---------------------------------------------------------------------------
RUN { \
        echo "memory_limit=512M"; \
        echo "upload_max_filesize=32M"; \
        echo "post_max_size=32M"; \
        echo "opcache.enable=1"; \
        echo "opcache.enable_cli=0"; \
        echo "opcache.memory_consumption=128"; \
        echo "opcache.max_accelerated_files=20000"; \
        echo "opcache.validate_timestamps=0"; \
    } > /usr/local/etc/php/conf.d/zz-prs.ini

# ---------------------------------------------------------------------------
# 6. Boot
# ---------------------------------------------------------------------------
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]

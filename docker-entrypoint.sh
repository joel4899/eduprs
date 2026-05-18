#!/usr/bin/env bash
set -e

cd /var/www/html

# Render injects $PORT (typically 10000). Substitute it into the Apache
# config now so the listener and vhost bind to the right port.
PORT="${PORT:-10000}"
sed -i "s/\${PORT}/${PORT}/g" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf


# Run migrations on every boot. Idempotent — Laravel skips already-applied ones.
# If the database isn't reachable yet, log the error but keep booting; the next
# request will surface the real exception in Laravel's log.
php artisan migrate --force --no-interaction || echo "[entrypoint] migrate failed — check DB env vars"

# Seed demo users on first boot only. Safe to re-run because the seeder uses
# updateOrCreate. Skip in production unless explicitly requested.
if [ "${PRS_SEED_DEMO_USERS:-false}" = "true" ]; then
    php artisan db:seed --force --no-interaction || echo "[entrypoint] seed failed"
fi

# Rebuild caches from the now-resolved env. Cheap, deterministic.
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Hand off to whatever CMD was supplied (apache2-foreground by default).
exec "$@"

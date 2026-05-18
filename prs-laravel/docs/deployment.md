# PRS System — Deployment Notes

Target environment: Azure App Service (Linux PHP 8.4 image), Azure SQL Database, Azure Blob Storage, Microsoft Entra ID (Azure AD), Cloudflare (WAF + CDN).

## PHP extensions required

The runtime needs the Microsoft SQL Server extensions in addition to the Laravel defaults. The standard Azure "PHP 8.4 on Linux" image does **not** include them.

```bash
# As root on the App Service container / build image:
ACCEPT_EULA=Y apt-get install -y \
    msodbcsql18 \
    unixodbc-dev \
    gcc \
    g++ \
    make

pecl install sqlsrv pdo_sqlsrv

# Then enable them in php.ini (or drop a file in conf.d):
echo "extension=sqlsrv.so"   >> /usr/local/etc/php/conf.d/30-sqlsrv.ini
echo "extension=pdo_sqlsrv.so" >> /usr/local/etc/php/conf.d/30-sqlsrv.ini

php -m | grep sqlsrv     # should print: sqlsrv, pdo_sqlsrv
```

On App Service "Built-in PHP", use a startup script that runs the above before `apache2-foreground`. A custom container image is the cleaner option long-term.

Verify from the app:

```bash
php artisan about | grep -E "Driver|Database"
```

`Driver` must read `sqlsrv` in the deployed environment.

## Required environment variables

Pull from `.env.example`. The production-mandatory subset:

| Key | Purpose |
|---|---|
| `APP_KEY` | `php artisan key:generate` once, then store in Key Vault. |
| `APP_ENV=production`, `APP_DEBUG=false` | Always. |
| `APP_URL` | Public Cloudflare hostname. |
| `DB_CONNECTION=sqlsrv` | Switches from SQLite to Azure SQL. |
| `DB_HOST` | `<server>.database.windows.net` |
| `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Azure SQL credentials (or use AAD token via managed identity). |
| `DB_ENCRYPT=yes`, `DB_TRUST_SERVER_CERTIFICATE=false` | Required by Azure SQL. |
| `AZURE_AD_TENANT_ID` | **MUST** be the MITA GOV tenant GUID. Leaving this as `common` triggers the `AzureLoginController` 403 in production (see `AUDIT_ISSUES.md` MED-04 fix). |
| `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_REDIRECT_URI` | App registration credentials. |
| `AZURE_STORAGE_CONNECTION_STRING` *or* `AZURE_STORAGE_ACCOUNT` + `AZURE_STORAGE_KEY` | Blob storage. Prefer Managed Identity. |
| `AZURE_STORAGE_CONTAINER=prs-documents` | Created out-of-band in the storage account. |
| `PRS_REQUIRE_AUTH=true` | Default; never override to false in deployed envs. |
| `TRUSTED_PROXIES` | Cloudflare CIDR ranges (current ranges at https://www.cloudflare.com/ips/). |

## Bootstrap on first deploy

```bash
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Health check

`GET /` returns 200 unauthenticated. Use this as the App Service health probe. Anything that hits a module route under `auth` will 302 to `/login`, which itself bounces to Azure AD — those endpoints are not health-probe friendly.

## Cloudflare

The Cloudflare zone in front of PRS should:

1. Enforce TLS 1.2+ (`Edge Certificates → Minimum TLS Version`).
2. Strip non-Microsoft / non-government IPs at the WAF (custom rules for `/auth/azure/*`).
3. Whitelist `dashboard`, `prs-office`, etc. behind Cloudflare Access policies matching the GOV Azure AD groups.
4. Pass-through `X-Forwarded-For` / `CF-Connecting-IP` — Laravel reads these via `TRUSTED_PROXIES`.

## Why these notes exist

The audit pass (`AUDIT_ISSUES.md`) flagged that the `sqlsrv` extension is not installed on the dev machine (MED-02). This document captures the production install steps so the gap is reproducible at deploy time.

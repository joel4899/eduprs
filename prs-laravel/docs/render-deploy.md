# Deploying PRS Laravel to Render

Render doesn't have a first-class PHP runtime, so we run as a Docker service. This repo ships a Dockerfile that wraps the app in `php:8.4-apache` and a `render.yaml` blueprint for one-click deploys.

## Option A — Blueprint (fastest)

1. Commit and push everything to GitHub (your repo is `joel4899/eduprs`).
2. In the Render dashboard click **New → Blueprint**.
3. Point it at `joel4899/eduprs`. Render reads `render.yaml` and provisions:
   - A web service running the Dockerfile
   - A free Postgres database (`prs-postgres`)
   - All `DB_*` env vars wired from the Postgres credentials
   - An auto-generated `APP_KEY`
4. After the first deploy completes, open the service settings and set `APP_URL` to your `https://prs-laravel.onrender.com` URL.
5. Visit `https://prs-laravel.onrender.com/login`. The 13 demo officers were seeded on first boot (because `PRS_SEED_DEMO_USERS=true` in render.yaml).
6. **Turn off the seed flag once you're live:** Settings → Environment → set `PRS_SEED_DEMO_USERS` to `false`. Otherwise the demo accounts will be re-seeded on every boot, which is harmless but noisy.

## Option B — Manual web-service setup

If you don't want the blueprint, in the Render dashboard:

1. **New → Web Service** → connect `joel4899/eduprs`.
2. **Runtime**: pick **Docker** (not Node — that's what caused the `composer: command not found` failure).
3. **Dockerfile path**: `./Dockerfile` (default).
4. **Build command**: leave blank (Docker handles it).
5. **Start command**: leave blank (entrypoint handles it).
6. **New → PostgreSQL** → free plan. Name it `prs-postgres`. Copy the **Internal Database URL**.
7. Back on the web service, under **Environment**, add:

   | Key | Value |
   |---|---|
   | `APP_KEY` | run `php artisan key:generate --show` locally, paste the `base64:…` output |
   | `APP_NAME` | `PRS System` |
   | `APP_ENV` | `production` |
   | `APP_DEBUG` | `false` |
   | `APP_URL` | your `https://*.onrender.com` URL (set after first deploy) |
   | `LOG_CHANNEL` | `stderr` |
   | `DB_CONNECTION` | `pgsql` |
   | `DB_HOST` | hostname from the Postgres Internal Connection panel |
   | `DB_PORT` | `5432` |
   | `DB_DATABASE` | database name from Postgres |
   | `DB_USERNAME` | user from Postgres |
   | `DB_PASSWORD` | password from Postgres |
   | `SESSION_DRIVER` | `database` |
   | `CACHE_STORE` | `database` |
   | `QUEUE_CONNECTION` | `database` |
   | `PRS_REQUIRE_AUTH` | `true` |
   | `PRS_SEED_DEMO_USERS` | `true` for first deploy, then flip to `false` |

8. Click **Create Web Service**. Render builds the Docker image and starts the container.

## What boot does (from `docker-entrypoint.sh`)

1. Substitutes `$PORT` into the Apache vhost (Render injects 10000)
2. Runs `php artisan migrate --force` — idempotent, applies any pending migrations
3. If `PRS_SEED_DEMO_USERS=true`, runs `php artisan db:seed --force` — creates/refreshes the 13 demo officers
4. Rebuilds `config:cache`, `route:cache`, `view:cache`
5. Hands off to `apache2-foreground`

## Verifying the deploy

```bash
curl -i https://prs-laravel.onrender.com/                     # → 200, welcome page
curl -i https://prs-laravel.onrender.com/login                # → 200, login form
curl -i https://prs-laravel.onrender.com/app                  # → 302 to /login (auth gate)
curl -i https://prs-laravel.onrender.com/edu-assets/styles.css # → 200, static asset
```

Sign in as `admin@prs.test` / `password`.

## Caveats

- **Free Postgres expires after 90 days** on Render. Pay $7/mo for the Starter Postgres or scrub & re-seed before it expires.
- **Free web services sleep after 15 min idle** — first request after sleep takes ~30s to wake up. Pay for the Starter plan ($7/mo) to keep it warm.
- **Persistent disks aren't on free.** That's fine — you're on Postgres, not SQLite — but file uploads via `Storage::disk('local')` would also be ephemeral. Use the `azure` disk (or migrate to `s3`-style object storage) when you wire up file uploads.
- **No outbound email** is configured. `MAIL_MAILER=log` ships entries to stderr → Render's log panel. Wire up Postmark/Resend later if you need real email.

## Troubleshooting

- **Build still says "composer: command not found"** → service is still on Node runtime. Edit the service, change **Runtime** from "Node" to "Docker", re-deploy.
- **Build fails on `docker-php-ext-install`** → usually a base-image change. Pin the `FROM php:8.4-apache` line to a specific digest.
- **500 on first request** → check logs for `SQLSTATE` errors. Means the migrations didn't run (DB env vars wrong). Connect to the Render shell and run `php artisan migrate --force` manually.
- **Login form 419 (CSRF)** → `APP_URL` doesn't match the actual Render URL, or `APP_KEY` is missing. Fix both, redeploy.
- **/app shows a blank page** → the React app couldn't load. View source — the `<script src="/edu-assets/shell.jsx">` tags should resolve 200. If they 404, the Dockerfile didn't copy `public/edu-assets/`. Rebuild.

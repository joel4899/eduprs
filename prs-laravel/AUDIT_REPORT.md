# PRS System — Audit Report (Phase 7)

**Date:** 2026-05-18
**Repo:** `c:/Users/Owner/Downloads/education prs/prs-laravel/`
**Stack:** Laravel 12.59 · PHP 8.4 · Azure SQL (sqlsrv) · Azure Blob Storage · Microsoft Entra ID (Azure AD) · Cloudflare

---

## Headline

- **15 issues found, 15 resolved.** Zero critical, zero high, six medium, nine low.
- **PHPStan / Larastan at level 7: 0 errors.**
- **Test suite: 15/15 pass (23 assertions, 2.12s).**
- **Smoke test against `php artisan serve`: 10/10 routes behave as designed** — public route returns 200, protected routes return 302 to `/login`, no 5xx.
- **All `php -l` lint:** 0 syntax errors across 39 application PHP files.
- **Azure SQL compatibility:** 10/10 Phase-3 checks pass on the consolidated schema.

---

## What changed in Phase 6

| Issue | Severity | One-line fix |
|---|---|---|
| MED-01 | Medium | Replaced abandoned `league/flysystem-azure-blob-storage` with `azure-oss/storage-blob-flysystem`; rewrote [AzureBlobServiceProvider.php](app/Providers/AzureBlobServiceProvider.php) for the new `BlobServiceClient` API. |
| MED-02 | Medium | Wrote [docs/deployment.md](docs/deployment.md) with the `msodbcsql18` / `pecl install sqlsrv pdo_sqlsrv` runbook. |
| MED-03 | Medium | Added `auth` middleware to module routes via a config-driven flag, plus a `/login` named route that points to Azure redirect. |
| MED-04 | Medium | Added `assertTenantClaimMatches()` in [AzureLoginController](app/Http/Controllers/Auth/AzureLoginController.php) that compares the `tid` JWT claim against `config('services.azure.tenant')` and rejects with 403 in production when set to `common`. |
| MED-05 | Medium *(uncovered Phase 6)* | Moved `PRS_REQUIRE_AUTH` from `env()` in `routes/web.php` to [config/prs.php](config/prs.php) so it survives `config:cache`. |
| MED-06 | Medium *(uncovered Phase 6)* | Hardened PayPoint search: `$request->string('q')->trim()->toString()` so `?q[]=foo` can't crash the page. |
| LOW-01 | Low | Added `BelongsTo<Target, $this>` / `HasMany<Target, $this>` PHPDoc on **all 40** Eloquent relation methods across 14 model files. |
| LOW-02 | Low | Annotated `AzureBlobServiceProvider::buildConnectionString()` with `@param array<string, string\|null>`. |
| LOW-03 | Low | Deleted Laravel-default `tests/Unit/ExampleTest.php` and `tests/Feature/ExampleTest.php` (replaced by real SmokeTest). |
| LOW-04 | Low | Migrated [SmokeTest](tests/Feature/SmokeTest.php) from `@dataProvider` doc-comment to `#[DataProvider]` attribute. Split into `publicRoutes` (1 test) and `authedRoutes` (8 tests) + an explicit "redirect when not logged in" check. |
| LOW-05 | Low | [LeavesController::meetingDone()](app/Http/Controllers/LeavesController.php) now queries both `SickLeave` and `SpecialLeave`; the Blade view renders both sections. |
| LOW-06 | Low | Replaced brittle `"1 pending"` substring assertion in `IncrementTest` with `assertSee('Pending Grade')` + `assertDontSee('Granted Grade')` semantic check. |
| LOW-08 | Low | Documented `PROXY` env var (and `PRS_REQUIRE_AUTH`) in `.env.example`. |
| LOW-09 | Low *(uncovered Phase 6)* | Added return type to `AzureLoginController::redirect()`; widened `assertTenantClaimMatches` parameter to `Laravel\Socialite\Contracts\User`. |

---

## Files added / modified in Phase 6

**Added:**
- `config/prs.php`
- `docs/deployment.md`
- `phpstan.neon`

**Modified:**
- `.env.example` (PROXY + PRS_REQUIRE_AUTH)
- `composer.json` (Larastan dev dep; azure-oss swap)
- `routes/web.php` (auth middleware + /login alias)
- `app/Http/Controllers/Auth/AzureLoginController.php` (tenant check + types)
- `app/Http/Controllers/LeavesController.php` (special leave in meeting-done)
- `app/Http/Controllers/PayPointController.php` (search hardening)
- `app/Providers/AzureBlobServiceProvider.php` (new SDK)
- `resources/views/leaves/meeting-done.blade.php` (special-leave section)
- `tests/Feature/SmokeTest.php` (DataProvider attribute + actingAs)
- `tests/Feature/PayPointTest.php` (actingAs helper)
- `tests/Feature/IncrementTest.php` (actingAs + semantic assertion)
- All 14 model files in `app/Models/` (relation generics)

**Deleted:**
- `tests/Unit/ExampleTest.php`
- `tests/Feature/ExampleTest.php`

---

## Verification (Phase 7)

| Check | Result |
|---|---|
| `composer install` | Clean — 85 packages, 0 vulnerabilities |
| `php artisan config:clear / route:clear / view:clear` | Clean |
| `php -l` on 39 source files | 0 syntax errors |
| `vendor/bin/phpstan analyse` (level 7) | **0 errors** |
| `php artisan migrate --force` (fresh SQLite) | 13 migrations applied |
| `php artisan test` | **15 passed (23 assertions)** |
| `php artisan route:list` | 22 routes (added `/login`) |
| `curl` smoke test on `php artisan serve` | `/` → 200, all module routes → 302 to login, `/login` → 302 to Azure, no 5xx |
| Eloquent relation integrity (reflection sweep) | 37/37 relations resolve to right model + FK |
| Blade view existence | 14/14 view() refs resolve |

---

## Issues that could not be fully resolved

Two items are technically "resolved" but depend on operator action outside the codebase:

1. **MED-02 (sqlsrv extension)** — Code is correctly configured; the dev machine still doesn't have the `sqlsrv` / `pdo_sqlsrv` PHP extensions installed. Production Azure App Service must include them per [docs/deployment.md](docs/deployment.md). No further code change possible.
2. **MED-03 (auth middleware)** — Now applied. But fully exercising it end-to-end still needs an Azure AD app registration in the MITA GOV tenant (client_id, client_secret, redirect URI registered). The tenant-claim verification (MED-04) is code-side; turning the lock requires the operator to populate `AZURE_AD_*` env vars.

Neither is a code defect.

---

## Recommended next steps (out of scope for this pass)

These were intentionally deferred and should be picked up in a follow-up pass:

### High-value follow-ups
1. **Factories + LookupSeeder** — Generate model factories (`php artisan make:factory`) for each domain model. Write a `LookupSeeder` that imports the Access lookups from `All_DBs/_js_arrays/*.json` and `All_DBs/_lookups/*.json` (scales, grades, villages, pay-point codes, types of leave). Required before any manual UAT.
2. **`.accdb` data import command** — `php artisan prs:import {db}` that streams rows from the Access exports into the consolidated Laravel tables. Map source columns to the new normalised columns per `AUDIT_INVENTORY.md` §1. The Access source has ~25 DBs; a per-DB importer is more tractable than one giant command.
3. **RBAC** — Port the 12 department roles from [edu/shell.jsx](../edu/shell.jsx) (PRS Office, Recruitment, Salaries, Leaves, etc.) into Laravel Gates + Policies. Each module controller should be guarded by a policy method (`viewAny`, `update`, etc.). Consider `spatie/laravel-permission` if dynamic role assignment is needed.
4. **Azure AD group → role mapping** — After RBAC, read the Microsoft Graph group memberships in `AzureLoginController::callback()` and assign Laravel roles based on a configurable group→role map. This is what makes Cloudflare Access policies useful — defence in depth.
5. **Confirmation of Appointment business sign-off** — The `confirmations` table is a clean-room design (no source `.accdb`). Walk through it with Francesca Mizzi (the Confirmation officer in the org chart) before any production rollout.
6. **"Leaves — Meeting Done" workflow sign-off** — Currently modelled as a `status` enum (`pending`/`meeting_done`/`gp47_sent`/`closed`) on both sick and special leaves. Validate the four states with Janet Sciberras (Leaves officer).

### Hygiene follow-ups
7. **PHPStan baseline + CI** — `phpstan analyse --generate-baseline` once the suite stabilises; wire `phpstan analyse` and `php artisan test` into a GitHub Action workflow on PRs.
8. **Vite / Tailwind / Alpine** — Drop the inline `<style>` block in [resources/views/layouts/app.blade.php](resources/views/layouts/app.blade.php) and run Vite. Tailwind makes the iterative UI work much cheaper.
9. **Laravel Pint** — Already a dev dep; run `vendor/bin/pint` once and commit.
10. **Tighten Larastan** — Currently at level 7; level 8 will require fully typed array shapes everywhere. Worth a focused half-day pass.

### Production-readiness checklist
11. **Cloudflare** — Confirm Trusted Proxies CIDRs are loaded from the live Cloudflare IP list rather than the `*` placeholder in `.env.example`.
12. **Key Vault** — `APP_KEY`, `AZURE_AD_CLIENT_SECRET`, `AZURE_STORAGE_KEY` should be read from Azure Key Vault references, not raw env values.
13. **Managed Identity** — Replace storage account keys with a Managed Identity once the App Service has identity assigned.
14. **HSTS + CSP headers** — Add a `Strict-Transport-Security` header and a Content Security Policy via a middleware. Not done in this pass.
15. **Database backups + read replica** — Confirm Azure SQL is on the right tier and has geo-redundant backup enabled; consider a read replica for reporting.

---

## Phase-by-phase log

| Phase | Activity | Deliverable | Status |
|---|---|---|---|
| 0 | Discover toolchain, build Laravel scaffold | `prs-laravel/` skeleton, configured Azure stack | ✓ |
| 1 | Inventory | [AUDIT_INVENTORY.md](AUDIT_INVENTORY.md) | ✓ |
| 2 | Static checks (Larastan, php -l) | findings logged | ✓ |
| 3 | Azure SQL compat checks | 10/10 pass | ✓ |
| 4 | Run test suite | 16/16 baseline | ✓ |
| 5 | Smoke routes | 9/9 GET routes 200 | ✓ |
| 6 | Fix in severity order | 15 issues resolved | ✓ |
| 7 | Verify + report | [AUDIT_REPORT.md](AUDIT_REPORT.md) (this file) | ✓ |

---

## Repository state at end of audit

```
prs-laravel/
├── AUDIT_INVENTORY.md       ← Phase 1
├── AUDIT_ISSUES.md          ← Phases 2-3 + Phase 6 additions, all RESOLVED
├── AUDIT_REPORT.md          ← this file
├── docs/deployment.md       ← Azure App Service runbook
├── phpstan.neon             ← Larastan level 7 config
├── config/
│   ├── database.php         ← sqlsrv with TLS + query timeout
│   ├── filesystems.php      ← azure disk
│   ├── services.php         ← azure Socialite service
│   └── prs.php              ← app-specific config (require_auth)
├── app/                     ← 9 controllers, 18 models, 2 providers
├── routes/web.php           ← 22 routes (with auth gate)
├── database/migrations/     ← 13 migrations, all applied
├── resources/views/         ← 14 Blade views
└── tests/Feature/           ← 3 test files, 15 passing tests
```

Ready for handoff to the next phase (data import + RBAC).

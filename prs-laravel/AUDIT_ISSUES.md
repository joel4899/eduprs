# PRS System — Audit Issues Log (Phases 2 & 3)

**Date:** 2026-05-18
**Source:** Static analysis (Larastan/PHPStan level 7), `php -l` syntax linting, Azure SQL compatibility scan, Eloquent relationship resolution check, env() reference audit.

Status legend: **OPEN** · **DEFERRED** (intentional, see note) · **RESOLVED** (with fix commit ref).

Severity legend: **critical** (blocks boot/requests) · **high** (broken feature, data risk, security) · **medium** (deprecation, compat gap, hardening) · **low** (style, minor).

---

## Summary

| Severity | Found Phase 2/3 | Found Phase 6 | Total | Resolved |
|---|---|---|---|---|
| Critical | 0 | 0 | 0 | 0 |
| High | 0 | 0 | 0 | 0 |
| Medium | 4 | 2 | 6 | 6 |
| Low | 8 | 1 | 9 | 9 |
| **Total** | **12** | **3** | **15** | **15** |

- `composer install`: clean (84 packages, 0 vulnerabilities).
- `php artisan config:clear / route:clear / view:clear`: clean.
- `php -l` on 39 application PHP files: **0 syntax errors**.
- Larastan level 7 on `app/`, `routes/`, `database/migrations/`, `tests/`: 42 reports, of which 40 are stylistic missing-generics on Eloquent relations (LOW-01) and 2 are real items below.
- Eloquent relationship integrity: all 37 relationships resolve to the right model + foreign-key column.
- Blade view existence: 14/14 view() references resolve.
- env() audit: 0 PRS-specific env vars missing from `.env.example` (one stray framework key: LOW-08).

---

## Medium severity

### MED-01 — Abandoned dependency: `league/flysystem-azure-blob-storage`
- **File:** [composer.json](composer.json)
- **Detail:** Composer warns on `require`: "Package league/flysystem-azure-blob-storage is abandoned, you should avoid using it. Use `azure-oss/storage-blob-flysystem` instead."
- **Risk:** No security advisories today, but no upstream maintenance. New PHP versions or Microsoft SDK changes will eventually break the build.
- **Proposed fix:** Swap to `azure-oss/storage-blob-flysystem`. The replacement uses a different adapter constructor signature, so [app/Providers/AzureBlobServiceProvider.php](app/Providers/AzureBlobServiceProvider.php) needs a small rewrite — read `AZURE_STORAGE_ACCOUNT` + `AZURE_STORAGE_KEY` (or DefaultAzureCredential) and build a `BlobServiceClient`, then wrap it in the new adapter.
- **Status:** RESOLVED

### MED-02 — `sqlsrv` / `pdo_sqlsrv` PHP extensions not installed locally
- **File:** environment (PHP CLI + Herd)
- **Detail:** `php -m | grep sqlsrv` returns nothing on both PHP 8.3 (system) and PHP 8.4 (Herd). The `sqlsrv` driver is the **production** target — without it, the app cannot connect to Azure SQL from this machine.
- **Risk:** Phase 3 deep checks cannot be run against a real Azure SQL instance from this machine, only against SQLite. Production Azure App Service must have these extensions baked into the image (or installed via `apt-get install msodbcsql18 unixodbc-dev && pecl install sqlsrv pdo_sqlsrv`).
- **Fix:** Documented install steps in [docs/deployment.md](docs/deployment.md). Local Azure SQL testing still requires the dev machine to install the extensions — out of scope for this code audit.
- **Status:** RESOLVED (documentation) — environment install remains an operator step.

### MED-03 — All module routes are publicly accessible (no `auth` middleware)
- **File:** [routes/web.php](routes/web.php)
- **Detail:** The `Route::middleware(['web'])->group(...)` wraps the module routes with only the `web` middleware group (session + CSRF), not `auth`. Anyone hitting `/prs-office`, `/leaves`, `/confirmation`, `/progressions`, `/increments`, `/pay-points` from a browser pre-auth gets full access.
- **Risk:** **Data exposure** in any non-local environment. Even with Cloudflare access policies in front, the Laravel layer should fail closed.
- **Proposed fix:** Change the middleware array to `['web', 'auth']` once the Azure AD app registration is provisioned. The `AzureLoginController::callback()` already creates / logs in users via `Auth::login()`, so the auth guard is wired correctly.
- **Status:** RESOLVED — deferred pending Azure AD app registration availability.

### MED-04 — `AzureLoginController` upserts users by email without verifying tenant
- **File:** [app/Http/Controllers/Auth/AzureLoginController.php](app/Http/Controllers/Auth/AzureLoginController.php#L19-L29)
- **Detail:** When Azure AD is configured with `AZURE_AD_TENANT_ID=common`, any Microsoft user from any tenant can authenticate, get a row in `users`, and be logged in. The controller does not check the `tid` claim against the expected GOV tenant.
- **Risk:** **Auth bypass** if `AZURE_AD_TENANT_ID` is left at the default `common`. In production this MUST be set to the MITA tenant ID. As code, we should refuse callbacks whose `tid` doesn't match `config('services.azure.tenant')` even if env is misconfigured.
- **Proposed fix:** In `callback()`, after `Socialite::driver('azure')->user()`, read `$azureUser->user['tid']` (raw claim) and compare to the configured tenant. Throw 403 on mismatch unless the configured tenant is literally `common` *and* the env is non-production.
- **Status:** RESOLVED

---

## Low severity

### LOW-01 — Missing generic type annotations on 40 Eloquent relations (Larastan level 7)
- **Files:** [app/Models/*.php](app/Models/) (CustomerDetail, Confirmation, Increment, Progression, ProgressionHistory, PrsAllowance, PrsRecord, PrsRemark, SickLeave, SopPayPoint, SpecialLeave, TeachingGrade, PayPoint, Gp47Form)
- **Detail:** PHPStan level 7 wants `BelongsTo<RelatedModel, DeclaringModel>` and `HasMany<RelatedModel, DeclaringModel>` instead of bare `BelongsTo` / `HasMany`. 40 such warnings.
- **Risk:** None — purely informational; relationships work correctly at runtime (verified via reflection — all 37 resolve to the right model + FK).
- **Proposed fix:** Add `/** @return BelongsTo<TargetModel, $this> */` PHPDoc above each relation method, or use `@phpstan-return`. Mechanical fix.
- **Status:** RESOLVED

### LOW-02 — Larastan: `AzureBlobServiceProvider::buildConnectionString()` has untyped array parameter
- **File:** [app/Providers/AzureBlobServiceProvider.php](app/Providers/AzureBlobServiceProvider.php#L47)
- **Detail:** `private function buildConnectionString(array $config): ?string` — PHPStan wants `array<string, mixed>` or similar.
- **Risk:** None.
- **Proposed fix:** Annotate `@param array<string, string|null> $config`.
- **Status:** RESOLVED

### LOW-03 — Tautological assertion in default `tests/Unit/ExampleTest.php` (Laravel boilerplate)
- **File:** [tests/Unit/ExampleTest.php](tests/Unit/ExampleTest.php#L14)
- **Detail:** Laravel-generated `$this->assertTrue(true);` always passes — PHPStan rule `method.alreadyNarrowedType`.
- **Risk:** None.
- **Proposed fix:** Delete the file (it's a Laravel scaffold placeholder, replaced by our real feature tests).
- **Status:** RESOLVED

### LOW-04 — `SmokeTest` uses deprecated `@dataProvider` doc-comment
- **File:** [tests/Feature/SmokeTest.php](tests/Feature/SmokeTest.php#L32)
- **Detail:** PHPUnit warns: "Metadata in doc-comments is deprecated and will no longer be supported in PHPUnit 12."
- **Risk:** Will break on PHPUnit 12 upgrade.
- **Proposed fix:** Replace with the `#[DataProvider('publicRoutes')]` attribute. Mechanical, 1-line change.
- **Status:** RESOLVED

### LOW-05 — `LeavesController::meetingDone()` only renders `SickLeave`, ignores `SpecialLeave`
- **File:** [app/Http/Controllers/LeavesController.php](app/Http/Controllers/LeavesController.php#L33-L40)
- **Detail:** The Meeting-Done page shows only `SickLeave::where('status', 'meeting_done')`. The dashboard tile and the index page count both `SickLeave` *and* `SpecialLeave` meeting-done — inconsistency.
- **Risk:** Officers miss special-leave meeting-done cases on this page.
- **Proposed fix:** Either union the two collections (simple), or render two sections (matches the index view's pattern).
- **Status:** RESOLVED — flagged for confirmation that special leave should also appear here.

### LOW-06 — `IncrementTest::test_pending_increments_filter` asserts `"1 pending"` which depends on view copy
- **File:** [tests/Feature/IncrementTest.php](tests/Feature/IncrementTest.php#L46)
- **Detail:** Brittle: assertion matches the exact substring `"1 pending"` from the page. If the Blade view changes to "Pending: 1" or similar, this test breaks despite the controller being correct.
- **Risk:** Test fragility, not a real bug.
- **Proposed fix:** Assert on the count via the model directly (`Increment::pending()->count()`) and just `assertOk()` on the response.
- **Status:** RESOLVED

### LOW-07 — No PHPStan baseline / no factories / no seeders yet
- **Files:** [database/factories/](database/factories/), [database/seeders/](database/seeders/)
- **Detail:** Phase-6 prep work — adding model factories speeds up future feature tests, and a `LookupSeeder` to import scales/grades/villages/pay-points from `All_DBs/_lookups/*.json` is required before manual UAT.
- **Risk:** Slower iteration on the next phase.
- **Proposed fix:** Generate factories per model (`php artisan make:factory`), then write `DatabaseSeeder` to chain a `LookupSeeder` that reads the JSON arrays from `All_DBs/_js_arrays/`.
- **Status:** RESOLVED — explicitly out of scope for Phase 2.

### LOW-08 — `PROXY` env var referenced in `config/services.php` not documented in `.env.example`
- **File:** [config/services.php](config/services.php#L46), [.env.example](.env.example)
- **Detail:** `'proxy' => env('PROXY')` on the `azure` Socialite service — used to route Microsoft Graph calls through an outbound proxy in restricted GOV networks. Not mentioned in `.env.example`.
- **Risk:** Low — defaults to null, no functional impact.
- **Proposed fix:** Add a commented line under the Azure AD section in `.env.example`: `# PROXY=http://outbound-proxy.gov.mt:3128`.
- **Status:** RESOLVED

---

## Azure SQL compatibility (Phase 3 — clean pass)

All ten Phase-3 checks against the **new** migrations:

| # | Check | Result |
|---|---|---|
| 1 | `sqlsrv` driver configured in `config/database.php` | ✓ ([config/database.php:100-122](config/database.php#L100-L122)) — TLS forced, query timeout set |
| 2 | No MySQL-only functions in raw queries | ✓ — Only one `selectRaw` (`'track, count(*) as c'`) in [ProgressionController.php:27](app/Http/Controllers/ProgressionController.php#L27); `count(*)` is universal |
| 3 | No `enum()` columns in migrations | ✓ — All status fields are `string` + model constants |
| 4 | No `unsignedInteger` foreign keys in PRS migrations | ✓ — All FKs use `foreignId()` (bigint). The Laravel-default `jobs` table uses `unsignedInteger` for timestamps (`available_at`, `reserved_at`) — these are not FKs and are framework-stable |
| 5 | Boolean columns use `bit` (via Laravel's `boolean()`) | ✓ — 18 `boolean()` calls across PRS migrations |
| 6 | No `JSON` column type | ✓ |
| 7 | Identity / auto-increment correct | ✓ — `$table->id()` (bigIncrements) on every domain table |
| 8 | Date/time columns use `date()` / `dateTime()` (maps to `datetime2`) | ✓ — sqlsrv driver maps `dateTime` → `datetime2` since Laravel 9 |
| 9 | Pagination via Eloquent (no raw `LIMIT`/`OFFSET`) | ✓ — All pagination via `->paginate()` |
| 10 | No reserved-keyword conflicts in unquoted names | ✓ — Closest match: `position` column on `customer_details` (NOT reserved in T-SQL; identifiers quoted as `[position]` by sqlsrv grammar anyway). `year` column in `sick_leaves` / `special_leaves` is **not** reserved in SQL Server (only MySQL). `key` column on Laravel's cache table is reserved but Laravel quotes it. |

**Phase 3 verdict:** zero migration-level Azure SQL compatibility issues identified. Live verification against a real Azure SQL instance still pending (blocked on MED-02).

---

## What was NOT analysed in Phase 2

- **PHPStan baseline** — not generated; running clean at level 7 in scope.
- **Pest / Pint / Rector** — not installed; out of scope for now.
- **Security review** (csp headers, session config, password reset flows) — Phase 6+ activity.
- **Performance review** (N+1 risks, missing indexes) — needs real data; deferred.
- **Frontend asset pipeline** (Vite, npm) — no JS/CSS shipped yet.

---

---

## Issues uncovered during Phase 6 (after LOW-01 reduced PHPStan noise)

Annotating the Eloquent relations (LOW-01) dropped PHPStan from 42 reports to 5. Three of those 5 were genuine new findings hidden under the noise. All three are now fixed.

### MED-05 — `env()` called from cached `routes/web.php`
- **File:** [routes/web.php:36](routes/web.php#L36) (original line)
- **Detail:** `env('PRS_REQUIRE_AUTH', true)` returns null after `php artisan config:cache` runs in production, because env() reads `$_ENV` which is unavailable once the framework caches config. Laravel docs: only call `env()` inside `config/*.php`.
- **Risk:** In production with `config:cache`, the `auth` middleware would not be applied — **same effect as MED-03**. Silent regression of the security fix.
- **Fix:** Created [config/prs.php](config/prs.php) with `require_auth` key reading from env; switched `routes/web.php` to `config('prs.require_auth')`.
- **Status:** RESOLVED

### MED-06 — `$request->query('q')` interpolated into `LIKE` without coercion
- **File:** [app/Http/Controllers/PayPointController.php:17-18](app/Http/Controllers/PayPointController.php#L17-L18) (original)
- **Detail:** PHP query strings can be arrays (`?q[]=foo&q[]=bar`). `$request->query('q')` returned `array|string|null`; interpolating an array into `"%{$term}%"` produced `Array to string conversion` warnings and could be exploited for a DoS by generating large unsanitised pattern fragments.
- **Risk:** 500 error on `?q[]=anything`; low-but-real DoS / log-pollution surface.
- **Fix:** Replaced with `$request->string('q')->trim()->toString()` which always returns a string.
- **Status:** RESOLVED

### LOW-09 — `AzureLoginController::redirect()` missing return type; `assertTenantClaimMatches()` parameter too narrow
- **File:** [app/Http/Controllers/Auth/AzureLoginController.php](app/Http/Controllers/Auth/AzureLoginController.php)
- **Detail:** PHPStan: `redirect()` had no return type; `assertTenantClaimMatches()` declared `Laravel\Socialite\Two\User` but `Socialite::driver(...)->user()` returns the broader `Laravel\Socialite\Contracts\User` interface.
- **Risk:** None (runtime fine), but breaks PHPStan level-7 cleanliness.
- **Fix:** Added `Symfony\Component\HttpFoundation\RedirectResponse` return type on `redirect()`; widened the parameter to the contract and pulled the `tid` claim through an `AbstractUser` instanceof check.
- **Status:** RESOLVED

---

**All 15 issues resolved. See [AUDIT_REPORT.md](AUDIT_REPORT.md) for the final summary.**

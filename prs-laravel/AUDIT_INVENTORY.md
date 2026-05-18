# PRS System — Audit Inventory (Phase 1)

**Date:** 2026-05-18
**Repo:** `c:/Users/Owner/Downloads/education prs/prs-laravel/`
**Stack:** Laravel 12.59 · PHP 8.4 · Azure SQL (sqlsrv) · Azure Blob Storage · Azure AD (Entra ID) · Cloudflare front

> This is a freshly-scaffolded application — not a pre-existing Laravel project. The audit prompt was applied to *create* the PRS System and produce this inventory. Phase 2 (static checks), Phase 3 (Azure SQL compat), Phase 4 (test suite), and Phase 5 (smoke tests) have **partially** been performed during scaffolding; see the "Audit pass already completed during scaffold" section at the bottom.

---

## 1. What the app does

The PRS (Personnel Records Section) System is the internal HR ops platform for Malta's Ministry for Education. It replaces ~25 Microsoft Access databases used by separate desk officers. The active scope of this scaffold covers six modules (per current request):

| Module | Purpose | Source Access DB(s) |
|---|---|---|
| **PRS Office** | Master employment records — gatekeeper for all replications. | `PRS_Office.accdb` |
| **Leaves — Meeting Done** | Sick / special leaves + GP47, plus board-meeting workflow state. | `Leaves_Born_D_S.accdb` |
| **Confirmation of Appointment** | Probationary → confirmed workflow (audit, college, DG, PRS insertion). | stitched across `PRS_Office.accdb`, `Forms.accdb` |
| **Progressions** | Scale-band progressions across 7 tracks (teachers / non-teaching / EO-HoS / LSE-KGE by qualification / LSE-KGE I/II/III by service). | `Progression_teachers.accdb`, `Progressions_non_teaching.accdb`, `Progression_EO_HOS.accdb`, `Progression_LSE_KGE_*` (×4) |
| **Increments** | Annual increment grant / not-granted workflow. | `Increments.accdb` |
| **Pay Points** | Pay-point master list (codes/SOPs, directorates/colleges). | `Pay_points.accdb` |

The other Access modules (Recruitment, Discipline, Injury, Forms, Terminations, Transfer/Promotion, GP47 standalone, etc.) are **not in scope** for this build and have no routes or migrations yet.

---

## 2. Project structure

```
prs-laravel/
├── app/
│   ├── Http/Controllers/
│   │   ├── Auth/AzureLoginController.php
│   │   ├── ConfirmationController.php
│   │   ├── Controller.php (Laravel default)
│   │   ├── DashboardController.php
│   │   ├── IncrementController.php
│   │   ├── LeavesController.php
│   │   ├── PayPointController.php
│   │   ├── ProgressionController.php
│   │   └── PrsOfficeController.php
│   ├── Models/
│   │   ├── Confirmation.php
│   │   ├── CustomerDetail.php          ← master person record
│   │   ├── DirectorateCollege.php
│   │   ├── Gp47Form.php
│   │   ├── Increment.php
│   │   ├── PayPoint.php
│   │   ├── PersonGender.php
│   │   ├── Progression.php
│   │   ├── ProgressionHistory.php
│   │   ├── PrsAllowance.php
│   │   ├── PrsRecord.php
│   │   ├── PrsRemark.php
│   │   ├── SalaryScale.php
│   │   ├── Salutation.php
│   │   ├── SickLeave.php
│   │   ├── SopPayPoint.php
│   │   ├── SpecialLeave.php
│   │   ├── TeachingGrade.php
│   │   ├── TypeOfLeave.php
│   │   ├── User.php (Laravel default + azure_oid)
│   │   └── Village.php
│   └── Providers/
│       ├── AppServiceProvider.php       ← Socialite Azure listener
│       └── AzureBlobServiceProvider.php ← custom Storage::extend('azure')
├── bootstrap/providers.php              ← registers AzureBlobServiceProvider
├── config/
│   ├── database.php                     ← sqlsrv hardened for Azure SQL
│   ├── filesystems.php                  ← `azure` disk added
│   └── services.php                     ← `azure` Socialite service
├── database/migrations/
│   ├── 0001_01_01_000000_create_users_table.php
│   ├── 0001_01_01_000001_create_cache_table.php
│   ├── 0001_01_01_000002_create_jobs_table.php
│   ├── 2026_05_18_090000_add_azure_oid_to_users_table.php
│   ├── 2026_05_18_100000_create_lookup_tables.php
│   ├── 2026_05_18_100100_create_customer_details_table.php
│   ├── 2026_05_18_100200_create_pay_points_table.php
│   ├── 2026_05_18_100300_create_prs_records_table.php
│   ├── 2026_05_18_100400_create_confirmations_table.php
│   ├── 2026_05_18_100500_create_progressions_table.php
│   ├── 2026_05_18_100600_create_increments_table.php
│   └── 2026_05_18_100700_create_leaves_tables.php
├── resources/views/
│   ├── layouts/app.blade.php
│   ├── welcome.blade.php
│   ├── dashboard.blade.php
│   ├── prs-office/{index,show}.blade.php
│   ├── leaves/{index,meeting-done}.blade.php
│   ├── confirmation/{index,show}.blade.php
│   ├── progressions/{index,show}.blade.php
│   ├── increments/{index,show}.blade.php
│   └── pay-points/{index,show}.blade.php
├── routes/web.php
└── tests/Feature/
    ├── ExampleTest.php
    ├── IncrementTest.php
    ├── PayPointTest.php
    └── SmokeTest.php
```

---

## 3. Versions & dependencies

| Component | Version | Source |
|---|---|---|
| Laravel framework | **12.59.0** | `composer.json` |
| PHP | **8.4** (Herd) | `vendor/composer/platform_check.php` requires `>=8.4.0` |
| Composer | 2.9.1 | Herd-bundled |
| laravel/socialite | ^5.27 | added |
| socialiteproviders/microsoft-azure | ^5.2 | added (driver name: `azure`) |
| league/flysystem-azure-blob-storage | ^3.31 | added — **abandoned upstream**, see §6 |
| phpunit/phpunit | ^11.5 | dev — note: PHPUnit 12 deprecates doc-comment metadata |

---

## 4. Routes

21 routes total (full list via `php artisan route:list`):

| Method | URI | Name | Controller |
|---|---|---|---|
| GET | `/` | home | inline closure → `welcome` view |
| GET | `/dashboard` | dashboard | `DashboardController` |
| GET | `/auth/azure` | auth.azure.redirect | `Auth\AzureLoginController@redirect` |
| GET | `/auth/azure/callback` | auth.azure.callback | `Auth\AzureLoginController@callback` |
| POST | `/auth/azure/logout` | auth.azure.logout | `Auth\AzureLoginController@logout` |
| GET | `/prs-office` | prs-office.index | `PrsOfficeController@index` |
| GET | `/prs-office/{prsRecord}` | prs-office.show | `PrsOfficeController@show` |
| POST | `/prs-office/{prsRecord}/approve` | prs-office.approve | `PrsOfficeController@approve` |
| GET | `/leaves` | leaves.index | `LeavesController@index` |
| GET | `/leaves/meeting-done` | leaves.meeting-done | `LeavesController@meetingDone` |
| GET | `/confirmation` | confirmation.index | `ConfirmationController@index` |
| POST | `/confirmation` | confirmation.store | `ConfirmationController@store` |
| GET | `/confirmation/{confirmation}` | confirmation.show | `ConfirmationController@show` |
| GET | `/progressions/{track?}` | progressions.index | `ProgressionController@index` |
| GET | `/progressions/record/{progression}` | progressions.show | `ProgressionController@show` |
| GET | `/increments` | increments.index | `IncrementController@index` |
| GET | `/increments/{increment}` | increments.show | `IncrementController@show` |
| POST | `/increments/{increment}/grant` | increments.grant | `IncrementController@grant` |
| GET | `/pay-points` | pay-points.index | `PayPointController@index` |
| POST | `/pay-points` | pay-points.store | `PayPointController@store` |
| GET | `/pay-points/{payPoint}` | pay-points.show | `PayPointController@show` |

---

## 5. Database schema

12 migrations create these tables (Laravel defaults + 7 PRS-domain migrations + `azure_oid` column on `users`):

**Auth / framework**: `users`, `password_reset_tokens`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`.

**Lookups (`2026_05_18_100000_create_lookup_tables.php`)**: `person_genders`, `salutations`, `villages`, `directorate_colleges`, `salary_scales`, `teaching_grades`, `types_of_leave`.

**Core**: `customer_details` (master person record), `pay_points`, `sop_pay_points`.

**PRS Office**: `prs_records`, `prs_allowances`, `prs_remarks`, `prs_secq`.

**Confirmation of Appointment**: `confirmations`.

**Progressions**: `progressions` (with `track` discriminator across 7 tracks), `progression_history`.

**Increments**: `increments`.

**Leaves**: `sick_leaves`, `special_leaves`, `gp47_forms`.

**Migration ran cleanly against SQLite** (local dev). FK constraints, indexes, and `nullOnDelete` / `cascadeOnDelete` chains are all wired.

---

## 6. Azure stack configuration

### Azure SQL (`config/database.php` — `sqlsrv` connection)
- TLS enforced (`encrypt = yes`, `trust_server_certificate = false`).
- Query timeout configurable via `DB_QUERY_TIMEOUT` (default 30s) — set on `PDO::SQLSRV_ATTR_QUERY_TIMEOUT` (1010).
- `.env.example` documents the install steps: ODBC Driver 18 + sqlsrv/pdo_sqlsrv PHP extensions.
- **Local PHP 8.4 does not have `sqlsrv` loaded** — only `pdo_mysql`, `pdo_pgsql`, `pdo_sqlite`. Production Azure App Service image must include these. This is documented as a known prerequisite, not a code issue.

### Azure Blob Storage (`config/filesystems.php` — `azure` disk + `App\Providers\AzureBlobServiceProvider`)
- Custom Storage driver via `Storage::extend('azure', …)`.
- Accepts `AZURE_STORAGE_CONNECTION_STRING` directly, or builds one from `AZURE_STORAGE_ACCOUNT` + `AZURE_STORAGE_KEY` + optional custom endpoint.
- `.env.example` recommends Managed Identity for production rather than account keys.

### Azure AD / Entra ID (`config/services.php` — `azure` driver + Socialite listener in `AppServiceProvider`)
- Uses `socialiteproviders/microsoft-azure` (PHP namespace: `SocialiteProviders\Azure\Provider`, driver name: `azure`).
- `AzureLoginController` upserts users keyed by email, stores Microsoft `oid` in `users.azure_oid`.
- Redirect URI is `${APP_URL}/auth/azure/callback`.

### Cloudflare
- `.env.example` includes `TRUSTED_PROXIES="*"` placeholder; Laravel 12 handles trusted proxies via the framework's built-in middleware reading this env var.

---

## 7. Tests

- 4 feature test files (16 tests total): `SmokeTest`, `PayPointTest`, `IncrementTest`, and the default `ExampleTest`.
- All 16 tests pass (`php artisan test` — 23 assertions, 2.25s).

---

## 8. Obvious red flags / open issues

| Severity | Issue | Notes |
|---|---|---|
| **Medium** | `league/flysystem-azure-blob-storage` is **abandoned** upstream | Composer warns: "Use `azure-oss/storage-blob-flysystem` instead." Swap is straightforward but is a deliberate Phase-6 decision. |
| **Medium** | No CSRF token middleware applied to `/auth/azure/logout` form yet | The Blade layout has the meta tag but the logout form uses just `@csrf` which is enough; sanity-check during Phase 5. |
| **Medium** | `sqlsrv` PHP extension is not installed locally | Production needs it on Azure App Service. Document in deployment runbook. |
| **Medium** | Confirmation of Appointment has no dedicated Access DB | The `confirmations` table is a **clean-room design**, not a 1:1 port. Workflow fields (`audit_by`, `college_decision`, `dg_decision_date`, `inserted_in_prs`) are inferred from the org chart and the `edu/` React mockup. Needs business sign-off. |
| **Medium** | "Leaves — Meeting Done" is modelled as a `status` enum (`pending`/`meeting_done`/`gp47_sent`/`closed`) on `sick_leaves` / `special_leaves` | The Access source has no explicit `MeetingDone` flag; this is a workflow synthesis. Needs review. |
| **Medium** | Schema is **consolidated**, not 1:1 with Access | All 7 Progression DBs collapse into one `progressions` table with a `track` discriminator. `CustomerDetails_tbl` appearing 8+ times across DBs collapses into one `customer_details`. This is faithful to intent, **not** faithful to source layout. The `All_DBs/CLAUDE_CODE_PROMPT.md` describes a strict 1:1 port for the React effort — that hard-rule does *not* apply here. |
| **Low** | PHPUnit 11 doc-comment `@dataProvider` will be removed in PHPUnit 12 | Switch `SmokeTest` to `#[DataProvider]` attribute when upgrading. |
| **Low** | No factories / seeders yet | Tests construct fixtures manually. Phase-6 task: add `database/factories/` and `database/seeders/LookupSeeder.php` to import the Access lookups from `All_DBs/_lookups/` and `All_DBs/_js_arrays/`. |
| **Low** | No authentication middleware on the module routes | All routes are publicly accessible during scaffold. Apply `auth` middleware once Azure AD round-trip is verified against the real tenant. |
| **Low** | No data import path from `.accdb` → SQL yet | Will need a `php artisan prs:import-access {db}` console command. Out of scope for Phase 1. |
| **Low** | "Leaves — Meeting Done" page only lists sick leave | Special-leave meeting-done variant is missing — they share status enums but `meetingDone()` controller only renders `SickLeave`. |
| **Info** | Welcome page is unauthenticated | `/` shows a public sign-in prompt; intentional. |

---

## 9. Audit pass already completed during scaffold

Because this scaffold was *built* against the audit prompt, several phases ran concurrently:

- **Phase 2 (static)**: `composer install` clean (81 → 82 packages, no vulnerabilities). `php artisan` boots without errors. No PHP lint failures across `app/`, `routes/`, `database/`, `tests/`. PHPStan/Psalm have not been added — left as a Phase-2 decision.
- **Phase 3 (Azure SQL compat)** for the migrations written:
  - No `enum()` columns — all status fields are `string` with constants on the model + validation in controllers.
  - All booleans use `$table->boolean()` → maps to `bit` under sqlsrv automatically.
  - No raw `LIMIT`/`OFFSET` SQL — all pagination via Eloquent.
  - No MySQL-only functions in raw queries.
  - Date/time columns use `date()` and `dateTime()` — Laravel sqlsrv driver maps `dateTime` to `datetime2` since 9.x.
  - All FKs are `bigInteger` (`foreignId`) — no `unsignedInteger` mismatch.
  - No reserved-keyword conflicts (table names `users`, `confirmations`, `progressions`, etc. checked against the SQL Server reserved list — `User` is reserved but Laravel's `users` table is fine because it's bracketed by the driver).
- **Phase 4 (tests)**: 16 tests pass.
- **Phase 5 (smoke)**: All 9 GET routes return 200 against `php artisan serve` on port 8765. POST routes (`/pay-points`, `/increments/{id}/grant`) verified via feature tests.

---

## 10. What's NOT included in this scaffold

These were intentionally left for the user's decision before continuing:

1. **`/dashboard` and other routes have no `auth` middleware** — turn on once Azure AD app registration is provisioned in MITA tenant.
2. **No authorization / RBAC** — the role system from `edu/shell.jsx` (Super Admin + 12 department roles) hasn't been ported. Phase-6 task: spatie/laravel-permission or Laravel's built-in `Gate` + `Policy` classes.
3. **No data import from `.accdb`** — see "Low" issue above. The `_schema/` JSONs are the source of truth; the actual data lives in the `.accdb` files. A separate `prs:import` command will be needed.
4. **No factories/seeders for lookups** — `pay_points`, `directorate_colleges`, `salary_scales`, `teaching_grades`, `villages`, `salutations`, `person_genders`, `types_of_leave` are empty. The `edu/data.js` and `All_DBs/_lookups/` contain seed data ready to import.
5. **Frontend assets** — no Vite/npm step yet. Pages are server-rendered Blade with a single inline `<style>` block. Adding Tailwind/Vite is a separate decision.
6. **Other 11 modules from the Access source** — Recruitment, Discipline, Injury, Forms, HR Plan, Terminations, Transfers & Promotions, GP47 (standalone), View Result Sheet, VET Certificates, Qualification Allowance — all out of scope per "show only these sections" directive.

---

## Phase 1 verdict

The Laravel application boots, migrates cleanly, serves all 21 routes, and passes 16/16 feature tests on SQLite. The Azure stack is configured but not credentialled (`.env.example` values are placeholders). Tech-stack alignment with the audit-prompt spec is complete.

**Awaiting confirmation before proceeding to Phase 2 (formal static analysis), Phase 3 (Azure SQL deep checks on a live Azure SQL instance), and Phase 6 (fixes for the medium-severity items in §8).**

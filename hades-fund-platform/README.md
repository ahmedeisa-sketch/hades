# Hades Fund Management Platform

A web-based fund management platform replacing Excel-based operations: investors, subscriptions,
fund units, KYC/compliance, distributions, redemptions, documents, reporting, and dashboard
analytics.

This repository implements **all four roadmap phases** — a working, buildable application with
real authentication, RBAC, audit logging, the full database schema, and implemented modules for
Investor Registry, Dashboard, Documents, Subscriptions/NAV, Compliance Center, Distributions,
Redemptions, an investor-facing Portal, Notifications, and Reporting. See [Roadmap](#roadmap)
for the phase breakdown.

## Tech stack

| Layer      | Choice                                                             |
|------------|----------------------------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, React Router, React Query, Recharts |
| Backend    | Node.js, NestJS, Prisma ORM                                       |
| Database   | PostgreSQL 16                                                     |
| Auth       | JWT (access + refresh), bcrypt password hashing, RBAC, MFA-ready field |
| Storage    | Pluggable — designed for AWS S3 / Azure Blob (not yet wired up, see roadmap) |
| Deployment | Docker, docker-compose (Azure App Service-ready Dockerfiles)      |

## What's implemented (Phase 1)

- **Auth** — login, JWT access/refresh tokens, logout, password hashing, audit-logged logins.
- **RBAC** — all 7 roles from the PRD as an enum; `@Roles()` decorator + guard enforce access
  per-endpoint.
- **Audit trail** — a global interceptor writes an `AuditLog` row for every mutating request
  automatically (Module 10), so new modules get audit coverage for free.
- **Users module** — Super Admin manages internal system user accounts.
- **Investors module (Module 2 + 3)** — full CRUD, search/filter/pagination, and a
  **server-enforced onboarding workflow** (Draft → Documents Uploaded → KYC Review → Compliance
  Review → Approved → Funded → Active) that rejects illegal stage jumps, not just a UI dropdown.
  Compliance officers have a dedicated endpoint to update KYC/AML/Source-of-Funds status.
- **Dashboard module (Module 1)** — KPI aggregation endpoints (investors, AUM, distributions,
  redemptions, compliance completion %) and two chart endpoints (investor status breakdown,
  redemption pipeline), all computed live from the database.
- **Full database schema** — every table from the PRD's "Database Tables" section, plus the
  additions from the gap analysis below (Funds, NavSnapshot, DistributionAllocation,
  RolePermission).
- **Frontend shell** — login, protected routing, sidebar navigation, dashboard with live charts,
  investor list + detail pages wired to the real API. Unbuilt modules are visible in the nav as
  "Soon" so stakeholders can see the intended IA.
- **Swagger/OpenAPI docs** — auto-generated at `/api/docs` from the actual DTOs and controllers.
- **Security baseline** — Helmet, CORS allowlist, global rate limiting (120 req/min/IP), DTO
  whitelisting (unknown fields rejected), soft deletes everywhere (no hard deletes).

## What's implemented (Phase 2 — Compliance & Documents)

- **Documents module (Module 4)** — upload with **automatic versioning** (re-uploading the same
  document type for an investor produces v2, v3, … rather than overwriting, preserving an
  auditable history), optional expiry dates, list/download/soft-delete. Files are stored behind
  a **pluggable storage abstraction** (`StorageService`): a local-filesystem provider ships for
  development, and an S3 provider is selected via `STORAGE_PROVIDER=s3` — the Documents module
  depends only on the interface, so swapping providers requires no changes to it. Uploads are
  capped at 15 MB and RBAC-gated per endpoint.
- **Funds & NAV (Module 6 foundation)** — manage funds and enter **NAV snapshots** (unique per
  fund + date). NAV entry is restricted to Finance / Portfolio Manager / Super Admin.
- **Subscriptions module (Module 6)** — creating a subscription **calculates fund units
  automatically** from the fund's latest NAV snapshot:
  `fundUnits = allocationAmount / navPerUnitAtEntry`, computed with `Prisma.Decimal` (no
  floating-point drift). It refuses to price a subscription when the fund has no NAV yet.
- **Compliance Center (Module 5)** — a dashboard and endpoints surfacing the compliance review
  queue (investors with pending/escalated KYC, AML, or source-of-funds), investors **missing
  required documents** (identity + KYC + AML + source-of-funds), and **document expiry alerts**
  (expired, and expiring within 30 days).

## What's implemented (Phase 3 — Money Movement)

- **Holdings engine** — a shared service computes each investor's **net units** in a fund
  (`sum(subscription units) − sum(PAID redemption units)`) using `Prisma.Decimal`. Only settled
  (PAID) redemptions reduce holdings, so in-flight requests never double-count units. This is the
  basis for both distributions and redemption limits.
- **Distributions (Module 7)** — a **pro-rata allocation engine**: a distribution's total amount
  is split across unit holders in proportion to units held,
  `share_i = amount × (units_i / totalUnits)`. Shares are computed at full precision, rounded to
  the cent, and the rounding residual is applied to the largest allocation so the parts sum
  exactly to the total. A **server-enforced approval workflow**
  (`DRAFT → REVIEWED → APPROVED → PROCESSING → PAID`, with `REVIEWED → DRAFT` for corrections)
  gates each step by role — e.g. only Portfolio Manager / Super Admin may approve, only Finance /
  Super Admin may mark paid. Allocations can be recalculated while in DRAFT.
- **Redemptions (Module 8)** — a request auto-calculates its **eligibility date**
  (investor's entry date + fund `lockupMonths`) and **final settlement date**
  (request date + fund `noticeDays`), derives units from the latest NAV, and is capped at the
  investor's held units. A **multi-stage review workflow**
  (`REQUESTED → COMPLIANCE_REVIEW → OPERATIONS_REVIEW → APPROVED → SETTLEMENT_PROCESSING → PAID`,
  with rejection available at each review stage) is role-gated per transition, and **the lock-up
  is enforced** — a redemption cannot be approved before its eligibility date.
- Every distribution and redemption transition is written to **workflow history**, and all
  mutating requests are captured by the global audit interceptor.

## What's implemented (Phase 4 — Investor-facing & Reporting)

- **Investor Portal (Module 9)** — a strictly **read-only, self-scoped** API for investor users.
  Every endpoint resolves the caller's own investor record via `Investor.portalUserId`, so an
  investor can only ever see their own profile, subscriptions, distributions received,
  redemptions, documents (metadata only — no storage keys), and a portfolio statement. The
  frontend routes `INVESTOR`-role users to a dedicated **My Portfolio** view and hides all staff
  navigation.
- **Notifications (Module 11)** — a **pluggable delivery abstraction** (`NotificationSender`)
  mirroring the storage design: a log-only sender ships for development, an email sender
  (SES/SendGrid/SMTP) is selected via `NOTIFICATION_PROVIDER`. Every notification is persisted
  (PENDING → SENT/FAILED) and delivery is **best-effort** — a failed send never rolls back the
  business action that triggered it. Wired to real workflow events: **KYC approved**,
  **redemption requested**, **redemption paid**, and **distribution paid** (one per allocated
  investor).
- **Reporting (Module 12)** — dependency-free **CSV exports** for investors, subscriptions,
  redemptions, distributions, and per-distribution allocations, streamed with the correct
  content-type and RBAC-gated. The frontend Reports page downloads them through the authenticated
  client. PDF/Excel are a documented follow-up (add a formatter over the same queries).

## Enhancements since the initial Phase 1 drop

A follow-up security and completeness review found several gaps between what Phase 1 claimed
and what it actually did. These have been fixed:

**Security / robustness**
- `JwtStrategy` now re-validates the user against the database on every request (previously a
  deactivated or soft-deleted user's existing access token kept working until it naturally
  expired — up to `JWT_ACCESS_EXPIRES_IN`).
- CORS no longer falls back to a wildcard origin combined with `credentials: true` (invalid in
  browsers, and insecure even where it "worked"). It now fails closed — cross-origin requests are
  rejected unless `CORS_ORIGIN` is explicitly set.
- `/auth/login` and `/auth/refresh` now have their own tighter rate limits (5/min and 10/min per
  IP) instead of sharing the generic 120/min app-wide budget, which was far too permissive for a
  credential-stuffing target.
- `GET /investors` pagination is now validated and clamped via `QueryInvestorsDto`
  (`page`/`pageSize` are proper integers, `pageSize` is capped at 100) — previously a bad query
  string produced `NaN` and an unhandled 500 from Prisma.
- `PATCH /investors/:id/stage` and `POST /auth/refresh` now use validated DTOs instead of untyped
  request bodies.

**New capability**
- `GET /investors/relationship-managers` — a minimal id/fullName picklist so Operations and RM
  roles (not just Super Admin) can actually assign a relationship manager when creating/editing an
  investor.
- `GET /health` — an unauthenticated liveness/readiness probe that checks database connectivity,
  wired into `docker-compose.yml`'s backend healthcheck so the frontend container now waits for a
  genuinely healthy backend instead of just "container started."

**Frontend**
- The axios client now does a silent token refresh on a 401 and replays the original request,
  instead of hard-logging-out on every 401 — which previously also fired on a wrong-password
  login attempt itself, yanking the user to a page reload instead of showing the error message.
- **Add investor** — the sidebar/list "+ Add investor" button previously linked to a route that
  didn't exist. `/investors/new` is now a real form (general info, banking, RM assignment).
- **Edit investor** — the investor detail page was read-only; it now has an Edit mode using the
  same form.
- **Onboarding workflow controls** — the detail page now shows the current stage and a button to
  advance to the single legal next stage (mirroring the server-enforced order), plus the
  `ACTIVE → INACTIVE/REDEEMED` terminal transitions.
- **Compliance controls** — KYC / AML / Source-of-funds status and risk rating can now be updated
  directly from the detail page (previously view-only, even though the backend endpoint existed).
- **Documents / Subscriptions / Workflow history** — the detail page's `findOne` call already
  returned this data from the backend; it's now actually rendered instead of silently dropped.

## Gap analysis — assumptions made, and why

The original PRD is a strong scope document but leaves several implementation-critical decisions
open. Rather than block on them, the schema and code below make an explicit, documented
assumption for each so a real developer can override deliberately instead of accidentally:

| Gap in the PRD | Assumption made here | Where to change it |
|---|---|---|
| No management/performance fee fields | Added `managementFeePct` / `performanceFeePct` on `Fund` | `prisma/schema.prisma` → `Fund` |
| No base currency specified | Defaulted to AED (single currency for now) | `Fund.baseCurrency`, frontend `Intl.NumberFormat` |
| Single fund vs. multi-fund unclear | Built **multi-fund-ready** from day one (`Fund` table, all subscriptions/distributions/redemptions are fund-scoped) so adding a second fund later isn't a rewrite | `prisma/schema.prisma` |
| NAV calculation methodology not defined | Manual NAV entry point (`NavSnapshot`) — no calculation engine yet | `prisma/schema.prisma` → `NavSnapshot`; engine is Phase 3 |
| Distribution waterfall (pro-rata vs. hurdle/tiers) not defined | Schema supports simple pro-rata (`DistributionAllocation` per investor); tiered waterfalls are a Phase 3 addition | `distributions` module (not yet built) |
| Redemption lock-up / notice period rules not defined | Added `lockupMonths` / `noticeDays` at the fund level; `Redemption.eligibilityDate` / `finalSettlementDate` are reserved for the auto-calculation logic | `prisma/schema.prisma` → `Fund`, `Redemption` |
| MFA mentioned as "ready" but not specified | `mfaEnabled` / `mfaSecret` fields exist on `User`; TOTP flow itself is not implemented | `auth` module — Phase 2 |
| API documentation format unspecified | Swagger/OpenAPI, auto-generated from code so it can't drift from the real API | `/api/docs` |

## Roadmap

**Phase 1 — Foundation (done).** Auth, RBAC, audit log, Investors, Dashboard.

**Phase 2 — Compliance & documents (done).**
Document upload/versioning/expiry (Module 4) behind a pluggable storage abstraction (local disk
for dev, S3-ready), Compliance Center (Module 5) with alerting for expired/missing documents,
Subscriptions module (Module 6) with automatic fund-unit calculation against `NavSnapshot`.
> Note: the storage abstraction ships with a working local-disk provider; the S3 provider is a
> documented stub (`src/common/storage/s3-storage.service.ts`) to be completed with the AWS SDK.

**Phase 3 — Money movement (done).**
Distributions (Module 7) with a pro-rata calculation engine and a role-gated approval workflow,
Redemptions (Module 8) with automatic eligibility/settlement-date calculation from the fund's
lock-up and notice rules and a multi-stage review workflow with lock-up enforcement.

**Phase 4 — Investor-facing & reporting (done).**
Investor Portal (Module 9, read-only, self-scoped), Notifications (Module 11, pluggable
sender — log provider for dev, email-ready — triggered off workflow events), Reporting
(Module 12) with CSV export (PDF/Excel are a documented follow-up).

Each phase is scoped to be independently deployable — the schema for all of them already exists,
so later phases are additive (new services/controllers), not migrations that touch what's already
in production.

## Getting started

### Option A — Docker Compose (recommended)

```bash
docker compose up --build
```

This starts Postgres, runs the backend on `http://localhost:3000` (Swagger at
`http://localhost:3000/api/docs`), and the frontend on `http://localhost:5173`.

After the first `docker compose up`, run migrations and seed the default Super Admin + fund:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

### Option B — Local development

```bash
# 1. Start Postgres only
docker compose up postgres -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev        # http://localhost:3000, docs at /api/docs

# 3. Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

### Default login (from the seed script)

```
Email:    admin@hadesfund.com
Password: ChangeMe123!
```

**Change this password immediately in any non-local environment.**

> Note on `npx prisma generate`: this was built and type-checked in a network-restricted sandbox
> that could not reach `binaries.prisma.sh`, so the generated Prisma client binaries themselves
> could not be produced here. This is a sandbox limitation only — `npx prisma generate` will run
> normally with standard internet access (it also runs automatically as part of `npm install` via
> Prisma's postinstall hook, and inside the Docker build). The rest of the codebase — every
> `.ts`/`.tsx` file — was type-checked and, for the frontend, fully built with `vite build`.

## Project structure

```
hades-fund-platform/
├── backend/
│   ├── prisma/schema.prisma      # full DB schema — all PRD tables + gap-analysis additions
│   ├── prisma/seed.ts            # seeds Super Admin + default fund
│   └── src/
│       ├── auth/                 # login, JWT strategy, refresh
│       ├── users/                # internal system users (Super Admin only)
│       ├── investors/            # investor registry + onboarding workflow
│       ├── dashboard/            # KPI + chart aggregation endpoints
│       ├── documents/            # Phase 2 — document upload/versioning/expiry
│       ├── funds/                # Phase 2 — funds + NAV snapshots
│       ├── subscriptions/        # Phase 2 — subscriptions + auto fund-unit calc
│       ├── compliance/           # Phase 2 — compliance review queue + doc alerts
│       ├── holdings/             # Phase 3 — net fund-unit holdings engine
│       ├── distributions/        # Phase 3 — pro-rata distributions + approval workflow
│       ├── redemptions/          # Phase 3 — redemptions + eligibility/settlement workflow
│       ├── notifications/        # Phase 4 — pluggable notification sender + event triggers
│       ├── portal/               # Phase 4 — read-only, self-scoped investor portal
│       ├── reporting/            # Phase 4 — CSV exports
│       ├── health/               # liveness/readiness probe
│       ├── common/                # RBAC guard/decorator, audit interceptor, storage abstraction
│       └── prisma/                # PrismaService (DB client)
├── frontend/
│   └── src/
│       ├── api/                   # typed API client functions
│       ├── context/AuthContext.tsx
│       ├── components/            # Sidebar, AppShell, KpiCard, StatusBadge, investor panels
│       ├── lib/                   # shared helpers (currency/date/units formatting)
│       └── pages/                 # Login, Dashboard, Investors, Compliance, Distributions,
│                                  #   Redemptions, Reports, Notifications, Portal (My Portfolio)
└── docker-compose.yml
```

## Roles (RBAC)

`SUPER_ADMIN`, `OPERATIONS`, `COMPLIANCE_OFFICER`, `RELATIONSHIP_MANAGER`, `PORTFOLIO_MANAGER`,
`FINANCE`, `INVESTOR` — enforced server-side via `@Roles()` on every controller method, not just
hidden in the UI.

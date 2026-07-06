# Hades Fund Management Platform

A web-based fund management platform replacing Excel-based operations: investors, subscriptions,
fund units, KYC/compliance, distributions, redemptions, documents, reporting, and dashboard
analytics.

This repository contains **Phase 1: Foundation** — a working, buildable skeleton with real
authentication, RBAC, audit logging, the full database schema, and two fully implemented
modules (Investor Registry, Dashboard). It is meant to be handed to a development team (or
built on directly) as a correct, opinionated starting point rather than a finished product —
see [Roadmap](#roadmap) below for what's next.

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

**Phase 1 — Foundation (this repo).** Auth, RBAC, audit log, Investors, Dashboard.

**Phase 2 — Compliance & documents.**
Document upload/versioning/expiry (Module 4) with real S3/Azure Blob storage, Compliance Center
(Module 5) with alerting for expired/missing documents, Subscriptions module (Module 6) with
automatic fund-unit calculation against `NavSnapshot`.

**Phase 3 — Money movement.**
Distributions (Module 7) including the approval workflow and a real waterfall/pro-rata
calculation engine, Redemptions (Module 8) including automatic eligibility/settlement date
calculation from the fund's lock-up and notice rules.

**Phase 4 — Investor-facing & reporting.**
Investor Portal (Module 9, read-only), Notifications (Module 11, email via a provider like SES/
SendGrid triggered off the audit log / workflow history), Reporting (Module 12) with PDF/Excel/
CSV export.

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
│       ├── common/                # RBAC guard/decorator, audit interceptor
│       └── prisma/                # PrismaService (DB client)
├── frontend/
│   └── src/
│       ├── api/                   # typed API client functions
│       ├── context/AuthContext.tsx
│       ├── components/            # Sidebar, AppShell, KpiCard, StatusBadge
│       └── pages/                 # Login, Dashboard, Investors
└── docker-compose.yml
```

## Roles (RBAC)

`SUPER_ADMIN`, `OPERATIONS`, `COMPLIANCE_OFFICER`, `RELATIONSHIP_MANAGER`, `PORTFOLIO_MANAGER`,
`FINANCE`, `INVESTOR` — enforced server-side via `@Roles()` on every controller method, not just
hidden in the UI.

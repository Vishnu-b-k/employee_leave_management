# Employee Leave Management System - Task Board

**Last Updated:** 2026-11-06

---

## Phase Status

| Phase | Status | Documents | Notes |
|---|---|---|---|
| Requirements Analysis | **Complete** | [01_REQUIREMENTS_ANALYSIS.md](docs/01_REQUIREMENTS_ANALYSIS.md), [01_DECISION_REGISTER.md](docs/01_DECISION_REGISTER.md), [01_REQUIREMENTS_BASELINE.md](docs/01_REQUIREMENTS_BASELINE.md) | 12 confirmed, 3 proposed policies, 10 open |
| Architecture | **Steps 1–2 Complete** | [02_ARCHITECTURE_DECISION.md](docs/02_ARCHITECTURE_DECISION.md), [03_DATABASE_DESIGN.md](docs/03_DATABASE_DESIGN.md) | Next.js full-stack + PostgreSQL + MinIO. 12 ADRs. Database fully modelled. |
| API Contract | Not Started | - | Depends on architecture phase |
| Implementation | **Steps 1–2 Complete** | [user.service.ts](src/modules/users/user.service.ts), [rbac.ts](src/lib/auth/rbac.ts) | Foundation, DB, Firebase Auth, PostgreSQL-backed RBAC, Session Cookies, Dashboards |
| Testing | Not Started | - | Depends on implementation |
| Packaging | In Progress | [Dockerfile](Dockerfile), [docker-compose.yml](docker-compose.yml) | Multi-stage Dockerfile and docker-compose.yml created |

---

## Completed: Requirements Analysis

### Step 1 - Initial Analysis

- [x] Stakeholder and role analysis (Employee, Manager, HOD)
- [x] Functional requirements (60+ requirements across 10 categories)
- [x] Non-functional requirements (11 quality dimensions)
- [x] Business workflow analysis (10 scenarios)
- [x] Data entity definitions (10 core entities)
- [x] Validation requirements (field, date, document, workflow, business rules)
- [x] Authorization matrix (full RBAC for all resources and actions)
- [x] Security threat inventory (15 specific threats)
- [x] Acceptance criteria (30+ testable criteria for mandatory features)
- [x] Initial ambiguity register (15 decisions identified)

### Step 2 - Decision Resolution and Baseline

- [x] Confirmed 12 original decisions (DR-01 through DR-10, DR-14, DR-15)
- [x] Added APPROVED_ON_APPEAL as distinct status (10 states total)
- [x] Created state transition table with valid transitions
- [x] Created explicitly invalid transitions list
- [x] Updated technology references (database-agnostic, PostgreSQL direction)
- [x] Updated notification requirements to Mandatory (DR-05)
- [x] Added concurrency rules (DR-15)
- [x] Identified 10 new open decisions (DR-16 through DR-25, non-blocking)
- [x] Created requirements baseline document

### Step 3 - Final Consistency Review

- [x] Renamed PENDING to PENDING_MANAGER throughout all documents
- [x] Renamed MANAGER_APPROVED to PENDING_HOD (Manager's approval recorded in decision history, not as independent state)
- [x] Validated full workflow graph: all transitions verified
- [x] Reclassified DR-11/12/13 as proposed policies awaiting owner confirmation
- [x] Verified all original assignment requirements represented in baseline
- [x] Baseline clearly distinguishes: assignment requirements, confirmed decisions, proposed policies, unresolved items
- [x] Updated all four documents to consistent state

---

## Completed: Architecture Design

### Step 1 - System Architecture Decision

- [x] Evaluated 3 architecture options (Firebase-centric, Hybrid FastAPI, Next.js full-stack)
- [x] Selected Option C: Next.js full-stack with PostgreSQL + MinIO
- [x] Justified against DR-15 (ACID transactions), DR-08 (Docker assessment), single-language benefits
- [x] Defined technology stack: Next.js 14+, TypeScript, PostgreSQL 16, Prisma, Firebase Auth, AWS SDK v3
- [x] Designed layered architecture: Presentation → API → Middleware → Service → Repository → Infrastructure
- [x] Designed 7 services: Auth, Workflow, LeaveRequest, Document, Notification, Audit, Holiday
- [x] Defined state machine implementation with transition map and guard functions
- [x] Defined authentication flow: Firebase token → Admin SDK verify → PostgreSQL user lookup
- [x] Defined 4-layer authorization: Route Guard, Resource Guard, State Guard, Database Guard
- [x] Designed database schema (11 tables, UUIDs, enums, partial indexes, append-only audit)
- [x] Defined transaction pattern (SELECT FOR UPDATE + version check + COMMIT)
- [x] Designed S3 storage abstraction (MinIO assessment, S3 production, single interface)
- [x] Designed notification architecture (synchronous in-transaction, polling delivery)
- [x] Defined API route structure (RESTful, action-based workflow endpoints)
- [x] Defined 5-container Docker Compose topology (app, postgres, minio, firebase-emulator, seed-runner)
- [x] Defined fault tolerance strategy for each external dependency
- [x] Defined scaling path with specific triggers
- [x] Documented 7 key trade-offs with justifications
- [x] Listed 8 deferred decisions
- [x] Recorded 12 architecture decision records (ADR-01 through ADR-12)
- [x] Explicitly excluded Redis, message queues, microservices, K8s with justification

---

## Decision Classification Summary

| Category | Count | IDs |
|---|---|---|
| Confirmed Decisions | 12 | DR-01 through DR-10, DR-14, DR-15 |
| Proposed Policies (awaiting confirmation) | 3 | DR-11, DR-12, DR-13 |
| Open Decisions (non-blocking) | 10 | DR-16 through DR-25 |
| Architecture Decision Records | 12 | ADR-01 through ADR-12 |

---

## Upcoming Phases

### Architecture (Remaining Steps)

- [ ] Detailed database schema (Prisma schema file design)
- [ ] API contract specification (request/response schemas)

### API Contract

- [ ] RESTful API endpoint definitions
- [ ] Request/response schemas
- [ ] Error response standards
- [ ] Authentication flow documentation

### Implementation

- [ ] Project scaffolding
- [ ] Backend implementation
- [ ] Frontend implementation
- [ ] Integration

### Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] Acceptance criteria verification

### Packaging

- [ ] Dockerfiles
- [ ] docker-compose.yml
- [ ] README with run instructions
- [ ] Seed script
- [ ] ZIP packaging

---

## Completed: Database Architecture (Architecture Step 2)

- [x] Design objectives and principles defined (3NF, immutability, concurrency, Firebase isolation, multi-role)
- [x] 8 PostgreSQL enum types defined (user_status, app_role, leave_status, workflow_action, upload_phase, appeal_status, notification_event)
- [x] 12 entities designed with full column specifications: departments, users, user_roles, leave_type_configs, leave_requests, decisions, appeals, documents, holidays, notifications, audit_logs, system_config
- [x] Multi-role design: user_roles join table supports Employee+Manager and Employee+HOD combinations
- [x] DR-10 (Manager's own leave): manager_id on users points to HOD; no special workflow logic required
- [x] Circular FK (users <-> departments) resolved with two-pass seed bootstrap
- [x] All 10 workflow states represented in leave_status enum
- [x] 12 workflow action codes represented in workflow_action enum
- [x] Optimistic concurrency: version column on leave_requests, SELECT FOR UPDATE pattern
- [x] Append-only enforcement: REVOKE UPDATE/DELETE on decisions and audit_logs
- [x] Partial unique index: one active appeal per request (appeals WHERE status='PENDING')
- [x] Partial performance index: active request queue (leave_requests WHERE status IN active states)
- [x] All referential integrity / deletion policies specified for every FK
- [x] Full ER diagram (Mermaid) with all 12 entities and relationships
- [x] 7 unique constraints, 5 CHECK constraints documented
- [x] 36+ indexes specified with rationale
- [x] Transaction boundary pattern defined (8-step, atomic: state update + decision + audit + notification)
- [x] 4 concurrency scenarios analyzed
- [x] Data retention and privacy policy per table
- [x] DB user GRANT/REVOKE permissions specified
- [x] Seed data strategy: 7 users, 1 department, 4 leave types, holidays, 8-pass bootstrap order
- [x] Seed idempotency: INSERT ON CONFLICT DO NOTHING
- [x] Prisma compatibility: 6 natively supported features, 4 custom migration SQL items identified
- [x] 10 open database decisions recorded (DR-11 through DR-20, DBO-01)
- [x] DR-11/12/13 (unconfirmed policies): NOT enforced as CHECK constraints; handled via system_config table

---

## Completed: Implementation Step 1 — Project Foundation and Database

- [x] Next.js App Router project initialized with TypeScript and Tailwind CSS v4.
- [x] Modular codebase directory structure established (`src/app/api/v1`, `src/components`, `src/modules/*`, `src/lib`, `src/types`).
- [x] Complete Prisma schema implemented with all approved entities, enums, relations, composite keys, and justified indexes.
- [x] Custom SQL migration script created (`prisma/migrations/20261106000000_init/migration.sql`) including:
  - Partial unique index on `appeals` (one active pending appeal per request)
  - Partial index on `leave_requests` active workflow status queue
  - PostgreSQL CHECK constraints for working days, dates, and allocations
  - Database-level trigger functions enforcing immutability on `audit_logs` and `decisions` across all database roles (including table owner)
  - Dedicated `app_user` role creation with least-privilege permissions (no UPDATE/DELETE on audit_logs or decisions)
- [x] Multi-stage production `Dockerfile` with standalone Next.js runner, Prisma client, and built-in curl healthcheck.
- [x] `docker-compose.yml` orchestrating PostgreSQL 16 Alpine, persistent volume `pgdata`, health checks, one-shot migration runner, and Next.js app on unified bridge network.
- [x] `.env.example` and local `.env` configured without hardcoding secrets.
- [x] Working health check endpoints:
  - `GET /api/v1/health/live` (process uptime & service identity)
  - `GET /api/v1/health/ready` (active PostgreSQL query probe)
- [x] Distinctive professional HR SaaS landing page implemented with warm neutral palette (`#FBFBFA`), deep forest-green accents (`#143628`), and interactive endpoint links.
- [x] Verified build (`next build`), Prisma client generation (`prisma generate`), development server startup, and endpoint responses.

---

## Completed: Implementation Step 2 — Authentication and RBAC

- [x] Firebase Client SDK configured with Auth Emulator support (`src/lib/firebase/client.ts`).
- [x] Firebase Admin SDK configured with session cookie, ID token verification, and token revocation utilities (`src/lib/firebase/admin.ts`).
- [x] PostgreSQL authoritative user resolution (`UserService.resolveByFirebaseUid` in `src/modules/users/user.service.ts`):
  - Validates user existence and active status in PostgreSQL (`user.status === 'ACTIVE'`).
  - Resolves multi-role assignments from `user_roles` join table.
  - Resolves departmental placement and manager reporting hierarchies (DR-10).
  - Denies inactive accounts with 403 `USER_INACTIVE`.
- [x] Server-side RBAC and resource authorization engine (`RBAC` in `src/lib/auth/rbac.ts`):
  - Deny-by-default architecture.
  - Employee own-request boundary enforced.
  - Manager direct report boundary enforced (DR-01: managers only review assigned employees).
  - Departmental HOD boundary enforced.
  - Prohibition of self-approval strictly enforced across all approval operations.
  - Prevention of privilege escalation (employees cannot invoke approval actions; managers cannot invoke HOD-only actions).
- [x] Authentication API endpoints:
  - `POST /api/v1/auth/login`: Supports both Firebase client ID token exchange and direct credentials, IP-based rate limiting (5 attempts/min), generic error messages, secure HTTP-only session cookies, and CSRF tokens.
  - `POST /api/v1/auth/logout`: Revokes Firebase refresh tokens and clears session and CSRF cookies.
  - `GET /api/v1/auth/me`: Validates session cookie or bearer token and returns current user with authoritative roles.
- [x] Security controls implemented:
  - Token signature and revocation checks.
  - CSRF cookie and custom header validation (`src/lib/auth/csrf.ts`).
  - Sliding-window login rate limiting (`src/lib/auth/rate-limiter.ts`).
  - Protected session cookies (`HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=5 days`).
- [x] Frontend authentication experience:
  - Client `AuthProvider` and `useAuth()` hook (`src/modules/auth/auth-context.tsx`).
  - Login page (`src/app/login/page.tsx`) with demo account quick-fill buttons and error states.
  - Next.js route protection middleware (`src/middleware.ts`) redirecting unauthenticated users to `/login`.
  - Authenticated Dashboard overview (`src/app/dashboard/page.tsx`) displaying profile, organizational placement, and available role workspaces.
  - Dedicated Employee dashboard shell (`src/app/dashboard/employee/page.tsx`).
  - Dedicated Manager dashboard shell (`src/app/dashboard/manager/page.tsx`) with assigned direct reports scope (DR-01).
  - Dedicated HOD dashboard shell (`src/app/dashboard/hod/page.tsx`) with 2nd-level approvals and appeals oversight.
  - Unauthorized 403 state page (`src/app/unauthorized/page.tsx`).
- [x] Repeatable demo account seeding utility (`src/lib/seed/seed-auth.ts`, `scripts/seed-auth.ts`) provisioning Employee, Manager, and HOD in Firebase Auth and linking them to PostgreSQL.
- [x] Full RBAC test suite (`scripts/test-auth-rbac.ts`) executed and verified: **31 out of 31 tests passed**.
- [x] Production build (`npm run build`) passed with zero errors. All routes verified.

---

## Upcoming Phases

### Architecture (Remaining Steps)

- [ ] API contract specification (request/response schemas, OpenAPI or equivalent)

### API Contract

- [ ] Route definitions and HTTP methods
- [ ] Request validation schemas (zod)
- [ ] Response shapes per role
- [ ] Error code catalogue
- [ ] Authentication flow documentation

### Implementation

- [ ] Project scaffolding
- [ ] Backend implementation
- [ ] Frontend implementation
- [ ] Integration

### Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] Acceptance criteria verification

### Packaging

- [ ] Dockerfiles
- [ ] docker-compose.yml
- [ ] README with run instructions
- [ ] Seed script
- [ ] ZIP packaging

---

*End of Task Board*

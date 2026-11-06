# Employee Leave Management System — Architecture Decision

**Document ID:** 02_ARCHITECTURE_DECISION
**Version:** 1.1
**Status:** Reviewed
**Date:** 2026-11-06
**Input Documents:**
- [01_REQUIREMENTS_BASELINE.md](01_REQUIREMENTS_BASELINE.md)
- [01_DECISION_REGISTER.md](01_DECISION_REGISTER.md)

---

## 1. Architecture Option Comparison

### 1.1 Options Evaluated

| Criterion | A: Firebase-Centric | B: Next.js + FastAPI + PostgreSQL | C: Next.js Full-Stack (Recommended) |
|---|---|---|---|
| **Frontend** | React SPA | Next.js (SSR/SSG) | Next.js (SSR/SSG) |
| **Backend** | Firebase Functions (Node.js) | FastAPI (Python) | Next.js Route Handlers (`app/api/**/route.ts`) with service/repository modules |
| **Auth** | Firebase Auth | Firebase Auth | Firebase Auth |
| **Database** | Firestore | PostgreSQL | PostgreSQL |
| **File Storage** | Cloud Storage | MinIO / S3 | MinIO / S3 |
| **Transactional Integrity** | Firestore supports atomic transactions with serializable isolation within a transaction scope. However, it lacks relational constraints (foreign keys, CHECK constraints, unique multi-column constraints) that PostgreSQL enforces at the database level. Concurrency control relies on OCC with automatic retries rather than row-level locking. | Full ACID. PostgreSQL native transactions with optimistic locking, row-level locking, and relational constraints. | Full ACID. Same as B. |
| **Data Modeling and Reporting** | Document-oriented. Requires denormalization for the 10-entity relational model. No native JOINs. Complex reporting (e.g., leave requests + decisions + documents + user profiles) requires multiple reads or data duplication. Relational integrity enforced only in application code. | Relational model maps directly to requirements. JOINs, foreign keys, aggregations, and partial indexes are native. | Same as B. |
| **State Machine with Version Control** | Supports optimistic concurrency via transaction retries. No native `SELECT ... FOR UPDATE` equivalent. Version-check-and-set must be implemented within Firestore transaction callbacks. Workable but less idiomatic than SQL for this pattern. | Native `SELECT ... FOR UPDATE`, version column, transactional state transitions. Idiomatic for workflow engines. | Same as B. |
| **Assessment Portability** | Requires Firebase emulators (flaky, heavy). No real PostgreSQL. | Two runtimes (Node.js + Python). Docker image complexity. Cross-language type sharing. | Single runtime (Node.js). Fewer Docker images. Simpler debugging. |
| **Query Complexity** | Firestore has limited JOIN support. Leave requests + decisions + documents require multiple reads or denormalization. | Full SQL JOINs. Complex reporting queries native. | Same as B. |
| **Developer Experience** | Firebase SDK. Fast initial setup. Limited flexibility for complex workflows. | FastAPI excellent for APIs. Type safety in Python. But two languages in the project. | Single language (TypeScript) across frontend and backend. Shared types. |
| **Production Scaling** | Firebase auto-scales. Pay-per-use. | Horizontal scaling via load balancer. | Same as B. Stateless API routes scale horizontally. |
| **Testing** | Firebase emulators are slow, incomplete. Integration tests require emulator suite. | Standard PostgreSQL test containers. pytest for backend. | Jest/Vitest for all tests. testcontainers for PostgreSQL. Unified test runner. |
| **Operational Cost** | Firebase pricing can spike unpredictably at scale. | Predictable PostgreSQL hosting costs. | Same as B. |

### 1.2 Decision

**Option C: Next.js Full-Stack** is recommended.

### 1.3 Justification

| Factor | Reasoning |
|---|---|
| **DR-15 (Concurrency)** | PostgreSQL is preferred for the transactional state machine. While Firestore supports atomic transactions with serializable isolation, the 10-entity relational model (leave requests, decisions, appeals, documents, users, departments) maps poorly to a document database. Relational constraints, JOINs for dashboard views, and partial indexes for active request queues are native in PostgreSQL but require denormalization or multiple reads in Firestore. This, combined with the data modeling disadvantage, favours PostgreSQL. |
| **DR-08 (Assessment Environment)** | Docker Compose with PostgreSQL + MinIO is confirmed. Option A cannot provide real PostgreSQL in assessment mode. |
| **Single Language** | TypeScript across frontend and backend eliminates cross-language type drift, reduces Docker image count, and simplifies debugging. This favours Option C over Option B. |
| **Assessment Simplicity** | One Next.js container vs. separate frontend + FastAPI containers. Fewer moving parts for the evaluator. |
| **Production Viability** | Next.js API routes are stateless, independently deployable, and proven in production. When scale demands it, specific routes can be extracted to standalone services. |
| **Not a Monolith Limitation** | The internal architecture is a modular monolith: clean layer separation (routes → services → repositories → database). Modules can be extracted to microservices without rewriting business logic. |

**Option A rejected:** While Firestore does support ACID transactions, the 10-entity relational model requires JOINs, foreign-key constraints, partial indexes, and reporting aggregations that are native to PostgreSQL but require extensive denormalization in Firestore. Combined with the DR-08 requirement for PostgreSQL in the assessment environment, Option A introduces unnecessary data-modeling complexity without proportional benefit.

**Option B rejected:** Sound technically, but adds operational complexity (two runtimes, two Docker images, cross-language types) without proportional benefit for this scope.

---

## 2. Recommended Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend Framework** | Next.js (stable release at implementation time, App Router) | SSR for landing page SEO, client components for dashboards, built-in Route Handlers. Exact version selected at project initialization; all dependencies pinned via package lockfile (`package-lock.json`). |
| **Language** | TypeScript | Type safety across frontend and backend, shared interfaces |
| **Backend Runtime** | Node.js 20 LTS | Stable, long-term support, native to Next.js |
| **Database** | PostgreSQL 16 | ACID transactions, optimistic locking, complex JOINs, mature ecosystem |
| **ORM / Query Builder** | Prisma | Type-safe database access, migration management, introspection, assessment-friendly schema provisioning |
| **Authentication** | Firebase Auth (client SDK) + Firebase Admin SDK (server verification) | Confirmed by assignment. Emulator for assessment. |
| **File Storage** | S3-compatible via AWS SDK v3 | MinIO in assessment (DR-08), AWS S3 / GCS in production. Single SDK for both. |
| **Containerization** | Docker + Docker Compose | Confirmed (DR-08). Multi-service orchestration. |
| **Testing** | Vitest + React Testing Library + Supertest | Fast, TypeScript-native, compatible with Next.js |
| **Linting / Formatting** | ESLint + Prettier | Standard tooling |

### 2.1 Explicitly Not Included

| Technology | Reason for Exclusion |
|---|---|
| Redis | No requirement for caching or session storage. Firebase Auth handles sessions. PostgreSQL handles notification queries. Add only if measured latency issues arise. |
| Message Queue (RabbitMQ, etc.) | No async processing requirement. Notifications are created synchronously within the same transaction as state transitions. Add only if background email delivery is implemented. |
| GraphQL | REST is simpler, sufficient for the entity-oriented API. No deeply nested or highly variable queries. |
| Microservices | Single deployment unit is appropriate for this scope. Modular monolith achieves separation without operational overhead. |
| Kubernetes | Docker Compose is the confirmed assessment topology. K8s is production-optional and out of scope. |

---

## 3. Architecture Diagram

### 3.1 System Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        FE["Next.js Frontend<br/>(React + SSR)"]
    end

    subgraph "Next.js Application Server"
        API["Route Handlers<br/>(app/api/**/route.ts)"]
        SSR["Server Components<br/>(Landing, Dashboards)"]
        MW["Middleware<br/>(Auth Guard + RBAC)"]
    end

    subgraph "Service Layer"
        LRS["LeaveRequestService"]
        WFS["WorkflowService<br/>(State Machine)"]
        NTS["NotificationService"]
        ADS["AuditService"]
        DCS["DocumentService"]
        AUS["AuthService"]
        HLS["HolidayService"]
    end

    subgraph "Data Access Layer"
        LRR["LeaveRequestRepo"]
        USR["UserRepo"]
        DCR["DocumentRepo"]
        NTR["NotificationRepo"]
        ADR["AuditRepo"]
        APR["AppealRepo"]
    end

    subgraph "External Services"
        PG[("PostgreSQL 16")]
        MIO[("MinIO / S3")]
        FA["Firebase Auth<br/>(Emulator or Cloud)"]
    end

    FE -->|"HTTPS / REST"| MW
    MW -->|"Verify Token"| FA
    MW --> API
    MW --> SSR
    API --> LRS
    API --> DCS
    API --> AUS
    LRS --> WFS
    LRS --> NTS
    LRS --> ADS
    WFS --> LRR
    WFS --> ADR
    DCS --> DCR
    DCS --> MIO
    NTS --> NTR
    LRR --> PG
    USR --> PG
    DCR --> PG
    NTR --> PG
    ADR --> PG
    APR --> PG
```

### 3.2 Docker Compose Topology (Assessment)

```mermaid
graph LR
    subgraph "Docker Compose Network"
        APP["nextjs-app<br/>:3000"]
        PG["postgres<br/>:5432"]
        MIO["minio<br/>:9000 / :9001"]
        FBE["firebase-emulator<br/>:9099"]
        SEED["seed-runner<br/>(one-shot)"]
    end

    APP -->|"SQL"| PG
    APP -->|"S3 API"| MIO
    APP -->|"Auth verify"| FBE
    SEED -->|"Admin SDK"| FBE
    SEED -->|"Prisma seed"| PG
    SEED -->|"Create buckets"| MIO
```

**5 containers total.** The seed runner executes once, provisions data, then exits.

### 3.3 Docker Networking, Volumes, Health Checks, and Startup Order

**Network:**
All containers share a single user-defined bridge network (`leave-net`). Service names (`postgres`, `minio`, `firebase-emulator`) serve as DNS hostnames for inter-container communication. Only the Next.js app exposes port 3000 to the host; infrastructure ports are internal-only.

**Persistent Volumes:**

| Service | Volume | Purpose | Assessment Behavior |
|---|---|---|---|
| PostgreSQL | `pgdata:/var/lib/postgresql/data` | Database files survive container restarts | Named volume. Survives `docker compose down`. Destroyed only with `docker compose down -v`. |
| MinIO | `miniodata:/data` | Uploaded documents survive container restarts | Named volume. Same lifecycle as pgdata. |
| Firebase Emulator | None (ephemeral) | Auth state re-seeded on every startup | Intentional. Seed runner re-creates accounts. Guarantees consistent evaluator experience. |

**Health Checks:**

| Service | Health Check Command | Interval | Start Period |
|---|---|---|---|
| PostgreSQL | `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB` | 5s | 10s |
| MinIO | `curl -f http://localhost:9000/minio/health/live` | 10s | 15s |
| Firebase Emulator | `curl -f http://localhost:9099/` | 10s | 20s |
| Next.js App | `curl -f http://localhost:3000/api/health` | 15s | 30s |

**Startup Dependencies (`depends_on` with `condition: service_healthy`):**

```
nextjs-app:
  depends_on:
    postgres:            { condition: service_healthy }
    minio:               { condition: service_healthy }
    firebase-emulator:   { condition: service_healthy }

seed-runner:
  depends_on:
    postgres:            { condition: service_healthy }
    minio:               { condition: service_healthy }
    firebase-emulator:   { condition: service_healthy }
```

Both the seed runner and the app wait for all three infrastructure services to pass their health checks before starting. This eliminates race conditions on first launch and ensures the seed script never runs against an unready database.

**Restart Policy:**
- `postgres`, `minio`, `firebase-emulator`, `nextjs-app`: `restart: unless-stopped`
- `seed-runner`: `restart: "no"` (one-shot; exits cleanly after provisioning)

---

## 4. Component Responsibilities

### 4.1 Layered Architecture

```
┌─────────────────────────────────────────────┐
│  Presentation Layer (Next.js Pages/Components) │
├─────────────────────────────────────────────┤
│  Route Handler Layer (app/api/**/route.ts)  │
│  - Versioned REST endpoints                │
│  - Input validation (zod)                   │
│  - HTTP error mapping                       │
│  - Request/response serialization           │
│  - NO business logic in route handlers      │
├─────────────────────────────────────────────┤
│  Middleware Layer                            │
│  - Firebase token verification              │
│  - Role extraction                          │
│  - Route-level RBAC guards                  │
├─────────────────────────────────────────────┤
│  Service Layer                              │
│  - Business logic                           │
│  - State machine transitions                │
│  - Orchestration (notify + audit + persist) │
│  - Authorization (resource-level checks)    │
├─────────────────────────────────────────────┤
│  Repository Layer (Prisma)                  │
│  - Database queries                         │
│  - Transaction management                   │
│  - No business logic                        │
├─────────────────────────────────────────────┤
│  Infrastructure Layer                       │
│  - PostgreSQL connection                    │
│  - S3 client                                │
│  - Firebase Admin SDK                       │
│  - Notification providers                   │
└─────────────────────────────────────────────┘
```

### 4.2 Service Responsibilities

| Service | Responsibility | Key Dependencies |
|---|---|---|
| **AuthService** | Verify Firebase tokens, resolve user profile + role from database, enforce role exists | Firebase Admin SDK, UserRepo |
| **WorkflowService** | Validate state transitions against the 10-state machine, enforce business rules (>3 day threshold, self-approval prevention, appeal eligibility), execute transitions within transactions, increment version | LeaveRequestRepo, AuditRepo |
| **LeaveRequestService** | Orchestrate leave CRUD: validate input, calculate working days, call WorkflowService for transitions, trigger notifications, trigger audit | WorkflowService, NotificationService, AuditService, HolidayService |
| **DocumentService** | Upload/download documents via S3 abstraction, validate MIME/size/extension, generate authorized download URLs, link to leave request | S3 client, DocumentRepo |
| **NotificationService** | Create in-app notifications on workflow events, provider interface for future email | NotificationRepo |
| **AuditService** | Create immutable audit log entries, record actor/role/action/resource/timestamp/metadata | AuditRepo |
| **HolidayService** | Calculate working days, check holiday calendar, validate dates | HolidayRepo |

### 4.3 State Machine Design

The WorkflowService contains a transition map:

```
TRANSITION_MAP = {
  PENDING_MANAGER: {
    APPROVE:      { guard: isAssignedManager && !isSelfApproval, 
                    next: (req) => req.calculatedWorkingDays <= 3 ? APPROVED : PENDING_HOD },
    REJECT:       { guard: isAssignedManager, requiresComment: true, next: REJECTED_BY_MANAGER },
    REQUEST_INFO: { guard: isAssignedManager, requiresComment: true, next: INFO_REQUESTED },
    EDIT:         { guard: isOwner, next: PENDING_MANAGER },
    CANCEL:       { guard: isOwner, next: CANCELLED }
  },
  INFO_REQUESTED: {
    RESUBMIT:     { guard: isOwner, next: PENDING_MANAGER }
  },
  PENDING_HOD: {
    HOD_APPROVE:  { guard: isDepartmentHOD && !isSelfApproval, next: APPROVED },
    HOD_REJECT:   { guard: isDepartmentHOD, requiresComment: true, next: REJECTED_BY_HOD }
  },
  REJECTED_BY_MANAGER: {
    APPEAL:       { guard: isOwner && noActiveAppeal, next: UNDER_APPEAL }
  },
  UNDER_APPEAL: {
    APPEAL_APPROVE: { guard: isDepartmentHOD, next: APPROVED_ON_APPEAL },
    APPEAL_REJECT:  { guard: isDepartmentHOD, requiresComment: true, next: APPEAL_REJECTED }
  }
  // Terminal states (APPROVED, APPROVED_ON_APPEAL, REJECTED_BY_HOD, APPEAL_REJECTED, CANCELLED) 
  // have no entries — any action on them returns 409.
}
```

Every transition executes within a PostgreSQL transaction:
1. `SELECT ... WHERE id = $1 AND version = $2 FOR UPDATE`
2. Validate current state matches expected "from" state.
3. Execute guard function.
4. Update status + increment version.
5. Insert Decision record.
6. Insert Audit Log entry.
7. Insert Notification record(s).
8. COMMIT or ROLLBACK.

---

## 5. Data and Request Flows

### 5.1 Leave Submission Flow

```mermaid
sequenceDiagram
    participant E as Employee Browser
    participant MW as Middleware
    participant API as API Route
    participant LRS as LeaveRequestService
    participant WFS as WorkflowService
    participant PG as PostgreSQL
    participant S3 as MinIO/S3

    E->>MW: POST /api/leave-requests (token + body)
    MW->>MW: Verify Firebase token
    MW->>PG: Lookup user profile + role
    MW->>API: Attach user context
    API->>API: Validate input (zod schema)
    API->>LRS: createLeaveRequest(user, data, files)
    LRS->>LRS: Calculate working days (excl. holidays)
    LRS->>LRS: Validate documents if >3 days
    
    alt Has file attachments
        LRS->>S3: Upload files
        S3-->>LRS: Storage paths
    end
    
    LRS->>PG: BEGIN TRANSACTION
    LRS->>PG: INSERT leave_request (status=PENDING_MANAGER)
    LRS->>PG: INSERT document records
    LRS->>PG: INSERT audit_log (SUBMIT)
    LRS->>PG: INSERT notification (to Manager)
    LRS->>PG: COMMIT
    LRS-->>API: Created request
    API-->>E: 201 Created
```

### 5.2 Manager Approval Flow (Long Leave)

```mermaid
sequenceDiagram
    participant M as Manager Browser
    participant MW as Middleware
    participant WFS as WorkflowService
    participant PG as PostgreSQL

    M->>MW: PATCH /api/leave-requests/:id/approve (token + comment)
    MW->>MW: Verify token, resolve role=Manager
    MW->>WFS: processAction(requestId, APPROVE, manager, version)
    WFS->>PG: BEGIN TRANSACTION
    WFS->>PG: SELECT * FROM leave_requests WHERE id=$1 AND version=$2 FOR UPDATE
    WFS->>WFS: Assert status=PENDING_MANAGER
    WFS->>WFS: Assert manager is assigned manager
    WFS->>WFS: Assert not self-approval
    WFS->>WFS: Determine next state (>3 days → PENDING_HOD)
    WFS->>PG: UPDATE status=PENDING_HOD, version=version+1
    WFS->>PG: INSERT decision (action=APPROVE, actor=manager)
    WFS->>PG: INSERT audit_log
    WFS->>PG: INSERT notification (to HOD + Employee)
    WFS->>PG: COMMIT
    WFS-->>M: 200 OK (updated request)
```

### 5.3 Document Download Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant API as API Route
    participant DS as DocumentService
    participant PG as PostgreSQL
    participant S3 as MinIO/S3

    U->>API: GET /api/documents/:id/download (token)
    API->>PG: Lookup document + parent leave request
    API->>API: Verify user authorization (owner, assigned manager, or dept HOD)
    API->>S3: GetObject(storagePath)
    S3-->>API: File stream
    API-->>U: 200 OK (file stream, Content-Disposition)
```

---

## 6. Authentication and Authorization Architecture

### 6.1 Authentication Flow

```
1. Client: Firebase Auth SDK → signInWithEmailAndPassword()
2. Client: Firebase returns ID token (JWT)
3. Client: Sends token in Authorization: Bearer <token> header
4. Server Middleware: Firebase Admin SDK → verifyIdToken(token)
5. Server Middleware: Extract UID from verified token
6. Server Middleware: Query PostgreSQL users table by firebase_uid
7. Server Middleware: Read CURRENT role, departmentId, managerId, status from the user record
8. Server Middleware: Reject if user record not found or status != ACTIVE (HTTP 403)
9. Server Middleware: Attach { userId, role, departmentId, managerId } to request context
10. Route Handler: Uses request context for authorization decisions
```

**Key design — role always from PostgreSQL:** The user's role, department, and manager assignment are read from the **current** PostgreSQL user record on every authenticated request. Firebase is identity-only (UID + email verification). The database record is the single source of truth for authorization. This means:
- Role changes take effect immediately (no token refresh required).
- Deactivated users are blocked even if their Firebase token is still valid.
- No reliance on Firebase custom claims for authorization decisions.
- The PostgreSQL lookup happens once per request in middleware, not per service call.

### 6.2 Authorization Layers

| Layer | What It Checks | Implementation |
|---|---|---|
| **Route Guard (Middleware)** | Is user authenticated? Is user ACTIVE? Does their role match the required roles for this route? | Next.js middleware or route-level wrapper. Reads current user record from PostgreSQL. |
| **Resource Guard (Service)** | Is this user authorized to act on this specific resource? (ownership, manager assignment, department membership) | Service layer checks within business logic, using the user context from middleware |
| **State Guard (WorkflowService)** | Is the requested action valid for the current state? Is the actor's role permitted for this transition? | Transition map guards |
| **Database Guard (PostgreSQL)** | Audit logs are append-only. Application database user has no DELETE on audit_logs. | PostgreSQL GRANT/REVOKE |

### 6.3 Assessment vs Production Auth

| Aspect | Assessment | Production |
|---|---|---|
| Identity Provider | Firebase Auth Emulator (localhost:9099) | Firebase Auth (cloud) |
| Token Verification | `FIREBASE_AUTH_EMULATOR_HOST` env var tells Admin SDK to use emulator | Standard Admin SDK verification |
| User Creation | Seed script via Admin SDK | Controlled registration / admin provisioning |
| Configuration | `FIREBASE_AUTH_EMULATOR_HOST=firebase-emulator:9099` | Firebase project config via env vars |

**No insecure fallback.** The emulator uses the same Admin SDK API. If the emulator is unreachable, token verification fails, and the request is rejected with 401.

---

## 7. Database Architecture

### 7.1 Schema Overview

```mermaid
erDiagram
    users ||--o{ leave_requests : submits
    users ||--o{ decisions : acts_on
    departments ||--o{ users : contains
    departments ||--|| users : has_hod
    leave_requests ||--o{ decisions : has_history
    leave_requests ||--o{ documents : has_attachments
    leave_requests ||--o| appeals : may_have
    appeals ||--|| decisions : references_rejection
    appeals ||--o| decisions : has_hod_decision
    leave_requests ||--o{ audit_logs : generates
    users ||--o{ notifications : receives
    leave_type_configs ||--o{ leave_requests : categorizes
    holidays }|--|| holiday_calendars : belongs_to

    users {
        uuid id PK
        string firebase_uid UK
        string email UK
        string display_name
        enum role
        uuid department_id FK
        uuid manager_id FK
        enum status
        timestamp created_at
    }

    leave_requests {
        uuid id PK
        uuid employee_id FK
        uuid leave_type_id FK
        date start_date
        date end_date
        int calculated_working_days
        text reason
        enum status
        boolean requires_hod_approval
        int version
        timestamp created_at
        timestamp updated_at
    }

    decisions {
        uuid id PK
        uuid request_id FK
        uuid actor_id FK
        enum actor_role
        enum action
        text comment
        enum previous_status
        enum new_status
        timestamp created_at
    }

    documents {
        uuid id PK
        uuid request_id FK
        uuid uploaded_by FK
        string file_name
        string file_type
        int file_size
        string storage_path
        enum upload_phase
        timestamp created_at
    }

    appeals {
        uuid id PK
        uuid request_id FK
        uuid employee_id FK
        text justification
        uuid manager_rejection_decision_id FK
        uuid hod_decision_id FK
        enum status
        timestamp created_at
    }

    departments {
        uuid id PK
        string name
        uuid hod_id FK
    }

    leave_type_configs {
        uuid id PK
        string name
        int default_allocation
        boolean requires_document
        boolean is_active
    }

    notifications {
        uuid id PK
        uuid recipient_id FK
        enum type
        string title
        text message
        uuid related_request_id FK
        boolean is_read
        timestamp created_at
    }

    audit_logs {
        uuid id PK
        uuid actor_id FK
        enum actor_role
        enum action
        string resource_type
        uuid resource_id
        jsonb details
        timestamp created_at
        inet ip_address
    }

    holidays {
        uuid id PK
        date date
        string name
        int year
    }
```

### 7.2 Key Database Design Decisions

| Decision | Implementation | Reason |
|---|---|---|
| **UUIDs for all PKs** | `uuid DEFAULT gen_random_uuid()` | Prevents enumeration attacks (ST-14). Non-sequential. |
| **Version column on leave_requests** | `version INT NOT NULL DEFAULT 1` | Optimistic concurrency control (DR-15). |
| **Enum types for status/action** | PostgreSQL `CREATE TYPE` enums | Type safety at database level. Invalid values rejected. |
| **Append-only audit_logs** | Application DB user has INSERT only, no UPDATE/DELETE grants | Immutability enforced at database level (ST-10). |
| **Indexes** | `leave_requests(employee_id, status)`, `leave_requests(status) WHERE status IN (PENDING_MANAGER, PENDING_HOD, UNDER_APPEAL)`, `notifications(recipient_id, is_read)`, `decisions(request_id)` | Query performance for dashboard views. Partial indexes for active request queues. |
| **JSONB for audit details** | `details JSONB` on audit_logs | Flexible metadata without schema changes. |
| **Soft delete for users** | `status ENUM('ACTIVE', 'INACTIVE')` | Never hard-delete users who have historical records. |

### 7.3 Transaction Pattern

```sql
-- Every state transition uses this pattern:
BEGIN;

SELECT id, status, version, employee_id, calculated_working_days, requires_hod_approval
FROM leave_requests
WHERE id = $1 AND version = $2
FOR UPDATE;

-- Application validates: current status, actor authorization, business rules

UPDATE leave_requests
SET status = $new_status, version = version + 1, updated_at = NOW()
WHERE id = $1;

INSERT INTO decisions (request_id, actor_id, actor_role, action, comment, previous_status, new_status)
VALUES ($1, $actor, $role, $action, $comment, $old_status, $new_status);

INSERT INTO audit_logs (actor_id, actor_role, action, resource_type, resource_id, details, ip_address)
VALUES ($actor, $role, $action, 'LEAVE_REQUEST', $1, $details, $ip);

INSERT INTO notifications (recipient_id, type, title, message, related_request_id)
VALUES ($recipient, $type, $title, $message, $1);

COMMIT;
```

If `SELECT ... FOR UPDATE` returns no rows (version mismatch or not found), the transaction is rolled back and returns HTTP 409.

---

## 8. Document Storage Architecture

### 8.1 Storage Abstraction

```typescript
interface StorageProvider {
  upload(bucket: string, key: string, body: Buffer, contentType: string): Promise<void>;
  download(bucket: string, key: string): Promise<ReadableStream>;
  delete(bucket: string, key: string): Promise<void>;
  getSignedUrl(bucket: string, key: string, expiresIn: number): Promise<string>;
}
```

| Environment | Provider | Configuration |
|---|---|---|
| Assessment | MinIO | `S3_ENDPOINT=http://minio:9000`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| Production | AWS S3 / GCS | Standard AWS SDK configuration via env vars |

Both use AWS SDK v3 with `forcePathStyle: true` for MinIO compatibility.

### 8.2 Storage Path Convention

```
documents/{request_id}/{document_id}/{sanitized_filename}
```

- Never expose storage paths to the client.
- Documents served through `/api/documents/:id/download` with authorization check.
- No direct public URLs to storage.

### 8.3 Upload Validation

1. **Frontend (pre-upload):** File extension whitelist, size check. Informational only.
2. **API Route:** Validate `Content-Type` header, file size, and extension against allowlist.
3. **Server-side:** Read file magic bytes to validate actual content type matches declared type.
4. **Storage:** File renamed to `{uuid}.{ext}` to prevent path traversal.

---

## 9. Notification Architecture

### 9.1 Design

Notifications are created **synchronously within the same database transaction** as the state transition. This guarantees that if the transition commits, the notification exists.

```typescript
interface NotificationProvider {
  send(notification: NotificationPayload): Promise<void>;
}

class InAppNotificationProvider implements NotificationProvider {
  // Inserts into notifications table (already in transaction)
}

class EmailNotificationProvider implements NotificationProvider {
  // Sends email via SMTP/API (fire-and-forget, outside transaction)
}
```

### 9.2 Frontend Delivery

- **Polling:** Frontend polls `GET /api/notifications?unread=true` every 30 seconds.
- **Why not WebSockets:** WebSockets add infrastructure complexity (persistent connections, reconnection logic, scaling state). Polling is sufficient for a leave management system where notifications are not time-critical to the second.
- **Future option:** If real-time is later required, add Server-Sent Events (SSE) which is simpler than WebSockets for one-directional notifications.

### 9.3 Notification Events

| Workflow Event | Recipient | Notification Type |
|---|---|---|
| New request submitted | Assigned Manager | NEW_REQUEST |
| Request approved (final) | Employee | REQUEST_APPROVED |
| Request forwarded to HOD | Employee + HOD | PENDING_HOD_APPROVAL |
| Request rejected by Manager | Employee | REQUEST_REJECTED |
| Info requested | Employee | INFO_REQUESTED |
| Employee resubmitted | Manager | REQUEST_RESUBMITTED |
| HOD approved | Employee | REQUEST_APPROVED |
| HOD rejected | Employee | REQUEST_REJECTED |
| Appeal filed | HOD | APPEAL_FILED |
| Appeal decided | Employee | APPEAL_DECIDED |

---

## 10. API Design

### 10.1 Route Structure

```
/api/auth/
  POST   /api/auth/session          # Exchange Firebase token for session context
  DELETE /api/auth/session          # Logout

/api/leave-requests/
  GET    /api/leave-requests        # List (filtered by role: own, assigned, department)
  POST   /api/leave-requests        # Submit new request
  GET    /api/leave-requests/:id    # Get request details + decisions + documents
  PATCH  /api/leave-requests/:id    # Edit request (PENDING_MANAGER only)
  
/api/leave-requests/:id/actions/
  POST   /api/leave-requests/:id/actions/approve
  POST   /api/leave-requests/:id/actions/reject
  POST   /api/leave-requests/:id/actions/request-info
  POST   /api/leave-requests/:id/actions/resubmit
  POST   /api/leave-requests/:id/actions/cancel
  POST   /api/leave-requests/:id/actions/appeal

/api/documents/
  POST   /api/documents             # Upload (multipart, linked to request)
  GET    /api/documents/:id/download # Download with auth check

/api/notifications/
  GET    /api/notifications          # List user's notifications
  PATCH  /api/notifications/:id/read # Mark as read
  PATCH  /api/notifications/read-all # Mark all as read

/api/users/
  GET    /api/users/me               # Current user profile
  GET    /api/users/team             # Manager: list assigned employees

/api/dashboard/
  GET    /api/dashboard/stats        # Role-specific summary counts

/api/health
  GET    /api/health                 # Health check (DB + storage + auth)
```

### 10.2 Error Response Standard

```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot approve a request that is not in PENDING_MANAGER status.",
    "status": 409
  }
}
```

Standard HTTP status codes: 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404 (not found), 409 (conflict/version mismatch), 422 (business rule violation), 500 (internal).

---

## 11. Production vs Assessment Configuration

| Aspect | Assessment | Production |
|---|---|---|
| **Auth Provider** | Firebase Auth Emulator (:9099) | Firebase Auth (cloud) |
| **Database** | PostgreSQL in Docker | Managed PostgreSQL (Cloud SQL, RDS, etc.) |
| **File Storage** | MinIO in Docker (:9000) | AWS S3 / GCS |
| **Seed Data** | Auto-seeded via one-shot container | Admin provisioning API |
| **HTTPS** | Not required (localhost) | Required (TLS termination at load balancer) |
| **Email Notifications** | Disabled | Optional (configurable) |
| **Logging** | Console (JSON) | Structured logging to aggregation service |
| **Scaling** | Single instance | Horizontal (stateless API, connection pooling) |

Configuration is driven by environment variables. No code changes between modes.

```env
# Assessment
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@postgres:5432/leavedb
S3_ENDPOINT=http://minio:9000
S3_BUCKET=documents
FIREBASE_AUTH_EMULATOR_HOST=firebase-emulator:9099

# Production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@cloud-sql:5432/leavedb
S3_BUCKET=prod-leave-documents
# S3_ENDPOINT omitted → uses default AWS endpoint
FIREBASE_PROJECT_ID=my-project
```

---

## 12. Fault Tolerance Strategy

### 12.1 Dependency Failure Matrix

| Dependency | Detection | Impact | Handling | Recovery |
|---|---|---|---|---|
| **PostgreSQL down** | Connection error on query | All read and write operations fail. No state transitions possible. | Return 503 Service Unavailable. Display maintenance page. **Do NOT switch to another database or in-memory store.** | Auto-reconnect via Prisma connection pool. No data loss — uncommitted transactions are rolled back. |
| **MinIO/S3 down** | S3 SDK error on upload/download | Document upload/download fails | Return 503 for document operations only. Leave request submission without documents still works (for <=3 day leave). Long-leave submission (>3 days) fails because documents are mandatory. | Retry with exponential backoff. Files are idempotent (same key = overwrite). |
| **Firebase Auth down** | `verifyIdToken()` throws | No new logins. Existing unexpired tokens cannot be verified server-side. | Return 401 Unauthorized. Display "authentication service unavailable" message. **No fallback authentication. No skip-auth mode. No hardcoded tokens.** | Wait for Firebase recovery. In assessment: restart emulator container. |
| **Firebase Auth Emulator down** | Same as above | Same as above | Same. **No insecure bypass.** | `docker compose restart firebase-emulator`. Seed runner re-provisions accounts. |
| **Email provider down** | SMTP/API error | Email notifications not delivered | **Email failure MUST NOT block in-app notifications or leave approval workflows.** Email send is fire-and-forget, outside the database transaction. Failures are logged but do not roll back the transition. In-app notification (database INSERT within transaction) is unaffected. | Log error. Retry is optional (deferred to queue implementation). |

### 12.2 Provider Fallback Rules

| Provider | Fallback Behavior | Rationale |
|---|---|---|
| **Authentication (Firebase)** | **Deny access.** No alternative auth provider, no skip mode, no dev-only bypass. If Firebase (or emulator) is unreachable, return 401 on every authenticated request. | Security. Any auth bypass, even in development, risks being deployed to production. |
| **Database (PostgreSQL)** | **Fail with 503.** No automatic switch to SQLite, in-memory, or another database. The application does not start successfully if PostgreSQL is unreachable (health check fails). | Data consistency. A silent database switch would lose all committed data and violate transactional guarantees. |
| **Object Storage (MinIO/S3)** | **Use explicitly configured provider only.** The storage endpoint is set via `S3_ENDPOINT` env var. MinIO in assessment, S3 in production. No auto-detection, no fallback to local filesystem. If the configured provider is down, document operations return 503. | Explicit configuration prevents accidental data split between providers. |
| **Email (Optional)** | **Fail silently for the email channel.** Email failure must not block the workflow transition or the in-app notification. Log the failure. The in-app notification INSERT is part of the database transaction and is unaffected by email failures. | DR-05: Core workflows must never depend on email delivery. |
| **In-App Notifications** | **Transactional with the state change.** The notification INSERT is part of the same PostgreSQL transaction as the state transition. If the transaction commits, the notification exists. If the transaction rolls back, neither the state change nor the notification persists. | Guarantees notification consistency without a separate queue. |

### 12.3 Principles

1. **Never silently switch databases.** If PostgreSQL is down, the system returns errors. It does not fall back to in-memory or another database.
2. **Never bypass authentication.** If Firebase Auth (or emulator) is unreachable, all requests requiring auth are rejected with 401.
3. **Partial functionality is acceptable.** If S3 is down, leave requests without documents can still be submitted and approved. Document-dependent operations show clear errors.
4. **Transaction atomicity is preserved.** If any step within a workflow transition fails, the entire transaction rolls back. No partial state changes.
5. **Email failure is non-blocking.** Email notification failures are logged but never prevent a leave approval, rejection, or any other workflow action from completing.
6. **Notification persistence is transactional.** In-app notification records are INSERTed within the same database transaction as the state change they relate to.

---

## 13. Scaling Strategy

### 13.1 Assessment Scale

Single instance of each service. No scaling needed. Target: 1-10 concurrent users.

### 13.2 Production Scaling Path

| Component | Strategy | When |
|---|---|---|
| **Next.js Application** | Horizontal scaling behind load balancer. Stateless — any instance can handle any request. | >100 concurrent users |
| **PostgreSQL** | Connection pooling (PgBouncer). Read replicas for dashboard queries. | >1000 concurrent users |
| **S3/MinIO** | S3 scales automatically. MinIO can be clustered. | Storage exceeds single-node capacity |
| **Firebase Auth** | Managed service, scales automatically. | No action needed |

### 13.3 What Remains Stateless

- API routes: no session state, no in-memory caches.
- Authentication: token-based, verified on each request.
- Notifications: database-backed, no in-memory queues.

### 13.4 When to Add Infrastructure

| Trigger | Response |
|---|---|
| API response time consistently >500ms for dashboard queries | Add read replica for PostgreSQL. Add database-level caching. |
| Notification polling causes excessive DB load | Switch from polling to SSE (Server-Sent Events). |
| Email notification volume >1000/day | Add a lightweight job queue (pg-boss, which uses PostgreSQL — no new infrastructure). |
| File upload exceeds 50 concurrent uploads | Add upload rate limiting. Consider pre-signed URL direct upload to S3. |

---

## 14. Logging, Monitoring, and Health Checks

### 14.1 Logging

| Category | Format | Destination |
|---|---|---|
| Application logs | Structured JSON (`{ timestamp, level, message, requestId, userId, action }`) | stdout (Docker captures) |
| Audit logs | Database records (see Section 7) | PostgreSQL audit_logs table |
| Error logs | Structured JSON with stack trace (server only) | stdout + error tracking service (production) |

**Request correlation:** Each API request gets a unique `requestId` propagated through all log entries.

### 14.2 Health Check Endpoint

```
GET /api/health → 200 OK

{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "latency_ms": 2 },
    "storage": { "status": "up", "latency_ms": 15 },
    "auth": { "status": "up" }
  },
  "version": "1.0.0",
  "uptime_seconds": 3600
}
```

Docker Compose uses this for container health checks. Load balancers use this for instance health.

### 14.3 Monitoring (Production)

- Response time percentiles (p50, p95, p99) per endpoint.
- Error rate by endpoint and status code.
- Database connection pool utilization.
- Active leave request queue depth.
- Storage usage.

Assessment mode: console logs only. No external monitoring dependencies.

---

## 15. Important Trade-offs

| Trade-off | Choice Made | What Was Given Up | Why |
|---|---|---|---|
| **Single runtime vs polyglot** | TypeScript everywhere | Python's FastAPI ecosystem, which excels at API design | Single language reduces Docker complexity, eliminates cross-language type drift, simplifies hiring and debugging. |
| **Polling vs WebSockets for notifications** | Polling (30s interval) | Sub-second notification delivery | WebSockets add connection management complexity, scaling state, and infrastructure requirements disproportionate to the benefit for a leave management system. |
| **Prisma vs raw SQL** | Prisma ORM | Maximum SQL flexibility, slight performance overhead | Type-safe queries, auto-generated migrations, schema-as-code. Raw SQL available via `$queryRaw` when needed. |
| **Role in PostgreSQL vs Firebase custom claims** | PostgreSQL | Firebase claim propagation (automatic to all tokens) | Single source of truth. No propagation delay. Database transactions can check role within the same transaction as state change. |
| **Modular monolith vs microservices** | Modular monolith | Independent deployment of individual services | This scope does not justify the operational overhead of multiple deployable units, service discovery, or distributed transactions. |
| **Synchronous notifications vs queue** | Synchronous (in-transaction) | Decoupled notification delivery, retry logic | Eliminates queue infrastructure. Notification is guaranteed if transaction commits. Acceptable because in-app notifications are database inserts, not external calls. |
| **No Redis** | Direct PostgreSQL queries | Sub-millisecond cached reads for dashboards | PostgreSQL with proper indexes handles the expected query patterns. Redis adds an infrastructure dependency without a measured performance justification. |

---

## 16. Deferred Decisions

| Item | Deferred Until | Notes |
|---|---|---|
| Production deployment platform (AWS, GCP, Vercel) | Post-assessment | Architecture is cloud-agnostic. Docker Compose works anywhere. |
| CI/CD pipeline | Post-assessment | GitHub Actions or equivalent. Not needed for ZIP submission. |
| Email notification provider (SendGrid, SES, etc.) | Implementation phase | Provider interface is defined. Implementation is pluggable. |
| Rate limiting implementation | Implementation phase | Decide between middleware-level (express-rate-limit) or reverse proxy (Nginx). |
| Database backup strategy | Production deployment | Assessment uses ephemeral Docker volumes. Production requires automated backups. |
| SSL certificate management | Production deployment | Assessment runs on HTTP. Production uses managed certificates. |
| Pre-signed URL direct uploads | Scaling phase | Start with server-proxied uploads. Switch to pre-signed URLs if upload volume demands it. |
| Search/filtering implementation | Implementation phase | Decide between PostgreSQL full-text search vs. simple WHERE clauses based on UI requirements. |

---

## 17. Architecture Decision Records (Summary)

| ID | Decision | Status |
|---|---|---|
| ADR-01 | Next.js full-stack (Option C) over Firebase-centric or separate FastAPI backend | Decided |
| ADR-02 | PostgreSQL as sole business database | Decided |
| ADR-03 | Firebase Auth for identity only; role stored in PostgreSQL | Decided |
| ADR-04 | Prisma ORM for data access | Decided |
| ADR-05 | MinIO (assessment) / S3 (production) via AWS SDK abstraction | Decided |
| ADR-06 | Modular monolith with layered architecture | Decided |
| ADR-07 | Synchronous in-transaction notifications | Decided |
| ADR-08 | Polling for notification delivery to frontend | Decided |
| ADR-09 | No Redis, no message queue, no microservices | Decided |
| ADR-10 | 5-container Docker Compose topology | Decided |
| ADR-11 | TypeScript as sole programming language | Decided |
| ADR-12 | No insecure auth fallback | Decided |

---

*End of Architecture Decision Document*

# Employee Leave Management System — Database Architecture and Data Model

**Document ID:** 03_DATABASE_DESIGN
**Version:** 1.0
**Status:** Complete
**Date:** 2026-11-06
**Input Documents:**
- [01_REQUIREMENTS_BASELINE.md](01_REQUIREMENTS_BASELINE.md)
- [01_DECISION_REGISTER.md](01_DECISION_REGISTER.md)
- [02_ARCHITECTURE_DECISION.md](02_ARCHITECTURE_DECISION.md)

---

## 1. Design Objectives and Principles

| Principle | Implementation |
|---|---|
| **Normalization** | 3NF minimum. Denormalization only where query performance demands it and documented. |
| **Referential integrity** | Foreign keys enforced at the database level. Deletion policies explicit for every FK. |
| **Immutability where required** | Audit logs and decision records are append-only. No UPDATE or DELETE granted to the application DB user on those tables. |
| **Concurrency safety** | Optimistic locking via `version` column on `leave_requests`. All transitions use `SELECT ... FOR UPDATE` within explicit transactions. |
| **Firebase identity isolation** | `firebase_uid` is a unique lookup key only. Roles, status, and all business data live in PostgreSQL. |
| **Multi-role support** | Users hold roles through a join table, not a single enum column. A Manager is also an Employee. |
| **No hardcoded unconfirmed policies** | DR-11 (max duration), DR-12 (retroactive window), DR-13 (balance enforcement) are stored as configurable parameters, not CHECK constraints. |

---

## 2. Enum Definitions

All enums are defined as PostgreSQL `CREATE TYPE` and used as column types. This enforces valid values at the database level and is natively supported by Prisma.

```sql
-- User account lifecycle
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');

-- Application roles (a user can hold multiple via user_roles join table)
CREATE TYPE app_role AS ENUM ('EMPLOYEE', 'MANAGER', 'HOD');

-- Ten workflow states (Baseline section 3)
CREATE TYPE leave_status AS ENUM (
  'PENDING_MANAGER',
  'INFO_REQUESTED',
  'PENDING_HOD',
  'APPROVED',
  'APPROVED_ON_APPEAL',
  'REJECTED_BY_MANAGER',
  'REJECTED_BY_HOD',
  'UNDER_APPEAL',
  'APPEAL_REJECTED',
  'CANCELLED'
);

-- Audit and decision action codes (Baseline section 6.2)
CREATE TYPE workflow_action AS ENUM (
  'SUBMIT',
  'EDIT',
  'CANCEL',
  'APPROVE',
  'REJECT',
  'REQUEST_INFO',
  'RESUBMIT',
  'APPEAL',
  'HOD_APPROVE',
  'HOD_REJECT',
  'APPEAL_APPROVE',
  'APPEAL_REJECT'
);

-- Document upload phase
CREATE TYPE upload_phase AS ENUM ('INITIAL', 'ADDITIONAL');

-- Appeal resolution
CREATE TYPE appeal_status AS ENUM ('PENDING', 'UPHELD', 'OVERTURNED');

-- Notification event types (DR-22: key events only recommended)
CREATE TYPE notification_event AS ENUM (
  'NEW_REQUEST',
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'PENDING_HOD_APPROVAL',
  'INFO_REQUESTED',
  'REQUEST_RESUBMITTED',
  'APPEAL_FILED',
  'APPEAL_DECIDED'
);
```

---

## 3. Entity Definitions

### 3.1 `departments`

Organizational unit. Each department has exactly one HOD (FK to `users`). The FK to HOD is nullable during initial setup to handle the circular dependency with `users.department_id`; application logic enforces that a live department always has a HOD.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Non-sequential, IDOR-resistant |
| `name` | `VARCHAR(200)` | NOT NULL, UNIQUE | Department display name |
| `hod_user_id` | `UUID` | FK to users.id, SET NULL on DELETE | Nullable during bootstrap only |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Updated by application |

**Indexes:**
- PK on `id` (implicit)
- UNIQUE on `name`
- Index on `hod_user_id` (FK lookup for HOD authorization checks)

---

### 3.2 `users`

Application user record. Firebase provides identity; PostgreSQL provides role, status, and organizational placement. Passwords are never stored here.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | |
| `firebase_uid` | `VARCHAR(128)` | NOT NULL, UNIQUE | Firebase UID, used as lookup key after token verification |
| `email` | `VARCHAR(320)` | NOT NULL, UNIQUE | Stored for display; Firebase is authoritative for email verification |
| `display_name` | `VARCHAR(200)` | NOT NULL | Full name for UI |
| `department_id` | `UUID` | FK to departments.id, SET NULL on DELETE | Nullable: system accounts or pending assignment |
| `manager_id` | `UUID` | FK to users.id (self-ref), SET NULL on DELETE | The user whose leave this user's requests route to for first-level approval |
| `status` | `user_status` | NOT NULL, DEFAULT 'ACTIVE' | Soft delete. INACTIVE blocks auth even with valid Firebase token. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |

**Design note — manager_id semantics (DR-10):**
For a Manager, `manager_id` is set to the HOD's user ID. This is how the Manager's own leave routes to HOD without special-casing the workflow engine. The workflow engine reads `manager_id` uniformly; DR-10 is satisfied by seed data configuration, not by special business logic.

**Indexes:**
- PK on `id`
- UNIQUE on `firebase_uid` (lookup on every authenticated request)
- UNIQUE on `email`
- Index on `department_id` (department membership queries)
- Index on `manager_id` (DR-01: "assigned employees only" filter)
- Index on `status` (filter inactive users)

**Deletion policy:** Users are never hard-deleted. Set `status = 'INACTIVE'` instead.

---

### 3.3 `user_roles`

Many-to-many join table between `users` and application roles. A single user can be both a Manager and an HOD (or any combination). This is the **primary role determination table** read by middleware on every request.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `user_id` | `UUID` | NOT NULL, FK to users.id, CASCADE on DELETE | |
| `role` | `app_role` | NOT NULL | One of EMPLOYEE, MANAGER, HOD |
| `granted_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Audit of when role was assigned |
| `granted_by_user_id` | `UUID` | FK to users.id, SET NULL on DELETE | Who assigned this role |

**Primary Key:** Composite `(user_id, role)` — prevents duplicate role assignments.

**Indexes:**
- PK `(user_id, role)`
- Index on `user_id` (most common lookup: "what roles does this user have?")

**Design note — multi-role resolution:**
Middleware reads all roles for a user. The application merges capabilities: a user with both MANAGER and EMPLOYEE roles can submit leave (EMPLOYEE capability) and approve others' requests (MANAGER capability). The HOD capability is additive. The effective role used for a specific action is determined by the transition map guard.

**Why not a single role enum column on users?**
The requirement explicitly states Managers can submit leave requests (they are also employees). A single-role column would require the application to special-case this constantly. The join table is normalized, extensible, and mirrors how most real-world RBAC systems work.

---

### 3.4 `leave_type_configs`

Configurable leave type registry. Used to categorize leave requests and enforce type-specific rules.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | e.g., Sick Leave, Casual Leave |
| `default_annual_allocation` | `INTEGER` | NULLABLE, CHECK >= 0 | Null = unlimited / not tracked |
| `requires_document` | `BOOLEAN` | NOT NULL, DEFAULT false | Type-level document requirement |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT true | Soft-disable obsolete types |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |

**Indexes:**
- PK on `id`
- UNIQUE on `name`
- Index on `is_active` (filter inactive types from submission UI)

**Deletion policy:** Never hard-delete; set `is_active = false`. Historical leave requests reference this ID.

---

### 3.5 `leave_requests`

Core entity. Holds the current state of each leave request and the version counter for optimistic concurrency control.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | |
| `employee_id` | `UUID` | NOT NULL, FK to users.id, RESTRICT on DELETE | The submitting employee |
| `leave_type_id` | `UUID` | NOT NULL, FK to leave_type_configs.id, RESTRICT on DELETE | |
| `start_date` | `DATE` | NOT NULL | Inclusive |
| `end_date` | `DATE` | NOT NULL | Inclusive |
| `calculated_working_days` | `INTEGER` | NOT NULL, CHECK > 0 | Backend-computed at submission and re-edit. Never trusted from client. |
| `reason` | `TEXT` | NOT NULL | Free-text; not nullable |
| `status` | `leave_status` | NOT NULL, DEFAULT 'PENDING_MANAGER' | 10 enum values |
| `requires_hod_approval` | `BOOLEAN` | NOT NULL, DEFAULT false | Set true when calculated_working_days > 3. Immutable after first transition out of PENDING_MANAGER. |
| `version` | `INTEGER` | NOT NULL, DEFAULT 1 | Optimistic concurrency counter. Incremented on every state transition or edit. |
| `submitted_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Immutable after creation |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |

**CHECK constraints:**
```sql
CHECK (end_date >= start_date)
CHECK (calculated_working_days > 0)
```

**Note — unconfirmed policies:**
- `calculated_working_days <= 30` is NOT enforced as a CHECK constraint (DR-11 is proposed, not confirmed).
- `start_date >= CURRENT_DATE - 7` is NOT enforced as a CHECK constraint (DR-12 is proposed, not confirmed).
- Both are enforced in the application service layer as configurable parameters via `system_config`.

**Indexes:**
- PK on `id`
- Index on `employee_id` (employee's own requests list)
- Composite index on `(employee_id, status)` (dashboard: "my pending requests")
- Index on `status` (general status filter)
- **Partial index** on `status WHERE status IN ('PENDING_MANAGER', 'PENDING_HOD', 'UNDER_APPEAL', 'INFO_REQUESTED')` — covers all active queue queries for Manager, HOD, and appeal dashboards efficiently
- Index on `leave_type_id` (FK)
- Index on `(start_date, end_date)` (overlap detection, DR-19)

**Deletion policy:** Leave requests are never deleted. They transition to terminal states.

---

### 3.6 `decisions`

Append-only record of every workflow action taken by any actor on a leave request. This is both the approval history and the operational record read by the WorkflowService.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | |
| `leave_request_id` | `UUID` | NOT NULL, FK to leave_requests.id, RESTRICT on DELETE | |
| `actor_id` | `UUID` | NOT NULL, FK to users.id, RESTRICT on DELETE | The user who took the action |
| `actor_role` | `app_role` | NOT NULL | Role under which the action was taken |
| `action` | `workflow_action` | NOT NULL | One of the 12 audit events |
| `comment` | `TEXT` | NULLABLE | Required by business rule for REJECT, REQUEST_INFO, HOD_REJECT, APPEAL. Nullable here; enforced by application. |
| `previous_status` | `leave_status` | NOT NULL | The status before this action |
| `new_status` | `leave_status` | NOT NULL | The status after this action |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Immutable |

**No UPDATE or DELETE granted to the application DB user on this table.**

**Duplicate decision prevention:** The primary mechanism is `SELECT ... FOR UPDATE` + version check on `leave_requests`. This ensures only one transaction can commit a state transition. A unique constraint on `decisions` is not used because it would incorrectly block legitimate repeated actions (e.g., multiple EDIT actions from the same employee). See Section 9.

**Indexes:**
- PK on `id`
- Index on `leave_request_id` (fetch all decisions for a request — approval history)
- Index on `actor_id` (manager's decision history view)
- Index on `(leave_request_id, action)` (find specific decision types, e.g., the manager's REJECT for appeal context)

---

### 3.7 `appeals`

One-to-one with a leave request at any point in time (only one active appeal per request). Historical resolved appeals are retained; a second concurrent appeal is prevented by a partial unique index.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | |
| `leave_request_id` | `UUID` | NOT NULL, FK to leave_requests.id, RESTRICT on DELETE | |
| `employee_id` | `UUID` | NOT NULL, FK to users.id, RESTRICT on DELETE | Redundant with leave_request.employee_id but useful for direct queries |
| `justification` | `TEXT` | NOT NULL | Employee's appeal reason |
| `manager_rejection_decision_id` | `UUID` | NOT NULL, FK to decisions.id, RESTRICT on DELETE | The specific decision record being appealed |
| `hod_decision_id` | `UUID` | NULLABLE, FK to decisions.id, SET NULL on DELETE | Set when HOD acts; null while PENDING |
| `status` | `appeal_status` | NOT NULL, DEFAULT 'PENDING' | PENDING / UPHELD / OVERTURNED |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |

**Constraint — one active appeal per request:**
```sql
-- Only one appeal can be in PENDING status for a given leave request.
CREATE UNIQUE INDEX uq_one_active_appeal_per_request
  ON appeals (leave_request_id)
  WHERE status = 'PENDING';
```
This partial unique index allows historical resolved appeals to exist while preventing a second simultaneous appeal.

**Indexes:**
- PK on `id`
- Partial unique index `(leave_request_id) WHERE status = 'PENDING'`
- Index on `leave_request_id`
- Index on `employee_id`
- Index on `manager_rejection_decision_id` (FK lookup)

---

### 3.8 `documents`

File metadata. Binary content is never stored in PostgreSQL; only an opaque `storage_key` pointing to the object in MinIO/S3.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | |
| `leave_request_id` | `UUID` | NOT NULL, FK to leave_requests.id, RESTRICT on DELETE | |
| `uploaded_by_user_id` | `UUID` | NOT NULL, FK to users.id, RESTRICT on DELETE | |
| `original_filename` | `VARCHAR(500)` | NOT NULL | Original name as uploaded, for display only |
| `storage_key` | `VARCHAR(1000)` | NOT NULL, UNIQUE | Opaque S3/MinIO object key. Never exposed to client directly. |
| `mime_type` | `VARCHAR(100)` | NOT NULL | Server-validated MIME type |
| `file_size_bytes` | `INTEGER` | NOT NULL, CHECK > 0 | In bytes |
| `upload_phase` | `upload_phase` | NOT NULL | INITIAL (at submission) or ADDITIONAL (via resubmit) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |

**Security notes:**
- `storage_key` is opaque. The API never returns it to the client; it derives a short-lived pre-signed URL server-side.
- `original_filename` is stored for display but is not used as the storage path. The storage path uses a UUID to prevent path traversal.

**Indexes:**
- PK on `id`
- UNIQUE on `storage_key`
- Index on `leave_request_id` (all documents for a request)
- Index on `uploaded_by_user_id` (audit)

**Deletion policy:** Documents are not deleted by the application (DR-24: retain indefinitely).

---

### 3.9 `holidays`

Holiday calendar used by the working-day calculation service. Managed by seed script for assessment (DR-17).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | |
| `date` | `DATE` | NOT NULL, UNIQUE | The holiday date |
| `name` | `VARCHAR(200)` | NOT NULL | Display name |
| `year` | `INTEGER` | NOT NULL, CHECK >= 2000 | Extracted from date for range queries |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |

**Indexes:**
- PK on `id`
- UNIQUE on `date`
- Index on `year` (fetch all holidays for a given year during working-day calculation)

---

### 3.10 `notifications`

Persistent in-app notification records. Created within the same database transaction as the triggering workflow action. Never deleted by the application.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | |
| `recipient_user_id` | `UUID` | NOT NULL, FK to users.id, CASCADE on DELETE | |
| `event_type` | `notification_event` | NOT NULL | Typed notification category |
| `title` | `VARCHAR(300)` | NOT NULL | Short display title |
| `message` | `TEXT` | NOT NULL | Full notification body |
| `leave_request_id` | `UUID` | NULLABLE, FK to leave_requests.id, SET NULL on DELETE | Reference to the related request |
| `is_read` | `BOOLEAN` | NOT NULL, DEFAULT false | Read/unread state |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |

**Design note — transactional consistency:**
Notification INSERTs are part of the same PostgreSQL transaction as the state transition. If the transaction rolls back, the notification is not persisted. This guarantees that every notification corresponds to an actual committed workflow event.

**Indexes:**
- PK on `id`
- Composite index on `(recipient_user_id, is_read)` — most common query: "unread notifications for current user"
- Composite index on `(recipient_user_id, created_at DESC)` — notifications list ordered by recency
- Index on `leave_request_id` (FK)

---

### 3.11 `audit_logs`

Immutable, append-only record of all significant application events. The application DB user has INSERT only (no UPDATE or DELETE) on this table.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | |
| `actor_id` | `UUID` | NULLABLE, FK to users.id, SET NULL on DELETE | Nullable for system-generated events |
| `actor_role` | `app_role` | NULLABLE | The role under which the action was taken |
| `action` | `workflow_action` | NOT NULL | Action code |
| `resource_type` | `VARCHAR(50)` | NOT NULL | e.g., 'LEAVE_REQUEST', 'APPEAL', 'DOCUMENT' |
| `resource_id` | `UUID` | NOT NULL | The ID of the affected entity |
| `metadata` | `JSONB` | NULLABLE | Contextual details (previous status, new status, comment length). No secrets. |
| `ip_address` | `INET` | NULLABLE | Client IP from request context |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Immutable timestamp |

**No UPDATE or DELETE on this table.** Enforced at the PostgreSQL permission level:
```sql
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
```

**JSONB metadata content policy:**
- Include: previous_status, new_status, comment length (not content), document count.
- Exclude: file contents, full comment text, passwords, tokens.

**Indexes:**
- PK on `id`
- Index on `(resource_type, resource_id)` — look up all audit events for a specific entity
- Index on `actor_id` (actor history)
- Index on `created_at DESC` (time-ordered audit trail)

---

### 3.12 `system_config`

Stores configurable parameters for proposed policies (DR-11, DR-12, DR-13) so they are not hardcoded.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `key` | `VARCHAR(100)` | PK | Config key |
| `value` | `TEXT` | NOT NULL | String representation of the value |
| `description` | `TEXT` | NULLABLE | Human-readable description |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | |

**Seed data entries (if proposed policies are adopted):**

| Key | Default Value | Policy |
|---|---|---|
| `max_leave_days` | `30` | DR-11 (proposed) |
| `retroactive_window_days` | `7` | DR-12 (proposed) |
| `leave_balance_enforcement` | `WARN` | DR-13 (proposed) |

If none of DR-11/12/13 are confirmed, this table remains in the schema but entries are optional. The application falls back to service-layer defaults for missing keys.

---

## 4. ER Diagram

```mermaid
erDiagram
    departments {
        uuid id PK
        varchar name UK
        uuid hod_user_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    users {
        uuid id PK
        varchar firebase_uid UK
        varchar email UK
        varchar display_name
        uuid department_id FK
        uuid manager_id FK
        user_status status
        timestamptz created_at
        timestamptz updated_at
    }

    user_roles {
        uuid user_id PK_FK
        app_role role PK
        timestamptz granted_at
        uuid granted_by_user_id FK
    }

    leave_type_configs {
        uuid id PK
        varchar name UK
        int default_annual_allocation
        boolean requires_document
        boolean is_active
        timestamptz created_at
    }

    leave_requests {
        uuid id PK
        uuid employee_id FK
        uuid leave_type_id FK
        date start_date
        date end_date
        int calculated_working_days
        text reason
        leave_status status
        boolean requires_hod_approval
        int version
        timestamptz submitted_at
        timestamptz created_at
        timestamptz updated_at
    }

    decisions {
        uuid id PK
        uuid leave_request_id FK
        uuid actor_id FK
        app_role actor_role
        workflow_action action
        text comment
        leave_status previous_status
        leave_status new_status
        timestamptz created_at
    }

    appeals {
        uuid id PK
        uuid leave_request_id FK
        uuid employee_id FK
        text justification
        uuid manager_rejection_decision_id FK
        uuid hod_decision_id FK
        appeal_status status
        timestamptz created_at
        timestamptz updated_at
    }

    documents {
        uuid id PK
        uuid leave_request_id FK
        uuid uploaded_by_user_id FK
        varchar original_filename
        varchar storage_key UK
        varchar mime_type
        int file_size_bytes
        upload_phase upload_phase
        timestamptz created_at
    }

    holidays {
        uuid id PK
        date date UK
        varchar name
        int year
        timestamptz created_at
    }

    notifications {
        uuid id PK
        uuid recipient_user_id FK
        notification_event event_type
        varchar title
        text message
        uuid leave_request_id FK
        boolean is_read
        timestamptz created_at
    }

    audit_logs {
        uuid id PK
        uuid actor_id FK
        app_role actor_role
        workflow_action action
        varchar resource_type
        uuid resource_id
        jsonb metadata
        inet ip_address
        timestamptz created_at
    }

    system_config {
        varchar key PK
        text value
        text description
        timestamptz updated_at
    }

    departments ||--o{ users : "contains members"
    departments ||--o| users : "has HOD"
    users ||--o{ user_roles : "holds roles"
    users ||--o{ leave_requests : "submits"
    users ||--o{ decisions : "takes action"
    users ||--o{ notifications : "receives"
    users ||--o{ documents : "uploads"
    users ||--o| users : "reports to manager"
    leave_type_configs ||--o{ leave_requests : "categorizes"
    leave_requests ||--o{ decisions : "has history"
    leave_requests ||--o{ documents : "has attachments"
    leave_requests ||--o| appeals : "may have appeal"
    leave_requests ||--o{ notifications : "triggers"
    decisions ||--o| appeals : "referenced as rejection"
    decisions ||--o| appeals : "referenced as HOD decision"
```

---

## 5. Relationships and Cardinalities

| Relationship | Type | Enforced By |
|---|---|---|
| `users` to `departments` | Many-to-one (a user belongs to one dept) | FK `users.department_id` |
| `departments` to HOD `users` | One-to-one (one HOD per dept) | FK `departments.hod_user_id` + app logic |
| `users` to `users` (manager) | Self-referential many-to-one | FK `users.manager_id` |
| `users` to `user_roles` | One-to-many (a user holds N roles) | Composite PK on `user_roles` |
| `users` to `leave_requests` | One-to-many (a user submits N requests) | FK `leave_requests.employee_id` |
| `leave_requests` to `decisions` | One-to-many (a request has N decision records) | FK `decisions.leave_request_id` |
| `leave_requests` to `documents` | One-to-many (a request has N documents) | FK `documents.leave_request_id` |
| `leave_requests` to `appeals` | One-to-zero-or-one (at most one active appeal) | Partial unique index on `appeals` |
| `decisions` to `appeals` | One-to-one (appeal references specific rejection) | FK `appeals.manager_rejection_decision_id` |
| `users` to `notifications` | One-to-many (a user receives N notifications) | FK `notifications.recipient_user_id` |
| `leave_requests` to `notifications` | One-to-many (a request triggers N notifications) | FK `notifications.leave_request_id` |
| `users` to `audit_logs` | One-to-many (a user generates N audit events) | FK `audit_logs.actor_id` |
| `leave_type_configs` to `leave_requests` | One-to-many | FK `leave_requests.leave_type_id` |

---

## 6. Constraints Summary

### 6.1 Unique Constraints

| Table | Columns | Purpose |
|---|---|---|
| `users` | `firebase_uid` | One application user per Firebase identity |
| `users` | `email` | Prevents duplicate account creation |
| `departments` | `name` | No duplicate department names |
| `leave_type_configs` | `name` | No duplicate leave type names |
| `documents` | `storage_key` | Each file has a unique S3 path |
| `holidays` | `date` | No duplicate holiday entries |
| `user_roles` | `(user_id, role)` — composite PK | A user holds each role at most once |

### 6.2 CHECK Constraints

| Table | Constraint | Reason |
|---|---|---|
| `leave_requests` | `calculated_working_days > 0` | A leave request must span at least one working day |
| `leave_requests` | `end_date >= start_date` | Date range sanity |
| `documents` | `file_size_bytes > 0` | A stored document must have positive size |
| `leave_type_configs` | `default_annual_allocation >= 0` OR NULL | Allocation cannot be negative |
| `holidays` | `year >= 2000` | Reasonable lower bound |

### 6.3 Partial Unique Indexes (Business Rules)

| Table | Columns | Condition | Business Rule |
|---|---|---|---|
| `appeals` | `(leave_request_id)` | `WHERE status = 'PENDING'` | Only one active appeal per request (DR-03) |

---

## 7. Referential Integrity and Deletion Policies

| FK | On Parent DELETE | Rationale |
|---|---|---|
| `users.department_id` to `departments.id` | SET NULL | A user without a department is unusual but not invalid |
| `users.manager_id` to `users.id` | SET NULL | If manager is deactivated, re-assignment is a manual operation |
| `departments.hod_user_id` to `users.id` | SET NULL | Dept without HOD is unusual; triggers administrative action |
| `user_roles.user_id` to `users.id` | CASCADE DELETE | Role entries are meaningless without the user |
| `user_roles.granted_by_user_id` to `users.id` | SET NULL | Preserve role records even if granter is gone |
| `leave_requests.employee_id` to `users.id` | RESTRICT | Cannot delete a user with leave requests; use INACTIVE status |
| `leave_requests.leave_type_id` to `leave_type_configs.id` | RESTRICT | Cannot delete a leave type in use |
| `decisions.leave_request_id` to `leave_requests.id` | RESTRICT | Decisions are part of immutable history |
| `decisions.actor_id` to `users.id` | RESTRICT | Preserve actor reference in decision history |
| `appeals.leave_request_id` to `leave_requests.id` | RESTRICT | Appeal linked to its request permanently |
| `appeals.employee_id` to `users.id` | RESTRICT | Preserve employee reference |
| `appeals.manager_rejection_decision_id` to `decisions.id` | RESTRICT | Cannot delete the decision that was appealed |
| `appeals.hod_decision_id` to `decisions.id` | SET NULL | Nullable; HOD decision may be unset during PENDING appeal |
| `documents.leave_request_id` to `leave_requests.id` | RESTRICT | Documents tied to their request |
| `documents.uploaded_by_user_id` to `users.id` | RESTRICT | Preserve uploader identity |
| `notifications.recipient_user_id` to `users.id` | CASCADE DELETE | Notifications without a recipient are meaningless |
| `notifications.leave_request_id` to `leave_requests.id` | SET NULL | Keep notification even if request is somehow removed |
| `audit_logs.actor_id` to `users.id` | SET NULL | Preserve audit record even if actor is gone |

**General policy:** RESTRICT is used for all business-critical relationships where deletion would corrupt workflow history. INACTIVE status (soft delete) is the correct mechanism for removing users from active operation.

---

## 8. Index Strategy

### 8.1 Complete Index List

| Table | Type | Columns | Purpose |
|---|---|---|---|
| `users` | PK | `id` | Primary lookup |
| `users` | UNIQUE | `firebase_uid` | Per-request auth lookup |
| `users` | UNIQUE | `email` | Duplicate prevention |
| `users` | INDEX | `department_id` | Department membership queries |
| `users` | INDEX | `manager_id` | DR-01: assigned employee scope filter |
| `users` | INDEX | `status` | Filter active users |
| `user_roles` | PK | `(user_id, role)` | Duplicate prevention + lookup |
| `user_roles` | INDEX | `user_id` | "What roles does this user have?" |
| `departments` | PK | `id` | Primary lookup |
| `departments` | UNIQUE | `name` | Duplicate prevention |
| `departments` | INDEX | `hod_user_id` | HOD authorization checks |
| `leave_requests` | PK | `id` | Primary lookup |
| `leave_requests` | INDEX | `employee_id` | Employee's own requests |
| `leave_requests` | INDEX | `(employee_id, status)` | Employee dashboard: "my active requests" |
| `leave_requests` | PARTIAL | `status WHERE IN active states` | Active queue views for Manager/HOD dashboards |
| `leave_requests` | INDEX | `(start_date, end_date)` | Overlap detection (DR-19) |
| `leave_requests` | INDEX | `leave_type_id` | FK constraint + type filter |
| `decisions` | PK | `id` | Primary lookup |
| `decisions` | INDEX | `leave_request_id` | Approval history for a request |
| `decisions` | INDEX | `actor_id` | Manager/HOD decision history view |
| `decisions` | INDEX | `(leave_request_id, action)` | Fetch specific decision type (e.g., REJECT for appeal context) |
| `appeals` | PK | `id` | Primary lookup |
| `appeals` | PARTIAL UNIQUE | `(leave_request_id) WHERE status='PENDING'` | One active appeal per request |
| `appeals` | INDEX | `leave_request_id` | Lookup appeal for a request |
| `appeals` | INDEX | `employee_id` | Employee's appeals |
| `documents` | PK | `id` | Primary lookup |
| `documents` | UNIQUE | `storage_key` | Prevent duplicate storage paths |
| `documents` | INDEX | `leave_request_id` | Documents for a request |
| `documents` | INDEX | `uploaded_by_user_id` | Audit |
| `holidays` | PK | `id` | |
| `holidays` | UNIQUE | `date` | No duplicate dates |
| `holidays` | INDEX | `year` | Fetch holiday list by year for working-day calc |
| `notifications` | PK | `id` | |
| `notifications` | INDEX | `(recipient_user_id, is_read)` | Unread count + filter |
| `notifications` | INDEX | `(recipient_user_id, created_at DESC)` | Ordered notification feed |
| `notifications` | INDEX | `leave_request_id` | FK |
| `audit_logs` | PK | `id` | |
| `audit_logs` | INDEX | `(resource_type, resource_id)` | All audit events for a specific resource |
| `audit_logs` | INDEX | `actor_id` | Actor's action history |
| `audit_logs` | INDEX | `created_at DESC` | Time-ordered global audit trail |

### 8.2 Prisma-Specific Index Notes

Prisma supports standard indexes and unique constraints natively. The following require custom SQL in a Prisma migration file:

| Feature | Requires Custom SQL | Reason |
|---|---|---|
| Partial unique index on `appeals` | YES | Prisma does not support WHERE clause on unique indexes via schema DSL |
| Partial index on `leave_requests` by status | YES | Prisma `@@index` does not support WHERE predicates |
| PostgreSQL enum types | Managed automatically | Prisma maps enum blocks to PostgreSQL CREATE TYPE for PG provider |
| REVOKE on `audit_logs` | YES | Prisma does not manage GRANT/REVOKE |
| REVOKE on `decisions` | YES | Same reason |
| Descending sort on composite notification index | YES | Prisma index sort direction not fully supported in all versions |

---

## 9. Transaction Boundaries and Concurrency Handling

### 9.1 State Transition Transaction Pattern

Every workflow action follows this exact pattern. No exceptions.

```sql
-- Step 1: Begin explicit transaction
BEGIN;

-- Step 2: Lock the row and read current state.
-- If the row does not exist OR version does not match, zero rows returned.
-- Transaction is rolled back; application returns HTTP 409.
SELECT id, status, version, employee_id, requires_hod_approval, calculated_working_days
FROM leave_requests
WHERE id = $requestId AND version = $expectedVersion
FOR UPDATE;

-- Step 3: Application validates:
--   a) current status matches expected "from" state in transition map
--   b) actor has the correct role for this transition
--   c) actor satisfies all guards (is assigned manager, is not self-approving, etc.)
--   d) business rule conditions (comment provided if required, etc.)
-- If any check fails: ROLLBACK, return HTTP error (403, 409, or 422).

-- Step 4: Update the leave request
UPDATE leave_requests
SET status = $newStatus,
    version = version + 1,
    updated_at = now()
WHERE id = $requestId;

-- Step 5: Insert decision record (approval history)
INSERT INTO decisions (id, leave_request_id, actor_id, actor_role, action, comment, previous_status, new_status)
VALUES (gen_random_uuid(), $requestId, $actorId, $actorRole, $action, $comment, $previousStatus, $newStatus);

-- Step 6: Insert audit log
INSERT INTO audit_logs (id, actor_id, actor_role, action, resource_type, resource_id, metadata, ip_address)
VALUES (gen_random_uuid(), $actorId, $actorRole, $action, 'LEAVE_REQUEST', $requestId, $metadata, $ip);

-- Step 7: Insert notification(s) for affected parties
INSERT INTO notifications (id, recipient_user_id, event_type, title, message, leave_request_id)
VALUES (...);

-- Step 8: Commit all atomically
COMMIT;
-- If any INSERT fails (constraint violation, etc.): automatic ROLLBACK.
```

### 9.2 Concurrency Scenarios

| Scenario | Outcome |
|---|---|
| Manager A and Manager B both try to approve the same PENDING_MANAGER request simultaneously | First to reach COMMIT wins. Second's SELECT FOR UPDATE reads the updated version; application sees version mismatch and returns HTTP 409. |
| Employee submits edit while Manager is reviewing | If Manager's approval commits first, Employee's edit sees version mismatch and receives 409. If Employee's edit commits first, Manager's approval receives 409. |
| Employee files appeal while request is simultaneously updated | Appeal filing only valid from REJECTED_BY_MANAGER. FOR UPDATE lock prevents both from committing an inconsistent state. |
| Two simultaneous notifications for the same event | Only one transaction can commit for a given version. The other fails at version check. No duplicate notifications. |

### 9.3 Preventing Duplicate Approval Decisions

The `SELECT ... FOR UPDATE` + version check is the **primary** mechanism. It ensures:
1. Only one concurrent transaction can hold the row lock at a time.
2. The committing transaction always changes the version number.
3. Any concurrent transaction that arrives after will see a stale version and receive HTTP 409.

A unique constraint on `decisions` is not used as the primary guard because it would incorrectly block legitimate repeated actions (e.g., multiple EDIT records from the same employee on the same request).

---

## 10. Data Retention and Privacy

| Table | Retention Policy | Privacy Considerations |
|---|---|---|
| `users` | Indefinite. Soft delete via `status = 'INACTIVE'`. | Email and display name are PII. Do not log in full in audit metadata. |
| `leave_requests` | Indefinite. Terminal states are immutable. | Reason text may contain medical information. Restricted to authorized users by application RBAC. |
| `decisions` | Indefinite. Append-only. | Comment text may contain sensitive information. Access restricted to authorized actors. |
| `appeals` | Indefinite. Part of workflow history. | Justification text is sensitive. Access restricted. |
| `documents` | Indefinite (DR-24). Physical storage in MinIO/S3. | File content not in DB. `storage_key` is opaque. Access via authenticated download endpoint only. |
| `audit_logs` | Indefinite. Append-only. | `metadata` JSONB must NOT contain full comment text, file content, or tokens. IP addresses are operational data. |
| `notifications` | Indefinite. Never deleted by application. | Message text references leave request details. Recipient-scoped by application. |
| `holidays` | Indefinite. | No PII. |
| `system_config` | Indefinite. | No PII. Configuration values only. |

**DB user permissions (applied in migration):**
```sql
-- Application runtime user (used by Next.js / Prisma)
GRANT SELECT, INSERT, UPDATE ON leave_requests, users, user_roles, departments,
  leave_type_configs, appeals, documents, holidays, notifications, system_config TO app_user;

GRANT SELECT, INSERT ON decisions TO app_user;
REVOKE UPDATE, DELETE ON decisions FROM app_user;

GRANT INSERT ON audit_logs TO app_user;
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
```

---

## 11. Seed Data Strategy

The seed script (run as a one-shot Docker container) provisions the following for the assessment environment:

### 11.1 Seed Data Entities

| Entity | Assessment Seed |
|---|---|
| `departments` | 1 department: "Engineering" |
| `users` | 1 HOD, 2 Managers, 4 Employees (7 total) |
| `user_roles` | HOD gets [EMPLOYEE, HOD]. Managers get [EMPLOYEE, MANAGER]. Employees get [EMPLOYEE]. |
| `departments.hod_user_id` | Set to HOD user after both records created (two-pass, see below) |
| `users.manager_id` | Each Employee points to an assigned Manager. Each Manager points to HOD (DR-10). |
| `leave_type_configs` | Sick Leave, Casual Leave, Earned Leave, Unpaid Leave |
| `holidays` | Current year public holidays (from bundled JSON config file, DR-17) |
| `system_config` | Proposed-policy defaults only if DR-11/12/13 are confirmed |

### 11.2 Seed Bootstrap Order (Circular FK Resolution)

The `users` and `departments` tables have a circular FK dependency:
- `users.department_id` references `departments.id`
- `departments.hod_user_id` references `users.id`

Resolved in passes:

```
Pass 1: INSERT department with hod_user_id = NULL
Pass 2: INSERT all users with department_id = department.id
Pass 3: UPDATE department SET hod_user_id = hod_user.id
Pass 4: UPDATE each Manager's manager_id = hod_user.id  (DR-10)
Pass 5: INSERT user_roles for all users
Pass 6: INSERT leave_type_configs
Pass 7: INSERT holidays from JSON config
Pass 8: INSERT system_config entries (optional, if policies confirmed)
```

### 11.3 Idempotency

The seed script uses `INSERT ... ON CONFLICT DO NOTHING` (or upsert) for all records keyed on natural unique constraints (e.g., `email`, `firebase_uid`, `holiday.date`). Re-running the seed script on an already-seeded database is safe and produces no duplicates.

---

## 12. Prisma Compatibility Notes

### 12.1 Supported Natively in Prisma Schema

- All standard FK relationships with `onDelete` behaviors (Cascade, Restrict, SetNull).
- Enum types: Prisma `enum` blocks map to PostgreSQL `CREATE TYPE` automatically for the PG provider.
- Composite primary keys: `@@id([user_id, role])` on `user_roles`.
- Standard unique and index declarations: `@@unique`, `@@index`.
- UUID generation: `@default(dbgenerated("gen_random_uuid()"))`.
- INET type for `audit_logs.ip_address`: `@db.Inet`.
- JSONB type for `audit_logs.metadata`: Prisma `Json` scalar maps to JSONB in PostgreSQL.

### 12.2 Requires Custom Migration SQL

The following must be added in raw SQL within Prisma migration files:

```sql
-- 1. Partial unique index on appeals (one active appeal per request)
CREATE UNIQUE INDEX uq_one_active_appeal_per_request
  ON appeals (leave_request_id)
  WHERE status = 'PENDING';

-- 2. Partial index on leave_requests for active queue queries
CREATE INDEX idx_leave_requests_active_status
  ON leave_requests (status)
  WHERE status IN ('PENDING_MANAGER', 'PENDING_HOD', 'UNDER_APPEAL', 'INFO_REQUESTED');

-- 3. Application user permissions
REVOKE UPDATE, DELETE ON decisions FROM app_user;
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;

-- 4. Composite descending index on notifications
CREATE INDEX idx_notifications_recipient_created
  ON notifications (recipient_user_id, created_at DESC);
```

### 12.3 Prisma Schema Naming Convention

Prisma model names are PascalCase; PostgreSQL table names use snake_case. The mapping is declared with `@@map("table_name")` in the Prisma schema. This keeps the TypeScript API clean while maintaining standard PostgreSQL naming conventions.

---

## 13. Open Database Decisions

| ID | Decision | Impact on Schema | Recommended Default |
|---|---|---|---|
| **DR-11** | Maximum leave duration (30 days proposed) | No schema change. Enforced in service layer using `system_config.max_leave_days`. | Implement as configurable parameter. |
| **DR-12** | Retroactive request window (7 days proposed) | No schema change. Enforced in service layer using `system_config.retroactive_window_days`. | Implement as configurable parameter. |
| **DR-13** | Leave balance enforcement (soft warning proposed) | Schema supports it: `leave_type_configs.default_annual_allocation` exists. No additional columns needed for warning mode. Balance calculation is application logic. | Implement as configurable parameter. |
| **DR-16** | HOD's own leave approver | No schema change needed if scoped to assessment. If resolved to "peer HOD", requires cross-department assignment logic. | Out of scope for assessment. |
| **DR-17** | Holiday calendar management | Schema supports runtime editing. Seed-only for assessment. | Seed only. |
| **DR-18** | Leave type configuration rules | `leave_type_configs` table is already designed to support per-type rules. Schema ready. | Implement per-type rules. |
| **DR-19** | Overlapping leave detection | Index on `(start_date, end_date)` already included. Overlap query is application-level logic. | Warn but allow. No schema change. |
| **DR-20** | Appeal withdrawal | If allowed: adds WITHDRAW_APPEAL to `workflow_action` enum and WITHDRAWN to `appeal_status` enum. Requires a migration. | Not allowed for now. No schema change needed. |
| **DR-24** | Document retention | No TTL column. If a retention policy is added later, add `expires_at TIMESTAMPTZ NULLABLE` to `documents`. | Retain indefinitely. No change. |
| **DBO-01** | Leave balance tracking table | If DR-13 requires tracking used days per user per year per type, a `leave_balances` table is needed (user_id, leave_type_id, year, allocated_days, used_days). Currently absent; add only if DR-13 is confirmed. | Defer until DR-13 confirmed. |

---

*End of Database Design Document*

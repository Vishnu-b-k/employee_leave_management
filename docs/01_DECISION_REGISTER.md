# Employee Leave Management System - Decision Register

**Document ID:** 01_DECISION_REGISTER
**Version:** 2.0
**Status:** 12 Confirmed, 13 Open (including 3 proposed policies awaiting owner confirmation)
**Date:** 2026-11-06
**Last Updated:** 2026-11-06
**Companion Document:** [01_REQUIREMENTS_ANALYSIS.md](01_REQUIREMENTS_ANALYSIS.md)

---

## How to Use This Document

- **Confirmed** decisions are final and reflected in the requirements baseline.
- **Needs Decision** entries require stakeholder input before architecture.
- Each entry contains: why it matters, available choices, resolution or recommended default, and impact.

---

## CONFIRMED DECISIONS (DR-01 through DR-10, DR-14, DR-15)

---

### DR-01: Manager Scope - Assigned Employees Only

**Status:** Confirmed

**Resolution:** Managers can access requests belonging only to employees explicitly assigned to them. This follows the principle of least privilege and matches resource-level access control requirements.

**Impact:** Requires a `managerId` field on each user profile. All Manager queries filter by this field. Backend middleware enforces scope.

---

### DR-02: HOD Rejection Finality - Terminal, No Further Appeal

**Status:** Confirmed

**Resolution:** An HOD's final rejection (REJECTED_BY_HOD) is terminal for the assessment workflow. No further appeal is provided. Only Manager rejections (REJECTED_BY_MANAGER) are appealable.

**Impact:** REJECTED_BY_HOD is a terminal state in the state machine. No transitions defined from this state. UI communicates finality.

---

### DR-03: Appeal Overturn Outcome - APPROVED_ON_APPEAL

**Status:** Confirmed

**Resolution:** When the HOD overturns a Manager rejection on appeal, the leave status becomes APPROVED_ON_APPEAL (not ordinary APPROVED). This is an explicit exceptional approval route. The original Manager rejection remains in audit history.

This must NOT be represented as an ordinary Manager approval followed by HOD approval. It is a distinct action.

**Impact:**
- New status value: APPROVED_ON_APPEAL.
- State transition: UNDER_APPEAL -> APPROVED_ON_APPEAL (via APPEAL_APPROVE action).
- Audit event type: APPEAL_APPROVE (distinct from HOD_APPROVE).
- UI must display APPROVED_ON_APPEAL distinctly from APPROVED.
- For long leave, the HOD's appeal overturn also serves as the effective approval.

---

### DR-04: Document Formats and Sizes - Confirmed Defaults

**Status:** Confirmed

**Resolution:**

| Parameter | Value |
|---|---|
| Allowed file types | PDF, PNG, JPG/JPEG, DOCX |
| Max file size per document | 5 MB |
| Max files per request | 5 files |
| Max total size per request | 25 MB |

All limits are configurable. Server-side validation of actual content, extension, and size is mandatory.

**Impact:** Upload middleware enforces limits. Frontend validates pre-upload. Reverse proxy (e.g., Nginx) `client_max_body_size` must match.

---

### DR-05: Notifications - In-App Mandatory, Email Optional

**Status:** Confirmed

**Resolution:**
- In-app notifications are mandatory for all workflow events.
- Email notifications are optional and should use an interchangeable provider interface.
- Core leave workflows must never depend on email delivery.

**Impact:** Notification service uses a provider interface pattern. In-app provider is the default. Email provider can be added without changing business logic. Notifications stored in database, queried by frontend.

---

### DR-06: Account Provisioning - Seed Script for Assessment

**Status:** Confirmed

**Resolution:**
- **Assessment mode:** A repeatable seed process provisions demo accounts (Employee, Manager, HOD) with organizational relationships, holidays, and leave types.
- **Production mode:** Controlled account provisioning via backend. Users cannot choose or self-assign privileged roles during registration.

**Impact:** Requires a backend seed script using Firebase Admin SDK. Script creates users, sets roles, and populates reference data. README documents demo credentials.

---

### DR-07: Holiday and Org Configuration - Seed Script + Config File

**Status:** Confirmed

**Resolution:** Holidays and organizational structure are defined in a JSON config file, loaded by the seed script. The holiday calendar must be identifiable and auditable.

**Impact:** Config file in project. Seed script reads and populates database. Runtime changes require re-seeding or direct database edits (acceptable for assessment).

---

### DR-08: Assessment Environment - Local Services via Docker Compose

**Status:** Confirmed

**Resolution:** Assessment mode uses:
- Firebase Authentication Emulator (for identity only).
- PostgreSQL (business database).
- MinIO (S3-compatible local object storage for documents).
- Docker Compose for orchestration.

Firebase emulators are development/assessment dependencies only, not production services. The database choice (PostgreSQL vs. Firestore vs. other) must be evaluated during architecture design. Firebase Auth is used for identity; the business database is separate.

**Impact:** Docker Compose includes services for Firebase Emulator, PostgreSQL, MinIO, frontend, and backend. Application config switches between assessment and production mode via environment variables.

---

### DR-09: Evaluator Credentials - Demo Accounts, No Cloud Credentials

**Status:** Confirmed

**Resolution:** The evaluator uses demo accounts created by the seed script. No developer's personal Firebase cloud credentials are required. The Firebase Auth Emulator runs locally.

**Impact:** No .env secrets needed for basic evaluation. README lists demo credentials. Seed script is idempotent.

---

### DR-10: Manager's Own Leave - HOD Approves Directly

**Status:** Confirmed

**Resolution:** The HOD acts as the Manager's leave approver. Since self-approval is prohibited, the Manager's leave request routes to the HOD. The Manager's `managerId` can be set to the HOD's user ID.

**Impact:** Workflow engine checks if submitter is a Manager. If so, request routes to HOD instead of self. Alternatively, seed data sets Manager's `managerId` to HOD, and the workflow logic remains uniform.

---

### DR-11: Maximum Leave Duration - 30 Working Days

**Status:** Proposed Policy - Awaiting Owner Confirmation

**Proposed Default:** Maximum 30 working days per single leave request. This is a reasonable corporate default.

**Rationale:** Not derived from the original assignment. This is a recommended operational policy. Should be confirmed by the system owner before being hardcoded into validation logic.

**Impact if adopted:** Validation logic checks against maximum. Should be configurable per leave type.

---

### DR-12: Retroactive Requests - Allow Up to 7 Days Past

**Status:** Proposed Policy - Awaiting Owner Confirmation

**Proposed Default:** Employees may submit leave requests with start dates up to 7 days in the past. This covers emergency/sick leave formalization.

**Rationale:** Not derived from the original assignment. This is a recommended operational policy. The window value should be confirmed by the system owner.

**Impact if adopted:** Date validation compares start date against (today - 7 days). The window should be configurable.

---

### DR-13: Leave Balance Enforcement - Soft Warning

**Status:** Proposed Policy - Awaiting Owner Confirmation

**Proposed Default:** When an employee requests more days than their available balance, the system displays a visible warning but allows submission. The Manager sees the warning during review.

**Rationale:** Not derived from the original assignment. This is a recommended operational policy. Some organizations may prefer hard enforcement.

**Impact if adopted:** Leave balance calculation service exists. Submission API returns a warning flag. Frontend displays warning. Warning metadata included in request for Manager review.

---

### DR-14: Appeal Override for Long Leave - APPROVED_ON_APPEAL Directly

**Status:** Confirmed

**Resolution:** If the Manager rejects a long-leave request and the employee appeals, the HOD may directly overturn the rejection. This is recorded as APPROVED_ON_APPEAL, not as an ordinary two-stage approval. The HOD's authority is absolute within the department.

**Impact:** The UNDER_APPEAL -> APPROVED_ON_APPEAL transition is valid regardless of whether the original request required HOD approval. No additional approval step after appeal overturn.

---

### DR-15: Concurrent Modification - PostgreSQL Transactions + Optimistic Version

**Status:** Confirmed

**Resolution:** Use PostgreSQL transactions and an optimistic concurrency mechanism with a `version` field on leave requests. Each state-changing operation reads current status and version within a transaction, verifies expected state, increments version on write.

**Impact:** All status-changing operations use database transactions. API returns 409 Conflict on version mismatch. Frontend handles 409 gracefully.

---

## OPEN DECISIONS (DR-16 through DR-25)

---

### DR-16: Who Approves the HOD's Own Leave?

**Status:** Needs Decision

### Why It Matters

The system prohibits self-approval. If the HOD submits their own leave, who approves it? Unlike DR-10 (Manager's leave goes to HOD), there is no higher authority defined in the current three-role model.

### Available Choices

| Option | Description | Trade-off |
|---|---|---|
| A. Another HOD (peer) | If the organization has multiple departments, a peer HOD from another department could approve. | Requires cross-department assignment logic. What if only one department? |
| B. A designated super-admin role | Introduce an Admin role that can approve HOD leave. | Adds a fourth role. Significant scope increase. |
| C. Self-approval exception for HOD | Allow HOD to approve their own leave with audit logging. | Breaks the no-self-approval rule. Weak control. |
| D. Out of scope - document the gap | Acknowledge as a known limitation for the assessment. HOD accounts do not submit leave in demo. | Simplest. Acceptable for assessment scope. |

### Recommended Default

**Option D: Out of scope for assessment.** Document it as a known limitation. The seed script can omit HOD leave submission in demo scenarios.

### Impact on Architecture

If Option D: No additional workflow logic needed. If later addressed, requires either a new role or cross-department approval routing.

---

### DR-17: Who Manages the Organization's Holiday Calendar?

**Status:** Needs Decision

### Why It Matters

Holidays directly affect working-day calculations (a core business rule). Someone must be able to add, edit, and remove holidays. The mechanism affects data integrity and operational workflow.

### Available Choices

| Option | Description | Trade-off |
|---|---|---|
| A. Seed script only | Holidays are pre-loaded at setup. No runtime editing. | Simplest. Evaluator modifies config file and re-seeds. Not realistic for production. |
| B. HOD can manage holidays for their department | HODs get a holiday management UI. | Requires additional UI and API. Allows per-department holidays. |
| C. Admin-only via protected API | A protected API endpoint (no UI). Admin uses curl/Postman. | Moderate effort. No UI overhead. |
| D. Admin panel UI | Dedicated admin interface for holiday CRUD. | Most user-friendly. Most development effort. |

### Recommended Default

**Option A for assessment, with service layer designed to support Option C later.**

### Impact on Architecture

Service interface for holiday CRUD. Assessment uses seed data. Production can add admin API without refactoring.

---

### DR-18: Whether Leave Types Need Separate Configurations

**Status:** Needs Decision

### Why It Matters

Different leave types (sick, casual, earned, unpaid) may have different annual allocations, document requirements, and balance rules. The level of configuration affects data model complexity.

### Available Choices

| Option | Description | Trade-off |
|---|---|---|
| A. Simple list with name only | Leave types are just labels. No per-type rules. | Simplest. Loses ability to enforce type-specific rules. |
| B. Configurable per-type rules | Each leave type has: name, annual allocation, requires_document flag, max_duration. | More complex data model. More realistic. |
| C. Hardcoded types | Leave types are fixed in code. | Least flexible. Not recommended. |

### Recommended Default

**Option B: Configurable per-type rules.** This is already partially modeled in the Leave Type Configuration entity (E.1.8).

### Impact on Architecture

Leave Type entity needs additional fields. Validation logic must check per-type rules.

---

### DR-19: Whether Overlapping Leave Requests Should Be Rejected Automatically

**Status:** Needs Decision

### Why It Matters

An employee could submit two leave requests for overlapping date ranges. Without a check, both could be approved, creating scheduling conflicts.

### Available Choices

| Option | Description | Trade-off |
|---|---|---|
| A. Hard reject on overlap | System prevents submission if dates overlap with an existing non-cancelled request. | Strictest. May block legitimate corrections. |
| B. Warn but allow | System warns about overlap but allows submission. Manager sees warning. | More flexible. Manager makes final decision. |
| C. No check | No overlap detection. | Simplest. Risk of double-booking. |

### Recommended Default

**Option B: Warn but allow.** Consistent with the soft-warning approach used for leave balances (DR-13).

### Impact on Architecture

Overlap detection query during submission. Warning flag in response and request metadata.

---

### DR-20: Whether an Employee Should Be Able to Withdraw an Appeal

**Status:** Needs Decision

### Why It Matters

Once an employee appeals, the request moves to UNDER_APPEAL. If the employee changes their mind, can they withdraw the appeal? Without withdrawal, the HOD must act on every appeal.

### Available Choices

| Option | Description | Trade-off |
|---|---|---|
| A. Allow withdrawal | Employee can withdraw appeal. Status returns to REJECTED_BY_MANAGER. | More flexible. Requires new transition: UNDER_APPEAL -> REJECTED_BY_MANAGER (via WITHDRAW_APPEAL). |
| B. No withdrawal | Once filed, appeal must be resolved by HOD. | Simpler state machine. Employee cannot undo their appeal. |

### Recommended Default

**Option B: No withdrawal.** Keeps the state machine simpler. The employee should consider the appeal carefully before filing.

### Impact on Architecture

If Option A: Add WITHDRAW_APPEAL action and transition. If Option B: No change.

---

### DR-21: Whether Managers Should See Team Leave Calendars

**Status:** Needs Decision

### Why It Matters

A team leave calendar helps managers plan staffing. Without it, managers only see individual requests.

### Available Choices

| Option | Description | Trade-off |
|---|---|---|
| A. Calendar view of approved leaves | Managers see a calendar showing approved leaves for their assigned employees. | Useful feature. Additional UI component. |
| B. List view only | Managers see a table/list of requests. No calendar. | Simpler. Less visual. |
| C. Optional enhancement | Build if time permits after core features. | Pragmatic. |

### Recommended Default

**Option C: Optional enhancement.** Core functionality first. Calendar view is a polish feature.

### Impact on Architecture

If implemented: API endpoint to return approved leaves by date range for a manager's employees. Calendar UI component.

---

### DR-22: Which Notification Types Should Be Displayed In-App

**Status:** Needs Decision

### Why It Matters

Not all events may warrant a notification. Too many notifications create noise. Too few cause users to miss important events.

### Available Choices

| Option | Description |
|---|---|
| A. All workflow events | Every state transition generates a notification. |
| B. Key events only | Only: approval, rejection, info request, appeal filed, appeal decided. |
| C. Configurable per user | Users choose which notifications they receive. |

### Recommended Default

**Option B: Key events only.** Keeps notifications meaningful without overwhelming users.

### Impact on Architecture

Notification service filters by event type. Notification type enum controls which events trigger notifications.

---

### DR-23: Whether Email Notifications Should Be Enabled in Production by Default

**Status:** Needs Decision

### Why It Matters

DR-05 confirms email is optional. But for production deployments, should email be on by default if an email provider is configured?

### Available Choices

| Option | Description | Trade-off |
|---|---|---|
| A. Disabled by default | Email off unless explicitly enabled via config. | Safest. No surprise emails. |
| B. Enabled if provider configured | If email credentials are present, email notifications activate. | Convenient but may surprise. |
| C. Per-user opt-in | Users choose to enable email. | Most user-friendly. Requires UI for preferences. |

### Recommended Default

**Option A: Disabled by default.** Email is opt-in at the deployment level.

### Impact on Architecture

Environment variable flag controls email. Provider interface checks flag before sending.

---

### DR-24: Whether Attachments Should Be Retained or Deleted After a Specified Period

**Status:** Needs Decision

### Why It Matters

Long-term storage of documents incurs costs and may have data retention policy implications.

### Available Choices

| Option | Description | Trade-off |
|---|---|---|
| A. Retain indefinitely | Documents never auto-deleted. | Simplest. Growing storage cost. |
| B. Delete after configurable period | Auto-delete documents after N months/years. | Requires background job. Data retention compliance. |
| C. Archive to cold storage | Move old documents to cheaper storage tier. | Most complex. Best cost optimization. |

### Recommended Default

**Option A: Retain indefinitely.** For assessment scope, auto-deletion adds unnecessary complexity. Document the recommendation for production.

### Impact on Architecture

If Option B/C: Requires background job, retention policy config, and archive logic.

---

### DR-25: Whether Employee and Manager Records Should Include Department and Reporting Hierarchy

**Status:** Needs Decision

### Why It Matters

The current data model has `departmentId` and `managerId` on user profiles. The question is whether these fields are sufficient or whether a more explicit hierarchy structure is needed.

### Available Choices

| Option | Description | Trade-off |
|---|---|---|
| A. Flat fields on user profile | departmentId and managerId fields on user table. Sufficient for current requirements. | Simple. Works for single-department-per-user. |
| B. Separate reporting structure table | A join table for reporting relationships. Supports multiple managers, cross-department assignments. | More complex. Future-proof. |
| C. Department membership table | Separate table for department membership. Users can belong to multiple departments. | Most flexible. Most complex. |

### Recommended Default

**Option A: Flat fields.** The current three-role model with single department assignment is sufficient. The data model already captures this.

### Impact on Architecture

If Option A: No change. If Option B/C: Additional tables and query complexity.

---

## Decision Summary

### Confirmed (12)

| ID | Topic | Resolution | Blocking? |
|---|---|---|---|
| DR-01 | Manager scope | Assigned employees only | Resolved |
| DR-02 | HOD rejection finality | Terminal, no appeal | Resolved |
| DR-03 | Appeal overturn outcome | APPROVED_ON_APPEAL | Resolved |
| DR-04 | Document constraints | PDF/PNG/JPG/JPEG/DOCX, 5 MB | Resolved |
| DR-05 | Notification channels | In-app mandatory, email optional | Resolved |
| DR-06 | Account provisioning | Seed script (assessment), controlled (production) | Resolved |
| DR-07 | Holiday/org config | Seed script + config file | Resolved |
| DR-08 | Assessment environment | Firebase Auth Emulator + PostgreSQL + MinIO | Resolved |
| DR-09 | Evaluator credentials | Demo accounts, no cloud creds | Resolved |
| DR-10 | Manager's own leave | HOD approves directly | Resolved |
| DR-14 | Appeal override for long leave | APPROVED_ON_APPEAL directly | Resolved |
| DR-15 | Concurrent modification | PostgreSQL transactions + version | Resolved |

### Proposed Policies Awaiting Owner Confirmation (3)

| ID | Topic | Proposed Default | Blocking Architecture? |
|---|---|---|---|
| DR-11 | Max leave duration | 30 working days (configurable) | No |
| DR-12 | Retroactive requests | Allow up to 7 days past (configurable) | No |
| DR-13 | Leave balance enforcement | Soft warning | No |

### Open (10)

| ID | Topic | Recommended Default | Blocking Architecture? |
|---|---|---|---|
| DR-16 | HOD's own leave approver | Out of scope for assessment | No |
| DR-17 | Holiday calendar management | Seed script only (assessment) | No |
| DR-18 | Leave type configurations | Configurable per-type rules | No - default model exists |
| DR-19 | Overlapping leave detection | Warn but allow | No |
| DR-20 | Appeal withdrawal | Not allowed | No |
| DR-21 | Team leave calendars | Optional enhancement | No |
| DR-22 | In-app notification types | Key events only | No |
| DR-23 | Email in production by default | Disabled by default | No |
| DR-24 | Attachment retention policy | Retain indefinitely | No |
| DR-25 | Department/hierarchy in records | Flat fields on user profile | No |

**Correction from Step 1:** The previous report stated "8 blocking decisions but listed 9." The actual count was 9 decision IDs listed as blocking (DR-01, 02, 03, 06, 08, 09, 10, 14, 15). The text "8 blocking" was the error. All 9 are now confirmed, making the discrepancy moot. None of the 10 new open decisions block architecture design.

---

*End of Decision Register*

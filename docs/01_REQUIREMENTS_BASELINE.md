# Employee Leave Management System - Requirements Baseline

**Document ID:** 01_REQUIREMENTS_BASELINE
**Version:** 2.0
**Status:** Baselined
**Date:** 2026-11-06
**Last Updated:** 2026-11-06
**Source Documents:**
- [01_REQUIREMENTS_ANALYSIS.md](01_REQUIREMENTS_ANALYSIS.md)
- [01_DECISION_REGISTER.md](01_DECISION_REGISTER.md)

---

This document summarizes the confirmed requirements baseline. Each requirement is classified by its source:

- **Assignment** — Explicitly stated in the original coding assessment.
- **Confirmed Decision** — Resolved via stakeholder decision (DR-01 through DR-10, DR-14, DR-15).
- **Proposed Policy** — Recommended defaults not derived from the assignment (DR-11, DR-12, DR-13). Awaiting owner confirmation. NOT treated as mandatory acceptance criteria.
- **Unresolved** — Open decisions (DR-16 through DR-25) that do not block architecture.

---

## 1. System Overview

An Employee Leave Management System with three user roles (Employee, Manager, HOD) supporting leave applications, multi-level approvals, appeals, document handling, and request tracking.

**Assessment environment:** Firebase Auth Emulator + PostgreSQL + MinIO + Docker Compose. *(Confirmed: DR-08.)*

**Production direction:** Firebase Authentication + PostgreSQL + S3-compatible object storage. Final database choice justified in architecture design.

---

## 2. Roles and Permissions

### 2.1 Employee *(Source: Assignment)*

- Submit leave requests (short and long leave).
- View own requests and leave history.
- Attach supporting documents.
- Edit or cancel requests while in PENDING_MANAGER status only.
- Respond to Manager info requests (upload docs, resubmit same request).
- Appeal Manager rejections to HOD. *(Confirmed: DR-03.)*
- View own audit trail.

**Cannot:** View others' requests, approve/reject, modify finalized requests, change own role.

### 2.2 Manager *(Source: Assignment)*

- View pending requests from assigned employees only. *(Confirmed: DR-01.)*
- Approve short leave (final), approve long leave (forwards to HOD as PENDING_HOD).
- Reject with mandatory comment.
- Request additional information.
- View supporting documents for assigned employees.
- View own decision history.

**Cannot:** Approve own leave (routes to HOD per DR-10), override HOD decisions, access other managers' employees, delete requests.

### 2.3 HOD *(Source: Assignment)*

- Second-level approval for long leave (>3 working days) when request is in PENDING_HOD.
- Review and decide employee appeals against Manager rejections.
- Uphold rejection (-> APPEAL_REJECTED) or overturn (-> APPROVED_ON_APPEAL).
- View full department request history and documents.

**Cannot:** Approve own leave, bypass Manager for normal workflow, delete requests, assign roles via UI.

### 2.4 System Administrator (Implicit) *(Source: Confirmed Decision DR-06)*

- Provisions accounts via seed script (assessment) or controlled backend (production).
- Users cannot self-assign privileged roles.

---

## 3. Workflow States (10 States)

| State | Description | Terminal? |
|---|---|---|
| PENDING_MANAGER | Awaiting Manager review | No |
| INFO_REQUESTED | Manager requested additional information | No |
| PENDING_HOD | Manager approved long leave; awaiting HOD. Manager's approval recorded in decision history. | No |
| APPROVED | Fully approved through normal workflow | Yes |
| APPROVED_ON_APPEAL | HOD overturned Manager rejection via appeal *(DR-03)* | Yes |
| REJECTED_BY_MANAGER | Manager rejected; employee may appeal | No |
| REJECTED_BY_HOD | HOD rejected at second level; terminal *(DR-02)* | Yes |
| UNDER_APPEAL | Employee appealed Manager rejection to HOD | No |
| APPEAL_REJECTED | HOD upheld Manager rejection; terminal | Yes |
| CANCELLED | Employee cancelled the request | Yes |

**Design notes:**
- PENDING_MANAGER replaces generic "PENDING". Every new submission begins here.
- PENDING_HOD replaces "MANAGER_APPROVED". Manager's approval is a recorded decision event, not a standalone workflow state. The request transitions to PENDING_HOD to await HOD action.
- APPROVED_ON_APPEAL is explicitly distinct from APPROVED. It must be distinguishable in the database, UI, and audit trail.
- A HOD decision on appeal is NOT treated as an ordinary second-level approval.

---

## 4. State Transition Table

### 4.1 Valid Transitions

| From State | Actor | Action | To State | Audit Event | Source |
|---|---|---|---|---|---|
| (new) | Employee | Submit (<=3 days) | PENDING_MANAGER | SUBMIT | Assignment |
| (new) | Employee | Submit (>3 days, with docs) | PENDING_MANAGER | SUBMIT | Assignment |
| PENDING_MANAGER | Employee | Edit | PENDING_MANAGER | EDIT | Decision |
| PENDING_MANAGER | Employee | Cancel | CANCELLED | CANCEL | Decision |
| PENDING_MANAGER | Manager | Approve (<=3 days) | APPROVED | APPROVE | Assignment |
| PENDING_MANAGER | Manager | Approve (>3 days) | PENDING_HOD | APPROVE | Assignment |
| PENDING_MANAGER | Manager | Reject (comment required) | REJECTED_BY_MANAGER | REJECT | Assignment |
| PENDING_MANAGER | Manager | Request info (comment required) | INFO_REQUESTED | REQUEST_INFO | Assignment |
| INFO_REQUESTED | Employee | Resubmit with info | PENDING_MANAGER | RESUBMIT | Assignment |
| PENDING_HOD | HOD | Approve (second level) | APPROVED | HOD_APPROVE | Assignment |
| PENDING_HOD | HOD | Reject (comment required) | REJECTED_BY_HOD | HOD_REJECT | Assignment |
| REJECTED_BY_MANAGER | Employee | Appeal (justification required) | UNDER_APPEAL | APPEAL | Decision (DR-03) |
| UNDER_APPEAL | HOD | Uphold rejection | APPEAL_REJECTED | APPEAL_REJECT | Decision (DR-03) |
| UNDER_APPEAL | HOD | Overturn rejection | APPROVED_ON_APPEAL | APPEAL_APPROVE | Decision (DR-03) |

### 4.2 Terminal States (No Outbound Transitions)

APPROVED, APPROVED_ON_APPEAL, REJECTED_BY_HOD, APPEAL_REJECTED, CANCELLED.

### 4.3 Cancellation

Employee may cancel a request while it is in PENDING_MANAGER status. All other states are not cancellable by the employee.

---

## 5. Confirmed Business Rules

### 5.1 Leave Calculation *(Source: Assignment)*

- Working days exclude Saturdays, Sundays, and configured holidays.
- Backend is authoritative for all calculations.
- The "3 consecutive working days" threshold is computed server-side.

### 5.2 Long Leave (>3 Working Days) *(Source: Assignment)*

- Requires supporting documentation (at least one file).
- Requires Manager approval, then HOD approval (two-stage).
- Submission rejected if documents missing.

### 5.3 Appeal Process *(Source: Confirmed Decision DR-03)*

- Employee may appeal only after REJECTED_BY_MANAGER.
- Appeal is linked to original request (not a new request).
- Only one active appeal per rejected request.
- HOD sees full context: original request, Manager rejection + comments, employee appeal justification.
- Manager's original rejection is never erased.
- HOD can uphold (APPEAL_REJECTED) or overturn (APPROVED_ON_APPEAL).
- HOD rejection at second level (REJECTED_BY_HOD) is terminal; no appeal path (DR-02).
- HOD appeal overturn is a distinct action from ordinary second-level approval.

### 5.4 Information Request *(Source: Assignment)*

- Manager requests info -> request enters INFO_REQUESTED.
- Employee submits additional docs/comments -> returns to PENDING_MANAGER.
- Original request ID preserved; no duplicate created.

### 5.5 Employee Modifications *(Source: Confirmed Decision)*

- Edit and cancel only while PENDING_MANAGER.
- Finalized requests (APPROVED, REJECTED, CANCELLED) are immutable.
- INFO_REQUESTED requests modified only through the resubmit flow.

### 5.6 Manager's Own Leave *(Source: Confirmed Decision DR-10)*

- HOD acts as Manager's leave approver.
- Manager's `managerId` set to HOD user ID.

### 5.7 Document Constraints *(Source: Confirmed Decision DR-04)*

| Parameter | Value |
|---|---|
| File types | PDF, PNG, JPG/JPEG, DOCX |
| File size per document | 5 MB (configurable) |
| Files per request | 5 (configurable) |
| Total upload per request | 25 MB (configurable) |

### 5.8 Concurrency *(Source: Confirmed Decision DR-15)*

- All state transitions use database transactions.
- Optimistic concurrency with version field on leave requests.
- 409 Conflict on version mismatch.

---

## 6. Confirmed Non-Functional Requirements

### 6.1 Security *(Source: Assignment + Implied)*

- All endpoints enforce authentication and RBAC.
- Resource-level access control (ownership checks on every request).
- File upload: server-side MIME + extension + size validation.
- Protection against XSS, CSRF, injection, IDOR.
- Secure error handling (no stack traces to client).
- HTTPS in production.

### 6.2 Audit *(Source: Assignment)*

- Immutable audit logs for all sensitive operations.
- Each entry: actor, role, action, target, timestamp, metadata.
- Audit events: SUBMIT, APPROVE, REJECT, REQUEST_INFO, RESUBMIT, APPEAL, APPEAL_APPROVE, APPEAL_REJECT, EDIT, CANCEL, HOD_APPROVE, HOD_REJECT.
- Audit logs not editable or deletable via application.

### 6.3 Notifications *(Source: Confirmed Decision DR-05)*

- In-app notifications mandatory for all key workflow events.
- Email notifications optional, via interchangeable provider interface.
- Core workflows never depend on email delivery.

### 6.4 Assessment Packaging *(Source: Assignment + Confirmed Decisions DR-08, DR-09)*

- Docker Compose orchestrates all services.
- Firebase Auth Emulator for identity.
- PostgreSQL for business data.
- MinIO for document storage.
- Seed script creates demo accounts and test data. *(DR-06.)*
- No developer cloud credentials required for evaluation. *(DR-09.)*
- README with complete setup and run instructions.
- ZIP distribution.

### 6.5 UI/UX *(Source: Assignment)*

- Distinct public landing page (modern, premium, intentionally designed).
- Role-specific dashboards.
- Color-coded status indicators.
- Responsive: desktop, tablet, mobile.
- Friendly error messages.

---

## 7. Data Entities

| Entity | Key Fields | Notes |
|---|---|---|
| User | userId, email, displayName, role, departmentId, managerId | Role managed by backend only |
| Leave Request | requestId, employeeId, leaveType, startDate, endDate, calculatedWorkingDays, reason, status, requiresHodApproval, version | 10 status values; version for optimistic concurrency |
| Decision | decisionId, requestId, actorId, actorRole, action, comment, previousStatus, newStatus, timestamp | Complete workflow history. Manager's approval of long leave is a decision record. |
| Document | documentId, requestId, uploadedBy, fileName, fileType, fileSize, storagePath, uploadPhase | INITIAL or ADDITIONAL |
| Appeal | appealId, requestId, employeeId, justification, managerRejectionDecisionId, hodDecisionId, status | PENDING / UPHELD / OVERTURNED |
| Department | departmentId, name, hodId | One HOD per department |
| Holiday | holidayId, date, name, year | Identifiable by year |
| Leave Type Config | leaveTypeId, name, defaultAllocation, requiresDocument, isActive | Configurable per type |
| Notification | notificationId, recipientId, type, title, message, relatedRequestId, isRead | In-app delivery |
| Audit Log | logId, actorId, actorRole, action, resourceType, resourceId, details, timestamp, ipAddress | Append-only |

---

## 8. Proposed Policies (NOT Part of Baseline)

The following are recommended defaults NOT derived from the original assignment. They should be confirmed by the system owner before being hardcoded into validation logic. They do NOT block architecture design.

| ID | Topic | Proposed Default | Rationale |
|---|---|---|---|
| DR-11 | Max leave duration per request | 30 working days (configurable) | Reasonable corporate default; not in original assignment |
| DR-12 | Retroactive request window | Up to 7 days past (configurable) | Covers emergency/sick leave formalization; not in original assignment |
| DR-13 | Leave balance enforcement | Soft warning, not hard block | Allows flexibility; not in original assignment |

These values should be implemented as configurable parameters, not hardcoded constants.

---

## 9. Unresolved Items (NOT Part of Baseline)

The following decisions are open. They do NOT block architecture design but should be resolved before implementation of the affected features.

| ID | Topic | Recommended Default |
|---|---|---|
| DR-16 | HOD's own leave approver | Out of scope for assessment |
| DR-17 | Holiday calendar management | Seed script only (assessment) |
| DR-18 | Leave type configurations | Configurable per-type rules |
| DR-19 | Overlapping leave detection | Warn but allow |
| DR-20 | Appeal withdrawal | Not allowed |
| DR-21 | Team leave calendars | Optional enhancement |
| DR-22 | In-app notification types | Key events only |
| DR-23 | Email in production by default | Disabled by default |
| DR-24 | Attachment retention policy | Retain indefinitely |
| DR-25 | Department/hierarchy in records | Flat fields on user profile |

Full details in [01_DECISION_REGISTER.md](01_DECISION_REGISTER.md).

---

## 10. Original Assignment Traceability

The following mandatory requirements from the original assignment are confirmed as represented:

| Assignment Requirement | Baseline Coverage |
|---|---|
| Three distinct roles: Employee, Manager, HOD | Section 2 |
| Leave application with type, dates, reason | Section 5.1, FR-EMP-01 |
| Supporting documents for long leave | Section 5.2, FR-DOC-01 |
| Manager first-level approval/rejection | Section 4.1 (PENDING_MANAGER transitions) |
| HOD second-level approval for >3 day leave | Section 4.1 (PENDING_HOD transitions) |
| Employee appeal against Manager rejection | Section 5.3, Section 4.1 (UNDER_APPEAL transitions) |
| Request tracking with status indicators | Section 6.5, FR-EMP-03, FR-EMP-11 |
| Document upload and management | Section 5.7, FR-DOC-01 through FR-DOC-07 |
| Manager requests additional information | Section 5.4, FR-MGR-06 |
| Audit trail for all workflow actions | Section 6.2, FR-AUD-01 through FR-AUD-03 |
| Color-coded status indicators | Section 6.5, NFR-USA-01 |
| Role-specific dashboards | Section 6.5, FR-AUTH-06 |
| Docker-compatible packaging | Section 6.4, NFR-PKG-01 through NFR-PKG-05 |
| Landing page | Section 6.5, FR-LP-01 through FR-LP-04 |
| Firebase Authentication | FR-AUTH-01 |
| Responsive design | NFR-RES-01 |
| Working days calculation (excl. weekends/holidays) | Section 5.1, FR-WF-01 |

No new company HR policies were invented. DR-11, DR-12, and DR-13 are clearly labelled as proposed policies awaiting confirmation.

---

*End of Requirements Baseline*

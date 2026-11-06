# Employee Leave Management System - Requirements Analysis

**Document ID:** 01_REQUIREMENTS_ANALYSIS
**Version:** 3.0
**Status:** Baselined - Decisions DR-01 through DR-10, DR-14, DR-15 confirmed; DR-11/12/13 proposed policies
**Date:** 2026-11-06
**Last Updated:** 2026-11-06

---

## A. Stakeholder and Role Analysis

### A.1 Employee

**Description:** A regular employee who consumes leave. Primary user of the system.

**Permitted Operations:**

- Create new leave requests.
- View own leave requests and full leave history.
- Check the status of own submitted requests.
- Attach supporting documents to leave requests.
- Edit a leave request **only while it is in PENDING_MANAGER status**.
- Cancel a leave request **only while it is in PENDING_MANAGER status**.
- Upload additional documents in response to a Manager's request for more information, resubmitting the **same** request (no duplicate created).
- Appeal a Manager rejection directly to the HOD, preserving the original rejection and Manager's comments.
- View own audit trail for a given request.

**Restrictions:**

- Cannot view other employees' leave requests or documents.
- Cannot approve, reject, or make decisions on any request.
- Cannot modify or cancel a request that has been approved, rejected, or is under HOD review.
- Cannot assign or change their own role.

### A.2 Manager

**Description:** A mid-level supervisor responsible for first-level review of leave requests from employees they manage.

**Permitted Operations:**

- View pending leave requests from employees assigned to them. *(Confirmed: DR-01 - Assigned employees only.)*
- Approve leave requests (single approval sufficient for three or fewer working days).
- Reject leave requests with mandatory comments.
- Add comments when approving or rejecting.
- View supporting documents uploaded by employees.
- Request additional information from an employee, transitioning the request to INFO_REQUESTED status.
- View decision history for requests they have acted on.

**Restrictions:**

- Cannot approve their own leave requests.
- Cannot override an HOD decision.
- Cannot access requests belonging to employees outside their management scope. *(Confirmed: DR-01.)*
- Cannot assign or change roles.
- Cannot delete leave requests.

### A.3 HOD (Head of Department)

**Description:** The senior department authority responsible for second-level approval of long leave requests and final authority on employee appeals.

**Permitted Operations:**

- View leave requests in their department that require HOD-level approval (more than three working days, after Manager approval).
- Provide second-level approval for long leave requests.
- Reject long leave requests at the HOD level with comments.
- Review employee appeals against Manager rejections. *(Confirmed: DR-02 - HOD rejection is terminal, no further appeal.)*
- Uphold or overturn a Manager's rejection through the appeal process. *(Confirmed: DR-03 - HOD overturn = APPROVED_ON_APPEAL.)*
- View supporting documents and full decision history for requests in their department.
- Add comments on decisions.

**Restrictions:**

- Cannot approve their own leave requests.
- Cannot bypass the Manager's first-level review for normal workflow (the Manager must act first for non-appeal flows).
- Cannot delete leave requests.
- Cannot assign or change roles through the application UI. *(Confirmed: DR-06 - Seed script for assessment, controlled provisioning for production.)*

### A.4 System Administrator (Implicit)

**Description:** Not a user-facing role within the application UI, but someone responsible for:

- Provisioning user accounts and assigning roles via backend seed scripts (assessment mode) or controlled backend processes (production mode). *(Confirmed: DR-06.)*
- Configuring holidays. *(See Decision DR-17.)*
- Managing organizational reporting structures.

Users cannot self-assign privileged roles during registration.

---

## B. Functional Requirements

### B.1 Landing Page and Onboarding

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-LP-01 | The system SHALL provide a dedicated public landing page accessible without authentication. | Mandatory | User Decision |
| FR-LP-02 | The landing page SHALL present the system's purpose, features, and a clear call-to-action for login. | Mandatory | User Decision |
| FR-LP-03 | The landing page SHALL be visually distinctive, modern, premium and intentionally designed. It must avoid generic AI-generated dashboard styling. | Mandatory | User Decision |
| FR-LP-04 | The landing page SHALL provide navigation to the login/sign-up page. | Mandatory | Implied |

### B.2 Authentication

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-AUTH-01 | The system SHALL use Firebase Authentication as the authentication provider. | Mandatory | User Decision |
| FR-AUTH-02 | The system SHALL support separate Employee, Manager, and HOD accounts. | Mandatory | User Decision |
| FR-AUTH-03 | The system SHALL NOT require mandatory email OTP verification for login due to email delivery restrictions. | Mandatory | User Decision |
| FR-AUTH-04 | User roles MUST NOT be assigned or changed through an untrusted frontend request. Role assignment must be performed through a trusted backend or admin process. | Mandatory | User Decision |
| FR-AUTH-05 | The system SHALL support email/password-based authentication at minimum. | Mandatory | Implied |
| FR-AUTH-06 | Upon successful authentication, the system SHALL redirect the user to their role-specific workspace/dashboard. | Mandatory | Implied |
| FR-AUTH-07 | The system SHALL provide logout functionality that invalidates the user session. | Mandatory | Implied |
| FR-AUTH-08 | The system SHALL display friendly error messages for authentication failures (wrong password, account not found, etc.). | Mandatory | Assignment |

### B.3 Employee Operations

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-EMP-01 | An employee SHALL be able to submit a new leave request specifying leave type, start date, end date, and reason. | Mandatory | Assignment |
| FR-EMP-02 | An employee SHALL be able to view all their own submitted leave requests. | Mandatory | Assignment |
| FR-EMP-03 | An employee SHALL be able to view the current status of any of their own requests. | Mandatory | Assignment |
| FR-EMP-04 | An employee SHALL be able to attach supporting documents to a leave request during submission. | Mandatory | Assignment |
| FR-EMP-05 | An employee SHALL be able to view their complete leave history with status indicators. | Mandatory | Assignment |
| FR-EMP-06 | An employee SHALL be able to edit a leave request only while it is in PENDING_MANAGER status. | Mandatory | User Decision |
| FR-EMP-07 | An employee SHALL be able to cancel a leave request only while it is in PENDING_MANAGER status. | Mandatory | User Decision |
| FR-EMP-08 | When a Manager requests additional information, the employee SHALL be able to upload additional documents and resubmit the same request without creating a duplicate application. | Mandatory | User Decision |
| FR-EMP-09 | An employee SHALL be able to appeal a Manager rejection directly to the HOD. | Mandatory | User Decision |
| FR-EMP-10 | The appeal SHALL be linked to the original request and SHALL preserve the Manager's original rejection, comments, and decision history. | Mandatory | User Decision |
| FR-EMP-11 | An employee SHALL see color-coded status indicators for each request. | Mandatory | Assignment |
| FR-EMP-12 | An employee SHALL be able to view the calculated working days for a leave request (excluding weekends and configured holidays). | Important | Implied |
| FR-EMP-13 | An employee's dashboard SHALL display a summary of leave balances by type. | Important | Implied |
| FR-EMP-14 | An employee SHOULD receive notifications for status changes on their requests. | Important | Implied |

### B.4 Manager Operations

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-MGR-01 | A Manager SHALL be able to view all pending leave requests from employees they manage. | Mandatory | Assignment |
| FR-MGR-02 | A Manager SHALL be able to approve a leave request. | Mandatory | Assignment |
| FR-MGR-03 | A Manager SHALL be able to reject a leave request. | Mandatory | Assignment |
| FR-MGR-04 | A Manager SHALL be able to add comments when approving or rejecting a request. | Mandatory | Assignment |
| FR-MGR-05 | A Manager SHALL be able to view supporting documents uploaded by the employee. | Mandatory | Assignment |
| FR-MGR-06 | A Manager SHALL be able to request additional information from an employee, transitioning the request to INFO_REQUESTED status. | Mandatory | Assignment |
| FR-MGR-07 | A Manager's dashboard SHALL display a summary of pending, approved, and rejected request counts. | Important | Implied |
| FR-MGR-08 | A Manager SHALL be able to view the history of decisions they have made. | Important | Implied |
| FR-MGR-09 | A Manager SHOULD receive notifications when new leave requests arrive. | Important | Implied |

### B.5 HOD Operations

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-HOD-01 | The HOD SHALL be able to view leave requests in their department that require second-level approval (more than three working days, after Manager approval). | Mandatory | Assignment |
| FR-HOD-02 | The HOD SHALL be able to approve or reject long leave requests as a second approver. | Mandatory | Assignment |
| FR-HOD-03 | The HOD SHALL be able to review employee appeals against Manager rejections. | Mandatory | User Decision |
| FR-HOD-04 | The HOD SHALL be able to uphold or overturn a Manager's rejection through the appeal process with comments. | Mandatory | User Decision |
| FR-HOD-05 | The HOD SHALL be able to view the full decision history and all documents for requests they review. | Mandatory | User Decision |
| FR-HOD-06 | The HOD SHALL be able to add comments to their decisions. | Mandatory | Implied |
| FR-HOD-07 | The HOD's dashboard SHALL display a summary of items awaiting their action. | Important | Implied |
| FR-HOD-08 | The HOD SHOULD receive notifications when requests require their attention. | Important | Implied |

### B.6 Leave Workflow

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-WF-01 | Leave duration SHALL be calculated in working days, excluding weekends and configured holidays. The backend is authoritative for all calculations. | Mandatory | User Decision |
| FR-WF-02 | A leave request of three or fewer working days SHALL require only Manager approval. | Mandatory | Assignment |
| FR-WF-03 | A leave request of more than three consecutive working days SHALL require supporting documents. | Mandatory | Assignment |
| FR-WF-04 | A leave request of more than three consecutive working days SHALL require two-level approval: first by the Manager, then by the HOD. | Mandatory | Assignment |
| FR-WF-05 | When a Manager rejects a request, the employee SHALL have the option to appeal to the HOD. The Manager's rejection and comments are NOT erased. | Mandatory | User Decision |
| FR-WF-06 | When a Manager requests additional information, the request SHALL transition to INFO_REQUESTED status. | Mandatory | User Decision |
| FR-WF-07 | When the employee uploads additional documents and resubmits, the request SHALL return to PENDING_MANAGER status for Manager re-review without creating a duplicate request. | Mandatory | User Decision |
| FR-WF-08 | Finalized requests (approved, rejected-with-no-appeal-pending, cancelled) SHALL NOT be modifiable by the employee. | Mandatory | User Decision |
| FR-WF-09 | The system SHALL prevent invalid workflow state transitions. | Mandatory | Implied |
| FR-WF-10 | Each workflow transition SHALL be recorded in the audit log with the actor, timestamp, action, and any comments. | Mandatory | Assignment |
| FR-WF-11 | The system SHALL support a configurable list of leave types (e.g., Annual, Sick, Personal, Unpaid). | Important | Implied |
| FR-WF-12 | The system SHOULD support leave balance tracking per employee per leave type. | Important | Implied |

### B.7 Document Management

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-DOC-01 | The system SHALL support uploading commonly used document formats: PDF, PNG, JPG/JPEG, DOCX. *(Confirmed: DR-04. Limits configurable.)* | Mandatory | Confirmed Decision |
| FR-DOC-02 | Document access SHALL be restricted to authorized users only (the owning employee, their assigned Manager, and the HOD of their department). | Mandatory | User Decision |
| FR-DOC-03 | The system SHALL validate file type and file size on upload. | Mandatory | User Decision |
| FR-DOC-04 | The system SHALL store documents safely using a secure storage mechanism. | Mandatory | User Decision |
| FR-DOC-05 | Authorized users SHALL be able to download or view uploaded documents. | Mandatory | Assignment |
| FR-DOC-06 | Documents SHALL be linked to their parent leave request. | Mandatory | Implied |
| FR-DOC-07 | The system SHALL prevent uploading of executable files or files with mismatched extensions. | Important | Security |

### B.8 Notifications

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-NOT-01 | The system SHALL provide in-app notifications for leave request status changes. | Mandatory | Confirmed Decision (DR-05) |
| FR-NOT-02 | Employees SHALL be notified when their request is approved, rejected, or when additional information is requested. | Mandatory | Confirmed Decision (DR-05) |
| FR-NOT-03 | Managers SHALL be notified when a new leave request is submitted or when an employee resubmits after providing additional information. | Mandatory | Confirmed Decision (DR-05) |
| FR-NOT-04 | The HOD SHALL be notified when a request requires second-level approval or when an appeal is filed. | Mandatory | Confirmed Decision (DR-05) |
| FR-NOT-05 | The notification system SHALL use an interchangeable provider interface to support email notifications as an optional channel. Core workflows MUST NOT depend on email delivery. | Important | Confirmed Decision (DR-05) |

### B.9 Audit and Reporting

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-AUD-01 | The system SHALL maintain audit logs for all sensitive operations (create, update, approve, reject, appeal, cancel, document upload). | Mandatory | Assignment |
| FR-AUD-02 | Each audit log entry SHALL contain: actor ID, actor role, action performed, target resource, timestamp, and any relevant metadata. | Mandatory | Assignment |
| FR-AUD-03 | Audit logs SHALL be immutable — they must not be editable or deletable through the application. | Mandatory | Security |
| FR-AUD-04 | Managers SHALL be able to view audit logs for requests they have acted on. | Important | Implied |
| FR-AUD-05 | The HOD SHALL be able to view department-level audit trails. | Important | Implied |
| FR-AUD-06 | The system SHOULD provide basic reporting: leave utilization summary per department. | Optional Enhancement | Implied |

### B.10 Administrative Configuration

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-ADM-01 | The system SHALL support a configurable and auditable list of public holidays. The holiday calendar must be identifiable by year. *(See Decision DR-17.)* | Mandatory | User Decision |
| FR-ADM-02 | The system SHALL support configuring organizational reporting relationships (which employees are assigned to which Manager, which Manager belongs to which department under which HOD). *(Confirmed: DR-01.)* | Mandatory | Confirmed Decision |
| FR-ADM-03 | The system SHALL support configuring leave types and their annual allocations per employee or per role. *(See Decision DR-18.)* | Important | Implied |
| FR-ADM-04 | Assessment mode SHALL use a repeatable seed process to provision demo accounts (Employee, Manager, HOD), organizational structure, holidays, and leave types. *(Confirmed: DR-06.)* | Mandatory | Confirmed Decision |

---

## C. Non-Functional Requirements

### C.1 Security

| ID | Requirement | Priority |
|---|---|---|
| NFR-SEC-01 | All API endpoints SHALL enforce authentication. Unauthenticated requests must be rejected. | Mandatory |
| NFR-SEC-02 | All API endpoints SHALL enforce role-based authorization. | Mandatory |
| NFR-SEC-03 | Resource-level access control SHALL prevent users from accessing records or documents belonging to other users outside their authorization scope. | Mandatory |
| NFR-SEC-04 | Authentication tokens SHALL have appropriate expiration and refresh mechanisms. | Mandatory |
| NFR-SEC-05 | File upload endpoints SHALL validate file content, not just extensions. | Mandatory |
| NFR-SEC-06 | The application SHALL follow secure failure behavior: errors must not leak internal details, stack traces, or database structure. | Mandatory |
| NFR-SEC-07 | All client-server communication SHALL use HTTPS in production. | Mandatory |
| NFR-SEC-08 | The system SHALL protect against common web vulnerabilities: XSS, CSRF, injection attacks. | Mandatory |

### C.2 Authorization

| ID | Requirement | Priority |
|---|---|---|
| NFR-AUTHZ-01 | Role assignment SHALL only occur through trusted backend processes, not through untrusted frontend requests. | Mandatory |
| NFR-AUTHZ-02 | Backend middleware and database-level access controls SHALL enforce data access boundaries. | Mandatory |
| NFR-AUTHZ-03 | Document download/view URLs SHALL be gated by authorization checks. No direct public URLs for uploaded documents. | Mandatory |

### C.3 Scalability

| ID | Requirement | Priority |
|---|---|---|
| NFR-SCA-01 | Data access patterns SHALL be designed for future scalability (avoid deeply nested structures, use appropriate indexing). | Important |
| NFR-SCA-02 | The architecture SHALL use well-defined service/repository interfaces to isolate database access. | Important |

### C.4 Performance

| ID | Requirement | Priority |
|---|---|---|
| NFR-PERF-01 | Page load time SHALL be under 3 seconds on a standard broadband connection. | Important |
| NFR-PERF-02 | API response time for standard CRUD operations SHALL be under 1 second. | Important |
| NFR-PERF-03 | Document upload SHALL support files up to the configured maximum size without timeout. *(See Decision DR-04.)* | Important |

### C.5 Reliability

| ID | Requirement | Priority |
|---|---|---|
| NFR-REL-01 | The system SHALL handle transient network failures gracefully with appropriate retry logic or user-facing error messages. | Important |
| NFR-REL-02 | Essential leave-management functionality SHALL NOT depend on optional AI services. | Mandatory |
| NFR-REL-03 | Service fallbacks SHALL NOT bypass security or compromise data consistency. | Mandatory |

### C.6 Fault Tolerance

| ID | Requirement | Priority |
|---|---|---|
| NFR-FT-01 | The application SHALL present meaningful error states when external services (Firebase Auth, database, object storage) are unavailable. | Mandatory |
| NFR-FT-02 | The application SHALL NOT crash or display raw error traces to the end user. | Mandatory |
| NFR-FT-03 | The system SHOULD implement circuit-breaker or exponential backoff patterns for external service calls where appropriate. | Optional Enhancement |

### C.7 Maintainability

| ID | Requirement | Priority |
|---|---|---|
| NFR-MAIN-01 | The codebase SHALL follow a clean layered architecture separating concerns (routing, business logic, data access). | Important |
| NFR-MAIN-02 | The codebase SHALL include meaningful code comments and documentation for non-obvious logic. | Important |
| NFR-MAIN-03 | Environment-specific configuration SHALL be externalized (environment variables, config files). | Mandatory |

### C.8 Usability and Accessibility

| ID | Requirement | Priority |
|---|---|---|
| NFR-USA-01 | The UI SHALL use color-coded statuses for leave request states. | Mandatory |
| NFR-USA-02 | The UI SHALL display friendly, human-readable error messages (not raw error codes). | Mandatory |
| NFR-USA-03 | The UI SHALL provide clear navigation and intuitive workflows for all roles. | Mandatory |
| NFR-USA-04 | The UI SHOULD follow basic accessibility guidelines (semantic HTML, alt text, keyboard navigation). | Important |
| NFR-USA-05 | The UI SHALL look distinctive, modern, premium and intentionally designed. | Mandatory |

### C.9 Responsiveness

| ID | Requirement | Priority |
|---|---|---|
| NFR-RES-01 | All screens SHALL be responsive for desktop, tablet, and mobile viewports. | Mandatory |
| NFR-RES-02 | Touch interactions SHALL work correctly on mobile devices. | Important |

### C.10 Portability and Packaging

| ID | Requirement | Priority |
|---|---|---|
| NFR-PKG-01 | The application SHALL be Docker-compatible with appropriate Dockerfiles and docker-compose configuration. | Mandatory |
| NFR-PKG-02 | The evaluator SHALL receive a ZIP containing the project with all necessary files to run. | Mandatory |
| NFR-PKG-03 | A README SHALL explain how to run the services, configure credentials, and access the application. | Mandatory |
| NFR-PKG-04 | The application SHALL work on a standard development machine with Docker installed. | Mandatory |
| NFR-PKG-05 | Configuration and credentials required for evaluation SHALL be clearly documented. *(See Decision DR-09.)* | Mandatory |

### C.11 Observability and Auditability

| ID | Requirement | Priority |
|---|---|---|
| NFR-OBS-01 | The system SHALL log all API requests with timestamp, user ID, action, and outcome (at minimum for sensitive endpoints). | Important |
| NFR-OBS-02 | Audit records SHALL be queryable by resource, actor, and time range. | Important |
| NFR-OBS-03 | The system SHOULD provide structured logging (JSON format) for ease of analysis. | Optional Enhancement |

---

## D. Business Workflow Analysis

### D.1 Normal Leave Request (Three or Fewer Working Days)

```
Employee submits request
  -> System validates fields and calculates working days (backend)
  -> Working days <= 3: Single-level approval required
  -> Status: PENDING_MANAGER
  -> Manager receives notification
  -> Manager reviews and approves
  -> Status: APPROVED
  -> Employee receives notification
  -> Audit log entry created at each transition
```

**Key Rules:**

- No supporting documents required (but may be voluntarily attached).
- Only Manager approval needed.
- Backend calculates duration excluding weekends and holidays.

### D.2 Leave Request Exceeding Three Working Days

```
Employee submits request WITH supporting documents
  -> System validates fields, documents, and calculates working days (backend)
  -> Working days > 3: Two-level approval required
  -> System validates that supporting documents are attached (rejects if missing)
  -> Status: PENDING_MANAGER
  -> Manager receives notification
  -> Manager reviews and approves (first level)
  -> Manager's approval recorded in decision history
  -> Status: PENDING_HOD (awaiting HOD)
  -> HOD receives notification
  -> HOD reviews and approves (second level)
  -> Status: APPROVED
  -> Employee receives notification
  -> Audit log entry at each transition
```

**Key Rules:**

- Supporting documents are mandatory.
- System rejects submission if documents are missing.
- Two sequential approvals required: Manager first, then HOD.

### D.3 Manager Approval

```
Manager views pending request
  -> Manager reviews details, attached documents, leave duration
  -> Manager selects "Approve"
  -> Manager adds optional comment
  -> If <= 3 days: Status -> APPROVED (final)
  -> If > 3 days: Manager's approval recorded in decision history; Status -> PENDING_HOD (forwarded to HOD)
  -> Audit log entry: actor=Manager, action=APPROVE, timestamp, comment
  -> Notification sent to employee (and HOD if applicable)
```

### D.4 Manager Rejection

```
Manager views pending request
  -> Manager selects "Reject"
  -> Manager adds MANDATORY comment (rejection reason)
  -> Status: REJECTED_BY_MANAGER
  -> Employee retains appeal rights
  -> Audit log entry: actor=Manager, action=REJECT, timestamp, comment
  -> Notification sent to employee with rejection reason
```

**Key Rule:** Manager rejection does NOT cancel the employee's right to appeal. The system must clearly indicate that appeal is available.

### D.5 Employee Appeal to HOD

```
Employee views rejected request
  -> Employee selects "Appeal to HOD"
  -> Employee provides appeal justification/comments
  -> Employee may attach additional documents
  -> An appeal record is created, LINKED to the original request
  -> Manager's original rejection, comments, and decision are PRESERVED
  -> Status: UNDER_APPEAL
  -> HOD receives notification with full context:
     - Original request details
     - Manager's rejection decision and comments
     - Employee's appeal justification
  -> HOD reviews appeal
  -> HOD upholds rejection -> Status: APPEAL_REJECTED (final)
     OR
  -> HOD overturns rejection -> Status: APPROVED_ON_APPEAL (final, distinct from ordinary APPROVED)
  -> Audit log entries for appeal submission and HOD decision
  -> Employee receives notification of outcome
```

**Key Rules:**

- Appeal is a formal action, not a new leave request.
- Manager's original decision is never erased or overwritten.
- HOD sees full history: original request, Manager's rejection reason, and employee's appeal justification.

### D.6 Manager Requests Additional Information

```
Manager views pending request
  -> Manager selects "Request More Information"
  -> Manager adds comment describing what is needed
  -> Status: INFO_REQUESTED
  -> Audit log entry: actor=Manager, action=REQUEST_INFO, timestamp, comment
  -> Employee receives notification
  -> Employee views the info request with Manager's comment
```

### D.7 Employee Uploads Additional Documents and Resubmits

```
Employee views request in INFO_REQUESTED status
  -> Employee uploads additional documents
  -> Employee optionally adds a comment
  -> Employee selects "Resubmit"
  -> The SAME request is updated (no duplicate created)
  -> New documents are appended (old ones preserved)
  -> Status: PENDING_MANAGER (returns to Manager's queue)
  -> Audit log entry: actor=Employee, action=RESUBMIT, timestamp
  -> Manager receives notification
```

**Key Rule:** The request ID remains the same. The system appends new documents and transitions the status back to PENDING_MANAGER.

### D.8 Employee Edits or Cancels a Pending Request

**Edit:**

```
Employee views request in PENDING_MANAGER status
  -> Employee modifies fields (dates, reason, leave type, documents)
  -> System recalculates working days
  -> System re-validates (e.g., documents required if > 3 days)
  -> Request is updated
  -> Audit log entry: actor=Employee, action=EDIT, timestamp, changed fields
```

**Cancel:**

```
Employee views request in PENDING_MANAGER status
  -> Employee selects "Cancel"
  -> System prompts for confirmation
  -> Status: CANCELLED
  -> Request is no longer actionable by Manager or HOD
  -> Audit log entry: actor=Employee, action=CANCEL, timestamp
```

**Key Rule:** Only requests in PENDING_MANAGER status can be edited or cancelled. Once a Manager has taken any action, the employee cannot edit or cancel through normal operations.

### D.9 HOD Decision on a Long-Leave Request

```
HOD views request in PENDING_HOD status
  -> HOD reviews: leave details, duration, documents, Manager's approval comments
  -> HOD selects "Approve" or "Reject"
  -> HOD adds comment
  -> If Approved: Status -> APPROVED (final)
  -> If Rejected: Status -> REJECTED_BY_HOD (terminal - no further appeal per DR-02)
  -> Audit log entry: actor=HOD, action=HOD_APPROVE/HOD_REJECT, timestamp, comment
  -> Employee receives notification
```

### D.10 Invalid or Unauthorized Workflow Transitions

The system SHALL reject the following with a clear error message and audit log entry:

| Invalid Transition | Reason |
|---|---|
| Employee attempts to approve/reject any request | Not an authorized approver |
| Manager approves/rejects a request not in PENDING_MANAGER status | Request is not in a reviewable state |
| Manager approves their own leave request | Self-approval is prohibited |
| HOD acts on a request not in PENDING_HOD or UNDER_APPEAL | Request not yet at HOD level |
| Employee edits/cancels a request not in PENDING_MANAGER | Request is finalized |
| Any user accesses a request outside their authorization scope | Unauthorized access |
| Employee appeals a request not in REJECTED_BY_MANAGER | Appeal is only valid after Manager rejection |
| Any role change attempted via frontend | Must use trusted backend process |
| Duplicate approval on an already-approved request | Idempotency violation |

**All invalid transitions SHALL:**

1. Return an appropriate HTTP error code (403/409/422).
2. Display a user-friendly error message.
3. Log the attempt in the audit trail with the actor and attempted action.
4. NOT modify the request state.

---

## E. Data Requirements

### E.1 Core Entities

**Note:** These are entity definitions with important fields and relationships. The final database schema will be designed in the architecture phase.

#### E.1.1 User / Employee Profile

| Field | Description | Notes |
|---|---|---|
| User ID | Unique identifier | Firebase Auth UID |
| Email | User email address | Used for authentication |
| Display Name | Full name | |
| Role | Employee / Manager / HOD | Stored in trusted backend-managed user profile table |
| Department ID | Department membership | FK to Department |
| Manager ID | Assigned Manager | FK to User (for Employee to Manager mapping) |
| Status | Active / Inactive | |
| Created At | Account creation timestamp | |

#### E.1.2 Leave Request

| Field | Description | Notes |
|---|---|---|
| Request ID | Unique identifier | Auto-generated |
| Employee ID | Requesting employee | FK to User |
| Leave Type | Category of leave | FK to Leave Type config |
| Start Date | First day of leave | |
| End Date | Last day of leave | |
| Calculated Working Days | Computed duration | Backend-authoritative; excludes weekends and holidays |
| Reason | Employee's stated reason | |
| Status | Current workflow state | See Status Enum below |
| Requires HOD Approval | Boolean flag | Set by backend based on working days > 3 |
| Created At | Submission timestamp | |
| Updated At | Last modification timestamp | |
| Version | Optimistic concurrency version | Integer, incremented on each update (per DR-15) |

**Status Enum Values:**
PENDING_MANAGER, INFO_REQUESTED, PENDING_HOD, APPROVED, APPROVED_ON_APPEAL, REJECTED_BY_MANAGER, REJECTED_BY_HOD, UNDER_APPEAL, APPEAL_REJECTED, CANCELLED

**Note:** PENDING_MANAGER replaces generic PENDING. PENDING_HOD replaces MANAGER_APPROVED. Manager's approval is recorded in the Decision/Audit history when transitioning to PENDING_HOD, not as an independent workflow state. APPROVED_ON_APPEAL is distinct from APPROVED per DR-03/DR-14.

#### E.1.3 Decision / Workflow Action

| Field | Description | Notes |
|---|---|---|
| Decision ID | Unique identifier | Auto-generated |
| Request ID | Parent leave request | FK to Leave Request |
| Actor ID | Who took the action | FK to User |
| Actor Role | Role at time of action | Employee / Manager / HOD |
| Action | What was done | Enum: SUBMIT, APPROVE, REJECT, REQUEST_INFO, RESUBMIT, APPEAL, APPEAL_APPROVE, APPEAL_REJECT, EDIT, CANCEL, HOD_APPROVE, HOD_REJECT |
| Comment | Optional/mandatory comment | Mandatory for rejections |
| Previous Status | Status before action | |
| New Status | Status after action | |
| Timestamp | When action occurred | |

#### E.1.4 Document

| Field | Description | Notes |
|---|---|---|
| Document ID | Unique identifier | Auto-generated |
| Request ID | Parent leave request | FK to Leave Request |
| Uploaded By | User who uploaded | FK to User |
| File Name | Original file name | |
| File Type | MIME type | Validated on upload |
| File Size | Size in bytes | Validated against max limit |
| Storage Path | Internal storage reference | Not exposed to client directly |
| Upload Phase | INITIAL / ADDITIONAL | Distinguishes original vs. info-request response uploads |
| Uploaded At | Upload timestamp | |

#### E.1.5 Appeal

| Field | Description | Notes |
|---|---|---|
| Appeal ID | Unique identifier | Auto-generated |
| Request ID | Original leave request | FK to Leave Request |
| Employee ID | Appealing employee | FK to User |
| Appeal Justification | Employee's appeal reason | |
| Manager Rejection Decision ID | Link to Manager's rejection | FK to Decision (preserves original rejection) |
| HOD Decision ID | HOD's decision on appeal | FK to Decision (null until HOD acts) |
| Status | PENDING / UPHELD / OVERTURNED | |
| Created At | Appeal submission timestamp | |

#### E.1.6 Department

| Field | Description | Notes |
|---|---|---|
| Department ID | Unique identifier | |
| Department Name | Human-readable name | |
| HOD ID | Head of Department | FK to User |

#### E.1.7 Holiday

| Field | Description | Notes |
|---|---|---|
| Holiday ID | Unique identifier | |
| Date | The holiday date | |
| Name | Holiday name | |
| Year | Applicable year | For yearly configuration |

#### E.1.8 Leave Type Configuration

| Field | Description | Notes |
|---|---|---|
| Leave Type ID | Unique identifier | |
| Name | Leave type name | e.g., Annual, Sick, Personal, Unpaid |
| Default Annual Allocation | Days per year | Per-role or global default |
| Requires Document | Boolean | Whether documents are always required |
| Is Active | Boolean | Soft-delete support |

#### E.1.9 Notification

| Field | Description | Notes |
|---|---|---|
| Notification ID | Unique identifier | |
| Recipient ID | Target user | FK to User |
| Type | Notification category | e.g., STATUS_CHANGE, INFO_REQUEST, NEW_REQUEST |
| Title | Short summary | |
| Message | Detailed message | |
| Related Request ID | Associated leave request | FK to Leave Request |
| Is Read | Boolean | |
| Created At | Timestamp | |

#### E.1.10 Audit Log

| Field | Description | Notes |
|---|---|---|
| Log ID | Unique identifier | |
| Actor ID | Who performed action | FK to User |
| Actor Role | Role at time of action | |
| Action | Action performed | |
| Resource Type | What was acted on | e.g., LEAVE_REQUEST, DOCUMENT, USER |
| Resource ID | ID of the resource | |
| Details | JSON metadata | Changed fields, comments, IP address, etc. |
| Timestamp | When it occurred | |
| IP Address | Client IP | For security auditing |

### E.2 Key Relationships

```
Department  1 --- * User (employees, managers in department)
Department  1 --- 1 User (HOD)
User (Employee) * --- 1 User (Manager)
User (Employee) 1 --- * Leave Request
Leave Request  1 --- * Decision (workflow history)
Leave Request  1 --- * Document
Leave Request  1 --- 0..1 Appeal
Appeal         1 --- 1 Decision (Manager's original rejection reference)
Appeal         1 --- 0..1 Decision (HOD's appeal decision)
User           1 --- * Notification
Leave Request  1 --- * Audit Log (via resource reference)
```

### E.3 Data Ownership Rules

- A Leave Request is **owned** by the submitting Employee.
- Documents are **owned** by the uploading User (always the Employee in normal flow).
- Decisions are **created by** the acting role (Manager or HOD).
- Audit Logs are **system-owned** and immutable.
- Notifications are **owned** by the recipient.

---

## F. Validation Requirements

### F.1 Field-Level Validations

| Field | Rules |
|---|---|
| Leave Type | Required. Must be a valid, active leave type from configuration. |
| Start Date | Required. Must be a valid date. Must not be in the past (or allow today). Must be a working day. |
| End Date | Required. Must be a valid date. Must be >= Start Date. Must be a working day. |
| Reason | Required. Minimum 10 characters. Maximum 1000 characters. Must be sanitized for XSS. |
| Comment (Rejection) | Required when rejecting. Minimum 5 characters. |
| Comment (Approval/Info Request) | Optional for approval, required for info request. |
| Appeal Justification | Required when appealing. Minimum 10 characters. Maximum 2000 characters. |
| Email | Required. Must be valid email format. |
| Display Name | Required. 2-100 characters. |

### F.2 Date and Duration Validations

| Rule | Description |
|---|---|
| Working Day Calculation | Backend computes working days by excluding Saturdays, Sundays, and configured holidays between start and end dates (inclusive). |
| Minimum Duration | At least 1 working day. |
| Maximum Duration | Application should enforce a reasonable maximum. *(Proposed policy DR-11: 30 working days. Awaiting owner confirmation.)* |
| Date Overlap | System SHOULD warn or prevent overlapping leave requests for the same employee. |
| Holiday Conflict | If start or end date falls on a holiday, system should adjust or warn. |
| Retroactive Requests | Whether past-date requests are allowed. *(Proposed policy DR-12: Allow up to 7 days. Awaiting owner confirmation.)* |

### F.3 Document Validations

| Rule | Description |
|---|---|
| Required for > 3 days | If calculated working days > 3, at least one document must be attached. Backend must enforce this. |
| File Type | Allowed types: PDF, JPEG, JPG, PNG, DOCX. *(Confirmed: DR-04.)* |
| File Size | Maximum 5 MB per file (configurable). *(Confirmed: DR-04.)* |
| File Count | Maximum 5 documents per request (configurable). *(Confirmed: DR-04.)* |
| Content Validation | MIME type must match file extension. No executable content. |
| File Name | Sanitize file names. Remove path traversal characters. Limit length. |

### F.4 Workflow Validations

| Rule | Description |
|---|---|
| Status Transition | Every state transition must be validated against the allowed transitions matrix. |
| Self-Approval | A Manager or HOD cannot approve their own leave request. |
| Authorization | Only the assigned Manager can act on a request. Only the department HOD can provide second-level approval or decide appeals. |
| Duplicate Actions | Prevent double-submission of the same action (idempotency). |
| Concurrent Modifications | Use database transactions with optimistic concurrency/version checks to prevent simultaneous decisions from corrupting request state. *(Confirmed: DR-15.)* |

### F.5 Business Rule Validations

| Rule | Description |
|---|---|
| Leave Balance | If leave balance tracking is implemented, prevent requests exceeding available balance (or flag for special approval). |
| Consecutive Days Threshold | The "3 consecutive working days" rule must be computed by the backend, not the frontend. |
| Appeal Eligibility | An appeal is only valid if the request is in REJECTED_BY_MANAGER status. |
| Edit Eligibility | Edits are only valid if the request is in PENDING_MANAGER status. |
| Cancel Eligibility | Cancellation is only valid if the request is in PENDING_MANAGER status. |

---

## G. Authorization Requirements

### G.1 Authorization Matrix

| Resource | Action | Employee | Manager | HOD |
|---|---|---|---|---|
| Leave Request | Create | Own only | No | No |
| Leave Request | Read | Own only | Assigned employees only | Department only |
| Leave Request | Edit | Own + PENDING_MANAGER only | No | No |
| Leave Request | Cancel | Own + PENDING_MANAGER only | No | No |
| Leave Request | Approve | No | Assigned + PENDING_MANAGER | Dept + PENDING_HOD |
| Leave Request | Reject | No | Assigned + PENDING_MANAGER | Dept + PENDING_HOD |
| Leave Request | Request Info | No | Assigned + PENDING_MANAGER | No |
| Leave Request | Resubmit | Own + INFO_REQUESTED | No | No |
| Leave Request | Appeal | Own + REJECTED_BY_MANAGER | No | No |
| Appeal | Review | No | No (view only) | Dept + UNDER_APPEAL |
| Appeal | Decide | No | No | Dept + UNDER_APPEAL |
| Document | Upload | Own request | No | No |
| Document | View/Download | Own | Assigned employee | Department |
| Document | Delete | No (once submitted) | No | No |
| Audit Log | Read | Own requests | Own actions or assigned employees | Department |
| Audit Log | Write | No (system only) | No (system only) | No (system only) |
| Notification | Read | Own | Own | Own |
| Notification | Mark Read | Own | Own | Own |
| Holiday Config | Read | Yes | Yes | Yes |
| Holiday Config | Write | No | No | No (Admin only) |
| User Profile | Read Own | Yes | Yes | Yes |
| User Profile | Read Others | No | Assigned employees (limited fields) | Department (limited fields) |
| Role Assignment | Any | No | No | No (Admin/backend only) |

### G.2 Key Authorization Rules

1. **Ownership Check**: Every data access must verify the requesting user's relationship to the resource.
2. **Manager Scope**: A Manager can only see and act on requests from employees explicitly assigned to them. *(See Decision DR-01.)*
3. **HOD Scope**: An HOD can only see and act on requests within their department.
4. **Document Access**: Documents inherit access controls from their parent leave request. No direct public URLs.
5. **Self-Approval Prevention**: No user may approve their own leave request, regardless of role.
6. **Audit Immutability**: No role can modify or delete audit log entries through the application.

---

## H. Security Threat Inventory

| ID | Threat | Affected Feature | Required Protection |
|---|---|---|---|
| ST-01 | **Broken Access Control (Horizontal Privilege Escalation)**: An employee manipulates request IDs in API calls to view or modify another employee's leave request. | Leave Request CRUD, Document Access | Server-side ownership verification on every request. Never rely on frontend to filter data. Validate the authenticated user's relationship to the requested resource. |
| ST-02 | **Broken Access Control (Vertical Privilege Escalation)**: An employee crafts API requests to perform Manager or HOD actions (approve, reject). | Approval Workflow | Server-side role verification on every action endpoint. Role derived from Firebase custom claims or trusted server-side lookup, never from client-provided headers. |
| ST-03 | **Role Tampering**: A user attempts to change their own role via API call to gain Manager or HOD privileges. | Role Assignment | Role assignment only through trusted backend processes (seed scripts, admin API). Database access controls must deny writes to role fields from client-facing APIs. |
| ST-04 | **Insecure Direct Object Reference (IDOR) for Documents**: A user guesses or enumerates document storage paths to download unauthorized files. | Document Management | Serve documents through an authorized API endpoint that checks permissions. Never expose direct storage URLs. Use signed URLs with short expiration if needed, generated only after authorization check. |
| ST-05 | **Malicious File Upload**: A user uploads an executable, script, or oversized file disguised as a document. | Document Upload | Server-side MIME type validation, file extension whitelist, file size limits, and content scanning. Rename files on storage to prevent path traversal. |
| ST-06 | **Workflow State Manipulation**: A user sends direct API requests to force invalid state transitions (e.g., moving a rejected request directly to approved). | Leave Workflow | Backend must validate every state transition against the allowed transitions matrix. Reject invalid transitions with an error and log the attempt. |
| ST-07 | **Cross-Site Scripting (XSS)**: Malicious scripts injected through leave reason, comments, or appeal justification fields are rendered in other users' browsers. | All text input fields | Sanitize and escape all user-provided text on output. Use a frontend framework with built-in XSS protection. Implement Content Security Policy headers. |
| ST-08 | **Cross-Site Request Forgery (CSRF)**: An attacker tricks an authenticated user's browser into making unauthorized API calls. | All state-changing endpoints | Use SameSite cookies, CSRF tokens, or rely on bearer token authentication (which is inherently CSRF-resistant). |
| ST-09 | **Token Theft / Session Hijacking**: An attacker steals a Firebase Auth token and impersonates the user. | Authentication | Short token expiration. Secure token storage (httpOnly cookies or secure in-memory storage). HTTPS enforcement. Token refresh flow. |
| ST-10 | **Audit Log Tampering**: An attacker or malicious insider modifies audit logs to hide unauthorized actions. | Audit Logs | Audit logs stored in append-only tables/collections. Database access controls must deny update and delete on audit log records. Application code must only create, never update or delete audit records. |
| ST-11 | **Mass Assignment / Over-Posting**: API accepts unexpected fields (e.g., status, isApproved, role) from client requests, allowing users to manipulate protected fields. | All creation/update endpoints | Use explicit allow-lists for accepted fields on every endpoint. Never blindly spread client-provided objects into database documents. |
| ST-12 | **Denial of Service via Large File Upload**: An attacker uploads extremely large files to exhaust storage or bandwidth. | Document Upload | Enforce file size limits at both the reverse proxy/load balancer level and the application level. Rate-limit upload endpoints. |
| ST-13 | **Information Disclosure via Error Messages**: Detailed error messages or stack traces reveal internal architecture, database structure, or file paths. | All endpoints | Return generic error messages to clients. Log detailed errors server-side only. Never expose internal paths, query details, or stack traces. |
| ST-14 | **Enumeration Attacks**: An attacker enumerates user IDs, request IDs, or department IDs to discover valid resources. | All read endpoints | Use non-sequential, non-guessable IDs (UUIDs). Implement rate limiting. Return consistent error responses for not-found and not-authorized. |
| ST-15 | **Insufficient Logging**: Security-relevant actions are not logged, making incident investigation impossible. | All sensitive operations | Log all authentication events (login, logout, failed attempts), all authorization failures, all workflow transitions, and all document access events. |

---

## I. Acceptance Criteria

### I.1 Landing Page

| ID | Criteria |
|---|---|
| AC-LP-01 | Given an unauthenticated user, when they navigate to the root URL, then a public landing page is displayed with system information and a login link. |
| AC-LP-02 | Given the landing page, when viewed on mobile (<=768px), tablet (769-1024px), and desktop (>1024px), then all content is properly laid out without horizontal scrolling. |

### I.2 Authentication

| ID | Criteria |
|---|---|
| AC-AUTH-01 | Given valid credentials, when an employee logs in, then they are redirected to the Employee dashboard. |
| AC-AUTH-02 | Given valid credentials, when a Manager logs in, then they are redirected to the Manager dashboard. |
| AC-AUTH-03 | Given valid credentials, when an HOD logs in, then they are redirected to the HOD dashboard. |
| AC-AUTH-04 | Given invalid credentials, when a user attempts to log in, then a friendly error message is displayed and no session is created. |
| AC-AUTH-05 | Given an unauthenticated user, when they attempt to access a protected route, then they are redirected to the login page. |
| AC-AUTH-06 | Given an authenticated Employee, when they attempt to access a Manager or HOD route, then access is denied with a 403 error. |

### I.3 Employee Operations

| ID | Criteria |
|---|---|
| AC-EMP-01 | Given an authenticated Employee, when they submit a leave request with valid data for 3 or fewer working days, then the request is created with status PENDING_MANAGER and appears in their request list. |
| AC-EMP-02 | Given a leave request > 3 working days, when the Employee does NOT attach supporting documents, then the submission is rejected with a validation error. |
| AC-EMP-03 | Given a leave request > 3 working days with documents attached, when the Employee submits, then the request is created with status PENDING_MANAGER and requiresHodApproval = true. |
| AC-EMP-04 | Given a PENDING_MANAGER request, when the Employee edits dates/reason, then the request is updated and working days are recalculated. |
| AC-EMP-05 | Given a PENDING_MANAGER request, when the Employee cancels it, then the status changes to CANCELLED and it is removed from the Manager's pending queue. |
| AC-EMP-06 | Given an APPROVED or REJECTED request, when the Employee attempts to edit or cancel, then the operation is denied. |
| AC-EMP-07 | Given a REJECTED_BY_MANAGER request, when the Employee appeals with justification, then an appeal record is created, status changes to UNDER_APPEAL, and the Manager's rejection is preserved. |
| AC-EMP-08 | Given an INFO_REQUESTED request, when the Employee uploads additional documents and resubmits, then the same request returns to PENDING_MANAGER status with new documents appended. |
| AC-EMP-09 | Given the Employee dashboard, then all requests display color-coded status indicators. |

### I.4 Manager Operations

| ID | Criteria |
|---|---|
| AC-MGR-01 | Given an authenticated Manager, when they view pending requests, then only requests from their assigned employees are shown. |
| AC-MGR-02 | Given a PENDING_MANAGER request for 3 or fewer days, when the Manager approves it, then the status changes to APPROVED. |
| AC-MGR-03 | Given a PENDING_MANAGER request for > 3 days, when the Manager approves it, then the Manager's approval is recorded in decision history, the status changes to PENDING_HOD, and it appears in the HOD's queue. |
| AC-MGR-04 | Given a PENDING_MANAGER request, when the Manager rejects it without a comment, then the rejection is blocked by validation. |
| AC-MGR-05 | Given a PENDING_MANAGER request, when the Manager rejects it with a comment, then the status changes to REJECTED_BY_MANAGER with the comment preserved. |
| AC-MGR-06 | Given a PENDING_MANAGER request, when the Manager requests more information with a comment, then the status changes to INFO_REQUESTED. |
| AC-MGR-07 | Given a request belonging to a different Manager's employee, when the Manager attempts to access it, then access is denied. |

### I.5 HOD Operations

| ID | Criteria |
|---|---|
| AC-HOD-01 | Given a PENDING_HOD request in the HOD's department, when the HOD approves it, then the status changes to APPROVED. |
| AC-HOD-02 | Given a PENDING_HOD request, when the HOD rejects it with a comment, then the status changes to REJECTED_BY_HOD. |
| AC-HOD-03 | Given an UNDER_APPEAL request in the HOD's department, when the HOD reviews it, then the Manager's original rejection and comments are visible. |
| AC-HOD-04 | Given an UNDER_APPEAL request, when the HOD upholds the rejection, then the status changes to APPEAL_REJECTED. |
| AC-HOD-05 | Given an UNDER_APPEAL request, when the HOD overturns the rejection, then the status changes to APPROVED_ON_APPEAL (distinct from ordinary APPROVED). |
| AC-HOD-06 | Given an HOD appeal overturn, the audit log records the action as APPEAL_APPROVE, distinguishable from an ordinary HOD_APPROVE. |

### I.6 Leave Workflow

| ID | Criteria |
|---|---|
| AC-WF-01 | Given a leave request spanning Monday to Friday (5 weekdays, no holidays), the system calculates exactly 5 working days. |
| AC-WF-02 | Given a leave request spanning Monday to next Monday (8 calendar days, 2 weekend days, no holidays), the system calculates 6 working days. |
| AC-WF-03 | Given configured holidays on specific dates, the system excludes those dates from working day calculations. |
| AC-WF-04 | Given an Employee attempts to approve a request via direct API call, the system returns a 403 error. |
| AC-WF-05 | Given a Manager attempts to approve an already-approved request, the system returns a 409 error. |

### I.7 Document Management

| ID | Criteria |
|---|---|
| AC-DOC-01 | Given a valid PDF/JPEG/PNG file under the size limit, when an Employee uploads it, then the file is stored and linked to the request. |
| AC-DOC-02 | Given an executable file (.exe, .sh, .bat), when uploaded, then the system rejects it with a validation error. |
| AC-DOC-03 | Given a file exceeding the maximum size, when uploaded, then the system rejects it with a size error. |
| AC-DOC-04 | Given an authorized Manager, when they view a document for their assigned employee's request, then the document is accessible. |
| AC-DOC-05 | Given an unauthorized user, when they attempt to access a document via direct URL or API, then access is denied. |

### I.8 Audit

| ID | Criteria |
|---|---|
| AC-AUD-01 | Given any state transition on a leave request, then an audit log entry is created with actor, action, timestamp, and previous/new state. |
| AC-AUD-02 | Given an audit log entry, when any user attempts to delete or modify it via API, then the operation is denied. |
| AC-AUD-03 | Given a rejection action, then the audit log entry includes the Manager's comment. |

### I.9 Packaging

| ID | Criteria |
|---|---|
| AC-PKG-01 | Given a fresh machine with Docker and docker-compose installed, when the evaluator runs the documented startup commands, then the application starts successfully. |
| AC-PKG-02 | Given the running application, when the evaluator navigates to the documented URL, then the landing page is displayed. |
| AC-PKG-03 | Given the project ZIP, then it contains a README with clear instructions for configuration, setup, and running. |

---

## J. Ambiguity and Decision Register (Summary)

Full details for each decision are in the companion document [01_DECISION_REGISTER.md](01_DECISION_REGISTER.md).

### Confirmed Decisions

| Decision ID | Topic | Resolution |
|---|---|---|
| DR-01 | Manager scope | Confirmed: Assigned employees only |
| DR-02 | HOD rejection finality | Confirmed: Terminal, no further appeal |
| DR-03 | Appeal overturn outcome | Confirmed: APPROVED_ON_APPEAL (direct, distinct from ordinary approval) |
| DR-04 | Document constraints | Confirmed: PDF/PNG/JPG/JPEG/DOCX, 5 MB per file, configurable |
| DR-05 | Notification channels | Confirmed: In-app mandatory, email optional via interchangeable provider |
| DR-06 | Account provisioning | Confirmed: Seed script for assessment, controlled backend for production |
| DR-07 | Holiday/org config | Confirmed: Seed script + config file |
| DR-08 | Assessment environment | Confirmed: Firebase Auth Emulator + PostgreSQL + MinIO + Docker Compose |
| DR-09 | Evaluator credentials | Confirmed: Demo accounts via seed, no developer cloud credentials needed |
| DR-10 | Manager's own leave | Confirmed: HOD approves directly |
| DR-11 | Max leave duration | Proposed policy: 30 working days. Awaiting owner confirmation. |
| DR-12 | Retroactive requests | Proposed policy: Allow up to 7 days past. Awaiting owner confirmation. |
| DR-13 | Leave balance enforcement | Proposed policy: Soft warning. Awaiting owner confirmation. |
| DR-14 | Appeal override for long leave | Confirmed: HOD overturn = APPROVED_ON_APPEAL directly |
| DR-15 | Concurrent modification | Confirmed: PostgreSQL transactions + optimistic version mechanism |

### Remaining Unresolved Decisions

| Decision ID | Topic | Status |
|---|---|---|
| DR-16 | Who approves the HOD's own leave? | Needs Decision |
| DR-17 | Who manages the organization's holiday calendar? | Needs Decision |
| DR-18 | Whether leave types need separate configurations (sick, casual, earned) | Needs Decision |
| DR-19 | Whether overlapping leave requests should be rejected automatically | Needs Decision |
| DR-20 | Whether an employee should be able to withdraw an appeal | Needs Decision |
| DR-21 | Whether managers should see team leave calendars | Needs Decision |
| DR-22 | Which notification types should be displayed in-app | Needs Decision |
| DR-23 | Whether email notifications should be enabled in production by default | Needs Decision |
| DR-24 | Whether attachments should be retained or deleted after a specified period | Needs Decision |
| DR-25 | Whether employee and manager records should include department and reporting hierarchy | Needs Decision |

---

## K. Workflow State Transition Table

### K.1 Leave Request States (10 states)

| State | Description | Terminal? |
|---|---|---|
| PENDING_MANAGER | Awaiting Manager review | No |
| INFO_REQUESTED | Manager has requested additional information from employee | No |
| PENDING_HOD | Manager approved long leave; awaiting HOD approval. Manager's approval recorded in decision history. | No |
| APPROVED | Fully approved through normal workflow | Yes |
| APPROVED_ON_APPEAL | Approved by HOD overturning a Manager rejection (appeal route) | Yes |
| REJECTED_BY_MANAGER | Manager rejected; employee may appeal | No (appeal possible) |
| REJECTED_BY_HOD | HOD rejected at second level; terminal, no further appeal | Yes |
| UNDER_APPEAL | Employee has appealed Manager rejection to HOD | No |
| APPEAL_REJECTED | HOD upheld Manager rejection on appeal; terminal | Yes |
| CANCELLED | Employee cancelled the request | Yes |

### K.2 State Transition Table

| Current State | Actor | Permitted Action | Resulting State | Required Validation | Audit Event |
|---|---|---|---|---|---|
| (new) | Employee | Submit short leave (<=3 days) | PENDING_MANAGER | Valid dates, reason, leave type; working days <= 3; backend calculates duration | SUBMIT |
| (new) | Employee | Submit long leave (>3 days) | PENDING_MANAGER | Valid dates, reason, leave type; working days > 3; documents attached; backend calculates duration | SUBMIT |
| PENDING_MANAGER | Employee | Edit request | PENDING_MANAGER | Request still in PENDING_MANAGER; re-validate all fields; recalculate working days; re-check document requirement | EDIT |
| PENDING_MANAGER | Employee | Cancel request | CANCELLED | Request still in PENDING_MANAGER; confirmation required | CANCEL |
| PENDING_MANAGER | Manager | Approve (short leave) | APPROVED | Request in PENDING_MANAGER; actor is assigned Manager; not self-approval; working days <= 3 | APPROVE |
| PENDING_MANAGER | Manager | Approve (long leave) | PENDING_HOD | Request in PENDING_MANAGER; actor is assigned Manager; not self-approval; working days > 3; documents present. Manager's approval recorded in decision history. | APPROVE |
| PENDING_MANAGER | Manager | Reject | REJECTED_BY_MANAGER | Request in PENDING_MANAGER; actor is assigned Manager; comment mandatory | REJECT |
| PENDING_MANAGER | Manager | Request info | INFO_REQUESTED | Request in PENDING_MANAGER; actor is assigned Manager; comment mandatory | REQUEST_INFO |
| INFO_REQUESTED | Employee | Resubmit with info | PENDING_MANAGER | Request in INFO_REQUESTED; employee is owner; additional documents or comment provided; original request ID preserved | RESUBMIT |
| PENDING_HOD | HOD | Approve (second level) | APPROVED | Request in PENDING_HOD; actor is department HOD; not self-approval | HOD_APPROVE |
| PENDING_HOD | HOD | Reject (second level) | REJECTED_BY_HOD | Request in PENDING_HOD; actor is department HOD; comment mandatory | HOD_REJECT |
| REJECTED_BY_MANAGER | Employee | Appeal to HOD | UNDER_APPEAL | Request in REJECTED_BY_MANAGER; employee is owner; appeal justification provided; only one active appeal per request; appeal linked to original request | APPEAL |
| UNDER_APPEAL | HOD | Uphold rejection | APPEAL_REJECTED | Request in UNDER_APPEAL; actor is department HOD; comment mandatory; Manager's original rejection preserved | APPEAL_REJECT |
| UNDER_APPEAL | HOD | Overturn rejection | APPROVED_ON_APPEAL | Request in UNDER_APPEAL; actor is department HOD; comment mandatory; Manager's original rejection preserved; recorded as appeal overturn not ordinary approval | APPEAL_APPROVE |
| PENDING_MANAGER | Employee | Cancel request | CANCELLED | Request in PENDING_MANAGER; employee is owner; confirmation required | CANCEL |

### K.3 Explicitly Invalid Transitions

| Attempted Transition | Why Invalid |
|---|---|
| APPROVED -> any | Terminal state |
| APPROVED_ON_APPEAL -> any | Terminal state |
| REJECTED_BY_HOD -> any | Terminal state (DR-02: no further appeal) |
| APPEAL_REJECTED -> any | Terminal state |
| CANCELLED -> any | Terminal state |
| PENDING_MANAGER -> APPROVED (by Employee) | Employee cannot approve |
| PENDING_MANAGER -> APPROVED (by HOD directly) | HOD cannot bypass Manager for normal flow |
| PENDING_HOD -> APPROVED (by Manager) | Manager cannot provide second-level approval |
| REJECTED_BY_MANAGER -> APPROVED (directly) | Must go through appeal process |
| INFO_REQUESTED -> APPROVED (by anyone) | Must return to PENDING_MANAGER first via resubmit |
| Any state -> UNDER_APPEAL (if not REJECTED_BY_MANAGER) | Appeal only valid after Manager rejection |
| UNDER_APPEAL -> APPROVED (ordinary) | Appeal overturn must use APPROVED_ON_APPEAL |

### K.4 Concurrency Rules (DR-15)

All state transitions MUST:
1. Execute within a database transaction.
2. Read the current status and version within the transaction.
3. Verify the current status matches the expected "from" state.
4. Increment the version number on write.
5. Return HTTP 409 Conflict if the status or version has changed since the actor loaded the request.

---

*End of Requirements Analysis Document*

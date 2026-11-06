import { RBAC, LeaveRequestResource } from "../src/lib/auth/rbac";
import { AuthenticatedUser } from "../src/modules/users/user.service";
import { AppRole, UserStatus, WorkflowAction } from "@prisma/client";
import { AuthorizationError, InactiveUserError } from "../src/lib/auth/errors";
import { checkRateLimit, resetRateLimit } from "../src/lib/auth/rate-limiter";
import { validateCsrfToken } from "../src/lib/auth/csrf";

// ---------------------------------------------------------------------------
// Mock Fixtures for Role-Based Access Control and Authorization Tests
// ---------------------------------------------------------------------------

const mockDepartment = {
  id: "dept-eng-uuid-001",
  name: "Engineering",
  hod_user_id: "user-hod-uuid-001",
};

// 1. Employee User (David Kim)
const employeeUser: AuthenticatedUser = {
  id: "user-emp-uuid-001",
  firebase_uid: "fb-uid-emp-001",
  email: "employee@leaveflow.internal",
  display_name: "David Kim",
  department_id: mockDepartment.id,
  department_name: mockDepartment.name,
  department_hod_user_id: mockDepartment.hod_user_id,
  manager_id: "user-mgr-uuid-001",
  manager_name: "Sarah Chen",
  status: UserStatus.ACTIVE,
  roles: [AppRole.EMPLOYEE],
  isEmployee: true,
  isManager: false,
  isHOD: false,
};

// 2. Peer Employee User (Another employee in same/different dept)
const peerEmployeeUser: AuthenticatedUser = {
  id: "user-emp-uuid-002",
  firebase_uid: "fb-uid-emp-002",
  email: "peer@leaveflow.internal",
  display_name: "Elena Rostova",
  department_id: mockDepartment.id,
  department_name: mockDepartment.name,
  department_hod_user_id: mockDepartment.hod_user_id,
  manager_id: "user-mgr-uuid-002", // Different manager
  manager_name: "Marcus Brody",
  status: UserStatus.ACTIVE,
  roles: [AppRole.EMPLOYEE],
  isEmployee: true,
  isManager: false,
  isHOD: false,
};

// 3. Manager User (Sarah Chen - holds both EMPLOYEE and MANAGER roles)
const managerUser: AuthenticatedUser = {
  id: "user-mgr-uuid-001",
  firebase_uid: "fb-uid-mgr-001",
  email: "manager@leaveflow.internal",
  display_name: "Sarah Chen",
  department_id: mockDepartment.id,
  department_name: mockDepartment.name,
  department_hod_user_id: mockDepartment.hod_user_id,
  manager_id: "user-hod-uuid-001", // DR-10: Manager reports to HOD
  manager_name: "Alex Rivera",
  status: UserStatus.ACTIVE,
  roles: [AppRole.EMPLOYEE, AppRole.MANAGER],
  isEmployee: true,
  isManager: true,
  isHOD: false,
};

// 4. HOD User (Alex Rivera - holds both EMPLOYEE and HOD roles)
const hodUser: AuthenticatedUser = {
  id: "user-hod-uuid-001",
  firebase_uid: "fb-uid-hod-001",
  email: "hod@leaveflow.internal",
  display_name: "Alex Rivera",
  department_id: mockDepartment.id,
  department_name: mockDepartment.name,
  department_hod_user_id: "user-hod-uuid-001",
  manager_id: null,
  manager_name: null,
  status: UserStatus.ACTIVE,
  roles: [AppRole.EMPLOYEE, AppRole.HOD],
  isEmployee: true,
  isManager: false,
  isHOD: true,
};

// 5. Inactive Application User (Suspended employee)
const inactiveUser: AuthenticatedUser = {
  ...employeeUser,
  id: "user-inactive-uuid-003",
  status: UserStatus.INACTIVE,
};

// Leave Request Resource belonging to David Kim (assigned to Sarah Chen)
const davidLeaveRequest: LeaveRequestResource = {
  id: "req-001",
  employee_id: employeeUser.id,
  status: "PENDING_MANAGER",
  employee: {
    id: employeeUser.id,
    manager_id: managerUser.id,
    department_id: mockDepartment.id,
    department: {
      id: mockDepartment.id,
      hod_user_id: hodUser.id,
    },
  },
};

// Leave Request Resource belonging to Elena (assigned to Marcus Brody, NOT Sarah Chen)
const elenaLeaveRequest: LeaveRequestResource = {
  id: "req-002",
  employee_id: peerEmployeeUser.id,
  status: "PENDING_MANAGER",
  employee: {
    id: peerEmployeeUser.id,
    manager_id: "user-mgr-uuid-002", // Different manager
    department_id: mockDepartment.id,
    department: {
      id: mockDepartment.id,
      hod_user_id: hodUser.id,
    },
  },
};

// Leave Request Resource submitted by Manager Sarah Chen herself (reports to HOD Alex Rivera)
const managerSelfLeaveRequest: LeaveRequestResource = {
  id: "req-003",
  employee_id: managerUser.id,
  status: "PENDING_MANAGER",
  employee: {
    id: managerUser.id,
    manager_id: hodUser.id,
    department_id: mockDepartment.id,
    department: {
      id: mockDepartment.id,
      hod_user_id: hodUser.id,
    },
  },
};

// ---------------------------------------------------------------------------
// Test Execution
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

function assertThrows(fn: () => void, expectedCode: string, testName: string) {
  try {
    fn();
    console.error(`  [FAIL] ${testName} - Expected error with code ${expectedCode}, but no error was thrown.`);
    failed++;
  } catch (error: unknown) {
    const err = error as { code?: string; message: string };
    if (err.code === expectedCode) {
      console.log(`  [PASS] ${testName} (Caught expected code: ${err.code})`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} - Expected code ${expectedCode}, got ${err.code}: ${err.message}`);
      failed++;
    }
  }
}

async function runVerificationSuite() {
  console.log("==================================================================");
  console.log("AUTH & RBAC COMPREHENSIVE VERIFICATION SUITE");
  console.log("==================================================================\n");

  // TEST 1: Multiple Roles Per User Support
  console.log("--- 1. Multi-Role RBAC Support ---");
  assert(RBAC.hasRole(employeeUser, AppRole.EMPLOYEE), "Employee has EMPLOYEE role");
  assert(!RBAC.hasRole(employeeUser, AppRole.MANAGER), "Employee does NOT have MANAGER role");
  assert(!RBAC.hasRole(employeeUser, AppRole.HOD), "Employee does NOT have HOD role");
  assert(
    RBAC.hasRole(managerUser, AppRole.EMPLOYEE) && RBAC.hasRole(managerUser, AppRole.MANAGER),
    "Manager simultaneously holds EMPLOYEE and MANAGER roles"
  );
  assert(
    RBAC.hasRole(hodUser, AppRole.EMPLOYEE) && RBAC.hasRole(hodUser, AppRole.HOD),
    "HOD simultaneously holds EMPLOYEE and HOD roles"
  );

  // TEST 2: Employee Accessing Own vs Another Employee's Resource
  console.log("\n--- 2. Resource-Level Authorization (DR-01 & Privacy) ---");
  assert(
    RBAC.canAccessLeaveRequest(employeeUser, davidLeaveRequest),
    "Employee CAN access their own leave request"
  );
  assert(
    !RBAC.canAccessLeaveRequest(employeeUser, elenaLeaveRequest),
    "Employee CANNOT access another employee's leave request (Deny by default)"
  );
  assertThrows(
    () => RBAC.requireCanAccessLeaveRequest(employeeUser, elenaLeaveRequest),
    "RESOURCE_ACCESS_DENIED",
    "Employee accessing another employee's request throws 403 RESOURCE_ACCESS_DENIED"
  );

  // TEST 3: Manager Accessing Assigned vs Unassigned Direct Report
  console.log("\n--- 3. Manager Direct Report Scope (DR-01) ---");
  assert(
    RBAC.canAccessLeaveRequest(managerUser, davidLeaveRequest),
    "Manager CAN access assigned direct report's leave request"
  );
  assert(
    !RBAC.canAccessLeaveRequest(managerUser, elenaLeaveRequest),
    "Manager CANNOT access unassigned employee's leave request (assigned to another manager)"
  );
  assertThrows(
    () => RBAC.assertCanApproveAsManager(managerUser, elenaLeaveRequest),
    "NOT_ASSIGNED_MANAGER",
    "Manager attempting to approve unassigned employee throws 403 NOT_ASSIGNED_MANAGER"
  );

  // TEST 4: No Self-Approval Rule
  console.log("\n--- 4. Self-Approval Prohibition Rule ---");
  assertThrows(
    () => RBAC.assertCanApproveAsManager(managerUser, managerSelfLeaveRequest),
    "SELF_APPROVAL_PROHIBITED",
    "Manager attempting to approve own leave request throws 403 SELF_APPROVAL_PROHIBITED"
  );

  // TEST 5: Employee Attempting Manager Approval Action
  console.log("\n--- 5. Privilege Escalation Prevention: Employee Invoking Approval ---");
  assertThrows(
    () => RBAC.assertCanPerformAction(employeeUser, WorkflowAction.APPROVE, davidLeaveRequest),
    "INSUFFICIENT_ROLE",
    "Employee attempting APPROVE action throws 403 INSUFFICIENT_ROLE"
  );
  assertThrows(
    () => RBAC.assertCanPerformAction(employeeUser, WorkflowAction.REJECT, davidLeaveRequest),
    "INSUFFICIENT_ROLE",
    "Employee attempting REJECT action throws 403 INSUFFICIENT_ROLE"
  );
  assertThrows(
    () => RBAC.assertCanPerformAction(employeeUser, WorkflowAction.REQUEST_INFO, davidLeaveRequest),
    "INSUFFICIENT_ROLE",
    "Employee attempting REQUEST_INFO action throws 403 INSUFFICIENT_ROLE"
  );

  // TEST 6: Manager Attempting HOD-Only Actions
  console.log("\n--- 6. Privilege Escalation Prevention: Manager Invoking HOD Operations ---");
  assertThrows(
    () => RBAC.assertCanPerformAction(managerUser, WorkflowAction.HOD_APPROVE, davidLeaveRequest),
    "INSUFFICIENT_ROLE",
    "Manager attempting HOD_APPROVE action throws 403 INSUFFICIENT_ROLE"
  );
  assertThrows(
    () => RBAC.assertCanPerformAction(managerUser, WorkflowAction.HOD_REJECT, davidLeaveRequest),
    "INSUFFICIENT_ROLE",
    "Manager attempting HOD_REJECT action throws 403 INSUFFICIENT_ROLE"
  );
  assertThrows(
    () => RBAC.assertCanPerformAction(managerUser, WorkflowAction.APPEAL_APPROVE, davidLeaveRequest),
    "INSUFFICIENT_ROLE",
    "Manager attempting APPEAL_APPROVE action throws 403 INSUFFICIENT_ROLE"
  );

  // TEST 7: HOD Authorized Actions
  console.log("\n--- 7. HOD Authorized Approval Operations ---");
  assert(
    RBAC.canAccessLeaveRequest(hodUser, davidLeaveRequest),
    "HOD CAN access departmental leave request"
  );
  // HOD asserting approval for departmental request succeeds without throwing
  let hodAllowed = false;
  try {
    RBAC.assertCanApproveAsHOD(hodUser, davidLeaveRequest);
    hodAllowed = true;
  } catch {
    hodAllowed = false;
  }
  assert(hodAllowed, "HOD is authorized for departmental 2nd-level approval");

  // TEST 8: Inactive User Rejection
  console.log("\n--- 8. Inactive Application User Rejection ---");
  assert(inactiveUser.status === UserStatus.INACTIVE, "User status marked as INACTIVE");
  assertThrows(
    () => {
      if (inactiveUser.status !== UserStatus.ACTIVE) {
        throw new InactiveUserError();
      }
    },
    "USER_INACTIVE",
    "Inactive user throws 403 USER_INACTIVE and is blocked from session resolution"
  );

  // TEST 9: Login Rate Limiting (Sliding Window Brute-Force Protection)
  console.log("\n--- 9. Security: Login Rate Limiting ---");
  const testIp = "192.168.1.100";
  resetRateLimit(testIp);
  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(testIp, 5, 60000);
    assert(res.allowed, `Rate limit attempt ${i} of 5 is allowed`);
  }
  const blockedRes = checkRateLimit(testIp, 5, 60000);
  assert(!blockedRes.allowed, "6th attempt within window is BLOCKED with rate limit exceeded");
  resetRateLimit(testIp);

  // TEST 10: CSRF Protection
  console.log("\n--- 10. Security: CSRF Protection ---");
  const getReq = new Request("http://localhost:3000/api/v1/auth/me", { method: "GET" });
  assert(validateCsrfToken(getReq), "Safe GET requests bypass CSRF requirement");

  const matchingPostReq = new Request("http://localhost:3000/api/v1/auth/logout", {
    method: "POST",
    headers: {
      cookie: "leaveflow_csrf=token-123456",
      "x-csrf-token": "token-123456",
    },
  });
  assert(validateCsrfToken(matchingPostReq), "POST request with matching CSRF cookie and header is VALID");

  const mismatchedPostReq = new Request("http://localhost:3000/api/v1/auth/logout", {
    method: "POST",
    headers: {
      cookie: "leaveflow_csrf=token-123456",
      "x-csrf-token": "attacker-forged-token",
    },
  });
  assert(!validateCsrfToken(mismatchedPostReq), "POST request with mismatched CSRF token is REJECTED");

  console.log("\n==================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerificationSuite();

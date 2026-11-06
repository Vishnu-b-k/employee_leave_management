import { AppRole, WorkflowAction } from "@prisma/client";
import { AuthenticatedUser } from "@/modules/users/user.service";
import { AuthorizationError } from "./errors";

export interface LeaveRequestResource {
  id: string;
  employee_id: string;
  status: string;
  employee?: {
    id: string;
    manager_id: string | null;
    department_id: string | null;
    department?: {
      id: string;
      hod_user_id: string | null;
    } | null;
  } | null;
}

/**
 * Reusable server-side Role-Based Access Control and Resource-Level Authorization Utility.
 * Enforces deny-by-default on every check.
 */
export class RBAC {
  /**
   * Checks if user has a specific role.
   */
  static hasRole(user: AuthenticatedUser, role: AppRole): boolean {
    return user.roles.includes(role);
  }

  /**
   * Checks if user has any of the specified roles.
   */
  static hasAnyRole(user: AuthenticatedUser, roles: AppRole[]): boolean {
    return roles.some((r) => user.roles.includes(r));
  }

  /**
   * Enforces that user has a specific role. Throws 403 AuthorizationError if not.
   */
  static requireRole(user: AuthenticatedUser, role: AppRole): void {
    if (!this.hasRole(user, role)) {
      throw new AuthorizationError(
        `Access denied. Required role: ${role}`,
        "INSUFFICIENT_ROLE"
      );
    }
  }

  /**
   * Enforces that user has at least one of the specified roles.
   */
  static requireAnyRole(user: AuthenticatedUser, roles: AppRole[]): void {
    if (!this.hasAnyRole(user, roles)) {
      throw new AuthorizationError(
        `Access denied. Requires one of: ${roles.join(", ")}`,
        "INSUFFICIENT_ROLE"
      );
    }
  }

  /**
   * Resource-level read check for leave requests:
   * 1. Employee: Can view their own requests.
   * 2. Manager: Can view requests of assigned direct reports only (DR-01).
   * 3. HOD: Can view requests in their authorized department.
   * Denies by default.
   */
  static canAccessLeaveRequest(user: AuthenticatedUser, request: LeaveRequestResource): boolean {
    // 1. Is the user the requesting employee?
    if (user.id === request.employee_id) {
      return true;
    }

    // 2. Is the user the assigned manager of this employee?
    if (this.hasRole(user, AppRole.MANAGER) && request.employee?.manager_id === user.id) {
      return true;
    }

    // 3. Is the user the HOD of the employee's department?
    if (
      this.hasRole(user, AppRole.HOD) &&
      request.employee?.department?.hod_user_id === user.id
    ) {
      return true;
    }

    // Default deny
    return false;
  }

  /**
   * Enforces resource access on a leave request. Throws 403 if unauthorized.
   */
  static requireCanAccessLeaveRequest(
    user: AuthenticatedUser,
    request: LeaveRequestResource
  ): void {
    if (!this.canAccessLeaveRequest(user, request)) {
      throw new AuthorizationError(
        "Access denied. You do not have permission to view or access this leave request.",
        "RESOURCE_ACCESS_DENIED"
      );
    }
  }

  /**
   * Enforces approval permission for manager workflow actions:
   * - Must have MANAGER role.
   * - No self-approval.
   * - Must be the assigned manager.
   */
  static assertCanApproveAsManager(
    user: AuthenticatedUser,
    request: LeaveRequestResource
  ): void {
    this.requireRole(user, AppRole.MANAGER);

    // Rule: No self-approval
    if (request.employee_id === user.id) {
      throw new AuthorizationError(
        "Self-approval is strictly prohibited. You cannot approve your own leave request.",
        "SELF_APPROVAL_PROHIBITED"
      );
    }

    // Rule: Must be assigned manager
    if (request.employee?.manager_id !== user.id) {
      throw new AuthorizationError(
        "Access denied. Managers can only act on requests of their assigned direct reports.",
        "NOT_ASSIGNED_MANAGER"
      );
    }
  }

  /**
   * Enforces approval permission for HOD workflow actions:
   * - Must have HOD role.
   * - No self-approval.
   * - Must be department HOD.
   */
  static assertCanApproveAsHOD(
    user: AuthenticatedUser,
    request: LeaveRequestResource
  ): void {
    this.requireRole(user, AppRole.HOD);

    // Rule: No self-approval
    if (request.employee_id === user.id) {
      throw new AuthorizationError(
        "Self-approval is strictly prohibited. HOD cannot approve their own leave request.",
        "SELF_APPROVAL_PROHIBITED"
      );
    }

    // Rule: Must be the department's authorized HOD
    if (request.employee?.department?.hod_user_id !== user.id) {
      throw new AuthorizationError(
        "Access denied. HOD can only review requests within their assigned department.",
        "NOT_DEPARTMENT_HOD"
      );
    }
  }

  /**
   * Comprehensive action authorization guard.
   * Validates actor role and resource constraints for all 12 workflow actions.
   */
  static assertCanPerformAction(
    user: AuthenticatedUser,
    action: WorkflowAction,
    request: LeaveRequestResource
  ): void {
    switch (action) {
      case WorkflowAction.SUBMIT:
      case WorkflowAction.EDIT:
      case WorkflowAction.CANCEL:
      case WorkflowAction.RESUBMIT:
      case WorkflowAction.APPEAL:
        // Employee-only actions on own request
        if (request.employee_id !== user.id) {
          throw new AuthorizationError(
            `Only the requesting employee can perform action: ${action}`,
            "NOT_REQUEST_OWNER"
          );
        }
        break;

      case WorkflowAction.APPROVE:
      case WorkflowAction.REJECT:
      case WorkflowAction.REQUEST_INFO:
        // Manager actions
        this.assertCanApproveAsManager(user, request);
        break;

      case WorkflowAction.HOD_APPROVE:
      case WorkflowAction.HOD_REJECT:
      case WorkflowAction.APPEAL_APPROVE:
      case WorkflowAction.APPEAL_REJECT:
        // HOD actions - Managers cannot invoke these
        this.assertCanApproveAsHOD(user, request);
        break;

      default:
        throw new AuthorizationError(
          `Unauthorized action: ${action}`,
          "INVALID_WORKFLOW_ACTION"
        );
    }
  }
}

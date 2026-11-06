import { prisma } from "@/lib/prisma";
import { 
  AppRole, 
  LeaveStatus, 
  WorkflowAction, 
  AppealStatus, 
  NotificationEvent, 
  UploadPhase 
} from "@prisma/client";
import { AuthenticatedUser } from "@/modules/users/user.service";
import { RBAC } from "@/lib/auth/rbac";
import { calculateWorkingDays } from "./working-days";

export class LeaveWorkflowError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "WORKFLOW_ERROR") {
    super(message);
    this.name = "LeaveWorkflowError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface CreateLeaveRequestInput {
  leaveTypeId: string;
  startDate: string | Date;
  endDate: string | Date;
  reason: string;
  documents?: Array<{
    originalFilename: string;
    storageKey: string;
    mimeType: string;
    fileSizeBytes: number;
  }>;
}

export interface ManagerDecisionInput {
  action: "APPROVE" | "REJECT" | "REQUEST_INFO";
  comment?: string;
  version?: number;
}

export interface HodDecisionInput {
  action: "HOD_APPROVE" | "HOD_REJECT" | "APPEAL_APPROVE" | "APPEAL_REJECT";
  comment?: string;
  version?: number;
}

export class LeaveService {
  /**
   * Submits a new leave request for the authenticated employee.
   * Validates dates, calculates working days, enforces document requirement for >3 days.
   * Persists atomically in a transaction.
   */
  static async createLeaveRequest(
    user: AuthenticatedUser,
    input: CreateLeaveRequestInput
  ) {
    if (!user.isEmployee) {
      throw new LeaveWorkflowError("Only employees can submit leave applications.", 403, "NOT_AN_EMPLOYEE");
    }

    if (!input.leaveTypeId) {
      throw new LeaveWorkflowError("Leave type is required.", 400, "MISSING_LEAVE_TYPE");
    }
    if (!input.startDate || !input.endDate) {
      throw new LeaveWorkflowError("Start date and end date are required.", 400, "MISSING_DATES");
    }
    if (!input.reason || input.reason.trim().length === 0) {
      throw new LeaveWorkflowError("A reason for absence is required.", 400, "MISSING_REASON");
    }

    // Verify leave type configuration exists and is active
    const leaveType = await prisma.leaveTypeConfig.findUnique({
      where: { id: input.leaveTypeId },
    });

    if (!leaveType || !leaveType.is_active) {
      throw new LeaveWorkflowError("Selected leave type does not exist or is inactive.", 400, "INVALID_LEAVE_TYPE");
    }

    // Calculate working days (excluding weekends & database-configured holidays)
    const { workingDays } = await calculateWorkingDays(input.startDate, input.endDate);

    if (workingDays <= 0) {
      throw new LeaveWorkflowError(
        "The selected date range does not contain any working days (weekends or public holidays only).",
        400,
        "ZERO_WORKING_DAYS"
      );
    }

    const requiresHodApproval = workingDays > 3;
    const documentsProvided = input.documents && input.documents.length > 0;

    // RULE: More than 3 working days requires supporting documents
    if (requiresHodApproval && !documentsProvided) {
      throw new LeaveWorkflowError(
        `Leave requests exceeding 3 working days (${workingDays} days requested) require mandatory supporting documentation.`,
        400,
        "DOCUMENT_REQUIRED"
      );
    }

    const startDateObj = new Date(input.startDate);
    const endDateObj = new Date(input.endDate);

    // Atomically persist request, documents, audit log and notification
    return prisma.$transaction(async (tx) => {
      const leaveRequest = await tx.leaveRequest.create({
        data: {
          employee_id: user.id,
          leave_type_id: input.leaveTypeId,
          start_date: startDateObj,
          end_date: endDateObj,
          calculated_working_days: workingDays,
          reason: input.reason.trim(),
          status: LeaveStatus.PENDING_MANAGER,
          requires_hod_approval: requiresHodApproval,
          version: 1,
        },
        include: {
          leave_type: true,
        },
      });

      // Attach documents if provided
      if (input.documents && input.documents.length > 0) {
        for (const doc of input.documents) {
          await tx.document.create({
            data: {
              leave_request_id: leaveRequest.id,
              uploaded_by_user_id: user.id,
              original_filename: doc.originalFilename,
              storage_key: doc.storageKey,
              mime_type: doc.mimeType,
              file_size_bytes: doc.fileSizeBytes,
              upload_phase: UploadPhase.INITIAL,
            },
          });
        }
      }

      // Record immutable audit log
      await tx.auditLog.create({
        data: {
          actor_id: user.id,
          actor_role: AppRole.EMPLOYEE,
          action: WorkflowAction.SUBMIT,
          resource_type: "leave_request",
          resource_id: leaveRequest.id,
          metadata: {
            calculated_working_days: workingDays,
            requires_hod_approval: requiresHodApproval,
            start_date: startDateObj.toISOString(),
            end_date: endDateObj.toISOString(),
            leave_type: leaveType.name,
            documents_count: input.documents?.length || 0,
          },
        },
      });

      // Notify reporting manager
      if (user.manager_id) {
        await tx.notification.create({
          data: {
            recipient_user_id: user.manager_id,
            event_type: NotificationEvent.NEW_REQUEST,
            title: "New Leave Application Submitted",
            message: `${user.display_name} has submitted a leave request for ${workingDays} working day(s) (${leaveType.name}).`,
            leave_request_id: leaveRequest.id,
          },
        });
      }

      // Re-fetch with full associations
      return tx.leaveRequest.findUniqueOrThrow({
        where: { id: leaveRequest.id },
        include: {
          leave_type: true,
          documents: true,
        },
      });
    });
  }

  /**
   * Retrieves all leave requests for the authenticated employee.
   */
  static async getEmployeeRequests(user: AuthenticatedUser) {
    return prisma.leaveRequest.findMany({
      where: { employee_id: user.id },
      include: {
        leave_type: true,
        documents: true,
        decisions: {
          orderBy: { created_at: "asc" },
          include: {
            actor: {
              select: {
                id: true,
                display_name: true,
                email: true,
              },
            },
          },
        },
        appeals: {
          orderBy: { created_at: "desc" },
          include: {
            manager_rejection_decision: true,
            hod_decision: true,
          },
        },
      },
      orderBy: { submitted_at: "desc" },
    });
  }

  /**
   * Retrieves a single leave request by ID, verifying role and resource permissions.
   */
  static async getLeaveRequestById(user: AuthenticatedUser, id: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            display_name: true,
            email: true,
            manager_id: true,
            department_id: true,
            department: {
              select: {
                id: true,
                name: true,
                hod_user_id: true,
              },
            },
          },
        },
        leave_type: true,
        documents: true,
        decisions: {
          orderBy: { created_at: "asc" },
          include: {
            actor: {
              select: {
                id: true,
                display_name: true,
                email: true,
              },
            },
          },
        },
        appeals: {
          orderBy: { created_at: "desc" },
          include: {
            manager_rejection_decision: true,
            hod_decision: true,
          },
        },
      },
    });

    if (!request) {
      throw new LeaveWorkflowError("Leave request not found.", 404, "NOT_FOUND");
    }

    RBAC.requireCanAccessLeaveRequest(user, request);

    return request;
  }

  /**
   * Retrieves leave requests for a reporting manager.
   * Enforces assigned-employee scope (DR-01) and forbids self-approval (DR-10).
   */
  static async getManagerRequests(user: AuthenticatedUser) {
    if (!user.isManager) {
      throw new LeaveWorkflowError("Access denied. Manager role required.", 403, "NOT_A_MANAGER");
    }

    return prisma.leaveRequest.findMany({
      where: {
        employee: {
          manager_id: user.id,
        },
        employee_id: {
          not: user.id, // Strictly prohibit approving own leave
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            display_name: true,
            email: true,
            department_id: true,
          },
        },
        leave_type: true,
        documents: true,
        decisions: {
          orderBy: { created_at: "asc" },
        },
      },
      orderBy: { submitted_at: "desc" },
    });
  }

  /**
   * Records a Manager decision: APPROVE, REJECT, or REQUEST_INFO.
   * Enforces assigned scope, version-checked optimistic concurrency, and appropriate state transitions.
   */
  static async recordManagerDecision(
    user: AuthenticatedUser,
    leaveRequestId: string,
    input: ManagerDecisionInput
  ) {
    if (!user.isManager) {
      throw new LeaveWorkflowError("Access denied. Manager role required.", 403, "NOT_A_MANAGER");
    }

    const { action, comment, version } = input;

    if (!["APPROVE", "REJECT", "REQUEST_INFO"].includes(action)) {
      throw new LeaveWorkflowError(`Invalid manager action: ${action}`, 400, "INVALID_ACTION");
    }

    // Require appropriate comments for decisions
    if (action === "REJECT" && (!comment || comment.trim().length === 0)) {
      throw new LeaveWorkflowError("A comment explaining the reason for rejection is required.", 400, "COMMENT_REQUIRED");
    }
    if (action === "REQUEST_INFO" && (!comment || comment.trim().length === 0)) {
      throw new LeaveWorkflowError("A comment detailing the requested information is required.", 400, "COMMENT_REQUIRED");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Fetch request with employee and department relations
      const request = await tx.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: {
          employee: {
            select: {
              id: true,
              display_name: true,
              email: true,
              manager_id: true,
              department_id: true,
              department: {
                select: {
                  id: true,
                  hod_user_id: true,
                },
              },
            },
          },
        },
      });

      if (!request) {
        throw new LeaveWorkflowError("Leave request not found.", 404, "NOT_FOUND");
      }

      // 2. Enforce scope and no self-approval (DR-01, DR-10)
      RBAC.assertCanApproveAsManager(user, request);

      // 3. Optimistic concurrency check
      if (version !== undefined && request.version !== version) {
        throw new LeaveWorkflowError(
          "Conflict: The request has been modified by another transaction. Please refresh and try again.",
          409,
          "CONCURRENCY_CONFLICT"
        );
      }

      // 4. Validate allowed current status for manager decision
      const validStartingStatuses: LeaveStatus[] = [LeaveStatus.PENDING_MANAGER, LeaveStatus.INFO_REQUESTED];
      if (!validStartingStatuses.includes(request.status)) {
        throw new LeaveWorkflowError(
          `Cannot perform manager action ${action} on request with status: ${request.status}`,
          409,
          "INVALID_STATE_TRANSITION"
        );
      }

      // 5. Determine new status
      let newStatus: LeaveStatus;
      let notificationEvent: NotificationEvent;

      if (action === "APPROVE") {
        if (request.calculated_working_days <= 3) {
          // <= 3 working days: Manager approval completes the request (terminal APPROVED)
          newStatus = LeaveStatus.APPROVED;
          notificationEvent = NotificationEvent.REQUEST_APPROVED;
        } else {
          // > 3 working days: Manager approval moves it to PENDING_HOD
          newStatus = LeaveStatus.PENDING_HOD;
          notificationEvent = NotificationEvent.PENDING_HOD_APPROVAL;
        }
      } else if (action === "REJECT") {
        newStatus = LeaveStatus.REJECTED_BY_MANAGER;
        notificationEvent = NotificationEvent.REQUEST_REJECTED;
      } else {
        newStatus = LeaveStatus.INFO_REQUESTED;
        notificationEvent = NotificationEvent.INFO_REQUESTED;
      }

      // 6. Update LeaveRequest with atomic version increment
      const updatedRequest = await tx.leaveRequest.update({
        where: {
          id: request.id,
          version: request.version, // atomic check
        },
        data: {
          status: newStatus,
          version: { increment: 1 },
        },
      });

      // 7. Record decision
      const workflowAction = WorkflowAction[action as keyof typeof WorkflowAction];
      const decisionRecord = await tx.decision.create({
        data: {
          leave_request_id: request.id,
          actor_id: user.id,
          actor_role: AppRole.MANAGER,
          action: workflowAction,
          comment: comment?.trim() || null,
          previous_status: request.status,
          new_status: newStatus,
        },
      });

      // 8. Record audit log
      await tx.auditLog.create({
        data: {
          actor_id: user.id,
          actor_role: AppRole.MANAGER,
          action: workflowAction,
          resource_type: "leave_request",
          resource_id: request.id,
          metadata: {
            previous_status: request.status,
            new_status: newStatus,
            comment: comment?.trim() || null,
            version: updatedRequest.version,
          },
        },
      });

      // 9. Send notifications
      // A. To employee
      await tx.notification.create({
        data: {
          recipient_user_id: request.employee_id,
          event_type: notificationEvent,
          title: `Leave Request: ${action.replace("_", " ")}`,
          message: `Manager ${user.display_name} has updated your leave request to ${newStatus}.${comment ? ` Note: "${comment.trim()}"` : ""}`,
          leave_request_id: request.id,
        },
      });

      // B. If escalated to PENDING_HOD, notify Department HOD
      if (newStatus === LeaveStatus.PENDING_HOD) {
        const hodUserId = request.employee.department?.hod_user_id;
        if (hodUserId && hodUserId !== user.id) {
          await tx.notification.create({
            data: {
              recipient_user_id: hodUserId,
              event_type: NotificationEvent.PENDING_HOD_APPROVAL,
              title: "Long Leave Request Pending HOD Review",
              message: `Long leave request (${request.calculated_working_days} working days) for ${request.employee.display_name} has been endorsed by manager and requires your approval.`,
              leave_request_id: request.id,
            },
          });
        }
      }

      return {
        request: updatedRequest,
        decision: decisionRecord,
      };
    });
  }

  /**
   * Retrieves HOD review requests within the authorized department.
   * Includes PENDING_HOD (long leave) and UNDER_APPEAL (appeals).
   */
  static async getHodReviewRequests(user: AuthenticatedUser) {
    if (!user.isHOD) {
      throw new LeaveWorkflowError("Access denied. HOD role required.", 403, "NOT_A_HOD");
    }

    return prisma.leaveRequest.findMany({
      where: {
        employee: {
          department: {
            hod_user_id: user.id,
          },
        },
        employee_id: {
          not: user.id, // Strictly prohibit self-approval
        },
        status: {
          in: [LeaveStatus.PENDING_HOD, LeaveStatus.UNDER_APPEAL, LeaveStatus.APPROVED, LeaveStatus.APPROVED_ON_APPEAL, LeaveStatus.REJECTED_BY_HOD, LeaveStatus.APPEAL_REJECTED],
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            display_name: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        leave_type: true,
        documents: true,
        decisions: {
          orderBy: { created_at: "asc" },
          include: {
            actor: {
              select: {
                id: true,
                display_name: true,
                email: true,
              },
            },
          },
        },
        appeals: {
          orderBy: { created_at: "desc" },
          include: {
            manager_rejection_decision: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
    });
  }

  /**
   * Records an HOD decision:
   * - HOD_APPROVE: PENDING_HOD -> APPROVED
   * - HOD_REJECT: PENDING_HOD -> REJECTED_BY_HOD
   * - APPEAL_APPROVE: UNDER_APPEAL -> APPROVED_ON_APPEAL
   * - APPEAL_REJECT: UNDER_APPEAL -> APPEAL_REJECTED
   */
  static async recordHodDecision(
    user: AuthenticatedUser,
    leaveRequestId: string,
    input: HodDecisionInput
  ) {
    if (!user.isHOD) {
      throw new LeaveWorkflowError("Access denied. HOD role required.", 403, "NOT_A_HOD");
    }

    const { action, comment, version } = input;

    if (!["HOD_APPROVE", "HOD_REJECT", "APPEAL_APPROVE", "APPEAL_REJECT"].includes(action)) {
      throw new LeaveWorkflowError(`Invalid HOD action: ${action}`, 400, "INVALID_ACTION");
    }

    // Require appropriate comments for rejections
    if (["HOD_REJECT", "APPEAL_REJECT"].includes(action) && (!comment || comment.trim().length === 0)) {
      throw new LeaveWorkflowError("A comment explaining the decision is required for rejection.", 400, "COMMENT_REQUIRED");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Fetch request with relations
      const request = await tx.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: {
          employee: {
            select: {
              id: true,
              display_name: true,
              email: true,
              manager_id: true,
              department_id: true,
              department: {
                select: {
                  id: true,
                  hod_user_id: true,
                },
              },
            },
          },
          appeals: {
            where: { status: AppealStatus.PENDING },
            orderBy: { created_at: "desc" },
          },
        },
      });

      if (!request) {
        throw new LeaveWorkflowError("Leave request not found.", 404, "NOT_FOUND");
      }

      // 2. Enforce department authority and no self-approval (DR-02, DR-10)
      RBAC.assertCanApproveAsHOD(user, request);

      // 3. Optimistic concurrency check
      if (version !== undefined && request.version !== version) {
        throw new LeaveWorkflowError(
          "Conflict: The request has been modified by another transaction. Please refresh and try again.",
          409,
          "CONCURRENCY_CONFLICT"
        );
      }

      // 4. Validate state transitions
      let newStatus: LeaveStatus;
      let notificationEvent: NotificationEvent;

      if (action === "HOD_APPROVE") {
        if (request.status !== LeaveStatus.PENDING_HOD) {
          throw new LeaveWorkflowError(
            `HOD_APPROVE requires request status to be PENDING_HOD, but found: ${request.status}`,
            409,
            "INVALID_STATE_TRANSITION"
          );
        }
        newStatus = LeaveStatus.APPROVED;
        notificationEvent = NotificationEvent.REQUEST_APPROVED;
      } else if (action === "HOD_REJECT") {
        if (request.status !== LeaveStatus.PENDING_HOD) {
          throw new LeaveWorkflowError(
            `HOD_REJECT requires request status to be PENDING_HOD, but found: ${request.status}`,
            409,
            "INVALID_STATE_TRANSITION"
          );
        }
        newStatus = LeaveStatus.REJECTED_BY_HOD;
        notificationEvent = NotificationEvent.REQUEST_REJECTED;
      } else if (action === "APPEAL_APPROVE") {
        if (request.status !== LeaveStatus.UNDER_APPEAL) {
          throw new LeaveWorkflowError(
            `APPEAL_APPROVE requires request status to be UNDER_APPEAL, but found: ${request.status}`,
            409,
            "INVALID_STATE_TRANSITION"
          );
        }
        // Appeal overturn moves UNDER_APPEAL to APPROVED_ON_APPEAL
        newStatus = LeaveStatus.APPROVED_ON_APPEAL;
        notificationEvent = NotificationEvent.APPEAL_DECIDED;
      } else {
        // APPEAL_REJECT
        if (request.status !== LeaveStatus.UNDER_APPEAL) {
          throw new LeaveWorkflowError(
            `APPEAL_REJECT requires request status to be UNDER_APPEAL, but found: ${request.status}`,
            409,
            "INVALID_STATE_TRANSITION"
          );
        }
        // An upheld appeal moves UNDER_APPEAL to APPEAL_REJECTED
        newStatus = LeaveStatus.APPEAL_REJECTED;
        notificationEvent = NotificationEvent.APPEAL_DECIDED;
      }

      // 5. Update LeaveRequest with atomic version increment
      const updatedRequest = await tx.leaveRequest.update({
        where: {
          id: request.id,
          version: request.version,
        },
        data: {
          status: newStatus,
          version: { increment: 1 },
        },
      });

      // 6. Record HOD Decision
      const workflowAction = WorkflowAction[action as keyof typeof WorkflowAction];
      const decisionRecord = await tx.decision.create({
        data: {
          leave_request_id: request.id,
          actor_id: user.id,
          actor_role: AppRole.HOD,
          action: workflowAction,
          comment: comment?.trim() || null,
          previous_status: request.status,
          new_status: newStatus,
        },
      });

      // 7. If this was an appeal decision, resolve the Appeal record
      if (action === "APPEAL_APPROVE" || action === "APPEAL_REJECT") {
        const pendingAppeal = request.appeals[0];
        if (pendingAppeal) {
          await tx.appeal.update({
            where: { id: pendingAppeal.id },
            data: {
              status: action === "APPEAL_APPROVE" ? AppealStatus.OVERTURNED : AppealStatus.UPHELD,
              hod_decision_id: decisionRecord.id,
            },
          });
        }
      }

      // 8. Record audit log
      await tx.auditLog.create({
        data: {
          actor_id: user.id,
          actor_role: AppRole.HOD,
          action: workflowAction,
          resource_type: "leave_request",
          resource_id: request.id,
          metadata: {
            previous_status: request.status,
            new_status: newStatus,
            comment: comment?.trim() || null,
            version: updatedRequest.version,
          },
        },
      });

      // 9. Notify employee
      await tx.notification.create({
        data: {
          recipient_user_id: request.employee_id,
          event_type: notificationEvent,
          title: `HOD Decision: ${action.replace("_", " ")}`,
          message: `Department Head ${user.display_name} has finalized your request with determination: ${newStatus}.${comment ? ` Note: "${comment.trim()}"` : ""}`,
          leave_request_id: request.id,
        },
      });

      return {
        request: updatedRequest,
        decision: decisionRecord,
      };
    });
  }

  /**
   * Files a formal employee appeal against a REJECTED_BY_MANAGER status.
   * Preserves original manager decision and comments.
   */
  static async fileAppeal(
    user: AuthenticatedUser,
    leaveRequestId: string,
    justification: string,
    version?: number
  ) {
    if (!justification || justification.trim().length === 0) {
      throw new LeaveWorkflowError("An appeal justification is required.", 400, "MISSING_JUSTIFICATION");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Fetch request with decision history
      const request = await tx.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: {
          employee: {
            select: {
              id: true,
              display_name: true,
              department_id: true,
              department: {
                select: {
                  id: true,
                  hod_user_id: true,
                },
              },
            },
          },
          decisions: {
            where: { action: WorkflowAction.REJECT },
            orderBy: { created_at: "desc" },
          },
        },
      });

      if (!request) {
        throw new LeaveWorkflowError("Leave request not found.", 404, "NOT_FOUND");
      }

      // 2. Ownership check
      if (request.employee_id !== user.id) {
        throw new LeaveWorkflowError("Only the requesting employee can file an appeal.", 403, "NOT_OWNER");
      }

      // 3. Concurrency check
      if (version !== undefined && request.version !== version) {
        throw new LeaveWorkflowError(
          "Conflict: The request has been modified by another transaction. Please refresh and try again.",
          409,
          "CONCURRENCY_CONFLICT"
        );
      }

      // 4. RULE: Only allow an appeal against REJECTED_BY_MANAGER
      if (request.status !== LeaveStatus.REJECTED_BY_MANAGER) {
        throw new LeaveWorkflowError(
          `Appeals are only permitted for requests in REJECTED_BY_MANAGER status. Current status: ${request.status}`,
          409,
          "INVALID_STATE_TRANSITION"
        );
      }

      // 5. Retrieve original manager rejection decision to preserve it
      const managerRejection = request.decisions[0];
      if (!managerRejection) {
        throw new LeaveWorkflowError(
          "Cannot locate original manager rejection decision record.",
          400,
          "MISSING_MANAGER_DECISION"
        );
      }

      // 6. Transition state to UNDER_APPEAL
      const updatedRequest = await tx.leaveRequest.update({
        where: {
          id: request.id,
          version: request.version,
        },
        data: {
          status: LeaveStatus.UNDER_APPEAL,
          version: { increment: 1 },
        },
      });

      // 7. Create Appeal record preserving manager_rejection_decision_id
      const appealRecord = await tx.appeal.create({
        data: {
          leave_request_id: request.id,
          employee_id: user.id,
          justification: justification.trim(),
          manager_rejection_decision_id: managerRejection.id,
          status: AppealStatus.PENDING,
        },
      });

      // 8. Record audit log
      await tx.auditLog.create({
        data: {
          actor_id: user.id,
          actor_role: AppRole.EMPLOYEE,
          action: WorkflowAction.APPEAL,
          resource_type: "leave_request",
          resource_id: request.id,
          metadata: {
            justification: justification.trim(),
            manager_rejection_decision_id: managerRejection.id,
            previous_status: request.status,
            new_status: LeaveStatus.UNDER_APPEAL,
            version: updatedRequest.version,
          },
        },
      });

      // 9. Notify Department HOD
      const hodUserId = request.employee.department?.hod_user_id;
      if (hodUserId) {
        await tx.notification.create({
          data: {
            recipient_user_id: hodUserId,
            event_type: NotificationEvent.APPEAL_FILED,
            title: "Employee Rejection Appeal Filed",
            message: `${user.display_name} has appealed a manager rejection for leave request. Awaiting HOD review.`,
            leave_request_id: request.id,
          },
        });
      }

      return {
        request: updatedRequest,
        appeal: appealRecord,
      };
    });
  }

  /**
   * Cancels an eligible pending leave application (only in PENDING_MANAGER status).
   */
  static async cancelLeaveRequest(
    user: AuthenticatedUser,
    leaveRequestId: string,
    version?: number
  ) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id: leaveRequestId },
      });

      if (!request) {
        throw new LeaveWorkflowError("Leave request not found.", 404, "NOT_FOUND");
      }

      if (request.employee_id !== user.id) {
        throw new LeaveWorkflowError("Only the requesting employee can cancel this application.", 403, "NOT_OWNER");
      }

      if (version !== undefined && request.version !== version) {
        throw new LeaveWorkflowError(
          "Conflict: The request has been modified by another transaction.",
          409,
          "CONCURRENCY_CONFLICT"
        );
      }

      if (request.status !== LeaveStatus.PENDING_MANAGER) {
        throw new LeaveWorkflowError(
          `Only pending requests in PENDING_MANAGER status can be cancelled. Current status: ${request.status}`,
          409,
          "INVALID_STATE_TRANSITION"
        );
      }

      const updatedRequest = await tx.leaveRequest.update({
        where: { id: request.id, version: request.version },
        data: {
          status: LeaveStatus.CANCELLED,
          version: { increment: 1 },
        },
      });

      await tx.decision.create({
        data: {
          leave_request_id: request.id,
          actor_id: user.id,
          actor_role: AppRole.EMPLOYEE,
          action: WorkflowAction.CANCEL,
          previous_status: request.status,
          new_status: LeaveStatus.CANCELLED,
          comment: "Cancelled by employee.",
        },
      });

      await tx.auditLog.create({
        data: {
          actor_id: user.id,
          actor_role: AppRole.EMPLOYEE,
          action: WorkflowAction.CANCEL,
          resource_type: "leave_request",
          resource_id: request.id,
          metadata: {
            previous_status: request.status,
            new_status: LeaveStatus.CANCELLED,
            version: updatedRequest.version,
          },
        },
      });

      if (user.manager_id) {
        await tx.notification.create({
          data: {
            recipient_user_id: user.manager_id,
            event_type: NotificationEvent.NEW_REQUEST,
            title: "Leave Application Cancelled",
            message: `${user.display_name} has cancelled their leave application.`,
            leave_request_id: request.id,
          },
        });
      }

      return updatedRequest;
    });
  }

  /**
   * Responds to manager information request with additional notes & optional documents,
   * returning request to PENDING_MANAGER review.
   */
  static async resubmitLeaveRequest(
    user: AuthenticatedUser,
    leaveRequestId: string,
    input: {
      responseNotes?: string;
      additionalDocuments?: Array<{
        originalFilename: string;
        storageKey: string;
        mimeType: string;
        fileSizeBytes: number;
      }>;
      version?: number;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id: leaveRequestId },
      });

      if (!request) {
        throw new LeaveWorkflowError("Leave request not found.", 404, "NOT_FOUND");
      }

      if (request.employee_id !== user.id) {
        throw new LeaveWorkflowError("Only the requesting employee can resubmit this application.", 403, "NOT_OWNER");
      }

      if (input.version !== undefined && request.version !== input.version) {
        throw new LeaveWorkflowError(
          "Conflict: The request has been modified by another transaction.",
          409,
          "CONCURRENCY_CONFLICT"
        );
      }

      if (request.status !== LeaveStatus.INFO_REQUESTED) {
        throw new LeaveWorkflowError(
          `Only requests in INFO_REQUESTED status can be resubmitted. Current status: ${request.status}`,
          409,
          "INVALID_STATE_TRANSITION"
        );
      }

      const updatedRequest = await tx.leaveRequest.update({
        where: { id: request.id, version: request.version },
        data: {
          status: LeaveStatus.PENDING_MANAGER,
          version: { increment: 1 },
        },
      });

      if (input.additionalDocuments && input.additionalDocuments.length > 0) {
        for (const doc of input.additionalDocuments) {
          await tx.document.create({
            data: {
              leave_request_id: request.id,
              uploaded_by_user_id: user.id,
              original_filename: doc.originalFilename,
              storage_key: doc.storageKey,
              mime_type: doc.mimeType,
              file_size_bytes: doc.fileSizeBytes,
              upload_phase: UploadPhase.ADDITIONAL,
            },
          });
        }
      }

      await tx.decision.create({
        data: {
          leave_request_id: request.id,
          actor_id: user.id,
          actor_role: AppRole.EMPLOYEE,
          action: WorkflowAction.RESUBMIT,
          previous_status: request.status,
          new_status: LeaveStatus.PENDING_MANAGER,
          comment: input.responseNotes || "Additional information provided by employee.",
        },
      });

      await tx.auditLog.create({
        data: {
          actor_id: user.id,
          actor_role: AppRole.EMPLOYEE,
          action: WorkflowAction.RESUBMIT,
          resource_type: "leave_request",
          resource_id: request.id,
          metadata: {
            previous_status: request.status,
            new_status: LeaveStatus.PENDING_MANAGER,
            additional_documents_count: input.additionalDocuments?.length || 0,
            response_notes: input.responseNotes,
            version: updatedRequest.version,
          },
        },
      });

      if (user.manager_id) {
        await tx.notification.create({
          data: {
            recipient_user_id: user.manager_id,
            event_type: NotificationEvent.REQUEST_RESUBMITTED,
            title: "Leave Request Resubmitted",
            message: `${user.display_name} has provided the requested information. Request is ready for review.`,
            leave_request_id: request.id,
          },
        });
      }

      return updatedRequest;
    });
  }
}

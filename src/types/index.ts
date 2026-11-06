// Core Domain Types and Re-exports from Prisma Client

export type {
  Department,
  User,
  UserRole,
  LeaveTypeConfig,
  LeaveRequest,
  Decision,
  Appeal,
  Document,
  Holiday,
  Notification,
  AuditLog,
  SystemConfig,
  UserStatus,
  AppRole,
  LeaveStatus,
  WorkflowAction,
  UploadPhase,
  AppealStatus,
  NotificationEvent,
} from "@prisma/client";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface HealthCheckResponse {
  status: "ok" | "ready" | "not_ready";
  service: string;
  version: string;
  timestamp: string;
  uptime_seconds?: number;
  database?: {
    status: "connected" | "disconnected";
    latency_ms?: number;
    error?: string;
  };
}

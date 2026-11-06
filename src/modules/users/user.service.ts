import { prisma } from "@/lib/prisma";
import { AppRole, UserStatus } from "@prisma/client";

export interface AuthenticatedUser {
  id: string; // PostgreSQL UUID
  firebase_uid: string;
  email: string;
  display_name: string;
  department_id: string | null;
  department_name: string | null;
  department_hod_user_id: string | null;
  manager_id: string | null;
  manager_name: string | null;
  status: UserStatus;
  roles: AppRole[];
  isEmployee: boolean;
  isManager: boolean;
  isHOD: boolean;
}

export class UserService {
  /**
   * Resolves an authenticated application user strictly from PostgreSQL using their verified Firebase UID.
   *
   * Enforces:
   * 1. User must exist in PostgreSQL.
   * 2. User status must be ACTIVE (soft-deleted / inactive accounts are rejected).
   * 3. Roles are retrieved from the database `user_roles` join table, NEVER trusted from client.
   * 4. Department and reporting hierarchies are resolved authoritatively.
   */
  static async resolveByFirebaseUid(firebaseUid: string): Promise<AuthenticatedUser | null> {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: firebaseUid },
      include: {
        roles: true,
        department: true,
        manager: {
          select: {
            id: true,
            display_name: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Reject INACTIVE users at the database resolution level
    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }

    const roles = user.roles.map((r) => r.role);

    return {
      id: user.id,
      firebase_uid: user.firebase_uid,
      email: user.email,
      display_name: user.display_name,
      department_id: user.department_id,
      department_name: user.department?.name ?? null,
      department_hod_user_id: user.department?.hod_user_id ?? null,
      manager_id: user.manager_id,
      manager_name: user.manager?.display_name ?? null,
      status: user.status,
      roles,
      isEmployee: roles.includes(AppRole.EMPLOYEE),
      isManager: roles.includes(AppRole.MANAGER),
      isHOD: roles.includes(AppRole.HOD),
    };
  }

  /**
   * Resolves an authenticated user by PostgreSQL user ID.
   */
  static async resolveById(id: string): Promise<AuthenticatedUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        department: true,
        manager: {
          select: {
            id: true,
            display_name: true,
            email: true,
          },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return null;
    }

    const roles = user.roles.map((r) => r.role);

    return {
      id: user.id,
      firebase_uid: user.firebase_uid,
      email: user.email,
      display_name: user.display_name,
      department_id: user.department_id,
      department_name: user.department?.name ?? null,
      department_hod_user_id: user.department?.hod_user_id ?? null,
      manager_id: user.manager_id,
      manager_name: user.manager?.display_name ?? null,
      status: user.status,
      roles,
      isEmployee: roles.includes(AppRole.EMPLOYEE),
      isManager: roles.includes(AppRole.MANAGER),
      isHOD: roles.includes(AppRole.HOD),
    };
  }

  /**
   * Finds direct reports assigned to a given manager (used for DR-01 scope enforcement).
   */
  static async getDirectReports(managerId: string) {
    return prisma.user.findMany({
      where: {
        manager_id: managerId,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        display_name: true,
        email: true,
        department_id: true,
      },
    });
  }
}

import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { AppRole, UserStatus } from "@prisma/client";

export interface SeedResult {
  success: boolean;
  message: string;
  accounts: {
    role: string;
    email: string;
    displayName: string;
    firebaseUid: string;
    dbId: string;
  }[];
}

/**
 * Creates or updates a user in Firebase Auth via Admin SDK.
 * Idempotent: If user exists, synchronizes password and returns existing UID.
 */
async function ensureFirebaseUser(email: string, password: string, displayName: string): Promise<string> {
  try {
    const existing = await adminAuth.getUserByEmail(email);
    // Update password to ensure configured credentials match
    await adminAuth.updateUser(existing.uid, {
      password,
      displayName,
    });
    return existing.uid;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "auth/user-not-found") {
      const created = await adminAuth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
      });
      return created.uid;
    }
    throw error;
  }
}

/**
 * Repeatable demo accounts and organization seeding utility.
 * Provisions Employee, Manager, and HOD in Firebase Auth and links them to PostgreSQL.
 */
export async function seedDemoAccounts(): Promise<SeedResult> {
  const employeeEmail = process.env.DEMO_EMPLOYEE_EMAIL || "employee@leaveflow.internal";
  const employeePassword = process.env.DEMO_EMPLOYEE_PASSWORD || "EmployeePass123!";

  const managerEmail = process.env.DEMO_MANAGER_EMAIL || "manager@leaveflow.internal";
  const managerPassword = process.env.DEMO_MANAGER_PASSWORD || "ManagerPass123!";

  const hodEmail = process.env.DEMO_HOD_EMAIL || "hod@leaveflow.internal";
  const hodPassword = process.env.DEMO_HOD_PASSWORD || "HodPass123!";

  // 1. Provision Firebase identities
  const hodUid = await ensureFirebaseUser(hodEmail, hodPassword, "Alex Rivera (HOD)");
  const managerUid = await ensureFirebaseUser(managerEmail, managerPassword, "Sarah Chen (Manager)");
  const employeeUid = await ensureFirebaseUser(employeeEmail, employeePassword, "David Kim (Employee)");

  // 2. Resolve circular FK between Department and HOD in PostgreSQL
  // Pass 1: Upsert Department
  const department = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: {
      name: "Engineering",
    },
  });

  // Pass 2: Upsert HOD User
  const hodUser = await prisma.user.upsert({
    where: { firebase_uid: hodUid },
    update: {
      email: hodEmail,
      display_name: "Alex Rivera (HOD)",
      department_id: department.id,
      status: UserStatus.ACTIVE,
    },
    create: {
      firebase_uid: hodUid,
      email: hodEmail,
      display_name: "Alex Rivera (HOD)",
      department_id: department.id,
      status: UserStatus.ACTIVE,
    },
  });

  // Pass 3: Link department HOD
  await prisma.department.update({
    where: { id: department.id },
    data: { hod_user_id: hodUser.id },
  });

  // Pass 4: Upsert Manager (DR-10: manager reports to HOD)
  const managerUser = await prisma.user.upsert({
    where: { firebase_uid: managerUid },
    update: {
      email: managerEmail,
      display_name: "Sarah Chen (Manager)",
      department_id: department.id,
      manager_id: hodUser.id,
      status: UserStatus.ACTIVE,
    },
    create: {
      firebase_uid: managerUid,
      email: managerEmail,
      display_name: "Sarah Chen (Manager)",
      department_id: department.id,
      manager_id: hodUser.id,
      status: UserStatus.ACTIVE,
    },
  });

  // Pass 5: Upsert Employee (reports to Manager)
  const employeeUser = await prisma.user.upsert({
    where: { firebase_uid: employeeUid },
    update: {
      email: employeeEmail,
      display_name: "David Kim (Employee)",
      department_id: department.id,
      manager_id: managerUser.id,
      status: UserStatus.ACTIVE,
    },
    create: {
      firebase_uid: employeeUid,
      email: employeeEmail,
      display_name: "David Kim (Employee)",
      department_id: department.id,
      manager_id: managerUser.id,
      status: UserStatus.ACTIVE,
    },
  });

  // Pass 6: Assign multi-roles in user_roles join table
  // HOD holds: EMPLOYEE and HOD
  await prisma.userRole.upsert({
    where: { user_id_role: { user_id: hodUser.id, role: AppRole.EMPLOYEE } },
    update: {},
    create: { user_id: hodUser.id, role: AppRole.EMPLOYEE },
  });
  await prisma.userRole.upsert({
    where: { user_id_role: { user_id: hodUser.id, role: AppRole.HOD } },
    update: {},
    create: { user_id: hodUser.id, role: AppRole.HOD },
  });

  // Manager holds: EMPLOYEE and MANAGER
  await prisma.userRole.upsert({
    where: { user_id_role: { user_id: managerUser.id, role: AppRole.EMPLOYEE } },
    update: {},
    create: { user_id: managerUser.id, role: AppRole.EMPLOYEE },
  });
  await prisma.userRole.upsert({
    where: { user_id_role: { user_id: managerUser.id, role: AppRole.MANAGER } },
    update: {},
    create: { user_id: managerUser.id, role: AppRole.MANAGER },
  });

  // Employee holds: EMPLOYEE
  await prisma.userRole.upsert({
    where: { user_id_role: { user_id: employeeUser.id, role: AppRole.EMPLOYEE } },
    update: {},
    create: { user_id: employeeUser.id, role: AppRole.EMPLOYEE },
  });

  // Pass 7: Provision core leave types
  const defaultLeaveTypes = [
    { name: "Casual Leave", default_annual_allocation: 12, requires_document: false },
    { name: "Sick Leave", default_annual_allocation: 10, requires_document: true },
    { name: "Earned Leave", default_annual_allocation: 15, requires_document: false },
    { name: "Unpaid Leave", default_annual_allocation: null, requires_document: true },
  ];

  for (const lt of defaultLeaveTypes) {
    await prisma.leaveTypeConfig.upsert({
      where: { name: lt.name },
      update: {},
      create: {
        name: lt.name,
        default_annual_allocation: lt.default_annual_allocation,
        requires_document: lt.requires_document,
      },
    });
  }

  return {
    success: true,
    message: "Demo accounts and organization data successfully provisioned and linked.",
    accounts: [
      {
        role: "EMPLOYEE",
        email: employeeEmail,
        displayName: "David Kim (Employee)",
        firebaseUid: employeeUid,
        dbId: employeeUser.id,
      },
      {
        role: "MANAGER",
        email: managerEmail,
        displayName: "Sarah Chen (Manager)",
        firebaseUid: managerUid,
        dbId: managerUser.id,
      },
      {
        role: "HOD",
        email: hodEmail,
        displayName: "Alex Rivera (HOD)",
        firebaseUid: hodUid,
        dbId: hodUser.id,
      },
    ],
  };
}

import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { LeaveService } from "@/modules/leave/leave.service";
import { prisma } from "@/lib/prisma";
import { EmployeeLeaveClient } from "@/components/dashboard/employee-leave-client";

export default async function EmployeeDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/employee");
  }

  if (!user.isEmployee) {
    redirect("/unauthorized");
  }

  // Authoritatively load user's existing leave requests
  let requests: any[] = [];
  try {
    requests = await LeaveService.getEmployeeRequests(user);
  } catch {
    // If DB empty or initial
  }

  // Load configured active leave types
  let leaveTypes: any[] = [];
  try {
    leaveTypes = await prisma.leaveTypeConfig.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });
  } catch {
    // Empty
  }

  // Serialize Prisma objects safely for client component
  const serializedRequests = JSON.parse(JSON.stringify(requests));
  const serializedLeaveTypes = JSON.parse(JSON.stringify(leaveTypes));

  return (
    <EmployeeLeaveClient
      initialRequests={serializedRequests}
      leaveTypes={serializedLeaveTypes}
      userDisplayName={user.display_name}
      managerName={user.manager_name}
    />
  );
}

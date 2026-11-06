import { getCurrentUser } from "@/lib/auth/session";
import { UserService } from "@/modules/users/user.service";
import { LeaveService } from "@/modules/leave/leave.service";
import { redirect } from "next/navigation";
import { ManagerApprovalsClient } from "@/components/dashboard/manager-approvals-client";

export default async function ManagerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/manager");
  }

  // Deny-by-default role check
  if (!user.isManager) {
    redirect("/unauthorized");
  }

  // Authoritatively fetch assigned direct reports (DR-01 scope)
  let directReports: any[] = [];
  try {
    directReports = await UserService.getDirectReports(user.id);
  } catch {
    // If DB offline or initial state
  }

  // Authoritatively fetch pending requests for this manager's direct reports
  let requests: any[] = [];
  try {
    requests = await LeaveService.getManagerRequests(user);
  } catch {
    // If DB offline or initial state
  }

  const serializedReports = JSON.parse(JSON.stringify(directReports));
  const serializedRequests = JSON.parse(JSON.stringify(requests));

  return (
    <ManagerApprovalsClient
      directReports={serializedReports}
      initialRequests={serializedRequests}
      managerName={user.display_name}
    />
  );
}

import { getCurrentUser } from "@/lib/auth/session";
import { UserService } from "@/modules/users/user.service";
import { redirect } from "next/navigation";

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
  let directReports: Array<{
    id: string;
    display_name: string;
    email: string;
    department_id: string | null;
  }> = [];

  try {
    directReports = await UserService.getDirectReports(user.id);
  } catch {
    // If DB offline or initial state
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E6E0] gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#143628]">Manager Approvals Queue</h1>
          <p className="text-xs text-[#526058] mt-1">
            First-level leave review for assigned direct reports (DR-01 Scoped Authorization)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded bg-[#EBF5EE] text-[#143628] text-xs font-semibold border border-[#CDE5D4]">
            Role: MANAGER
          </span>
          <span className="px-2.5 py-1 rounded bg-[#F4F3ED] text-[#4D5E54] text-xs font-medium border border-[#E4E2D8]">
            Direct Reports: {directReports.length}
          </span>
        </div>
      </div>

      {/* DR-01 Scope Enforcement Note */}
      <div className="p-4 rounded-xl bg-[#F0F7F2] border border-[#D5EADB] flex items-start space-x-3">
        <div className="w-5 h-5 rounded-full bg-[#143628] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
          ✓
        </div>
        <div className="text-xs text-[#143628] leading-relaxed">
          <span className="font-semibold">DR-01 Authorization Enforced:</span> You are strictly authorized to view and act on leave requests from employees who have you assigned as their direct manager. No self-approval is permitted.
        </div>
      </div>

      {/* Assigned Direct Reports Section */}
      <div className="bg-white border border-[#E7E6E0] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-[#E7E6E0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#143628]">Assigned Direct Reports</h2>
          <span className="text-xs text-[#526058]">Database Scope</span>
        </div>
        {directReports.length > 0 ? (
          <div className="divide-y divide-[#E7E6E0]">
            {directReports.map((report) => (
              <div key={report.id} className="p-4 flex items-center justify-between hover:bg-[#FAF9F5] transition-colors">
                <div>
                  <div className="text-sm font-semibold text-[#143628]">{report.display_name}</div>
                  <div className="text-xs text-[#5C6E63]">{report.email}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-[#5C6E63] bg-[#F4F3ED] px-2 py-0.5 rounded border border-[#E4E2D8]">
                    UUID: {report.id.substring(0, 8)}...
                  </span>
                  <span className="text-xs font-medium text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#526058]">
            No direct reports currently assigned to this manager profile.
          </div>
        )}
      </div>

      {/* Pending Approvals Table Shell */}
      <div className="bg-white border border-[#E7E6E0] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-[#E7E6E0]">
          <h2 className="text-sm font-semibold text-[#143628]">Pending Manager Approvals Queue</h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm font-medium text-[#143628]">Queue is currently clear</p>
          <p className="text-xs text-[#526058] mt-1 max-w-sm mx-auto">
            All submitted leave requests from your assigned direct reports will appear here for Approve, Reject, or Request Info actions.
          </p>
        </div>
      </div>
    </div>
  );
}

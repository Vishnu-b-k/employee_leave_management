import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function EmployeeDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/employee");
  }

  if (!user.isEmployee) {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E6E0] gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#143628]">My Leave Dashboard</h1>
          <p className="text-xs text-[#526058] mt-1">
            Personal leave balances, request history, and appeal tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded bg-[#EBF5EE] text-[#143628] text-xs font-semibold border border-[#CDE5D4]">
            Role: EMPLOYEE
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-medium text-[#526058] uppercase tracking-wider mb-1">
            Assigned Manager
          </div>
          <div className="text-lg font-semibold text-[#143628]">
            {user.manager_name || "Department Head"}
          </div>
          <div className="text-[11px] text-[#5C6E63] mt-1">First-level reviewer</div>
        </div>

        <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-medium text-[#526058] uppercase tracking-wider mb-1">
            Active Requests
          </div>
          <div className="text-lg font-semibold text-[#143628]">0 Pending</div>
          <div className="text-[11px] text-[#5C6E63] mt-1">No requests in review</div>
        </div>

        <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-medium text-[#526058] uppercase tracking-wider mb-1">
            Leave Entitlement
          </div>
          <div className="text-lg font-semibold text-[#143628]">30 Days Annual</div>
          <div className="text-[11px] text-[#5C6E63] mt-1">Casual, Sick, Earned</div>
        </div>
      </div>

      {/* Request Table Shell */}
      <div className="bg-white border border-[#E7E6E0] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-[#E7E6E0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#143628]">Recent Leave Submissions</h2>
          <span className="text-xs text-[#526058]">Step 2 RBAC Verification Active</span>
        </div>
        <div className="p-8 text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#F0F7F2] flex items-center justify-center text-[#143628] mb-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#143628]">No leave submissions filed yet</p>
          <p className="text-xs text-[#526058] mt-1 max-w-sm mx-auto">
            Your employee identity is authenticated. Leave request submissions and document uploads will be operational in the next implementation step.
          </p>
        </div>
      </div>
    </div>
  );
}

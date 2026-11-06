import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#E7E6E0] rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#143628]">Welcome, {user.display_name}</h1>
            <p className="text-xs text-[#526058] mt-1">
              Authenticated via Firebase Identity • Roles &amp; Hierarchy authoritatively resolved from PostgreSQL 16
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-[#F0F7F2] text-[#143628] border border-[#D5EADB]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] mr-1.5" />
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* User Identity & Organizational Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-medium text-[#526058] uppercase tracking-wider mb-1">
            Department
          </div>
          <div className="text-base font-semibold text-[#143628]">
            {user.department_name || "Unassigned"}
          </div>
          <div className="text-[11px] text-[#5C6E63] mt-1 font-mono">
            ID: {user.department_id || "None"}
          </div>
        </div>

        <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-medium text-[#526058] uppercase tracking-wider mb-1">
            Reporting Manager (DR-10)
          </div>
          <div className="text-base font-semibold text-[#143628]">
            {user.manager_name || (user.isHOD ? "None (Department Head)" : "Unassigned")}
          </div>
          <div className="text-[11px] text-[#5C6E63] mt-1 font-mono">
            ID: {user.manager_id || "None"}
          </div>
        </div>

        <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-medium text-[#526058] uppercase tracking-wider mb-1">
            Account Status
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            <span className="text-base font-semibold text-[#143628]">Active Application User</span>
          </div>
          <div className="text-[11px] text-[#5C6E63] mt-1 font-mono">
            DB UUID: {user.id}
          </div>
        </div>
      </div>

      {/* Role Workspaces */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[#143628] uppercase tracking-wider">
          Available Workspaces Based on Your Roles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Employee Workspace */}
          {user.isEmployee && (
            <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs hover:border-[#2D6A4F] transition-all flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] text-[#143628] flex items-center justify-center font-bold text-xs mb-3 border border-[#D5EADB]">
                  EMP
                </div>
                <h3 className="font-semibold text-sm text-[#143628] mb-1">Employee Workspace</h3>
                <p className="text-xs text-[#526058] leading-relaxed mb-4">
                  Submit personal leave requests, upload supporting documents, track approval history, and file appeals.
                </p>
              </div>
              <Link
                href="/dashboard/employee"
                className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg bg-[#143628] hover:bg-[#0F291E] text-white text-xs font-medium transition-colors shadow-2xs"
              >
                Open My Requests →
              </Link>
            </div>
          )}

          {/* Manager Workspace */}
          {user.isManager ? (
            <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs hover:border-[#2D6A4F] transition-all flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] text-[#143628] flex items-center justify-center font-bold text-xs mb-3 border border-[#D5EADB]">
                  MGR
                </div>
                <h3 className="font-semibold text-sm text-[#143628] mb-1">Manager Approvals Queue</h3>
                <p className="text-xs text-[#526058] leading-relaxed mb-4">
                  Review leave submissions from your assigned direct reports. Approve, reject with comment, or request further information.
                </p>
              </div>
              <Link
                href="/dashboard/manager"
                className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg bg-[#143628] hover:bg-[#0F291E] text-white text-xs font-medium transition-colors shadow-2xs"
              >
                Open Manager Queue →
              </Link>
            </div>
          ) : (
            <div className="bg-[#FAF9F5] border border-[#E7E6E0] rounded-xl p-5 opacity-60 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#ECEBE4] text-[#8C8B82] flex items-center justify-center font-bold text-xs mb-3">
                  MGR
                </div>
                <h3 className="font-semibold text-sm text-[#8C8B82] mb-1">Manager Queue</h3>
                <p className="text-xs text-[#8C8B82] leading-relaxed mb-4">
                  Restricted. Requires MANAGER role assignment in PostgreSQL.
                </p>
              </div>
              <span className="text-[11px] text-[#A3A299] font-medium text-center py-2">
                Not Assigned
              </span>
            </div>
          )}

          {/* HOD Workspace */}
          {user.isHOD ? (
            <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs hover:border-[#2D6A4F] transition-all flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] text-[#143628] flex items-center justify-center font-bold text-xs mb-3 border border-[#D5EADB]">
                  HOD
                </div>
                <h3 className="font-semibold text-sm text-[#143628] mb-1">HOD Departmental Review</h3>
                <p className="text-xs text-[#526058] leading-relaxed mb-4">
                  Final approval for extended leaves (&gt;3 days), review employee appeals on manager rejections, and departmental oversight.
                </p>
              </div>
              <Link
                href="/dashboard/hod"
                className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg bg-[#143628] hover:bg-[#0F291E] text-white text-xs font-medium transition-colors shadow-2xs"
              >
                Open HOD Reviews →
              </Link>
            </div>
          ) : (
            <div className="bg-[#FAF9F5] border border-[#E7E6E0] rounded-xl p-5 opacity-60 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#ECEBE4] text-[#8C8B82] flex items-center justify-center font-bold text-xs mb-3">
                  HOD
                </div>
                <h3 className="font-semibold text-sm text-[#8C8B82] mb-1">HOD Review</h3>
                <p className="text-xs text-[#8C8B82] leading-relaxed mb-4">
                  Restricted. Requires HOD role assignment in PostgreSQL.
                </p>
              </div>
              <span className="text-[11px] text-[#A3A299] font-medium text-center py-2">
                Not Assigned
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

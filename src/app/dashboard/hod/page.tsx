import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function HodDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/hod");
  }

  // Deny-by-default role check
  if (!user.isHOD) {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E6E0] gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#143628]">HOD Departmental Review</h1>
          <p className="text-xs text-[#526058] mt-1">
            Second-level approvals for long leave (&gt;3 days) and formal employee appeals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded bg-[#EBF5EE] text-[#143628] text-xs font-semibold border border-[#CDE5D4]">
            Role: HOD
          </span>
          <span className="px-2.5 py-1 rounded bg-[#F4F3ED] text-[#4D5E54] text-xs font-medium border border-[#E4E2D8]">
            Department: {user.department_name || "Assigned"}
          </span>
        </div>
      </div>

      {/* HOD Authority & Responsibilities Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#F0F7F2] border border-[#D5EADB]">
          <h3 className="text-xs font-bold text-[#143628] uppercase tracking-wider mb-1">
            Stage 2: Long Leave Approvals
          </h3>
          <p className="text-xs text-[#355242] leading-relaxed">
            Requests exceeding 3 consecutive working days require verified document attachments and prior manager approval before reaching HOD for final sign-off.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#F0F7F2] border border-[#D5EADB]">
          <h3 className="text-xs font-bold text-[#143628] uppercase tracking-wider mb-1">
            Stage 3: Employee Appeals Review (DR-03)
          </h3>
          <p className="text-xs text-[#355242] leading-relaxed">
            When an employee appeals a manager rejection, HOD reviews the appeal justification and may uphold the rejection or overturn it with an approved-on-appeal determination.
          </p>
        </div>
      </div>

      {/* Review Queues Shell */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-[#E7E6E0] rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-[#E7E6E0] bg-[#FAF9F5]">
            <h2 className="text-xs font-bold text-[#143628] uppercase tracking-wider">
              Pending 2nd-Level Approvals (0)
            </h2>
          </div>
          <div className="p-6 text-center text-xs text-[#526058]">
            No extended leave requests pending HOD approval.
          </div>
        </div>

        <div className="bg-white border border-[#E7E6E0] rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-[#E7E6E0] bg-[#FAF9F5]">
            <h2 className="text-xs font-bold text-[#143628] uppercase tracking-wider">
              Pending Employee Appeals (0)
            </h2>
          </div>
          <div className="p-6 text-center text-xs text-[#526058]">
            No unresolved employee appeals in queue.
          </div>
        </div>
      </div>
    </div>
  );
}

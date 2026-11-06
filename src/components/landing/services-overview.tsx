import React from "react";
import { 
  FileTextIcon, 
  CalendarIcon, 
  UserCheckIcon, 
  BuildingIcon, 
  ScaleIcon, 
  CheckCircleIcon,
  ClockIcon
} from "./icons";

export function ServicesOverview() {
  return (
    <section id="services" className="py-16 md:py-24 border-b border-[#E3E2DA] bg-[#F5F4EE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EAE8DD] border border-[#D5D3C5] text-xs font-semibold text-[#1B3E2D] mb-3">
            <FileTextIcon className="w-3.5 h-3.5" />
            <span>STATUTORY PROVISIONS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#143628] font-serif">
            Leave Entitlements &amp; Departmental Services
          </h2>
          <p className="mt-3 text-base text-[#4D5E54] leading-relaxed">
            All absence categories are governed by the organization&apos;s verified service regulations and national statutory standards. 
            Balances are maintained in real-time with automatic fiscal carry-forward reconciliation.
          </p>
        </div>

        {/* 3 Main Workflow & Responsibility Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Column 1: Employee Self-Service */}
          <div className="bg-white border border-[#D5D3C7] rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#EBF5EE] border border-[#CFE7D6] flex items-center justify-center text-[#143628] mb-5">
                <UserCheckIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-[#143628] mb-2 font-serif">
                Employee Self-Service (ESS)
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed mb-4">
                Full transparency over personal absence quotas, submitted applications, and verifiable approval progress.
              </p>

              <ul className="space-y-2.5 text-xs text-[#425447]">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Submit short (&le;3d) or long (&gt;3d) absence applications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Attach verified medical certificates with SHA-256 integrity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Edit or cancel requests while in PENDING_MANAGER status.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Respond directly to Manager info requests without re-filing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>File formal appeals to HOD against any Manager rejection (DR-03).</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EAE9E1] text-[11px] font-mono text-[#526359]">
              Role Code: APP_ROLE_EMPLOYEE
            </div>
          </div>

          {/* Column 2: Reporting Manager Queue */}
          <div className="bg-white border border-[#D5D3C7] rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#EBF5EE] border border-[#CFE7D6] flex items-center justify-center text-[#143628] mb-5">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-[#143628] mb-2 font-serif">
                Reporting Manager Queue
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed mb-4">
                Operational review for direct reports. Managers submit their own leaves as employees, routing to HOD (DR-10).
              </p>

              <ul className="space-y-2.5 text-xs text-[#425447]">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Final authorization for short leaves (&le; 3 working days).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Initial endorsement for long leaves (&gt; 3d), routing to PENDING_HOD.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Mandatory justification required on any rejection action.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Request clarification (INFO_REQUESTED) with inline commentary.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Strict access boundary: View assigned direct reports only (DR-01).</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EAE9E1] text-[11px] font-mono text-[#526359]">
              Role Code: APP_ROLE_MANAGER
            </div>
          </div>

          {/* Column 3: HOD Directorate */}
          <div className="bg-white border border-[#D5D3C7] rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#EBF5EE] border border-[#CFE7D6] flex items-center justify-center text-[#143628] mb-5">
                <BuildingIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-[#143628] mb-2 font-serif">
                HOD Directorate &amp; Appeals
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed mb-4">
                Departmental executive authority. Oversees extended absences, workforce coverage, and appellate tribunals.
              </p>

              <ul className="space-y-2.5 text-xs text-[#425447]">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Second-tier approval for leaves exceeding 3 working days.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Adjudicate employee appeals against Manager rejections (DR-03).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Overturn rejection to APPROVED_ON_APPEAL or uphold as APPEAL_REJECTED.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>Department-wide absence heatmaps and shift continuity oversight.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span>First-line approval for direct Manager leave applications.</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EAE9E1] text-[11px] font-mono text-[#526359]">
              Role Code: APP_ROLE_HOD
            </div>
          </div>
        </div>

        {/* Turnaround Service Level Commitments (SLAs) */}
        <div id="policy" className="bg-[#FAF9F5] border border-[#DDDCD2] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E6DC] gap-4 mb-4">
            <div>
              <h4 className="text-sm font-bold text-[#143628]">Official Service Level Commitments (SLAs)</h4>
              <p className="text-xs text-[#55695E]">Standard operational response timelines across all operating units</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-[#EBF5EE] text-[#143628] border border-[#CFE7D6]">
              POLICY COMPLIANT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-white rounded-lg border border-[#E1DFD4]">
              <span className="text-[10px] uppercase font-bold text-[#7A8E82] block mb-1">Manager SLA</span>
              <div className="text-base font-bold text-[#143628] font-mono">&le; 48 Hours</div>
              <p className="text-[#55695E] text-[11px] mt-1">Short leave decision or escalation to HOD</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E1DFD4]">
              <span className="text-[10px] uppercase font-bold text-[#7A8E82] block mb-1">HOD Tier 2 SLA</span>
              <div className="text-base font-bold text-[#143628] font-mono">&le; 72 Hours</div>
              <p className="text-[#55695E] text-[11px] mt-1">Second-level authorization for long leaves</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E1DFD4]">
              <span className="text-[10px] uppercase font-bold text-[#7A8E82] block mb-1">Appeals Tribunal SLA</span>
              <div className="text-base font-bold text-[#143628] font-mono">&le; 5 Business Days</div>
              <p className="text-[#55695E] text-[11px] mt-1">Full documentary review and final resolution</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

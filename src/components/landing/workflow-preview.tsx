"use client";

import React, { useState } from "react";
import { 
  FileTextIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  AlertCircleIcon, 
  UploadIcon, 
  EyeIcon, 
  UserCheckIcon, 
  UsersIcon, 
  BuildingIcon,
  ScaleIcon,
  ShieldIcon
} from "./icons";

type TabRole = "employee" | "manager" | "hod";

export function WorkflowPreview() {
  const [activeTab, setActiveTab] = useState<TabRole>("employee");

  return (
    <section id="workflows" className="py-16 md:py-24 border-b border-[#E3E2DA] bg-[#F5F4EE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EAE8DD] border border-[#D5D3C5] text-xs font-semibold text-[#1B3E2D] mb-3">
            <ShieldIcon className="w-3.5 h-3.5" />
            <span>ROLE-GOVERNED INTERFACES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#143628] font-serif">
            Designed for Real Operational Workflows
          </h2>
          <p className="mt-3 text-base text-[#4D5E54] leading-relaxed">
            Every user experiences an interface tailored to their verified organizational responsibilities. 
            No role-switching, no simulated permissions — permissions are strictly enforced at the database layer.
          </p>
        </div>

        {/* Tab Selectors styled like an enterprise system toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-[#DDDCD2] pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("employee")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
              activeTab === "employee"
                ? "bg-[#143628] text-white shadow-sm"
                : "bg-white text-[#4A5D52] hover:bg-[#EAE8DD] border border-[#DDDCD2]"
            }`}
          >
            <UserCheckIcon className="w-4 h-4" />
            <span>1. Employee Self-Service</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manager")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
              activeTab === "manager"
                ? "bg-[#143628] text-white shadow-sm"
                : "bg-white text-[#4A5D52] hover:bg-[#EAE8DD] border border-[#DDDCD2]"
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            <span>2. Reporting Manager Queue</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hod")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
              activeTab === "hod"
                ? "bg-[#143628] text-white shadow-sm"
                : "bg-white text-[#4A5D52] hover:bg-[#EAE8DD] border border-[#DDDCD2]"
            }`}
          >
            <BuildingIcon className="w-4 h-4" />
            <span>3. HOD Directorate &amp; Appeals</span>
          </button>
        </div>

        {/* Interactive Preview Container */}
        <div className="bg-[#FFFFFF] border border-[#D5D3C7] rounded-xl shadow-sm overflow-hidden">
          {/* Mock Window Title Bar */}
          <div className="bg-[#EFEFE9] px-5 py-3 border-b border-[#DDDCD2] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#E57373] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#FFB74D] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#81C784] inline-block" />
              <span className="ml-3 text-xs font-mono font-medium text-[#54655A]">
                leaveflow.internal / portal / {activeTab === "employee" ? "my-requests" : activeTab === "manager" ? "team-approvals" : "department-oversight"}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[#54655A]">
              <span className="font-mono text-[11px] bg-[#E2E1D8] px-2 py-0.5 rounded text-[#2E4035]">
                SESSION: VERIFIED POSTGRESQL ROLE
              </span>
            </div>
          </div>

          {/* TAB 1: EMPLOYEE SELF SERVICE */}
          {activeTab === "employee" && (
            <div className="p-6 md:p-8 space-y-8 bg-[#FAF9F5]">
              {/* Balance Summary Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-[#E1DFD4] p-4 rounded-lg">
                  <div className="flex items-center justify-between text-xs text-[#5C6E63] mb-1">
                    <span>Paid Annual Leave (PL)</span>
                    <span className="font-mono font-semibold text-[#143628]">18 / 24 Days</span>
                  </div>
                  <div className="w-full bg-[#E8E6DB] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#143628] h-full rounded-full" style={{ width: "75%" }} />
                  </div>
                  <span className="text-[10px] text-[#7A8E82] mt-1.5 block">6 days utilized in FY 2026/27</span>
                </div>

                <div className="bg-white border border-[#E1DFD4] p-4 rounded-lg">
                  <div className="flex items-center justify-between text-xs text-[#5C6E63] mb-1">
                    <span>Sick &amp; Medical Leave (SL)</span>
                    <span className="font-mono font-semibold text-[#143628]">10 / 12 Days</span>
                  </div>
                  <div className="w-full bg-[#E8E6DB] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#2D6A4F] h-full rounded-full" style={{ width: "83%" }} />
                  </div>
                  <span className="text-[10px] text-[#7A8E82] mt-1.5 block">&gt;3 consecutive days requires medical certificate</span>
                </div>

                <div className="bg-white border border-[#E1DFD4] p-4 rounded-lg">
                  <div className="flex items-center justify-between text-xs text-[#5C6E63] mb-1">
                    <span>Casual Leave (CL)</span>
                    <span className="font-mono font-semibold text-[#143628]">5 / 8 Days</span>
                  </div>
                  <div className="w-full bg-[#E8E6DB] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#52B788] h-full rounded-full" style={{ width: "62%" }} />
                  </div>
                  <span className="text-[10px] text-[#7A8E82] mt-1.5 block">Max 2 days consecutive per instance</span>
                </div>
              </div>

              {/* Main Application Interface: Left side Form, Right side Active Tracking */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Simulated Form (Col 6) */}
                <div className="lg:col-span-6 bg-white border border-[#DDDCD1] rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAE9E1]">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="w-4 h-4 text-[#143628]" />
                      <h4 className="text-sm font-bold text-[#143628]">New Absence Application</h4>
                    </div>
                    <span className="text-[11px] font-mono text-[#5C6E63]">REQ-FORM-2026</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-[#293B30] mb-1">Leave Classification</label>
                      <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#DDDCD2] text-[#143628] font-medium flex justify-between items-center">
                        <span>Medical Leave (SL) — Inpatient / Rest</span>
                        <span className="text-[10px] bg-[#EBF5EE] text-[#143628] px-1.5 py-0.5 rounded font-bold">SL-02</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#293B30] mb-1">Commencement Date</label>
                        <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#DDDCD2] font-mono text-[#143628]">
                          10 Nov 2026 (Mon)
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-[#293B30] mb-1">Conclusion Date</label>
                        <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#DDDCD2] font-mono text-[#143628]">
                          14 Nov 2026 (Fri)
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#F4F3EB] border border-[#DCDAD0] flex items-center justify-between text-[11px]">
                      <span className="text-[#4E5E54]">Calculated Working Days (Excl. Public Holidays):</span>
                      <span className="font-mono font-bold text-[#143628]">5 Working Days (&gt; 3d Rule Triggered)</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#293B30] mb-1">
                        Supporting Medical Certificate (Mandatory for &gt; 3 Days)
                      </label>
                      <div className="border border-dashed border-[#B5C9BC] bg-[#F7FAF8] rounded p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <UploadIcon className="w-4 h-4 text-[#2D6A4F]" />
                          <span className="text-xs font-mono text-[#143628]">hospital_discharge_summary.pdf</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#2D6A4F] bg-[#E0EFE6] px-2 py-0.5 rounded">
                          MinIO SHA-256 OK
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#293B30] mb-1">Reason &amp; Handover Notes</label>
                      <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#DDDCD2] text-[#4E5E54] text-xs">
                        Scheduled orthopaedic procedure. Urgent code review tickets delegated to Senior Engineer P. Nair.
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[#708477]">Saves draft with optimistic lock</span>
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-[#143628] text-white text-xs font-semibold hover:bg-[#0E271D]"
                    >
                      Submit for Manager Review
                    </button>
                  </div>
                </div>

                {/* Simulated Real Request Tracker (Col 6) */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="bg-white border border-[#DDDCD1] rounded-lg p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EAE9E1] mb-3">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-[#2D6A4F]" />
                        <h4 className="text-sm font-bold text-[#143628]">Active Request Life Cycle</h4>
                      </div>
                      <span className="text-[11px] font-mono bg-[#EBF5EE] text-[#143628] px-2 py-0.5 rounded font-bold">
                        REQ-9042
                      </span>
                    </div>

                    {/* Step Tracker with real state names */}
                    <div className="space-y-4 text-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#143628] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircleIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-[#143628]">
                            <span>Submitted by Employee</span>
                            <span className="text-[10px] text-[#7A8E82] font-mono">03 Nov 09:15</span>
                          </div>
                          <p className="text-[#55695E] text-[11px]">Request initialized in state: PENDING_MANAGER</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#143628] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircleIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-[#143628]">
                            <span>Manager Endorsement</span>
                            <span className="text-[10px] text-[#7A8E82] font-mono">03 Nov 14:30</span>
                          </div>
                          <p className="text-[#55695E] text-[11px]">
                            Manager approved &gt; 3 days. Transitioned state to: <strong className="text-[#143628]">PENDING_HOD</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#D5EADB] text-[#143628] flex items-center justify-center shrink-0 mt-0.5 border border-[#2D6A4F]">
                          <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-[#143628]">
                            <span>HOD Second-Level Review</span>
                            <span className="text-[10px] font-mono text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.2 rounded">Awaiting Action</span>
                          </div>
                          <p className="text-[#55695E] text-[11px]">
                            Awaiting Department Head final authorization. Expected SLA: &le; 48 hours.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EAE9E1] text-[11px] text-[#55695E] flex items-center justify-between">
                      <span>Immutable Audit Hash: <code className="font-mono text-[#143628]">sha256:7f4c9a...</code></span>
                      <span className="text-[#2D6A4F] font-semibold">Row Lock Version: 2</span>
                    </div>
                  </div>

                  {/* Employee Rights Notice */}
                  <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DDDCD2] text-xs space-y-1.5">
                    <span className="font-bold text-[#143628]">Employee Statutory Rights (DR-03 &amp; DR-04):</span>
                    <p className="text-[#55695E] leading-relaxed">
                      If a request is rejected by your Manager, you may appeal directly to your Head of Department within 7 days. 
                      You may also cancel or modify requests while they remain in PENDING_MANAGER status.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGER DIRECT REPORTS QUEUE */}
          {activeTab === "manager" && (
            <div className="p-6 md:p-8 space-y-6 bg-[#FAF9F5]">
              {/* Manager Overview Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DDDCD2] gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#143628]">Direct Reports Leave Review Queue</h3>
                  <p className="text-xs text-[#526359]">
                    Strictly isolated to employees reporting to you (DR-01). Self-approval is strictly barred (DR-10).
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono bg-[#EBF5EE] text-[#143628] px-2.5 py-1 rounded font-bold border border-[#D5EADB]">
                    3 Pending Approvals
                  </span>
                </div>
              </div>

              {/* Pending Queue Table */}
              <div className="bg-white border border-[#DDDCD1] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F0EFE9] text-[#2F4236] font-semibold border-b border-[#DDDCD1]">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Leave Type</th>
                      <th className="p-3">Period &amp; Duration</th>
                      <th className="p-3">Workflow Rule</th>
                      <th className="p-3">Document</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE9E1] text-[#3E5145]">
                    <tr className="bg-[#FAF9F5]">
                      <td className="p-3">
                        <div className="font-semibold text-[#143628]">Kavita Raman</div>
                        <span className="text-[10px] text-[#718478] font-mono">EMP-8102 • Engineering</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">Casual Leave</span>
                      </td>
                      <td className="p-3">
                        <div>12 Nov – 13 Nov</div>
                        <span className="text-[10px] font-bold text-[#2D6A4F]">2 Days (&le; 3d Short)</span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] bg-[#EBF5EE] text-[#143628] px-2 py-0.5 rounded font-mono font-bold">
                          Final Level 1
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-[#7A8E82] font-mono">None required</td>
                      <td className="p-3 text-right space-x-1.5">
                        <button type="button" className="px-2.5 py-1 rounded bg-[#143628] text-white font-semibold hover:bg-[#0E271D]">
                          Approve (Final)
                        </button>
                        <button type="button" className="px-2 py-1 rounded border border-[#C5C4B8] text-[#33443A] hover:bg-[#F2F1EB]">
                          Info
                        </button>
                        <button type="button" className="px-2 py-1 rounded border border-[#E57373] text-[#C62828] hover:bg-[#FFEBEE]">
                          Reject
                        </button>
                      </td>
                    </tr>

                    <tr>
                      <td className="p-3">
                        <div className="font-semibold text-[#143628]">Siddharth Joshi</div>
                        <span className="text-[10px] text-[#718478] font-mono">EMP-6490 • Architecture</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">Medical Leave</span>
                      </td>
                      <td className="p-3">
                        <div>16 Nov – 21 Nov</div>
                        <span className="text-[10px] font-bold text-[#D97706]">5 Days (&gt; 3d Long)</span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded font-mono font-bold">
                          Escalates to HOD
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] text-[#2D6A4F] font-mono flex items-center gap-1">
                          <EyeIcon className="w-3 h-3" />
                          cert_dr_rao.pdf
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button type="button" className="px-2.5 py-1 rounded bg-[#2D6A4F] text-white font-semibold hover:bg-[#143628]">
                          Endorse to HOD
                        </button>
                        <button type="button" className="px-2 py-1 rounded border border-[#C5C4B8] text-[#33443A] hover:bg-[#F2F1EB]">
                          Info
                        </button>
                        <button type="button" className="px-2 py-1 rounded border border-[#E57373] text-[#C62828] hover:bg-[#FFEBEE]">
                          Reject
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Conflict Guard Callout */}
              <div className="p-4 rounded-lg bg-white border border-[#DDDCD2] flex items-start gap-3">
                <AlertCircleIcon className="w-5 h-5 text-[#2D6A4F] shrink-0 mt-0.5" />
                <div className="text-xs text-[#4F6156]">
                  <strong className="text-[#143628]">Department Continuity Guard: </strong>
                  <span>
                    The system automatically cross-references active approvals across the same team. 
                    If minimum operational staffing falls below the 70% threshold, a warning flag alerts the Manager before approval.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOD DIRECTORATE & APPEALS */}
          {activeTab === "hod" && (
            <div className="p-6 md:p-8 space-y-6 bg-[#FAF9F5]">
              {/* HOD Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DDDCD2] gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#143628]">Head of Department (HOD) Directorate</h3>
                  <p className="text-xs text-[#526359]">
                    Second-tier authorization for extended leaves (&gt;3 days) and appellate jurisdiction over Manager rejections (DR-03).
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono bg-[#EBF5EE] text-[#143628] px-2.5 py-1 rounded font-bold border border-[#D5EADB]">
                    Formal Appeal Under Review
                  </span>
                </div>
              </div>

              {/* HOD Case Study: Formal Appeal Dossier */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white border border-[#DDDCD1] rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAE9E1]">
                    <div className="flex items-center gap-2">
                      <ScaleIcon className="w-4 h-4 text-[#143628]" />
                      <h4 className="text-sm font-bold text-[#143628]">
                        Appellate Case Dossier: Case #AP-2026-088
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded">
                      UNDER_APPEAL
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-4 p-3 rounded bg-[#FAF9F5] border border-[#E3E1D7]">
                      <div>
                        <span className="text-[#7A8E82] block text-[10px] uppercase font-bold">Appellant Employee</span>
                        <strong className="text-[#143628]">Rajesh Verma</strong> (Senior Flight Data Analyst)
                      </div>
                      <div>
                        <span className="text-[#7A8E82] block text-[10px] uppercase font-bold">Original Reviewer</span>
                        <strong className="text-[#143628]">Manager Arun Pillai</strong> (Operations Lead)
                      </div>
                    </div>

                    <div className="p-3 rounded bg-[#FFEBEE] border border-[#FFCDD2] text-[#B71C1C]">
                      <span className="font-bold block mb-0.5">Manager&apos;s Rejection Statement:</span>
                      &quot;Critical quarterly regulatory submission period. Absence cannot be accommodated at this time.&quot;
                    </div>

                    <div className="p-3 rounded bg-[#E8F5E9] border border-[#C8E6C9] text-[#1B5E20]">
                      <span className="font-bold block mb-0.5">Employee Formal Appeal Justification:</span>
                      &quot;All regulatory data pipelines have been automated and tested ahead of schedule. Primary deliverables have been signed off by Quality Assurance. Secondary on-call assigned to Anand Roy.&quot;
                    </div>
                  </div>

                  {/* HOD Action Buttons for Appeal */}
                  <div className="pt-3 border-t border-[#EAE9E1] flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-[#697C70]">HOD Decision recorded to immutable audit ledger</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded bg-[#143628] text-white text-xs font-semibold hover:bg-[#0E271D]"
                      >
                        Overturn &rarr; APPROVED_ON_APPEAL
                      </button>
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded bg-[#D32F2F] text-white text-xs font-semibold hover:bg-[#B71C1C]"
                      >
                        Uphold &rarr; APPEAL_REJECTED
                      </button>
                    </div>
                  </div>
                </div>

                {/* Directorate Summary Stats (Col 4) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white border border-[#DDDCD1] rounded-lg p-4 space-y-3">
                    <h5 className="text-xs font-bold text-[#143628] uppercase tracking-wide">
                      Departmental Coverage
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-[#4F6156]">
                        <span>Flight Operations Staffing:</span>
                        <span className="font-mono font-bold text-[#143628]">91% On Duty</span>
                      </div>
                      <div className="w-full bg-[#EAE8DD] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#143628] h-full" style={{ width: "91%" }} />
                      </div>
                      <div className="flex justify-between text-[#4F6156]">
                        <span>Maintenance Tech Staffing:</span>
                        <span className="font-mono font-bold text-[#143628]">84% On Duty</span>
                      </div>
                      <div className="w-full bg-[#EAE8DD] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#2D6A4F] h-full" style={{ width: "84%" }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DDDCD2] text-xs text-[#526359] space-y-1">
                    <strong className="text-[#143628] block">Statutory Non-Bypass Rule:</strong>
                    <span>
                      HODs cannot initiate or approve normal workflow requests without prior Manager review. 
                      Separation of managerial duties is enforced strictly at the database schema level.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

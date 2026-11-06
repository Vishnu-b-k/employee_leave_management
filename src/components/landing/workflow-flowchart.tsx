import React from "react";
import { 
  CheckCircleIcon, 
  ArrowRightIcon, 
  ScaleIcon, 
  ShieldIcon, 
  AlertCircleIcon, 
  ClockIcon, 
  HistoryIcon 
} from "./icons";

export function WorkflowFlowchart() {
  return (
    <section className="py-16 md:py-24 border-b border-[#E3E2DA] bg-[#FBFBFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Headline */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EBF5EE] border border-[#CFE7D6] text-xs font-semibold text-[#143628] mb-3">
            <ScaleIcon className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>STATUTORY STATE MACHINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#143628] font-serif">
            Two-Tier Approval Architecture &amp; Appeal Process
          </h2>
          <p className="mt-3 text-base text-[#4D5E54] leading-relaxed">
            Absence authorizations follow a deterministic 10-state lifecycle designed in accordance with enterprise labor compliance 
            and audited delegation of authority rules.
          </p>
        </div>

        {/* Visual Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* STAGE 1: SUBMISSION */}
          <div className="bg-[#FFFFFF] border border-[#D5D3C7] rounded-xl p-5 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-7 h-7 rounded-md bg-[#143628] text-white flex items-center justify-center font-bold text-xs font-mono">
                  01
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F0EFEA] text-[#55695E] border border-[#DDDCD2]">
                  INITIATION
                </span>
              </div>
              <h3 className="font-bold text-base text-[#143628] mb-2 font-serif">
                1. Employee Application
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed mb-4">
                Employee submits leave request with dates and justification. 
                Initial state becomes <code className="bg-[#F0EFEA] px-1.5 py-0.5 rounded text-[#143628] font-semibold">PENDING_MANAGER</code>.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#E3E2DA]">
                  <strong className="text-[#143628] block text-[11px]">&le; 3 Working Days:</strong>
                  <span className="text-[#55695E] text-[11px]">Short leave. Standard submission without mandatory doctor certification.</span>
                </div>
                <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#E3E2DA]">
                  <strong className="text-[#143628] block text-[11px]">&gt; 3 Working Days:</strong>
                  <span className="text-[#55695E] text-[11px]">Extended leave. Mandatory document upload with SHA-256 integrity hash.</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#EAE9E1] text-[11px] text-[#718478] flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Cancellable while in PENDING_MANAGER</span>
            </div>
          </div>

          {/* STAGE 2: MANAGER TIER */}
          <div className="bg-[#FFFFFF] border border-[#D5D3C7] rounded-xl p-5 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-7 h-7 rounded-md bg-[#143628] text-white flex items-center justify-center font-bold text-xs font-mono">
                  02
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EBF5EE] text-[#143628] border border-[#CFE7D6]">
                  LEVEL 1 REVIEW
                </span>
              </div>
              <h3 className="font-bold text-base text-[#143628] mb-2 font-serif">
                2. Reporting Manager
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed mb-4">
                Manager reviews request from assigned reportees only (DR-01). 
                Manager cannot approve own leave (DR-10).
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#E3E2DA]">
                  <span className="font-semibold text-[#143628] block text-[11px]">Branch A: Short Leave (&le;3d)</span>
                  <span className="text-[#2D6A4F] text-[11px] font-medium">Direct final approval &rarr; <strong>APPROVED</strong></span>
                </div>
                <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#E3E2DA]">
                  <span className="font-semibold text-[#143628] block text-[11px]">Branch B: Long Leave (&gt;3d)</span>
                  <span className="text-[#D97706] text-[11px] font-medium">Manager endorses &rarr; <strong>PENDING_HOD</strong></span>
                </div>
                <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#E3E2DA]">
                  <span className="font-semibold text-[#143628] block text-[11px]">Branch C: Rejection / Clarify</span>
                  <span className="text-[#B91C1C] text-[11px] font-medium">Rejection &rarr; <strong>REJECTED_BY_MANAGER</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#EAE9E1] text-[11px] text-[#718478] flex items-center gap-1.5">
              <ShieldIcon className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Mandatory comment on rejection</span>
            </div>
          </div>

          {/* STAGE 3: HOD TIER */}
          <div className="bg-[#FFFFFF] border border-[#D5D3C7] rounded-xl p-5 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-7 h-7 rounded-md bg-[#143628] text-white flex items-center justify-center font-bold text-xs font-mono">
                  03
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  LEVEL 2 REVIEW
                </span>
              </div>
              <h3 className="font-bold text-base text-[#143628] mb-2 font-serif">
                3. Head of Department
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed mb-4">
                Second-tier review for long leave requests escalated to <code className="bg-[#F0EFEA] px-1 py-0.5 rounded text-[#143628]">PENDING_HOD</code>.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#E3E2DA]">
                  <span className="font-semibold text-[#143628] block text-[11px]">HOD Authorization:</span>
                  <span className="text-[#2D6A4F] text-[11px] font-medium">Second-level sign-off &rarr; <strong>APPROVED</strong></span>
                </div>
                <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#E3E2DA]">
                  <span className="font-semibold text-[#143628] block text-[11px]">HOD Rejection:</span>
                  <span className="text-[#B91C1C] text-[11px] font-medium">Terminal decision &rarr; <strong>REJECTED_BY_HOD</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#EAE9E1] text-[11px] text-[#718478] flex items-center gap-1.5">
              <CheckCircleIcon className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Departmental coverage verification</span>
            </div>
          </div>

          {/* STAGE 4: APPEALS & AUDIT */}
          <div className="bg-[#FFFFFF] border border-[#D5D3C7] rounded-xl p-5 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-7 h-7 rounded-md bg-[#143628] text-white flex items-center justify-center font-bold text-xs font-mono">
                  04
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EBF5EE] text-[#143628] border border-[#CFE7D6]">
                  APPEALS &amp; AUDIT
                </span>
              </div>
              <h3 className="font-bold text-base text-[#143628] mb-2 font-serif">
                4. Formal Appeals (DR-03)
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed mb-4">
                Employees can appeal Manager rejections directly to the HOD within 7 days, setting status to <code className="bg-[#F0EFEA] px-1 py-0.5 rounded text-[#143628]">UNDER_APPEAL</code>.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#E3E2DA]">
                  <span className="font-semibold text-[#143628] block text-[11px]">Appeal Overturned:</span>
                  <span className="text-[#2D6A4F] text-[11px] font-medium">Distinct state &rarr; <strong>APPROVED_ON_APPEAL</strong></span>
                </div>
                <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#E3E2DA]">
                  <span className="font-semibold text-[#143628] block text-[11px]">Appeal Upheld:</span>
                  <span className="text-[#B91C1C] text-[11px] font-medium">Terminal state &rarr; <strong>APPEAL_REJECTED</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#EAE9E1] text-[11px] text-[#718478] flex items-center gap-1.5">
              <HistoryIcon className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Immutable append-only audit trail</span>
            </div>
          </div>
        </div>

        {/* State Machine Legend / Summary */}
        <div className="mt-8 p-5 rounded-xl bg-[#F4F3EB] border border-[#DDDCD2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
            <span className="text-xs font-semibold text-[#143628]">
              Comprehensive 10-State Formal Specification:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="bg-white px-2 py-0.5 rounded border border-[#DDDCD2] text-[#44554B]">PENDING_MANAGER</span>
            <span className="bg-white px-2 py-0.5 rounded border border-[#DDDCD2] text-[#44554B]">INFO_REQUESTED</span>
            <span className="bg-white px-2 py-0.5 rounded border border-[#DDDCD2] text-[#44554B]">PENDING_HOD</span>
            <span className="bg-[#EBF5EE] px-2 py-0.5 rounded border border-[#CDE5D4] text-[#143628] font-bold">APPROVED</span>
            <span className="bg-[#EBF5EE] px-2 py-0.5 rounded border border-[#CDE5D4] text-[#143628] font-bold">APPROVED_ON_APPEAL</span>
            <span className="bg-white px-2 py-0.5 rounded border border-[#DDDCD2] text-[#B91C1C]">REJECTED_BY_MANAGER</span>
            <span className="bg-white px-2 py-0.5 rounded border border-[#DDDCD2] text-[#B91C1C]">REJECTED_BY_HOD</span>
            <span className="bg-white px-2 py-0.5 rounded border border-[#DDDCD2] text-[#D97706]">UNDER_APPEAL</span>
            <span className="bg-white px-2 py-0.5 rounded border border-[#DDDCD2] text-[#B91C1C]">APPEAL_REJECTED</span>
            <span className="bg-white px-2 py-0.5 rounded border border-[#DDDCD2] text-[#6B7280]">CANCELLED</span>
          </div>
        </div>
      </div>
    </section>
  );
}

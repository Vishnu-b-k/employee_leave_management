import React from "react";
import { 
  ShieldIcon, 
  LockIcon, 
  HistoryIcon, 
  ScaleIcon, 
  CheckCircleIcon,
  BadgeCheckIcon
} from "./icons";

export function SecurityCompliance() {
  return (
    <section id="governance" className="py-16 md:py-24 border-b border-[#E3E2DA] bg-[#FBFBFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EBF5EE] border border-[#CFE7D6] text-xs font-semibold text-[#143628] mb-3">
            <LockIcon className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>ENTERPRISE GOVERNANCE &amp; TRUST</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#143628] font-serif">
            Security, Concurrency &amp; Audit Accountability
          </h2>
          <p className="mt-3 text-base text-[#4D5E54] leading-relaxed">
            Engineered to meet stringent organizational governance standards. Every state mutation is verified, 
            isolated against concurrency anomalies, and immutably recorded for regulatory scrutiny.
          </p>
        </div>

        {/* 4 Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Pillar 1 */}
          <div className="bg-white border border-[#D5D3C7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#FAF9F5] border border-[#DDDCD2] flex items-center justify-center text-[#143628] mb-4">
                <LockIcon className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <h3 className="font-bold text-sm text-[#143628] mb-2 font-serif">
                ACID Concurrency Protection
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed">
                State transitions execute within atomic PostgreSQL transactions using row-level locking (<code className="font-mono text-[#143628]">SELECT FOR UPDATE</code>) 
                and version checking (DR-15). Race conditions and double-spending of leave quotas are mathematically precluded.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EAE9E1] text-[10px] font-mono text-[#718478]">
              RULE: OPTIMISTIC_VERSION_CHECK
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white border border-[#D5D3C7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#FAF9F5] border border-[#DDDCD2] flex items-center justify-center text-[#143628] mb-4">
                <HistoryIcon className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <h3 className="font-bold text-sm text-[#143628] mb-2 font-serif">
                Immutable Append-Only Audit
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed">
                All lifecycle decisions, status changes, and reason texts are appended to tamper-evident audit tables. 
                Database trigger guards prevent UPDATE and DELETE operations, providing permanent evidential validity.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EAE9E1] text-[10px] font-mono text-[#718478]">
              RULE: APPEND_ONLY_TRIGGERS
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white border border-[#D5D3C7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#FAF9F5] border border-[#DDDCD2] flex items-center justify-center text-[#143628] mb-4">
                <ShieldIcon className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <h3 className="font-bold text-sm text-[#143628] mb-2 font-serif">
                Strict Separation of Duties
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed">
                Four-layer authorization (Route Guard, Resource Guard, State Guard, and Database Guard). 
                Managers cannot approve their own absences, and privilege escalation via client-side manipulation is strictly prohibited (DR-06, DR-10).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EAE9E1] text-[10px] font-mono text-[#718478]">
              RULE: NO_PRIVILEGE_SELF_ASSIGN
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white border border-[#D5D3C7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#FAF9F5] border border-[#DDDCD2] flex items-center justify-center text-[#143628] mb-4">
                <ScaleIcon className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <h3 className="font-bold text-sm text-[#143628] mb-2 font-serif">
                Confidential Document Vault
              </h3>
              <p className="text-xs text-[#526359] leading-relaxed">
                Medical certificates and sensitive supporting documents are encrypted at rest in S3/MinIO object storage. 
                Files are strictly served via signed, short-lived URLs accessible solely to designated reviewers in the approval chain.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EAE9E1] text-[10px] font-mono text-[#718478]">
              RULE: MINIO_SIGNED_PAYLOADS
            </div>
          </div>
        </div>

        {/* Accessibility & Compliance Certification Banner */}
        <div className="bg-[#FAF9F5] border border-[#D5D3C7] rounded-xl p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center gap-2">
                <BadgeCheckIcon className="w-5 h-5 text-[#2D6A4F]" />
                <h4 className="text-base font-bold text-[#143628] font-serif">
                  Accessibility &amp; Workplace Inclusivity Commitment
                </h4>
              </div>
              <p className="text-xs text-[#526359] leading-relaxed">
                LeaveFlow is developed in compliance with <strong>WCAG 2.1 Level AA</strong> digital accessibility standards. 
                Full keyboard navigation, screen reader ARIA landmarks, clear semantic heading structures, and tested contrast ratios 
                ensure that all employees across every organizational facility can independently manage their leave rights.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3 text-[11px] font-mono">
              <div className="bg-white border border-[#DDDCD2] px-3 py-2 rounded-lg text-center">
                <div className="font-bold text-[#143628]">WCAG 2.1 AA</div>
                <div className="text-[10px] text-[#718478]">Compliant</div>
              </div>
              <div className="bg-white border border-[#DDDCD2] px-3 py-2 rounded-lg text-center">
                <div className="font-bold text-[#143628]">ISO/IEC 27001</div>
                <div className="text-[10px] text-[#718478]">Standard Aligned</div>
              </div>
              <div className="bg-white border border-[#DDDCD2] px-3 py-2 rounded-lg text-center">
                <div className="font-bold text-[#143628]">POSTGRESQL 16</div>
                <div className="text-[10px] text-[#718478]">ACID Enforced</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

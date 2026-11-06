import React from "react";
import Link from "next/link";
import { ShieldIcon, ArrowRightIcon, LockIcon, BuildingIcon, ScaleIcon } from "./icons";

export function HeroSection() {
  return (
    <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden border-b border-[#E3E2DA] bg-[#FBFBFA]">
      {/* Subtle architectural background grid accents */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(#143628 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Hero Editorial Content (col 7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Official Authority Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-md bg-[#F2F1EA] border border-[#DDDCD2] text-xs font-medium text-[#2C4A3A]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#388E67] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D6A4F]"></span>
              </span>
              <span className="font-semibold tracking-wide uppercase text-[11px] text-[#143628]">
                Workforce Operations
              </span>
              <span className="text-[#A4B3A8]">|</span>
              <span className="text-[#4E5E54]">Employee Self-Service (ESS)</span>
            </div>

            {/* Compelling Welcome Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#143628] leading-[1.18] font-serif">
              Centralized Employee Leave &amp; Absence Management Portal
            </h1>

            {/* Welcoming Subheading */}
            <p className="text-base sm:text-lg text-[#4B5E53] leading-relaxed max-w-2xl">
              Welcome to the organization&apos;s official leave management gateway. 
              Submit absence applications, track manager and departmental authorizations in real time, 
              and review your verified statutory leave balances with end-to-end accountability.
            </p>

            {/* Prominent Sign In Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-[#143628] hover:bg-[#0B2118] text-[#FFFFFF] text-base font-semibold tracking-tight shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-center"
              >
                <span>Access Employee Portal</span>
                <ArrowRightIcon className="w-4 h-4 ml-2.5 text-[#9BD0AC]" />
              </Link>

              <a
                href="#workflows"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F5F4EE] text-[#1B3E2D] border border-[#CFCDC2] text-sm font-medium transition-colors text-center shadow-xs"
              >
                <span>Review Approval Workflows</span>
              </a>
            </div>

            {/* Authentication Notice Pill */}
            <div className="p-3.5 rounded-lg bg-[#F5F4EE] border border-[#DFDDD2] text-xs text-[#526359] flex items-start gap-3 max-w-2xl">
              <LockIcon className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#143628] font-semibold">Institutional SSO Enabled: </strong>
                <span>
                  Log in using your organizational credentials. Your workspace (Employee, Manager, or Head of Department) 
                  is automatically provisioned by the backend based on verified PostgreSQL personnel assignments.
                </span>
              </div>
            </div>

            {/* Institutional Trust Badges */}
            <div className="pt-2 grid grid-cols-3 gap-4 border-t border-[#E3E2DA] max-w-xl">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#143628] font-mono">100%</span>
                <span className="text-[11px] text-[#55695E] leading-tight">ACID Concurrency &amp; Row-Locking</span>
              </div>
              <div className="flex flex-col border-l border-[#E3E2DA] pl-4">
                <span className="text-lg font-bold text-[#143628] font-mono">10 States</span>
                <span className="text-[11px] text-[#55695E] leading-tight">Formal Two-Tier State Machine</span>
              </div>
              <div className="flex flex-col border-l border-[#E3E2DA] pl-4">
                <span className="text-lg font-bold text-[#143628] font-mono">Immutable</span>
                <span className="text-[11px] text-[#55695E] leading-tight">Audit Trail &amp; Decision Logs</span>
              </div>
            </div>
          </div>

          {/* Quick Notice Card & Daily Summary Bulletin (col 5) */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFFFFF] border border-[#DEDCD2] rounded-xl shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#EAE9E1] pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-md bg-[#EBF5EE] text-[#143628] flex items-center justify-center font-bold">
                    <BuildingIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#143628]">Official HR Bulletin</h3>
                    <p className="text-[11px] text-[#63756A]">FY 2026/27 Leave Policy Notices</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F4F3EB] text-[#4E5E54] border border-[#DDDCD2]">
                  ACTIVE
                </span>
              </div>

              {/* Notice items */}
              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E9E7DC]">
                  <div className="flex items-center justify-between font-semibold text-[#143628] mb-1">
                    <span>Medical Leave Documentation</span>
                    <span className="text-[10px] text-[#86998E]">Rule DR-07</span>
                  </div>
                  <p className="text-[#55695E] leading-relaxed">
                    Absences exceeding 3 working days require mandatory licensed medical practitioner certification uploaded to secure MinIO/S3 storage.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E9E7DC]">
                  <div className="flex items-center justify-between font-semibold text-[#143628] mb-1">
                    <span>Two-Tier Approval Threshold</span>
                    <span className="text-[10px] text-[#86998E]">Policy Sec. 4</span>
                  </div>
                  <p className="text-[#55695E] leading-relaxed">
                    Leaves &le; 3 days are finalized by Reporting Managers. Extended leaves (&gt; 3 days) automatically escalate to Department Head (HOD) approval.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E9E7DC]">
                  <div className="flex items-center justify-between font-semibold text-[#143628] mb-1">
                    <span>Formal Appeal Rights</span>
                    <span className="text-[10px] text-[#86998E]">Rule DR-03</span>
                  </div>
                  <p className="text-[#55695E] leading-relaxed">
                    Employees retain the right to submit a formal appeal directly to the HOD within 7 calendar days following any Manager rejection.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#EAE9E1] flex items-center justify-between text-xs text-[#526359]">
                <span className="flex items-center gap-1.5 font-medium">
                  <ScaleIcon className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  HR Compliance Directorate
                </span>
                <Link
                  href="/login"
                  className="font-semibold text-[#143628] hover:underline flex items-center gap-1"
                >
                  Enter Portal &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

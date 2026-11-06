import React from "react";
import Link from "next/link";
import { ShieldIcon, ArrowRightIcon, LockIcon } from "./icons";

export function PortalFooter() {
  return (
    <footer className="border-t border-[#DCDAD0] bg-[#FAF9F5] text-[#37493E]">
      {/* Final Portal Gateway Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12">
        <div className="bg-[#143628] rounded-2xl p-8 sm:p-12 text-[#FFFFFF] shadow-md relative overflow-hidden">
          {/* Subtle watermark crest */}
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 pointer-events-none opacity-5">
            <ShieldIcon className="w-96 h-96 text-white" />
          </div>

          <div className="max-w-3xl relative space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#1F4B38] text-[#A7D7B5] text-xs font-semibold">
              <LockIcon className="w-3.5 h-3.5" />
              <span>SINGLE SIGN-ON GATEWAY</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white font-serif leading-tight">
              Ready to Submit or Review Leave Requests?
            </h2>

            <p className="text-sm sm:text-base text-[#D0E2D6] leading-relaxed">
              Authenticate using your official corporate single sign-on credentials. 
              The portal will direct you to your assigned workspace — whether Employee Self-Service, 
              Direct Reports Queue, or Departmental Oversight.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F3F2EC] text-[#143628] text-sm font-bold tracking-tight shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0 text-center"
              >
                <span>Enter Employee Portal (SSO)</span>
                <ArrowRightIcon className="w-4 h-4 ml-2 text-[#143628]" />
              </Link>

              <Link
                href="/api/v1/health/ready"
                target="_blank"
                className="inline-flex items-center justify-center px-5 py-3.5 rounded-lg bg-[#0F291E] hover:bg-[#081812] text-[#CBE1D3] border border-[#2E5E47] text-xs font-mono transition-colors text-center"
              >
                <span className="w-2 h-2 rounded-full bg-[#52B788] mr-2" />
                Check System Health (/health/ready)
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Directory */}
      <div className="border-t border-[#E5E3D8] pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1: Identity */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-md bg-[#143628] flex items-center justify-center text-white">
                  <ShieldIcon className="w-4 h-4 text-[#A7D7B5]" />
                </div>
                <span className="font-bold text-base text-[#143628] font-serif">LeaveFlow</span>
              </div>
              <p className="text-xs text-[#526359] leading-relaxed">
                Official Employee Leave Management System of Akasa Corporate. 
                Administered by the Directorate of People &amp; Culture Operations.
              </p>
              <div className="pt-1 text-[11px] font-mono text-[#718478]">
                Release: v2.0-Enterprise • ISO 27001
              </div>
            </div>

            {/* Col 2: Leave Policies */}
            <div className="space-y-2.5 text-xs">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#143628]">
                Policy Manuals
              </h3>
              <ul className="space-y-2 text-[#526359]">
                <li>
                  <a href="#services" className="hover:text-[#143628] transition-colors">
                    Annual Paid Leave Regulations
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-[#143628] transition-colors">
                    Sick Leave &amp; Medical Certification (DR-07)
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-[#143628] transition-colors">
                    Casual &amp; Emergency Leave Provisions
                  </a>
                </li>
                <li>
                  <a href="#workflows" className="hover:text-[#143628] transition-colors">
                    Manager Delegation of Authority Matrix
                  </a>
                </li>
                <li>
                  <a href="#workflows" className="hover:text-[#143628] transition-colors">
                    Appeals Tribunal Bylaws (DR-03)
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Employee Assistance */}
            <div className="space-y-2.5 text-xs">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#143628]">
                Employee Support
              </h3>
              <ul className="space-y-2 text-[#526359]">
                <li className="flex items-center gap-1.5">
                  <span>People Operations Helpdesk:</span>
                  <strong className="text-[#143628] font-mono">Ext. 4022</strong>
                </li>
                <li className="flex items-center gap-1.5">
                  <span>Corporate Medical Officer:</span>
                  <strong className="text-[#143628] font-mono">Ext. 1109</strong>
                </li>
                <li>
                  <span className="text-[#526359]">Support Window: 08:30 – 18:00 IST (Mon–Fri)</span>
                </li>
                <li>
                  <span className="text-[#526359]">Confidential Whistleblower &amp; Ethics Desk</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Systems & Infrastructure */}
            <div className="space-y-2.5 text-xs">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#143628]">
                System Architecture
              </h3>
              <ul className="space-y-2 text-[#526359]">
                <li>
                  <Link href="/api/v1/health/live" target="_blank" className="hover:underline flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                    Container Liveness (/health/live)
                  </Link>
                </li>
                <li>
                  <Link href="/api/v1/health/ready" target="_blank" className="hover:underline flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                    Database Readiness (/health/ready)
                  </Link>
                </li>
                <li>
                  <span className="text-[#65766C]">PostgreSQL 16 Multi-AZ Storage</span>
                </li>
                <li>
                  <span className="text-[#65766C]">MinIO Cryptographic File Store</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Legal & Security Notice */}
          <div className="pt-8 border-t border-[#E5E3D8] flex flex-col md:flex-row items-center justify-between text-xs text-[#718478] gap-4">
            <div>
              &copy; 2026 Akasa Corporate. Official Employee Self-Service Portal. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span>Internal Personnel Only</span>
              <span>•</span>
              <span>Statutory Compliance Certified</span>
              <span>•</span>
              <span>Confidentiality Protected</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

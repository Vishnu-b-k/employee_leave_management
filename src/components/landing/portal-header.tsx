"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldIcon } from "./icons";

export function PortalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-[#E3E2DA] bg-[#FBFBFA]/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top corporate security stripe */}
      <div className="bg-[#143628] text-[#E8F2EC] text-[11px] font-medium tracking-wide py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse" />
            <span className="font-semibold text-[#D8EADB]">OFFICIAL EMPLOYEE PORTAL</span>
            <span className="hidden md:inline text-[#84A98C]">|</span>
            <span className="hidden md:inline text-[#C4D7CA]">
              Akasa Enterprise Human Resources Information System (HRIS)
            </span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-[#C4D7CA]">
            <span className="hidden sm:inline">Statutory Leave Year 2026–2027</span>
            <span className="hidden sm:inline text-[#84A98C]">•</span>
            <Link
              href="/api/v1/health/ready"
              target="_blank"
              className="hover:text-white transition-colors flex items-center gap-1 font-mono text-[10px] bg-[#0E271D] px-2 py-0.5 rounded border border-[#24533D]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#52B788]" />
              DB: CONNECTED
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Institutional identity */}
        <Link href="/" className="flex items-center space-x-3.5 group">
          <div className="w-11 h-11 rounded-lg bg-[#143628] border border-[#0B2118] flex items-center justify-center text-[#F2F7F4] shadow-sm transition-transform group-hover:scale-[1.02]">
            <ShieldIcon className="w-6 h-6 text-[#A7D7B5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-[#143628] font-serif">
                LeaveFlow
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EBF5EE] text-[#143628] border border-[#CFE7D6]">
                Portal v2.0
              </span>
            </div>
            <span className="text-xs text-[#526359] font-medium tracking-normal">
              Employee Self-Service & Workforce Absence Portal
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-[#46574D]">
          <a
            href="#services"
            className="hover:text-[#143628] transition-colors py-1 hover:border-b-2 hover:border-[#143628]"
          >
            Leave Entitlements
          </a>
          <a
            href="#workflows"
            className="hover:text-[#143628] transition-colors py-1 hover:border-b-2 hover:border-[#143628]"
          >
            Approval Workflows
          </a>
          <a
            href="#governance"
            className="hover:text-[#143628] transition-colors py-1 hover:border-b-2 hover:border-[#143628]"
          >
            Statutory Governance
          </a>
          <a
            href="#policy"
            className="hover:text-[#143628] transition-colors py-1 hover:border-b-2 hover:border-[#143628]"
          >
            HR Policy Guidelines
          </a>
        </nav>

        {/* Action button */}
        <div className="hidden sm:flex items-center space-x-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#143628] hover:bg-[#0E271D] text-[#FFFFFF] text-sm font-medium tracking-tight shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="mr-2">Access Employee Portal</span>
            <svg
              className="w-4 h-4 text-[#A7D7B5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center space-x-2">
          <Link
            href="/login"
            className="px-3.5 py-2 rounded-md bg-[#143628] text-white text-xs font-medium"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-[#32453B] hover:bg-[#EFEFEA] focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E3E2DA] bg-[#FAF9F5] px-6 py-4 space-y-3">
          <a
            href="#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#32453B] py-2 border-b border-[#EAE9E1]"
          >
            Leave Entitlements
          </a>
          <a
            href="#workflows"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#32453B] py-2 border-b border-[#EAE9E1]"
          >
            Approval Workflows
          </a>
          <a
            href="#governance"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#32453B] py-2 border-b border-[#EAE9E1]"
          >
            Statutory Governance
          </a>
          <a
            href="#policy"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#32453B] py-2 border-b border-[#EAE9E1]"
          >
            HR Policy Guidelines
          </a>
          <div className="pt-2">
            <Link
              href="/login"
              className="w-full text-center inline-flex justify-center items-center px-4 py-2.5 rounded-lg bg-[#143628] text-white text-sm font-semibold shadow-xs"
            >
              Access Employee Portal (SSO)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

import React from "react";
import { PortalHeader } from "@/components/landing/portal-header";
import { HeroSection } from "@/components/landing/hero-section";
import { WorkflowPreview } from "@/components/landing/workflow-preview";
import { WorkflowFlowchart } from "@/components/landing/workflow-flowchart";
import { ServicesOverview } from "@/components/landing/services-overview";
import { SecurityCompliance } from "@/components/landing/security-compliance";
import { PortalFooter } from "@/components/landing/portal-footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1B241E] flex flex-col font-sans selection:bg-[#CDE5D4] selection:text-[#143628]">
      {/* 1. Official Institutional Navigation Header */}
      <PortalHeader />

      {/* Main Portal Body */}
      <main className="flex-1 w-full">
        {/* 2. Welcome Hero Section & Primary Portal Sign In */}
        <HeroSection />

        {/* 3. Product Interface Preview with authentic Employee, Manager, and HOD views */}
        <WorkflowPreview />

        {/* 4. Statutory Approval Workflow & Dual-tier State Machine */}
        <WorkflowFlowchart />

        {/* 5. Leave Entitlements, Workflows & Operational SLAs */}
        <ServicesOverview />

        {/* 6. Security, ACID Concurrency & Immutable Audit Accountability */}
        <SecurityCompliance />
      </main>

      {/* 7. Final Portal Access Banner & Official Enterprise Footer */}
      <PortalFooter />
    </div>
  );
}

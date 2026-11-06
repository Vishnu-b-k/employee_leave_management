import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import DashboardNav from "@/components/dashboard/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-[#E7E6E0] bg-white sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#143628] flex items-center justify-center text-[#EBF5EE] font-bold text-sm shadow-xs">
                LF
              </div>
              <span className="font-semibold text-base text-[#143628] tracking-tight">LeaveFlow</span>
            </Link>

            {/* Navigation links based on authoritative PostgreSQL roles */}
            <DashboardNav
              isEmployee={user.isEmployee}
              isManager={user.isManager}
              isHOD={user.isHOD}
            />
          </div>

          {/* User info and Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-[#143628]">{user.display_name}</div>
              <div className="text-[11px] text-[#5C6E63]">{user.email}</div>
            </div>

            <div className="flex items-center space-x-1.5">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-[#F0F7F2] text-[#143628] border border-[#D5EADB]"
                >
                  {role}
                </span>
              ))}
            </div>

            <div className="h-4 w-px bg-[#E7E6E0]" />

            <form action="/api/v1/auth/logout" method="POST">
              <button
                type="submit"
                className="text-xs font-medium text-[#7A3E3E] hover:text-[#991B1B] px-2.5 py-1.5 rounded hover:bg-[#FEF2F2] transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

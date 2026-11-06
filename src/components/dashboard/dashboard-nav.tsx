"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardNavProps {
  isEmployee: boolean;
  isManager: boolean;
  isHOD: boolean;
}

export default function DashboardNav({ isEmployee, isManager, isHOD }: DashboardNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="flex items-center gap-1 shrink-0 overflow-x-auto">
      <Link
        href="/dashboard"
        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
          isActive("/dashboard")
            ? "bg-[#143628] text-white shadow-2xs"
            : "text-[#526058] hover:text-[#143628] hover:bg-[#F0EFEA]"
        }`}
      >
        Overview
      </Link>

      {isEmployee && (
        <Link
          href="/dashboard/employee"
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            isActive("/dashboard/employee")
              ? "bg-[#143628] text-white shadow-2xs"
              : "text-[#526058] hover:text-[#143628] hover:bg-[#F0EFEA]"
          }`}
        >
          My Requests
        </Link>
      )}

      {isManager && (
        <Link
          href="/dashboard/manager"
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            isActive("/dashboard/manager")
              ? "bg-[#143628] text-white shadow-2xs"
              : "text-[#526058] hover:text-[#143628] hover:bg-[#F0EFEA]"
          }`}
        >
          Manager Queue
        </Link>
      )}

      {isHOD && (
        <Link
          href="/dashboard/hod"
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            isActive("/dashboard/hod")
              ? "bg-[#143628] text-white shadow-2xs"
              : "text-[#526058] hover:text-[#143628] hover:bg-[#F0EFEA]"
          }`}
        >
          HOD Reviews
        </Link>
      )}
    </nav>
  );
}

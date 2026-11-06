"use client";

import React, { useState } from "react";
import { useAuth } from "@/modules/auth/auth-context";

export default function SignOutButton() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await logout();
    } catch {
      // Fallback: force direct navigation to logout endpoint
      window.location.href = "/api/v1/auth/logout";
    }
  };

  return (
    <form onSubmit={handleSignOut} action="/api/v1/auth/logout" method="POST">
      <button
        type="submit"
        disabled={loading}
        className="text-xs font-medium text-[#7A3E3E] hover:text-[#991B1B] px-2.5 py-1.5 rounded hover:bg-[#FEF2F2] transition-colors disabled:opacity-50 cursor-pointer"
        title="Sign out of LeaveFlow"
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <svg className="animate-spin h-3 w-3 text-[#991B1B]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Signing Out...
          </span>
        ) : (
          "Sign Out"
        )}
      </button>
    </form>
  );
}

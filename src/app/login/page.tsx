"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/modules/auth/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const { login, error: authError, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }

    setLocalError(null);
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push(redirectPath);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setLocalError(null);
  };

  const displayError = localError || authError;

  return (
    <div className="bg-white py-8 px-6 shadow-xs border border-[#E7E6E0] rounded-xl sm:px-8">
      {displayError && (
        <div className="mb-5 p-3 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] flex items-start space-x-2 text-xs text-[#991B1B]">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{displayError}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-[#143628] mb-1">
            Work Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@leaveflow.internal"
            className="w-full px-3 py-2 text-sm border border-[#D8D6CC] rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#143628] focus:border-transparent transition bg-[#FDFDFC] text-[#143628]"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-[#143628] mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3 py-2 text-sm border border-[#D8D6CC] rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#143628] focus:border-transparent transition bg-[#FDFDFC] text-[#143628]"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting || authLoading}
            className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-[#143628] hover:bg-[#0F291E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#143628] transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || authLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>

      {/* Demo Account Quick-Fill */}
      <div className="mt-6 pt-5 border-t border-[#EAE9E2]">
        <p className="text-xs font-semibold text-[#5C6E63] mb-2.5 text-center">
          Assessment Demo Accounts (Click to fill)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount("employee@leaveflow.internal", "EmployeePass123!")}
            className="py-1.5 px-2 text-[11px] font-medium rounded border border-[#D5EADB] bg-[#F0F7F2] text-[#143628] hover:bg-[#E3F2E7] transition-colors"
          >
            Employee
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("manager@leaveflow.internal", "ManagerPass123!")}
            className="py-1.5 px-2 text-[11px] font-medium rounded border border-[#D5EADB] bg-[#F0F7F2] text-[#143628] hover:bg-[#E3F2E7] transition-colors"
          >
            Manager
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("hod@leaveflow.internal", "HodPass123!")}
            className="py-1.5 px-2 text-[11px] font-medium rounded border border-[#D5EADB] bg-[#F0F7F2] text-[#143628] hover:bg-[#E3F2E7] transition-colors"
          >
            HOD
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-[#143628] flex items-center justify-center text-[#EBF5EE] font-bold text-xl shadow-sm">
            LF
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-semibold tracking-tight text-[#143628]">
          Sign in to LeaveFlow
        </h2>
        <p className="mt-1 text-center text-xs text-[#5C6E63]">
          Enterprise Leave Management &amp; Approvals
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="bg-white p-8 rounded-xl text-center text-xs text-[#526058]">Loading login form...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs font-medium text-[#4D5E54] hover:text-[#143628] transition-colors">
            ← Back to System Architecture
          </Link>
        </div>
      </div>
    </div>
  );
}

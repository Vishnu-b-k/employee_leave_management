import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-white border border-[#E7E6E0] rounded-xl p-8 shadow-xs text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#DC2626] mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v.01m0-2a2 2 0 10-4 0v2h4zm0-6V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-[#143628] mb-2">Access Denied</h1>
        <p className="text-xs text-[#526058] leading-relaxed mb-6">
          You do not have the required role or authorization to access this resource.
          Access permissions are strictly enforced according to your organizational role assignments.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-[#143628] hover:bg-[#0F291E] text-white text-xs font-medium transition-colors shadow-xs"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-[#F0F7F2] hover:bg-[#E3F2E7] text-[#143628] border border-[#D5EADB] text-xs font-medium transition-colors"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}

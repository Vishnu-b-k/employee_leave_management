"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LeaveType {
  id: string;
  name: string;
  default_annual_allocation: number | null;
  requires_document: boolean;
}

interface AttachedDocument {
  id?: string;
  original_filename?: string;
  originalFilename?: string;
  storage_key?: string;
  storageKey?: string;
  mime_type?: string;
  mimeType?: string;
  file_size_bytes?: number;
  fileSizeBytes?: number;
}

interface DecisionRecord {
  id: string;
  action: string;
  actor_role: string;
  comment: string | null;
  previous_status: string;
  new_status: string;
  created_at: string;
  actor?: {
    display_name: string;
    email: string;
  };
}

interface LeaveRequestItem {
  id: string;
  leave_type_id: string;
  leave_type: {
    id: string;
    name: string;
  };
  start_date: string;
  end_date: string;
  calculated_working_days: number;
  reason: string;
  status: string;
  requires_hod_approval: boolean;
  version: number;
  submitted_at: string;
  documents: AttachedDocument[];
  decisions: DecisionRecord[];
  appeals: Array<{
    id: string;
    justification: string;
    status: string;
    created_at: string;
  }>;
}

interface EmployeeLeaveClientProps {
  initialRequests: LeaveRequestItem[];
  leaveTypes: LeaveType[];
  userDisplayName: string;
  managerName: string | null;
}

export function EmployeeLeaveClient({
  initialRequests,
  leaveTypes,
  userDisplayName,
  managerName,
}: EmployeeLeaveClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequestItem[]>(initialRequests);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>(
    leaveTypes[0]?.id || ""
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [uploadedDocs, setUploadedDocs] = useState<
    Array<{
      originalFilename: string;
      storageKey: string;
      mimeType: string;
      fileSizeBytes: number;
    }>
  >([]);

  // Appeal Modal State
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealTargetRequest, setAppealTargetRequest] = useState<LeaveRequestItem | null>(null);
  const [appealJustification, setAppealJustification] = useState("");
  const [appealError, setAppealError] = useState<string | null>(null);
  const [isAppealing, setIsAppealing] = useState(false);

  // Detail Modal State
  const [detailModalRequest, setDetailModalRequest] = useState<LeaveRequestItem | null>(null);

  // Estimated working days
  const [estimatedWorkingDays, setEstimatedWorkingDays] = useState<number | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) {
      setEstimatedWorkingDays(null);
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      setEstimatedWorkingDays(null);
      return;
    }

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    setEstimatedWorkingDays(count);
  }, [startDate, endDate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/v1/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "File upload failed.");
      }

      setUploadedDocs((prev) => [
        ...prev,
        {
          originalFilename: data.data.originalFilename,
          storageKey: data.data.storageKey,
          mimeType: data.data.mimeType,
          fileSizeBytes: data.data.fileSizeBytes,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Document upload failed.";
      setFormError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedLeaveType || !startDate || !endDate || !reason.trim()) {
      setFormError("Please fill out all required fields.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError("Start date cannot be after end date.");
      return;
    }

    if (estimatedWorkingDays !== null && estimatedWorkingDays > 3 && uploadedDocs.length === 0) {
      setFormError("Leave requests exceeding 3 working days require mandatory supporting documentation.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveTypeId: selectedLeaveType,
          startDate,
          endDate,
          reason: reason.trim(),
          documents: uploadedDocs,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to submit leave request.");
      }

      setFormSuccess("Leave application submitted successfully for manager review.");
      // Refresh requests
      setRequests((prev) => [data.data, ...prev]);
      // Reset form
      setReason("");
      setStartDate("");
      setEndDate("");
      setUploadedDocs([]);
      setShowApplyModal(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error occurred.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAppeal = (req: LeaveRequestItem) => {
    setAppealTargetRequest(req);
    setAppealJustification("");
    setAppealError(null);
    setAppealModalOpen(true);
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealTargetRequest || !appealJustification.trim()) {
      setAppealError("Please provide an appeal justification statement.");
      return;
    }

    setIsAppealing(true);
    setAppealError(null);

    try {
      const res = await fetch(`/api/v1/leave-requests/${appealTargetRequest.id}/appeals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          justification: appealJustification.trim(),
          version: appealTargetRequest.version,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to file appeal.");
      }

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === appealTargetRequest.id
            ? { ...r, status: "UNDER_APPEAL", version: r.version + 1 }
            : r
        )
      );

      setAppealModalOpen(false);
      setAppealTargetRequest(null);
      setFormSuccess("Appeal submitted successfully to Department Head.");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit appeal.";
      setAppealError(msg);
    } finally {
      setIsAppealing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_MANAGER":
        return <span className="px-2.5 py-1 rounded bg-[#FEF3C7] text-[#92400E] text-xs font-semibold border border-[#FDE68A]">Pending Manager</span>;
      case "PENDING_HOD":
        return <span className="px-2.5 py-1 rounded bg-[#E0E7FF] text-[#3730A3] text-xs font-semibold border border-[#C7D2FE]">Pending HOD</span>;
      case "APPROVED":
        return <span className="px-2.5 py-1 rounded bg-[#DCFCE7] text-[#166534] text-xs font-semibold border border-[#BBF7D0]">Approved</span>;
      case "APPROVED_ON_APPEAL":
        return <span className="px-2.5 py-1 rounded bg-[#D1FAE5] text-[#065F46] text-xs font-bold border border-[#A7F3D0]">Approved on Appeal</span>;
      case "REJECTED_BY_MANAGER":
        return <span className="px-2.5 py-1 rounded bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold border border-[#FECACA]">Rejected by Manager</span>;
      case "REJECTED_BY_HOD":
        return <span className="px-2.5 py-1 rounded bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold border border-[#FECACA]">Rejected by HOD</span>;
      case "UNDER_APPEAL":
        return <span className="px-2.5 py-1 rounded bg-[#FDF4FF] text-[#86198F] text-xs font-semibold border border-[#F5D0FE]">Under Appeal</span>;
      case "APPEAL_REJECTED":
        return <span className="px-2.5 py-1 rounded bg-[#F3F4F6] text-[#374151] text-xs font-semibold border border-[#E5E7EB]">Appeal Upheld/Rejected</span>;
      case "INFO_REQUESTED":
        return <span className="px-2.5 py-1 rounded bg-[#FFFBEB] text-[#B45309] text-xs font-semibold border border-[#FDE68A]">Info Requested</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 rounded bg-[#F3F4F6] text-[#4B5563] text-xs font-semibold">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">{status}</span>;
    }
  };

  const activeCount = requests.filter((r) =>
    ["PENDING_MANAGER", "PENDING_HOD", "UNDER_APPEAL", "INFO_REQUESTED"].includes(r.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E6E0] gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#143628]">My Leave Dashboard</h1>
          <p className="text-xs text-[#526058] mt-1">
            Personal leave balances, request history, and appeal tracking for {userDisplayName}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#143628] hover:bg-[#0F291E] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Apply for Leave
          </button>
        </div>
      </div>

      {formSuccess && (
        <div className="p-3.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-center justify-between">
          <span>{formSuccess}</span>
          <button type="button" onClick={() => setFormSuccess(null)} className="text-xs font-bold text-[#166534]">
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-medium text-[#526058] uppercase tracking-wider mb-1">
            Assigned Manager
          </div>
          <div className="text-lg font-semibold text-[#143628]">
            {managerName || "Department Head"}
          </div>
          <div className="text-[11px] text-[#5C6E63] mt-1">First-level reviewer (DR-01)</div>
        </div>

        <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-medium text-[#526058] uppercase tracking-wider mb-1">
            Active Requests
          </div>
          <div className="text-lg font-semibold text-[#143628]">
            {activeCount} In Review
          </div>
          <div className="text-[11px] text-[#5C6E63] mt-1">
            {activeCount === 0 ? "No pending actions" : "Currently in approval pipeline"}
          </div>
        </div>

        <div className="bg-white border border-[#E7E6E0] rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-medium text-[#526058] uppercase tracking-wider mb-1">
            Leave Quotas Available
          </div>
          <div className="text-lg font-semibold text-[#143628]">
            {leaveTypes.length} Types Configured
          </div>
          <div className="text-[11px] text-[#5C6E63] mt-1">Casual, Sick, Earned</div>
        </div>
      </div>

      {/* Leave Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#E7E6E0] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6E0]">
              <h2 className="text-base font-bold text-[#143628]">New Leave Application</h2>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B]">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#143628] mb-1">Leave Classification</label>
                <select
                  value={selectedLeaveType}
                  onChange={(e) => setSelectedLeaveType(e.target.value)}
                  className="w-full p-2 border border-[#D8D6CC] rounded-lg bg-[#FDFDFC] text-[#143628]"
                  required
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} {lt.default_annual_allocation ? `(${lt.default_annual_allocation} days/year)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#143628] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full p-2 border border-[#D8D6CC] rounded-lg text-[#143628]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#143628] mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full p-2 border border-[#D8D6CC] rounded-lg text-[#143628]"
                  />
                </div>
              </div>

              {estimatedWorkingDays !== null && (
                <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                  estimatedWorkingDays > 3
                    ? "bg-[#FEF3C7]/70 border-[#FDE68A] text-[#92400E]"
                    : "bg-[#F0F7F2] border-[#D5EADB] text-[#143628]"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#5C6E63]">Duration:</span>
                    <span className="font-semibold text-sm text-[#143628]">
                      {estimatedWorkingDays} {estimatedWorkingDays === 1 ? "Working Day" : "Working Days"}
                    </span>
                    <span className="text-[11px] text-[#5C6E63]">(excluding weekends)</span>
                  </div>
                  {estimatedWorkingDays > 3 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      Requires HOD Approval (&gt;3 Days)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF5EE] text-[#143628] border border-[#CDE5D4]">
                      Manager Direct Approval
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#143628] mb-1">
                  Supporting Documents{" "}
                  {estimatedWorkingDays !== null && estimatedWorkingDays > 3 ? (
                    <span className="text-[#B45309] font-normal text-xs">(Required for leave exceeding 3 days)</span>
                  ) : (
                    <span className="text-[#5C6E63] font-normal text-xs">(Optional)</span>
                  )}
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#143628] file:text-white hover:file:bg-[#0F291E]"
                />
                {isUploading && <p className="text-[11px] text-[#2D6A4F] mt-1">Uploading file securely...</p>}
                {uploadedDocs.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedDocs.map((doc, idx) => (
                      <div key={idx} className="p-1.5 bg-[#FAF9F5] border border-[#E7E6E0] rounded text-[11px] text-[#143628] flex items-center justify-between">
                        <span>📎 {doc.originalFilename}</span>
                        <span className="text-[#5C6E63] font-mono text-[10px]">
                          {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#143628] mb-1">Reason for Absence</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the purpose and work handover coverage..."
                  required
                  className="w-full p-2 border border-[#D8D6CC] rounded-lg text-[#143628]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#D8D6CC] text-[#526058] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-4 py-2 rounded-lg bg-[#143628] hover:bg-[#0F291E] text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appeal Submission Modal */}
      {appealModalOpen && appealTargetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#E7E6E0] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6E0]">
              <h2 className="text-base font-bold text-[#143628]">File Formal Appeal to Department Head (DR-03)</h2>
              <button
                type="button"
                onClick={() => setAppealModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {appealError && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B]">
                {appealError}
              </div>
            )}

            {/* Preserved manager rejection commentary */}
            {appealTargetRequest.decisions.length > 0 && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs">
                <span className="font-bold text-[#991B1B] block mb-1">
                  Preserved Manager Rejection Comment:
                </span>
                <p className="text-[#7F1D1D] italic">
                  &quot;{appealTargetRequest.decisions[appealTargetRequest.decisions.length - 1]?.comment || "No comment provided."}&quot;
                </p>
              </div>
            )}

            <form onSubmit={handleAppealSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#143628] mb-1">
                  Formal Appeal Justification
                </label>
                <p className="text-[11px] text-[#526058] mb-2">
                  Explain to the Head of Department why this absence should be approved and how work coverage has been arranged.
                </p>
                <textarea
                  rows={4}
                  value={appealJustification}
                  onChange={(e) => setAppealJustification(e.target.value)}
                  placeholder="Detail project handover and justifications for second-level review..."
                  required
                  className="w-full p-2.5 border border-[#D8D6CC] rounded-lg text-[#143628]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAppealModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#D8D6CC] text-[#526058] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAppealing}
                  className="px-4 py-2 rounded-lg bg-[#143628] hover:bg-[#0F291E] text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isAppealing ? "Submitting Appeal..." : "Submit Appeal to HOD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details & Audit Trail Modal */}
      {detailModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#E7E6E0] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6E0]">
              <h2 className="text-base font-bold text-[#143628]">
                Request Details &amp; History #{detailModalRequest.id.substring(0, 8)}
              </h2>
              <button
                type="button"
                onClick={() => setDetailModalRequest(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF9F5] rounded border border-[#E7E6E0]">
                <div>
                  <span className="text-[#5C6E63] block text-[10px] uppercase font-semibold">Leave Type</span>
                  <strong className="text-[#143628]">{detailModalRequest.leave_type.name}</strong>
                </div>
                <div>
                  <span className="text-[#5C6E63] block text-[10px] uppercase font-semibold">Working Days</span>
                  <strong className="text-[#143628]">{detailModalRequest.calculated_working_days} Days</strong>
                </div>
                <div>
                  <span className="text-[#5C6E63] block text-[10px] uppercase font-semibold">Start Date</span>
                  <span>{new Date(detailModalRequest.start_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[#5C6E63] block text-[10px] uppercase font-semibold">End Date</span>
                  <span>{new Date(detailModalRequest.end_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#143628] block mb-1">Reason:</span>
                <p className="p-2.5 bg-gray-50 border border-gray-200 rounded text-gray-700">
                  {detailModalRequest.reason}
                </p>
              </div>

              {detailModalRequest.documents && detailModalRequest.documents.length > 0 && (
                <div>
                  <span className="font-semibold text-[#143628] block mb-1">Attachments:</span>
                  <div className="space-y-1">
                    {detailModalRequest.documents.map((d, i) => (
                      <div key={i} className="p-2 bg-[#F0F7F2] border border-[#D5EADB] rounded flex items-center justify-between text-[11px]">
                        <a
                          href={`/api/v1/documents/${d.id || d.storage_key || d.storageKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline font-semibold text-[#143628] flex items-center gap-1"
                        >
                          📎 {d.original_filename || d.originalFilename}
                        </a>
                        <span className="font-mono text-[#2D6A4F] text-[10px]">Verified Document</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Timeline */}
              <div>
                <span className="font-semibold text-[#143628] block mb-1">Decision History:</span>
                {detailModalRequest.decisions.length === 0 ? (
                  <p className="text-gray-500 italic">No decisions recorded yet.</p>
                ) : (
                  <div className="space-y-2 border-l-2 border-[#143628] pl-3">
                    {detailModalRequest.decisions.map((dec) => (
                      <div key={dec.id} className="text-[11px]">
                        <div className="flex items-center justify-between">
                          <strong className="text-[#143628]">{dec.action}</strong>
                          <span className="text-gray-400 font-mono text-[10px]">
                            {new Date(dec.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          Actor: {dec.actor?.display_name || dec.actor_role}
                        </div>
                        {dec.comment && (
                          <div className="mt-1 p-1.5 bg-gray-50 rounded border border-gray-200 text-gray-700">
                            &quot;{dec.comment}&quot;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setDetailModalRequest(null)}
                className="px-4 py-1.5 bg-[#143628] text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request History Table */}
      <div className="bg-white border border-[#E7E6E0] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-[#E7E6E0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#143628]">Leave Request History</h2>
          <span className="text-xs text-[#526058]">{requests.length} Submissions Total</span>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#F0F7F2] flex items-center justify-center text-[#143628] mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#143628]">No leave submissions filed yet</p>
            <p className="text-xs text-[#526058] mt-1 max-w-sm mx-auto">
              Click &quot;Apply for Leave&quot; above to submit an absence request with automatic working-day calculation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#526058] font-semibold border-b border-[#E7E6E0]">
                <tr>
                  <th className="p-3.5">Leave Type</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Working Days</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Submitted</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E6E0] text-[#143628]">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-[#143628]">{req.leave_type.name}</div>
                      <div className="text-[11px] text-[#5C6E63] truncate max-w-xs">{req.reason}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      {new Date(req.start_date).toLocaleDateString()} – {new Date(req.end_date).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-semibold">
                      {req.calculated_working_days} {req.calculated_working_days === 1 ? "day" : "days"}
                      {req.requires_hod_approval && (
                        <span className="block text-[10px] text-[#B45309] font-medium">HOD Review Required</span>
                      )}
                    </td>
                    <td className="p-3.5">{getStatusBadge(req.status)}</td>
                    <td className="p-3.5 text-[#5C6E63] text-[11px] font-mono">
                      {new Date(req.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setDetailModalRequest(req)}
                        className="px-2.5 py-1 rounded border border-[#D8D6CC] text-[#143628] font-medium hover:bg-white"
                      >
                        Details
                      </button>

                      {/* Rule: Cancel eligible while in PENDING_MANAGER */}
                      {req.status === "PENDING_MANAGER" && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Are you sure you want to cancel this leave application?")) return;
                            try {
                              const res = await fetch(`/api/v1/leave-requests/${req.id}/cancel`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ version: req.version }),
                              });
                              const data = await res.json();
                              if (res.ok && data.success) {
                                setRequests((prev) =>
                                  prev.map((r) => (r.id === req.id ? { ...r, status: "CANCELLED", version: r.version + 1 } : r))
                                );
                                setFormSuccess("Application cancelled successfully.");
                              } else {
                                alert(data.error?.message || "Could not cancel request.");
                              }
                            } catch (e: any) {
                              alert(e.message || "Failed to cancel request.");
                            }
                          }}
                          className="px-2.5 py-1 rounded border border-gray-300 text-gray-600 font-medium hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      )}

                      {/* Rule: Respond to Manager Info Request */}
                      {req.status === "INFO_REQUESTED" && (
                        <button
                          type="button"
                          onClick={() => {
                            const notes = prompt("Enter additional information / clarification for Manager:");
                            if (!notes) return;
                            fetch(`/api/v1/leave-requests/${req.id}/resubmit`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ responseNotes: notes, version: req.version }),
                            })
                              .then((r) => r.json())
                              .then((data) => {
                                if (data.success) {
                                  setRequests((prev) =>
                                    prev.map((r) => (r.id === req.id ? { ...r, status: "PENDING_MANAGER", version: r.version + 1 } : r))
                                  );
                                  setFormSuccess("Information submitted. Application returned to Manager review.");
                                } else {
                                  alert(data.error?.message || "Failed to submit response.");
                                }
                              })
                              .catch((err) => alert(err.message));
                          }}
                          className="px-2.5 py-1 rounded bg-[#D97706] text-white font-semibold hover:bg-[#B45309]"
                        >
                          Respond
                        </button>
                      )}

                      {/* Rule: Only allow appeal against REJECTED_BY_MANAGER */}
                      {req.status === "REJECTED_BY_MANAGER" && (
                        <button
                          type="button"
                          onClick={() => handleOpenAppeal(req)}
                          className="px-2.5 py-1 rounded bg-[#B91C1C] text-white font-semibold hover:bg-[#991B1B]"
                        >
                          File Appeal
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

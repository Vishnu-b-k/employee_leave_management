"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface HodReviewItem {
  id: string;
  employee_id: string;
  employee: {
    id: string;
    display_name: string;
    email: string;
    department?: {
      id: string;
      name: string;
    } | null;
  };
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
  documents: Array<{
    id?: string;
    original_filename?: string;
    originalFilename?: string;
    file_size_bytes?: number;
    fileSizeBytes?: number;
  }>;
  decisions: Array<{
    id: string;
    action: string;
    comment: string | null;
    created_at: string;
    actor?: {
      display_name: string;
      email: string;
    };
  }>;
  appeals: Array<{
    id: string;
    justification: string;
    status: string;
    created_at: string;
    manager_rejection_decision?: {
      comment: string | null;
      created_at: string;
    } | null;
  }>;
}

interface HodReviewsClientProps {
  initialReviews: HodReviewItem[];
  departmentName: string;
  hodName: string;
}

export function HodReviewsClient({
  initialReviews,
  departmentName,
  hodName,
}: HodReviewsClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<HodReviewItem[]>(initialReviews);
  const [activeTab, setActiveTab] = useState<"long_leave" | "appeals" | "all">("long_leave");

  // Decision Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<HodReviewItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<
    "HOD_APPROVE" | "HOD_REJECT" | "APPEAL_APPROVE" | "APPEAL_REJECT"
  >("HOD_APPROVE");
  const [decisionComment, setDecisionComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openDecisionModal = (
    item: HodReviewItem,
    action: "HOD_APPROVE" | "HOD_REJECT" | "APPEAL_APPROVE" | "APPEAL_REJECT"
  ) => {
    setSelectedReview(item);
    setDecisionAction(action);
    setDecisionComment("");
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    if (["HOD_REJECT", "APPEAL_REJECT"].includes(decisionAction) && !decisionComment.trim()) {
      setErrorMessage("A comment is mandatory when rejecting or upholding a rejection.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/hod/reviews/${selectedReview.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: decisionAction,
          comment: decisionComment.trim() || undefined,
          version: selectedReview.version,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to record HOD decision.");
      }

      setSuccessMessage(`HOD decision ${decisionAction.replace("_", " ")} recorded.`);
      // Update local state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id
            ? { ...r, status: data.data.request.status, version: data.data.request.version }
            : r
        )
      );

      setModalOpen(false);
      setSelectedReview(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record decision.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_HOD":
        return <span className="px-2.5 py-1 rounded bg-[#E0E7FF] text-[#3730A3] text-xs font-semibold border border-[#C7D2FE]">Pending HOD</span>;
      case "UNDER_APPEAL":
        return <span className="px-2.5 py-1 rounded bg-[#FDF4FF] text-[#86198F] text-xs font-semibold border border-[#F5D0FE]">Under Appeal</span>;
      case "APPROVED":
        return <span className="px-2.5 py-1 rounded bg-[#DCFCE7] text-[#166534] text-xs font-semibold border border-[#BBF7D0]">Approved</span>;
      case "APPROVED_ON_APPEAL":
        return <span className="px-2.5 py-1 rounded bg-[#D1FAE5] text-[#065F46] text-xs font-bold border border-[#A7F3D0]">Approved on Appeal</span>;
      case "REJECTED_BY_HOD":
        return <span className="px-2.5 py-1 rounded bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold border border-[#FECACA]">Rejected by HOD</span>;
      case "APPEAL_REJECTED":
        return <span className="px-2.5 py-1 rounded bg-[#F3F4F6] text-[#374151] text-xs font-semibold border border-[#E5E7EB]">Appeal Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">{status}</span>;
    }
  };

  const pendingLongLeaves = reviews.filter((r) => r.status === "PENDING_HOD");
  const pendingAppeals = reviews.filter((r) => r.status === "UNDER_APPEAL");

  const displayedItems = reviews.filter((r) => {
    if (activeTab === "long_leave") {
      return r.status === "PENDING_HOD";
    }
    if (activeTab === "appeals") {
      return r.status === "UNDER_APPEAL";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E6E0] gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#143628]">HOD Departmental Review</h1>
          <p className="text-xs text-[#526058] mt-1">
            Second-level approvals for long leave (&gt;3 days) and formal employee appeals for {departmentName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded bg-[#EBF5EE] text-[#143628] text-xs font-semibold border border-[#CDE5D4]">
            Role: HOD
          </span>
          <span className="px-2.5 py-1 rounded bg-[#F4F3ED] text-[#4D5E54] text-xs font-medium border border-[#E4E2D8]">
            Department: {departmentName}
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-center justify-between">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-xs font-bold text-[#166534]">
            ✕
          </button>
        </div>
      )}

      {/* Decision Modal */}
      {modalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#E7E6E0] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6E0]">
              <h2 className="text-base font-bold text-[#143628]">
                {decisionAction === "HOD_APPROVE"
                  ? "Authorize Extended Leave"
                  : decisionAction === "HOD_REJECT"
                  ? "Reject Extended Leave"
                  : decisionAction === "APPEAL_APPROVE"
                  ? "Overturn Manager Rejection (Approve Leave)"
                  : "Uphold Manager Rejection"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B]">
                {errorMessage}
              </div>
            )}

            <div className="p-3 rounded bg-[#FAF9F5] border border-[#E7E6E0] text-xs space-y-1.5">
              <div>
                <span className="text-[#5C6E63]">Employee: </span>
                <strong className="text-[#143628]">{selectedReview.employee.display_name}</strong>
              </div>
              <div>
                <span className="text-[#5C6E63]">Leave Duration: </span>
                <span className="font-semibold">{selectedReview.calculated_working_days} working days ({selectedReview.leave_type.name})</span>
              </div>
              {selectedReview.appeals.length > 0 && selectedReview.status === "UNDER_APPEAL" && (
                <div className="mt-2 p-2 bg-[#FDF4FF] border border-[#F5D0FE] rounded">
                  <span className="font-bold text-[#86198F] block">Employee Appeal Justification:</span>
                  <p className="italic text-[#701A75]">
                    &quot;{selectedReview.appeals[0]?.justification}&quot;
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#143628] mb-1">
                  HOD Remarks &amp; Determination {["HOD_REJECT", "APPEAL_REJECT"].includes(decisionAction) ? "(Required)" : "(Optional)"}
                </label>
                <textarea
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder={
                    ["HOD_REJECT", "APPEAL_REJECT"].includes(decisionAction)
                      ? "Mandatory justification for upholding rejection or denying leave..."
                      : "Optional commentary for official determination record..."
                  }
                  required={["HOD_REJECT", "APPEAL_REJECT"].includes(decisionAction)}
                  className="w-full p-2.5 border border-[#D8D6CC] rounded-lg text-[#143628]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#D8D6CC] text-[#526058] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg text-white font-semibold shadow-xs disabled:opacity-50 ${
                    ["HOD_APPROVE", "APPEAL_APPROVE"].includes(decisionAction)
                      ? "bg-[#143628] hover:bg-[#0F291E]"
                      : "bg-[#B91C1C] hover:bg-[#991B1B]"
                  }`}
                >
                  {isSubmitting ? "Processing..." : `Confirm ${decisionAction.replace("_", " ")}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E7E6E0] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("long_leave")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "long_leave"
              ? "bg-[#143628] text-white"
              : "bg-white text-[#526058] border border-[#E7E6E0] hover:bg-[#FAF9F5]"
          }`}
        >
          Pending 2nd-Level Approvals ({pendingLongLeaves.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("appeals")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "appeals"
              ? "bg-[#143628] text-white"
              : "bg-white text-[#526058] border border-[#E7E6E0] hover:bg-[#FAF9F5]"
          }`}
        >
          Pending Employee Appeals ({pendingAppeals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "all"
              ? "bg-[#143628] text-white"
              : "bg-white text-[#526058] border border-[#E7E6E0] hover:bg-[#FAF9F5]"
          }`}
        >
          All Department Submissions ({reviews.length})
        </button>
      </div>

      {/* Review Queue Table */}
      <div className="bg-white border border-[#E7E6E0] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-[#E7E6E0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#143628]">
            {activeTab === "long_leave"
              ? "Long Leave Review Queue (>3 Days)"
              : activeTab === "appeals"
              ? "Employee Appeals Review"
              : "All Departmental Requests"}
          </h2>
          <span className="text-xs text-[#526058] font-medium">Department Review</span>
        </div>

        {displayedItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#526058]">
            {activeTab === "long_leave"
              ? "No extended leave requests pending second-level HOD approval."
              : activeTab === "appeals"
              ? "No unresolved employee appeals in queue."
              : "No departmental leave records found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#526058] font-semibold border-b border-[#E7E6E0]">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Leave Type</th>
                  <th className="p-3.5">Period</th>
                  <th className="p-3.5">Working Days</th>
                  <th className="p-3.5">Documents</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">HOD Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E6E0] text-[#143628]">
                {displayedItems.map((req) => (
                  <tr key={req.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-[#143628]">{req.employee.display_name}</div>
                      <div className="text-[11px] text-[#5C6E63]">{req.employee.email}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold">{req.leave_type.name}</div>
                      <div className="text-[11px] text-[#5C6E63] truncate max-w-xs">{req.reason}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      {new Date(req.start_date).toLocaleDateString()} – {new Date(req.end_date).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-semibold">
                      {req.calculated_working_days} days
                    </td>
                    <td className="p-3.5">
                      {req.documents.length > 0 ? (
                        <a
                          href={`/api/v1/documents/${req.documents[0].id || (req.documents[0] as any).storage_key || (req.documents[0] as any).storageKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#143628] font-mono font-medium underline hover:text-[#0F291E]"
                        >
                          📎 {req.documents.length} File(s)
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-400">None</span>
                      )}
                    </td>
                    <td className="p-3.5">{getStatusBadge(req.status)}</td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {req.status === "PENDING_HOD" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, "HOD_APPROVE")}
                            className="px-2.5 py-1 rounded bg-[#143628] text-white font-semibold hover:bg-[#0F291E]"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, "HOD_REJECT")}
                            className="px-2.5 py-1 rounded border border-[#FCA5A5] text-[#991B1B] font-semibold hover:bg-[#FEF2F2]"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {req.status === "UNDER_APPEAL" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, "APPEAL_APPROVE")}
                            className="px-2.5 py-1 rounded bg-[#065F46] text-white font-semibold hover:bg-[#047857]"
                          >
                            Overturn Rejection
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, "APPEAL_REJECT")}
                            className="px-2.5 py-1 rounded border border-[#FCA5A5] text-[#991B1B] font-semibold hover:bg-[#FEF2F2]"
                          >
                            Uphold Rejection
                          </button>
                        </>
                      )}

                      {!["PENDING_HOD", "UNDER_APPEAL"].includes(req.status) && (
                        <span className="text-[11px] text-gray-400 font-mono">Concluded</span>
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

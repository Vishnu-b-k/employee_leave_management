"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface DirectReport {
  id: string;
  display_name: string;
  email: string;
  department_id: string | null;
}

interface ManagerRequestItem {
  id: string;
  employee_id: string;
  employee: {
    id: string;
    display_name: string;
    email: string;
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
  }>;
}

interface ManagerApprovalsClientProps {
  directReports: DirectReport[];
  initialRequests: ManagerRequestItem[];
  managerName: string;
}

export function ManagerApprovalsClient({
  directReports,
  initialRequests,
  managerName,
}: ManagerApprovalsClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<ManagerRequestItem[]>(initialRequests);
  const [filterTab, setFilterTab] = useState<"pending" | "all">("pending");

  // Decision Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ManagerRequestItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<"APPROVE" | "REJECT" | "REQUEST_INFO">("APPROVE");
  const [decisionComment, setDecisionComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openDecisionModal = (req: ManagerRequestItem, action: "APPROVE" | "REJECT" | "REQUEST_INFO") => {
    setSelectedRequest(req);
    setDecisionAction(action);
    setDecisionComment("");
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (["REJECT", "REQUEST_INFO"].includes(decisionAction) && !decisionComment.trim()) {
      setErrorMessage("A comment is mandatory for rejection or information requests.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/manager/leave-requests/${selectedRequest.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: decisionAction,
          comment: decisionComment.trim() || undefined,
          version: selectedRequest.version,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to record decision.");
      }

      setSuccessMessage(`Decision ${decisionAction} recorded successfully.`);
      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: data.data.request.status, version: data.data.request.version }
            : r
        )
      );

      setModalOpen(false);
      setSelectedRequest(null);
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
      case "PENDING_MANAGER":
        return <span className="px-2.5 py-1 rounded bg-[#FEF3C7] text-[#92400E] text-xs font-semibold border border-[#FDE68A]">Pending Review</span>;
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
      case "INFO_REQUESTED":
        return <span className="px-2.5 py-1 rounded bg-[#FFFBEB] text-[#B45309] text-xs font-semibold border border-[#FDE68A]">Info Requested</span>;
      case "UNDER_APPEAL":
        return <span className="px-2.5 py-1 rounded bg-[#FDF4FF] text-[#86198F] text-xs font-semibold border border-[#F5D0FE]">Under Appeal</span>;
      default:
        return <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">{status}</span>;
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterTab === "pending") {
      return ["PENDING_MANAGER", "INFO_REQUESTED"].includes(r.status);
    }
    return true;
  });

  const pendingCount = requests.filter((r) =>
    ["PENDING_MANAGER", "INFO_REQUESTED"].includes(r.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E6E0] gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#143628]">Manager Approvals Queue</h1>
          <p className="text-xs text-[#526058] mt-1">
            First-level review for direct reports of {managerName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded bg-[#EBF5EE] text-[#143628] text-xs font-semibold border border-[#CDE5D4]">
            Role: MANAGER
          </span>
          <span className="px-2.5 py-1 rounded bg-[#F4F3ED] text-[#4D5E54] text-xs font-medium border border-[#E4E2D8]">
            Direct Reports: {directReports.length}
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

      {/* Scope Advisory Note */}
      <div className="p-3.5 rounded-xl bg-[#F0F7F2] border border-[#D5EADB] flex items-start space-x-3">
        <div className="w-5 h-5 rounded-full bg-[#143628] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
          ✓
        </div>
        <div className="text-xs text-[#143628] leading-relaxed">
          <span className="font-semibold">Reporting Scope:</span> You are reviewing leave requests for your assigned direct reports. Self-approval of personal leave is prohibited and routed to your Department Head.
        </div>
      </div>

      {/* Decision Modal */}
      {modalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#E7E6E0] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E6E0]">
              <h2 className="text-base font-bold text-[#143628]">
                {decisionAction === "APPROVE" ? "Approve Leave Request" : decisionAction === "REJECT" ? "Reject Leave Request" : "Request Additional Information"}
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

            <div className="p-3 rounded bg-[#FAF9F5] border border-[#E7E6E0] text-xs space-y-1">
              <div>
                <span className="text-[#5C6E63]">Employee: </span>
                <strong className="text-[#143628]">{selectedRequest.employee.display_name}</strong>
              </div>
              <div>
                <span className="text-[#5C6E63]">Leave Type &amp; Duration: </span>
                <span className="font-semibold">{selectedRequest.leave_type.name} ({selectedRequest.calculated_working_days} working days)</span>
              </div>
              {decisionAction === "APPROVE" && (
                <div className="text-[11px] font-bold text-[#143628] pt-1">
                  {selectedRequest.calculated_working_days <= 3
                    ? "✓ <= 3 Days: Manager approval immediately completes and finalizes the request (APPROVED)."
                    : "↗ > 3 Days: Manager approval moves this request to Department Head review (PENDING_HOD)."}
                </div>
              )}
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#143628] mb-1">
                  Manager Comments &amp; Justification {decisionAction !== "APPROVE" ? "(Required)" : "(Optional)"}
                </label>
                <textarea
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder={
                    decisionAction === "REJECT"
                      ? "Specify reason for rejection (mandatory)..."
                      : decisionAction === "REQUEST_INFO"
                      ? "Specify what document or detail is needed from employee..."
                      : "Optional remarks for approval record..."
                  }
                  required={decisionAction !== "APPROVE"}
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
                    decisionAction === "APPROVE"
                      ? "bg-[#143628] hover:bg-[#0F291E]"
                      : decisionAction === "REJECT"
                      ? "bg-[#B91C1C] hover:bg-[#991B1B]"
                      : "bg-[#D97706] hover:bg-[#B45309]"
                  }`}
                >
                  {isSubmitting ? "Processing..." : `Confirm ${decisionAction.replace("_", " ")}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E7E6E0] pb-2">
        <button
          type="button"
          onClick={() => setFilterTab("pending")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterTab === "pending"
              ? "bg-[#143628] text-white"
              : "bg-white text-[#526058] border border-[#E7E6E0] hover:bg-[#FAF9F5]"
          }`}
        >
          Pending Review ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterTab === "all"
              ? "bg-[#143628] text-white"
              : "bg-white text-[#526058] border border-[#E7E6E0] hover:bg-[#FAF9F5]"
          }`}
        >
          All Direct Report Requests ({requests.length})
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-[#E7E6E0] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-[#E7E6E0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#143628]">
            {filterTab === "pending" ? "Pending Approvals Queue" : "All Submissions Queue"}
          </h2>
          <span className="text-xs text-[#526058] font-medium">Direct Reports Queue</span>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#526058]">
            {filterTab === "pending"
              ? "No pending leave requests awaiting manager decision."
              : "No leave requests found for direct reports."}
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
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E6E0] text-[#143628]">
                {filteredRequests.map((req) => (
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
                      {req.calculated_working_days} {req.calculated_working_days === 1 ? "day" : "days"}
                      {req.calculated_working_days > 3 ? (
                        <span className="block text-[10px] text-[#B45309] font-medium">Escalates to HOD</span>
                      ) : (
                        <span className="block text-[10px] text-[#166534] font-medium">Direct Approval</span>
                      )}
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
                      {["PENDING_MANAGER", "INFO_REQUESTED"].includes(req.status) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, "APPROVE")}
                            className="px-2.5 py-1 rounded bg-[#143628] text-white font-semibold hover:bg-[#0F291E]"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, "REQUEST_INFO")}
                            className="px-2 py-1 rounded border border-[#D8D6CC] text-[#143628] font-medium hover:bg-white"
                          >
                            Info
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, "REJECT")}
                            className="px-2 py-1 rounded border border-[#FCA5A5] text-[#991B1B] font-semibold hover:bg-[#FEF2F2]"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-mono">Decision Recorded</span>
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

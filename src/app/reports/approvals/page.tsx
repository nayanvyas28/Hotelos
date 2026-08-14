"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { getApprovalsAction, resolveApprovalAction } from "@/app/actions/approvals";
import { ShieldCheck, CheckCircle2, XCircle, Clock, FileText, IndianRupee, Loader2, AlertTriangle, KeyRound, Building2, Sparkles, Filter } from "lucide-react";

export default function ApprovalsPage() {
  const { activePropertyId, currentUser } = useSession();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"PENDING" | "RESOLVED">("PENDING");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolution Modal State
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [resolveType, setResolveType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [comments, setComments] = useState("");
  const [approvedPasswordNotice, setApprovedPasswordNotice] = useState<string | null>(null);

  const loadApprovals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getApprovalsAction(activePropertyId, currentUser?.role);
      if (res.success && res.approvals) {
        setApprovals(res.approvals);
      } else {
        setError(res.error || "Failed to load approvals.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load stay folio approvals.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadApprovals();
    }
  }, [activePropertyId, currentUser?.role]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval || !currentUser) return;

    setIsActionLoading(true);
    setApprovedPasswordNotice(null);

    try {
      const res = await resolveApprovalAction(
        selectedApproval.id,
        resolveType,
        comments,
        `${currentUser.name} (${currentUser.role})`
      );

      if (res.success) {
        if (res.approvedPassword) {
          setApprovedPasswordNotice(`Password for ${selectedApproval.targetEmail || selectedApproval.requestor} has been set to: ${res.approvedPassword}`);
        }
        setSelectedApproval(null);
        setComments("");
        await loadApprovals();
      } else {
        alert(res.error || "Failed to process request.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to process request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const pendingList = approvals.filter((a) => a.status === "PENDING");
  const resolvedList = approvals.filter((a) => a.status === "APPROVED" || a.status === "REJECTED");
  
  let currentList = activeTab === "PENDING" ? pendingList : resolvedList;

  if (deptFilter !== "ALL") {
    currentList = currentList.filter((a) => a.department === deptFilter);
  }

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-sm font-bold text-text-primary">Governance Approvals Engine</h2>
          </div>
          <div className="flex items-center space-x-4">
            <HeaderStaffSwitcher />
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["SAAS_OWNER", "MD", "CFO", "GM", "HOUSEKEEPER", "MANAGER", "FRONT_DESK"]}>
            <>
              {/* Header Info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary">Approvals Workspace</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Role Hierarchy Governance: Front Office $\rightarrow$ GM, Housekeeping $\rightarrow$ HK Manager, Corporate & Password Resets $\rightarrow$ SaaS Owner.
                  </p>
                </div>

                {approvedPasswordNotice && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>{approvedPasswordNotice}</span>
                  </div>
                )}
              </div>

              {/* Department Hierarchy Filter */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border-default rounded-lg p-3 shadow-sm">
                {/* Navigation Tabs */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab("PENDING")}
                    className={`py-1.5 text-xs font-bold border-b-2 px-1 transition-all ${
                      activeTab === "PENDING"
                        ? "border-primary text-primary"
                        : "border-transparent text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Pending Requests ({pendingList.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("RESOLVED")}
                    className={`py-1.5 text-xs font-bold border-b-2 px-1 transition-all ${
                      activeTab === "RESOLVED"
                        ? "border-primary text-primary"
                        : "border-transparent text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Resolved Register ({resolvedList.length})
                  </button>
                </div>

                {/* Department Filter Selector */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-[10px] font-bold text-text-muted uppercase">Department Scope:</span>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="text-xs font-bold px-2.5 py-1 border border-border-default rounded bg-surface text-text-primary focus:outline-none"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="FRONT_OFFICE">Front Office (GM Clearance)</option>
                    <option value="HOUSEKEEPING">Housekeeping (HK Lead Clearance)</option>
                    <option value="CORPORATE">Corporate & Passwords (SaaS Owner Clearance)</option>
                  </select>
                </div>
              </div>

              {/* Load Spinner */}
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 bg-error/10 border border-error/20 rounded text-sm text-error flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : currentList.length === 0 ? (
                <div className="text-center py-16 bg-surface border border-border-default rounded-lg text-xs text-text-muted">
                  No approval requests found matching current filter scope.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-surface border border-border-default rounded-lg p-5 shadow-small flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                              {item.type}
                            </span>
                            <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-text-secondary border border-border-default">
                              {item.department || "GENERAL"}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-muted">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                          {item.type === "PASSWORD_RESET" && <KeyRound className="w-4 h-4 text-primary" />}
                          {item.subject}
                        </h3>
                        
                        <p className="text-xs text-text-secondary leading-normal">{item.details}</p>

                        {item.targetRole && (
                          <div className="text-[10px] text-text-muted pt-1">
                            Required Approver Level: <strong className="text-primary font-bold">{item.targetRole} (Parent Admin)</strong>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-border-default pt-4 flex justify-between items-center">
                        <div className="text-xs">
                          <span className="text-text-muted block text-[10px] uppercase font-bold">Requestor</span>
                          <span className="font-semibold text-text-secondary">{item.requestor}</span>
                        </div>

                        {item.status === "PENDING" ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedApproval(item);
                                setResolveType("REJECTED");
                              }}
                              className="px-3 py-1.5 text-xxs font-bold text-error border border-error/20 rounded hover:bg-error/5 transition-all"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApproval(item);
                                setResolveType("APPROVED");
                              }}
                              className="px-3 py-1.5 text-xxs font-bold text-white bg-success hover:bg-success/90 rounded shadow-xxs transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-xs">
                            <span className="text-text-muted block text-[10px] uppercase font-bold">Status</span>
                            <span
                              className={`font-black flex items-center ${
                                item.status === "APPROVED" ? "text-success" : "text-error"
                              }`}
                            >
                              {item.status === "APPROVED" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                              )}
                              {item.status}
                            </span>
                          </div>
                        )}
                      </div>

                      {item.status !== "PENDING" && (
                        <div className="bg-surface-secondary/40 rounded p-3 text-xxs space-y-1 border border-border-default/50">
                          <div className="flex justify-between font-bold text-text-secondary">
                            <span>Reviewed by: {item.resolvedBy}</span>
                            <span>{new Date(item.resolvedAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <p className="text-text-muted italic mt-1">"{item.comments}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Resolution Modal */}
              {selectedApproval && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
                    <h3 className="text-sm font-bold text-text-primary">
                      Confirm {resolveType === "APPROVED" ? "Approval" : "Rejection"}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      You are about to authorize: <span className="font-bold text-text-primary">{selectedApproval.subject}</span>
                    </p>
                    <form onSubmit={handleResolveSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Decision Comments</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="e.g. Verified credentials and approved reset under parent clearance."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none placeholder:text-text-muted font-medium"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedApproval(null)}
                          className="px-4 py-2 text-xs font-semibold text-text-secondary border border-border-default rounded bg-surface"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isActionLoading}
                          className={`px-4 py-2 text-xs font-bold text-white rounded shadow-small ${
                            resolveType === "APPROVED" ? "bg-success hover:bg-success/90" : "bg-error hover:bg-error/90"
                          }`}
                        >
                          {isActionLoading ? "Saving..." : `Confirm ${resolveType}`}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

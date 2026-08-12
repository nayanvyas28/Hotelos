"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { getLogbookAction, submitHandoverAction, createIncidentAction, updateIncidentStatusAction } from "@/app/actions/logbook";
import { FileText, ClipboardList, AlertTriangle, ShieldCheck, Plus, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

export default function LogbookPage() {
  const { activePropertyId, currentUser } = useSession();
  const [handovers, setHandovers] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"HANDOVERS" | "INCIDENTS">("HANDOVERS");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [handoverForm, setHandoverForm] = useState({
    shift: "Morning to Evening",
    cashReconciled: "",
    outgoingManager: currentUser?.name || "",
    incomingManager: "",
    openIssues: "",
    vipArrivals: "",
  });

  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    title: "",
    category: "MAINTENANCE",
    priority: "MEDIUM",
    details: "",
    reportedBy: currentUser?.name || "",
    assignedTo: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getLogbookAction(activePropertyId);
      if (res.success && res.handovers && res.incidents) {
        setHandovers(res.handovers);
        setIncidents(res.incidents);
      } else {
        setError(res.error || "Failed to load logbook details.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load logbook details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activePropertyId) {
      loadData();
    }
  }, [activePropertyId]);

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await submitHandoverAction(activePropertyId, {
        ...handoverForm,
        cashReconciled: parseFloat(handoverForm.cashReconciled) || 0,
      });
      if (res.success) {
        setIsHandoverOpen(false);
        setHandoverForm({
          shift: "Morning to Evening",
          cashReconciled: "",
          outgoingManager: currentUser?.name || "",
          incomingManager: "",
          openIssues: "",
          vipArrivals: "",
        });
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit shift handover.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await createIncidentAction(activePropertyId, incidentForm);
      if (res.success) {
        setIsIncidentOpen(false);
        setIncidentForm({
          title: "",
          category: "MAINTENANCE",
          priority: "MEDIUM",
          details: "",
          reportedBy: currentUser?.name || "",
          assignedTo: "",
        });
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit incident.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStatusChange = async (incidentId: string, status: string) => {
    try {
      const res = await updateIncidentStatusAction(incidentId, status);
      if (res.success) {
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update incident.");
    }
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">Manager Daily Logbook</h2>
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MD", "GM"]}>
            <>
              {/* Header section */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary">Operations Logbook</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Record operational handovers, verify shift cash, track incidents, and coordinate multi-department tasks.
                  </p>
                </div>
                {activeTab === "HANDOVERS" ? (
                  <button
                    onClick={() => setIsHandoverOpen(true)}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Submit Handover
                  </button>
                ) : (
                  <button
                    onClick={() => setIsIncidentOpen(true)}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-error hover:bg-error/95 rounded shadow-small"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Report Incident
                  </button>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-border-default space-x-4">
                <button
                  onClick={() => setActiveTab("HANDOVERS")}
                  className={`py-2 text-xs font-bold border-b-2 px-1 transition-all flex items-center space-x-1.5 ${
                    activeTab === "HANDOVERS"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Shift Handovers ({handovers.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("INCIDENTS")}
                  className={`py-2 text-xs font-bold border-b-2 px-1 transition-all flex items-center space-x-1.5 ${
                    activeTab === "INCIDENTS"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Incidents Register ({incidents.length})</span>
                </button>
              </div>

              {/* Data Table / Content */}
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 bg-error/10 border border-error/20 rounded text-sm text-error">
                  {error}
                </div>
              ) : activeTab === "HANDOVERS" ? (
                /* Handovers Layout */
                <div className="space-y-4">
                  {handovers.length === 0 ? (
                    <div className="text-center py-16 bg-surface border border-border-default rounded-lg text-xs text-text-muted">
                      No shift handovers logged yet.
                    </div>
                  ) : (
                    handovers.map((item) => (
                      <div
                        key={item.id}
                        className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-text-primary block">{item.shift} Handover</span>
                            <span className="text-[10px] text-text-muted">
                              Business Date: {item.businessDate} • Submitted: {new Date(item.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-success/10 text-success border border-success/20 uppercase tracking-wider font-mono">
                            Reconciled: INR {item.cashReconciled.toFixed(2)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-3 bg-surface-secondary/40 border border-border-default/50 rounded space-y-1">
                            <span className="text-[10px] uppercase font-bold text-text-muted">Outgoing Manager</span>
                            <span className="font-semibold text-text-secondary block">{item.outgoingManager}</span>
                          </div>
                          <div className="p-3 bg-surface-secondary/40 border border-border-default/50 rounded space-y-1">
                            <span className="text-[10px] uppercase font-bold text-text-muted">Incoming Manager Acknowledged</span>
                            <span className="font-semibold text-text-secondary block">{item.incomingManager}</span>
                          </div>
                        </div>

                        <div className="divide-y divide-border-default text-xs pt-1 space-y-2">
                          <div className="py-2">
                            <span className="font-bold text-text-primary block">Open operational issues</span>
                            <p className="text-text-secondary mt-1 leading-relaxed">{item.openIssues || "No pending issues."}</p>
                          </div>
                          <div className="py-2">
                            <span className="font-bold text-text-primary block">VVIP / VIP arrivals notes</span>
                            <p className="text-text-secondary mt-1 leading-relaxed">{item.vipArrivals || "No VIP arrivals reported."}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Incidents register table layout */
                <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        <th className="p-4">Reported Date</th>
                        <th className="p-4">Incident details</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Assigned To</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {incidents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-text-muted">
                            No incidents reported today.
                          </td>
                        </tr>
                      ) : (
                        incidents.map((inc) => (
                          <tr key={inc.id} className="hover:bg-surface-secondary/30 transition-all">
                            <td className="p-4 text-text-secondary">{new Date(inc.createdAt).toLocaleDateString()}</td>
                            <td className="p-4">
                              <span className="font-bold text-text-primary block">{inc.title}</span>
                              <span className="text-[10px] text-text-muted mt-0.5 block">{inc.details}</span>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-black bg-slate-800 text-slate-400 uppercase tracking-wider">
                                {inc.category}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  inc.priority === "CRITICAL" || inc.priority === "HIGH"
                                    ? "bg-error/10 text-error border border-error/20"
                                    : "bg-warning/10 text-warning border border-warning/20"
                                }`}
                              >
                                {inc.priority}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-text-secondary">{inc.assignedTo}</td>
                            <td className="p-4 font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                                  inc.status === "OPEN" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                                }`}
                              >
                                {inc.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {inc.status === "OPEN" ? (
                                <button
                                  onClick={() => handleStatusChange(inc.id, "RESOLVED")}
                                  className="px-2 py-1 bg-success hover:bg-success/90 text-white rounded text-[10px] font-bold shadow-xxs transition-all"
                                >
                                  Resolve
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusChange(inc.id, "OPEN")}
                                  className="px-2 py-1 border border-border-default hover:bg-surface-hover text-text-secondary rounded text-[10px] font-bold transition-all"
                                >
                                  Reopen
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Handover Modal */}
              {isHandoverOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
                    <h3 className="text-sm font-bold text-text-primary">Log Shift Handover</h3>
                    <form onSubmit={handleHandoverSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary">Duty Shift</label>
                          <select
                            value={handoverForm.shift}
                            onChange={(e) => setHandoverForm({ ...handoverForm, shift: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          >
                            <option value="Morning to Evening">Morning ➔ Evening</option>
                            <option value="Evening to Night">Evening ➔ Night</option>
                            <option value="Night to Morning">Night ➔ Morning</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary">Cash Reconciled (INR)</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 85000"
                            value={handoverForm.cashReconciled}
                            onChange={(e) => setHandoverForm({ ...handoverForm, cashReconciled: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Incoming Acknowledging Manager</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Vikram Singh"
                          value={handoverForm.incomingManager}
                          onChange={(e) => setHandoverForm({ ...handoverForm, incomingManager: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Open Issues List</label>
                        <textarea
                          rows={2}
                          placeholder="List any pending check-ins or maintenance logs..."
                          value={handoverForm.openIssues}
                          onChange={(e) => setHandoverForm({ ...handoverForm, openIssues: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none placeholder:text-text-muted"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">VIP / VVIP Notes</label>
                        <textarea
                          rows={2}
                          placeholder="Any special guest arrival parameters..."
                          value={handoverForm.vipArrivals}
                          onChange={(e) => setHandoverForm({ ...handoverForm, vipArrivals: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none placeholder:text-text-muted"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsHandoverOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-text-secondary border border-border-default rounded bg-surface"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isActionLoading}
                          className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                        >
                          Submit Handover
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Incident Modal */}
              {isIncidentOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
                    <h3 className="text-sm font-bold text-text-primary">Report Operations Incident</h3>
                    <form onSubmit={handleIncidentSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Incident Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Room 310 water faucet leakage"
                          value={incidentForm.title}
                          onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary">Category</label>
                          <select
                            value={incidentForm.category}
                            onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          >
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="SECURITY">Security Alert</option>
                            <option value="GUEST_COMPLAINT">Guest Complaint</option>
                            <option value="MEDICAL">Medical Emergency</option>
                            <option value="OTHER">Other Misc</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary">Severity Priority</label>
                          <select
                            value={incidentForm.priority}
                            onChange={(e) => setIncidentForm({ ...incidentForm, priority: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Details / Context</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Provide details about the issue..."
                          value={incidentForm.details}
                          onChange={(e) => setIncidentForm({ ...incidentForm, details: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none placeholder:text-text-muted"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Assignee / Technician</label>
                        <input
                          type="text"
                          placeholder="e.g. Chief Plumber"
                          value={incidentForm.assignedTo}
                          onChange={(e) => setIncidentForm({ ...incidentForm, assignedTo: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsIncidentOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-text-secondary border border-border-default rounded bg-surface"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isActionLoading}
                          className="px-4 py-2 text-xs font-bold text-white bg-error hover:bg-error/95 rounded shadow-small"
                        >
                          Report Incident
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

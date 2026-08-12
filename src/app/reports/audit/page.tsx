"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import { getAuditStatusAction, runNightAuditAction, getAuditLogsAction } from "@/app/actions/audit";
import {
  Hotel,
  KeyRound,
  Calendar as CalendarIcon,
  Users,
  Brush,
  BarChart3,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Play,
  History,
  FileText,
  UserCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";

export default function NightAuditPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [businessDate, setBusinessDate] = useState<string>("");
  const [stats, setStats] = useState<any>({
    pendingDeparturesCount: 0,
    pendingArrivalsCount: 0,
    projectedChargesCount: 0,
    projectedRevenueAmount: 0,
    projectedTaxAmount: 0,
  });

  const [pendingDepartures, setPendingDepartures] = useState<any[]>([]);
  const [pendingArrivals, setPendingArrivals] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Roll audit form state
  const [auditorName, setAuditorName] = useState("");
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  useEffect(() => {
    async function loadProperties() {
      setIsLoading(true);
      try {
        const res = await getPropertiesAction();
        if (res.success && res.properties.length > 0) {
          setProperties(res.properties);
          setSelectedPropertyId(res.properties[0].id);
        } else {
          setProperties([]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load properties.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProperties();
  }, []);

  const loadAuditData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const statusRes = await getAuditStatusAction(selectedPropertyId);
      if (statusRes.success) {
        setBusinessDate(statusRes.businessDate ? new Date(statusRes.businessDate).toISOString().split("T")[0] : "");
        setStats(statusRes.stats);
        setPendingDepartures(statusRes.pendingDepartures || []);
        setPendingArrivals(statusRes.pendingArrivals || []);
      }

      const logsRes = await getAuditLogsAction(selectedPropertyId);
      if (logsRes.success) {
        setAuditLogs(logsRes.logs || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load night audit details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadAuditData();
    }
  }, [selectedPropertyId]);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditorName || !selectedPropertyId) return;

    setIsActionLoading(true);
    setIsAuditModalOpen(false);
    setError(null);

    try {
      const res = await runNightAuditAction(selectedPropertyId, auditorName.trim());
      if (res.success) {
        setAuditorName("");
        alert("Night Audit daily roll completed successfully!");
        await loadAuditData();
      }
    } catch (err: any) {
      setError(err.message || "Night audit execution failed.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      {/* 1. Sidebar Nav */}
      <Sidebar />

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="md:hidden font-bold text-primary mr-2">HotelOS</span>
            {properties.length > 0 && (
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="px-3 py-1.5 border border-border-default rounded bg-surface text-xs font-semibold text-text-secondary focus:outline-none"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏨 {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <HeaderStaffSwitcher />
            <button
              onClick={loadAuditData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${isLoading || isActionLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MANAGER"]}>
            <>
              {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-sm text-error flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading Night Audit Desk...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Hotel className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Complete onboarding setup to begin managing nightly rolls.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">Night Audit Operations</h1>
                  <p className="text-sm text-text-secondary">
                    Process daily close reconciliations, post room rates to guest stays, and roll the operational date.
                  </p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Hotel Business Date</div>
                    <div className="text-base font-black text-text-primary tracking-tight">
                      {businessDate || "Not Set"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Checklist and Roll Control */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Roll Checklist Warnings */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                    <h2 className="font-bold text-sm text-text-primary border-b border-border-default pb-3">
                      Audit Rollover Checklist Warnings
                    </h2>

                    <div className="space-y-4">
                      {/* Departures Warning */}
                      <div className="flex items-start space-x-3.5">
                        {stats.pendingDeparturesCount > 0 ? (
                          <>
                            <XCircle className="w-5 h-5 text-error mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-text-primary">
                                Pending Departures ({stats.pendingDeparturesCount})
                              </div>
                              <p className="text-xxs text-text-secondary">
                                Warnings: There are checked-in stays due to check out on {businessDate}. Please settle folios and complete checkout before rolling.
                              </p>
                              <div className="max-h-[120px] overflow-y-auto border border-border-default rounded divide-y divide-border-default bg-surface-secondary/40 p-2 mt-2">
                                {pendingDepartures.map((d) => (
                                  <div key={d.id} className="text-xxs py-1 flex justify-between">
                                    <span className="font-bold text-text-primary">Room {d.room.number} — {d.guests[0]?.firstName} {d.guests[0]?.lastName}</span>
                                    <Link href={`/billing/${d.id}`} className="text-primary hover:underline font-semibold">View Folio</Link>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-text-primary">All Departures Cleared</div>
                              <p className="text-xxs text-text-muted">Zero pending checkout stays remaining today.</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Arrivals Warning */}
                      <div className="flex items-start space-x-3.5 pt-4 border-t border-border-default">
                        {stats.pendingArrivalsCount > 0 ? (
                          <>
                            <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-text-primary">
                                Pending Arrivals ({stats.pendingArrivalsCount})
                              </div>
                              <p className="text-xxs text-text-secondary">
                                Action: Stays scheduled to check in today that have not arrived will be marked as no-show with penalty charges posted to their folios.
                              </p>
                              <div className="max-h-[120px] overflow-y-auto border border-border-default rounded divide-y divide-border-default bg-surface-secondary/40 p-2 mt-2">
                                {pendingArrivals.map((a) => (
                                  <div key={a.id} className="text-xxs py-1">
                                    <span className="font-bold text-text-primary">Room {a.room.number} — {a.guests[0]?.firstName} {a.guests[0]?.lastName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-text-primary">All Arrivals Checked-in</div>
                              <p className="text-xxs text-text-muted">No pending guest check-in reservations remaining today.</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Rollover Action Summary */}
                <div className="space-y-4">
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                    <h2 className="font-bold text-sm text-text-primary border-b border-border-default pb-3">
                      Daily Posting Projections
                    </h2>

                    <div className="space-y-4 text-xs font-semibold">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Rooms to charge:</span>
                        <span className="font-bold text-text-primary">{stats.projectedChargesCount} rooms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Projected Room Revenues:</span>
                        <span className="font-bold text-text-primary">INR {stats.projectedRevenueAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Projected Tax Postings:</span>
                        <span className="font-bold text-text-primary">INR {stats.projectedTaxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border-default pt-4 text-sm font-extrabold">
                        <span className="text-text-primary">Total Projected Run:</span>
                        <span className="text-primary">INR {(stats.projectedRevenueAmount + stats.projectedTaxAmount).toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsAuditModalOpen(true)}
                      disabled={isActionLoading || stats.pendingDeparturesCount > 0}
                      className="w-full py-3 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-text-muted text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all inline-flex justify-center items-center cursor-pointer"
                    >
                      {isActionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing Audit...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" /> Run Daily Night Audit
                        </>
                      )}
                    </button>
                    {stats.pendingDeparturesCount > 0 && (
                      <p className="text-[10px] text-error font-medium text-center">
                        ⚠️ Must clear pending checkouts before running audit close.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Past Close Logs */}
              <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                  <History className="w-5 h-5 text-text-secondary" />
                  <h2 className="font-bold text-sm text-text-primary">Audit Rollover History</h2>
                </div>

                <div className="overflow-x-auto divide-y divide-border-default">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-secondary text-text-muted font-bold uppercase tracking-wider text-[10px] border-b border-border-default">
                        <th className="py-3 px-4">Audit Date</th>
                        <th className="py-3 px-4">Rolled to Date</th>
                        <th className="py-3 px-4">Posted Charges</th>
                        <th className="py-3 px-4">Taxes Posted</th>
                        <th className="py-3 px-4">Revenue Collected</th>
                        <th className="py-3 px-4">Expenses Logged</th>
                        <th className="py-3 px-4">No-shows</th>
                        <th className="py-3 px-4">Audited By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-text-muted">
                            No nightly daily rolls performed in this property history.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-surface-hover/30 transition-all">
                            <td className="py-3 px-4 font-bold text-text-primary">
                              {new Date(log.auditDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              {new Date(log.rolledToDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-bold text-text-primary">
                              INR {log.totalRoomCharges.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              INR {log.totalTaxPosted.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-success font-bold">
                              INR {log.totalRevenue.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-error">
                              INR {log.totalExpenses.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              {log.noShowsProcessed}
                            </td>
                            <td className="py-3 px-4 font-bold">
                              {log.performedBy}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
            </>
          </RoleProtected>
        </main>
      </div>

      {/* Audit execution verification modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <div className="text-center space-y-2">
              <UserCheck className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-bold text-text-primary">Verify Auditor Authorization</h3>
              <p className="text-xs text-text-secondary">
                Rolling operational business date is irreversible. Room rate folio charges will be posted, and pending arrivals transitioned to No-Show.
              </p>
            </div>

            <form onSubmit={handleRunAudit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary block">Auditor Signature (Name / Email)</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 border border-border-default rounded text-sm text-text-secondary hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!auditorName.trim()}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white rounded text-sm font-bold shadow-small"
                >
                  Execute Rollover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

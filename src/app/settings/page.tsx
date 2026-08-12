"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import {
  getStaffMembersAction,
  createShiftAction,
  getShiftsAction,
  getSystemAuditLogsAction,
  createWebhookSubscriptionAction,
  getWebhookSubscriptionsAction,
  createApiKeyAction,
  getApiKeysAction,
} from "@/app/actions/system";
import {
  Hotel,
  Shield,
  Clock,
  History,
  Terminal,
  Plus,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Users,
  CheckCircle,
  Copy,
  Code,
  Key,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";

export default function SettingsPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [staff, setStaff] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"ROSTER" | "LOGS" | "DEVELOPER">("ROSTER");

  // Form states
  const [shiftForm, setShiftForm] = useState({
    userId: "",
    roleName: "FRONT_DESK",
    startTime: "",
    endTime: "",
  });

  const [webhookForm, setWebhookForm] = useState({
    targetUrl: "",
    eventTypes: "guest.checkin,guest.checkout",
  });

  const [apiKeyForm, setApiKeyForm] = useState({
    name: "",
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const loadSettingsData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const staffRes = await getStaffMembersAction(selectedPropertyId);
      if (staffRes.success) {
        setStaff(staffRes.staff || []);
      }

      const shiftsRes = await getShiftsAction(selectedPropertyId);
      if (shiftsRes.success) {
        setShifts(shiftsRes.shifts || []);
      }

      const logsRes = await getSystemAuditLogsAction(selectedPropertyId);
      if (logsRes.success) {
        setAuditLogs(logsRes.logs || []);
      }

      const webhooksRes = await getWebhookSubscriptionsAction(selectedPropertyId);
      if (webhooksRes.success) {
        setWebhooks(webhooksRes.webhooks || []);
      }

      const keysRes = await getApiKeysAction(selectedPropertyId);
      if (keysRes.success) {
        setApiKeys(keysRes.apiKeys || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load settings panels.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadSettingsData();
    }
  }, [selectedPropertyId]);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.userId || !shiftForm.startTime || !shiftForm.endTime || !selectedPropertyId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createShiftAction({
        propertyId: selectedPropertyId,
        userId: shiftForm.userId,
        roleName: shiftForm.roleName,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
      });

      if (res.success) {
        setShiftForm({ userId: "", roleName: "FRONT_DESK", startTime: "", endTime: "" });
        await loadSettingsData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to schedule shift.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookForm.targetUrl || !webhookForm.eventTypes || !selectedPropertyId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createWebhookSubscriptionAction({
        propertyId: selectedPropertyId,
        targetUrl: webhookForm.targetUrl,
        eventTypes: webhookForm.eventTypes,
      });

      if (res.success) {
        setWebhookForm({ targetUrl: "", eventTypes: "guest.checkin,guest.checkout" });
        await loadSettingsData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to subscribe webhook.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyForm.name || !selectedPropertyId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createApiKeyAction({
        propertyId: selectedPropertyId,
        name: apiKeyForm.name,
      });

      if (res.success) {
        setApiKeyForm({ name: "" });
        await loadSettingsData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create API key.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
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
              onClick={loadSettingsData}
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
              <p className="text-sm text-text-secondary">Loading Administration Desk...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Hotel className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Complete onboarding setup to begin configuring system parameters.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">System Settings & Administration</h1>
                <p className="text-sm text-text-secondary">
                  Manage staff roles and shift schedules, inspect live activity logs, and configure API integrations.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border-default space-x-6 text-sm font-medium">
                <button
                  onClick={() => setActiveTab("ROSTER")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "ROSTER"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Staff Roster & Shift Schedules
                </button>
                <button
                  onClick={() => setActiveTab("LOGS")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "LOGS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Activity Audit Logs ({auditLogs.length})
                </button>
                <button
                  onClick={() => setActiveTab("DEVELOPER")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "DEVELOPER"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Developer Portal (API & Webhooks)
                </button>
              </div>

              {/* Tab: Staff Roster & Shifts */}
              {activeTab === "ROSTER" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Schedule Shift Form */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6 self-start">
                    <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <h2 className="font-bold text-sm text-text-primary">Schedule Staff Shift</h2>
                    </div>

                    <form onSubmit={handleCreateShift} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Select Employee</label>
                        <select
                          value={shiftForm.userId}
                          onChange={(e) => setShiftForm({ ...shiftForm, userId: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        >
                          <option value="">Select staff member...</option>
                          {staff.map((s) => (
                            <option key={s.id} value={s.id}>
                              👤 {s.firstName || ""} {s.lastName || ""} ({s.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Assign Shift Role</label>
                        <select
                          value={shiftForm.roleName}
                          onChange={(e) => setShiftForm({ ...shiftForm, roleName: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        >
                          <option value="FRONT_DESK">Front Desk Agent</option>
                          <option value="HOUSEKEEPER">Housekeeper</option>
                          <option value="MAINTENANCE">Maintenance Tech</option>
                          <option value="MANAGER">Shift Supervisor</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Shift Start Time</label>
                        <input
                          type="datetime-local"
                          value={shiftForm.startTime}
                          onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Shift End Time</label>
                        <input
                          type="datetime-local"
                          value={shiftForm.endTime}
                          onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isActionLoading || !shiftForm.userId || !shiftForm.startTime || !shiftForm.endTime}
                        className="w-full py-2 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white text-xs font-bold rounded shadow transition-all inline-flex justify-center items-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Schedule Shift
                      </button>
                    </form>
                  </div>

                  {/* Right: Shifts list & Staff directory */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Active Shifts */}
                    <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                      <h3 className="font-bold text-sm text-text-primary border-b border-border-default pb-3 flex items-center space-x-1.5">
                        <Clock className="w-4.5 h-4.5 text-text-secondary" />
                        <span>Today's Scheduled Shifts ({shifts.length})</span>
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-surface-secondary/60 text-text-muted font-bold uppercase tracking-wider text-[9px] border-b border-border-default">
                              <th className="py-2 px-3">Employee</th>
                              <th className="py-2 px-3">Role</th>
                              <th className="py-2 px-3">Start Time</th>
                              <th className="py-2 px-3">End Time</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                            {shifts.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-text-muted">
                                  No shifts scheduled for this property.
                                </td>
                              </tr>
                            ) : (
                              shifts.map((s) => (
                                <tr key={s.id} className="hover:bg-surface-hover/20">
                                  <td className="py-2 px-3 font-bold text-text-primary">
                                    {s.user?.firstName} {s.user?.lastName}
                                  </td>
                                  <td className="py-2 px-3 font-bold">{s.roleName}</td>
                                  <td className="py-2 px-3">{new Date(s.startTime).toLocaleString()}</td>
                                  <td className="py-2 px-3">{new Date(s.endTime).toLocaleString()}</td>
                                  <td className="py-2 px-3">
                                    <span className="text-[10px] font-bold text-success">● {s.status}</span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Staff Directory */}
                    <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                      <h3 className="font-bold text-sm text-text-primary border-b border-border-default pb-3 flex items-center space-x-1.5">
                        <Users className="w-4.5 h-4.5 text-text-secondary" />
                        <span>Registered Employees Directory ({staff.length})</span>
                      </h3>

                      <div className="divide-y divide-border-default">
                        {staff.map((member) => (
                          <div key={member.id} className="py-3 flex justify-between items-center text-xs">
                            <div>
                              <div className="font-bold text-text-primary">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-[10px] text-text-secondary mt-0.5">{member.email}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                              {member.userRoles[0]?.role?.name || "STAFF"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Activity Logs */}
              {activeTab === "LOGS" && (
                <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                  <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                    <History className="w-5 h-5 text-text-secondary" />
                    <h2 className="font-bold text-sm text-text-primary">Operational Activity Audit Log</h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-secondary text-text-muted font-bold uppercase tracking-wider text-[10px] border-b border-border-default">
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Action</th>
                          <th className="py-3 px-4">Description Details</th>
                          <th className="py-3 px-4">Agent Staff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-text-muted">
                              No activity logs recorded. Trigger a guest check-in or check-out to write log history entries.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-surface-hover/20">
                              <td className="py-3 px-4 font-bold text-text-primary">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 font-black">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-3 px-4">{log.details}</td>
                              <td className="py-3 px-4 font-bold text-text-primary">{log.performedBy}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab: Developer Portal */}
              {activeTab === "DEVELOPER" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Webhook Subscriptions */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                    <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                      <Code className="w-5 h-5 text-primary" />
                      <h2 className="font-bold text-sm text-text-primary">Webhook Notifications</h2>
                    </div>

                    <form onSubmit={handleCreateWebhook} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Target Endpoint URL</label>
                        <input
                          type="url"
                          placeholder="https://your-api.com/webhooks/hotelos"
                          value={webhookForm.targetUrl}
                          onChange={(e) => setWebhookForm({ ...webhookForm, targetUrl: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Subscribed Event Types</label>
                        <input
                          type="text"
                          placeholder="e.g. guest.checkin,guest.checkout"
                          value={webhookForm.eventTypes}
                          onChange={(e) => setWebhookForm({ ...webhookForm, eventTypes: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isActionLoading || !webhookForm.targetUrl}
                        className="w-full py-2 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white text-xs font-bold rounded shadow transition-all inline-flex justify-center items-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Save Webhook URL
                      </button>
                    </form>

                    <div className="border border-border-default rounded divide-y divide-border-default bg-surface-secondary/20">
                      {webhooks.length === 0 ? (
                        <p className="text-xxs text-text-muted p-4 text-center">No webhook subscribers registered.</p>
                      ) : (
                        webhooks.map((w) => (
                          <div key={w.id} className="p-3 text-xxs space-y-1">
                            <div className="font-bold text-text-primary truncate">{w.targetUrl}</div>
                            <div className="text-text-secondary text-[10px]">Events: {w.eventTypes}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: API Keys */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                    <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                      <Key className="w-5 h-5 text-primary" />
                      <h2 className="font-bold text-sm text-text-primary">REST API Developer Keys</h2>
                    </div>

                    <form onSubmit={handleCreateApiKey} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">API Key Name (Label)</label>
                        <input
                          type="text"
                          placeholder="e.g. Channel Manager Integration"
                          value={apiKeyForm.name}
                          onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isActionLoading || !apiKeyForm.name}
                        className="w-full py-2 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white text-xs font-bold rounded shadow transition-all inline-flex justify-center items-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Generate API Key
                      </button>
                    </form>

                    <div className="divide-y divide-border-default border border-border-default rounded bg-surface-secondary/20 max-h-[220px] overflow-y-auto">
                      {apiKeys.length === 0 ? (
                        <p className="text-xxs text-text-muted p-4 text-center">No REST API Keys generated.</p>
                      ) : (
                        apiKeys.map((k) => (
                          <div key={k.id} className="p-3 flex justify-between items-center text-xxs gap-4">
                            <div className="truncate space-y-0.5">
                              <span className="font-bold text-text-primary block">{k.name}</span>
                              <code className="text-[10px] text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded truncate select-all">{k.token}</code>
                            </div>
                            <button
                              onClick={() => copyToClipboard(k.token)}
                              className="px-2 py-1 border border-border-default hover:bg-surface-hover rounded text-[10px] font-bold text-text-secondary flex items-center space-x-1 cursor-pointer shrink-0"
                            >
                              {copiedKey === k.token ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-success" />
                                  <span className="text-success">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
            </>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

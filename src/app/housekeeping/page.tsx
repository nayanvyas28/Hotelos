"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import {
  getHousekeepingOverviewAction,
  updateRoomStatusAction,
  createHousekeepingTaskAction,
  updateHousekeepingTaskAction,
  createMaintenanceLogAction,
  resolveMaintenanceLogAction,
} from "@/app/actions/housekeeping";
import { Hotel, KeyRound, Calendar as CalendarIcon, Users, Brush, ShieldAlert, Wrench, Plus, Check, Loader2, RefreshCw, BarChart3, Utensils, Archive, Sparkles, HeartPulse } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";

import { useSession } from "@/context/SessionContext";

export default function HousekeepingDashboard() {
  const [properties, setProperties] = useState<any[]>([]);
  const { activePropertyId: selectedPropertyId, setActivePropertyId: setSelectedPropertyId } = useSession();

  const [stats, setStats] = useState<any>({
    totalRooms: 0,
    availableCount: 0,
    occupiedCount: 0,
    dirtyCount: 0,
    cleaningCount: 0,
    oosCount: 0,
  });

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [activeMaintenance, setActiveMaintenance] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"ROOMS" | "TASKS" | "MAINTENANCE">("ROOMS");

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    roomId: "",
    assignedTo: "",
    priority: "MEDIUM",
    notes: "",
  });

  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    roomId: "",
    issue: "",
    priority: "MEDIUM",
    isOutOfService: true,
  });

  // Load properties on mount
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

  // Load Housekeeping Overview Data
  const loadOverviewData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const res = await getHousekeepingOverviewAction(selectedPropertyId);
      if (res.success) {
        setStats(res.stats);
        setRooms(res.rooms || []);
        setActiveTasks(res.activeTasks || []);
        setActiveMaintenance(res.activeMaintenance || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load Housekeeping details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadOverviewData();
    }
  }, [selectedPropertyId]);

  // Status handlers
  const handleUpdateRoomStatus = async (roomId: string, newStatus: string) => {
    setIsActionLoading(true);
    try {
      const res = await updateRoomStatusAction(roomId, newStatus);
      if (res.success) {
        await loadOverviewData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update room status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Cleaning tasks handlers
  const handleOpenTask = (rId?: string) => {
    setTaskForm({
      roomId: rId || rooms[0]?.id || "",
      assignedTo: "",
      priority: "MEDIUM",
      notes: "",
    });
    setIsTaskOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.roomId) return;

    setIsActionLoading(true);
    try {
      const res = await createHousekeepingTaskAction(taskForm);
      if (res.success) {
        setIsTaskOpen(false);
        await loadOverviewData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to assign cleaning task.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    setIsActionLoading(true);
    try {
      const res = await updateHousekeepingTaskAction(taskId, newStatus);
      if (res.success) {
        await loadOverviewData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update cleaning task.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Maintenance handlers
  const handleOpenMaintenance = (rId?: string) => {
    setMaintenanceForm({
      roomId: rId || rooms[0]?.id || "",
      issue: "",
      priority: "MEDIUM",
      isOutOfService: true,
    });
    setIsMaintenanceOpen(true);
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceForm.roomId || !maintenanceForm.issue) return;

    setIsActionLoading(true);
    try {
      const res = await createMaintenanceLogAction(maintenanceForm);
      if (res.success) {
        setIsMaintenanceOpen(false);
        await loadOverviewData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to report maintenance issue.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResolveMaintenance = async (logId: string) => {
    if (confirm("Mark this maintenance request resolved? Room status will return to Dirty for inspection.")) {
      setIsActionLoading(true);
      try {
        const res = await resolveMaintenanceLogAction(logId);
        if (res.success) {
          await loadOverviewData();
        }
      } catch (err: any) {
        alert(err.message || "Failed to resolve maintenance.");
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      {/* 1. Sidebar Panel */}
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
              onClick={loadOverviewData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${(isLoading || isActionLoading) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["HOUSEKEEPER", "MANAGER"]}>
            <>
              {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading Housekeeping & Maintenance Dashboard...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Hotel className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Configure floors and rooms first to begin managing housekeeping records.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">Housekeeping & Maintenance</h1>
                  <p className="text-sm text-text-secondary">
                    Assign room cleanings, log maintenance requests, and track real-time room statuses.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenTask()}
                    className="inline-flex justify-center items-center py-2 px-3 border border-border-default rounded text-sm font-semibold text-text-primary hover:bg-surface-hover bg-surface transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Assign Cleaning
                  </button>
                  <button
                    onClick={() => handleOpenMaintenance()}
                    className="inline-flex justify-center items-center py-2 px-3 border border-transparent rounded text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-small transition-all"
                  >
                    <Wrench className="w-4 h-4 mr-1.5" /> Report Issue
                  </button>
                </div>
              </div>

              {/* KPI metrics cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Vacant & Clean</div>
                  <div className="text-2xl font-black text-success mt-1">{stats.availableCount}</div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Occupied</div>
                  <div className="text-2xl font-black text-indigo-500 mt-1">{stats.occupiedCount}</div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Dirty Stays</div>
                  <div className="text-2xl font-black text-error mt-1">{stats.dirtyCount}</div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Cleaning Active</div>
                  <div className="text-2xl font-black text-warning mt-1">{stats.cleaningCount}</div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Out of Service</div>
                  <div className="text-2xl font-black text-slate-500 mt-1">{stats.oosCount}</div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Tabs navigation */}
              <div className="flex border-b border-border-default space-x-6 text-sm font-medium">
                <button
                  onClick={() => setActiveTab("ROOMS")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "ROOMS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Room Grid ({rooms.length})
                </button>
                <button
                  onClick={() => setActiveTab("TASKS")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "TASKS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Active Cleanings ({activeTasks.length})
                </button>
                <button
                  onClick={() => setActiveTab("MAINTENANCE")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "MAINTENANCE"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Active Issues ({activeMaintenance.length})
                </button>
              </div>

              {/* Tabs Content */}
              <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                {activeTab === "ROOMS" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                          <th className="p-4">Room</th>
                          <th className="p-4">Floor</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Status Select</th>
                          <th className="p-4 text-right">Quick Task Options</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {rooms.map((room) => (
                          <tr
                            key={room.id}
                            className={`transition-all hover:bg-surface-secondary/40 ${
                              room.status === "DIRTY"
                                ? "bg-error/5"
                                : room.status === "OUT_OF_SERVICE"
                                ? "bg-slate-800/10"
                                : ""
                            }`}
                          >
                            <td className="p-4 font-mono font-bold text-text-primary">
                              <span className="flex items-center">
                                Room {room.number}
                                {room.status === "DIRTY" && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-error/15 text-error uppercase tracking-wider animate-pulse">
                                    ⚠️ DIRTY
                                  </span>
                                )}
                                {room.status === "OUT_OF_SERVICE" && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-800 text-slate-400 uppercase tracking-wider">
                                    🛠️ OOS
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="p-4 text-text-secondary">Floor {room.floor.number}</td>
                            <td className="p-4 text-text-secondary font-medium">
                              {room.roomType.name}
                            </td>
                            <td className="p-4">
                              <select
                                value={room.status}
                                onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)}
                                disabled={isActionLoading}
                                className={`px-2.5 py-1 border rounded text-xs font-bold bg-surface focus:outline-none ${
                                  room.status === "AVAILABLE"
                                    ? "text-success border-success/20 bg-success/5"
                                    : room.status === "OCCUPIED"
                                    ? "text-indigo-500 border-indigo-500/20 bg-indigo-500/5"
                                    : room.status === "DIRTY"
                                    ? "text-error border-error/20 bg-error/5"
                                    : room.status === "CLEANING"
                                    ? "text-warning border-warning/20 bg-warning/5"
                                    : "text-slate-500 border-slate-300 bg-slate-50"
                                }`}
                              >
                                <option value="AVAILABLE">AVAILABLE (Vacant/Clean)</option>
                                <option value="OCCUPIED">OCCUPIED</option>
                                <option value="DIRTY">DIRTY</option>
                                <option value="CLEANING">CLEANING</option>
                                <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                              </select>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {room.status === "DIRTY" && (
                                <button
                                  onClick={() => handleOpenTask(room.id)}
                                  disabled={isActionLoading}
                                  className="inline-flex items-center px-2.5 py-1 border border-border-default rounded text-xs font-semibold hover:bg-surface-hover text-text-secondary transition-all"
                                >
                                  <Brush className="w-3 h-3 mr-1" /> Assign Clean
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenMaintenance(room.id)}
                                disabled={isActionLoading}
                                className="inline-flex items-center px-2.5 py-1 border border-border-default rounded text-xs font-semibold hover:bg-surface-hover text-text-secondary transition-all"
                              >
                                <Wrench className="w-3 h-3 mr-1" /> Log Issue
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "TASKS" && (
                  <div>
                    {activeTasks.length === 0 ? (
                      <div className="text-center py-16 text-text-secondary">
                        <Check className="w-10 h-10 text-success mx-auto mb-2" />
                        <p className="text-sm font-medium">No active cleaning tasks assigned</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                              <th className="p-4">Room</th>
                              <th className="p-4">Housekeeper</th>
                              <th className="p-4">Priority</th>
                              <th className="p-4">Notes</th>
                              <th className="p-4">Task Status</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default">
                            {activeTasks.map((t) => (
                              <tr key={t.id} className="hover:bg-surface-secondary/40 transition-all">
                                <td className="p-4 font-mono font-bold text-text-primary">Room {t.room.number}</td>
                                <td className="p-4 font-semibold text-text-primary">{t.assignedTo || "Unassigned"}</td>
                                <td className="p-4">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-xxs font-bold border uppercase ${
                                      t.priority === "RUSH"
                                        ? "bg-error/10 text-error border-error/20"
                                        : t.priority === "HIGH"
                                        ? "bg-warning/10 text-warning border-warning/20"
                                        : "bg-success/10 text-success border-success/20"
                                    }`}
                                  >
                                    {t.priority}
                                  </span>
                                </td>
                                <td className="p-4 text-text-secondary text-xs">{t.notes || "—"}</td>
                                <td className="p-4 text-text-secondary font-medium">
                                  <span className="capitalize">{t.status.replace("_", " ")}</span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  {t.status === "PENDING" && (
                                    <button
                                      onClick={() => handleUpdateTaskStatus(t.id, "IN_PROGRESS")}
                                      disabled={isActionLoading}
                                      className="px-3 py-1.5 text-xs font-semibold text-white bg-warning hover:bg-warning/95 rounded shadow-small transition-all"
                                    >
                                      Start Cleaning
                                    </button>
                                  )}
                                  {t.status === "IN_PROGRESS" && (
                                    <button
                                      onClick={() => handleUpdateTaskStatus(t.id, "COMPLETED")}
                                      disabled={isActionLoading}
                                      className="px-3 py-1.5 text-xs font-semibold text-white bg-success hover:bg-success/95 rounded shadow-small transition-all"
                                    >
                                      Mark Clean
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
                )}

                {activeTab === "MAINTENANCE" && (
                  <div>
                    {activeMaintenance.length === 0 ? (
                      <div className="text-center py-16 text-text-secondary">
                        <Check className="w-10 h-10 text-success mx-auto mb-2" />
                        <p className="text-sm font-medium">No active maintenance issues reported</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                              <th className="p-4">Room</th>
                              <th className="p-4">Reported Issue</th>
                              <th className="p-4">Priority</th>
                              <th className="p-4">Out of Service Block?</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default">
                            {activeMaintenance.map((m) => (
                              <tr key={m.id} className="hover:bg-surface-secondary/40 transition-all">
                                <td className="p-4 font-mono font-bold text-text-primary">Room {m.room.number}</td>
                                <td className="p-4 font-semibold text-text-primary">{m.issue}</td>
                                <td className="p-4">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-xxs font-bold border uppercase ${
                                      m.priority === "HIGH"
                                        ? "bg-error/10 text-error border-error/20"
                                        : m.priority === "MEDIUM"
                                        ? "bg-warning/10 text-warning border-warning/20"
                                        : "bg-success/10 text-success border-success/20"
                                    }`}
                                  >
                                    {m.priority}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-xxs font-bold border uppercase ${
                                      m.isOutOfService
                                        ? "bg-error/10 text-error border-error/20"
                                        : "bg-slate-100 text-slate-500 border-slate-200"
                                    }`}
                                  >
                                    {m.isOutOfService ? "YES - blocked" : "NO"}
                                  </span>
                                </td>
                                <td className="p-4 text-text-secondary font-medium">
                                  <span className="capitalize">{m.status.toLowerCase()}</span>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleResolveMaintenance(m.id)}
                                    disabled={isActionLoading}
                                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-success hover:bg-success/95 rounded shadow-small transition-all"
                                  >
                                    Resolve Issue
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
            </>
          </RoleProtected>
        </main>
      </div>

      {/* Assign Task Modal */}
      {isTaskOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary">Assign Cleaning Task</h3>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Select Room</label>
                <select
                  value={taskForm.roomId}
                  onChange={(e) => setTaskForm({ ...taskForm, roomId: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.number} ({r.roomType.code} - {r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Assigned Housekeeper</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="RUSH">Rush / Check-in today</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Special Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Extra pillows required"
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTaskOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Maintenance Modal */}
      {isMaintenanceOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary">Report Maintenance Issue</h3>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Select Room</label>
                <select
                  value={maintenanceForm.roomId}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, roomId: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.number} ({r.roomType.code} - {r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Describe Issue</label>
                <input
                  type="text"
                  placeholder="e.g. Toilet flush leakage, AC not cooling"
                  value={maintenanceForm.issue}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issue: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Priority</label>
                  <select
                    value={maintenanceForm.priority}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="isOutOfService"
                    checked={maintenanceForm.isOutOfService}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, isOutOfService: e.target.checked })
                    }
                    className="w-4.5 h-4.5 accent-primary cursor-pointer"
                  />
                  <label htmlFor="isOutOfService" className="text-xs font-bold text-error cursor-pointer">
                    Block Room (OOS)
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Report Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

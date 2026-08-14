"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { useSession } from "@/context/SessionContext";
import {
  getHRControlTowerStatsAction,
  getEmployeeDirectoryAction,
  createEmployeeRecordAction,
  getDepartmentHierarchyAction,
  getShiftRosterScheduleAction,
  createShiftAssignmentAction,
  getAttendanceLogsAction,
  clockInOutSelfServiceAction,
  getLeaveRequestsAction,
  submitLeaveRequestAction,
  processLeaveApprovalAction,
  getSkillsAndCertificationsAction,
  getPerformanceScorecardsAction,
  getOnboardingChecklistsAction,
  updateOnboardingTaskAction,
  getShiftHandoversAction,
  createShiftHandoverAction,
  getWorkforceForecastAction,
  getEmployeeRelationsCasesAction,
  createEmployeeRelationsCaseAction,
  EmployeeRecord,
  DepartmentHeadcount,
  ShiftRosterItem,
  AttendanceRecord,
  LeaveRequestRecord,
  SkillCertItem,
  PerformanceScorecard,
  OnboardingItem,
  ShiftHandoverItem,
  EmployeeRelationsCase,
} from "@/app/actions/hr";
import {
  Users,
  Clock,
  Calendar,
  Award,
  Briefcase,
  ShieldAlert,
  CheckCircle2,
  UserPlus,
  Plus,
  Search,
  Building2,
  Filter,
  Star,
  FileText,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  X,
  Check,
  Zap,
  TrendingUp,
  FileCheck,
  MessageSquare,
  Package,
} from "lucide-react";

export default function HRWorkforcePage() {
  const { activePropertyId, currentUser } = useSession();

  // Tab State (12 Total Enterprise Tabs)
  const [activeTab, setActiveTab] = useState<
    | "tower"
    | "directory"
    | "hierarchy"
    | "roster"
    | "attendance"
    | "leave"
    | "skills"
    | "performance"
    | "onboarding"
    | "handover"
    | "forecasting"
    | "relations"
  >("tower");

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core Data States
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentHeadcount[]>([]);
  const [shifts, setShifts] = useState<ShiftRosterItem[]>([]);
  const [staffingGaps, setStaffingGaps] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([]);
  const [skillsCerts, setSkillsCerts] = useState<SkillCertItem[]>([]);
  const [scorecards, setScorecards] = useState<PerformanceScorecard[]>([]);

  // Advanced HR Module States
  const [onboardingItems, setOnboardingItems] = useState<OnboardingItem[]>([]);
  const [handovers, setHandovers] = useState<ShiftHandoverItem[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [erCases, setErCases] = useState<EmployeeRelationsCase[]>([]);

  // Forecasting Inputs
  const [occupancyPctInput, setOccupancyPctInput] = useState(85);
  const [banquetPaxInput, setBanquetPaxInput] = useState(250);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("ALL");

  // Modals
  const [isNewEmpModalOpen, setIsNewEmpModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isErModalOpen, setIsErModalOpen] = useState(false);

  // Form States
  const [newEmpForm, setNewEmpForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "Front Desk Agent",
    department: "Front Office",
    salaryBand: "Grade 4",
    skillsString: "Guest Service, PMS",
  });

  const [newShiftForm, setNewShiftForm] = useState({
    employeeId: "",
    shiftName: "MORNING" as "MORNING" | "EVENING" | "NIGHT" | "SPLIT",
    date: new Date().toISOString().split("T")[0],
    startTime: "07:00",
    endTime: "15:30",
  });

  const [newLeaveForm, setNewLeaveForm] = useState({
    employeeId: "",
    leaveType: "ANNUAL" as "ANNUAL" | "SICK" | "CASUAL" | "EMERGENCY" | "MATERNITY" | "UNPAID",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const [newHandoverForm, setNewHandoverForm] = useState({
    department: "Front Office",
    shiftName: "MORNING" as "MORNING" | "EVENING" | "NIGHT",
    outgoingSupervisor: currentUser?.name || "Priya Sharma",
    incomingSupervisor: "Rajesh Malhotra",
    pendingTasksCount: 2,
    vipRoomsNotes: "Suite 501 Ambassador arriving 16:00. Special amenities set.",
    maintenanceIssues: "Room 304 AC check pending.",
  });

  const [newErForm, setNewErForm] = useState({
    employeeName: "",
    department: "Housekeeping",
    category: "POLICY_VIOLATION" as "POLICY_VIOLATION" | "WORKPLACE_CONFLICT" | "SAFETY_INCIDENT" | "GUEST_COMPLAINT",
    severity: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    description: "",
    confidential: true,
  });

  // Load All HR Data
  const loadHRData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        statsRes,
        empRes,
        deptRes,
        shiftRes,
        attRes,
        leaveRes,
        skillsRes,
        perfRes,
        obRes,
        hoRes,
        fcRes,
        erRes,
      ] = await Promise.all([
        getHRControlTowerStatsAction(activePropertyId),
        getEmployeeDirectoryAction(activePropertyId, deptFilter, searchQuery),
        getDepartmentHierarchyAction(activePropertyId),
        getShiftRosterScheduleAction(activePropertyId),
        getAttendanceLogsAction(activePropertyId),
        getLeaveRequestsAction(activePropertyId, leaveStatusFilter),
        getSkillsAndCertificationsAction(activePropertyId),
        getPerformanceScorecardsAction(activePropertyId),
        getOnboardingChecklistsAction(activePropertyId),
        getShiftHandoversAction(activePropertyId),
        getWorkforceForecastAction(occupancyPctInput, banquetPaxInput),
        getEmployeeRelationsCasesAction(activePropertyId),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (empRes.success && empRes.employees) setEmployees(empRes.employees);
      if (deptRes.success && deptRes.departments) setDepartments(deptRes.departments);
      if (shiftRes.success && shiftRes.shifts) {
        setShifts(shiftRes.shifts);
        setStaffingGaps(shiftRes.staffingGaps || []);
      }
      if (attRes.success && attRes.attendance) setAttendance(attRes.attendance);
      if (leaveRes.success && leaveRes.leaveRequests) setLeaveRequests(leaveRes.leaveRequests);
      if (skillsRes.success && skillsRes.items) setSkillsCerts(skillsRes.items);
      if (perfRes.success && perfRes.scorecards) setScorecards(perfRes.scorecards);
      if (obRes.success && obRes.items) setOnboardingItems(obRes.items);
      if (hoRes.success && hoRes.handovers) setHandovers(hoRes.handovers);
      if (fcRes.success && fcRes.forecast) setForecast(fcRes.forecast);
      if (erRes.success && erRes.cases) setErCases(erRes.cases);
    } catch (err: any) {
      setError(err.message || "Failed to load HR Control Tower data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHRData();
  }, [activePropertyId, deptFilter, leaveStatusFilter]);

  // Handlers
  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpForm.firstName || !newEmpForm.email) return;

    setIsActionLoading(true);
    try {
      const res = await createEmployeeRecordAction(newEmpForm);
      if (res.success) {
        setIsNewEmpModalOpen(false);
        setNewEmpForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          position: "Front Desk Agent",
          department: "Front Office",
          salaryBand: "Grade 4",
          skillsString: "Guest Service, PMS",
        });
        await loadHRData();
        alert("Employee account registered successfully!");
      } else {
        alert(res.error || "Failed to register employee.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to register employee.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftForm.employeeId) return;

    setIsActionLoading(true);
    try {
      const res = await createShiftAssignmentAction(newShiftForm);
      if (res.success) {
        setIsShiftModalOpen(false);
        await loadHRData();
        alert("Shift assigned successfully!");
      } else {
        alert(res.error || "Failed to assign shift.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to assign shift.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveForm.employeeId || !newLeaveForm.reason) return;

    setIsActionLoading(true);
    try {
      const res = await submitLeaveRequestAction(newLeaveForm);
      if (res.success) {
        setIsLeaveModalOpen(false);
        setNewLeaveForm({
          employeeId: "",
          leaveType: "ANNUAL",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
          reason: "",
        });
        await loadHRData();
        alert("Leave request submitted!");
      } else {
        alert(res.error || "Failed to submit leave request.");
      }
    } catch (err: any) {
      alert(err.message || "Failed.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResolveLeave = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    setIsActionLoading(true);
    try {
      const res = await processLeaveApprovalAction(
        leaveId,
        status,
        status === "APPROVED" ? "Approved by HR/Manager" : "Declined due to staffing constraint",
        currentUser?.name || "Manager"
      );
      if (res.success) {
        await loadHRData();
        alert(`Leave request ${status.toLowerCase()} successfully.`);
      } else {
        alert(res.error || "Failed to process leave.");
      }
    } catch (err: any) {
      alert(err.message || "Failed.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSelfClock = async (actionType: "CLOCK_IN" | "CLOCK_OUT") => {
    const targetEmpId = employees[0]?.id || "emp-101";
    setIsActionLoading(true);
    try {
      const res = await clockInOutSelfServiceAction(targetEmpId, actionType);
      if (res.success) {
        await loadHRData();
        alert(res.message);
      } else {
        alert(res.error);
      }
    } catch (err: any) {
      alert(err.message || "Clock action failed.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleOnboardingTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      const res = await updateOnboardingTaskAction(taskId, !currentCompleted);
      if (res.success) {
        await loadHRData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await createShiftHandoverAction(newHandoverForm);
      if (res.success) {
        setIsHandoverModalOpen(false);
        await loadHRData();
        alert("Shift Handover log created!");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateErCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newErForm.employeeName || !newErForm.description) return;
    setIsActionLoading(true);
    try {
      const res = await createEmployeeRelationsCaseAction(newErForm);
      if (res.success) {
        setIsErModalOpen(false);
        await loadHRData();
        alert("Employee relations case opened!");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRunForecast = async () => {
    setIsActionLoading(true);
    try {
      const res = await getWorkforceForecastAction(occupancyPctInput, banquetPaxInput);
      if (res.success && res.forecast) {
        setForecast(res.forecast);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-app-bg text-text-primary">
      {/* 1. Sidebar Navigation */}
      <Sidebar />

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="min-h-16 py-3 md:py-0 bg-surface border-b border-border-default px-4 md:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Briefcase className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              HR & Workforce Management System
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <HeaderStaffSwitcher />
            <button
              onClick={loadHRData}
              disabled={isLoading || isActionLoading}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all cursor-pointer"
              title="Refresh HR Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MD", "CFO", "GM", "HR_MANAGER", "HR_COORDINATOR", "FRONT_DESK", "HOUSEKEEPER", "SPA_THERAPIST", "MANAGER"]}>
            <div className="space-y-6">
              {/* Header Title & Actions */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
                    HR & Workforce Management System
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Manage employee lifecycle, shift scheduling, attendance, leave approvals, skills, and performance.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsHandoverModalOpen(true)}
                    className="px-3 py-1.5 bg-surface border border-border-default hover:bg-surface-hover text-xs font-bold rounded shadow-small flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary" /> Shift Handover Log
                  </button>
                  <button
                    onClick={() => setIsLeaveModalOpen(true)}
                    className="px-3 py-1.5 bg-surface border border-border-default hover:bg-surface-hover text-xs font-bold rounded shadow-small flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Apply Leave
                  </button>
                  <button
                    onClick={() => setIsShiftModalOpen(true)}
                    className="px-3 py-1.5 bg-surface border border-border-default hover:bg-surface-hover text-xs font-bold rounded shadow-small flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-primary" /> Assign Shift
                  </button>
                  {(currentUser?.role === "MD" || currentUser?.role === "GM" || currentUser?.role === "HR_MANAGER" || currentUser?.role === "SAAS_OWNER") && (
                    <button
                      onClick={() => setIsNewEmpModalOpen(true)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Register Employee
                    </button>
                  )}
                </div>
              </div>

              {/* 12-Tab Navigation Bar */}
              <div className="flex border-b border-border-default overflow-x-auto text-xs font-bold space-x-6 scrollbar-none">
                {[
                  { id: "tower", label: "Workforce Control Tower", icon: Zap },
                  { id: "directory", label: "Employee Directory", icon: Users },
                  { id: "hierarchy", label: "Org & Positions", icon: Building2 },
                  { id: "roster", label: "Shift Roster & Gaps", icon: Clock },
                  { id: "attendance", label: "Attendance & Tracker", icon: CheckCircle2 },
                  { id: "leave", label: "Leave & Approvals", icon: Calendar },
                  { id: "skills", label: "Skills & Certifications", icon: Award },
                  { id: "performance", label: "Performance Scorecard", icon: Star },
                  { id: "onboarding", label: "Onboarding & Assets", icon: FileCheck },
                  { id: "handover", label: "Shift Handover Log", icon: FileText },
                  { id: "forecasting", label: "Workforce Forecasting", icon: TrendingUp },
                  { id: "relations", label: "Employee Relations", icon: ShieldAlert },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-3 relative transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        active
                          ? "text-primary font-black border-b-2 border-primary"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : "text-text-muted"}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: WORKFORCE CONTROL TOWER */}
              {activeTab === "tower" && (
                <div className="space-y-6 font-sans">
                  {/* Real-Time Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="p-3 bg-surface border border-border-default rounded-lg shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total Headcount</span>
                      <div className="text-xl font-black text-text-primary">{stats?.totalHeadcount || 0}</div>
                      <span className="text-[9px] text-success font-bold">100% Active Ops</span>
                    </div>

                    <div className="p-3 bg-surface border border-border-default rounded-lg shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Present Today</span>
                      <div className="text-xl font-black text-success">{stats?.presentToday || 0}</div>
                      <span className="text-[9px] text-text-muted">Clocked In</span>
                    </div>

                    <div className="p-3 bg-surface border border-border-default rounded-lg shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">On Leave</span>
                      <div className="text-xl font-black text-amber-500">{stats?.onLeaveToday || 0}</div>
                      <span className="text-[9px] text-text-muted">Approved Leaves</span>
                    </div>

                    <div className="p-3 bg-surface border border-border-default rounded-lg shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Staffing Shortages</span>
                      <div className="text-xl font-black text-error">{stats?.criticalStaffingGaps || 0}</div>
                      <span className="text-[9px] text-error font-bold">Requires Action</span>
                    </div>

                    <div className="p-3 bg-surface border border-border-default rounded-lg shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Pending Approvals</span>
                      <div className="text-xl font-black text-primary">{stats?.pendingLeaveCount || 0}</div>
                      <span className="text-[9px] text-text-muted">Leave Applications</span>
                    </div>

                    <div className="p-3 bg-surface border border-border-default rounded-lg shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Expiring Certs</span>
                      <div className="text-xl font-black text-rose-500">{stats?.expiringCertificationsCount || 0}</div>
                      <span className="text-[9px] text-rose-500 font-bold">Due &lt;30 days</span>
                    </div>

                    <div className="p-3 bg-surface border border-border-default rounded-lg shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Open Vacancies</span>
                      <div className="text-xl font-black text-indigo-500">{stats?.openPositionsCount || 0}</div>
                      <span className="text-[9px] text-text-muted">Recruitment Open</span>
                    </div>
                  </div>

                  {/* Staffing Shortages & Recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                      <div className="flex justify-between items-center border-b border-border-default pb-3">
                        <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-error" />
                          <span>Critical Shift Staffing Gap Alerts ({staffingGaps.length})</span>
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-black uppercase">
                          Action Needed
                        </span>
                      </div>

                      <div className="space-y-3">
                        {staffingGaps.map((gap, idx) => (
                          <div key={idx} className="p-4 bg-surface-secondary/40 border border-border-default rounded-lg space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-xs text-text-primary">{gap.shiftName}</span>
                              <span className="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-black">
                                Shortage: -{gap.gapCount} Staff
                              </span>
                            </div>
                            <div className="text-xs text-text-secondary flex gap-4">
                              <span>Required: <strong>{gap.required}</strong></span>
                              <span>Scheduled: <strong>{gap.scheduled}</strong></span>
                            </div>
                            <div className="p-2.5 bg-primary/5 border border-primary/20 rounded text-[11px] text-text-secondary flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-primary block font-bold">AI Recommended Action:</strong>
                                <span>{gap.recommendation}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Clock-In/Out Self-Service Console */}
                    <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                      <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                        <Clock className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold text-text-primary">Attendance Terminal Console</h3>
                      </div>

                      <div className="p-4 bg-surface-secondary/50 rounded-lg text-center space-y-3">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Today's Active Session</span>
                        <div className="text-2xl font-black text-text-primary font-mono">
                          {new Date().toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-text-secondary font-semibold">
                          Staff ID: <strong className="text-primary">{employees[0]?.employeeCode || "EMP-1001"}</strong> ({employees[0]?.firstName || "Priya"})
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleSelfClock("CLOCK_IN")}
                          disabled={isActionLoading}
                          className="py-2.5 px-3 bg-success hover:bg-success-hover text-white text-xs font-extrabold rounded-lg shadow-small flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Clock IN
                        </button>
                        <button
                          onClick={() => handleSelfClock("CLOCK_OUT")}
                          disabled={isActionLoading}
                          className="py-2.5 px-3 bg-slate-700 hover:bg-slate-800 text-white text-xs font-extrabold rounded-lg shadow-small flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" /> Clock OUT
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EMPLOYEE MASTER DIRECTORY */}
              {activeTab === "directory" && (
                <div className="space-y-4 font-sans">
                  {/* Filter & Search Bar */}
                  <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-surface border border-border-default p-4 rounded-lg shadow-small">
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search employee name, code, role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-border-default rounded bg-surface text-text-primary focus:outline-none focus:border-primary font-medium"
                      />
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <div className="flex items-center space-x-1.5">
                        <Filter className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-xs font-bold text-text-secondary">Department:</span>
                      </div>
                      <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="px-3 py-1.5 border border-border-default rounded bg-surface text-xs font-semibold text-text-primary focus:outline-none"
                      >
                        <option value="ALL">All Departments</option>
                        <option value="Front Office">Front Office</option>
                        <option value="Housekeeping">Housekeeping</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Spa & Wellness">Spa & Wellness</option>
                      </select>
                    </div>
                  </div>

                  {/* Employee Directory Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.map((emp) => (
                      <div key={emp.id} className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-3 hover:border-primary/40 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                              {emp.firstName[0]}
                              {emp.lastName[0]}
                            </div>
                            <div>
                              <div className="font-extrabold text-sm text-text-primary">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <span className="text-[10px] font-bold text-primary font-mono">
                                {emp.employeeCode}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              emp.status === "ACTIVE"
                                ? "bg-success/10 text-success border border-success/20"
                                : emp.status === "ON_LEAVE"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-error/10 text-error border border-error/20"
                            }`}
                          >
                            {emp.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-text-secondary border-t border-b border-border-default/60 py-2">
                          <div className="flex justify-between">
                            <span>Position:</span>
                            <strong className="text-text-primary">{emp.position}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Department:</span>
                            <strong className="text-text-primary">{emp.department}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Reports To:</span>
                            <strong className="text-text-primary">{emp.managerName}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Joined:</span>
                            <span>{emp.joiningDate}</span>
                          </div>
                        </div>

                        {/* Skills badges */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-text-muted block">Skills & Qualifications:</span>
                          <div className="flex flex-wrap gap-1">
                            {emp.skills.map((s, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-surface-secondary text-[9px] font-bold text-text-secondary border border-border-default">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ORG & POSITIONS HIERARCHY */}
              {activeTab === "hierarchy" && (
                <div className="space-y-6 font-sans">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                    <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3">
                      Department Headcount Allocation & Vacancy Analysis
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            <th className="p-3">Department</th>
                            <th className="p-3">Department Head</th>
                            <th className="p-3 text-center">Approved Headcount</th>
                            <th className="p-3 text-center">Filled</th>
                            <th className="p-3 text-center">Open Vacancies</th>
                            <th className="p-3">Assigned Sub-Teams</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                          {departments.map((d) => (
                            <tr key={d.id} className="hover:bg-surface-secondary/20">
                              <td className="p-3 font-bold text-text-primary flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" /> {d.name} ({d.code})
                              </td>
                              <td className="p-3 font-semibold">{d.headName}</td>
                              <td className="p-3 text-center font-bold text-text-primary">{d.approvedHeadcount}</td>
                              <td className="p-3 text-center font-bold text-success">{d.filledHeadcount}</td>
                              <td className="p-3 text-center font-bold text-error">
                                {d.vacantHeadcount > 0 ? `+${d.vacantHeadcount}` : "0"}
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {d.teams.map((t, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SHIFT ROSTER & GAPS */}
              {activeTab === "roster" && (
                <div className="space-y-6 font-sans">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                    <div className="flex justify-between items-center border-b border-border-default pb-3">
                      <h3 className="text-sm font-bold text-text-primary">
                        Shift Roster Schedule & Shift Allocations
                      </h3>
                      <button
                        onClick={() => setIsShiftModalOpen(true)}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Schedule New Shift
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            <th className="p-3">Employee Name</th>
                            <th className="p-3">Department</th>
                            <th className="p-3">Shift Type</th>
                            <th className="p-3">Timing</th>
                            <th className="p-3">Shift Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                          {shifts.map((s) => (
                            <tr key={s.id} className="hover:bg-surface-secondary/20">
                              <td className="p-3 font-bold text-text-primary">{s.employeeName}</td>
                              <td className="p-3">{s.department}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase">
                                  {s.shiftName}
                                </span>
                              </td>
                              <td className="p-3 font-mono">{s.startTime} - {s.endTime}</td>
                              <td className="p-3 font-bold text-success">● {s.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ATTENDANCE & TRACKER */}
              {activeTab === "attendance" && (
                <div className="space-y-6 font-sans">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                    <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3">
                      Daily Attendance Log & Exception Tracker
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            <th className="p-3">Employee</th>
                            <th className="p-3">Department</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Clock IN</th>
                            <th className="p-3">Clock OUT</th>
                            <th className="p-3">Attendance Status</th>
                            <th className="p-3 text-right">Overtime</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                          {attendance.map((att) => (
                            <tr key={att.id} className="hover:bg-surface-secondary/20">
                              <td className="p-3 font-bold text-text-primary">{att.employeeName}</td>
                              <td className="p-3">{att.department}</td>
                              <td className="p-3 font-mono">{att.date}</td>
                              <td className="p-3 font-bold text-success">{att.clockIn || "—"}</td>
                              <td className="p-3 font-bold text-text-muted">{att.clockOut || "Active"}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    att.status === "PRESENT"
                                      ? "bg-success/10 text-success"
                                      : att.status === "LATE"
                                      ? "bg-amber-500/10 text-amber-500"
                                      : "bg-error/10 text-error"
                                  }`}
                                >
                                  {att.status}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold font-mono">{att.overtimeHours} hrs</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: LEAVE MANAGEMENT & APPROVALS */}
              {activeTab === "leave" && (
                <div className="space-y-6 font-sans">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                    <div className="flex justify-between items-center border-b border-border-default pb-3">
                      <h3 className="text-sm font-bold text-text-primary">
                        Employee Leave Applications & Manager Approvals
                      </h3>
                      <button
                        onClick={() => setIsLeaveModalOpen(true)}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Submit Leave Application
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            <th className="p-3">Applicant</th>
                            <th className="p-3">Department</th>
                            <th className="p-3">Leave Type</th>
                            <th className="p-3">Dates</th>
                            <th className="p-3">Reason</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                          {leaveRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-surface-secondary/20">
                              <td className="p-3 font-bold text-text-primary">{req.employeeName}</td>
                              <td className="p-3">{req.department}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase">
                                  {req.leaveType} ({req.daysCount} days)
                                </span>
                              </td>
                              <td className="p-3 font-mono">{req.startDate} to {req.endDate}</td>
                              <td className="p-3">{req.reason}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    req.status === "APPROVED"
                                      ? "bg-success/10 text-success"
                                      : req.status === "PENDING"
                                      ? "bg-amber-500/10 text-amber-500"
                                      : "bg-error/10 text-error"
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {req.status === "PENDING" ? (
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => handleResolveLeave(req.id, "REJECTED")}
                                      className="px-2 py-1 text-[10px] font-bold text-error border border-error/20 rounded hover:bg-error/5 cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleResolveLeave(req.id, "APPROVED")}
                                      className="px-2 py-1 text-[10px] font-bold text-white bg-success hover:bg-success-hover rounded shadow-small cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-text-muted">By {req.approvedBy || "Manager"}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: SKILLS & CERTIFICATIONS MATRIX */}
              {activeTab === "skills" && (
                <div className="space-y-6 font-sans">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                    <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-primary" />
                        <span>Employee Skill Inventory & Certification Expiry Matrix</span>
                      </div>
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            <th className="p-3">Employee Name</th>
                            <th className="p-3">Department</th>
                            <th className="p-3">Qualification / Certification Title</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Proficiency / Status</th>
                            <th className="p-3">Expiry Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                          {skillsCerts.map((sc) => (
                            <tr key={sc.id} className="hover:bg-surface-secondary/20">
                              <td className="p-3 font-bold text-text-primary">{sc.employeeName}</td>
                              <td className="p-3">{sc.department}</td>
                              <td className="p-3 font-semibold text-text-primary">{sc.title}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border-default text-[10px] font-bold">
                                  {sc.type}
                                </span>
                              </td>
                              <td className="p-3 font-bold">{sc.proficiencyOrStatus}</td>
                              <td className="p-3 font-mono">
                                {sc.expiryDate ? (
                                  <span className={sc.isExpiringSoon ? "text-error font-bold" : "text-text-secondary"}>
                                    {sc.expiryDate} {sc.isExpiringSoon && "⚠️ Expiring"}
                                  </span>
                                ) : (
                                  "No Expiry"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: PERFORMANCE SCORECARD */}
              {activeTab === "performance" && (
                <div className="space-y-6 font-sans">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                    <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span>Employee Operational Performance Scorecards & KPIs</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {scorecards.map((sc) => (
                        <div key={sc.id} className="bg-surface-secondary/40 border border-border-default rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-extrabold text-sm text-text-primary">{sc.employeeName}</div>
                              <span className="text-[10px] text-text-muted">{sc.position}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-black text-primary">{sc.overallPerformancePct}%</div>
                              <span className="text-[9px] text-success font-bold">Overall Score</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs text-text-secondary border-t border-border-default/60 pt-2">
                            <div className="flex justify-between">
                              <span>Tasks Completed:</span>
                              <strong className="text-text-primary">{sc.tasksCompleted}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>SLA Adherence:</span>
                              <strong className="text-success">{sc.slaAdherencePct}%</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Guest Rating Avg:</span>
                              <strong className="text-amber-500">★ {sc.guestRatingAvg} / 5.0</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Quality Pass Rate:</span>
                              <strong className="text-text-primary">{sc.qualityInspectionScore}%</strong>
                            </div>
                          </div>

                          <p className="text-[10px] text-text-muted italic border-t border-border-default/40 pt-2">
                            "{sc.managerNotes}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: ONBOARDING & ASSETS */}
              {activeTab === "onboarding" && (
                <div className="space-y-6 font-sans">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                    <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-primary" />
                      <span>New Hire Onboarding Checklist & Asset Provisioning</span>
                    </h3>

                    <div className="divide-y divide-border-default">
                      {onboardingItems.map((item) => (
                        <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={() => handleToggleOnboardingTask(item.id, item.isCompleted)}
                              className="w-4 h-4 rounded text-primary border-border-default cursor-pointer"
                            />
                            <div>
                              <span className={`font-bold block ${item.isCompleted ? "line-through text-text-muted" : "text-text-primary"}`}>
                                {item.taskTitle}
                              </span>
                              <span className="text-[10px] text-text-secondary">
                                Employee: <strong>{item.employeeName}</strong> ({item.department})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded bg-surface-secondary text-[10px] font-bold text-text-muted border border-border-default">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-primary font-semibold">Assigned: {item.assignedTo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 10: SHIFT HANDOVER LOG */}
              {activeTab === "handover" && (
                <div className="space-y-6 font-sans">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                    <div className="flex justify-between items-center border-b border-border-default pb-3">
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Shift Handover Logbook & Inter-Shift Notes</span>
                      </h3>
                      <button
                        onClick={() => setIsHandoverModalOpen(true)}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Log Shift Handover
                      </button>
                    </div>

                    <div className="space-y-3">
                      {handovers.map((ho) => (
                        <div key={ho.id} className="p-4 bg-surface-secondary/40 border border-border-default rounded-lg space-y-3 text-xs">
                          <div className="flex justify-between items-start border-b border-border-default/60 pb-2">
                            <div>
                              <span className="font-extrabold text-text-primary">{ho.department} — {ho.shiftName} SHIFT</span>
                              <span className="text-[10px] text-text-muted block">{ho.date}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${ho.acknowledged ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-500"}`}>
                              {ho.acknowledged ? "ACKNOWLEDGED" : "PENDING ACKNOWLEDGEMENT"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-text-secondary">
                            <div className="p-2.5 bg-surface border border-border-default rounded">
                              <strong className="text-primary block font-bold text-[10px] uppercase">VIP Room Notes:</strong>
                              <p className="mt-0.5">{ho.vipRoomsNotes}</p>
                            </div>
                            <div className="p-2.5 bg-surface border border-border-default rounded">
                              <strong className="text-error block font-bold text-[10px] uppercase">Maintenance / Pending Issues:</strong>
                              <p className="mt-0.5">{ho.maintenanceIssues}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-text-muted pt-1">
                            <span>Outgoing: <strong>{ho.outgoingSupervisor}</strong></span>
                            <span>Incoming: <strong>{ho.incomingSupervisor}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 11: WORKFORCE FORECASTING */}
              {activeTab === "forecasting" && (
                <div className="space-y-6 font-sans">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-5">
                    <div className="flex justify-between items-center border-b border-border-default pb-3">
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span>Occupancy-Based Workforce Forecasting & Labor Calculator</span>
                      </h3>
                      <button
                        onClick={handleRunForecast}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isActionLoading ? "animate-spin" : ""}`} /> Recalculate Forecast
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-secondary/40 p-4 rounded-lg border border-border-default">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary block">
                          Forecast Hotel Occupancy Rate: <strong className="text-primary">{occupancyPctInput}%</strong>
                        </label>
                        <input
                          type="range"
                          min={40}
                          max={100}
                          value={occupancyPctInput}
                          onChange={(e) => setOccupancyPctInput(Number(e.target.value))}
                          className="w-full accent-primary cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary block">
                          Banquet / Event Expected Pax: <strong className="text-primary">{banquetPaxInput} Guests</strong>
                        </label>
                        <input
                          type="range"
                          min={50}
                          max={1000}
                          step={50}
                          value={banquetPaxInput}
                          onChange={(e) => setBanquetPaxInput(Number(e.target.value))}
                          className="w-full accent-primary cursor-pointer"
                        />
                      </div>
                    </div>

                    {forecast && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 bg-surface border border-border-default rounded-lg space-y-2">
                          <span className="text-[10px] font-bold text-text-muted uppercase">Required Housekeeping</span>
                          <div className="text-2xl font-black text-text-primary">{forecast.requiredStaffing.housekeeping} Staff</div>
                          <span className="text-[10px] text-text-secondary">Based on {occupancyPctInput}% occupancy</span>
                        </div>

                        <div className="p-4 bg-surface border border-border-default rounded-lg space-y-2">
                          <span className="text-[10px] font-bold text-text-muted uppercase">Required Banquet & F&B</span>
                          <div className="text-2xl font-black text-text-primary">{forecast.requiredStaffing.banquetFB} Staff</div>
                          <span className="text-[10px] text-text-secondary">Based on {banquetPaxInput} banquet guests</span>
                        </div>

                        <div className="p-4 bg-surface border border-border-default rounded-lg space-y-2">
                          <span className="text-[10px] font-bold text-text-muted uppercase">Total Labor Forecast</span>
                          <div className="text-2xl font-black text-primary">{forecast.requiredStaffing.total} Staff Needed</div>
                          <span className="text-[10px] text-error font-bold">Shortage: -{forecast.shortageCount} Staff</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 12: EMPLOYEE RELATIONS */}
              {activeTab === "relations" && (
                <div className="space-y-6 font-sans">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                    <div className="flex justify-between items-center border-b border-border-default pb-3">
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-error" />
                        <span>Employee Relations & Workplace Incident Cases (Confidential)</span>
                      </h3>
                      <button
                        onClick={() => setIsErModalOpen(true)}
                        className="px-3 py-1.5 bg-error hover:bg-error/90 text-white text-xs font-bold rounded shadow-small flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Log Relations Case
                      </button>
                    </div>

                    <div className="space-y-3">
                      {erCases.map((c) => (
                        <div key={c.id} className="p-4 bg-surface-secondary/40 border border-border-default rounded-lg space-y-2 text-xs">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-black font-mono">
                                {c.caseNumber}
                              </span>
                              <span className="font-bold text-text-primary">{c.employeeName} ({c.department})</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase">
                              {c.status}
                            </span>
                          </div>
                          <p className="text-text-secondary">{c.description}</p>
                          {c.resolutionNotes && (
                            <div className="p-2 bg-surface border border-border-default rounded text-[10px] text-text-muted italic">
                              Resolution Notes: "{c.resolutionNotes}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </RoleProtected>
        </main>
      </div>

      {/* MODAL: Register New Employee */}
      {isNewEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border-default pb-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Register New Employee
              </h3>
              <button onClick={() => setIsNewEmpModalOpen(false)} className="text-text-muted hover:text-text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">First Name</label>
                  <input
                    type="text"
                    required
                    value={newEmpForm.firstName}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Last Name</label>
                  <input
                    type="text"
                    value={newEmpForm.lastName}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Login Email</label>
                <input
                  type="email"
                  required
                  value={newEmpForm.email}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Department</label>
                  <select
                    value={newEmpForm.department}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  >
                    <option value="Human Resources">👔 Human Resources (HR)</option>
                    <option value="Front Office">🛎️ Front Office</option>
                    <option value="Housekeeping">🧹 Housekeeping</option>
                    <option value="Engineering">🔧 Engineering & Maintenance</option>
                    <option value="Food & Beverage">🍽️ Food & Beverage</option>
                    <option value="Spa & Wellness">💆 Spa & Wellness</option>
                    <option value="Executive Management">🏢 Executive Management</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Position Title</label>
                  <input
                    type="text"
                    value={newEmpForm.position}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Skills & Qualifications (Comma separated)</label>
                <input
                  type="text"
                  value={newEmpForm.skillsString}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, skillsString: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEmpModalOpen(false)}
                  className="px-4 py-2 border border-border-default rounded hover:bg-surface-hover font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-small cursor-pointer"
                >
                  Register Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Shift */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border-default pb-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Assign Staff Shift Roster
              </h3>
              <button onClick={() => setIsShiftModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Select Employee</label>
                <select
                  required
                  value={newShiftForm.employeeId}
                  onChange={(e) => setNewShiftForm({ ...newShiftForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.position} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Shift Type</label>
                  <select
                    value={newShiftForm.shiftName}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, shiftName: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="MORNING">MORNING (07:00 - 15:30)</option>
                    <option value="EVENING">EVENING (15:00 - 23:30)</option>
                    <option value="NIGHT">NIGHT (23:00 - 07:30)</option>
                    <option value="SPLIT">SPLIT SHIFT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Shift Date</label>
                  <input
                    type="date"
                    required
                    value={newShiftForm.date}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newShiftForm.startTime}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">End Time</label>
                  <input
                    type="time"
                    required
                    value={newShiftForm.endTime}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2 border border-border-default rounded hover:bg-surface-hover font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-small cursor-pointer"
                >
                  {isActionLoading ? "Assigning..." : "Assign Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Apply Leave */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border-default pb-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-warning" /> Submit Staff Leave Request
              </h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Employee</label>
                <select
                  required
                  value={newLeaveForm.employeeId}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Leave Type</label>
                <select
                  value={newLeaveForm.leaveType}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, leaveType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                >
                  <option value="ANNUAL">ANNUAL LEAVE</option>
                  <option value="SICK">SICK LEAVE</option>
                  <option value="CASUAL">CASUAL LEAVE</option>
                  <option value="EMERGENCY">EMERGENCY LEAVE</option>
                  <option value="MATERNITY">MATERNITY LEAVE</option>
                  <option value="UNPAID">UNPAID LEAVE</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.startDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">End Date</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.endDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Reason / Justification</label>
                <textarea
                  required
                  rows={3}
                  value={newLeaveForm.reason}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value })}
                  placeholder="Reason for leave request..."
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 border border-border-default rounded hover:bg-surface-hover font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-small cursor-pointer"
                >
                  {isActionLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Shift Handover */}
      {isHandoverModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border-default pb-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Create Shift Handover Log
              </h3>
              <button onClick={() => setIsHandoverModalOpen(false)} className="text-text-muted hover:text-text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHandover} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Department</label>
                  <select
                    value={newHandoverForm.department}
                    onChange={(e) => setNewHandoverForm({ ...newHandoverForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  >
                    <option value="Front Office">Front Office</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Shift</label>
                  <select
                    value={newHandoverForm.shiftName}
                    onChange={(e) => setNewHandoverForm({ ...newHandoverForm, shiftName: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  >
                    <option value="MORNING">MORNING</option>
                    <option value="EVENING">EVENING</option>
                    <option value="NIGHT">NIGHT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">VIP Room Notes</label>
                <textarea
                  rows={2}
                  value={newHandoverForm.vipRoomsNotes}
                  onChange={(e) => setNewHandoverForm({ ...newHandoverForm, vipRoomsNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Maintenance / Pending Issues</label>
                <textarea
                  rows={2}
                  value={newHandoverForm.maintenanceIssues}
                  onChange={(e) => setNewHandoverForm({ ...newHandoverForm, maintenanceIssues: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 border border-border-default rounded hover:bg-surface-hover font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-small cursor-pointer"
                >
                  Submit Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Employee Relations Case */}
      {isErModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border-default pb-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-error" /> Log Employee Relations Case
              </h3>
              <button onClick={() => setIsErModalOpen(false)} className="text-text-muted hover:text-text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateErCase} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Employee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff Member"
                  value={newErForm.employeeName}
                  onChange={(e) => setNewErForm({ ...newErForm, employeeName: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Category</label>
                  <select
                    value={newErForm.category}
                    onChange={(e) => setNewErForm({ ...newErForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  >
                    <option value="POLICY_VIOLATION">POLICY VIOLATION</option>
                    <option value="WORKPLACE_CONFLICT">WORKPLACE CONFLICT</option>
                    <option value="SAFETY_INCIDENT">SAFETY INCIDENT</option>
                    <option value="GUEST_COMPLAINT">GUEST COMPLAINT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Severity</label>
                  <select
                    value={newErForm.severity}
                    onChange={(e) => setNewErForm({ ...newErForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Incident Description</label>
                <textarea
                  required
                  rows={3}
                  value={newErForm.description}
                  onChange={(e) => setNewErForm({ ...newErForm, description: e.target.value })}
                  placeholder="Provide confidential case details..."
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsErModalOpen(false)}
                  className="px-4 py-2 border border-border-default rounded hover:bg-surface-hover font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-error hover:bg-error/90 text-white font-bold rounded shadow-small cursor-pointer"
                >
                  Log Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

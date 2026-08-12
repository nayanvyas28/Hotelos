"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import { getDashboardStatsAction, getGroupDashboardStatsAction } from "@/app/actions/dashboard";
import {
  Hotel,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Users,
  MapPin,
  Calendar,
  KeyRound,
  Brush,
  Utensils,
  Sparkles,
  HeartPulse,
  Clock,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Loader2,
  AlertTriangle,
  FileText,
  Server,
  Shield,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { getSaaSOverviewAction } from "@/app/actions/saasAdmin";

export default function Home() {
  const { currentUser, activePropertyId } = useSession();

  // General States
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any | null>(null);
  const [groupStats, setGroupStats] = useState<any | null>(null);
  const [saasData, setSaasData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (currentUser?.role === "SAAS_OWNER") {
        const resSaas = await getSaaSOverviewAction();
        if (resSaas.success) {
          setSaasData(resSaas);
        } else {
          setError(resSaas.error || "Failed to load SaaS platform metrics.");
        }
      } else if (currentUser?.role === "MD" || currentUser?.role === "CFO") {
        const res = await getGroupDashboardStatsAction();
        if (res.success) {
          setGroupStats(res.groupStats);
        } else {
          setError(res.error || "Failed to load corporate summary.");
        }
      }
      
      // Load individual property stats for GM, Front Desk, Housekeeper, Spa, or active MD location view
      if (currentUser?.role !== "SAAS_OWNER") {
        const resProp = await getDashboardStatsAction(activePropertyId);
        if (resProp.success) {
          setStats(resProp.stats);
        } else {
          setError(resProp.error || "Failed to load location metrics.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, activePropertyId]);

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-surface-secondary text-xxs font-bold text-text-secondary rounded border border-border-default uppercase tracking-wider">
              {currentUser.role} CONSOLE
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <HeaderStaffSwitcher />
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-text-secondary">Loading personal console...</p>
          </div>
        ) : error ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-4">
            <div className="bg-error/10 border border-error/20 p-4 rounded-lg flex items-center space-x-3 max-w-md">
              <AlertTriangle className="w-6 h-6 text-error shrink-0" />
              <span className="text-sm text-error">{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 text-xs font-bold bg-primary text-white rounded hover:bg-primary-hover shadow-small"
            >
              Retry
            </button>
          </div>
        ) : (
          <main className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Greetings Bar */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                Welcome back, {currentUser.name}!
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                {currentUser.role === "SAAS_OWNER"
                  ? "SaaS Developer Workspace & Multi-Tenant Control Hub."
                  : currentUser.role === "MD" || currentUser.role === "CFO"
                  ? "Corporate Enterprise Overview & Multi-Property Performance Index."
                  : `Managing operations at Radisson Palace location.`}
              </p>
            </div>

            {/* Render Dashboard based on Role */}
            {currentUser.role === "SAAS_OWNER" && saasData && (
              <SaaSDeveloperDashboard saasData={saasData} />
            )}

            {(currentUser.role === "MD" || currentUser.role === "CFO") && groupStats && (
              <CorporateDashboard groupStats={groupStats} stats={stats} />
            )}

            {currentUser.role === "GM" && stats && (
              <GMDashboard stats={stats} />
            )}

            {currentUser.role === "FRONT_DESK" && stats && (
              <FrontDeskDashboard stats={stats} />
            )}

            {currentUser.role === "HOUSEKEEPER" && stats && (
              <HousekeeperDashboard stats={stats} />
            )}

            {currentUser.role === "SPA_THERAPIST" && stats && (
              <SpaDashboard stats={stats} />
            )}
          </main>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 1. Corporate Executive Dashboard View (MD / CFO)
// ----------------------------------------------------
function CorporateDashboard({ groupStats, stats }: { groupStats: any; stats: any }) {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Group Total Revenue</span>
            <span className="p-2 rounded bg-success/10 text-success"><DollarSign className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">INR {groupStats.totalGroupRevenue.toFixed(2)}</div>
            <p className="text-xxs text-text-secondary mt-1 flex items-center text-success">
              <TrendingUp className="w-3 h-3 mr-1" /> +12.4% vs last quarter
            </p>
          </div>
        </div>

        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Group Average Occupancy</span>
            <span className="p-2 rounded bg-primary-light text-primary"><Percent className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">{groupStats.groupOccupancy}%</div>
            <p className="text-xxs text-text-secondary mt-1 flex items-center text-success">
              <TrendingUp className="w-3 h-3 mr-1" /> +3.2% vs last month
            </p>
          </div>
        </div>

        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Group Total Rooms</span>
            <span className="p-2 rounded bg-indigo-500/10 text-indigo-500"><Hotel className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">{groupStats.totalGroupRooms} Rooms</div>
            <p className="text-xxs text-text-secondary mt-1">{groupStats.totalGroupOccupied} currently occupied</p>
          </div>
        </div>

        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Active Locations</span>
            <span className="p-2 rounded bg-warning/10 text-warning"><MapPin className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">{groupStats.propertySummaries.length} Hotels</div>
            <p className="text-xxs text-text-secondary mt-1">Operating in Asia/Kolkata Timezone</p>
          </div>
        </div>
      </div>

      {/* Property Ranking Comparison Table */}
      <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
        <div className="p-4 border-b border-border-default flex justify-between items-center">
          <h3 className="text-sm font-bold text-text-primary">Multi-Property Group Performance</h3>
          <span className="text-xs text-text-muted">Global Hierarchy View</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                <th className="p-4">Hotel Property</th>
                <th className="p-4">Occupancy Rate</th>
                <th className="p-4">ADR (Average Daily Rate)</th>
                <th className="p-4">RevPAR</th>
                <th className="p-4 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {groupStats.propertySummaries.map((p: any, idx: number) => (
                <tr key={p.id} className="hover:bg-surface-secondary/40 transition-all">
                  <td className="p-4 font-bold text-text-primary flex items-center space-x-2">
                    <span className="w-5 h-5 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{p.name}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-text-secondary">{p.occupancy}%</span>
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${p.occupancy}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-text-secondary">INR {p.adr.toFixed(2)}</td>
                  <td className="p-4 font-mono text-text-secondary">INR {p.revPar.toFixed(2)}</td>
                  <td className="p-4 text-right font-black text-success font-mono">INR {p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exception-first alert notifications */}
      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-3">
        <h3 className="text-xs font-black uppercase text-text-muted tracking-wider">Exception-First Risk Alerts</h3>
        <div className="space-y-2">
          <div className="p-3 bg-error/10 border border-error/20 rounded flex items-center justify-between text-xs text-error">
            <span className="font-semibold">⚠️ Occupancy alert: London branch fell below 70% threshold</span>
            <Link href="/reports" className="font-bold underline hover:text-error/85 transition-all">Drill down</Link>
          </div>
          <div className="p-3 bg-warning/10 border border-warning/20 rounded flex items-center justify-between text-xs text-warning">
            <span className="font-semibold">⚠️ Pending Night Audits require manager roll verification</span>
            <Link href="/reports/audit" className="font-bold underline hover:text-warning/85 transition-all">Review logs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. Property General Manager (GM) Dashboard View
// ----------------------------------------------------
function GMDashboard({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      {/* Property metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Property Occupancy</span>
            <span className="p-2 rounded bg-primary-light text-primary"><Percent className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">
              {stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}%
            </div>
            <p className="text-xxs text-text-secondary mt-1">{stats.occupiedRooms} of {stats.totalRooms} rooms occupied</p>
          </div>
        </div>

        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">In-House Stays</span>
            <span className="p-2 rounded bg-indigo-500/10 text-indigo-500"><Users className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">{stats.inHouseCount} guests</div>
            <p className="text-xxs text-text-secondary mt-1">{stats.checkedOutCount} checked out today</p>
          </div>
        </div>

        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Housekeeping Backlog</span>
            <span className="p-2 rounded bg-error/10 text-error"><Brush className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">{stats.pendingTasksCount} tasks</div>
            <p className="text-xxs text-text-secondary mt-1">{stats.dirtyRooms} dirty rooms waiting</p>
          </div>
        </div>

        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Property Revenue</span>
            <span className="p-2 rounded bg-success/10 text-success"><DollarSign className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">INR {stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xxs text-text-secondary mt-1">Reconciled this business date</p>
          </div>
        </div>
      </div>

      {/* Control tower and shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Property Room status Control Tower</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 border border-border-default rounded bg-surface-secondary">
              <div className="text-2xl font-extrabold text-success">{stats.vacantRooms}</div>
              <div className="text-xxs font-semibold text-text-secondary uppercase mt-1">Vacant / Clean</div>
            </div>
            <div className="p-4 border border-border-default rounded bg-surface-secondary">
              <div className="text-2xl font-extrabold text-warning">{stats.occupiedRooms}</div>
              <div className="text-xxs font-semibold text-text-secondary uppercase mt-1">Occupied</div>
            </div>
            <div className="p-4 border border-border-default rounded bg-surface-secondary">
              <div className="text-2xl font-extrabold text-error">{stats.dirtyRooms}</div>
              <div className="text-xxs font-semibold text-text-secondary uppercase mt-1">Dirty</div>
            </div>
            <div className="p-4 border border-border-default rounded bg-surface-secondary">
              <div className="text-2xl font-extrabold text-text-muted">{stats.maintenanceRooms}</div>
              <div className="text-xxs font-semibold text-text-secondary uppercase mt-1">Maintenance</div>
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Quick Shortcuts</h3>
            <p className="text-xs text-text-secondary mt-1">Execute immediate operational actions.</p>
          </div>
          <div className="space-y-2">
            <Link
              href="/reports/audit"
              className="flex items-center justify-between p-3 border border-border-default rounded hover:bg-surface-hover text-xs font-semibold text-text-primary transition-all"
            >
              <span>Run Night Audit Roll</span>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
            <Link
              href="/reports/rates"
              className="flex items-center justify-between p-3 border border-border-default rounded hover:bg-surface-hover text-xs font-semibold text-text-primary transition-all"
            >
              <span>Manage Pricing Rates</span>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. Front Desk Agent Dashboard View
// ----------------------------------------------------
function FrontDeskDashboard({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Front Office Daily Desk</h2>
          <p className="text-xs text-text-secondary">Track guest bookings, checked-in stays, and room statuses.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-border-default rounded bg-surface-secondary flex items-center space-x-3">
            <span className="p-2 rounded bg-primary-light text-primary"><Users className="w-5 h-5" /></span>
            <div>
              <div className="text-lg font-black text-text-primary">{stats.inHouseCount}</div>
              <span className="text-xxs font-bold text-text-muted uppercase">In-House Stays</span>
            </div>
          </div>
          <div className="p-4 border border-border-default rounded bg-surface-secondary flex items-center space-x-3">
            <span className="p-2 rounded bg-success/10 text-success"><CheckCircle2 className="w-5 h-5" /></span>
            <div>
              <div className="text-lg font-black text-text-primary">{stats.vacantRooms}</div>
              <span className="text-xxs font-bold text-text-muted uppercase">Clean Rooms Ready</span>
            </div>
          </div>
          <div className="p-4 border border-border-default rounded bg-surface-secondary flex items-center space-x-3">
            <span className="p-2 rounded bg-error/10 text-error"><AlertTriangle className="w-5 h-5" /></span>
            <div>
              <div className="text-lg font-black text-text-primary">{stats.dirtyRooms}</div>
              <span className="text-xxs font-bold text-text-muted uppercase">Dirty Checkout Rooms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Front desk shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          href="/frontdesk"
          className="bg-surface border border-border-default hover:border-primary/50 p-6 rounded-lg shadow-small flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-all">Arrivals & Departures Desk</h3>
            <p className="text-xs text-text-secondary">Check-in check-out, record room allocations, and guest registration card scanning.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-all" />
        </Link>

        <Link
          href="/reservations/calendar"
          className="bg-surface border border-border-default hover:border-primary/50 p-6 rounded-lg shadow-small flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-all">Room Booking Grid Calendar</h3>
            <p className="text-xs text-text-secondary">View hotel room occupancy layout and timeline of upcoming bookings.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-all" />
        </Link>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. Housekeeper Dashboard View
// ----------------------------------------------------
function HousekeeperDashboard({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Housekeeping Assignments Desk</h2>
          <p className="text-xs text-text-secondary">Manage room status, clean vs dirty, and complete scheduled room preparation checklists.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-border-default rounded bg-surface-secondary flex items-center space-x-3">
            <span className="p-2 rounded bg-error/10 text-error"><Brush className="w-5 h-5" /></span>
            <div>
              <div className="text-lg font-black text-text-primary">{stats.dirtyRooms}</div>
              <span className="text-xxs font-bold text-text-muted uppercase">Dirty Rooms waiting</span>
            </div>
          </div>
          <div className="p-4 border border-border-default rounded bg-surface-secondary flex items-center space-x-3">
            <span className="p-2 rounded bg-warning/10 text-warning"><Clock className="w-5 h-5" /></span>
            <div>
              <div className="text-lg font-black text-text-primary">{stats.pendingTasksCount}</div>
              <span className="text-xxs font-bold text-text-muted uppercase">Pending Tickets</span>
            </div>
          </div>
          <div className="p-4 border border-border-default rounded bg-surface-secondary flex items-center space-x-3">
            <span className="p-2 rounded bg-success/10 text-success"><CheckCircle2 className="w-5 h-5" /></span>
            <div>
              <div className="text-lg font-black text-text-primary">{stats.vacantRooms}</div>
              <span className="text-xxs font-bold text-text-muted uppercase">Clean Rooms Ready</span>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/housekeeping"
        className="bg-surface border border-border-default hover:border-primary/50 p-6 rounded-lg shadow-small flex items-center justify-between group transition-all"
      >
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-all font-sans">
            Go to Task Roster Checklists
          </h3>
          <p className="text-xs text-text-secondary">Acknowledge assignments, change room status, and submit clean confirmations.</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-all" />
      </Link>
    </div>
  );
}

// ----------------------------------------------------
// 5. Spa Therapist Dashboard View
// ----------------------------------------------------
function SpaDashboard({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Spa Specialist Dashboard</h2>
          <p className="text-xs text-text-secondary">Track spa treatment reservations, guest health profiles, and specialization roster.</p>
        </div>
        <div className="flex items-center space-x-3 p-4 bg-primary/10 border border-primary/20 rounded">
          <HeartPulse className="w-5 h-5 text-primary shrink-0" />
          <span className="text-xs text-primary font-semibold">Active duty assignment: Generalist Treatments</span>
        </div>
      </div>

      <Link
        href="/spa"
        className="bg-surface border border-border-default hover:border-primary/50 p-6 rounded-lg shadow-small flex items-center justify-between group transition-all"
      >
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-all">
            Go to Spa treatment bookings
          </h3>
          <p className="text-xs text-text-secondary">View hourly appointments, record therapist details, and charge treatments directly to room folio.</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-all" />
      </Link>
    </div>
  );
}

// ----------------------------------------------------
// 6. SaaS Developer / Platform Owner Dashboard View (SAAS_OWNER)
// ----------------------------------------------------
function SaaSDeveloperDashboard({ saasData }: { saasData: any }) {
  const { stats, properties, organizations } = saasData;

  return (
    <div className="space-y-6">
      {/* 4 Premium SaaS Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
        {/* Total Client Organizations */}
        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Client Tenant Groups</span>
            <span className="p-2 rounded bg-indigo-500/10 text-indigo-500"><Users className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">{organizations?.length || 0} Organizations</div>
            <p className="text-xxs text-text-secondary mt-1">Hired multi-tenant software groups</p>
          </div>
        </div>

        {/* Live Hotel Licenses */}
        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Active Hotel Instances</span>
            <span className="p-2 rounded bg-primary-light text-primary"><Hotel className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">{properties?.length || 0} Locations</div>
            <p className="text-xxs text-text-secondary mt-1">Live active property instances</p>
          </div>
        </div>

        {/* Monthly Recurring Revenue (MRR) */}
        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Monthly Recurring Revenue</span>
            <span className="p-2 rounded bg-success/10 text-success"><DollarSign className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">USD {stats?.mrr || 0}</div>
            <p className="text-xxs text-text-secondary mt-1 flex items-center text-success">
              <TrendingUp className="w-3 h-3 mr-1" /> Churn rate: {stats?.churnRate || "0%"}
            </p>
          </div>
        </div>

        {/* API Gateway Status */}
        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">API Gateway Health</span>
            <span className="p-2 rounded bg-rose-500/10 text-rose-500"><Activity className="w-5 h-5" /></span>
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary">{stats?.apiLoad || "100%"}</div>
            <p className="text-xxs text-text-secondary mt-1">Uptime SLA limit</p>
          </div>
        </div>
      </div>

      {/* Redirect Link to SaaS Control Tower */}
      <Link
        href="/reports/super-admin"
        className="bg-indigo-600/5 border border-indigo-500/20 hover:border-indigo-500 p-6 rounded-lg shadow-small flex items-center justify-between group transition-all"
      >
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-indigo-900 group-hover:text-indigo-600 transition-all font-sans">
            Open SaaS Control Tower Settings
          </h3>
          <p className="text-xs text-text-secondary">Provision new tenant hotels, toggle software modules, input custom database connection URLs, and check global MDM sync logs.</p>
        </div>
        <ArrowRight className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-all" />
      </Link>
    </div>
  );
}

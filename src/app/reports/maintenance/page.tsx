"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { Settings, Wrench, Calendar, CheckCircle2, AlertTriangle, Clock, Plus } from "lucide-react";

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<"SCHEDULED" | "COMPLETED">("SCHEDULED");

  const maintenanceTasks = [
    {
      id: "m_1",
      equipment: "HVAC Compressor System",
      location: "West Wing Plant Room 4",
      lastService: "2026-06-15",
      nextService: "2026-09-15",
      frequency: "Quarterly",
      status: "SCHEDULED",
      assignedTo: "Technician Rajesh",
    },
    {
      id: "m_2",
      equipment: "Corridor Fire Extinguishers",
      location: "Floors 1-5 Lift Corridors",
      lastService: "2026-02-10",
      nextService: "2026-08-20",
      frequency: "Half-Yearly",
      status: "SCHEDULED",
      assignedTo: "Security Guard Sunil",
    },
    {
      id: "m_3",
      equipment: "Main Pool Filtration Pump",
      location: "Garden Courtyard filtration room",
      lastService: "2026-07-01",
      nextService: "2026-08-01",
      frequency: "Monthly",
      status: "COMPLETED",
      assignedTo: "Plumber technician",
    },
  ];

  const currentList = maintenanceTasks.filter((t) =>
    activeTab === "SCHEDULED" ? t.status === "SCHEDULED" : t.status === "COMPLETED"
  );

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">Preventive Maintenance Desk</h2>
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MD", "GM"]}>
            <>
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary">Engineering Maintenance</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Manage recurring maintenance schedules, prevent equipment downtime, and review compliance inspection tasks.
                  </p>
                </div>
                <button
                  onClick={() => alert("Engineering creation form is a sandbox placeholder.")}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Schedule Maintenance
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border-default space-x-4">
                <button
                  onClick={() => setActiveTab("SCHEDULED")}
                  className={`py-2 text-xs font-bold border-b-2 px-1 transition-all ${
                    activeTab === "SCHEDULED"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Scheduled Inspection ({maintenanceTasks.filter((t) => t.status === "SCHEDULED").length})
                </button>
                <button
                  onClick={() => setActiveTab("COMPLETED")}
                  className={`py-2 text-xs font-bold border-b-2 px-1 transition-all ${
                    activeTab === "COMPLETED"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Completed Log ({maintenanceTasks.filter((t) => t.status === "COMPLETED").length})
                </button>
              </div>

              {/* Grid List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-surface border border-border-default rounded-lg p-5 shadow-small flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          🛠️ {item.frequency}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            item.status === "SCHEDULED" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-text-primary">{item.equipment}</h3>
                      <div className="text-xs text-text-secondary space-y-1">
                        <p>📍 Location: <span className="font-semibold text-text-primary">{item.location}</span></p>
                        <p>👤 Assignee: <span className="font-semibold text-text-primary">{item.assignedTo}</span></p>
                      </div>
                    </div>

                    <div className="border-t border-border-default pt-4 grid grid-cols-2 gap-4 text-[10px] text-text-muted">
                      <div>
                        <span className="block font-semibold uppercase">Last Serviced</span>
                        <span className="text-xs font-bold text-text-secondary mt-0.5 block">{item.lastService}</span>
                      </div>
                      <div>
                        <span className="block font-semibold uppercase">Next Inspection</span>
                        <span className="text-xs font-bold text-text-secondary mt-0.5 block">{item.nextService}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

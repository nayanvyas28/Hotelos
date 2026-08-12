"use client";

import React, { useState } from "react";
import { useSession } from "@/context/SessionContext";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import { User, ShieldCheck, Mail, Globe, MapPin, Key, Clock, Award, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { currentUser, logout } = useSession();
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyToken = () => {
    navigator.clipboard.writeText("sk_hotelos_live_" + Math.random().toString(36).substring(2, 15));
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">My Profile Dashboard</h2>
          <div className="flex items-center space-x-4">
            <HeaderStaffSwitcher />
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs font-semibold border border-error/20 rounded bg-error/5 text-error hover:bg-error/10 transition-all"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-4xl">
          {/* Profile overview card */}
          <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl">
                {currentUser.name[0]}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-text-primary">{currentUser.name}</h1>
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black bg-primary/10 text-primary border border-primary/25 uppercase tracking-wider">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-xs text-text-secondary flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-text-muted" />
                  <span>{currentUser.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs md:text-right">
              <span className="text-text-muted font-medium block">Clearance Scope</span>
              <span className="inline-flex items-center text-indigo-500 font-bold bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                <Globe className="w-3.5 h-3.5 mr-1" /> {currentUser.scope} CLEARANCE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity Details */}
            <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center">
                <ShieldCheck className="w-4 h-4 text-primary mr-1.5" /> Identity & Access Controls
              </h3>
              <div className="divide-y divide-border-default text-xs space-y-3 pt-1">
                <div className="flex justify-between items-center py-2">
                  <span className="text-text-secondary">Position Role</span>
                  <span className="font-bold text-text-primary">{currentUser.role === "MD" ? "Managing Director" : currentUser.role === "CFO" ? "Chief Financial Officer" : "Department Head"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-text-secondary">Assigned Location</span>
                  <span className="font-bold text-text-primary flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-primary mr-1" />
                    {currentUser.scope === "GLOBAL" ? "All Group Locations" : "Radisson Ujjaini Palace"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-text-secondary">Session Mode</span>
                  <span className="font-semibold text-text-secondary">Interactive JWT Sandbox</span>
                </div>
              </div>
            </div>

            {/* Developer/System Access Keys */}
            <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center">
                  <Key className="w-4 h-4 text-primary mr-1.5" /> Security Access Keys
                </h3>
                <p className="text-xs text-text-secondary mt-1">Use this JWT Token key to interact with integration webhooks.</p>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    value="sk_hotelos_live_e3k8d9s20wkls"
                    disabled
                    className="flex-1 bg-surface-secondary border border-border-default rounded px-3 py-1.5 text-xs text-text-muted font-mono"
                  />
                  <button
                    onClick={handleCopyToken}
                    className="px-3 py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded shadow-small transition-all shrink-0"
                  >
                    {copiedToken ? "Copied" : "Copy"}
                  </button>
                </div>
                <span className="text-[10px] text-text-muted block">Expires in 24 hours. Managed under compliance.</span>
              </div>
            </div>
          </div>

          {/* Shift Details */}
          <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center">
              <Clock className="w-4 h-4 text-primary mr-1.5" /> Duty Shift & Handover
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 border border-border-default rounded bg-surface-secondary space-y-1">
                <span className="text-xxs font-bold text-text-muted uppercase">Today's Shift</span>
                <div className="text-base font-extrabold text-text-primary">Regular Morning Duty</div>
              </div>
              <div className="p-4 border border-border-default rounded bg-surface-secondary space-y-1">
                <span className="text-xxs font-bold text-text-muted uppercase">Duration Range</span>
                <div className="text-base font-extrabold text-text-primary">09:00 AM – 06:00 PM</div>
              </div>
              <div className="p-4 border border-border-default rounded bg-surface-secondary space-y-1">
                <span className="text-xxs font-bold text-text-muted uppercase">Shift Status</span>
                <div className="text-base font-extrabold text-success flex items-center justify-center">
                  <Award className="w-4.5 h-4.5 mr-1" /> Active
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

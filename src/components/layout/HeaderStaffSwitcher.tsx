"use client";

import { useSession, StaffRole } from "@/context/SessionContext";
import { User, LogOut } from "lucide-react";
import DesktopInstallBanner from "@/components/layout/DesktopInstallBanner";

export default function HeaderStaffSwitcher() {
  const { currentUser, logout } = useSession();

  const getRoleBadgeStyle = (role: StaffRole) => {
    switch (role) {
      case "SAAS_OWNER":
        return "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400";
      case "MD":
        return "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400";
      case "CFO":
        return "bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400";
      case "GM":
        return "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400";
      case "FRONT_DESK":
        return "bg-sky-50 border-sky-100 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400";
      case "HOUSEKEEPER":
        return "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
      case "SPA_THERAPIST":
        return "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex items-center space-x-3">
      <DesktopInstallBanner />
      <div className="flex items-center space-x-3 bg-surface border border-border-default rounded-lg px-3 py-1.5 shadow-xxs">
        <div className="hidden md:block text-right">
          <div className="text-xxs font-bold text-text-primary leading-none">{currentUser.name}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{currentUser.email}</div>
        </div>

        <div className="h-8 w-px bg-border-default hidden md:block" />

        <div className="flex items-center space-x-1.5">
          <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(currentUser.role)}`}>
            {currentUser.role}
          </span>
          
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-border-default text-text-secondary mr-2">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="h-8 w-px bg-border-default" />

        <button
          onClick={logout}
          title="Sign Out"
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-default hover:bg-rose-50 hover:text-rose-600 transition-all text-text-secondary cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

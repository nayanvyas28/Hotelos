"use client";

import { useSession, MOCK_STAFF_DIRECTORY, StaffRole } from "@/context/SessionContext";
import { ShieldAlert, Key, Lock } from "lucide-react";
import { usePathname } from "next/navigation";

interface RoleProtectedProps {
  allowedRoles: StaffRole[];
  children: React.ReactNode;
}

export default function RoleProtected({ allowedRoles, children }: RoleProtectedProps) {
  const { currentUser, login, hasPermission } = useSession();
  const pathname = usePathname();

  if (!hasPermission(allowedRoles)) {
    // Beautiful premium Access Denied page
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-app-bg text-center min-h-[80vh] space-y-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center text-error border border-error/20 animate-pulse">
            <Lock className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 bg-warning text-white p-1 rounded-full border border-surface shadow">
            <ShieldAlert className="w-4 h-4" />
          </span>
        </div>

        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-black text-text-primary tracking-tight">Access Restricted</h2>
          <p className="text-xs text-text-secondary leading-normal">
            Your active staff profile (role: <span className="font-bold text-error">{currentUser?.role || "GUEST"}</span>) is not authorized to access the module <code className="px-1.5 py-0.5 rounded bg-surface border border-border-default text-[11px] font-bold text-text-primary">{pathname}</code>.
          </p>
        </div>

        {/* Quick Swapper to make testing easy */}
        <div className="bg-surface border border-border-default rounded-lg p-5 max-w-sm w-full shadow-small space-y-3.5">
          <div className="flex items-center space-x-2 text-xxs font-bold text-text-secondary uppercase tracking-wider justify-center border-b border-border-default pb-2">
            <Key className="w-4 h-4 text-primary" />
            <span>Switch Profile (Developer Sandbox)</span>
          </div>
          <select
            value={currentUser?.email || ""}
            onChange={(e) => login(e.target.value)}
            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs font-semibold text-text-primary focus:outline-none cursor-pointer"
          >
            {MOCK_STAFF_DIRECTORY.map((profile) => (
              <option key={profile.email} value={profile.email}>
                👤 {profile.name} ({profile.role})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-text-muted">
            Select a staff profile with permitted role clearance to unlock this screen.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

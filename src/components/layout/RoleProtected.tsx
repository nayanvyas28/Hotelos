"use client";

import { useSession, MOCK_STAFF_DIRECTORY, StaffRole } from "@/context/SessionContext";
import { ShieldAlert, Key, Lock } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface RoleProtectedProps {
  allowedRoles: StaffRole[];
  children: React.ReactNode;
}

export default function RoleProtected({ allowedRoles, children }: RoleProtectedProps) {
  const { currentUser, hasPermission } = useSession();
  const pathname = usePathname();
  const router = useRouter();

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

        <div className="flex gap-2 w-full max-w-sm">
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-2 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow transition-all cursor-pointer text-center"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

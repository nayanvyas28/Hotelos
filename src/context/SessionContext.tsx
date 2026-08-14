"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type StaffRole =
  | "SAAS_OWNER"
  | "MD"
  | "CFO"
  | "GM"
  | "MANAGER"
  | "HR_MANAGER"
  | "HR_COORDINATOR"
  | "FRONT_DESK"
  | "HOUSEKEEPER"
  | "SPA_THERAPIST"
  | "ENGINEERING"
  | "FB_STAFF";

export interface UserProfile {
  name: string;
  email: string;
  role: StaffRole;
  scope: "GLOBAL" | "PROPERTY";
  propertyId?: string; // Locked property (if scope is PROPERTY)
  organizationId?: string; // Organization ID (if MD or corporate manager)
}

interface SessionContextType {
  currentUser: UserProfile | null;
  activePropertyId: string;
  setActivePropertyId: (id: string) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (allowedRoles?: StaffRole[]) => boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Mock directory of staff profiles matching ENTERPRISE_DESIGN.md
export const MOCK_STAFF_DIRECTORY: UserProfile[] = [
  {
    name: "Nayan Vyas",
    email: "owner@hotelos.com",
    role: "SAAS_OWNER",
    scope: "GLOBAL",
  },
  {
    name: "Rajesh Mehta",
    email: "director@hotelos.com",
    role: "MD",
    scope: "GLOBAL",
  },
  {
    name: "Rohan Kapoor",
    email: "cfo@hotelos.com",
    role: "CFO",
    scope: "GLOBAL",
  },
  {
    name: "Vikram Singh",
    email: "gm.ujjaini@hotelos.com",
    role: "GM",
    scope: "PROPERTY",
    propertyId: "5f31df82-83ca-4b6d-8b07-25ae59eb924b", // default Ujjaini property
  },
  {
    name: "Priya Nair",
    email: "priya.fd@hotelos.com",
    role: "FRONT_DESK",
    scope: "PROPERTY",
    propertyId: "5f31df82-83ca-4b6d-8b07-25ae59eb924b",
  },
  {
    name: "Sunil Kumar",
    email: "sunil.hk@hotelos.com",
    role: "HOUSEKEEPER",
    scope: "PROPERTY",
    propertyId: "5f31df82-83ca-4b6d-8b07-25ae59eb924b",
  },
  {
    name: "Anjali Sen",
    email: "anjali.spa@hotelos.com",
    role: "SPA_THERAPIST",
    scope: "PROPERTY",
    propertyId: "5f31df82-83ca-4b6d-8b07-25ae59eb924b",
  },
];

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activePropertyId, setActivePropertyId] = useState<string>("5f31df82-83ca-4b6d-8b07-25ae59eb924b");

  // Restore session from localStorage if present
  useEffect(() => {
    const savedUser = localStorage.getItem("hotelos_active_user");
    const savedProp = localStorage.getItem("hotelos_active_property");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        const activePropVal = savedProp || parsedUser.propertyId || "";
        if (typeof document !== "undefined") {
          document.cookie = `hotelos_org_id=${parsedUser.organizationId || ""}; path=/; max-age=31536000`;
          document.cookie = `hotelos_role=${parsedUser.role || ""}; path=/; max-age=31536000`;
          document.cookie = `hotelos_prop_id=${activePropVal}; path=/; max-age=31536000`;
        }
        if (activePropVal) {
          setActivePropertyId(activePropVal);
        }
      } catch (e) {
        // Clear corrupt session
        localStorage.removeItem("hotelos_active_user");
      }
    }
  }, []);

  // Override active property if JIT break-glass support session is active
  useEffect(() => {
    const checkSupportSession = () => {
      if (typeof window !== "undefined") {
        const isSupportActive = sessionStorage.getItem("hotelos_support_session_active") === "true";
        if (isSupportActive) {
          const supportPropId = sessionStorage.getItem("hotelos_support_session_prop_id");
          if (supportPropId && supportPropId !== activePropertyId) {
            setActivePropertyId(supportPropId);
          }
        }
      }
    };
    checkSupportSession();
    const interval = setInterval(checkSupportSession, 1000);
    return () => clearInterval(interval);
  }, [activePropertyId]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    // Enforce password check for SAAS_OWNER profile
    if (email.toLowerCase() === "owner@hotelos.com") {
      if (password !== "NayanOS#2026") {
        return false;
      }
    }

    const found = MOCK_STAFF_DIRECTORY.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      localStorage.setItem("hotelos_active_user", JSON.stringify(found));
      if (typeof document !== "undefined") {
        document.cookie = `hotelos_org_id=${found.organizationId || ""}; path=/; max-age=31536000`;
        document.cookie = `hotelos_role=${found.role || ""}; path=/; max-age=31536000`;
      }
      if (found.propertyId) {
        setActivePropertyId(found.propertyId);
        localStorage.setItem("hotelos_active_property", found.propertyId);
      }
      return true;
    }

    try {
      const { authenticateUserAction } = await import("@/app/actions/auth");
      const res = await authenticateUserAction(email, password);
      if (res.success && res.user) {
        const dbUser = res.user as UserProfile;

        setCurrentUser(dbUser);
        localStorage.setItem("hotelos_active_user", JSON.stringify(dbUser));
        if (typeof document !== "undefined") {
          document.cookie = `hotelos_org_id=${dbUser.organizationId || ""}; path=/; max-age=31536000`;
          document.cookie = `hotelos_role=${dbUser.role || ""}; path=/; max-age=31536000`;
          document.cookie = `hotelos_prop_id=${dbUser.propertyId || ""}; path=/; max-age=31536000`;
        }
        if (dbUser.propertyId) {
          setActivePropertyId(dbUser.propertyId);
          localStorage.setItem("hotelos_active_property", dbUser.propertyId);
        }
        return true;
      }
    } catch (err) {
      console.error("Database user auth lookup failed:", err);
    }

    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("hotelos_active_user");
    localStorage.removeItem("hotelos_active_property");
    if (typeof document !== "undefined") {
      document.cookie = "hotelos_org_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "hotelos_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "hotelos_prop_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  const handleSetActivePropertyId = (id: string) => {
    if (currentUser?.scope === "GLOBAL") {
      setActivePropertyId(id);
      localStorage.setItem("hotelos_active_property", id);
      if (typeof document !== "undefined") {
        document.cookie = `hotelos_prop_id=${id}; path=/; max-age=31536000`;
      }
    }
  };

  const hasPermission = (allowedRoles?: StaffRole[]) => {
    if (!currentUser) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;

    // SAAS_OWNER super admin bypasses all role checks
    if (currentUser.role === "SAAS_OWNER") return true;

    // MD corporate owner bypasses all role checks EXCEPT SAAS_OWNER platform routes
    if (currentUser.role === "MD") {
      if (allowedRoles.length === 1 && allowedRoles[0] === "SAAS_OWNER") return false;
      return true;
    }

    // Map high-privilege roles to check targets
    const checkRoles: string[] = [...allowedRoles];
    if (checkRoles.includes("MANAGER")) {
      checkRoles.push("GM", "CFO");
    }

    return checkRoles.includes(currentUser.role);
  };

  return (
    <SessionContext.Provider
      value={{
        currentUser,
        activePropertyId,
        setActivePropertyId: handleSetActivePropertyId,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

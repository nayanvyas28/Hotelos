"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import { getSaaSAnnouncementsAction } from "@/app/actions/saasSupport";
import { ShieldAlert, AlertCircle, X, Volume2 } from "lucide-react";

export default function GlobalSaaSBanners() {
  const { activePropertyId } = useSession();
  
  // Support Session States
  const [isSupportActive, setIsSupportActive] = useState(false);
  const [supportPropName, setSupportPropName] = useState("");
  const [supportReason, setSupportReason] = useState("");
  const [timeLeftStr, setTimeLeftStr] = useState("");

  // Announcements States
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

  // Hydrate Support Session from sessionStorage
  useEffect(() => {
    const checkSupportSession = () => {
      const active = sessionStorage.getItem("hotelos_support_session_active") === "true";
      if (active) {
        const expiresStr = sessionStorage.getItem("hotelos_support_session_expires");
        const expiresAt = expiresStr ? Number(expiresStr) : 0;
        
        if (Date.now() >= expiresAt) {
          // Auto-expired
          handleEndSupportSession();
          return;
        }

        setIsSupportActive(true);
        setSupportPropName(sessionStorage.getItem("hotelos_support_session_prop_name") || "Target Hotel");
        setSupportReason(sessionStorage.getItem("hotelos_support_session_reason") || "Diagnostics");

        // Start countdown
        const interval = setInterval(() => {
          const rem = expiresAt - Date.now();
          if (rem <= 0) {
            clearInterval(interval);
            handleEndSupportSession();
          } else {
            const mins = Math.floor(rem / 60000);
            const secs = Math.floor((rem % 60000) / 1000);
            setTimeLeftStr(`${mins}m ${secs}s`);
          }
        }, 1000);

        return () => clearInterval(interval);
      } else {
        setIsSupportActive(false);
      }
    };

    checkSupportSession();
    // Periodically re-check session state in case of session storage changes
    const checkInterval = setInterval(checkSupportSession, 5000);
    return () => clearInterval(checkInterval);
  }, []);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await getSaaSAnnouncementsAction();
        if (res.success && res.announcements) {
          setAnnouncements(res.announcements);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAnnouncements();
    const annInterval = setInterval(fetchAnnouncements, 30000); // refresh every 30s
    return () => clearInterval(annInterval);
  }, []);

  // Restore dismissed list from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hotelos_dismissed_announcements");
      if (saved) {
        try {
          setDismissedAnnouncements(JSON.parse(saved));
        } catch (e) {
          // fallback
        }
      }
    }
  }, []);

  const handleDismissAnnouncement = (id: string) => {
    const updated = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(updated);
    localStorage.setItem("hotelos_dismissed_announcements", JSON.stringify(updated));
  };

  const handleEndSupportSession = () => {
    sessionStorage.removeItem("hotelos_support_session_active");
    sessionStorage.removeItem("hotelos_support_session_prop_id");
    sessionStorage.removeItem("hotelos_support_session_prop_name");
    sessionStorage.removeItem("hotelos_support_session_reason");
    sessionStorage.removeItem("hotelos_support_session_expires");
    setIsSupportActive(false);
    alert("Emergency support session terminated. Scopes reverted.");
    window.location.href = "/reports/super-admin";
  };

  // Filter announcements for current context (global or current property match)
  const activeNotices = announcements.filter(
    (ann) =>
      !dismissedAnnouncements.includes(ann.id) &&
      (ann.propertyId === null || ann.propertyId === activePropertyId)
  );

  return (
    <div className="w-full shrink-0 flex flex-col z-50 relative font-sans text-xs">
      {/* 1. Support impersonation break-glass bar */}
      {isSupportActive && (
        <div className="w-full bg-rose-600 text-white px-4 py-2 flex items-center justify-between shadow-md border-b border-rose-700 animate-pulse-slow">
          <div className="flex items-center gap-2 font-bold truncate">
            <ShieldAlert className="w-4 h-4 shrink-0 text-white animate-bounce" />
            <span className="truncate">
              EMERGENCY SUPPORT SESSION ACTIVE — Scoped to: <span className="underline decoration-2">{supportPropName}</span> — Reason: "{supportReason}"
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <span className="bg-rose-800 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
              Expires in: {timeLeftStr || "--m --s"}
            </span>
            <button
              onClick={handleEndSupportSession}
              className="bg-white hover:bg-rose-50 text-rose-700 font-black px-3 py-1 rounded shadow-sm text-[10px] transition-all hover:scale-105"
            >
              END SESSION
            </button>
          </div>
        </div>
      )}

      {/* 2. Broadcast Announcements stream */}
      {activeNotices.map((ann) => {
        const levelStyles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
          info: {
            bg: "bg-blue-600",
            text: "text-white",
            border: "border-blue-700",
            icon: "text-blue-200",
          },
          warning: {
            bg: "bg-amber-500",
            text: "text-slate-900",
            border: "border-amber-600",
            icon: "text-amber-800",
          },
          critical: {
            bg: "bg-rose-700",
            text: "text-white",
            border: "border-rose-800",
            icon: "text-rose-200",
          },
        };
        const config = levelStyles[ann.level] || levelStyles.info;

        return (
          <div
            key={ann.id}
            className={`w-full ${config.bg} ${config.text} px-4 py-2 border-b ${config.border} flex items-center justify-between shadow-sm`}
          >
            <div className="flex items-center gap-2 truncate font-semibold">
              <Volume2 className={`w-4 h-4 shrink-0 ${config.icon}`} />
              <span className="truncate">
                <span className="font-black uppercase tracking-wider mr-1.5 border-r border-current/25 pr-1.5">
                  SYSTEM NOTICE
                </span>
                <span className="font-bold mr-1">{ann.title}:</span>
                <span className="font-medium opacity-95">{ann.content}</span>
              </span>
            </div>
            <button
              onClick={() => handleDismissAnnouncement(ann.id)}
              className="p-1 hover:bg-black/10 rounded transition-all shrink-0 ml-4"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

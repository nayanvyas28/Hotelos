"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createReservationAction } from "@/app/actions/reservation";
import { postPaymentAction } from "@/app/actions/billing";
import { updateRoomStatusAction } from "@/app/actions/housekeeping";
import { createGuestAction } from "@/app/actions/guest";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

interface SyncTransaction {
  id: string;
  action: "createReservation" | "postPayment" | "updateRoomStatus" | "createGuest";
  payload: any;
  createdAt: number;
}

interface SyncContextType {
  isOnline: boolean;
  pendingCount: number;
  deferredPrompt: any;
  installDesktopApp: () => void;
  executeOfflineAction: (
    action: SyncTransaction["action"],
    payload: any
  ) => Promise<{ success: boolean; isOffline: boolean; tempId?: string; error?: string; [key: string]: any }>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queue, setQueue] = useState<SyncTransaction[]>([]);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Register Service Worker & Track Online/Offline Status
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(window.navigator.onLine);

    // Register PWA Service Worker for Offline Caching
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[PWA] Service Worker registered successfully:", reg.scope))
        .catch((err) => console.warn("[PWA] Service Worker registration failed:", err));
    }

    // Capture PWA Install Prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus("syncing");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("idle");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Initial load of queue from localStorage
    const savedQueue = localStorage.getItem("hotelos-offline-sync-queue");
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (e) {
        console.error("Failed to parse sync queue from localStorage:", e);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const installDesktopApp = async () => {
    if (!deferredPrompt) {
      alert("HotelOS Desktop App is already installed or your browser doesn't support 1-click install. You can also click 'Install' in your browser address bar!");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted the HotelOS Desktop App install prompt");
      setDeferredPrompt(null);
    }
  };

  // Sync queue to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("hotelos-offline-sync-queue", JSON.stringify(queue));
  }, [queue]);

  // Background sync worker
  useEffect(() => {
    if (isOnline && queue.length > 0 && syncStatus !== "syncing") {
      setSyncStatus("syncing");
    }
  }, [isOnline, queue]);

  useEffect(() => {
    if (syncStatus === "syncing") {
      processQueue();
    }
  }, [syncStatus]);

  const processQueue = async () => {
    if (queue.length === 0) {
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 3000);
      return;
    }

    const nextTx = queue[0];
    let success = false;
    let errorMsg = "";

    try {
      switch (nextTx.action) {
        case "createReservation":
          const resRes = (await createReservationAction(nextTx.payload)) as any;
          success = !!resRes.success;
          errorMsg = resRes.error || "";
          break;
        case "postPayment":
          const { folioId, amount, type, method, reference } = nextTx.payload;
          const resPay = (await postPaymentAction(folioId, { amount, type, method, reference })) as any;
          success = !!resPay.success;
          errorMsg = resPay.error || "";
          break;
        case "updateRoomStatus":
          const { roomId, status } = nextTx.payload;
          const resRoom = (await updateRoomStatusAction(roomId, status)) as any;
          success = !!resRoom.success;
          errorMsg = resRoom.error || "";
          break;
        case "createGuest":
          const resGuest = (await createGuestAction(nextTx.payload)) as any;
          success = !!resGuest.success;
          errorMsg = resGuest.error || "";
          break;
        default:
          console.error("Unknown offline action:", nextTx.action);
          success = true; // Drop unknown actions to prevent queue blocking
      }
    } catch (err: any) {
      console.error(`Sync transaction failed for ${nextTx.action}:`, err);
      errorMsg = err.message || "Network Error";
    }

    if (success) {
      // Remove successfully executed transaction
      setQueue((prev) => prev.slice(1));
    } else {
      console.warn(`Sync failed for transaction ${nextTx.id}, retrying in 5 seconds. Error: ${errorMsg}`);
      setSyncStatus("error");
      // Retry after delay
      setTimeout(() => {
        if (window.navigator.onLine) {
          setSyncStatus("syncing");
        } else {
          setSyncStatus("idle");
        }
      }, 5000);
    }
  };

  const executeOfflineAction = async (
    action: SyncTransaction["action"],
    payload: any
  ): Promise<{ success: boolean; isOffline: boolean; tempId?: string; error?: string; [key: string]: any }> => {
    // 1. If online and queue is empty, run live immediately
    if (window.navigator.onLine && queue.length === 0) {
      try {
        switch (action) {
          case "createReservation":
            return { ...(await createReservationAction(payload)) as any, isOffline: false };
          case "postPayment":
            const { folioId, amount, type, method, reference } = payload;
            return { ...(await postPaymentAction(folioId, { amount, type, method, reference })) as any, isOffline: false };
          case "updateRoomStatus":
            const { roomId, status } = payload;
            return { ...(await updateRoomStatusAction(roomId, status)) as any, isOffline: false };
          case "createGuest":
            return { ...(await createGuestAction(payload)) as any, isOffline: false };
        }
      } catch (err: any) {
        console.warn("Direct execution failed, fall back to offline queueing:", err);
      }
    }

    // 2. Queue the transaction for offline processing
    const tempId = `temp-${Math.random().toString(36).substr(2, 9)}`;
    const newTx: SyncTransaction = {
      id: tempId,
      action,
      payload,
      createdAt: Date.now(),
    };

    setQueue((prev) => [...prev, newTx]);
    return { success: true, isOffline: true, tempId };
  };

  return (
    <SyncContext.Provider value={{ isOnline, pendingCount: queue.length, deferredPrompt, installDesktopApp, executeOfflineAction }}>
      {children}
      <NetworkStatusIndicator isOnline={isOnline} pendingCount={queue.length} syncStatus={syncStatus} />
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}

// ----------------------------------------------------
// Floating Network Status Notification Indicator (UI component)
// ----------------------------------------------------
function NetworkStatusIndicator({
  isOnline,
  pendingCount,
  syncStatus,
}: {
  isOnline: boolean;
  pendingCount: number;
  syncStatus: "idle" | "syncing" | "success" | "error";
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOnline || pendingCount > 0 || syncStatus === "syncing" || syncStatus === "success") {
      setVisible(true);
    } else {
      // Fade out connected state after a delay
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, syncStatus]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in font-sans">
      {/* Offline Mode */}
      {!isOnline && (
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-3 shadow-lg max-w-sm">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="text-xs font-bold flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5 text-rose-400" /> Offline Mode
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {pendingCount > 0
                ? `${pendingCount} change(s) queued. System will auto-sync when connected.`
                : "No internet connection. Front-desk tasks will save locally."}
            </p>
          </div>
        </div>
      )}

      {/* Syncing Queue state */}
      {isOnline && syncStatus === "syncing" && (
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-3 shadow-lg max-w-sm">
          <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
          <div className="flex-1 space-y-0.5">
            <div className="text-xs font-bold">Synchronizing database...</div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Uploading {pendingCount} offline transaction(s) to server database.
            </p>
          </div>
        </div>
      )}

      {/* Sync Success state */}
      {isOnline && syncStatus === "success" && (
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-3 shadow-lg max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <div className="flex-1 space-y-0.5">
            <div className="text-xs font-bold text-success">Sync Completed!</div>
            <p className="text-[10px] text-slate-400 leading-normal">
              All offline transactions have been synchronized.
            </p>
          </div>
        </div>
      )}

      {/* Sync Connection Retry error state */}
      {isOnline && syncStatus === "error" && (
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-3 shadow-lg max-w-sm">
          <RefreshCw className="w-4 h-4 text-warning animate-pulse" />
          <div className="flex-1 space-y-0.5">
            <div className="text-xs font-bold text-warning">Sync Interrupted</div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Retrying database connection check in 5 seconds...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

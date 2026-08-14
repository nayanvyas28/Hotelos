"use client";

import React from "react";
import { useSync } from "@/context/SyncContext";
import { Monitor, Download } from "lucide-react";

export default function DesktopInstallBanner() {
  const { deferredPrompt, installDesktopApp } = useSync();

  return (
    <button
      onClick={installDesktopApp}
      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold rounded-lg shadow-small transition-all flex items-center space-x-1.5 cursor-pointer"
      title="Install HotelOS as a standalone Desktop App on Windows / macOS / Linux"
    >
      <Monitor className="w-3.5 h-3.5" />
      <span>Install Desktop App</span>
      {deferredPrompt && <Download className="w-3.5 h-3.5 animate-bounce ml-1" />}
    </button>
  );
}

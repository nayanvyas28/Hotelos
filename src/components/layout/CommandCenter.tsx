"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Navigation, BarChart3, KeyRound, Brush, Settings, User, FileText, X, Layers, Utensils, Sparkles } from "lucide-react";
import { useSession } from "@/context/SessionContext";

export default function CommandCenter() {
  const router = useRouter();
  const { currentUser } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  // Predefined navigation nodes
  const navSuggestions = [
    { label: "Overview Dashboard", href: "/", category: "Navigation", icon: BarChart3 },
    { label: "Front Desk Stays", href: "/frontdesk", category: "Navigation", icon: KeyRound },
    { label: "Room Roster Calendar", href: "/reservations/calendar", category: "Navigation", icon: BarChart3 },
    { label: "Housekeeping Assignments", href: "/housekeeping", category: "Navigation", icon: Brush },
    { label: "Staff Profile Settings", href: "/profile", category: "Navigation", icon: User },
    { label: "Approvals Engine", href: "/reports/approvals", category: "Navigation", icon: Settings },
    { label: "Manager Shift Logbook", href: "/reports/logbook", category: "Navigation", icon: FileText },
    { label: "Engineering Maintenance", href: "/reports/maintenance", category: "Navigation", icon: Settings },
    { label: "Lost & Found Vault", href: "/reports/lostfound", category: "Navigation", icon: FileText },
    { label: "Enterprise Integrations Hub", href: "/reports/integrations", category: "Navigation", icon: Layers },
    { label: "OTA Distribution Channel Manager", href: "/reports/distribution", category: "Navigation", icon: Layers },
    { label: "AI Concierge Smart Assistant", href: "/reports/ai-concierge", category: "Navigation", icon: Sparkles },
    { label: "In-Room POS Minibar Dining Terminal", href: "/frontdesk/minibar", category: "Navigation", icon: Utensils },
    { label: "GST CGST SGST FX Audit Compliance", href: "/reports/finance-audit", category: "Navigation", icon: BarChart3 },
    { label: "Finance Payroll Revenue Expense Ledger", href: "/reports/finance", category: "Navigation", icon: BarChart3 },
    { label: "QA Test UI UX Audit Control Center", href: "/reports/test-suite", category: "Navigation", icon: Settings },
    { label: "Campaigns Mailers SMTP WAT Pro Manager", href: "/reports/notifications", category: "Navigation", icon: Sparkles },
    { label: "SaaS Control Tower Cloud Manager", href: "/reports/super-admin", category: "Navigation", icon: Layers },
    { label: "Guest Room Digital Companion Portal", href: "/guests/portal", category: "Navigation", icon: BarChart3 },
  ];

  // Filter based on search query
  const filteredSuggestions = navSuggestions.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleKeyboardNav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSuggestions[selectedIndex]) {
        handleSelect(filteredSuggestions[selectedIndex].href);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4">
      <div
        ref={dialogRef}
        onKeyDown={handleKeyboardNav}
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Search header input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 space-x-3">
          <Search className="w-5 h-5 text-slate-500 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command to search or navigate (e.g. logbook)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-600"
          />
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-all">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Suggestion list */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filteredSuggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No command matches your query. Try typing 'logbook' or 'profile'.
            </div>
          ) : (
            filteredSuggestions.map((item, idx) => {
              const Icon = item.icon;
              const active = idx === selectedIndex;

              return (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-all ${
                    active ? "bg-primary text-white" : "text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-500"}`} />
                    <span className="font-semibold">{item.label}</span>
                  </div>
                  <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                    active ? "bg-white/20 text-white" : "bg-slate-800 text-slate-500"
                  }`}>
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Command center footer */}
        <div className="bg-slate-950 px-4 py-2 text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-800/80">
          <span>Use arrow keys to navigate, enter to select.</span>
          <span className="font-mono">ESC to exit</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, StaffRole } from "@/context/SessionContext";
import { useState, useEffect, useRef } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import {
  Hotel,
  KeyRound,
  Calendar as CalendarIcon,
  Brush,
  BarChart3,
  Utensils,
  Archive,
  Sparkles,
  HeartPulse,
  Users,
  Moon,
  Tag,
  Briefcase,
  Settings,
  User as UserIcon,
  LogOut,
  MapPin,
  Layers,
} from "lucide-react";

const GeminiLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(45 12 12)" />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-45 12 12)" />
  </svg>
);

interface SidebarProps {
  currentActive?: string;
}

export default function Sidebar({ currentActive }: SidebarProps) {
  const pathname = usePathname();
  const { hasPermission, currentUser, activePropertyId, setActivePropertyId, logout } = useSession();
  const [properties, setProperties] = useState<any[]>([]);
  const navRef = useRef<HTMLElement>(null);

  // Restore scroll state on page load
  useEffect(() => {
    const savedScrollTop = sessionStorage.getItem("sidebar-scroll-pos");
    if (savedScrollTop && navRef.current) {
      navRef.current.scrollTop = parseInt(savedScrollTop, 10);
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem("sidebar-scroll-pos", e.currentTarget.scrollTop.toString());
  };

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await getPropertiesAction();
        if (res.success && res.properties) {
          setProperties(res.properties);
        }
      } catch (err) {
        console.error("Failed to load properties in Sidebar:", err);
      }
    }
    fetchProperties();
  }, []);

  const allowedRolesMap: Record<string, StaffRole[]> = {
    "/reports": ["MD", "CFO", "GM"],
    "/reports/audit": ["MD", "GM"],
    "/reports/rates": ["MD", "CFO", "GM"],
    "/reports/ai": ["MD", "GM"],
    "/frontdesk": ["FRONT_DESK", "GM", "MD"],
    "/reservations/calendar": ["FRONT_DESK", "GM", "MD"],
    "/housekeeping": ["HOUSEKEEPER", "GM", "MD"],
    "/restaurant": ["FRONT_DESK", "GM", "MD"],
    "/events": ["FRONT_DESK", "GM", "MD"],
    "/spa": ["SPA_THERAPIST", "GM", "MD"],
    "/guests": ["FRONT_DESK", "GM", "MD"],
    "/inventory": ["MD", "CFO", "GM"],
    "/corporate": ["FRONT_DESK", "GM", "MD"],
    "/settings": ["MD", "CFO", "GM"],
    "/reports/integrations": ["MD", "CFO", "GM"],
    "/reports/distribution": ["MD", "CFO", "GM"],
    "/reports/ai-concierge": ["MD", "GM"],
    "/frontdesk/minibar": ["MD", "GM", "FRONT_DESK", "HOUSEKEEPER"],
    "/reports/finance-audit": ["MD", "CFO"],
    "/reports/test-suite": ["MD", "CFO", "GM"],
    "/reports/super-admin": ["SAAS_OWNER"],
    "/reports/notifications": ["MD", "CFO", "GM"],
    "/reports/finance": ["MD", "CFO"],
    "/profile": ["MD", "CFO", "GM", "FRONT_DESK", "HOUSEKEEPER", "SPA_THERAPIST"],
  };

  const menuGroups = [
    {
      title: "DASHBOARD",
      items: [
        { href: "/", label: "Overview", icon: Hotel },
        { href: "/reports", label: "Reports & Analytics", icon: BarChart3 },
        { href: "/reports/audit", label: "Night Audit Roll", icon: Moon },
        { href: "/reports/rates", label: "Rates & Pricing", icon: Tag },
        { href: "/reports/distribution", label: "OTA Distribution", icon: Layers },
        { href: "/reports/ai", label: "AI Copilot Ops", icon: GeminiLogo },
        { href: "/reports/ai-concierge", label: "AI Concierge Smart", icon: GeminiLogo },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { href: "/frontdesk", label: "Front Desk", icon: KeyRound },
        { href: "/reservations/calendar", label: "Room Calendar", icon: CalendarIcon },
        { href: "/housekeeping", label: "Housekeeping", icon: Brush },
        { href: "/frontdesk/minibar", label: "In-Room POS Terminal", icon: Utensils },
      ],
    },
    {
      title: "SERVICES",
      items: [
        { href: "/restaurant", label: "Restaurant POS", icon: Utensils },
        { href: "/events", label: "Events & Banquets", icon: Sparkles },
        { href: "/spa", label: "Spa & Wellness", icon: HeartPulse },
        { href: "/guests/portal", label: "Guest Room Portal", icon: Hotel },
      ],
    },
    {
      title: "CRM & ASSETS",
      items: [
        { href: "/guests", label: "Guests CRM", icon: Users },
        { href: "/inventory", label: "Inventory & Stock", icon: Archive },
        { href: "/corporate", label: "Corporate CRM", icon: Briefcase },
        { href: "/reports/integrations", label: "Integrations Hub", icon: Layers },
        { href: "/reports/finance-audit", label: "GST & FX Audit", icon: BarChart3 },
        { href: "/reports/finance", label: "Finance & Payroll", icon: BarChart3 },
        { href: "/reports/test-suite", label: "QA Test Center", icon: Settings },
        { href: "/reports/notifications", label: "Campaigns & Mailers", icon: Sparkles },
        { href: "/reports/super-admin", label: "SaaS Control Tower", icon: Layers },
        { href: "/settings", label: "System Settings", icon: Settings },
      ],
    },
    {
      title: "PERSONAL CONSOLE",
      items: [
        { href: "/profile", label: "Staff Profile", icon: UserIcon },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (currentActive) {
      return currentActive === href;
    }
    if (href === "/guests/portal") {
      return pathname === href;
    }
    if (href === "/guests") {
      return pathname.startsWith("/guests") && pathname !== "/guests/portal";
    }
    if (
      href === "/" ||
      href.startsWith("/reports") ||
      href === "/frontdesk"
    ) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const allowedRoles = allowedRolesMap[item.href];
        return hasPermission(allowedRoles);
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="w-64 bg-surface border-r border-border-default hidden md:flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-border-default space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
            <Hotel className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-text-primary leading-none">HotelOS</span>
            <span className="text-[10px] font-semibold text-text-muted mt-1 uppercase tracking-wider">Enterprise HQ</span>
          </div>
        </div>

        {currentUser?.scope === "GLOBAL" && properties.length > 0 && (
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Active Location</label>
            <select
              value={activePropertyId}
              onChange={(e) => setActivePropertyId(e.target.value)}
              className="w-full text-xs font-semibold px-2 py-1.5 border border-border-default rounded bg-surface-secondary text-text-primary focus:outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  📍 {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto space-y-6 scrollbar-thin"
      >
        {filteredGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <div className="px-3 text-xxs font-extrabold text-text-muted uppercase tracking-widest opacity-80">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group relative ${
                      active
                        ? "text-primary bg-primary/10 dark:bg-primary/20 shadow-sm border-l-[3px] border-primary pl-2.5"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 ${
                        active ? "text-primary" : "text-text-muted group-hover:text-text-primary"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile info & Sign Out Footer */}
      {currentUser && (
        <div className="p-4 border-t border-border-default bg-surface-secondary/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {currentUser.name[0]}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-text-primary leading-none block">{currentUser.name}</span>
                <span className="text-[9px] font-black text-primary uppercase mt-0.5">{currentUser.role}</span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-text-secondary hover:text-error hover:bg-error/5 rounded transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

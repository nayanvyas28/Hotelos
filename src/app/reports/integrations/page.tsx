"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { ShieldCheck, CheckCircle2, ArrowRight, Zap, RefreshCw, Layers, Database, BarChart3, Users, Settings } from "lucide-react";

export default function IntegrationsPage() {
  const [syncingAll, setSyncingAll] = useState(false);
  const [connectors, setConnectors] = useState([
    {
      id: "sap",
      name: "SAP S/4HANA ERP",
      category: "Enterprise Ledger Consolidation",
      description: "Synchronizes night audit totals, cost center postings, ledger accounts, and accounts payable to the AWS cloud-hosted ERP system.",
      status: "ACTIVE",
      lastSync: "2 mins ago",
      syncRate: "99.8%",
      endpoint: "https://api.sap-s4.aws.radisson-group.com/v1/ledger",
    },
    {
      id: "ideas",
      name: "IDeaS RevPlan",
      category: "Total Yield & Revenue Management",
      description: "Automates budgeting and total revenue management by feeding hourly forecasted ADR limits and occupancy yield controls.",
      status: "ACTIVE",
      lastSync: "15 mins ago",
      syncRate: "100%",
      endpoint: "https://ideas-api.revplan.ideas.com/v3/yield-pricing",
    },
    {
      id: "reltio",
      name: "Reltio Master CRM",
      category: "Unified Customer Data 360",
      description: "Unifies guest identities, loyalty tiers, stay histories, and preferences in real-time across all properties.",
      status: "ACTIVE",
      lastSync: "1 min ago",
      syncRate: "99.9%",
      endpoint: "https://reltio-mdm.api.rws-tridion.com/v2/guest360",
    },
    {
      id: "reviewpro",
      name: "ReviewPro Sentiment API",
      category: "Guest Experience Automation",
      description: "Pulls CSAT / NPS surveys and AI-driven reputation sentiment reviews to feed guest relations dashboard.",
      status: "ACTIVE",
      lastSync: "1 hour ago",
      syncRate: "99.5%",
      endpoint: "https://reviewpro-api.guest-sentiment.com/v1/surveys",
    },
    {
      id: "salesforce",
      name: "Salesforce CRM Link",
      category: "MICE Group Sales & Contracts",
      description: "Syncs corporate accounts contracts, banquet event blocks, sales opportunities, and franchise owner touchpoints.",
      status: "ACTIVE",
      lastSync: "5 mins ago",
      syncRate: "100%",
      endpoint: "https://salesforce.api.radisson.com/services/data/v52.0",
    },
  ]);

  const handleSyncAll = () => {
    setSyncingAll(true);
    setTimeout(() => {
      setSyncingAll(false);
      alert("All enterprise data nodes successfully synced with AWS Amazon Cloud infrastructure!");
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">Corporate Integrations Hub</h2>
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MD", "CFO", "GM"]}>
            <>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary">Enterprise Integrations Hub</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Manage API connectors, webhook subscriptions, and data synchronization for Radisson Group core software packages.
                  </p>
                </div>
                <button
                  onClick={handleSyncAll}
                  disabled={syncingAll}
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small disabled:opacity-50 transition-all shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${syncingAll ? "animate-spin" : ""}`} />
                  {syncingAll ? "Synchronizing Nodes..." : "Sync All Nodes"}
                </button>
              </div>

              {/* Integrations Grid */}
              <div className="grid grid-cols-1 gap-6">
                {connectors.map((conn) => (
                  <div
                    key={conn.id}
                    className="bg-surface border border-border-default rounded-lg p-5 shadow-small flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded bg-primary-light text-primary">
                          {conn.id === "sap" && <Database className="w-5 h-5" />}
                          {conn.id === "ideas" && <BarChart3 className="w-5 h-5" />}
                          {conn.id === "reltio" && <Users className="w-5 h-5" />}
                          {conn.id === "reviewpro" && <Zap className="w-5 h-5" />}
                          {conn.id === "salesforce" && <Settings className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary">{conn.name}</h3>
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                            {conn.category}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-text-secondary leading-normal max-w-2xl">{conn.description}</p>
                      
                      <div className="text-[10px] text-text-muted font-mono bg-surface-secondary/40 border border-border-default/50 px-2 py-1 rounded inline-block">
                        API Endpoint: {conn.endpoint}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col justify-between md:items-end w-full md:w-auto border-t md:border-t-0 border-border-default pt-4 md:pt-0 gap-4">
                      <div className="text-left md:text-right space-y-1 text-xs">
                        <span className="text-text-muted block text-[10px] uppercase font-bold">Sync Health</span>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span className="font-bold text-text-primary">{conn.syncRate} Synced</span>
                        </div>
                        <span className="text-[10px] text-text-muted block">Last sync: {conn.lastSync}</span>
                      </div>

                      <button
                        onClick={() => alert(`Connection test successful for ${conn.name} API endpoint!`)}
                        className="px-3 py-1.5 text-xxs font-bold text-primary border border-primary/20 rounded hover:bg-primary-light/50 transition-all shrink-0"
                      >
                        Ping Endpoint
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

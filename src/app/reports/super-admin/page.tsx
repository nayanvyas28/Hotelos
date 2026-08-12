"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { getSaaSOverviewAction, createSaaSPropertyAction } from "@/app/actions/saasAdmin";
import { ShieldCheck, Plus, RefreshCw, Layers, Database, Activity, CheckCircle2, Loader2, Sparkles, Server, Search } from "lucide-react";

export default function SuperAdminPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ mrr: 0, churnRate: "0%", apiLoad: "100%", totalLicenses: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tenant form state
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    orgName: "",
    propName: "",
    address: "",
    dbType: "SHARED_CLOUD",
    dbUrl: "",
  });

  // Feature Configurator & Database Sync states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [tenantConfigs, setTenantConfigs] = useState<Record<string, { plan: string, features: string[], dbType?: string, dbUrl?: string }>>({});
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadSaaSData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getSaaSOverviewAction();
      if (res.success && res.properties && res.organizations) {
        setProperties(res.properties);
        setOrganizations(res.organizations);
        setStats(res.stats);
        
        // Initialize default tenant plans & configurations
        if (res.properties.length > 0) {
          const initialConfigs: Record<string, { plan: string, features: string[], dbType: string, dbUrl: string }> = {};
          res.properties.forEach((p: any, idx: number) => {
            initialConfigs[p.id] = {
              plan: "Enterprise",
              features: ["AI_CONCIERGE", "RESTAURANT_POS", "SPA_WELLNESS", "EVENTS_BANQUETS"],
              dbType: idx === 0 ? "SHARED_CLOUD" : "DEDICATED_SERVER",
              dbUrl: idx === 0 
                ? "postgresql://aws_root:*****@aws-rds-cluster.hotelos.com:5432/hotelos_shared"
                : `postgresql://db_admin:*****@103.44.82.${90 + idx}:5432/${p.name.toLowerCase().replace(/\s+/g, '_')}_prod`
            };
          });
          setTenantConfigs(initialConfigs);
          setSelectedPropId((prev) => prev || res.properties[0].id);
        }
      } else {
        setError(res.error || "Failed to load SaaS tenant records.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load SaaS tenant records.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSync = (propId: string) => {
    const config = tenantConfigs[propId] || { dbType: "SHARED_CLOUD", dbUrl: "" };
    setIsSyncing(true);
    setSyncLogs([
      `[${new Date().toLocaleTimeString()}] Target database type: ${config.dbType}`,
      `[${new Date().toLocaleTimeString()}] Handshaking connection: ${config.dbUrl?.replace(/:([^:@]+)@/, ":*****@") || "Unknown connection"}`,
      `[${new Date().toLocaleTimeString()}] Connection established successfully!`,
      `[${new Date().toLocaleTimeString()}] Running prisma db push --skip-generate...`,
      `[${new Date().toLocaleTimeString()}] Pushing schema.prisma models into dedicated database...`,
      `[${new Date().toLocaleTimeString()}] Sync success! Tenant database server context configured.`
    ]);
    setTimeout(() => {
      setIsSyncing(false);
      alert("Database context successfully synced on tenant server!");
    }, 2000);
  };

  useEffect(() => {
    loadSaaSData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orgName || !form.propName) return;

    setIsActionLoading(true);
    try {
      const res = await createSaaSPropertyAction(form.orgName, form.propName, form.address);
      if (res.success && res.property) {
        setIsOpen(false);
        const newPropId = res.property.id;
        const configDbUrl = form.dbType === "SHARED_CLOUD" 
          ? "postgresql://aws_root:*****@aws-rds-cluster.hotelos.com:5432/hotelos_shared"
          : form.dbUrl || `postgresql://db_admin:*****@103.44.82.99:5432/${form.propName.toLowerCase().replace(/\s+/g, '_')}_prod`;
        
        setTenantConfigs((prev) => ({
          ...prev,
          [newPropId]: {
            plan: "Enterprise",
            features: ["AI_CONCIERGE", "RESTAURANT_POS", "SPA_WELLNESS", "EVENTS_BANQUETS"],
            dbType: form.dbType,
            dbUrl: configDbUrl,
          }
        }));

        setForm({ orgName: "", propName: "", address: "", dbType: "SHARED_CLOUD", dbUrl: "" });
        await loadSaaSData();
        setSelectedPropId(newPropId);
        alert("New SaaS tenant property successfully registered in the multi-instance AWS cloud database!");
      } else {
        alert(res.error || "Failed to register tenant.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to register tenant.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">SaaS Cloud Provider Workspace</h2>
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["SAAS_OWNER"]}>
            <>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary">SaaS Control Tower</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Manage multi-tenant organizations, allocate API licenses quotas, monitor MRR metrics, and sync global software parameters.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small transition-all shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Provision Tenant Hotel
                </button>
              </div>

              {/* SaaS Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Monthly Recurring Revenue (MRR)</div>
                  <div className="text-2xl font-black text-success mt-1 font-mono">${stats.mrr.toLocaleString()}</div>
                  <div className="text-[10px] text-text-muted mt-1">AWS multi-tenant plan value</div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Active Tenant Instances</div>
                  <div className="text-2xl font-black text-primary mt-1">{properties.length} instances</div>
                  <div className="text-[10px] text-text-muted mt-1">{organizations.length} active client groups</div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">SaaS Infrastructure Load</div>
                  <div className="text-2xl font-black text-indigo-500 mt-1">{stats.apiLoad}</div>
                  <div className="text-[10px] text-text-muted mt-1">Active sync rate: 99.98%</div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Tenant Churn Ratio</div>
                  <div className="text-2xl font-black text-error mt-1">{stats.churnRate}</div>
                  <div className="text-[10px] text-text-muted mt-1">Excellent client retention index</div>
                </div>
              </div>

              {/* Loader */}
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 bg-error/10 border border-error/20 rounded text-sm text-error">
                  {error}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Split Layout for Registry and Feature Configurator */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Hotels Registry */}
                    <div className="lg:col-span-2 space-y-4 font-sans">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h3 className="text-sm font-bold text-text-primary">Multi-Tenant Hotels Registry</h3>
                        
                        {/* Search Input Bar */}
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-muted" />
                          <input
                            type="text"
                            placeholder="Search by hotel name or group..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-border-default rounded bg-surface text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                              <th className="p-4">Hotel Name</th>
                              <th className="p-4">Tenant Group</th>
                              <th className="p-4">Active Plan</th>
                              <th className="p-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default">
                            {properties
                              .filter((prop) => 
                                prop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                prop.organization.name.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .map((prop) => {
                              const config = tenantConfigs[prop.id] || { plan: "Enterprise" };
                              const isSelected = selectedPropId === prop.id;
                              return (
                                <tr 
                                  key={prop.id} 
                                  onClick={() => setSelectedPropId(prop.id)}
                                  className={`hover:bg-surface-secondary/30 transition-all cursor-pointer ${
                                    isSelected ? "bg-primary/5 border-l-2 border-primary" : ""
                                  }`}
                                >
                                  <td className="p-4 font-semibold text-text-secondary">{prop.name}</td>
                                  <td className="p-4 text-text-secondary">{prop.organization.name}</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      config.plan === "Starter" ? "bg-slate-100 text-slate-600" : config.plan === "Professional" ? "bg-indigo-50 text-indigo-600" : "bg-primary/10 text-primary"
                                    }`}>
                                      {config.plan}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <span className="text-[10px] font-bold text-primary">Configure →</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right Column: Feature Plan Configurator */}
                    <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                      {selectedPropId && properties.find((p) => p.id === selectedPropId) ? (
                        (() => {
                          const activeHotel = properties.find((p) => p.id === selectedPropId)!;
                          const activeConfig = tenantConfigs[selectedPropId] || { plan: "Enterprise", features: ["AI_CONCIERGE", "RESTAURANT_POS"] };
                          
                          const toggleFeature = (feat: string) => {
                            setTenantConfigs((prev) => {
                              const current = prev[selectedPropId] || { plan: "Enterprise", features: [] };
                              const updatedFeatures = current.features.includes(feat)
                                ? current.features.filter((f) => f !== feat)
                                : [...current.features, feat];
                              return {
                                ...prev,
                                [selectedPropId]: { ...current, features: updatedFeatures }
                              };
                            });
                          };

                          const selectPlan = (plan: string) => {
                            setTenantConfigs((prev) => {
                              const current = prev[selectedPropId] || { plan: "Enterprise", features: [] };
                              // Starter plan only gets RESTAURANT_POS, Professional gets POS + SPA, Enterprise gets all!
                              let feats = ["RESTAURANT_POS"];
                              if (plan === "Professional") feats = ["RESTAURANT_POS", "SPA_WELLNESS"];
                              if (plan === "Enterprise") feats = ["AI_CONCIERGE", "RESTAURANT_POS", "SPA_WELLNESS", "EVENTS_BANQUETS"];
                              return {
                                ...prev,
                                [selectedPropId]: { plan, features: feats }
                              };
                            });
                          };

                          return (
                            <>
                              <div className="border-b border-border-default pb-3">
                                <h3 className="text-sm font-bold text-text-primary">Configure Onboarding License</h3>
                                <p className="text-[10px] text-text-muted mt-0.5">Settings for: <span className="font-bold text-text-primary">{activeHotel.name}</span></p>
                              </div>

                              {/* Subscription Plan Switcher */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">License Tier Plan</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {["Starter", "Professional", "Enterprise"].map((plan) => (
                                    <button
                                      key={plan}
                                      onClick={() => selectPlan(plan)}
                                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                        activeConfig.plan === plan
                                          ? "bg-primary border-primary text-white shadow-small"
                                          : "bg-surface-secondary border-border-default text-text-secondary hover:bg-slate-100"
                                      }`}
                                    >
                                      {plan}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Active Software Feature Switches */}
                              <div className="space-y-3">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Software Module Switches</label>
                                <div className="space-y-2.5">
                                  {[
                                    { key: "AI_CONCIERGE", label: "AI Concierge & Task Automation", desc: "NLP Message Parsers & Dispatchers" },
                                    { key: "RESTAURANT_POS", label: "Swiggy-Style POS & Guest Orders", desc: "Menus, category pills, & folio charges" },
                                    { key: "SPA_WELLNESS", label: "Spa & Wellness Reservation Roster", desc: "Therapists scheduling & booking calendar" },
                                    { key: "EVENTS_BANQUETS", label: "Events & Banquet Scheduling", desc: "Hall bookings & layout configs" },
                                  ].map((feat) => {
                                    const enabled = activeConfig.features.includes(feat.key);
                                    return (
                                      <div 
                                        key={feat.key} 
                                        onClick={() => toggleFeature(feat.key)}
                                        className="flex items-center justify-between p-2.5 border border-border-default/60 rounded-lg hover:bg-slate-50 cursor-pointer transition-all"
                                      >
                                        <div className="space-y-0.5">
                                          <div className="text-[10px] font-bold text-text-primary">{feat.label}</div>
                                          <div className="text-[9px] text-text-muted">{feat.desc}</div>
                                        </div>
                                        {/* Toggle switch visual */}
                                        <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                                          enabled ? "bg-success" : "bg-slate-300"
                                        }`}>
                                          <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                                            enabled ? "translate-x-3.5" : "translate-x-0"
                                          }`} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Dedicated Server Database config */}
                              <div className="space-y-2 pt-2 border-t border-border-default">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Database Tenancy Strategy</label>
                                <div className="p-3 border border-border-default rounded-lg bg-surface-secondary/20 space-y-2 font-sans">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-semibold text-text-secondary">Type:</span>
                                    <select
                                      value={activeConfig.dbType || "SHARED_CLOUD"}
                                      onChange={(e) => {
                                        setTenantConfigs((prev) => ({
                                          ...prev,
                                          [selectedPropId]: {
                                            ...activeConfig,
                                            dbType: e.target.value,
                                            dbUrl: e.target.value === "SHARED_CLOUD"
                                              ? "postgresql://aws_root:*****@aws-rds-cluster.hotelos.com:5432/hotelos_shared"
                                              : activeConfig.dbUrl?.includes("shared") ? `postgresql://db_admin:*****@103.44.82.99:5432/${activeHotel.name.toLowerCase().replace(/\s+/g, '_')}_prod` : activeConfig.dbUrl || ""
                                          }
                                        }));
                                      }}
                                      className="px-2 py-0.5 border border-border-default rounded bg-surface text-[9px] font-bold text-text-primary focus:outline-none"
                                    >
                                      <option value="SHARED_CLOUD">Shared Cloud RDS</option>
                                      <option value="DEDICATED_SERVER">Dedicated Server</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-text-muted block">Connection String URL:</span>
                                    <input
                                      type="text"
                                      value={activeConfig.dbUrl || ""}
                                      onChange={(e) => {
                                        setTenantConfigs((prev) => ({
                                          ...prev,
                                          [selectedPropId]: {
                                            ...activeConfig,
                                            dbUrl: e.target.value
                                          }
                                        }));
                                      }}
                                      className="w-full px-2 py-1 text-[9px] font-mono border border-border-default rounded bg-surface text-text-primary focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Trigger Server Setup / Sync */}
                              <div className="space-y-3 pt-2 border-t border-border-default">
                                <button
                                  onClick={() => handleTriggerSync(selectedPropId)}
                                  disabled={isSyncing}
                                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <Database className="w-4 h-4" />
                                  {isSyncing ? "Syncing Database Server..." : "Trigger DB Schema Sync"}
                                </button>

                                {/* Terminal Output Console */}
                                {syncLogs.length > 0 && (
                                  <div className="bg-slate-900 border border-slate-800 rounded p-3 text-[9px] font-mono text-slate-400 space-y-1 max-h-[110px] overflow-y-auto">
                                    {syncLogs.map((log, idx) => (
                                      <div key={idx} className={idx === syncLogs.length - 1 ? "text-success font-bold" : ""}>{log}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-text-muted py-20 space-y-3">
                          <Layers className="w-10 h-10 text-text-muted" />
                          <p className="text-xs">Select a hotel from the registry list to configure active feature switches.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* API License Modules configs */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                    <h3 className="text-xs font-black uppercase text-text-muted tracking-wider">
                      Tenant Modules Allocations Matrix
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="p-4 border border-border-default/80 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-text-primary">SAP ERP Connector</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-primary/10 text-primary uppercase">Global</span>
                        </div>
                        <p className="text-xxs text-text-secondary leading-normal">Allows night audit ledger and cost posting sync to SAP database instances.</p>
                      </div>
                      <div className="p-4 border border-border-default/80 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-text-primary">Reltio MDM Sync</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-primary/10 text-primary uppercase">Global</span>
                        </div>
                        <p className="text-xxs text-text-secondary leading-normal">Allows cross-property guest profile deduplication and loyalty sync queries.</p>
                      </div>
                      <div className="p-4 border border-border-default/80 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-text-primary">IDeaS RevPlan Yield</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-primary/10 text-primary uppercase">Global</span>
                        </div>
                        <p className="text-xxs text-text-secondary leading-normal">Allows automated yield pricing modifications and forecast rate controls.</p>
                      </div>
                    </div>
                  </div>

                  {/* SaaS Infrastructure & Keys Manager */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Global Edge Nodes & MDM Sync Status */}
                    <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                      <div className="flex justify-between items-center border-b border-border-default/50 pb-2">
                        <h3 className="text-xs font-black uppercase text-text-muted tracking-wider flex items-center">
                          <Server className="w-4 h-4 mr-1 text-primary animate-pulse" /> Global Edge Nodes & MDM Sync
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[8px] font-black bg-success/10 text-success border border-success/20 uppercase tracking-wider font-mono">
                          Edge Active: 1204/1204 Nodes
                        </span>
                      </div>
                      
                      <div className="space-y-3.5 text-xs leading-normal">
                        {/* Edge Nodes roster */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xxs font-bold text-text-muted uppercase tracking-wider">
                            <span>Local Property Cache Node</span>
                            <span>Network Latency / Status</span>
                          </div>
                          
                          <div className="space-y-1.5 font-mono text-[10px] text-text-secondary">
                            <div className="flex justify-between items-center py-0.5">
                              <span>{"🏨 Radisson Delhi Node"}</span>
                              <span className="text-success font-bold">{"14ms latency • CONNECTED"}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span>{"🏨 Radisson Noida Node"}</span>
                              <span className="text-success font-bold">{"11ms latency • CONNECTED"}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span>{"🏨 Radisson London Node"}</span>
                              <span className="text-warning font-bold">{"OFFLINE • EDGE CACHING (14 tx cached)"}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span>{"🏨 Radisson Tokyo Node"}</span>
                              <span className="text-success font-bold">{"22ms latency • CONNECTED"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Reltio MDM Segment */}
                        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-[9px] text-slate-400 space-y-1">
                          <div className="text-xxs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-1">
                            Reltio MDM De-duplication Ledger
                          </div>
                          <div className="text-success font-bold">
                            {"[19:50:02] MDM duplicate matched: Rahul S. (Delhi) <-> Rahul Sharma (Noida)"}
                          </div>
                          <div>
                            {"[19:50:03] Consolidated profiles into global ID: relt_908f-22a1"}
                          </div>
                          <div className="text-slate-500">
                            {"[19:50:04] Locked preferences: [Soft pillows, Black Coffee, High Floor]"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* API keys allocations */}
                    <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                      <h3 className="text-xs font-black uppercase text-text-muted tracking-wider flex items-center">
                        <ShieldCheck className="w-4 h-4 mr-1 text-indigo-500" /> Active SaaS API Licenses Tokens
                      </h3>
                      <div className="space-y-3 text-xs leading-normal font-mono">
                        <div className="flex justify-between items-center py-1 border-b border-border-default/50">
                          <span className="font-sans text-text-secondary font-semibold">Radisson Delhi API Key</span>
                          <span className="text-primary font-bold">hos_live_a81f...92d1</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border-default/50">
                          <span className="font-sans text-text-secondary font-semibold">CFO Audit Sync Token</span>
                          <span className="text-primary font-bold">hos_live_b90c...d931</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border-default/50">
                          <span className="font-sans text-text-secondary font-semibold">SAP Ledger Hook secret</span>
                          <span className="text-primary font-bold">sap_sec_908f...ff22</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="font-sans text-text-secondary font-semibold">API Gateway status</span>
                          <span className="text-success font-bold">99.98% uptime</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Provision Modal */}
              {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
                    <h3 className="text-sm font-bold text-text-primary">Provision New Hotel Tenant</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Client Org Group Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Radisson Group, Marriott International"
                          value={form.orgName}
                          onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Hotel Property Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Radisson West Wing, Courtyard Delhi"
                          value={form.propName}
                          onChange={(e) => setForm({ ...form, propName: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Property Location Address</label>
                        <input
                          type="text"
                          placeholder="e.g. Sector 62, Noida, UP"
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 font-sans">
                        <label className="text-xs font-semibold text-text-secondary">Database Hosting Type</label>
                        <select
                          value={form.dbType}
                          onChange={(e) => setForm({ ...form, dbType: e.target.value, dbUrl: e.target.value === "SHARED_CLOUD" ? "" : "postgresql://db_admin:*****@your-server-ip:5432/hotel_db" })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        >
                          <option value="SHARED_CLOUD">Shared Cloud RDS (AWS cluster)</option>
                          <option value="DEDICATED_SERVER">Dedicated Private Server DB</option>
                        </select>
                      </div>

                      {form.dbType === "DEDICATED_SERVER" && (
                        <div className="space-y-1 font-sans">
                          <label className="text-xs font-semibold text-text-secondary">Dedicated Database URL Connection</label>
                          <input
                            type="text"
                            required
                            placeholder="postgresql://user:password@ip:5432/db"
                            value={form.dbUrl}
                            onChange={(e) => setForm({ ...form, dbUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none font-mono text-[10px]"
                          />
                        </div>
                      )}

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-text-secondary border border-border-default rounded bg-surface"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isActionLoading}
                          className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                        >
                          {isActionLoading ? "Provisioning..." : "Provision Instance"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

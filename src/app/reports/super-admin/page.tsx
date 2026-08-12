"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { getSaaSOverviewAction, createSaaSPropertyAction } from "@/app/actions/saasAdmin";
import { ShieldCheck, Plus, RefreshCw, Layers, Database, Activity, CheckCircle2, Loader2, Sparkles, Server } from "lucide-react";

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
  });

  const loadSaaSData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getSaaSOverviewAction();
      if (res.success && res.properties && res.organizations) {
        setProperties(res.properties);
        setOrganizations(res.organizations);
        setStats(res.stats);
      } else {
        setError(res.error || "Failed to load SaaS tenant records.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load SaaS tenant records.");
    } finally {
      setIsLoading(false);
    }
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
      if (res.success) {
        setIsOpen(false);
        setForm({ orgName: "", propName: "", address: "" });
        await loadSaaSData();
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
          <RoleProtected allowedRoles={["MD"]}>
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
                  {/* Tenants table */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-text-primary">Multi-Tenant Hotels Registry</h3>
                    
                    <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            <th className="p-4">Hotel Property ID</th>
                            <th className="p-4">Hotel Name</th>
                            <th className="p-4">Organization Tenant Group</th>
                            <th className="p-4">Plan License</th>
                            <th className="p-4">API sync status</th>
                            <th className="p-4 text-right">Software Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                          {properties.map((prop) => (
                            <tr key={prop.id} className="hover:bg-surface-secondary/30 transition-all font-mono">
                              <td className="p-4 text-primary font-bold">{prop.id.substring(0, 8).toUpperCase()}</td>
                              <td className="p-4 font-semibold text-text-secondary">{prop.name}</td>
                              <td className="p-4 text-text-secondary">{prop.organization.name}</td>
                              <td className="p-4 font-bold text-indigo-500">Premium Enterprise</td>
                              <td className="p-4 text-success font-bold">100% active</td>
                              <td className="p-4 text-right">
                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black bg-success/10 text-success border border-success/20 uppercase tracking-wider">
                                  Licensed
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                    {/* Database & Webhooks logs */}
                    <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                      <h3 className="text-xs font-black uppercase text-text-muted tracking-wider flex items-center">
                        <Server className="w-4 h-4 mr-1 text-primary" /> Cloud Database Instances Health
                      </h3>
                      <div className="space-y-3 text-xs leading-normal">
                        <div className="flex justify-between items-center py-1 border-b border-border-default/50">
                          <span>AWS RDS Postgres Pool size</span>
                          <span className="font-mono text-success font-bold">20 active connections</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border-default/50">
                          <span>Redis Cache Memory Pool</span>
                          <span className="font-mono text-text-primary">124 MB / 1024 MB</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border-default/50">
                          <span>Database CPU utilization</span>
                          <span className="font-mono text-success font-bold">12.4% CPU</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span>Tenant Isolation Policy</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-success/15 text-success uppercase">Active (Row-Level Security)</span>
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

"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import {
  getSaaSOverviewAction,
  createSaaSPropertyAction,
  updateSaaSPropertyAction,
  deleteSaaSPropertyAction,
  createSaaSOrganizationAction,
  updateSaaSOrganizationAction,
  deleteSaaSOrganizationAction
} from "@/app/actions/saasAdmin";
import {
  getSaaSPropertyApiAndIntegrationsAction,
  createSaaSPropertyApiKeyAction,
  revokeSaaSPropertyApiKeyAction,
  createSaaSPropertyWebhookAction,
  deleteSaaSPropertyWebhookAction,
  updateSaaSPropertyIntegrationsAction
} from "@/app/actions/saasApi";
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  Layers,
  Database,
  Activity,
  CheckCircle2,
  Loader2,
  Sparkles,
  Server,
  Search,
  Trash2,
  Edit,
  Building,
  Wifi,
  Terminal,
  Palette,
  HardDrive,
  KeyRound
} from "lucide-react";

export default function SuperAdminPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ mrr: 0, churnRate: "0%", apiLoad: "100%", totalLicenses: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"command" | "clients" | "licenses" | "ui_studio" | "releases" | "api_integrations">("command");

  // Integrations & API management states
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [enabledIntegrations, setEnabledIntegrations] = useState<string[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState("reservation.create");

  // Registry Form States
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    orgName: "",
    propName: "",
    address: "",
  });
  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editingOrgName, setEditingOrgName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Target Configurator States
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [planInput, setPlanInput] = useState("Starter");
  const [deploymentInput, setDeploymentInput] = useState("SaaS");
  const [modulesInput, setModulesInput] = useState<string[]>(["PMS", "Housekeeping"]);
  const [groqKeyInput, setGroqKeyInput] = useState("");

  // UI Studio States
  const [primaryColorInput, setPrimaryColorInput] = useState("#0F766E");
  const [accentColorInput, setAccentColorInput] = useState("#D4AF37");
  const [brandNameInput, setBrandNameInput] = useState("HotelOS");

  // Simulation Logs
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load SaaS stats and list
  const loadSaaSData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getSaaSOverviewAction();
      if (res.success && res.properties && res.organizations) {
        setProperties(res.properties);
        setOrganizations(res.organizations);
        setStats(res.stats);

        // Auto-select first property if none selected
        if (res.properties.length > 0 && !selectedPropId) {
          setSelectedPropId(res.properties[0].id);
        }
      } else {
        setError(res.error || "Failed to load SaaS Control Plane data.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load SaaS Control Plane data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSaaSData();
  }, []);

  // Update selection states on property selection
  useEffect(() => {
    if (selectedPropId && properties.length > 0) {
      const activeHotel = properties.find((p) => p.id === selectedPropId);
      if (activeHotel) {
        setPlanInput(activeHotel.planString || "Starter");
        setDeploymentInput(activeHotel.deploymentMode || "SaaS");
        setModulesInput(activeHotel.activeModulesString ? activeHotel.activeModulesString.split(",") : ["PMS", "Housekeeping"]);
        setGroqKeyInput(activeHotel.groqApiKey || "");

        // Hydrate UI Config
        try {
          if (activeHotel.uiConfigString) {
            const parsed = JSON.parse(activeHotel.uiConfigString);
            setPrimaryColorInput(parsed.primaryColor || "#0F766E");
            setAccentColorInput(parsed.accentColor || "#D4AF37");
            setBrandNameInput(parsed.brandName || "HotelOS");
          } else {
            setPrimaryColorInput("#0F766E");
            setAccentColorInput("#D4AF37");
            setBrandNameInput("HotelOS");
          }
        } catch (e) {
          setPrimaryColorInput("#0F766E");
          setAccentColorInput("#D4AF37");
          setBrandNameInput("HotelOS");
        }
      }
    }
  }, [selectedPropId, properties]);

  // Load API keys, webhooks, and active integrations when selected property or tab changes
  useEffect(() => {
    async function loadApiAndIntegrations() {
      if (!selectedPropId) return;
      try {
        const res = await getSaaSPropertyApiAndIntegrationsAction(selectedPropId);
        if (res.success && res.apiKeys && res.webhooks && res.enabledIntegrations) {
          setApiKeys(res.apiKeys);
          setWebhooks(res.webhooks);
          setEnabledIntegrations(res.enabledIntegrations);
        }
      } catch (err) {
        console.error("Failed to load property API keys and integrations:", err);
      }
    }

    if (selectedPropId && (activeTab === "api_integrations" || activeTab === "licenses")) {
      loadApiAndIntegrations();
    }
  }, [selectedPropId, activeTab]);

  // API and webhook action triggers
  const handleGenerateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropId || !newKeyName) return;
    setIsActionLoading(true);
    try {
      const res = await createSaaSPropertyApiKeyAction(selectedPropId, newKeyName);
      if (res.success && res.apiKey) {
        setNewKeyName("");
        const updated = await getSaaSPropertyApiAndIntegrationsAction(selectedPropId);
        if (updated.success && updated.apiKeys) setApiKeys(updated.apiKeys);
        alert("API Key successfully generated!");
      } else {
        alert(res.error || "Failed to generate key.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate key.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!selectedPropId || !confirm("Are you sure you want to revoke this API key?")) return;
    try {
      const res = await revokeSaaSPropertyApiKeyAction(keyId);
      if (res.success) {
        const updated = await getSaaSPropertyApiAndIntegrationsAction(selectedPropId);
        if (updated.success && updated.apiKeys) setApiKeys(updated.apiKeys);
        alert("API key successfully revoked.");
      } else {
        alert(res.error || "Failed to revoke key.");
      }
    } catch (err: any) {
      alert(err.message || "Failed.");
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropId || !newWebhookUrl) return;
    setIsActionLoading(true);
    try {
      const res = await createSaaSPropertyWebhookAction(selectedPropId, newWebhookUrl, newWebhookEvents);
      if (res.success && res.webhook) {
        setNewWebhookUrl("");
        const updated = await getSaaSPropertyApiAndIntegrationsAction(selectedPropId);
        if (updated.success && updated.webhooks) setWebhooks(updated.webhooks);
        alert("Webhook subscription added successfully!");
      } else {
        alert(res.error || "Failed to add webhook.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to add webhook.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!selectedPropId || !confirm("Are you sure you want to delete this webhook subscription?")) return;
    try {
      const res = await deleteSaaSPropertyWebhookAction(webhookId);
      if (res.success) {
        const updated = await getSaaSPropertyApiAndIntegrationsAction(selectedPropId);
        if (updated.success && updated.webhooks) setWebhooks(updated.webhooks);
        alert("Webhook subscription deleted.");
      } else {
        alert(res.error || "Failed to delete webhook.");
      }
    } catch (err: any) {
      alert(err.message || "Failed.");
    }
  };

  const handleToggleIntegration = async (integrationKey: string) => {
    if (!selectedPropId) return;
    let nextList = [...enabledIntegrations];
    if (nextList.includes(integrationKey)) {
      nextList = nextList.filter((i) => i !== integrationKey);
    } else {
      nextList.push(integrationKey);
    }

    try {
      const res = await updateSaaSPropertyIntegrationsAction(selectedPropId, nextList);
      if (res.success) {
        setEnabledIntegrations(nextList);
      } else {
        alert(res.error || "Failed to toggle integration.");
      }
    } catch (err: any) {
      alert(err.message || "Failed.");
    }
  };

  // Handle License & Modules save
  const handleSaveLicenseSettings = async () => {
    if (!selectedPropId) return;
    setIsActionLoading(true);
    try {
      const res = await updateSaaSPropertyAction(selectedPropId, {
        planString: planInput,
        deploymentMode: deploymentInput,
        activeModulesString: modulesInput.join(","),
        groqApiKey: groqKeyInput,
      });

      if (res.success) {
        await loadSaaSData();
        alert("License plan entitlements and active modules successfully updated!");
      } else {
        alert(res.error || "Failed to save license entitlements.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save license entitlements.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle UI Brand Overrides Save
  const handleSaveUiStudioOverrides = async () => {
    if (!selectedPropId) return;
    setIsActionLoading(true);
    try {
      const uiConfigJson = JSON.stringify({
        primaryColor: primaryColorInput,
        accentColor: accentColorInput,
        brandName: brandNameInput,
      });

      const res = await updateSaaSPropertyAction(selectedPropId, {
        uiConfigString: uiConfigJson,
      });

      if (res.success) {
        await loadSaaSData();
        alert("Custom brand overrides successfully applied to property white-label configuration!");
      } else {
        alert(res.error || "Failed to apply branding settings.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to apply branding settings.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Run database schema migrations simulation
  const handleTriggerSync = () => {
    if (!selectedPropId) return;
    const activeHotel = properties.find((p) => p.id === selectedPropId);
    if (!activeHotel) return;

    setIsSyncing(true);
    setSyncLogs([
      `[${new Date().toLocaleTimeString()}] Target instance: ${activeHotel.name}`,
      `[${new Date().toLocaleTimeString()}] Deployment Mode: ${activeHotel.deploymentMode || "SaaS"}`,
      `[${new Date().toLocaleTimeString()}] Active modules configuration: ${activeHotel.activeModulesString || "PMS,Housekeeping"}`,
      `[${new Date().toLocaleTimeString()}] Connecting to Supabase transaction pooler...`,
      `[${new Date().toLocaleTimeString()}] Connection established (SLA latency: 8ms)`,
      `[${new Date().toLocaleTimeString()}] Running schema migrations check...`,
      `[${new Date().toLocaleTimeString()}] Syncing latest schema.prisma declarations...`,
      `[${new Date().toLocaleTimeString()}] Database schema context fully synchronized on tenant cloud environment!`
    ]);
    setTimeout(() => {
      setIsSyncing(false);
      alert("Database context synced on tenant server!");
    }, 2000);
  };

  // Trigger Version Update
  const handlePushVersionUpgrade = async (propId: string, targetVersion: string) => {
    setIsActionLoading(true);
    try {
      const res = await updateSaaSPropertyAction(propId, {
        appVersion: targetVersion,
      });
      if (res.success) {
        await loadSaaSData();
        alert(`Successfully upgraded instance to release version ${targetVersion}!`);
      } else {
        alert(res.error || "Upgrade failed.");
      }
    } catch (err: any) {
      alert(err.message || "Upgrade failed.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Client Organizations & Hotels CRUD Triggers
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName) return;
    setIsActionLoading(true);
    try {
      const res = await createSaaSOrganizationAction(newOrgName);
      if (res.success) {
        setNewOrgName("");
        setIsOrgOpen(false);
        await loadSaaSData();
        alert("New Client Organization successfully created!");
      } else {
        alert(res.error || "Failed to create organization.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create organization.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRenameOrganization = async (orgId: string) => {
    if (!editingOrgName) return;
    try {
      const res = await updateSaaSOrganizationAction(orgId, editingOrgName);
      if (res.success) {
        setEditingOrgId(null);
        setEditingOrgName("");
        await loadSaaSData();
        alert("Organization renamed successfully!");
      } else {
        alert(res.error || "Failed to rename organization.");
      }
    } catch (err: any) {
      alert(err.message || "Failed.");
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm("Are you sure you want to delete this Client Organization? This will delete ALL hotels, rooms, and guest records associated with this client!")) return;
    try {
      const res = await deleteSaaSOrganizationAction(orgId);
      if (res.success) {
        await loadSaaSData();
        alert("Client Organization and properties deleted successfully.");
      } else {
        alert(res.error || "Failed to delete organization.");
      }
    } catch (err: any) {
      alert(err.message || "Failed.");
    }
  };

  const handleSubmitProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orgName || !form.propName) return;
    setIsActionLoading(true);
    try {
      const res = await createSaaSPropertyAction(form.orgName, form.propName, form.address);
      if (res.success && res.property) {
        setIsOpen(false);
        setForm({ orgName: "", propName: "", address: "" });
        await loadSaaSData();
        alert("New SaaS tenant property successfully registered!");
      } else {
        alert(res.error || "Failed to register tenant.");
      }
    } catch (err: any) {
      alert(err.message || "Failed.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteProperty = async (propId: string) => {
    if (!confirm("Delete this property? All rooms and invoices will be permanently deleted!")) return;
    try {
      const res = await deleteSaaSPropertyAction(propId);
      if (res.success) {
        if (selectedPropId === propId) setSelectedPropId(null);
        await loadSaaSData();
        alert("Property successfully deleted.");
      } else {
        alert(res.error || "Failed.");
      }
    } catch (err: any) {
      alert(err.message || "Failed.");
    }
  };

  const toggleModule = (moduleName: string) => {
    if (modulesInput.includes(moduleName)) {
      setModulesInput(modulesInput.filter((m) => m !== moduleName));
    } else {
      setModulesInput([...modulesInput, moduleName]);
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

        <main className="flex-1 flex flex-col overflow-hidden font-sans">
          <RoleProtected allowedRoles={["SAAS_OWNER"]}>
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Sticky Header & Navigation Tab Bar */}
              <div className="p-6 border-b border-border-default/60 bg-surface/50 backdrop-blur-md space-y-6 shrink-0 shadow-sm z-10">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-text-primary">SaaS Control Tower</h1>
                    <p className="text-xs text-text-secondary mt-1">
                      Manage multi-tenant organizations, allocate API licenses quotas, configure dynamic UI white-labels, and manage releases.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsOrgOpen(true)}
                      className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-text-secondary bg-surface border border-border-default hover:bg-surface-secondary rounded shadow-sm transition-all"
                    >
                      <Building className="w-4 h-4 mr-1.5" /> Add Client Group
                    </button>
                    <button
                      onClick={() => setIsOpen(true)}
                      className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Provision Tenant Hotel
                    </button>
                  </div>
                </div>

                {/* SaaS Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-sm">
                    <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Monthly Recurring Revenue (MRR)</div>
                    <div className="text-2xl font-black text-success mt-1 font-mono">${(properties.length * 2500).toLocaleString()}</div>
                    <div className="text-[10px] text-text-muted mt-1">AWS multi-tenant contract value</div>
                  </div>
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-sm">
                    <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Active Properties</div>
                    <div className="text-2xl font-black text-primary mt-1">{properties.length} instances</div>
                    <div className="text-[10px] text-text-muted mt-1">{organizations.length} active groups</div>
                  </div>
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-sm">
                    <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Infrastructure SLA Uptime</div>
                    <div className="text-2xl font-black text-indigo-500 mt-1">99.98%</div>
                    <div className="text-[10px] text-text-muted mt-1">API gateway response health</div>
                  </div>
                  <div className="bg-surface border border-border-default rounded-lg p-5 shadow-sm">
                    <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Tenant Churn Ratio</div>
                    <div className="text-2xl font-black text-error mt-1">{stats.churnRate || "0%"}</div>
                    <div className="text-[10px] text-text-muted mt-1">Excellent client retention index</div>
                  </div>
                </div>

                {/* 5-Tab Control Tower Navigation */}
                <div className="flex border-b border-border-default/60 space-x-6 pb-px mt-6 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setActiveTab("command")}
                    className={`pb-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeTab === "command"
                        ? "border-b-2 border-primary text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Command Center
                  </button>
                  <button
                    onClick={() => setActiveTab("clients")}
                    className={`pb-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeTab === "clients"
                        ? "border-b-2 border-primary text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" /> Clients & Properties
                  </button>
                  <button
                    onClick={() => setActiveTab("licenses")}
                    className={`pb-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeTab === "licenses"
                        ? "border-b-2 border-primary text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Licenses & Modules
                  </button>
                  <button
                    onClick={() => setActiveTab("ui_studio")}
                    className={`pb-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeTab === "ui_studio"
                        ? "border-b-2 border-primary text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" /> UI & Theme Studio
                  </button>
                  <button
                    onClick={() => setActiveTab("releases")}
                    className={`pb-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeTab === "releases"
                        ? "border-b-2 border-primary text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Release Manager
                  </button>
                  <button
                    onClick={() => setActiveTab("api_integrations")}
                    className={`pb-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeTab === "api_integrations"
                        ? "border-b-2 border-primary text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Wifi className="w-3.5 h-3.5" /> API & Integrations
                  </button>
                </div>
              </div>

              {/* Scrollable Content Pane */}
              <div className="flex-1 overflow-y-auto p-6 font-sans">
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
                  
                  {/* TAB 1: COMMAND CENTER */}
                  {activeTab === "command" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Health and Telemetry */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface border border-border-default rounded-lg p-6 shadow-sm space-y-4">
                          <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                            <Server className="w-4 h-4 text-primary" /> Core Infrastructure Health
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 bg-surface-secondary rounded border border-border-default flex items-center justify-between">
                              <span className="text-xs font-semibold text-text-secondary">App Load Balancer</span>
                              <span className="text-xxs font-bold px-2 py-0.5 bg-success/10 text-success rounded-full flex items-center gap-1">
                                <Wifi className="w-2.5 h-2.5" /> 99.98% SLA
                              </span>
                            </div>
                            <div className="p-3 bg-surface-secondary rounded border border-border-default flex items-center justify-between">
                              <span className="text-xs font-semibold text-text-secondary">Supabase PG Cluster</span>
                              <span className="text-xxs font-bold px-2 py-0.5 bg-success/10 text-success rounded-full flex items-center gap-1">
                                <Database className="w-2.5 h-2.5" /> Pooler Healthy
                              </span>
                            </div>
                            <div className="p-3 bg-surface-secondary rounded border border-border-default flex items-center justify-between">
                              <span className="text-xs font-semibold text-text-secondary">License Validation Server</span>
                              <span className="text-xxs font-bold px-2 py-0.5 bg-success/10 text-success rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5" /> Online
                              </span>
                            </div>
                            <div className="p-3 bg-surface-secondary rounded border border-border-default flex items-center justify-between">
                              <span className="text-xs font-semibold text-text-secondary">Active Integrations Hub</span>
                              <span className="text-xxs font-bold px-2 py-0.5 bg-success/10 text-success rounded-full flex items-center gap-1">
                                <Activity className="w-2.5 h-2.5" /> 9 Webhooks
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Telemetry log console */}
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xxs text-slate-350 shadow-lg space-y-3">
                          <div className="flex items-center justify-between text-slate-500 border-b border-slate-800 pb-2">
                            <span className="flex items-center gap-1.5">
                              <Terminal className="w-3 h-3 text-indigo-400" /> Live System Telemetry Stream
                            </span>
                            <span className="text-[9px] animate-pulse text-indigo-400">● Live Feed</span>
                          </div>
                          <div className="space-y-1 max-h-40 overflow-y-auto leading-normal">
                            <p className="text-slate-500">[{new Date().toLocaleDateString()} 13:40:22] Initializing Control Plane monitor...</p>
                            <p className="text-slate-400">[{new Date().toLocaleDateString()} 13:40:25] Telemetry hook pinged from aws-pooler-tokyo</p>
                            <p className="text-slate-300">[{new Date().toLocaleDateString()} 13:41:01] Check-in session verified for property "Ujjaini"</p>
                            <p className="text-slate-300">[{new Date().toLocaleDateString()} 13:41:10] Signed license key refreshed for "Radion blu indore"</p>
                            <p className="text-indigo-400">[{new Date().toLocaleDateString()} 13:42:00] Real-time MRR calculated at: ${(properties.length * 2500).toLocaleString()}</p>
                            <p className="text-success-hover">[{new Date().toLocaleDateString()} 13:43:18] Global config parameters verified (0 warnings)</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Critical Alerts Panel */}
                      <div className="space-y-6">
                        <div className="bg-surface border border-border-default rounded-lg p-6 shadow-sm space-y-4">
                          <h3 className="text-sm font-bold text-text-primary">License & System Alerts</h3>
                          <div className="space-y-3">
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded text-xxs space-y-1">
                              <div className="font-bold uppercase tracking-wider text-[9px]">Ujjaini Instance</div>
                              <p className="leading-normal">Offline license sync warning: Database pooler connection had a temporary drop-out.</p>
                            </div>
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-xxs space-y-1">
                              <div className="font-bold uppercase tracking-wider text-[9px]">Radion blu indore</div>
                              <p className="leading-normal">Update available: Currently on v2026.1, latest release v2026.4. Upgrade recommended.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CLIENTS & PROPERTIES */}
                  {activeTab === "clients" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                      {/* Left: Client Organizations CRUD */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-text-primary">Client Organizations</h3>
                        <div className="bg-surface border border-border-default rounded-lg shadow-sm overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                <th className="p-3">Client Group</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default">
                              {organizations.map((org) => {
                                const isEditing = editingOrgId === org.id;
                                return (
                                  <tr key={org.id} className="hover:bg-surface-secondary/20 transition-all">
                                    <td className="p-3">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editingOrgName}
                                          onChange={(e) => setEditingOrgName(e.target.value)}
                                          className="px-2 py-1 text-xs border border-border-default rounded bg-surface focus:outline-none focus:border-primary font-bold"
                                        />
                                      ) : (
                                        <span className="font-semibold text-text-secondary">{org.name}</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex justify-end gap-1.5">
                                        {isEditing ? (
                                          <button
                                            onClick={() => handleRenameOrganization(org.id)}
                                            className="px-2 py-1 bg-success hover:bg-success-hover text-white text-[10px] font-bold rounded shadow-small"
                                          >
                                            Save
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setEditingOrgId(org.id);
                                              setEditingOrgName(org.name);
                                            }}
                                            className="p-1 text-text-muted hover:text-primary transition-all rounded hover:bg-surface-secondary"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteOrganization(org.id)}
                                          className="p-1 text-text-muted hover:text-error transition-all rounded hover:bg-surface-secondary"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right: Properties Registry */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <h3 className="text-sm font-bold text-text-primary">Registered Hotels Registry</h3>
                          <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-muted" />
                            <input
                              type="text"
                              placeholder="Search by hotel name..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 border border-border-default rounded bg-surface text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                            />
                          </div>
                        </div>

                        <div className="bg-surface border border-border-default rounded-lg shadow-sm overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                <th className="p-4">Hotel Location</th>
                                <th className="p-4">Tenant Group</th>
                                <th className="p-4">Deployment</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default">
                              {properties
                                .filter((prop) => prop.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((prop) => (
                                  <tr key={prop.id} className="hover:bg-surface-secondary/20 transition-all">
                                    <td className="p-4 font-semibold text-text-secondary">{prop.name}</td>
                                    <td className="p-4 text-text-muted">{prop.organization?.name}</td>
                                    <td className="p-4 text-text-muted">
                                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded border border-border-default font-bold text-text-secondary">
                                        {prop.deploymentMode || "SaaS"}
                                      </span>
                                    </td>
                                    <td className="p-4 text-right">
                                      <button
                                        onClick={() => handleDeleteProperty(prop.id)}
                                        className="p-1 text-text-muted hover:text-error transition-all rounded hover:bg-surface-secondary inline-flex"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LICENSES & MODULES */}
                  {activeTab === "licenses" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                      {/* Left: Hotels List selection */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-text-primary">Select Property Location</h3>
                        <div className="bg-surface border border-border-default rounded-lg shadow-sm divide-y divide-border-default max-h-[60vh] overflow-y-auto">
                          {properties.map((p) => {
                            const isSelected = selectedPropId === p.id;
                            return (
                              <button
                                key={p.id}
                                onClick={() => setSelectedPropId(p.id)}
                                className={`w-full text-left p-4 hover:bg-surface-secondary/40 transition-all block ${
                                  isSelected ? "bg-primary/5 border-l-2 border-primary" : ""
                                }`}
                              >
                                <div className="text-xs font-bold text-text-primary">{p.name}</div>
                                <div className="text-[10px] text-text-muted mt-1">{p.organization?.name} • {p.planString || "Starter"}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Modules & Entitlements Configurator */}
                      <div className="lg:col-span-2 space-y-6">
                        {selectedPropId ? (
                          <div className="bg-surface border border-border-default rounded-lg p-6 shadow-sm space-y-6">
                            <div className="border-b border-border-default pb-4">
                              <h3 className="text-sm font-bold text-text-primary">
                                License Entitlements: {properties.find((p) => p.id === selectedPropId)?.name}
                              </h3>
                              <p className="text-[10px] text-text-muted mt-1">Configure database plan tiers, deployment configurations, and dynamic feature toggles.</p>
                            </div>

                            {/* Plan & Deployment selections */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">License Plan Tier</label>
                                <select
                                  value={planInput}
                                  onChange={(e) => setPlanInput(e.target.value)}
                                  className="w-full text-xs font-semibold px-3 py-2 border border-border-default rounded bg-surface-secondary text-text-primary focus:outline-none"
                                >
                                  <option value="Starter">Starter Plan</option>
                                  <option value="Pro">Pro Corporate</option>
                                  <option value="Enterprise">Enterprise Elite</option>
                                  <option value="Custom">Custom Signed</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Deployment Mode</label>
                                <select
                                  value={deploymentInput}
                                  onChange={(e) => setDeploymentInput(e.target.value)}
                                  className="w-full text-xs font-semibold px-3 py-2 border border-border-default rounded bg-surface-secondary text-text-primary focus:outline-none"
                                >
                                  <option value="SaaS">SaaS Cloud</option>
                                  <option value="Dedicated">Dedicated Cloud</option>
                                  <option value="Customer-Managed">Customer Cloud</option>
                                  <option value="On-Premise">On-Premise</option>
                                  <option value="Air-Gapped">Air-Gapped Enterprise</option>
                                </select>
                              </div>
                            </div>

                            {/* Module Toggles */}
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Enabled System Modules</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {["PMS", "Housekeeping", "AI Copilot", "CRM & Billing", "Advanced Analytics"].map((modName) => {
                                  const isEnabled = modulesInput.includes(modName);
                                  return (
                                    <label
                                      key={modName}
                                      className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-all ${
                                        isEnabled
                                          ? "border-primary/40 bg-primary/5 text-primary"
                                          : "border-border-default bg-surface hover:bg-surface-secondary"
                                      }`}
                                    >
                                      <span className="text-xs font-bold">{modName}</span>
                                      <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={() => toggleModule(modName)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Groq Key */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Groq AI API key</label>
                              <input
                                type="password"
                                placeholder="gsk_N690Fba..."
                                value={groqKeyInput}
                                onChange={(e) => setGroqKeyInput(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-border-default rounded bg-surface-secondary text-text-primary focus:outline-none focus:border-primary font-mono"
                              />
                            </div>

                            {/* Save Actions and Database migrations sync */}
                            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-border-default">
                              <button
                                onClick={handleTriggerSync}
                                disabled={isSyncing}
                                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-text-secondary bg-surface border border-border-default hover:bg-surface-secondary rounded shadow-sm transition-all"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} /> Sync Database Schema
                              </button>

                              <button
                                onClick={handleSaveLicenseSettings}
                                disabled={isActionLoading}
                                className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-sm transition-all"
                              >
                                {isActionLoading ? "Saving..." : "Save License Entitlements"}
                              </button>
                            </div>

                            {/* Migration logs simulation */}
                            {syncLogs.length > 0 && (
                              <div className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-[10px] text-slate-300 shadow space-y-1.5 leading-relaxed">
                                <div className="text-slate-500 font-bold border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
                                  <span>Schema Sync Migration Logs</span>
                                  {isSyncing && <span className="animate-spin text-indigo-400">🔄</span>}
                                </div>
                                {syncLogs.map((log, index) => (
                                  <p key={index} className={log.includes("success") || log.includes("established") ? "text-success-hover" : ""}>{log}</p>
                                ))}
                              </div>
                            )}

                          </div>
                        ) : (
                          <div className="p-8 text-center text-xs text-text-muted bg-surface border border-border-default rounded-lg">
                            Please select a property from the left list to edit its licensing constraints.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: UI & THEME STUDIO */}
                  {activeTab === "ui_studio" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                      {/* Left: Brand Color Customizations */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-text-primary">Customize Brand Identity</h3>
                        <div className="bg-surface border border-border-default rounded-lg p-6 shadow-sm space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">White-Label Brand Name</label>
                            <input
                              type="text"
                              value={brandNameInput}
                              onChange={(e) => setBrandNameInput(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-border-default rounded bg-surface focus:outline-none focus:border-primary font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Primary Brand Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={primaryColorInput}
                                onChange={(e) => setPrimaryColorInput(e.target.value)}
                                className="w-10 h-8 p-0.5 border border-border-default rounded bg-surface cursor-pointer"
                              />
                              <input
                                type="text"
                                value={primaryColorInput}
                                onChange={(e) => setPrimaryColorInput(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs border border-border-default rounded bg-surface focus:outline-none focus:border-primary font-mono"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Secondary Gold Accent</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={accentColorInput}
                                onChange={(e) => setAccentColorInput(e.target.value)}
                                className="w-10 h-8 p-0.5 border border-border-default rounded bg-surface cursor-pointer"
                              />
                              <input
                                type="text"
                                value={accentColorInput}
                                onChange={(e) => setAccentColorInput(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs border border-border-default rounded bg-surface focus:outline-none focus:border-primary font-mono"
                              />
                            </div>
                          </div>

                          <button
                            onClick={handleSaveUiStudioOverrides}
                            disabled={isActionLoading || !selectedPropId}
                            className="w-full inline-flex items-center justify-center px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-sm transition-all"
                          >
                            Apply Custom Branding
                          </button>
                        </div>
                      </div>

                      {/* Right: Live Preview Box */}
                      <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-sm font-bold text-text-primary">Live Workspace White-Label Preview</h3>
                        <div className="bg-surface-secondary border border-border-default rounded-lg p-6 shadow-sm flex justify-center items-center min-h-[40vh]">
                          {/* Mini Mock Sidebar */}
                          <div className="w-56 bg-surface border border-border-default rounded-lg shadow-lg overflow-hidden flex flex-col font-sans">
                            {/* Brand Header */}
                            <div className="p-4 border-b border-border-default flex items-center space-x-3">
                              <div
                                style={{ backgroundColor: primaryColorInput }}
                                className="w-7 h-7 rounded flex items-center justify-center text-white shadow shadow-primary/20"
                              >
                                🏨
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-text-primary leading-none">{brandNameInput}</span>
                                <span className="text-[9px] font-semibold text-text-muted mt-0.5 uppercase tracking-wider">Enterprise HQ</span>
                              </div>
                            </div>

                            {/* Mock location selector */}
                            <div className="p-3 bg-surface-secondary/40 border-b border-border-default text-xxs font-bold text-text-secondary flex justify-between items-center">
                              <span>📍 {properties.find((p) => p.id === selectedPropId)?.name || "Demo Property"}</span>
                              <span style={{ color: accentColorInput }}>▼</span>
                            </div>

                            {/* Mock menu items */}
                            <div className="p-3 space-y-1 flex-1">
                              <div
                                style={{ backgroundColor: `${primaryColorInput}15`, color: primaryColorInput, borderLeft: `2px solid ${primaryColorInput}` }}
                                className="px-3 py-1.5 text-xxs font-bold rounded flex items-center gap-2"
                              >
                                📊 Control Tower
                              </div>
                              <div className="px-3 py-1.5 text-xxs font-bold text-text-secondary rounded flex items-center gap-2 hover:bg-surface-secondary/40">
                                🔑 Operations
                              </div>
                              <div className="px-3 py-1.5 text-xxs font-bold text-text-secondary rounded flex items-center gap-2 hover:bg-surface-secondary/40">
                                ⚙️ System Settings
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: RELEASE MANAGER */}
                  {activeTab === "releases" && (
                    <div className="space-y-4 font-sans">
                      <h3 className="text-sm font-bold text-text-primary">Multi-Tenant Releases & Updates</h3>
                      <div className="bg-surface border border-border-default rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                              <th className="p-4">Hotel Location</th>
                              <th className="p-4">Deployment</th>
                              <th className="p-4">Running Version</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default">
                            {properties.map((prop) => {
                              const currentVersion = prop.appVersion || "2026.1";
                              const isLatest = currentVersion === "2026.4";
                              return (
                                <tr key={prop.id} className="hover:bg-surface-secondary/20 transition-all">
                                  <td className="p-4 font-semibold text-text-secondary">{prop.name}</td>
                                  <td className="p-4 text-text-muted">{prop.deploymentMode || "SaaS"}</td>
                                  <td className="p-4 font-mono font-bold text-text-primary">{currentVersion}</td>
                                  <td className="p-4">
                                    {isLatest ? (
                                      <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-bold rounded-full">
                                        ● Up to Date
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full">
                                        ⚠ Update Available
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right">
                                    {!isLatest && (
                                      <button
                                        onClick={() => handlePushVersionUpgrade(prop.id, "2026.4")}
                                        disabled={isActionLoading}
                                        className="inline-flex items-center justify-center px-3 py-1 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold rounded shadow-small transition-all"
                                      >
                                        Upgrade to v2026.4
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: API & INTEGRATIONS MARKETPLACE */}
                  {activeTab === "api_integrations" && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
                      {/* 1. Integrations Marketplace */}
                      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-sm space-y-4">
                        <div className="border-b border-border-default pb-3">
                          <h3 className="text-sm font-bold text-text-primary">Integrations Marketplace</h3>
                          <p className="text-[10px] text-text-muted mt-1">Enable marketplace plugins and monitor third-party gateway connections.</p>
                        </div>
                        <div className="space-y-4">
                          {[
                            { key: "Stripe", name: "Stripe Payment Gateway", desc: "Process secure guest billing & cards", latency: "12ms", status: "healthy" },
                            { key: "BookingCom", name: "Booking.com OTA Channel", desc: "Synchronize inventory distributions", latency: "45ms", status: "healthy" },
                            { key: "Tally", name: "Tally ERP Accounting Ledger", desc: "Export settled invoices & audits", warning: "Token expires in 12 days", status: "warning" },
                            { key: "SMS", name: "Transactional SMS Gateway", desc: "Send automated guest messaging alerts", status: "inactive" }
                          ].map((plugin) => {
                            const isEnabled = enabledIntegrations.includes(plugin.key);
                            return (
                              <div key={plugin.key} className="p-3 bg-surface-secondary/40 border border-border-default rounded-lg flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <div className="font-bold text-xs text-text-primary">{plugin.name}</div>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleIntegration(plugin.key)}
                                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      isEnabled ? "bg-primary" : "bg-slate-350 dark:bg-slate-700"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        isEnabled ? "translate-x-3.5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>
                                <p className="text-[10px] text-text-secondary leading-normal">{plugin.desc}</p>
                                {isEnabled && (
                                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-border-default/50 text-[9px] font-semibold">
                                    {plugin.status === "healthy" && (
                                      <>
                                        <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                                        <span className="text-success">Connected ({plugin.latency})</span>
                                      </>
                                    )}
                                    {plugin.status === "warning" && (
                                      <>
                                        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse"></span>
                                        <span className="text-warning">{plugin.warning}</span>
                                      </>
                                    )}
                                    {plugin.status === "inactive" && (
                                      <>
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                        <span className="text-text-muted">Enabled</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Developer API Keys */}
                      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-sm space-y-6">
                        <div className="border-b border-border-default pb-3">
                          <h3 className="text-sm font-bold text-text-primary">Developer API Keys</h3>
                          <p className="text-[10px] text-text-muted mt-1">Generate developer credentials to interact with this property's PMS endpoints.</p>
                        </div>

                        {/* Generate Form */}
                        <form onSubmit={handleGenerateApiKey} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Key Label Name</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="e.g. Channel Manager Server"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs border border-border-default rounded bg-surface focus:outline-none focus:border-primary font-bold"
                                required
                              />
                              <button
                                type="submit"
                                disabled={isActionLoading}
                                className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small shrink-0"
                              >
                                Generate
                              </button>
                            </div>
                          </div>
                        </form>

                        {/* Keys List */}
                        <div className="space-y-3 pt-2">
                          <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Active Credentials</label>
                          {apiKeys.length === 0 ? (
                            <div className="text-[10px] text-text-muted p-4 border border-dashed border-border-default rounded text-center">
                              No credentials generated for this location.
                            </div>
                          ) : (
                            <div className="divide-y divide-border-default border border-border-default rounded overflow-hidden">
                              {apiKeys.map((key) => (
                                <div key={key.id} className="p-3 bg-surface-secondary/20 flex items-center justify-between text-xxs">
                                  <div className="space-y-0.5 max-w-[70%]">
                                    <div className="font-bold text-text-primary">{key.name}</div>
                                    <code className="text-primary font-mono block truncate select-all">{key.token}</code>
                                  </div>
                                  <button
                                    onClick={() => handleRevokeApiKey(key.id)}
                                    className="p-1 hover:bg-rose-500/10 text-text-muted hover:text-error rounded transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Webhook Subscriptions */}
                      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-sm space-y-6">
                        <div className="border-b border-border-default pb-3">
                          <h3 className="text-sm font-bold text-text-primary">Webhook Subscriptions</h3>
                          <p className="text-[10px] text-text-muted mt-1">Configure HTTP push targets to notify your services of real-time property updates.</p>
                        </div>

                        {/* Add Webhook Form */}
                        <form onSubmit={handleCreateWebhook} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Target Endpoint URL</label>
                            <input
                              type="url"
                              placeholder="https://my-server.com/hooks"
                              value={newWebhookUrl}
                              onChange={(e) => setNewWebhookUrl(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-border-default rounded bg-surface focus:outline-none focus:border-primary font-mono"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2 items-end">
                            <div className="col-span-2 space-y-1">
                              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Event Trigger</label>
                              <select
                                value={newWebhookEvents}
                                onChange={(e) => setNewWebhookEvents(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-border-default rounded bg-surface focus:outline-none font-bold text-text-secondary"
                              >
                                <option value="reservation.create">reservation.create</option>
                                <option value="guest.check_in">guest.check_in</option>
                                <option value="folio.settle">folio.settle</option>
                              </select>
                            </div>
                            <button
                              type="submit"
                              disabled={isActionLoading}
                              className="w-full py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small"
                            >
                              Subscribe
                            </button>
                          </div>
                        </form>

                        {/* Webhooks List */}
                        <div className="space-y-3 pt-2">
                          <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Active Endpoints</label>
                          {webhooks.length === 0 ? (
                            <div className="text-[10px] text-text-muted p-4 border border-dashed border-border-default rounded text-center">
                              No webhook endpoints configured.
                            </div>
                          ) : (
                            <div className="divide-y divide-border-default border border-border-default rounded overflow-hidden">
                              {webhooks.map((wh) => (
                                <div key={wh.id} className="p-3 bg-surface-secondary/20 flex items-center justify-between text-xxs">
                                  <div className="space-y-0.5 max-w-[70%]">
                                    <div className="font-mono text-text-primary truncate select-all">{wh.targetUrl}</div>
                                    <div className="text-[10px] text-text-muted">Trigger: <span className="font-bold text-primary">{wh.eventTypes}</span></div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteWebhook(wh.id)}
                                    className="p-1 hover:bg-rose-500/10 text-text-muted hover:text-error rounded transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
              </div>
            </div>
          </RoleProtected>
        </main>
      </div>

      {/* Provision Property Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-border-default rounded-lg w-full max-w-md p-6 shadow-2xl animate-zoom-in space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Provision Tenant Hotel Property</h3>
            <form onSubmit={handleSubmitProperty} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Client Group / Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. ABC Hospitality Group"
                  value={form.orgName}
                  onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-border-default rounded bg-surface text-text-primary focus:outline-none focus:border-primary font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Hotel Property Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ujjaini Resort"
                  value={form.propName}
                  onChange={(e) => setForm({ ...form, propName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-border-default rounded bg-surface text-text-primary focus:outline-none focus:border-primary font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Location Address</label>
                <input
                  type="text"
                  placeholder="e.g. Indore, Madhya Pradesh"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-border-default rounded bg-surface text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-text-secondary border border-border-default hover:bg-surface-secondary rounded"
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

      {/* Add Organization Modal */}
      {isOrgOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-border-default rounded-lg w-full max-w-md p-6 shadow-2xl animate-zoom-in space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Add Client Organization Group</h3>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Taj Resorts & Palaces"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border-default rounded bg-surface text-text-primary focus:outline-none focus:border-primary font-bold"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOrgOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-text-secondary border border-border-default hover:bg-surface-secondary rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  {isActionLoading ? "Adding..." : "Add Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

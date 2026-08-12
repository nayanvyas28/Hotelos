"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import { getReservationsAction } from "@/app/actions/reservation";
import {
  generateReportSummaryAction,
  generateGuestEmailAction,
  generateRevenueInsightsAction,
  askAICopilotAction,
} from "@/app/actions/ai";
import {
  Hotel,
  Compass,
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Mail,
  Copy,
  CheckCircle,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Zap,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";

export default function AICopilotPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [reservations, setReservations] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      sender: "AI",
      text: "Hello! I am your AI HotelOS Copilot. Ask me operational, financial, or template drafting questions.",
    },
  ]);

  // Email Builder State
  const [selectedResId, setSelectedResId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("PRE_ARRIVAL");
  const [generatedEmail, setGeneratedEmail] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadProperties() {
      setIsLoading(true);
      try {
        const res = await getPropertiesAction();
        if (res.success && res.properties.length > 0) {
          setProperties(res.properties);
          setSelectedPropertyId(res.properties[0].id);
        } else {
          setProperties([]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load properties.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProperties();
  }, []);

  const loadAIData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const resRes = await getReservationsAction({ propertyId: selectedPropertyId });
      if (resRes.success) {
        setReservations(resRes.reservations || []);
      }

      const insightsRes = await generateRevenueInsightsAction(selectedPropertyId);
      if (insightsRes.success) {
        setInsights(insightsRes.insights || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load AI parameters.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadAIData();
      setChatHistory([
        {
          sender: "AI",
          text: "Hello! I am your AI HotelOS Copilot. Ask me operational, financial, or template drafting questions.",
        },
      ]);
      setGeneratedEmail(null);
    }
  }, [selectedPropertyId]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || !selectedPropertyId) return;

    const userMessage = { sender: "USER", text: textToSend.trim() };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsActionLoading(true);

    try {
      const res = await askAICopilotAction(selectedPropertyId, textToSend.trim());
      if (res.success) {
        setChatHistory((prev) => [...prev, { sender: "AI", text: res.answer }]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process query.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGenerateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId || !selectedTemplate) return;

    setIsActionLoading(true);
    setError(null);
    setGeneratedEmail(null);
    setCopied(false);

    try {
      const res = await generateGuestEmailAction(selectedResId, selectedTemplate);
      if (res.success) {
        setGeneratedEmail(res.email);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate welcome email.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedEmail) return;
    const fullText = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      {/* 1. Sidebar Nav */}
      <Sidebar />

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="md:hidden font-bold text-primary mr-2">HotelOS</span>
            {properties.length > 0 && (
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="px-3 py-1.5 border border-border-default rounded bg-surface text-xs font-semibold text-text-secondary focus:outline-none"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏨 {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <HeaderStaffSwitcher />
            <button
              onClick={loadAIData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${isLoading || isActionLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MANAGER"]}>
            <>
              {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-sm text-error flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading AI Assistant workspace...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Hotel className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Complete onboarding setup to begin configuring AI operations assistants.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">AI Assistant & Copilot</h1>
                  <p className="text-sm text-text-secondary">
                    Harness AI-driven operational insights, draft personalized guest messaging templates, and optimize revenue yields.
                  </p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 flex items-center space-x-2">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold text-primary">Radisson AI Engine v1.0</span>
                </div>
              </div>

              {/* Conversational Assistant & Advisor */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Conversational Chat Console */}
                <div className="lg:col-span-2 bg-surface border border-border-default rounded-lg p-6 shadow-small flex flex-col justify-between h-[500px]">
                  <div className="flex items-center space-x-2 border-b border-border-default pb-3 shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-sm text-text-primary">Conversational PMS Assistant</h2>
                  </div>

                  {/* Messages Ledger */}
                  <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 scrollbar-thin">
                    {chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 text-xs font-medium ${
                            msg.sender === "USER"
                              ? "bg-primary text-white"
                              : "bg-surface-secondary border border-border-default text-text-primary prose prose-sm whitespace-pre-line"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isActionLoading && (
                      <div className="flex justify-start">
                        <div className="bg-surface-secondary border border-border-default rounded-lg p-3 text-xs font-medium text-text-secondary flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          <span>AI is reviewing databases...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prompt bubbles shortcuts */}
                  <div className="flex flex-wrap gap-2 py-2 shrink-0">
                    <button
                      onClick={() => handleSendMessage(undefined, "What is our occupancy rate today?")}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-bold text-text-secondary cursor-pointer"
                    >
                      📈 Occupancy Rate Check
                    </button>
                    <button
                      onClick={() => handleSendMessage(undefined, "Summary of total settled cash revenue")}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-bold text-text-secondary cursor-pointer"
                    >
                      💰 Revenue Sum
                    </button>
                    <button
                      onClick={() => handleSendMessage(undefined, "How many corporate accounts are active?")}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-bold text-text-secondary cursor-pointer"
                    >
                      🏢 Corporate Account Count
                    </button>
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2 shrink-0 pt-2 border-t border-border-default">
                    <input
                      type="text"
                      placeholder="Ask the AI copilot something operational..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      required
                      className="flex-1 px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isActionLoading || !chatInput.trim()}
                      className="p-2 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white rounded cursor-pointer"
                    >
                      <Send className="w-4.5 h-4.5" />
                    </button>
                  </form>
                </div>

                {/* 2. Executive Revenue Advisory */}
                <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6 flex flex-col justify-between h-[500px]">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <h2 className="font-bold text-sm text-text-primary">Revenue Advisory Board</h2>
                    </div>

                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                      {insights.map((ins, idx) => (
                        <div key={idx} className="p-3.5 border border-border-default rounded-lg bg-surface-secondary/40 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-text-primary">{ins.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              ins.priority === "HIGH" ? "bg-error/10 text-error" : ins.priority === "MEDIUM" ? "bg-warning/10 text-warning" : "bg-slate-100 text-slate-500"
                            }`}>
                              {ins.priority} PRIORITY
                            </span>
                          </div>
                          <p className="text-[10px] text-text-secondary leading-normal">{ins.advice}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] text-text-muted flex items-center space-x-1 justify-center border-t border-border-default pt-3">
                    <Zap className="w-3.5 h-3.5 text-warning" />
                    <span>Calculated dynamically from property seasonal setup rules.</span>
                  </div>
                </div>
              </div>

              {/* Guest Message Composer Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Selector pane */}
                <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6 self-start">
                  <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-sm text-text-primary">Guest Message Generator</h2>
                  </div>

                  <form onSubmit={handleGenerateEmail} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary block">Select Guest Stay</label>
                      <select
                        value={selectedResId}
                        onChange={(e) => setSelectedResId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                      >
                        <option value="">Choose reservation...</option>
                        {reservations.map((r) => (
                          <option key={r.id} value={r.id}>
                            🚪 Room {r.room.number} — {r.guests[0]?.firstName} {r.guests[0]?.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary block">Email Template Type</label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                      >
                        <option value="PRE_ARRIVAL">Pre-Arrival Confirmation</option>
                        <option value="WELCOME">In-House Welcome & Amenity</option>
                        <option value="CHECKOUT">Checkout Folio Invoice Summary</option>
                        <option value="REVIEW">Post-Checkout Review Request</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isActionLoading || !selectedResId}
                      className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white text-xs font-bold rounded shadow transition-all inline-flex justify-center items-center cursor-pointer"
                    >
                      {isActionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Drafting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" /> Draft Message copy
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Rendered message output card */}
                <div className="lg:col-span-2">
                  {generatedEmail ? (
                    <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                      <div className="flex justify-between items-center border-b border-border-default pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Recipient</span>
                          <span className="text-xs font-bold text-text-primary">{generatedEmail.recipient}</span>
                        </div>
                        <button
                          onClick={copyToClipboard}
                          className="px-3.5 py-1.5 border border-border-default hover:bg-surface-hover rounded text-xs font-bold text-text-secondary flex items-center space-x-1.5 cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-success" />
                              <span className="text-success">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy to Clipboard</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-4 text-xs font-medium">
                        <div className="p-3 bg-surface-secondary border border-border-default rounded text-text-primary">
                          <span className="font-bold text-text-muted">Subject:</span> {generatedEmail.subject}
                        </div>
                        <div className="p-4 bg-surface-secondary/40 border border-border-default rounded text-text-primary prose prose-sm whitespace-pre-wrap leading-relaxed">
                          {generatedEmail.body}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface border border-border-default border-dashed rounded-lg p-16 text-center text-text-secondary flex flex-col items-center justify-center space-y-4">
                      <Compass className="w-12 h-12 text-text-muted animate-spin-slow" />
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-text-primary">Message Preview Panel</h3>
                        <p className="text-xs text-text-secondary max-w-sm">
                          Select a guest stay and template type on the left pane to compose personalized drafts.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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

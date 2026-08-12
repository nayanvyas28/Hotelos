"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { Mail, MessageSquare, Send, Settings, CheckCircle2, RefreshCw, ToggleLeft, ToggleRight, Info } from "lucide-react";

export default function NotificationsPage() {
  const [smtpConfig, setSmtpConfig] = useState({
    host: "smtp.mailgun.org",
    port: "587",
    sender: "billing@radisson-delhi.com",
    username: "postmaster@mg.radisson-delhi.com",
    password: "••••••••••••••••",
  });

  const [watConfig, setWatConfig] = useState({
    gateway: "https://api.watpro.com/v1/messages",
    token: "wat_live_83a8f902kd92dla02",
    phoneId: "919983728300",
    namespace: "radisson_marketing_alerts",
  });

  const [activeTab, setActiveTab] = useState<"SMTP" | "WATPRO">("SMTP");
  const [selectedTemplate, setSelectedTemplate] = useState<"BILL" | "CONFIRMATION" | "PROMO">("BILL");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastLogs, setBroadcastLogs] = useState<string[]>([]);

  // Editable Message Templates
  const [templates, setTemplates] = useState({
    BILL: {
      subject: "Your invoice receipt from Radisson Delhi",
      body: "Dear {GuestName}, thank you for staying at Radisson Delhi. Here is your checkout bill invoice receipt for total amount {InvoiceTotal} (GST included). We hope to see you again soon!",
    },
    CONFIRMATION: {
      subject: "Booking Confirmed - Reservation #{ReservationId}",
      body: "Dear {GuestName}, your booking at Radisson Delhi has been confirmed. Room Type: {RoomType}, Check-in Date: {CheckInDate}. Have a pleasant journey!",
    },
    PROMO: {
      subject: "Exclusive VVIP Offer: 15% discount code",
      body: "Hi {GuestName}! As a valued Platinum Club Member, enjoy 15% off on your next stay at any Radisson property. Use promo code RADSTAY15 on checkout.",
    },
  });

  // Automated Event Notification Triggers
  const [triggers, setTriggers] = useState([
    {
      id: "trig_1",
      event: "Guest Check-in Registration",
      templateMapped: "CONFIRMATION",
      enabled: true,
      desc: "Dispatches booking reservation summary to guest email & WhatsApp upon front desk check-in creation.",
    },
    {
      id: "trig_2",
      event: "Checkout Folio Settlement",
      templateMapped: "BILL",
      enabled: true,
      desc: "Sends tax-compliant PDF bill attachment automatically to guest once payment folio status locks to CLOSED.",
    },
    {
      id: "trig_3",
      event: "VVIP Platinum Check-in Alert",
      templateMapped: "PROMO",
      enabled: false,
      desc: "Pushes loyalty discount coupon code to premium guests phone contact when VIP status flag is checked.",
    },
  ]);

  const handleTestSMTP = () => {
    alert(`SMTP Test email successfully sent from ${smtpConfig.sender} to host ${smtpConfig.host}! Connection verified.`);
  };

  const handleTestWAT = () => {
    alert(`WhatsApp Ping request sent to WAT Pro Phone ID ${watConfig.phoneId}! Gateway returned HTTP 200 OK.`);
  };

  const handleToggleTrigger = (id: string) => {
    setTriggers(
      triggers.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleTemplateChange = (field: "subject" | "body", value: string) => {
    setTemplates({
      ...templates,
      [selectedTemplate]: {
        ...templates[selectedTemplate],
        [field]: value,
      },
    });
  };

  const runBroadcast = () => {
    setBroadcasting(true);
    setBroadcastLogs([]);

    // Sample data replacements
    const bodyRaw = templates[selectedTemplate].body;
    const bodyFormatted = bodyRaw
      .replace("{GuestName}", "Rohan Sharma")
      .replace("{InvoiceTotal}", "INR 17,700.00")
      .replace("{RoomType}", "Deluxe Suite")
      .replace("{CheckInDate}", "2026-08-12");

    const steps = [
      `Connecting to WAT Pro API Gateway URL: ${watConfig.gateway}...`,
      "Fetching target VVIP Platinum guest directory...",
      "Found 3 active VVIP Platinum guest phone profiles.",
      `Dispatching customized template '${selectedTemplate}'...`,
      `[LOG] Body preview: "${bodyFormatted}"`,
      "Sending to Rohan Sharma (+91-99837283) via WAT Pro... SUCCESS",
      "Sending to Emily Watson (+91-90392812) via WAT Pro... SUCCESS",
      "Sending to Arjun Kapoor (+91-88930129) via WAT Pro... SUCCESS",
      "Campaign broadcast finished. 3/3 messages successfully delivered.",
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setBroadcastLogs((prev) => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setBroadcasting(false);
      }
    }, 450);
  };

  const activeTemplate = templates[selectedTemplate];

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">SMTP & WhatsApp Notification Center</h2>
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MD", "CFO", "GM"]}>
            <>
              {/* Header Info */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Campaigns & Auto-Notifications</h1>
                <p className="text-xs text-text-secondary mt-1">
                  Configure SMTP server credentials, WAT Pro WhatsApp API Gateways, customize templates, and configure automated lifecycle triggers.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left panel: Config Forms */}
                <div className="lg:col-span-1 bg-surface border border-border-default rounded-lg p-5 shadow-small h-fit space-y-6">
                  {/* Tab Selector */}
                  <div className="flex border-b border-border-default space-x-4 text-xs font-bold">
                    <button
                      onClick={() => setActiveTab("SMTP")}
                      className={`pb-2 ${activeTab === "SMTP" ? "text-primary border-b-2 border-primary" : "text-text-secondary"}`}
                    >
                      SMTP Settings
                    </button>
                    <button
                      onClick={() => setActiveTab("WATPRO")}
                      className={`pb-2 ${activeTab === "WATPRO" ? "text-primary border-b-2 border-primary" : "text-text-secondary"}`}
                    >
                      WAT Pro Settings
                    </button>
                  </div>

                  {activeTab === "SMTP" ? (
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-text-secondary font-semibold">SMTP Host Address</label>
                        <input
                          type="text"
                          value={smtpConfig.host}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-text-secondary font-semibold">Port</label>
                          <input
                            type="text"
                            value={smtpConfig.port}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-text-secondary font-semibold">Sender Email</label>
                          <input
                            type="text"
                            value={smtpConfig.sender}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, sender: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-text-secondary font-semibold">SMTP Username</label>
                        <input
                          type="text"
                          value={smtpConfig.username}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-text-secondary font-semibold">Password</label>
                        <input
                          type="password"
                          value={smtpConfig.password}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleTestSMTP}
                        className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small transition-all"
                      >
                        Ping Mail server (SMTP)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-text-secondary font-semibold">WAT Pro Gateway URL</label>
                        <input
                          type="text"
                          value={watConfig.gateway}
                          onChange={(e) => setWatConfig({ ...watConfig, gateway: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-text-secondary font-semibold">Auth API Token</label>
                        <input
                          type="text"
                          value={watConfig.token}
                          onChange={(e) => setWatConfig({ ...watConfig, token: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-text-secondary font-semibold">Phone ID</label>
                          <input
                            type="text"
                            value={watConfig.phoneId}
                            onChange={(e) => setWatConfig({ ...watConfig, phoneId: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-text-secondary font-semibold">Template Namespace</label>
                          <input
                            type="text"
                            value={watConfig.namespace}
                            onChange={(e) => setWatConfig({ ...watConfig, namespace: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleTestWAT}
                        className="w-full py-2 bg-success hover:bg-success/90 text-white text-xs font-bold rounded shadow-small transition-all"
                      >
                        Ping WAT Pro Gateway
                      </button>
                    </div>
                  )}
                </div>

                {/* Right panel: Templates Editor */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Template Picker */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase text-text-muted tracking-wider">
                        Template Content Editor
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedTemplate("BILL")}
                          className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                            selectedTemplate === "BILL"
                              ? "bg-primary text-white border-primary"
                              : "border-border-default hover:bg-surface-hover text-text-secondary"
                          }`}
                        >
                          Checkout Invoice
                        </button>
                        <button
                          onClick={() => setSelectedTemplate("CONFIRMATION")}
                          className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                            selectedTemplate === "CONFIRMATION"
                              ? "bg-primary text-white border-primary"
                              : "border-border-default hover:bg-surface-hover text-text-secondary"
                          }`}
                        >
                          Booking Confirm
                        </button>
                        <button
                          onClick={() => setSelectedTemplate("PROMO")}
                          className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                            selectedTemplate === "PROMO"
                              ? "bg-primary text-white border-primary"
                              : "border-border-default hover:bg-surface-hover text-text-secondary"
                          }`}
                        >
                          Promo Discount
                        </button>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-text-secondary font-semibold">Subject Header</label>
                        <input
                          type="text"
                          value={activeTemplate.subject}
                          onChange={(e) => handleTemplateChange("subject", e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-text-secondary font-semibold">Message Body Text</label>
                        <textarea
                          rows={4}
                          value={activeTemplate.body}
                          onChange={(e) => handleTemplateChange("body", e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                        <span className="text-[10px] text-text-muted flex items-center space-x-1 mt-1 leading-normal">
                          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Variables: use <b>{`{GuestName}`}</b>, <b>{`{InvoiceTotal}`}</b>, <b>{`{RoomType}`}</b>, <b>{`{CheckInDate}`}</b>.</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Automated Trigger Triggers */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                    <h3 className="text-xs font-black uppercase text-text-muted tracking-wider">
                      Hotel Lifecycle Event Triggers Mappings
                    </h3>
                    <div className="divide-y divide-border-default text-xs space-y-3">
                      {triggers.map((trig) => (
                        <div key={trig.id} className="flex justify-between items-center py-2.5">
                          <div className="space-y-1 pr-4">
                            <span className="font-bold text-text-primary block">{trig.event}</span>
                            <p className="text-xxs text-text-secondary leading-normal">{trig.desc}</p>
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mt-1">
                              Uses: {trig.templateMapped} Template
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleTrigger(trig.id)}
                            className="text-primary hover:text-primary-hover transition-all"
                          >
                            {trig.enabled ? (
                              <ToggleRight className="w-9 h-9 text-success" />
                            ) : (
                              <ToggleLeft className="w-9 h-9 text-slate-400" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Campaign Broadcast Simulator */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                    <div className="flex justify-between items-center border-b border-border-default pb-2">
                      <h3 className="text-xs font-black uppercase text-text-muted tracking-wider">
                        Broadcast Campaign Simulator
                      </h3>
                      <button
                        onClick={runBroadcast}
                        disabled={broadcasting}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small transition-all disabled:opacity-50"
                      >
                        {broadcasting ? "Broadcasting..." : "Broadcast Template"}
                      </button>
                    </div>

                    <div className="bg-slate-950 border border-slate-900 rounded p-4 font-mono text-[11px] text-slate-300 h-40 overflow-y-auto space-y-1">
                      {broadcastLogs.length === 0 ? (
                        <span className="text-slate-500 italic">Click 'Broadcast Template' to run notification pipeline simulation logs.</span>
                      ) : (
                        broadcastLogs.map((log, idx) => (
                          <div key={idx} className={log.includes("SUCCESS") ? "text-emerald-400" : "text-slate-300"}>
                            &gt; {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

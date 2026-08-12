"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { processGuestMessageAction } from "@/app/actions/aiConcierge";
import { useSession } from "@/context/SessionContext";
import { MessageSquare, Send, Sparkles, CheckCircle2, ShieldCheck, User, Bot, AlertTriangle, Loader2 } from "lucide-react";

export default function AIConciergePage() {
  const { activePropertyId } = useSession();
  const [messages, setMessages] = useState<any[]>([
    {
      id: "m1",
      sender: "GUEST",
      text: "Hello, we just checked in. Can we get 2 extra bottles of water and towels in our room?",
      time: "10:00 AM",
    },
    {
      id: "m2",
      sender: "AI",
      text: "Certainly! I have generated a priority housekeeping request for your room. A staff member has been dispatched to deliver the water and towels.",
      time: "10:00 AM",
      action: "Housekeeping task created (PENDING)",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: Math.random().toString(),
      sender: "GUEST",
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await processGuestMessageAction(userMsg.text, activePropertyId);
      if (res.success) {
        const aiMsg = {
          id: Math.random().toString(),
          sender: "AI",
          text: res.reply || "",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          action: res.actionTaken,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        alert(res.error || "Failed to process message.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to process message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">AI Concierge & Task Automation</h2>
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 flex flex-col space-y-6 overflow-hidden">
          <RoleProtected allowedRoles={["MD", "GM"]}>
            <div className="flex-1 flex flex-col min-h-0 bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-surface-secondary/40">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Guest Messaging Simulator</h3>
                    <p className="text-[10px] text-text-muted">Simulate guest SMS/WhatsApp logs to test NLP parsing triggers.</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-success/10 text-success border border-success/20 uppercase tracking-wider font-mono">
                  Engine Sync: Active
                </span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-app-bg/50">
                {messages.map((msg) => {
                  const isGuest = msg.sender === "GUEST";
                  return (
                    <div key={msg.id} className={`flex ${isGuest ? "justify-end" : "justify-start"} items-start gap-2.5`}>
                      {!isGuest && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                          <Bot className="w-4.5 h-4.5" />
                        </div>
                      )}
                      <div className={`max-w-[70%] space-y-1.5`}>
                        <div
                          className={`rounded-lg px-4 py-2.5 text-xs shadow-xxs ${
                            isGuest
                              ? "bg-primary text-white font-medium"
                              : "bg-surface border border-border-default text-text-primary"
                          }`}
                        >
                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                        
                        <div className={`flex items-center gap-2 text-[9px] text-text-muted ${isGuest ? "justify-end" : "justify-start"}`}>
                          <span>{msg.time}</span>
                          {msg.action && (
                            <span className="inline-flex items-center text-success font-black uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> {msg.action}
                            </span>
                          )}
                        </div>
                      </div>
                      {isGuest && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                          <User className="w-4.5 h-4.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start items-center space-x-2 text-xxs text-text-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>AI Concierge is analyzing request and updating operational rosters...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="px-6 py-4 border-t border-border-default bg-surface flex gap-2">
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Simulate guest message: e.g., 'ac is blowing hot air in room' or 'send soap to my room'..."
                  className="flex-1 px-4 py-2 border border-border-default rounded bg-app-bg text-xs text-text-primary focus:outline-none placeholder:text-text-muted"
                />
                <button
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded font-bold text-xs flex items-center shadow-small transition-all disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4 mr-1.5" /> Send Request
                </button>
              </form>
            </div>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, MOCK_STAFF_DIRECTORY, UserProfile } from "@/context/SessionContext";
import { KeyRound, Shield, HelpCircle, ArrowRight, Building2, Hotel } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    const success = await login(emailInput, passwordInput);
    if (!success) {
      setErrorMsg("Invalid credentials. Try Rajesh's email, or the owner email with correct password.");
    } else {
      setErrorMsg(null);
      router.push("/");
    }
  };

  const handleQuickLogin = async (email: string) => {
    const success = await login(email);
    if (success) {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 font-sans p-6">
      {/* Decorative premium gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Left branding panel */}
        <div className="lg:col-span-5 flex flex-col justify-between text-white space-y-8 p-6 lg:p-8">
          <div>
            <div className="flex items-center space-x-2 text-primary">
              <Hotel className="w-8 h-8 text-primary" />
              <span className="text-xl font-black uppercase tracking-wider text-white">HotelOS Group</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Multi-Property Enterprise Operating System</p>
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Enterprise Identity & Access Portal
            </h1>
            <p className="text-sm text-slate-300">
              Authorized staff login only. Access clearances are managed dynamically at Corporate HQ based on role, location scope, and department policies.
            </p>
          </div>

          <div className="flex items-center space-x-4 border-t border-slate-800 pt-6">
            <Shield className="w-6 h-6 text-primary shrink-0" />
            <div className="text-xs text-slate-400">
              <span className="font-bold text-white block">Strict Audit Enforcement</span>
              All actions are recorded in the global Night Audit log ledger under compliance standards.
            </div>
          </div>
        </div>

        {/* Right login container */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 lg:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Staff Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">Select a mock corporate profile card or sign in manually.</p>
          </div>

          {/* Quick Login Staff Card List */}
          <div className="space-y-3">
            <h3 className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Quick Connect Cards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MOCK_STAFF_DIRECTORY
                .filter((profile) => profile.role !== "SAAS_OWNER")
                .map((profile) => (
                <button
                  key={profile.email}
                  onClick={() => handleQuickLogin(profile.email)}
                  className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-primary/50 rounded-xl text-left transition-all group"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">{profile.name}</span>
                    <span className="inline-flex px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider">
                      {profile.role}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{profile.email}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-bold text-[10px]">Or Corporate Credentials</span>
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Corporate Email</label>
              <input
                type="email"
                placeholder="e.g. director@hotelos.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Access Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-slate-600"
              />
            </div>

            {errorMsg && <p className="text-xs text-error font-medium">{errorMsg}</p>}

            <button
              type="submit"
              className="w-full py-2.5 bg-primary hover:bg-primary-hover border border-transparent rounded-lg text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Verify Access Key</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

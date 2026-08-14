"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, MOCK_STAFF_DIRECTORY, UserProfile } from "@/context/SessionContext";
import { KeyRound, Shield, HelpCircle, ArrowRight, Building2, Hotel, X, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { createPasswordResetApprovalAction } from "@/app/actions/approvals";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot Password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetRole, setResetRole] = useState("MD");
  const [resetReason, setResetReason] = useState("");
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    const success = await login(emailInput, passwordInput);
    if (!success) {
      setErrorMsg("Invalid credentials. Try director@hotelos.com or the SaaS owner email (NayanOS#2026).");
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

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setIsSubmittingReset(true);
    setResetSuccessMsg(null);
    setResetErrorMsg(null);

    try {
      let dept = "CORPORATE";
      if (resetRole === "FRONT_DESK") dept = "FRONT_OFFICE";
      if (resetRole === "HOUSEKEEPER") dept = "HOUSEKEEPING";

      const res = await createPasswordResetApprovalAction(resetEmail, resetRole, dept);
      if (res.success) {
        setResetSuccessMsg(res.message || "Password reset request submitted successfully to Parent Admin for approval!");
      } else {
        setResetErrorMsg(res.error || "Failed to submit password reset request.");
      }
    } catch (err: any) {
      setResetErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingReset(false);
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
              <span className="font-bold text-white block">Hierarchical Admin Approval Engine</span>
              Password resets & department requests route to your Parent Admin (GM, HK Manager, or SaaS Owner) for verification.
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
                placeholder="e.g. director@hotelos.com or radisson@hotelos.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-slate-600 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300">Access Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(emailInput || "");
                    setResetSuccessMsg(null);
                    setResetErrorMsg(null);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-all"
                >
                  <Lock className="w-3 h-3" /> Forgot Password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-slate-600"
              />
            </div>

            {errorMsg && <p className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 p-2 rounded">{errorMsg}</p>}

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

      {/* FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-primary">
                <KeyRound className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-white">Password Recovery & Reset</h3>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Forgotten your login email or password? Enter your corporate email below. Your reset request will be routed directly to your <strong className="text-primary">Parent Admin (GM, Housekeeper Manager, or SaaS Platform Owner)</strong> for instant approval in the Governance Engine.
            </p>

            <form onSubmit={handleRequestPasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Registered Corporate Email</label>
                <input
                  type="email"
                  placeholder="e.g. director@hotelos.com or radisson@hotelos.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Department / Role Category</label>
                <select
                  value={resetRole}
                  onChange={(e) => setResetRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-primary font-bold"
                >
                  <option value="MD">Managing Director / Corporate HQ (Approver: SaaS Owner)</option>
                  <option value="GM">General Manager (Approver: SaaS Owner)</option>
                  <option value="FRONT_DESK">Front Office / Reception Desk (Approver: GM)</option>
                  <option value="HOUSEKEEPER">Housekeeping Department (Approver: Housekeeping Manager / GM)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Brief Note for Approver (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Forgot Radisson login password, please reset."
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-primary font-medium"
                />
              </div>

              {resetSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-start space-x-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}

              {resetErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg font-medium">
                  {resetErrorMsg}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReset}
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmittingReset ? "Submitting..." : "Submit Reset Request"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { ShieldCheck, BarChart3, Percent, CheckCircle2, TrendingUp, Landmark } from "lucide-react";

export default function FinanceAuditPage() {
  const [fxRates, setFxRates] = useState([
    { currency: "USD (United States Dollar)", code: "USD", rate: 83.50, status: "Active Sync" },
    { currency: "EUR (Euro Zone)", code: "EUR", rate: 90.20, status: "Active Sync" },
    { currency: "GBP (British Pound)", code: "GBP", rate: 106.10, status: "Active Sync" },
  ]);

  const taxAudits = [
    {
      invoiceId: "INV-10928A",
      guest: "Rahul Sharma",
      type: "ROOM_CHARGE",
      taxableAmount: 15000,
      cgst: 1350, // 9%
      sgst: 1350, // 9%
      totalTax: 2700, // 18%
      netTotal: 17700,
    },
    {
      invoiceId: "INV-10929B",
      guest: "Emily Watson",
      type: "MINIBAR_POS",
      taxableAmount: 2500,
      cgst: 225, // 9%
      sgst: 225, // 9%
      totalTax: 450, // 18%
      netTotal: 2950,
    },
    {
      invoiceId: "INV-10930C",
      guest: "Samantha Brown",
      type: "ROOM_CHARGE",
      taxableAmount: 6000,
      cgst: 360, // 6%
      sgst: 360, // 6%
      totalTax: 720, // 12%
      netTotal: 6720,
    },
  ];

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">Corporate Treasury & Tax Compliance</h2>
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MD", "CFO"]}>
            <>
              {/* Header Info */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Financial FX & GST Audit</h1>
                <p className="text-xs text-text-secondary mt-1">
                  Audit foreign currency payments conversion logs, configure corporate GST tax slabs, and export SGST/CGST tax ledger compliance reports.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* FX Rates */}
                <div className="lg:col-span-1 bg-surface border border-border-default rounded-lg p-5 space-y-4 shadow-small h-fit">
                  <h3 className="text-xs font-black uppercase text-text-muted tracking-wider flex items-center">
                    <Landmark className="w-4 h-4 mr-1.5 text-primary" /> Daily Treasury FX Rates
                  </h3>
                  
                  <div className="divide-y divide-border-default space-y-3">
                    {fxRates.map((fx, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 text-xs">
                        <div>
                          <span className="font-bold text-text-primary block">{fx.code} ➔ INR</span>
                          <span className="text-[10px] text-text-muted">{fx.currency}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-success font-mono">INR {fx.rate.toFixed(2)}</span>
                          <span className="text-[9px] text-text-muted block">{fx.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GST Tax compliance */}
                <div className="lg:col-span-2 bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                  <h3 className="text-xs font-black uppercase text-text-muted tracking-wider flex items-center">
                    <Percent className="w-4 h-4 mr-1.5 text-primary" /> GST slabs Config
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-surface-secondary/40 border border-border-default/50 rounded space-y-1">
                      <span className="text-[10px] uppercase font-bold text-text-muted">Standard GST (Rooms &lt; 7,500)</span>
                      <span className="font-extrabold text-text-primary block text-sm">12% (6% CGST + 6% SGST)</span>
                    </div>
                    <div className="p-3 bg-surface-secondary/40 border border-border-default/50 rounded space-y-1">
                      <span className="text-[10px] uppercase font-bold text-text-muted">Luxury GST (Rooms &ge; 7,500 / POS / Banquets)</span>
                      <span className="font-extrabold text-text-primary block text-sm">18% (9% CGST + 9% SGST)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax ledger */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-primary">CGST & SGST Compliance Audit Ledger</h3>
                
                <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        <th className="p-4">Invoice ID</th>
                        <th className="p-4">Guest Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Taxable Amount</th>
                        <th className="p-4">CGST (Central Tax)</th>
                        <th className="p-4">SGST (State Tax)</th>
                        <th className="p-4">Total Tax Paid</th>
                        <th className="p-4 text-right">Net Invoice Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {taxAudits.map((audit, idx) => (
                        <tr key={idx} className="hover:bg-surface-secondary/40 transition-all font-mono">
                          <td className="p-4 font-bold text-text-primary">{audit.invoiceId}</td>
                          <td className="p-4 font-semibold text-text-secondary">{audit.guest}</td>
                          <td className="p-4">
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-800 text-slate-400">
                              {audit.type}
                            </span>
                          </td>
                          <td className="p-4 text-text-secondary">INR {audit.taxableAmount.toFixed(2)}</td>
                          <td className="p-4 text-text-muted">INR {audit.cgst.toFixed(2)}</td>
                          <td className="p-4 text-text-muted">INR {audit.sgst.toFixed(2)}</td>
                          <td className="p-4 text-error">INR {audit.totalTax.toFixed(2)}</td>
                          <td className="p-4 text-right font-extrabold text-text-primary">INR {audit.netTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

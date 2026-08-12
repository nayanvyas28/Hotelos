"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { Archive, Plus, CheckCircle2, User, Search, MapPin } from "lucide-react";

export default function LostFoundPage() {
  const [items, setItems] = useState([
    {
      id: "lf_1",
      description: "Brown Leather Wallet containing credit cards & cash",
      foundLocation: "Room 205 Checkout Clean",
      foundBy: "Sunil Kumar",
      storageArea: "Safe Vault Drawer B",
      status: "RETURNED",
      guestName: "Rahul Sharma",
      reportedDate: "2026-08-11",
    },
    {
      id: "lf_2",
      description: "Apple iPhone 15 Pro Max with black case",
      foundLocation: "Restaurant Table 4 under chair",
      foundBy: "Priya Nair",
      storageArea: "Front Desk Safe Drawer A",
      status: "CLAIMED",
      guestName: "Nisha Sen",
      reportedDate: "2026-08-11",
    },
  ]);

  const handleCreate = () => {
    alert("Lost & Found register form is a sandbox placeholder.");
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">Lost & Found Register</h2>
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MD", "GM", "FRONT_DESK", "HOUSEKEEPER"]}>
            <>
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary">Lost & Found Register</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Track items found in guest stays, claim ticket receipts, and returned items.
                  </p>
                </div>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Log Found Item
                </button>
              </div>

              {/* Table list */}
              <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      <th className="p-4">Reported Date</th>
                      <th className="p-4">Item description</th>
                      <th className="p-4">Found Location</th>
                      <th className="p-4">Found By</th>
                      <th className="p-4">Secure Storage</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-secondary/40 transition-all">
                        <td className="p-4 text-text-secondary">{item.reportedDate}</td>
                        <td className="p-4">
                          <span className="font-bold text-text-primary block">{item.description}</span>
                          <span className="text-[10px] text-text-muted mt-0.5 block">Owner: {item.guestName || "Unclaimed"}</span>
                        </td>
                        <td className="p-4 flex items-center space-x-1.5 text-text-secondary mt-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.foundLocation}</span>
                        </td>
                        <td className="p-4 font-semibold text-text-secondary">{item.foundBy}</td>
                        <td className="p-4 text-text-secondary">{item.storageArea}</td>
                        <td className="p-4 text-right">
                          <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-black bg-success/10 text-success border border-success/20 uppercase tracking-wider">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

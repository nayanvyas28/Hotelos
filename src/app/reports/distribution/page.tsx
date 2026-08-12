"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { ShieldCheck, RefreshCw, KeyRound, ArrowRight, CheckCircle2, Tag, Percent, IndianRupee, Layers } from "lucide-react";

export default function DistributionPage() {
  const [syncing, setSyncing] = useState(false);
  const [channels, setChannels] = useState([
    {
      id: "booking",
      name: "Booking.com (BMT)",
      status: "SYNCED",
      markup: 10, // +10%
      commission: 15, // 15% commission
      activeRooms: 14,
      lastSync: "3 mins ago",
    },
    {
      id: "oyo",
      name: "OYO Rooms Aggregator",
      status: "SYNCED",
      markup: -5, // -5% markdown
      commission: 12, // 12% commission
      activeRooms: 10,
      lastSync: "1 min ago",
    },
    {
      id: "mmt",
      name: "MakeMyTrip (MMT)",
      status: "SYNCED",
      markup: 5, // +5%
      commission: 14,
      activeRooms: 8,
      lastSync: "5 mins ago",
    },
    {
      id: "expedia",
      name: "Expedia Group",
      status: "SYNCED",
      markup: 8, // +8%
      commission: 18,
      activeRooms: 6,
      lastSync: "10 mins ago",
    },
  ]);

  const [otaBookings, setOtaBookings] = useState([
    {
      id: "oyo_b1",
      channel: "OYO Rooms",
      otaId: "OYO-49291A",
      guest: "Rohan Sharma",
      roomType: "Deluxe King",
      totalPrice: 7600,
      commission: 912, // 12%
      checkIn: "2026-08-12",
      checkOut: "2026-08-14",
      status: "ROOM_MAPPED",
    },
    {
      id: "bmt_b1",
      channel: "Booking.com (BMT)",
      otaId: "BMT-9031289",
      guest: "Emily Watson",
      roomType: "Executive Suite",
      totalPrice: 15400,
      commission: 2310, // 15%
      checkIn: "2026-08-13",
      checkOut: "2026-08-16",
      status: "ROOM_MAPPED",
    },
    {
      id: "mmt_b1",
      channel: "MakeMyTrip",
      otaId: "MMT-8893012",
      guest: "Arjun Kapoor",
      roomType: "Standard Queen",
      totalPrice: 6300,
      commission: 882, // 14%
      checkIn: "2026-08-12",
      checkOut: "2026-08-13",
      status: "ROOM_MAPPED",
    },
  ]);

  const handleForceSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert("Rate plans and vacancy metrics successfully distributed to Booking.com, OYO, MMT and Expedia channels!");
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">OTA Channel Distribution Manager</h2>
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MD", "CFO", "GM"]}>
            <>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary">OTA Channel Manager</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Manage direct price mapping, automated markups, commission tables, and live room allotment for OYO and major online travel agents.
                  </p>
                </div>
                <button
                  onClick={handleForceSync}
                  disabled={syncing}
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small disabled:opacity-50 transition-all shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Distributing Rates..." : "Force Channel Push"}
                </button>
              </div>

              {/* Channels Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {channels.map((chan) => (
                  <div
                    key={chan.id}
                    className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">{chan.name}</h3>
                        <span className="text-[10px] text-text-muted">Last sync: {chan.lastSync}</span>
                      </div>
                      <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-black bg-success/10 text-success border border-success/20 uppercase tracking-wider font-mono">
                        {chan.status}
                      </span>
                    </div>

                    <div className="divide-y divide-border-default text-xs space-y-2 pt-1">
                      <div className="flex justify-between py-1">
                        <span className="text-text-muted">Rate Markup</span>
                        <span className={`font-bold ${chan.markup >= 0 ? "text-success" : "text-error"}`}>
                          {chan.markup >= 0 ? `+${chan.markup}%` : `${chan.markup}%`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-text-muted">OTA Commission</span>
                        <span className="font-bold text-text-secondary">{chan.commission}%</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-text-muted">Allotted Rooms</span>
                        <span className="font-bold text-text-primary">{chan.activeRooms} vacancy slots</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ingested Booking Feed */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border-default pb-2">
                  <h3 className="text-sm font-bold text-text-primary">Incoming OTA Booking Ingestion Log</h3>
                  <span className="text-xxs font-black text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                    Real-time webhook sync active
                  </span>
                </div>

                <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        <th className="p-4">OTA Source</th>
                        <th className="p-4">OTA Booking ID</th>
                        <th className="p-4">Guest Name</th>
                        <th className="p-4">Room Type</th>
                        <th className="p-4">Check-in / Out</th>
                        <th className="p-4">Total Price (INR)</th>
                        <th className="p-4">Commission (Payout)</th>
                        <th className="p-4 text-right">Mapping Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {otaBookings.map((book) => (
                        <tr key={book.id} className="hover:bg-surface-secondary/30 transition-all">
                          <td className="p-4 font-bold text-text-primary">{book.channel}</td>
                          <td className="p-4 font-mono text-primary font-bold">{book.otaId}</td>
                          <td className="p-4 font-semibold text-text-secondary">{book.guest}</td>
                          <td className="p-4 text-text-secondary">{book.roomType}</td>
                          <td className="p-4 text-text-muted">
                            {book.checkIn} ➔ {book.checkOut}
                          </td>
                          <td className="p-4 font-extrabold text-text-primary font-mono">
                            INR {book.totalPrice.toFixed(2)}
                          </td>
                          <td className="p-4 text-error font-mono font-semibold">
                            INR {book.commission.toFixed(2)} ({book.channel.includes("OYO") ? "12%" : book.channel.includes("Booking") ? "15%" : "14%"})
                          </td>
                          <td className="p-4 text-right">
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black bg-success/10 text-success border border-success/20 uppercase tracking-wider font-mono">
                              Mapped & Blocked
                            </span>
                          </td>
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

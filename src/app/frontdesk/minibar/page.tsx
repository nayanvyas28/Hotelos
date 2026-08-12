"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { getCheckedInRoomsAction, postMinibarChargeAction } from "@/app/actions/minibar";
import { useSession } from "@/context/SessionContext";
import { Coffee, ShoppingBag, Plus, Sparkles, CheckCircle2, User, Loader2, AlertTriangle } from "lucide-react";

export default function MinibarPOSPage() {
  const { activePropertyId } = useSession();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minibarMenu = [
    { name: "Premium Beer Can", category: "MINIBAR", price: 450 },
    { name: "Canned Aerated Soda", category: "MINIBAR", price: 150 },
    { name: "Potato Salted Chips", category: "MINIBAR", price: 120 },
    { name: "Dark Chocolate Bar", category: "MINIBAR", price: 250 },
    { name: "Club Chicken Sandwich", category: "DINING", price: 550 },
    { name: "Alfredo Penne Pasta", category: "DINING", price: 650 },
    { name: "Hot Brewed Coffee", category: "DINING", price: 180 },
  ];

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCheckedInRoomsAction(activePropertyId);
      if (res.success && res.rooms) {
        setRooms(res.rooms);
        if (res.rooms.length > 0) {
          setSelectedRoomId(res.rooms[0].id);
        }
      } else {
        setError(res.error || "Failed to load checked-in rooms.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load checked-in rooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activePropertyId) {
      loadRooms();
    }
  }, [activePropertyId]);

  const handleCharge = async (item: any) => {
    if (!selectedRoomId) {
      alert("Please select a guest room first.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await postMinibarChargeAction(
        activePropertyId,
        selectedRoomId,
        item.category,
        item.price,
        `POS Charge: ${item.name}`
      );

      if (res.success) {
        alert(`Charged ${item.name} (INR ${item.price}) to selected room folio successfully!`);
      } else {
        alert(res.error || "Failed to post charge.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to post charge.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">Minibar & Room Service POS</h2>
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MD", "GM", "FRONT_DESK", "HOUSEKEEPER"]}>
            <>
              {/* Header Info */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">In-Room Consumption POS</h1>
                <p className="text-xs text-text-secondary mt-1">
                  Post minibar consumption and room service meals directly onto active guest folios for express checkout auditing.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left panel: Room Select */}
                <div className="lg:col-span-1 bg-surface border border-border-default rounded-lg p-5 space-y-4 shadow-small h-fit">
                  <h3 className="text-xs font-black uppercase text-text-muted tracking-wider">
                    Select Active Room
                  </h3>
                  
                  {loading ? (
                    <div className="flex items-center space-x-2 py-4">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-xs text-text-muted">Loading checked-in rooms...</span>
                    </div>
                  ) : error ? (
                    <div className="p-3 bg-error/10 border border-error/20 rounded text-xxs text-error">
                      {error}
                    </div>
                  ) : rooms.length === 0 ? (
                    <div className="p-4 border border-dashed border-border-default rounded text-center text-xs text-text-muted italic">
                      No active guests checked in. Go to Room Calendar or Front Desk to check in a guest.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-text-secondary block">Occupied Room Number</label>
                      <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                      >
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            Room {room.number} ({room.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Right panel: POS items grid */}
                <div className="lg:col-span-2 bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                  <h3 className="text-xs font-black uppercase text-text-muted tracking-wider">
                    Consumption POS Catalog
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {minibarMenu.map((item, idx) => (
                      <div
                        key={idx}
                        className="border border-border-default hover:border-primary/30 p-4 rounded-lg flex justify-between items-center bg-surface-secondary/20 hover:bg-surface-secondary/40 transition-all"
                      >
                        <div className="space-y-1">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-primary-light text-primary">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold text-text-primary">{item.name}</h4>
                          <span className="text-xs font-bold font-mono text-success">INR {item.price.toFixed(2)}</span>
                        </div>

                        <button
                          onClick={() => handleCharge(item)}
                          disabled={actionLoading || !selectedRoomId}
                          className="p-2 bg-primary hover:bg-primary-hover text-white rounded shadow-xxs disabled:opacity-50 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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

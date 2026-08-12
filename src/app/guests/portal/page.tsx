"use client";

import React, { useState, useEffect } from "react";
import { getGuestPortalDataAction, placeGuestOrderAction, submitGuestRequestAction } from "@/app/actions/guestPortal";
import { getPropertiesAction } from "@/app/actions/property";
import { getRestaurantOverviewAction } from "@/app/actions/restaurant";
import { Hotel, Utensils, Brush, Wrench, RefreshCw, ShoppingCart, CheckCircle, Bell, ArrowRight, History, CreditCard, Activity } from "lucide-react";

export default function GuestPortalPage() {
  const [checkedInStays, setCheckedInStays] = useState<any[]>([]);
  const [selectedStayId, setSelectedStayId] = useState("");
  const [portalData, setPortalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<Array<{ item: any; quantity: number }>>([]);
  const [activeTab, setActiveTab] = useState<"DINING" | "SERVICE" | "STATUS">("DINING");

  // Load checked-in stays for quick emulation bypass
  useEffect(() => {
    async function loadBypassData() {
      try {
        const propRes = await getPropertiesAction();
        if (propRes.success && propRes.properties.length > 0) {
          const overviewRes = await getRestaurantOverviewAction(propRes.properties[0].id);
          if (overviewRes.success && overviewRes.checkedInStays) {
            setCheckedInStays(overviewRes.checkedInStays);
            if (overviewRes.checkedInStays.length > 0) {
              setSelectedStayId(overviewRes.checkedInStays[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load emulation stays list:", err);
      }
    }
    loadBypassData();
  }, []);

  const loadPortalData = async () => {
    if (!selectedStayId) return;
    setIsLoading(true);
    try {
      const res = await getGuestPortalDataAction(selectedStayId);
      if (res.success) {
        setPortalData(res);
      } else {
        alert(res.error || "Failed to load stay portal.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to load stay portal.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStayId) {
      loadPortalData();
      setCart([]);
    }
  }, [selectedStayId]);

  // Cart operations
  const handleAddToCart = (item: any) => {
    const existing = cart.find((c) => c.item.id === item.id);
    if (existing) {
      setCart(cart.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const handleUpdateCartQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.item.id !== itemId));
    } else {
      setCart(cart.map((c) => (c.item.id === itemId ? { ...c, quantity: qty } : c)));
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);
    try {
      const items = cart.map((c) => ({
        menuItemId: c.item.id,
        quantity: c.quantity,
      }));
      const res = await placeGuestOrderAction({
        reservationId: selectedStayId,
        items,
      });
      if (res.success) {
        setCart([]);
        await loadPortalData();
        alert("Delicious meal order placed! Charged directly to your room folio invoice.");
      } else {
        alert(res.error || "Failed to place order.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to place order.");
    } finally {
      setIsLoading(false);
    }
  };

  // Single click re-order previous dishes
  const handleReorder = async (orderItems: any[]) => {
    setIsLoading(true);
    try {
      const items = orderItems.map((oi) => ({
        menuItemId: oi.menuItemId,
        quantity: oi.quantity,
      }));
      const res = await placeGuestOrderAction({
        reservationId: selectedStayId,
        items,
      });
      if (res.success) {
        await loadPortalData();
        alert("Previous meal order successfully re-ordered! Charged to room folio.");
      } else {
        alert(res.error || "Failed to re-order.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to re-order.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Service / Amenities dispatcher
  const handleQuickRequest = async (notes: string, type: "HOUSEKEEPING" | "MAINTENANCE") => {
    setIsLoading(true);
    try {
      const res = await submitGuestRequestAction({
        reservationId: selectedStayId,
        type,
        notes,
      });
      if (res.success) {
        await loadPortalData();
        alert(`Service Request logged: "${notes}". Hotel staff has been dispatched!`);
      } else {
        alert(res.error || "Failed to log service request.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to log service request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="max-w-4xl mx-auto space-y-6 z-10 relative">
        {/* Bypass Emulator Switcher Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Hotel className="w-6 h-6 text-primary" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">In-Room Companion Emulator</span>
          </div>
          {checkedInStays.length > 0 ? (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-bold shrink-0">Test Room Switch:</span>
              <select
                value={selectedStayId}
                onChange={(e) => setSelectedStayId(e.target.value)}
                className="w-full sm:w-60 px-3 py-1.5 border border-slate-800 rounded bg-slate-950 text-xs font-semibold text-white focus:outline-none"
              >
                {checkedInStays.map((s) => (
                  <option key={s.id} value={s.id}>
                    Room {s.room.number} — {s.guests[0]?.firstName} {s.guests[0]?.lastName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="text-xs text-error font-medium">No checked-in stay found to emulate.</span>
          )}
        </div>

        {portalData && (
          <>
            {/* Guest Banner Card */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 shadow-2xl space-y-4 leading-normal">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider">
                    Checked In Stay
                  </span>
                  <h1 className="text-xl font-bold text-white mt-1.5">
                    Welcome, {portalData.reservation.guests[0]?.firstName} {portalData.reservation.guests[0]?.lastName}!
                  </h1>
                  <p className="text-xs text-slate-400">
                    🏨 staying at {portalData.reservation.property.name} — Room {portalData.reservation.room.number}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end space-y-2">
                  <div>
                    <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Outstanding Folio Bill</span>
                    <div className="text-xl font-black text-primary font-mono mt-0.5">
                      INR {portalData.reservation.totalAmount?.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickRequest("Request express checkout and bill settlement", "HOUSEKEEPING")}
                    className="px-3 py-1.5 bg-error hover:bg-error/90 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all shadow-small flex items-center space-x-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Express Checkout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Portal Tab Navigation */}
            <div className="flex border-b border-slate-800 space-x-6 text-xs font-bold">
              <button
                onClick={() => setActiveTab("DINING")}
                className={`pb-2.5 transition-all ${activeTab === "DINING" ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}
              >
                In-Room Dining
              </button>
              <button
                onClick={() => setActiveTab("SERVICE")}
                className={`pb-2.5 transition-all ${activeTab === "SERVICE" ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}
              >
                Room Service & Cleaning
              </button>
              <button
                onClick={() => setActiveTab("STATUS")}
                className={`pb-2.5 transition-all ${activeTab === "STATUS" ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}
              >
                Active Requests Status ({portalData.activeTasks.length + portalData.activeIssues.length})
              </button>
            </div>

            {/* In Room Dining Section */}
            {activeTab === "DINING" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Menu list */}
                <div className="lg:col-span-7 bg-slate-900/40 border border-slate-850 rounded-xl p-5 shadow-small space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Delicious Chef Specialties
                  </h3>
                  <div className="grid grid-cols-1 gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {portalData.menuCatalog.map((item: any) => (
                      <div key={item.id} className="p-3 border border-slate-800 rounded-lg bg-slate-950 flex justify-between items-center hover:border-slate-700 transition-all text-xs">
                        <div>
                          <span className="font-bold text-white block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{item.description}</span>
                          <span className="font-black text-primary block mt-1 font-mono">₹{item.price.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="px-3 py-1 bg-primary hover:bg-primary-hover text-white font-extrabold rounded text-[10px] uppercase transition-all"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cart & Re-orders */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Cart container */}
                  <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 shadow-small flex flex-col justify-between h-fit min-h-[220px]">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-white">Your Order Basket</span>
                        <ShoppingCart className="w-4 h-4 text-slate-400" />
                      </div>
                      
                      {cart.length === 0 ? (
                        <p className="text-xxs text-slate-500 italic py-6 text-center">Add meals to place room service order.</p>
                      ) : (
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                          {cart.map((c) => (
                            <div key={c.item.id} className="flex justify-between items-center text-xxs">
                              <span>{c.item.name} (x{c.quantity})</span>
                              <div className="flex items-center space-x-1">
                                <button onClick={() => handleUpdateCartQuantity(c.item.id, c.quantity - 1)} className="px-1 border border-slate-800 rounded bg-slate-950">-</button>
                                <button onClick={() => handleUpdateCartQuantity(c.item.id, c.quantity + 1)} className="px-1 border border-slate-800 rounded bg-slate-950">+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {cart.length > 0 && (
                      <div className="pt-4 border-t border-slate-800 space-y-3">
                        <div className="flex justify-between text-xs font-extrabold">
                          <span>Total Amount:</span>
                          <span className="text-primary font-mono">₹{cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0).toFixed(2)}</span>
                        </div>
                        <button
                          onClick={handlePlaceOrder}
                          className="w-full py-2 bg-success hover:bg-success/90 text-white text-xs font-bold rounded shadow-small uppercase tracking-wider"
                        >
                          Confirm Order to Room
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Previous Orders & Re-order button */}
                  {portalData.pastOrders.length > 0 && (
                    <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 shadow-small space-y-3 leading-normal">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center">
                        <History className="w-4 h-4 mr-1 text-primary" /> Past Orders (Express Re-order)
                      </h3>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {portalData.pastOrders.map((order: any) => (
                          <div key={order.id} className="p-3 border border-slate-800 rounded bg-slate-950 flex justify-between items-center text-xxs">
                            <div>
                              <div className="font-semibold text-slate-300">
                                {order.orderItems.map((oi: any) => `${oi.menuItem.name} (x${oi.quantity})`).join(", ")}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Placed on: {new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button
                              onClick={() => handleReorder(order.orderItems)}
                              className="px-2 py-1 border border-primary/30 hover:border-transparent text-primary hover:bg-primary hover:text-white rounded text-[10px] font-bold uppercase transition-all shrink-0 ml-2"
                            >
                              Re-order
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service & Request Section */}
            {activeTab === "SERVICE" && (
              <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-6 shadow-small space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Express Guest Amenities & Requests
                  </h3>
                  <p className="text-xxs text-slate-400 mt-1">Dispatches housekeeping tasks and engineering work orders instantly to hotel staff consoles.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleQuickRequest("Clean my room immediately", "HOUSEKEEPING")}
                    className="p-5 border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-primary/40 rounded-xl text-left transition-all space-y-2 group"
                  >
                    <Brush className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-bold text-white text-xs block">🧹 Clean My Room</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Alerts housekeeping for fresh towels and room cleanup.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleQuickRequest("Request extra bath towels", "HOUSEKEEPING")}
                    className="p-5 border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-primary/40 rounded-xl text-left transition-all space-y-2 group"
                  >
                    <Bell className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-bold text-white text-xs block">🚿 Extra Amenities</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Request soap, shampoo, pillows, or fresh bath towels.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleQuickRequest("Bring drinking mineral water bottle", "HOUSEKEEPING")}
                    className="p-5 border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-primary/40 rounded-xl text-left transition-all space-y-2 group"
                  >
                    <Utensils className="w-6 h-6 text-success group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-bold text-white text-xs block">💧 Drinking Water</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Request complementary mineral drinking water bottles.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleQuickRequest("Air conditioner cooling issue repair required", "MAINTENANCE")}
                    className="p-5 border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-primary/40 rounded-xl text-left transition-all space-y-2 group"
                  >
                    <Wrench className="w-6 h-6 text-error group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-bold text-white text-xs block">🛠️ Room Repairs</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Log AC issues, plumbing leaks, or wi-fi connection failures.</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Active Status Roster */}
            {activeTab === "STATUS" && (
              <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-6 shadow-small space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Request Dispatch Status
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">Real-time status updates of active operations dispatched to your room.</p>
                  </div>
                  <button onClick={loadPortalData} className="p-1 text-slate-400 hover:text-white rounded">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {portalData.activeTasks.length === 0 && portalData.activeIssues.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 space-y-2">
                      <CheckCircle className="w-10 h-10 text-success mx-auto" />
                      <p className="text-xs font-medium">All logged guest requests have been resolved by staff!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 leading-normal">
                      {portalData.activeTasks.map((t: any) => (
                        <div key={t.id} className="p-4 border border-slate-800 bg-slate-950 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-white block">🧹 Housekeeping: {t.notes}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Logged: {new Date(t.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${
                            t.status === "PENDING" ? "bg-warning/10 text-warning border-warning/20" : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                          }`}>
                            {t.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                      {portalData.activeIssues.map((m: any) => (
                        <div key={m.id} className="p-4 border border-slate-800 bg-slate-950 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-white block">🛠️ Maintenance: {m.issue}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Logged: {new Date(m.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-black border uppercase bg-error/10 text-error border-error/20">
                            {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

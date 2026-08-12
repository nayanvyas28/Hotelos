"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import { getFrontDeskOverviewAction, checkInAction, checkOutAction, transferRoomAction } from "@/app/actions/frontdesk";
import { createReservationAction } from "@/app/actions/reservation";
import ReservationForm from "@/components/reservation/ReservationForm";
import { Hotel, Calendar as CalendarIcon, Users, ArrowRight, ArrowLeftRight, Check, X, ShieldAlert, KeyRound, Loader2, RefreshCw, Brush, BarChart3, Utensils, Archive, Sparkles, HeartPulse } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";

export default function FrontDeskPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  const [stats, setStats] = useState<any>({
    arrivalsCount: 0,
    departuresCount: 0,
    inHouseCount: 0,
    occupiedCount: 0,
    dirtyCount: 0,
    totalRoomsCount: 0,
  });

  const [arrivals, setArrivals] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [inHouse, setInHouse] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"ARRIVALS" | "DEPARTURES" | "IN_HOUSE" | "ROOMS">("ARRIVALS");

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [deposit, setDeposit] = useState("0");

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState("");

  const [isWalkInOpen, setIsWalkInOpen] = useState(false);

  // Load properties on mount
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

  // Load Front Desk Overview
  const loadOverviewData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const res = await getFrontDeskOverviewAction(selectedPropertyId);
      if (res.success) {
        setStats(res.stats);
        setArrivals(res.arrivals || []);
        setDepartures(res.departures || []);
        setInHouse(res.inHouse || []);
        setRooms(res.rooms || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load Front Desk data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadOverviewData();
    }
  }, [selectedPropertyId]);

  // Operations handlers
  const handleOpenCheckIn = (res: any) => {
    setSelectedReservation(res);
    setDeposit("1000"); // default deposit
    setIsCheckInModalOpen(true);
  };

  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;

    setIsActionLoading(true);
    try {
      const res = await checkInAction(selectedReservation.id, parseFloat(deposit) || 0);
      if (res.success) {
        setIsCheckInModalOpen(false);
        setSelectedReservation(null);
        await loadOverviewData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to check in.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async (resId: string) => {
    if (confirm("Are you sure you want to check out this guest stay?")) {
      setIsActionLoading(true);
      try {
        const res = await checkOutAction(resId);
        if (res.success) {
          await loadOverviewData();
        }
      } catch (err: any) {
        alert(err.message || "Failed to check out.");
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleOpenTransfer = (res: any) => {
    setSelectedReservation(res);
    // Suggest first available room that isn't the current one
    const available = rooms.filter((r) => r.status === "AVAILABLE" && r.id !== res.roomId);
    setTargetRoomId(available[0]?.id || "");
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation || !targetRoomId) return;

    setIsActionLoading(true);
    try {
      const res = await transferRoomAction(selectedReservation.id, targetRoomId);
      if (res.success) {
        setIsTransferModalOpen(false);
        setSelectedReservation(null);
        await loadOverviewData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to transfer room.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleWalkInSave = async (formData: any) => {
    if (!selectedPropertyId) return;
    setIsActionLoading(true);
    try {
      // 1. Create reservation
      const res = await createReservationAction({
        ...formData,
        propertyId: selectedPropertyId,
        status: "CONFIRMED",
      });

      if (res.success && res.reservation) {
        // 2. Automatically trigger check-in action
        await checkInAction(res.reservation.id, 0);
        setIsWalkInOpen(false);
        await loadOverviewData();
      }
    } catch (err: any) {
      throw new Error(err.message || "Failed to book walk-in stay.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter available rooms for transfer option
  const availableRoomsForTransfer = rooms.filter(
    (r) => r.status === "AVAILABLE" && r.id !== selectedReservation?.roomId
  );

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      {/* 1. Sidebar Panel */}
      <Sidebar />

      {/* 2. Main Dashboard Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Navigation */}
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
              onClick={loadOverviewData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${(isLoading || isActionLoading) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading Front Desk Operations...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Hotel className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Please complete the onboarding wizard first to set up your organization and property floors/rooms.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="inline-flex justify-center items-center py-2.5 px-5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded shadow-small transition-all"
              >
                Start Onboarding Wizard <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">Front Desk Operations</h1>
                  <p className="text-sm text-text-secondary">
                    Manage daily check-ins, departures, room transfers, and room statuses.
                  </p>
                </div>
                <button
                  onClick={() => setIsWalkInOpen(true)}
                  className="flex items-center justify-center py-2 px-4 border border-transparent rounded shadow-small text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-all"
                >
                  Walk-In Booking
                </button>
              </div>

              {/* KPI Badges Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Arrivals Today</div>
                  <div className="text-2xl font-black text-success mt-1">{stats.arrivalsCount}</div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Departures Today</div>
                  <div className="text-2xl font-black text-primary mt-1">{stats.departuresCount}</div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">In-House Guests</div>
                  <div className="text-2xl font-black text-indigo-500 mt-1">{stats.inHouseCount}</div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Occupied Rooms</div>
                  <div className="text-2xl font-black text-warning mt-1">
                    {stats.occupiedCount} <span className="text-xxs font-normal text-text-muted">/ {stats.totalRoomsCount}</span>
                  </div>
                </div>
                <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Dirty Rooms</div>
                  <div className="text-2xl font-black text-error mt-1">{stats.dirtyCount}</div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Operations Tabs Navigation */}
              <div className="flex border-b border-border-default space-x-6 text-sm font-medium">
                <button
                  onClick={() => setActiveTab("ARRIVALS")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "ARRIVALS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Arrivals ({arrivals.length})
                </button>
                <button
                  onClick={() => setActiveTab("DEPARTURES")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "DEPARTURES"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Departures ({departures.length})
                </button>
                <button
                  onClick={() => setActiveTab("IN_HOUSE")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "IN_HOUSE"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  In-House Stays ({inHouse.length})
                </button>
                <button
                  onClick={() => setActiveTab("ROOMS")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "ROOMS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Room Statuses ({rooms.length})
                </button>
              </div>

              {/* Tabs Content */}
              <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                {activeTab === "ARRIVALS" && (
                  <div>
                    {arrivals.length === 0 ? (
                      <div className="text-center py-16 text-text-secondary">
                        <Check className="w-10 h-10 text-success mx-auto mb-2" />
                        <p className="text-sm font-medium">No pending arrivals today</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                              <th className="p-4">Guest</th>
                              <th className="p-4">Assigned Room</th>
                              <th className="p-4">Stay Span</th>
                              <th className="p-4">Total Price</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default text-sm">
                            {arrivals.map((r) => (
                              <tr key={r.id} className="hover:bg-surface-secondary/50 transition-all">
                                <td className="p-4 font-semibold text-text-primary">
                                  {r.guests?.[0] ? `${r.guests[0].firstName} ${r.guests[0].lastName}` : "Direct Guest"}
                                  <span className="block text-xs font-normal text-text-secondary mt-0.5">
                                    {r.guests?.[0]?.phone || "No phone"}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className="font-mono font-bold text-text-primary">Room {r.room.number}</span>
                                  <span className="block text-xxs text-text-secondary uppercase tracking-wider font-semibold">
                                    {r.room.roomType.code} - {r.room.status}
                                  </span>
                                </td>
                                <td className="p-4 text-text-secondary text-xs">
                                  {new Date(r.checkIn).toLocaleDateString()} ➔ {new Date(r.checkOut).toLocaleDateString()}
                                </td>
                                <td className="p-4 font-semibold text-text-primary">INR {r.totalPrice}</td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleOpenCheckIn(r)}
                                    disabled={isActionLoading}
                                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-success hover:bg-success/95 rounded shadow-small transition-all disabled:opacity-50"
                                  >
                                    Check In
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "DEPARTURES" && (
                  <div>
                    {departures.length === 0 ? (
                      <div className="text-center py-16 text-text-secondary">
                        <Check className="w-10 h-10 text-success mx-auto mb-2" />
                        <p className="text-sm font-medium">No pending departures today</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                              <th className="p-4">Guest</th>
                              <th className="p-4">Room</th>
                              <th className="p-4">Stay Span</th>
                              <th className="p-4">Deposit Paid</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default text-sm">
                            {departures.map((r) => (
                              <tr key={r.id} className="hover:bg-surface-secondary/50 transition-all">
                                <td className="p-4 font-semibold text-text-primary">
                                  {r.guests?.[0] ? `${r.guests[0].firstName} ${r.guests[0].lastName}` : "Direct Guest"}
                                </td>
                                <td className="p-4">
                                  <span className="font-mono font-bold text-text-primary">Room {r.room.number}</span>
                                </td>
                                <td className="p-4 text-text-secondary text-xs">
                                  {new Date(r.checkIn).toLocaleDateString()} ➔ {new Date(r.checkOut).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-text-secondary">INR {r.depositPaid || 0}</td>
                                <td className="p-4 text-right space-x-2">
                                  <Link
                                    href={`/billing/${r.id}`}
                                    className="inline-flex items-center justify-center px-3 py-1.5 border border-border-default rounded text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all"
                                  >
                                    Billing Folio
                                  </Link>
                                  <button
                                    onClick={() => handleCheckOut(r.id)}
                                    disabled={isActionLoading}
                                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small transition-all disabled:opacity-50"
                                  >
                                    Check Out
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "IN_HOUSE" && (
                  <div>
                    {inHouse.length === 0 ? (
                      <div className="text-center py-16 text-text-secondary">
                        <Users className="w-10 h-10 text-text-muted mx-auto mb-2" />
                        <p className="text-sm font-medium">No guests currently checked in</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                              <th className="p-4">Guest</th>
                              <th className="p-4">Room</th>
                              <th className="p-4">Stay Span</th>
                              <th className="p-4">Deposit</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default text-sm">
                            {inHouse.map((r) => (
                              <tr key={r.id} className="hover:bg-surface-secondary/50 transition-all">
                                <td className="p-4 font-semibold text-text-primary">
                                  {r.guests?.[0] ? `${r.guests[0].firstName} ${r.guests[0].lastName}` : "Direct Guest"}
                                </td>
                                <td className="p-4">
                                  <span className="font-mono font-bold text-text-primary">Room {r.room.number}</span>
                                </td>
                                <td className="p-4 text-text-secondary text-xs">
                                  {new Date(r.checkIn).toLocaleDateString()} ➔ {new Date(r.checkOut).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-text-secondary">INR {r.depositPaid || 0}</td>
                                <td className="p-4 text-right space-x-2">
                                  <Link
                                    href={`/billing/${r.id}`}
                                    className="inline-flex items-center justify-center px-3 py-1.5 border border-border-default rounded text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all"
                                  >
                                    Billing Folio
                                  </Link>
                                  <button
                                    onClick={() => handleOpenTransfer(r)}
                                    disabled={isActionLoading}
                                    className="inline-flex items-center px-3 py-1.5 border border-border-default rounded text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all disabled:opacity-50"
                                  >
                                    <ArrowLeftRight className="w-3.5 h-3.5 mr-1" /> Transfer Room
                                  </button>
                                  <button
                                    onClick={() => handleCheckOut(r.id)}
                                    disabled={isActionLoading}
                                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small transition-all disabled:opacity-50"
                                  >
                                    Check Out
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "ROOMS" && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                            <th className="p-4">Room Number</th>
                            <th className="p-4">Floor</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default text-sm">
                          {rooms.map((room) => (
                            <tr key={room.id} className="hover:bg-surface-secondary/50 transition-all">
                              <td className="p-4 font-mono font-bold text-text-primary">Room {room.number}</td>
                              <td className="p-4 text-text-secondary">Floor {room.floor.number}</td>
                              <td className="p-4 text-text-secondary font-medium">{room.roomType.name} ({room.roomType.code})</td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex px-2.5 py-0.5 rounded text-xs font-semibold border ${
                                    room.status === "AVAILABLE"
                                      ? "bg-success/10 text-success border-success/20"
                                      : room.status === "OCCUPIED"
                                      ? "bg-warning/10 text-warning border-warning/20"
                                      : "bg-error/10 text-error border-error/20"
                                  }`}
                                >
                                  {room.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. Check-In Modal */}
      {isCheckInModalOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Confirm Guest Check-In</h3>
              <p className="text-xs text-text-secondary mt-1">
                For room booking of{" "}
                <span className="font-semibold">
                  {selectedReservation.guests?.[0]
                    ? `${selectedReservation.guests[0].firstName} ${selectedReservation.guests[0].lastName}`
                    : "Guest"}
                </span>{" "}
                in <span className="font-semibold">Room {selectedReservation.room.number}</span>.
              </p>
            </div>

            <form onSubmit={handleConfirmCheckIn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Captured Deposit (INR)</label>
                <input
                  type="number"
                  min={0}
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  disabled={isActionLoading}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckInModalOpen(false);
                    setSelectedReservation(null);
                  }}
                  disabled={isActionLoading}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2 text-sm font-bold text-white bg-success hover:bg-success/95 rounded shadow-small flex items-center disabled:opacity-50"
                >
                  {isActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Room Transfer Modal */}
      {isTransferModalOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Transfer Room</h3>
              <p className="text-xs text-text-secondary mt-1">
                Transfer guest{" "}
                <span className="font-semibold">
                  {selectedReservation.guests?.[0]
                    ? `${selectedReservation.guests[0].firstName} ${selectedReservation.guests[0].lastName}`
                    : "Guest"}
                </span>{" "}
                out of <span className="font-semibold">Room {selectedReservation.room?.number || "Unassigned"}</span>.
              </p>
            </div>

            {availableRoomsForTransfer.length === 0 ? (
              <div className="space-y-4">
                <div className="p-3 bg-warning/10 border border-warning/20 rounded text-warning text-xs flex items-start space-x-1.5">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>No other rooms are currently vacant and clean to receive this transfer.</span>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setSelectedReservation(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-default rounded bg-surface"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmTransfer} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Select Target Room</label>
                  <select
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(e.target.value)}
                    required
                    disabled={isActionLoading}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                  >
                    {availableRoomsForTransfer.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.number} ({r.roomType.code} - Floor {r.floor.number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setSelectedReservation(null);
                    }}
                    disabled={isActionLoading}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-default rounded bg-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading || !targetRoomId}
                    className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small flex items-center disabled:opacity-50"
                  >
                    {isActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirm Transfer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. Walk-in Stay Booking Form Modal */}
      {isWalkInOpen && (
        <ReservationForm
          rooms={rooms}
          propertyId={selectedPropertyId}
          onSave={handleWalkInSave}
          onClose={() => setIsWalkInOpen(false)}
          isLoading={isActionLoading}
        />
      )}
    </div>
  );
}

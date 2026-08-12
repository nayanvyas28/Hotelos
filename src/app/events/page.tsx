"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import {
  getEventsOverviewAction,
  createBanquetHallAction,
  createEventBookingAction,
  updateEventStatusAction,
  settleEventPaymentAction,
  chargeEventToGuestFolioAction,
} from "@/app/actions/events";
import { Hotel, KeyRound, Calendar as CalendarIcon, Users, Brush, BarChart3, Utensils, Archive, Plus, ShieldAlert, Sparkles, RefreshCw, Loader2, Play, CheckCircle, Ban, CreditCard } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";

export default function EventsBanquetsPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [banquetHalls, setBanquetHalls] = useState<any[]>([]);
  const [eventBookings, setEventBookings] = useState<any[]>([]);
  const [checkedInStays, setCheckedInStays] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"HALLS" | "BOOKINGS">("BOOKINGS");

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forms state
  const [isHallModalOpen, setIsHallModalOpen] = useState(false);
  const [hallForm, setHallForm] = useState({
    name: "",
    capacity: "100",
    basePrice: "15000",
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    hallId: "",
    guestId: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    eventName: "",
    startDateTime: "",
    endDateTime: "",
    paxCount: "50",
    cateringDetails: "",
    equipmentDetails: "",
    totalAmount: "",
    notes: "",
  });

  // Selected Booking details
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [roomChargeReservationId, setRoomChargeReservationId] = useState("");

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

  // Fetch Events data
  const loadEventsData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const res = await getEventsOverviewAction(selectedPropertyId);
      if (res.success) {
        setBanquetHalls(res.banquetHalls || []);
        setEventBookings(res.eventBookings || []);
        setCheckedInStays(res.checkedInStays || []);
        setGuests(res.guests || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadEventsData();
    }
  }, [selectedPropertyId]);

  // Sync selected booking details
  useEffect(() => {
    if (selectedBooking) {
      const updated = eventBookings.find((b) => b.id === selectedBooking.id);
      setSelectedBooking(updated || null);
    }
  }, [eventBookings]);

  // Register Hall Space submit
  const handleRegisterHall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallForm.name) return;

    setIsActionLoading(true);
    try {
      const res = await createBanquetHallAction({
        propertyId: selectedPropertyId,
        name: hallForm.name,
        capacity: Number(hallForm.capacity),
        basePrice: Number(hallForm.basePrice),
      });

      if (res.success) {
        setIsHallModalOpen(false);
        setHallForm({ name: "", capacity: "100", basePrice: "15000" });
        await loadEventsData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to register banquet space.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Pre-fill contact details if guest is selected
  const handleGuestSelect = (guestId: string) => {
    if (!guestId) {
      setBookingForm({ ...bookingForm, guestId: "", contactName: "", contactPhone: "", contactEmail: "" });
      return;
    }

    const g = guests.find((x) => x.id === guestId);
    if (g) {
      setBookingForm({
        ...bookingForm,
        guestId,
        contactName: `${g.firstName} ${g.lastName}`,
        contactPhone: g.phone || "",
        contactEmail: g.email || "",
      });
    }
  };

  // Handle reserve space submit
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.hallId || !bookingForm.eventName || !bookingForm.contactName || !bookingForm.startDateTime || !bookingForm.endDateTime) return;

    setIsActionLoading(true);
    try {
      const res = await createEventBookingAction({
        ...bookingForm,
        propertyId: selectedPropertyId,
        guestId: bookingForm.guestId || undefined,
        paxCount: Number(bookingForm.paxCount),
        totalAmount: Number(bookingForm.totalAmount),
      });

      if (res.success) {
        setIsBookingModalOpen(false);
        setBookingForm({
          hallId: "",
          guestId: "",
          contactName: "",
          contactPhone: "",
          contactEmail: "",
          eventName: "",
          startDateTime: "",
          endDateTime: "",
          paxCount: "50",
          cateringDetails: "",
          equipmentDetails: "",
          totalAmount: "",
          notes: "",
        });
        await loadEventsData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to reserve banquet hall space.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Status transition triggers
  const handleUpdateStatus = async (bookingId: string, status: string) => {
    setIsActionLoading(true);
    try {
      const res = await updateEventStatusAction(bookingId, status);
      if (res.success) {
        await loadEventsData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update event status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Settle direct invoice payments
  const handleSettlePayment = async (bookingId: string, method: string) => {
    setIsActionLoading(true);
    try {
      const res = await settleEventPaymentAction(bookingId, method);
      if (res.success) {
        await loadEventsData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to settle payment.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Post Event booking charge to Checked-in Hotel Stay folio
  const handleChargeToRoomFolio = async (bookingId: string) => {
    if (!roomChargeReservationId) return;

    setIsActionLoading(true);
    try {
      const res = await chargeEventToGuestFolioAction(bookingId, roomChargeReservationId);
      if (res.success) {
        setRoomChargeReservationId("");
        await loadEventsData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to charge event bill to folio.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      {/* 1. Sidebar Nav */}
      <Sidebar />

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
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
              onClick={loadEventsData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${(isLoading || isActionLoading) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading Banquet Event Spaces...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Sparkles className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Complete onboarding setup to begin planning and booking events.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">Events & Banquets</h1>
                  <p className="text-sm text-text-secondary">
                    Plan luxury conference halls, manage AV equipment requests, and arrange luxury catering.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsHallModalOpen(true)}
                    className="inline-flex justify-center items-center py-2 px-3 border border-border-default rounded text-sm font-semibold text-text-primary hover:bg-surface-hover bg-surface transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Register Event Space
                  </button>
                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="inline-flex justify-center items-center py-2 px-3 border border-transparent rounded text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-small transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Reserve Banquet space
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border-default space-x-6 text-sm font-medium">
                <button
                  onClick={() => {
                    setActiveTab("BOOKINGS");
                    setSelectedBooking(null);
                  }}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "BOOKINGS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Event Reservations ({eventBookings.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab("HALLS");
                    setSelectedBooking(null);
                  }}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "HALLS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Banquet Halls & Spaces ({banquetHalls.length})
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === "BOOKINGS" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Reservations List */}
                  <div className="lg:col-span-2 space-y-4">
                    {eventBookings.length === 0 ? (
                      <div className="bg-surface p-12 text-center border border-border-default rounded-lg shadow-small text-text-secondary">
                        <CalendarIcon className="w-10 h-10 text-text-muted mx-auto mb-2" />
                        <p className="text-sm font-medium">No event space reservations booked yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {eventBookings.map((b) => {
                          const isActive = selectedBooking?.id === b.id;
                          return (
                            <button
                              key={b.id}
                              onClick={() => setSelectedBooking(b)}
                              className={`p-5 border rounded-lg text-left shadow-small hover:shadow-medium transition-all w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 ${
                                isActive
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border-default bg-surface hover:bg-surface-hover/30"
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="font-bold text-base text-text-primary">{b.eventName}</div>
                                <div className="text-xs text-text-secondary">
                                  🏛️ {b.hall.name} • 👥 {b.paxCount} pax • 📅 {new Date(b.startDateTime).toLocaleDateString()}
                                </div>
                                <div className="text-xxs text-text-muted">
                                  Schedule: {new Date(b.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(b.endDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 self-end sm:self-center">
                                <span className={`px-2 py-0.5 rounded text-xxs font-bold uppercase ${
                                  b.status === "CONFIRMED" ? "bg-primary-light text-primary" :
                                  b.status === "IN_PROGRESS" ? "bg-indigo-500/10 text-indigo-500" :
                                  b.status === "COMPLETED" ? "bg-success/10 text-success" : "bg-error/10 text-error"
                                }`}>
                                  {b.status}
                                </span>
                                <span className="font-bold text-sm text-text-primary">
                                  INR {b.totalAmount.toFixed(2)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Details Sidepanel */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                    {selectedBooking ? (
                      <div className="space-y-6">
                        <div className="border-b border-border-default pb-4">
                          <h3 className="font-black text-lg text-text-primary">{selectedBooking.eventName}</h3>
                          <p className="text-xs text-text-secondary mt-0.5">Assigned to: {selectedBooking.hall.name}</p>
                        </div>

                        <div className="space-y-3.5 text-xs">
                          <div className="flex justify-between">
                            <span className="font-semibold text-text-secondary">Organizer Name:</span>
                            <span className="font-bold text-text-primary">{selectedBooking.contactName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-text-secondary">Organizer Contact:</span>
                            <span className="font-bold text-text-primary">{selectedBooking.contactPhone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-text-secondary">Timeline Hours:</span>
                            <span className="font-bold text-text-primary text-right">
                              {new Date(selectedBooking.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(selectedBooking.endDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-text-secondary">Total Invoiced:</span>
                            <span className="font-bold text-primary">INR {selectedBooking.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-text-secondary">Payment status:</span>
                            <span className="font-bold text-text-primary">{selectedBooking.paymentStatus}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-text-secondary">Stage Setup:</span>
                            <span className="font-bold text-text-primary">{selectedBooking.layoutType || "Classroom Setup"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-text-secondary">Group Room Blocks:</span>
                            <span className="font-bold text-indigo-500">{selectedBooking.roomBlocks || "None"}</span>
                          </div>
                        </div>

                        {/* catering/av cards */}
                        <div className="space-y-3">
                          <div className="p-3 bg-surface-secondary/40 border border-border-default rounded text-xs space-y-1">
                            <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Catering Request</div>
                            <p className="text-text-primary font-medium">{selectedBooking.cateringDetails || "No catering request logged"}</p>
                          </div>
                          <div className="p-3 bg-surface-secondary/40 border border-border-default rounded text-xs space-y-1">
                            <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">AV AV/Equipment Checklist</div>
                            <p className="text-text-primary font-medium">{selectedBooking.equipmentDetails || "No AV checklist logged"}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        {selectedBooking.status !== "CANCELLED" && selectedBooking.status !== "COMPLETED" && (
                          <div className="space-y-4 pt-4 border-t border-border-default">
                            <div className="text-xs font-semibold text-text-secondary">Manage Event Booking State</div>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedBooking.status === "CONFIRMED" && (
                                <button
                                  onClick={() => handleUpdateStatus(selectedBooking.id, "IN_PROGRESS")}
                                  className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all inline-flex justify-center items-center"
                                >
                                  <Play className="w-3.5 h-3.5 mr-1" /> Start Event
                                </button>
                              )}
                              {selectedBooking.status === "IN_PROGRESS" && (
                                <button
                                  onClick={() => handleUpdateStatus(selectedBooking.id, "COMPLETED")}
                                  className="py-2 bg-success hover:bg-success-hover text-white rounded text-xs font-bold transition-all inline-flex justify-center items-center"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Finish Event
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateStatus(selectedBooking.id, "CANCELLED")}
                                className="py-2 border border-border-default hover:bg-surface-hover text-error rounded text-xs font-bold transition-all inline-flex justify-center items-center"
                              >
                                <Ban className="w-3.5 h-3.5 mr-1" /> Cancel Booking
                              </button>
                            </div>

                            {/* Payment checkout */}
                            {selectedBooking.paymentStatus === "UNPAID" && (
                              <div className="space-y-4 pt-2 border-t border-border-default">
                                <div className="text-xs font-semibold text-text-secondary">Settle Booking Bill</div>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    onClick={() => handleSettlePayment(selectedBooking.id, "CASH")}
                                    className="py-2 border border-border-default hover:bg-surface-hover text-xs font-bold text-text-primary rounded transition-all"
                                  >
                                    Cash
                                  </button>
                                  <button
                                    onClick={() => handleSettlePayment(selectedBooking.id, "CARD")}
                                    className="py-2 border border-border-default hover:bg-surface-hover text-xs font-bold text-text-primary rounded transition-all"
                                  >
                                    Card
                                  </button>
                                  <button
                                    onClick={() => handleSettlePayment(selectedBooking.id, "UPI")}
                                    className="py-2 border border-border-default hover:bg-surface-hover text-xs font-bold text-text-primary rounded transition-all"
                                  >
                                    UPI
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-text-secondary block">Charge Hotel Guest Folio</label>
                                  <div className="flex space-x-2">
                                    <select
                                      value={roomChargeReservationId}
                                      onChange={(e) => setRoomChargeReservationId(e.target.value)}
                                      className="flex-1 px-3 py-1.5 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                                    >
                                      <option value="">Choose active guest stay...</option>
                                      {checkedInStays.map((s) => (
                                        <option key={s.id} value={s.id}>
                                          Room {s.room.number} — {s.guests[0]?.firstName} {s.guests[0]?.lastName}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleChargeToRoomFolio(selectedBooking.id)}
                                      disabled={!roomChargeReservationId}
                                      className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-text-muted rounded shadow-small transition-all"
                                    >
                                      Charge
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-text-secondary space-y-4">
                        <Sparkles className="w-12 h-12 text-text-muted mx-auto animate-pulse" />
                        <p className="text-sm font-semibold">Select an event space booking from the ledger to view details and post bills.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "HALLS" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {banquetHalls.map((hall) => {
                    const activeEvents = eventBookings.filter(
                      (b) =>
                        b.hallId === hall.id &&
                        b.status === "IN_PROGRESS"
                    );
                    const isOccupied = activeEvents.length > 0;

                    return (
                      <div key={hall.id} className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start border-b border-border-default pb-2">
                            <span className="font-extrabold text-base text-text-primary">{hall.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isOccupied ? "bg-error/10 text-error" : "bg-success/10 text-success"
                              }`}
                            >
                              {isOccupied ? "OCCUPIED / IN-USE" : "VACANT"}
                            </span>
                          </div>

                          <div className="text-xs text-text-secondary space-y-2 mt-4">
                            <div className="flex justify-between">
                              <span>Capacity:</span>
                              <span className="font-bold text-text-primary">{hall.capacity} Pax maximum</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Base Rental Cost:</span>
                              <span className="font-bold text-text-primary">INR {hall.basePrice.toFixed(2)} / event</span>
                            </div>
                          </div>
                        </div>

                        {isOccupied && (
                          <div className="p-3 bg-error/5 border border-error/10 rounded text-[11px] text-error">
                            <div className="font-bold uppercase tracking-wider">Live Event:</div>
                            <p className="font-medium mt-0.5">{activeEvents[0]?.eventName}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Register Space Modal */}
      {isHallModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Register Banquet Space</h3>
            <form onSubmit={handleRegisterHall} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Hall / Room Name</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Ballroom, Royal Lawn"
                  value={hallForm.name}
                  onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Guest Seating Capacity</label>
                  <input
                    type="number"
                    value={hallForm.capacity}
                    onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Base Price (INR)</label>
                  <input
                    type="number"
                    value={hallForm.basePrice}
                    onChange={(e) => setHallForm({ ...hallForm, basePrice: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsHallModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Register Hall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reserve Banquet Space Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface border border-border-default rounded-lg max-w-lg w-full shadow-modal p-6 space-y-6 my-8">
            <h3 className="text-lg font-bold text-text-primary">Reserve Banquet Space</h3>
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Select Event Hall</label>
                  <select
                    value={bookingForm.hallId}
                    onChange={(e) => {
                      const h = banquetHalls.find((x) => x.id === e.target.value);
                      setBookingForm({
                        ...bookingForm,
                        hallId: e.target.value,
                        totalAmount: h ? String(h.basePrice) : "",
                      });
                    }}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                  >
                    <option value="">Select hall...</option>
                    {banquetHalls.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} (Base: INR {h.basePrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Link Guest CRM Profile (Optional)</label>
                  <select
                    value={bookingForm.guestId}
                    onChange={(e) => handleGuestSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                  >
                    <option value="">Choose guest...</option>
                    {guests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.firstName} {g.lastName} ({g.phone || "No phone"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Event / Meeting Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sharma Marriage Reception, Tata Corporate Seminar"
                  value={bookingForm.eventName}
                  onChange={(e) => setBookingForm({ ...bookingForm, eventName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Contact Name</label>
                  <input
                    type="text"
                    value={bookingForm.contactName}
                    onChange={(e) => setBookingForm({ ...bookingForm, contactName: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Contact Phone</label>
                  <input
                    type="text"
                    value={bookingForm.contactPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, contactPhone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Contact Email</label>
                  <input
                    type="email"
                    value={bookingForm.contactEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, contactEmail: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Start Time Schedule</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.startDateTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startDateTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">End Time Schedule</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.endDateTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endDateTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Pax Count (Seating)</label>
                  <input
                    type="number"
                    value={bookingForm.paxCount}
                    onChange={(e) => setBookingForm({ ...bookingForm, paxCount: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Total Invoiced Amount (INR)</label>
                  <input
                    type="number"
                    value={bookingForm.totalAmount}
                    onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Stage Layout Setup</label>
                  <select
                    value={(bookingForm as any).layoutType || "Classroom"}
                    onChange={(e) => setBookingForm({ ...bookingForm, ...{ layoutType: e.target.value } as any })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                  >
                    <option value="Classroom">Classroom Setup</option>
                    <option value="UShape">U-Shape Meeting Board</option>
                    <option value="Theater">Theater Auditory</option>
                    <option value="RoundDinner">Round Table Banquet Dinner</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Catering Plan</label>
                  <select
                    value={(bookingForm as any).cateringPlan || "Buffet"}
                    onChange={(e) => setBookingForm({ ...bookingForm, ...{ cateringPlan: e.target.value } as any })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                  >
                    <option value="HighTea">High Tea & Cookies</option>
                    <option value="Buffet">Vegetarian Buffet Dinner</option>
                    <option value="ExecutiveLunch">Executive Platter Lunch</option>
                    <option value="None">No Catering Package</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Group Room Blocks</label>
                  <input
                    type="number"
                    placeholder="e.g. 5 Rooms"
                    value={(bookingForm as any).roomBlocks || ""}
                    onChange={(e) => setBookingForm({ ...bookingForm, ...{ roomBlocks: e.target.value } as any })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Catering Specifications</label>
                  <input
                    type="text"
                    placeholder="e.g. Vegetarian Buffet lunch, Coffee breaks"
                    value={bookingForm.cateringDetails}
                    onChange={(e) => setBookingForm({ ...bookingForm, cateringDetails: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">AV / Equipment Specifications</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Cordless Mics, UHD Projector screen"
                    value={bookingForm.equipmentDetails}
                    onChange={(e) => setBookingForm({ ...bookingForm, equipmentDetails: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Reserve Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

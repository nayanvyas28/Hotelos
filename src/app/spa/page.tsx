"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import { useSession } from "@/context/SessionContext";
import {
  getSpaOverviewAction,
  createSpaServiceAction,
  createTherapistAction,
  createSpaBookingAction,
  updateSpaBookingStatusAction,
  settleSpaPaymentAction,
  chargeSpaToGuestFolioAction,
} from "@/app/actions/spa";
import { Hotel, KeyRound, Calendar as CalendarIcon, Users, Brush, BarChart3, Utensils, Archive, Sparkles, Plus, Play, CheckCircle, Ban, RefreshCw, Loader2, Heart, HeartPulse } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";

export default function SpaWellnessPage() {
  const { currentUser } = useSession();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [spaServices, setSpaServices] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [spaBookings, setSpaBookings] = useState<any[]>([]);
  const [checkedInStays, setCheckedInStays] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"BOOKINGS" | "SERVICES" | "THERAPISTS">("BOOKINGS");

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forms state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    duration: "60",
    price: "2500",
  });

  const [isTherapistModalOpen, setIsTherapistModalOpen] = useState(false);
  const [therapistForm, setTherapistForm] = useState({
    name: "",
    specialization: "Massage Specialist",
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    serviceId: "",
    therapistId: "",
    guestId: "",
    contactName: "",
    contactPhone: "",
    bookingDateTime: "",
    notes: "",
  });

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [roomChargeReservationId, setRoomChargeReservationId] = useState("");

  // Load properties on mount
  useEffect(() => {
    async function loadProperties() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const orgId = currentUser.role === "SAAS_OWNER" ? undefined : currentUser.organizationId;
        const res = await getPropertiesAction(orgId);
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
  }, [currentUser]);

  // Fetch Spa data
  const loadSpaData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const res = await getSpaOverviewAction(selectedPropertyId);
      if (res.success) {
        setSpaServices(res.spaServices || []);
        setTherapists(res.therapists || []);
        setSpaBookings(res.spaBookings || []);
        setCheckedInStays(res.checkedInStays || []);
        setGuests(res.guests || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load spa details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadSpaData();
    }
  }, [selectedPropertyId]);

  // Sync selected booking details
  useEffect(() => {
    if (selectedBooking) {
      const updated = spaBookings.find((b) => b.id === selectedBooking.id);
      setSelectedBooking(updated || null);
    }
  }, [spaBookings]);

  // Handle register service submit
  const handleRegisterService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name) return;

    setIsActionLoading(true);
    try {
      const res = await createSpaServiceAction({
        propertyId: selectedPropertyId,
        name: serviceForm.name,
        duration: Number(serviceForm.duration),
        price: Number(serviceForm.price),
      });

      if (res.success) {
        setIsServiceModalOpen(false);
        setServiceForm({ name: "", duration: "60", price: "2500" });
        await loadSpaData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to add spa service.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle register therapist submit
  const handleRegisterTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!therapistForm.name) return;

    setIsActionLoading(true);
    try {
      const res = await createTherapistAction({
        propertyId: selectedPropertyId,
        name: therapistForm.name,
        specialization: therapistForm.specialization,
      });

      if (res.success) {
        setIsTherapistModalOpen(false);
        setTherapistForm({ name: "", specialization: "Massage Specialist" });
        await loadSpaData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to register therapist.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Fill contact details if guest profile selected
  const handleGuestSelect = (guestId: string) => {
    if (!guestId) {
      setBookingForm({ ...bookingForm, guestId: "", contactName: "", contactPhone: "" });
      return;
    }

    const g = guests.find((x) => x.id === guestId);
    if (g) {
      setBookingForm({
        ...bookingForm,
        guestId,
        contactName: `${g.firstName} ${g.lastName}`,
        contactPhone: g.phone || "",
      });
    }
  };

  // Handle reserve spa appointment submit
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.serviceId || !bookingForm.therapistId || !bookingForm.contactName || !bookingForm.bookingDateTime) return;

    setIsActionLoading(true);
    try {
      const res = await createSpaBookingAction({
        ...bookingForm,
        propertyId: selectedPropertyId,
        guestId: bookingForm.guestId || undefined,
      });

      if (res.success) {
        setIsBookingModalOpen(false);
        setBookingForm({
          serviceId: "",
          therapistId: "",
          guestId: "",
          contactName: "",
          contactPhone: "",
          bookingDateTime: "",
          notes: "",
        });
        await loadSpaData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to book spa appointment.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Status transitions
  const handleUpdateStatus = async (bookingId: string, status: string) => {
    setIsActionLoading(true);
    try {
      const res = await updateSpaBookingStatusAction(bookingId, status);
      if (res.success) {
        await loadSpaData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update booking status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Payment settle
  const handleSettlePayment = async (bookingId: string, method: string) => {
    setIsActionLoading(true);
    try {
      const res = await settleSpaPaymentAction(bookingId, method);
      if (res.success) {
        await loadSpaData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to settle payment.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Folio room charging
  const handleChargeToRoomFolio = async (bookingId: string) => {
    if (!roomChargeReservationId) return;

    setIsActionLoading(true);
    try {
      const res = await chargeSpaToGuestFolioAction(bookingId, roomChargeReservationId);
      if (res.success) {
        setRoomChargeReservationId("");
        await loadSpaData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to charge spa to folio.");
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
              onClick={loadSpaData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${(isLoading || isActionLoading) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["SPA_THERAPIST", "MANAGER"]}>
            <>
              {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading Spa Treatment Schedules...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <HeartPulse className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Complete onboarding wizard to set up spa, gym, and wellness details.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">Spa & Wellness</h1>
                  <p className="text-sm text-text-secondary">
                    Manage therapies catalogs, coordinate therapist rosters, and schedule appointments.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsTherapistModalOpen(true)}
                    className="inline-flex justify-center items-center py-2 px-3 border border-border-default rounded text-sm font-semibold text-text-primary hover:bg-surface-hover bg-surface transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Register Therapist
                  </button>
                  <button
                    onClick={() => setIsServiceModalOpen(true)}
                    className="inline-flex justify-center items-center py-2 px-3 border border-transparent rounded text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-small transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add Spa Service
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
                  Appointments List ({spaBookings.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab("SERVICES");
                    setSelectedBooking(null);
                  }}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "SERVICES"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Spa Service Menu ({spaServices.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab("THERAPISTS");
                    setSelectedBooking(null);
                  }}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "THERAPISTS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Therapists Roster ({therapists.length})
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === "BOOKINGS" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Appointments list */}
                  <div className="lg:col-span-2 space-y-4">
                    {spaBookings.length === 0 ? (
                      <div className="bg-surface p-12 text-center border border-border-default rounded-lg shadow-small text-text-secondary">
                        <CalendarIcon className="w-10 h-10 text-text-muted mx-auto mb-2" />
                        <p className="text-sm font-medium">No spa appointments booked today</p>
                        <button
                          onClick={() => setIsBookingModalOpen(true)}
                          className="mt-4 inline-flex items-center text-xs font-bold text-primary hover:underline"
                        >
                          Book Appointment Now &rarr;
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {spaBookings.map((b) => {
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
                                <div className="font-bold text-base text-text-primary">{b.service.name}</div>
                                <div className="text-xs text-text-secondary">
                                  👩‍⚕️ Therapist: {b.therapist.name} • ⏱️ {b.service.duration} mins • 📅 {new Date(b.bookingDateTime).toLocaleDateString()}
                                </div>
                                <div className="text-xxs text-text-muted">
                                  Scheduled Time: {new Date(b.bookingDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 self-end sm:self-center">
                                <span className={`px-2 py-0.5 rounded text-xxs font-bold uppercase ${
                                  b.status === "CONFIRMED" ? "bg-primary-light text-primary" :
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

                  {/* Booking details sidepanel */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                    {selectedBooking ? (
                      <div className="space-y-6">
                        <div className="border-b border-border-default pb-4">
                          <h3 className="font-bold text-lg text-text-primary">{selectedBooking.service.name}</h3>
                          <p className="text-xs text-text-secondary mt-0.5">Therapist: {selectedBooking.therapist.name}</p>
                        </div>

                        <div className="space-y-3.5 text-xs">
                          <div className="flex justify-between">
                            <span className="font-semibold text-text-secondary">Guest Name:</span>
                            <span className="font-bold text-text-primary">{selectedBooking.contactName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-text-secondary">Guest Phone:</span>
                            <span className="font-bold text-text-primary">{selectedBooking.contactPhone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-text-secondary">Appointment Time:</span>
                            <span className="font-bold text-text-primary">
                              {new Date(selectedBooking.bookingDateTime).toLocaleString()}
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
                        </div>

                        {selectedBooking.notes && (
                          <div className="p-3 bg-surface-secondary/40 border border-border-default rounded text-xs space-y-1">
                            <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Appointment Notes</div>
                            <p className="text-text-primary font-medium">{selectedBooking.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {selectedBooking.status === "CONFIRMED" && (
                          <div className="space-y-4 pt-4 border-t border-border-default">
                            <div className="text-xs font-semibold text-text-secondary">Manage Appointment</div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleUpdateStatus(selectedBooking.id, "COMPLETED")}
                                className="py-2 bg-success hover:bg-success-hover text-white rounded text-xs font-bold transition-all inline-flex justify-center items-center"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Done
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(selectedBooking.id, "CANCELLED")}
                                className="py-2 border border-border-default hover:bg-surface-hover text-error rounded text-xs font-bold transition-all inline-flex justify-center items-center"
                              >
                                <Ban className="w-3.5 h-3.5 mr-1" /> Cancel Slot
                              </button>
                            </div>

                            {selectedBooking.paymentStatus === "UNPAID" && (
                              <div className="space-y-4 pt-2 border-t border-border-default">
                                <div className="text-xs font-semibold text-text-secondary">Settle Bill</div>
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
                        <Heart className="w-12 h-12 text-text-muted mx-auto animate-pulse" />
                        <p className="text-sm font-semibold">Select a spa appointment to settle invoices and manage assignments.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "SERVICES" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {spaServices.map((service) => (
                    <div key={service.id} className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                      <div className="flex justify-between items-start border-b border-border-default pb-2">
                        <span className="font-extrabold text-base text-text-primary">{service.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-light text-primary">
                          {service.duration} Mins
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary flex justify-between pt-2">
                        <span>Price:</span>
                        <span className="font-bold text-text-primary">INR {service.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "THERAPISTS" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {therapists.map((therapist) => (
                    <div key={therapist.id} className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                      <div className="flex justify-between items-start border-b border-border-default pb-2">
                        <span className="font-extrabold text-base text-text-primary">{therapist.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-success/10 text-success">
                          Active
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary flex justify-between pt-2">
                        <span>Specialization:</span>
                        <span className="font-bold text-text-primary">{therapist.specialization || "Generalist"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </>
          </RoleProtected>
        </main>
      </div>

      {/* Add Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Add Spa Service</h3>
            <form onSubmit={handleRegisterService} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Therapy Name</label>
                <input
                  type="text"
                  placeholder="e.g. Deep Tissue Massage"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Price (INR)</label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Therapist Modal */}
      {isTherapistModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Register Therapist</h3>
            <form onSubmit={handleRegisterTherapist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Therapist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jenny Adams"
                  value={therapistForm.name}
                  onChange={(e) => setTherapistForm({ ...therapistForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Aromatherapy, Reflexology"
                  value={therapistForm.specialization}
                  onChange={(e) => setTherapistForm({ ...therapistForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTherapistModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Register Therapist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Spa Slot Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface border border-border-default rounded-lg max-w-lg w-full shadow-modal p-6 space-y-6 my-8">
            <h3 className="text-lg font-bold text-text-primary">Reserve Spa Appointment Slot</h3>
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Select Treatment</label>
                  <select
                    value={bookingForm.serviceId}
                    onChange={(e) => setBookingForm({ ...bookingForm, serviceId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                  >
                    <option value="">Select service...</option>
                    {spaServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.duration} Mins — INR {s.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Assign Therapist</label>
                  <select
                    value={bookingForm.therapistId}
                    onChange={(e) => setBookingForm({ ...bookingForm, therapistId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                  >
                    <option value="">Select therapist...</option>
                    {therapists.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.specialization || "Generalist"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Appointment Date & Time</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.bookingDateTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDateTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Therapy Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Prefers medium pressure, allergic to lavender oils"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
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
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

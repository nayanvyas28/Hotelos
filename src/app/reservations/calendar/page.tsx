"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import { getRoomsForCalendarAction, getReservationsAction, createReservationAction, updateReservationAction, deleteReservationAction } from "@/app/actions/reservation";
import ReservationForm from "@/components/reservation/ReservationForm";
import { Hotel, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, Users, Loader2, KeyRound, Brush, BarChart3, Utensils, Archive, Sparkles, HeartPulse } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

export default function ReservationCalendarPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  // Calendar Timeline state
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedFloor, setSelectedFloor] = useState<string>("ALL");
  const [selectedRoomType, setSelectedRoomType] = useState<string>("ALL");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<any | null>(null);

  // Helper to generate 14 dates starting from startDate
  const getTimelineDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const timelineDates = getTimelineDates();
  const endDate = new Date(timelineDates[timelineDates.length - 1]);
  endDate.setHours(23, 59, 59, 999);

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

  // Load rooms and reservations for the current property & date range
  useEffect(() => {
    if (!selectedPropertyId) return;

    async function loadCalendarData() {
      setError(null);
      try {
        // Fetch rooms
        const roomsRes = await getRoomsForCalendarAction(selectedPropertyId);
        // Fetch reservations overlapping our 14-day window
        const resRes = await getReservationsAction({
          propertyId: selectedPropertyId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        if (roomsRes.success && resRes.success) {
          setRooms(roomsRes.rooms || []);
          setReservations(resRes.reservations || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load calendar data.");
      }
    }

    loadCalendarData();
  }, [selectedPropertyId, startDate]);

  const handleNavigateWeeks = (direction: "PREV" | "NEXT") => {
    const nextDate = new Date(startDate);
    if (direction === "PREV") {
      nextDate.setDate(startDate.getDate() - 7);
    } else {
      nextDate.setDate(startDate.getDate() + 7);
    }
    setStartDate(nextDate);
  };

  const handleResetToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStartDate(today);
  };

  // Helper: check if a reservation overlaps the 14-day timeline and calculate Gantt positioning
  const calculateGanttPosition = (res: any) => {
    const checkIn = new Date(res.checkIn);
    const checkOut = new Date(res.checkOut);

    // Timeline bounds
    const timelineStart = timelineDates[0].getTime();
    const timelineEnd = timelineDates[timelineDates.length - 1].getTime() + 86400000; // end of 14th day

    // Exclude if entirely outside
    if (checkOut.getTime() <= timelineStart || checkIn.getTime() >= timelineEnd) {
      return null;
    }

    // Clamp bounds to timeline
    const start = Math.max(checkIn.getTime(), timelineStart);
    const end = Math.min(checkOut.getTime(), timelineEnd);

    // Calculate left & width percentages
    const totalTimelineDuration = timelineEnd - timelineStart;
    const leftOffset = start - timelineStart;
    const duration = end - start;

    const leftPercent = (leftOffset / totalTimelineDuration) * 100;
    const widthPercent = (duration / totalTimelineDuration) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  };

  const handleSaveReservation = async (formData: any) => {
    setIsSubmitLoading(true);
    try {
      if (editingReservation) {
        const res = await updateReservationAction(editingReservation.id, formData);
        if (res.success && res.reservation) {
          setReservations(
            reservations.map((r) => (r.id === editingReservation.id ? res.reservation : r))
          );
          setIsModalOpen(false);
          setEditingReservation(null);
        }
      } else {
        const res = await createReservationAction({
          ...formData,
          propertyId: selectedPropertyId,
        });
        if (res.success && res.reservation) {
          setReservations([...reservations, res.reservation]);
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      throw new Error(err.message || "Failed to save booking.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleEditClick = (res: any) => {
    // Reformat guests array for form compatibility
    const formatted = {
      ...res,
      guests: res.guests.map((g: any) => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
      })),
    };
    setEditingReservation(formatted);
    setIsModalOpen(true);
  };

  // Filtered rooms listing
  const filteredRooms = rooms.filter((r) => {
    if (selectedFloor !== "ALL" && String(r.floor.number) !== selectedFloor) return false;
    if (selectedRoomType !== "ALL" && r.roomType.code !== selectedRoomType) return false;
    return true;
  });

  // Extract unique floors and room types for filter selects
  const floorsList = Array.from(new Set(rooms.map((r) => r.floor.number))).sort((a, b) => a - b);
  const roomTypesList = Array.from(new Set(rooms.map((r) => r.roomType.code))).sort();

  // Status color mapper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-primary text-white border-primary-hover";
      case "CHECKED_IN":
        return "bg-success text-white border-success/80";
      case "CHECKED_OUT":
        return "bg-text-secondary text-white border-text-muted";
      case "PENDING":
        return "bg-warning text-white border-warning-hover";
      default:
        return "bg-text-muted text-white border-border-default";
    }
  };

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
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading properties database...</p>
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
                Start Onboarding Wizard <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reservation Calendar</h1>
                  <p className="text-sm text-text-secondary">
                    View room availability timeline grid, and handle quick stay bookings.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingReservation(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center py-2 px-4 border border-transparent rounded shadow-small text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-all"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Book Stay
                </button>
              </div>

              {/* Navigation timeline controls & Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-surface border border-border-default rounded-md">
                {/* Navigation controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleNavigateWeeks("PREV")}
                    className="p-2 border border-border-default rounded hover:bg-surface-hover text-text-primary transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetToToday}
                    className="px-3 py-2 border border-border-default rounded hover:bg-surface-hover text-xs font-bold text-text-secondary transition-all"
                  >
                    Today
                  </button>
                  <span className="text-sm font-bold text-text-primary px-2">
                    {timelineDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} —{" "}
                    {timelineDates[timelineDates.length - 1].toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => handleNavigateWeeks("NEXT")}
                    className="p-2 border border-border-default rounded hover:bg-surface-hover text-text-primary transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter selectors */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary">
                    <Filter className="w-3.5 h-3.5 text-text-muted" />
                    <span>Filter:</span>
                  </div>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    className="px-2.5 py-1.5 border border-border-default rounded bg-surface text-xs font-semibold text-text-secondary focus:outline-none"
                  >
                    <option value="ALL">All Floors</option>
                    {floorsList.map((f) => (
                      <option key={f} value={String(f)}>
                        Floor {f}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedRoomType}
                    onChange={(e) => setSelectedRoomType(e.target.value)}
                    className="px-2.5 py-1.5 border border-border-default rounded bg-surface text-xs font-semibold text-text-secondary focus:outline-none"
                  >
                    <option value="ALL">All Types</option>
                    {roomTypesList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Gantt Calendar Grid container */}
              <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden flex flex-col">
                {/* Timeline Header Row */}
                <div className="flex border-b border-border-default bg-surface-secondary">
                  {/* Sticky left room axis header */}
                  <div className="w-36 flex-shrink-0 p-3 border-r border-border-default font-bold text-xxs uppercase tracking-wider text-text-muted text-center bg-surface-secondary z-10 sticky left-0">
                    Room
                  </div>
                  
                  {/* 14 days columns headers */}
                  <div className="flex-1 grid grid-cols-14">
                    {timelineDates.map((d, idx) => (
                      <div
                        key={idx}
                        className="p-2 border-r border-border-default last:border-0 text-center flex flex-col justify-center items-center space-y-0.5 min-w-[50px]"
                      >
                        <span className="text-xxs font-bold text-text-muted uppercase">
                          {d.toLocaleDateString(undefined, { weekday: "short" })}
                        </span>
                        <span className="text-sm font-bold text-text-primary">
                          {d.getDate()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rooms Rows */}
                <div className="divide-y divide-border-default max-h-[500px] overflow-y-auto">
                  {filteredRooms.length === 0 ? (
                    <div className="text-center py-16 text-text-secondary">
                      <p className="text-sm font-medium">No matching rooms found</p>
                      <p className="text-xs text-text-muted mt-1">Adjust your floor or room type filter options.</p>
                    </div>
                  ) : (
                    filteredRooms.map((room) => {
                      // Filter reservations matching current room
                      const roomReservations = reservations.filter((r) => r.roomId === room.id);

                      return (
                        <div key={room.id} className="flex relative hover:bg-surface-secondary/20 group min-h-[52px]">
                          {/* Sticky left Room selector */}
                          <div className="w-36 flex-shrink-0 p-3 border-r border-border-default bg-surface text-center flex flex-col justify-center sticky left-0 z-10 group-hover:bg-surface-secondary/10">
                            <span className="font-bold text-sm text-text-primary">Room {room.number}</span>
                            <span className="text-xxs text-text-secondary uppercase tracking-wider font-semibold">
                              {room.roomType.code} - Floor {room.floor.number}
                            </span>
                          </div>

                          {/* 14 date cells grid (acts as background drop-grids) */}
                          <div className="flex-1 grid grid-cols-14 relative min-w-[700px]">
                            {timelineDates.map((_, idx) => (
                              <div
                                key={idx}
                                className="border-r border-border-default last:border-0 h-full min-w-[50px]"
                              />
                            ))}

                            {/* Render Reservation Bars positioned absolute-relative */}
                            {roomReservations.map((res) => {
                              const pos = calculateGanttPosition(res);
                              if (!pos) return null; // Outside calendar view

                              return (
                                <button
                                  key={res.id}
                                  type="button"
                                  onClick={() => handleEditClick(res)}
                                  style={{ left: pos.left, width: pos.width }}
                                  className={`absolute top-2 bottom-2 px-3 py-1 border rounded shadow-small text-left text-xs font-semibold flex flex-col justify-center overflow-hidden transition-all hover:scale-[1.01] hover:shadow-medium cursor-pointer ${getStatusColor(
                                    res.status
                                  )}`}
                                >
                                  <span className="truncate block font-bold leading-tight">
                                    {res.guests?.[0]
                                      ? `${res.guests[0].firstName} ${res.guests[0].lastName}`
                                      : "Guest Booking"}
                                  </span>
                                  <span className="text-[9px] truncate block opacity-90 leading-tight">
                                    INR {res.totalPrice} ({res.status.replace("_", " ")})
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Reservation Modal Form */}
      {isModalOpen && (
        <ReservationForm
          rooms={rooms}
          propertyId={selectedPropertyId}
          initialData={editingReservation}
          onSave={handleSaveReservation}
          onClose={() => {
            setIsModalOpen(false);
            setEditingReservation(null);
          }}
          isLoading={isSubmitLoading}
        />
      )}
    </div>
  );
}

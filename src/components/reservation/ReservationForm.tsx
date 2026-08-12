"use client";

import { useState, useEffect } from "react";
import { checkRoomAvailability } from "@/app/actions/reservation";
import { getGuestsAction } from "@/app/actions/guest";
import { Loader2, Calendar, User, Info, Check, AlertCircle } from "lucide-react";

interface ReservationFormProps {
  rooms: any[];
  propertyId: string;
  initialData?: any;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export default function ReservationForm({
  rooms,
  propertyId,
  initialData,
  onSave,
  onClose,
  isLoading,
}: ReservationFormProps) {
  const [checkIn, setCheckIn] = useState(
    initialData?.checkIn
      ? new Date(initialData.checkIn).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [checkOut, setCheckOut] = useState(
    initialData?.checkOut
      ? new Date(initialData.checkOut).toISOString().split("T")[0]
      : new Date(Date.now() + 86400000).toISOString().split("T")[0] // tomorrow
  );
  
  const [selectedRoomId, setSelectedRoomId] = useState(initialData?.roomId || (rooms[0]?.id || ""));
  const [totalPrice, setTotalPrice] = useState(initialData?.totalPrice || 2000);
  const [status, setStatus] = useState(initialData?.status || "CONFIRMED");
  const [source, setSource] = useState(initialData?.source || "DIRECT");
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Guest Search & Selection
  const [guestSearch, setGuestSearch] = useState("");
  const [guestOptions, setGuestOptions] = useState<any[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<any[]>(initialData?.guests || []);
  const [isSearchingGuests, setIsSearchingGuests] = useState(false);

  // Live availability status
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [availabilityConflict, setAvailabilityConflict] = useState<any | null>(null);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  // Load guests on search input
  useEffect(() => {
    if (!propertyId) return;
    
    async function searchGuests() {
      setIsSearchingGuests(true);
      try {
        const res = await getGuestsAction({
          propertyId,
          search: guestSearch,
          vipOnly: false,
        });
        if (res.success) {
          // Filter out guests already selected
          const filtered = res.guests.filter(
            (g) => !selectedGuests.some((sg) => sg.id === g.id)
          );
          setGuestOptions(filtered);
        }
      } catch (err) {
        console.error("Guest search error:", err);
      } finally {
        setIsSearchingGuests(false);
      }
    }

    const timer = setTimeout(() => {
      searchGuests();
    }, 300);

    return () => clearTimeout(timer);
  }, [guestSearch, propertyId, selectedGuests]);

  // Live availability check on dates/room change
  useEffect(() => {
    if (!selectedRoomId || !checkIn || !checkOut) return;

    async function checkAvailability() {
      setIsAvailabilityLoading(true);
      setAvailabilityConflict(null);
      setAvailabilityChecked(false);
      try {
        const conflict = await checkRoomAvailability(
          selectedRoomId,
          checkIn,
          checkOut,
          initialData?.id
        );
        setAvailabilityConflict(conflict);
        setAvailabilityChecked(true);
      } catch (err) {
        console.error("Availability check error:", err);
      } finally {
        setIsAvailabilityLoading(false);
      }
    }

    const timer = setTimeout(() => {
      checkAvailability();
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedRoomId, checkIn, checkOut, initialData]);

  // Auto-calculate base price if room changes
  useEffect(() => {
    if (initialData) return; // Keep custom prices on edit
    const room = rooms.find((r) => r.id === selectedRoomId);
    if (room?.roomType?.basePrice) {
      // Calculate price based on nights
      const nights = Math.max(
        1,
        Math.round(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
        )
      );
      setTotalPrice(room.roomType.basePrice * nights);
    }
  }, [selectedRoomId, checkIn, checkOut, rooms, initialData]);

  const handleAddGuest = (guest: any) => {
    setSelectedGuests([...selectedGuests, guest]);
    setGuestSearch("");
    setGuestOptions([]);
  };

  const handleRemoveGuest = (id: string) => {
    setSelectedGuests(selectedGuests.filter((g) => g.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGuests.length === 0) {
      setFormError("At least one guest must be associated with the reservation.");
      return;
    }
    if (availabilityConflict) {
      setFormError("The selected room is not available for these dates.");
      return;
    }

    setFormError(null);
    try {
      await onSave({
        checkIn,
        checkOut,
        roomId: selectedRoomId,
        guestIds: selectedGuests.map((g) => g.id),
        totalPrice,
        status,
        source,
        notes,
      });
    } catch (err: any) {
      setFormError(err.message || "Failed to save reservation.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-surface border border-border-default rounded-lg max-w-xl w-full max-h-[90vh] flex flex-col shadow-modal">
        {/* Modal Header */}
        <div className="p-4 border-b border-border-default flex justify-between items-center bg-surface-secondary rounded-t-lg">
          <h3 className="text-lg font-bold text-text-primary">
            {initialData ? "Edit Reservation" : "New Room Booking"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-surface transition-all"
          >
            ✕
          </button>
        </div>

        {/* Modal Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-md text-error text-sm font-medium">
              {formError}
            </div>
          )}

          {/* 1. Guests Search & Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center">
              <User className="w-4 h-4 mr-1.5 text-primary" /> 1. Guests Assignment
            </h4>
            
            {/* Selected Guests list */}
            {selectedGuests.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 border border-border-default rounded bg-surface-secondary">
                {selectedGuests.map((sg) => (
                  <span
                    key={sg.id}
                    className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-primary-light text-primary border border-primary/20"
                  >
                    {sg.firstName} {sg.lastName}
                    <button
                      type="button"
                      onClick={() => handleRemoveGuest(sg.id)}
                      disabled={isLoading}
                      className="ml-1.5 text-primary hover:text-primary-hover font-bold"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Guest Search bar */}
            <div className="relative">
              <input
                type="text"
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                placeholder="Search CRM guest by name to link to booking..."
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
              />
              {isSearchingGuests && (
                <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
              )}

              {/* Guest Search Options Dropdown */}
              {guestSearch.trim() !== "" && guestOptions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-surface border border-border-default rounded shadow-medium max-h-40 overflow-y-auto z-10">
                  {guestOptions.map((go) => (
                    <button
                      key={go.id}
                      type="button"
                      onClick={() => handleAddGuest(go)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-surface-secondary text-text-primary font-medium border-b border-border-default last:border-0"
                    >
                      {go.firstName} {go.lastName} ({go.email || go.phone || "No contact info"})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <hr className="border-border-default" />

          {/* 2. Dates & Room Configuration */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-primary" /> 2. Dates & Room
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Check-In Date</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Check-Out Date</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Room Assignment</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.number} ({r.roomType.code} - Floor {r.floor.number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Total Price (INR)</label>
                <input
                  type="number"
                  min={0}
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Live Availability engine checker banner */}
            <div className="pt-1">
              {isAvailabilityLoading ? (
                <div className="flex items-center text-xs text-text-muted space-x-1.5 p-2 bg-surface-secondary rounded border border-border-default">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking room calendar availability...</span>
                </div>
              ) : availabilityChecked && (
                availabilityConflict ? (
                  <div className="flex items-start text-xs text-error space-x-1.5 p-3 bg-error/10 rounded border border-error/20">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">Double-Booking Conflict!</span>
                      The room is booked by guest{" "}
                      <span className="font-semibold">
                        {availabilityConflict.guests?.[0]
                          ? `${availabilityConflict.guests[0].firstName} ${availabilityConflict.guests[0].lastName}`
                          : "Unknown"}
                      </span>{" "}
                      from {new Date(availabilityConflict.checkIn).toLocaleDateString()} to{" "}
                      {new Date(availabilityConflict.checkOut).toLocaleDateString()}.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-success space-x-1.5 p-2 bg-success/10 rounded border border-success/20">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold">Room is fully available for these dates!</span>
                  </div>
                )
              )}
            </div>
          </div>

          <hr className="border-border-default" />

          {/* 3. Status, Source & Notes */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center">
              <Info className="w-4 h-4 mr-1.5 text-primary" /> 3. Additional Settings
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Reservation Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                >
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending Payment</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Booking Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                >
                  <option value="DIRECT">Direct (Front Desk)</option>
                  <option value="WALK_IN">Walk-In Guest</option>
                  <option value="WEBSITE">Online Website</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">Special Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add reservation notes (e.g., late check-in request, extra bed requested)..."
                disabled={isLoading}
                rows={2}
                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 flex justify-end space-x-2 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-default rounded bg-surface transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedGuests.length === 0 || !!availabilityConflict || isAvailabilityLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded shadow-small flex items-center transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Booking"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

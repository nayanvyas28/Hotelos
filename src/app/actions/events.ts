"use server";

import { db } from "@/lib/db";

interface HallInput {
  propertyId: string;
  name: string;
  capacity: number;
  basePrice: number;
}

interface EventBookingInput {
  propertyId: string;
  hallId: string;
  guestId?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  eventName: string;
  startDateTime: string; // ISO String
  endDateTime: string;   // ISO String
  paxCount: number;
  cateringDetails?: string;
  equipmentDetails?: string;
  totalAmount: number;
  notes?: string;
}

/**
 * Fetches dashboard details for Banquet Spaces and Event Bookings.
 */
export async function getEventsOverviewAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    // 1. Fetch banquet halls
    const banquetHalls = await db.banquetHall.findMany({
      where: { propertyId },
      orderBy: { name: "asc" },
    });

    // 2. Fetch event bookings
    const eventBookings = await db.eventBooking.findMany({
      where: { propertyId },
      include: {
        hall: { select: { name: true } },
        guest: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startDateTime: "asc" },
    });

    // 3. Fetch checked-in guests for room folio charging select
    const checkedInStays = await db.reservation.findMany({
      where: {
        propertyId,
        status: "CHECKED_IN",
      },
      include: {
        guests: { select: { firstName: true, lastName: true } },
        room: { select: { number: true } },
      },
      orderBy: { room: { number: "asc" } },
    });

    // 4. Fetch guests list for Guest CRM linkage dropdown
    const guests = await db.guest.findMany({
      where: { propertyId },
      orderBy: { firstName: "asc" },
    });

    return {
      success: true,
      banquetHalls,
      eventBookings,
      checkedInStays,
      guests,
    };
  } catch (error: any) {
    console.error("Prisma error in getEventsOverviewAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      return {
        success: false,
        banquetHalls: [],
        eventBookings: [],
        checkedInStays: [],
        guests: [],
      };
    }
    
    throw new Error(error.message || "Failed to fetch Events overview.");
  }
}

/**
 * Registers a new Banquet Space / Hall.
 */
export async function createBanquetHallAction(data: HallInput) {
  if (!data.propertyId || !data.name || !data.capacity || !data.basePrice) {
    throw new Error("Property ID, Hall Name, Seating Capacity, and Base Rental Price are required.");
  }

  try {
    const hall = await db.banquetHall.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        capacity: Number(data.capacity),
        basePrice: Number(data.basePrice),
      },
    });
    return { success: true, hall };
  } catch (error: any) {
    console.error("Prisma error in createBanquetHallAction:", error);
    throw new Error(error.message || "Failed to register banquet hall.");
  }
}

/**
 * Reserves a banquet hall for a specified timeline, verifying overlap conflicts.
 */
export async function createEventBookingAction(data: EventBookingInput) {
  if (
    !data.propertyId ||
    !data.hallId ||
    !data.eventName ||
    !data.contactName ||
    !data.startDateTime ||
    !data.endDateTime
  ) {
    throw new Error("Missing required event reservation details.");
  }

  const start = new Date(data.startDateTime);
  const end = new Date(data.endDateTime);

  if (start >= end) {
    throw new Error("Event start time must precede the end schedule time.");
  }

  try {
    const booking = await db.$transaction(async (tx) => {
      // 1. Conflict schedule overlap query
      const conflict = await tx.eventBooking.findFirst({
        where: {
          hallId: data.hallId,
          status: { in: ["CONFIRMED", "IN_PROGRESS"] },
          startDateTime: { lt: end },
          endDateTime: { gt: start },
        },
      });

      if (conflict) {
        throw new Error(
          `Banquet space scheduling conflict: overlaps with event '${conflict.eventName}' (${conflict.startDateTime.toLocaleString()} - ${conflict.endDateTime.toLocaleString()}).`
        );
      }

      // 2. Create EventBooking
      const newBooking = await tx.eventBooking.create({
        data: {
          propertyId: data.propertyId,
          hallId: data.hallId,
          guestId: data.guestId || null,
          contactName: data.contactName.trim(),
          contactPhone: data.contactPhone.trim(),
          contactEmail: data.contactEmail.trim(),
          eventName: data.eventName.trim(),
          startDateTime: start,
          endDateTime: end,
          paxCount: Number(data.paxCount) || 10,
          cateringDetails: data.cateringDetails?.trim() || "",
          equipmentDetails: data.equipmentDetails?.trim() || "",
          totalAmount: Number(data.totalAmount),
          status: "CONFIRMED",
          paymentStatus: "UNPAID",
          notes: data.notes?.trim() || "",
        },
      });

      return newBooking;
    });

    return { success: true, booking };
  } catch (error: any) {
    console.error("Prisma error in createEventBookingAction:", error);
    throw new Error(error.message || "Failed to reserve banquet hall.");
  }
}

/**
 * Transitions event booking statuses (CONFIRMED -> IN_PROGRESS -> COMPLETED -> CANCELLED).
 */
export async function updateEventStatusAction(bookingId: string, status: string) {
  if (!bookingId || !status) {
    throw new Error("Booking ID and Status are required.");
  }

  try {
    const updated = await db.eventBooking.update({
      where: { id: bookingId },
      data: { status },
    });
    return { success: true, booking: updated };
  } catch (error: any) {
    console.error("Prisma error in updateEventStatusAction:", error);
    throw new Error(error.message || "Failed to update event booking status.");
  }
}

/**
 * Settles event billing with direct payments (CASH/CARD/UPI).
 */
export async function settleEventPaymentAction(bookingId: string, method: string) {
  if (!bookingId || !method) {
    throw new Error("Booking ID and Payment Method are required.");
  }

  try {
    const updated = await db.eventBooking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "PAID",
        status: "COMPLETED",
      },
    });
    return { success: true, booking: updated };
  } catch (error: any) {
    console.error("Prisma error in settleEventPaymentAction:", error);
    throw new Error(error.message || "Failed to settle event invoice payment.");
  }
}

/**
 * Charges event total rental invoices directly to hotel guest's room folio ledger.
 */
export async function chargeEventToGuestFolioAction(bookingId: string, reservationId: string) {
  if (!bookingId || !reservationId) {
    throw new Error("Booking ID and Reservation ID are required.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Verify reservation state
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation || reservation.status !== "CHECKED_IN") {
        throw new Error("Selected hotel guest stay is not active/checked-in.");
      }

      // 2. Fetch event details
      const booking = await tx.eventBooking.findUnique({
        where: { id: bookingId },
        include: { hall: { select: { name: true } } },
      });

      if (!booking) {
        throw new Error("Event booking not found.");
      }

      // 3. Find or create folio
      let folio = await tx.folio.findUnique({
        where: { reservationId },
      });

      if (!folio) {
        folio = await tx.folio.create({
          data: {
            reservationId,
            status: "OPEN",
          },
        });
      }

      // 4. Post charge
      await tx.folioCharge.create({
        data: {
          folioId: folio.id,
          type: "OTHER",
          amount: booking.totalAmount,
          taxAmount: Math.round(booking.totalAmount * 0.18 * 100) / 100, // 18% Luxury Event Tax/GST
          description: `Event Rental: ${booking.eventName} (${booking.hall.name})`,
        },
      });

      // 5. Update event payment status
      const updatedBooking = await tx.eventBooking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          paymentStatus: "ROOM_CHARGE",
        },
      });

      return updatedBooking;
    });

    return { success: true, booking: result };
  } catch (error: any) {
    console.error("Prisma error in chargeEventToGuestFolioAction:", error);
    throw new Error(error.message || "Failed to charge event to room folio.");
  }
}

"use server";

import { db } from "@/lib/db";

interface SpaServiceInput {
  propertyId: string;
  name: string;
  duration: number;
  price: number;
}

interface TherapistInput {
  propertyId: string;
  name: string;
  specialization?: string;
}

interface SpaBookingInput {
  propertyId: string;
  serviceId: string;
  therapistId: string;
  guestId?: string;
  contactName: string;
  contactPhone: string;
  bookingDateTime: string; // ISO String
  notes?: string;
}

/**
 * Fetches dashboard details for Spa services, therapists, and appointments.
 */
export async function getSpaOverviewAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    // 1. Fetch spa services
    const spaServices = await db.spaService.findMany({
      where: { propertyId },
      orderBy: { name: "asc" },
    });

    // 2. Fetch therapists
    const therapists = await db.therapist.findMany({
      where: { propertyId },
      orderBy: { name: "asc" },
    });

    // 3. Fetch spa bookings
    const spaBookings = await db.spaBooking.findMany({
      where: { propertyId },
      include: {
        service: { select: { name: true, duration: true } },
        therapist: { select: { name: true } },
        guest: { select: { firstName: true, lastName: true } },
      },
      orderBy: { bookingDateTime: "asc" },
    });

    // 4. Fetch checked-in guests for room folio charging select
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

    // 5. Fetch guests list for guest profile linkage dropdown
    const guests = await db.guest.findMany({
      where: { propertyId },
      orderBy: { firstName: "asc" },
    });

    return {
      success: true,
      spaServices,
      therapists,
      spaBookings,
      checkedInStays,
      guests,
    };
  } catch (error: any) {
    console.error("Prisma error in getSpaOverviewAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      return {
        success: false,
        spaServices: [],
        therapists: [],
        spaBookings: [],
        checkedInStays: [],
        guests: [],
      };
    }
    
    throw new Error(error.message || "Failed to fetch Spa overview.");
  }
}

/**
 * Registers a new Spa Treatment / Service.
 */
export async function createSpaServiceAction(data: SpaServiceInput) {
  if (!data.propertyId || !data.name || !data.duration || !data.price) {
    throw new Error("Property ID, Service Name, Duration, and Price are required.");
  }

  try {
    const service = await db.spaService.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        duration: Number(data.duration),
        price: Number(data.price),
      },
    });
    return { success: true, service };
  } catch (error: any) {
    console.error("Prisma error in createSpaServiceAction:", error);
    throw new Error(error.message || "Failed to create spa service.");
  }
}

/**
 * Registers a new Therapist.
 */
export async function createTherapistAction(data: TherapistInput) {
  if (!data.propertyId || !data.name) {
    throw new Error("Property ID and Therapist Name are required.");
  }

  try {
    const therapist = await db.therapist.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        specialization: data.specialization?.trim() || "",
        isAvailable: true,
      },
    });
    return { success: true, therapist };
  } catch (error: any) {
    console.error("Prisma error in createTherapistAction:", error);
    throw new Error(error.message || "Failed to register therapist.");
  }
}

/**
 * Reserves a spa treatment appointment slot, verifying therapist availability collisions.
 */
export async function createSpaBookingAction(data: SpaBookingInput) {
  if (
    !data.propertyId ||
    !data.serviceId ||
    !data.therapistId ||
    !data.contactName ||
    !data.bookingDateTime
  ) {
    throw new Error("Missing required spa booking details.");
  }

  try {
    const booking = await db.$transaction(async (tx) => {
      // 1. Fetch service detail to get duration
      const service = await tx.spaService.findUnique({
        where: { id: data.serviceId },
      });

      if (!service) {
        throw new Error("Spa service not found.");
      }

      const requestStart = new Date(data.bookingDateTime);
      const requestEnd = new Date(requestStart.getTime() + service.duration * 60 * 1000);

      // 2. Query all active bookings for this therapist
      const therapistBookings = await tx.spaBooking.findMany({
        where: {
          therapistId: data.therapistId,
          status: "CONFIRMED",
        },
        include: {
          service: { select: { duration: true } },
        },
      });

      // 3. Overlap check logic
      for (const b of therapistBookings) {
        const bStart = b.bookingDateTime;
        const bEnd = new Date(bStart.getTime() + b.service.duration * 60 * 1000);

        if (bStart < requestEnd && bEnd > requestStart) {
          throw new Error(
            `Therapist assignment conflict: Selected therapist is already reserved from ${bStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} to ${bEnd.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`
          );
        }
      }

      // 4. Create SpaBooking
      const newBooking = await tx.spaBooking.create({
        data: {
          propertyId: data.propertyId,
          serviceId: data.serviceId,
          therapistId: data.therapistId,
          guestId: data.guestId || null,
          contactName: data.contactName.trim(),
          contactPhone: data.contactPhone.trim(),
          bookingDateTime: requestStart,
          status: "CONFIRMED",
          paymentStatus: "UNPAID",
          totalAmount: service.price,
          notes: data.notes?.trim() || "",
        },
      });

      return newBooking;
    });

    return { success: true, booking };
  } catch (error: any) {
    console.error("Prisma error in createSpaBookingAction:", error);
    throw new Error(error.message || "Failed to book spa slot.");
  }
}

/**
 * Transitions spa booking status (CONFIRMED -> COMPLETED / CANCELLED).
 */
export async function updateSpaBookingStatusAction(bookingId: string, status: string) {
  if (!bookingId || !status) {
    throw new Error("Booking ID and Status are required.");
  }

  try {
    const updated = await db.spaBooking.update({
      where: { id: bookingId },
      data: { status },
    });
    return { success: true, booking: updated };
  } catch (error: any) {
    console.error("Prisma error in updateSpaBookingStatusAction:", error);
    throw new Error(error.message || "Failed to update spa booking status.");
  }
}

/**
 * Settles spa invoice payments (CASH/CARD/UPI).
 */
export async function settleSpaPaymentAction(bookingId: string, method: string) {
  if (!bookingId || !method) {
    throw new Error("Booking ID and Payment Method are required.");
  }

  try {
    const updated = await db.spaBooking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "PAID",
        status: "COMPLETED",
      },
    });
    return { success: true, booking: updated };
  } catch (error: any) {
    console.error("Prisma error in settleSpaPaymentAction:", error);
    throw new Error(error.message || "Failed to settle spa billing invoice.");
  }
}

/**
 * Charges spa total invoice directly to guest's room folio statement.
 */
export async function chargeSpaToGuestFolioAction(bookingId: string, reservationId: string) {
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

      // 2. Fetch booking details
      const booking = await tx.spaBooking.findUnique({
        where: { id: bookingId },
        include: { service: { select: { name: true } } },
      });

      if (!booking) {
        throw new Error("Spa booking not found.");
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
          type: "SPA",
          amount: booking.totalAmount,
          taxAmount: Math.round(booking.totalAmount * 0.12 * 100) / 100, // 12% Spa/Wellness Service Tax
          description: `Spa Treatment: ${booking.service.name}`,
        },
      });

      // 5. Update spa booking status
      const updated = await tx.spaBooking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          paymentStatus: "ROOM_CHARGE",
        },
      });

      return updated;
    });

    return { success: true, booking: result };
  } catch (error: any) {
    console.error("Prisma error in chargeSpaToGuestFolioAction:", error);
    throw new Error(error.message || "Failed to charge spa treatment to folio.");
  }
}

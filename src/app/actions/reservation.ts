"use server";

import { db } from "@/lib/db";

interface ReservationInput {
  checkIn: Date | string;
  checkOut: Date | string;
  roomId: string;
  propertyId: string;
  guestIds: string[];
  totalPrice: number;
  status?: string; // CONFIRMED, PENDING, CANCELLED, etc.
  source?: string; // DIRECT, WALK_IN, WEBSITE, etc.
  notes?: string;
  ratePlanId?: string;
}

/**
 * Checks if a room is available for a given date range.
 * Returns the conflicting reservation if any, or null if available.
 */
export async function checkRoomAvailability(
  roomId: string,
  checkIn: Date | string,
  checkOut: Date | string,
  excludeReservationId?: string
) {
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (start >= end) {
      throw new Error("Check-in date must be before check-out date.");
    }

    // Check if room has an active Out of Service maintenance block
    const activeOOSBlock = await db.maintenanceLog.findFirst({
      where: {
        roomId,
        isOutOfService: true,
        status: { not: "RESOLVED" },
      },
    });

    if (activeOOSBlock) {
      return {
        id: "MAINTENANCE_BLOCK",
        notes: `Room is OUT_OF_SERVICE: ${activeOOSBlock.issue}`,
        guests: [],
      } as any;
    }

    // Interval overlap condition: checkIn < existing.checkOut AND checkOut > existing.checkIn
    const conflict = await db.reservation.findFirst({
      where: {
        roomId,
        status: { not: "CANCELLED" },
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
      include: {
        guests: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return conflict;
  } catch (error: any) {
    console.error("Error checking room availability:", error);
    throw new Error(error.message || "Failed to verify room availability.");
  }
}

/**
 * Transaction-safe reservation creation to prevent double-booking.
 */
export async function createReservationAction(data: ReservationInput) {
  if (!data.roomId || !data.propertyId || data.guestIds.length === 0) {
    throw new Error("Room, property, and at least one guest are required.");
  }

  try {
    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);

    const result = await db.$transaction(async (tx) => {
      // 1. Check for active OOS blocks
      const oosBlock = await tx.maintenanceLog.findFirst({
        where: {
          roomId: data.roomId,
          isOutOfService: true,
          status: { not: "RESOLVED" },
        },
      });

      if (oosBlock) {
        throw new Error(`Room is currently OUT_OF_SERVICE for maintenance: ${oosBlock.issue}`);
      }

      // 2. Double check availability inside transaction
      const conflict = await tx.reservation.findFirst({
        where: {
          roomId: data.roomId,
          status: { not: "CANCELLED" },
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      });

      if (conflict) {
        throw new Error(
          `Room is already booked for the selected dates (Conflict ID: ${conflict.id}).`
        );
      }

      // 2. Create the reservation
      const reservation = await tx.reservation.create({
        data: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: data.status || "CONFIRMED",
          source: data.source || "DIRECT",
          totalPrice: data.totalPrice,
          notes: data.notes || "",
          roomId: data.roomId,
          propertyId: data.propertyId,
          ratePlanId: data.ratePlanId || undefined,
          guests: {
            connect: data.guestIds.map((id) => ({ id })),
          },
        },
        include: {
          guests: true,
          room: true,
          ratePlan: true,
        },
      });

      return reservation;
    });

    return { success: true, reservation: result };
  } catch (error: any) {
    console.error("Prisma error in createReservationAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      throw new Error(
        "Database connection failed. Please ensure you have replaced the '[password]' placeholder with your actual Supabase database password in the .env file."
      );
    }
    
    throw new Error(error.message || "Failed to create reservation.");
  }
}

/**
 * Updates a reservation. Re-validates availability if dates are changed.
 */
export async function updateReservationAction(id: string, data: Partial<ReservationInput>) {
  if (!id) {
    throw new Error("Reservation ID is required.");
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      const current = await tx.reservation.findUnique({
        where: { id },
      });

      if (!current) {
        throw new Error("Reservation not found.");
      }

      // Check if dates or room changed
      const checkInChanged = data.checkIn && new Date(data.checkIn).getTime() !== current.checkIn.getTime();
      const checkOutChanged = data.checkOut && new Date(data.checkOut).getTime() !== current.checkOut.getTime();
      const roomChanged = data.roomId && data.roomId !== current.roomId;

      if (checkInChanged || checkOutChanged || roomChanged) {
        const checkInDate = data.checkIn ? new Date(data.checkIn) : current.checkIn;
        const checkOutDate = data.checkOut ? new Date(data.checkOut) : current.checkOut;
        const targetRoomId = data.roomId || current.roomId;

        // Verify no conflicts (excluding this reservation itself)
        const conflict = await tx.reservation.findFirst({
          where: {
            roomId: targetRoomId,
            id: { not: id },
            status: { not: "CANCELLED" },
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        });

        if (conflict) {
          throw new Error("The selected room is already booked for these dates.");
        }
      }

      // Prepare update payload
      const updateData: any = {
        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
        status: data.status,
        source: data.source,
        totalPrice: data.totalPrice,
        notes: data.notes,
        roomId: data.roomId,
      };

      if (data.guestIds) {
        updateData.guests = {
          set: data.guestIds.map((gid) => ({ id: gid })),
        };
      }

      const res = await tx.reservation.update({
        where: { id },
        data: updateData,
        include: {
          guests: true,
          room: true,
        },
      });

      return res;
    });

    return { success: true, reservation: updated };
  } catch (error: any) {
    console.error("Prisma error in updateReservationAction:", error);
    throw new Error(error.message || "Failed to update reservation.");
  }
}

export async function deleteReservationAction(id: string) {
  try {
    await db.reservation.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Prisma error in deleteReservationAction:", error);
    throw new Error(error.message || "Failed to delete reservation.");
  }
}

/**
 * Fetches all reservations for a given property and date range (for Gantt rendering).
 */
export async function getReservationsAction(filters: {
  propertyId: string;
  startDate?: Date | string;
  endDate?: Date | string;
}) {
  if (!filters.propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const whereClause: any = {
      propertyId: filters.propertyId,
    };

    if (filters.startDate && filters.endDate) {
      whereClause.checkIn = { lt: new Date(filters.endDate) };
      whereClause.checkOut = { gt: new Date(filters.startDate) };
    }

    const reservations = await db.reservation.findMany({
      where: whereClause,
      include: {
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            roomType: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        checkIn: "asc",
      },
    });

    return { success: true, reservations };
  } catch (error: any) {
    console.error("Prisma error in getReservationsAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      return { success: false, reservations: [] };
    }
    
    throw new Error(error.message || "Failed to fetch reservations.");
  }
}

/**
 * Fetches all rooms for a property (needed by Gantt Calendar Left-Axis).
 */
export async function getRoomsForCalendarAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const rooms = await db.room.findMany({
      where: { propertyId },
      include: {
        roomType: {
          select: {
            name: true,
            code: true,
          },
        },
        floor: {
          select: {
            number: true,
          },
        },
      },
      orderBy: [
        { floor: { number: "asc" } },
        { number: "asc" },
      ],
    });

    return { success: true, rooms };
  } catch (error: any) {
    console.error("Prisma error in getRoomsForCalendarAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      return { success: false, rooms: [] };
    }
    
    throw new Error(error.message || "Failed to fetch rooms.");
  }
}

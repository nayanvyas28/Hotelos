"use server";

import { db } from "@/lib/db";
import { checkRoomAvailability } from "./reservation";

/**
 * Handles checking in a guest. Updates room status to OCCUPIED.
 */
export async function checkInAction(reservationId: string, depositPaid: number) {
  if (!reservationId) {
    throw new Error("Reservation ID is required.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { room: true },
      });

      if (!reservation) {
        throw new Error("Reservation not found.");
      }

      if (reservation.status !== "CONFIRMED" && reservation.status !== "PENDING") {
        throw new Error(`Cannot check in a reservation with status ${reservation.status}.`);
      }

      // Update reservation status and deposit
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: "CHECKED_IN",
          depositPaid: depositPaid || 0,
        },
      });

      // Update room status to OCCUPIED
      await tx.room.update({
        where: { id: reservation.roomId },
        data: { status: "OCCUPIED" },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          propertyId: reservation.propertyId,
          action: "GUEST_CHECKIN",
          details: `Guest Checked In for Room ${reservation.room.number}. Deposit Paid: INR ${depositPaid || 0}`,
          performedBy: "Front Desk Agent",
        },
      });

      return updatedReservation;
    });

    return { success: true, reservation: result };
  } catch (error: any) {
    console.error("Prisma error in checkInAction:", error);
    throw new Error(error.message || "Failed to complete check-in.");
  }
}

/**
 * Handles checking out a guest. Updates room status to DIRTY.
 */
export async function checkOutAction(reservationId: string) {
  if (!reservationId) {
    throw new Error("Reservation ID is required.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new Error("Reservation not found.");
      }

      if (reservation.status !== "CHECKED_IN") {
        throw new Error("Reservation must be checked in before checking out.");
      }

      // Update reservation status to CHECKED_OUT
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CHECKED_OUT" },
      });

      // Update room status to DIRTY
      await tx.room.update({
        where: { id: reservation.roomId },
        data: { status: "DIRTY" },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          propertyId: reservation.propertyId,
          action: "GUEST_CHECKOUT",
          details: `Guest Checked Out from reservation ID: ${reservationId}`,
          performedBy: "Front Desk Agent",
        },
      });

      return updatedReservation;
    });

    return { success: true, reservation: result };
  } catch (error: any) {
    console.error("Prisma error in checkOutAction:", error);
    throw new Error(error.message || "Failed to complete check-out.");
  }
}

/**
 * Handles transferring a stay to another room.
 */
export async function transferRoomAction(reservationId: string, targetRoomId: string) {
  if (!reservationId || !targetRoomId) {
    throw new Error("Reservation ID and Target Room ID are required.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new Error("Reservation not found.");
      }

      const oldRoomId = reservation.roomId;

      if (oldRoomId === targetRoomId) {
        throw new Error("Guest is already assigned to this room.");
      }

      // Check if target room is available for the remaining dates of the stay
      const conflict = await tx.reservation.findFirst({
        where: {
          roomId: targetRoomId,
          id: { not: reservationId },
          status: { not: "CANCELLED" },
          checkIn: { lt: reservation.checkOut },
          checkOut: { gt: reservation.checkIn },
        },
      });

      if (conflict) {
        throw new Error("The target room is not available for the reservation stay dates.");
      }

      // Update reservation room association
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { roomId: targetRoomId },
      });

      // If guest is currently checked in, swap room statuses
      if (reservation.status === "CHECKED_IN") {
        // Old room is marked DIRTY
        await tx.room.update({
          where: { id: oldRoomId },
          data: { status: "DIRTY" },
        });

        // New room is marked OCCUPIED
        await tx.room.update({
          where: { id: targetRoomId },
          data: { status: "OCCUPIED" },
        });
      }

      return updatedReservation;
    });

    return { success: true, reservation: result };
  } catch (error: any) {
    console.error("Prisma error in transferRoomAction:", error);
    throw new Error(error.message || "Failed to transfer room.");
  }
}

/**
 * Fetches dashboard details for Arrivals, Departures, and In-House.
 */
export async function getFrontDeskOverviewAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const today = new Date();
    
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch all reservations for the property today
    const reservations = await db.reservation.findMany({
      where: { propertyId },
      include: {
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            status: true,
            roomType: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    // Fetch all rooms for statistics
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
    });

    // Filtering logic
    const arrivals = reservations.filter((r) => {
      const checkInDate = new Date(r.checkIn);
      return (
        checkInDate >= startOfToday &&
        checkInDate <= endOfToday &&
        (r.status === "CONFIRMED" || r.status === "PENDING")
      );
    });

    const departures = reservations.filter((r) => {
      const checkOutDate = new Date(r.checkOut);
      return (
        checkOutDate >= startOfToday &&
        checkOutDate <= endOfToday &&
        r.status === "CHECKED_IN"
      );
    });

    const inHouse = reservations.filter((r) => {
      return r.status === "CHECKED_IN";
    });

    const occupiedCount = rooms.filter((r) => r.status === "OCCUPIED").length;
    const dirtyCount = rooms.filter((r) => r.status === "DIRTY").length;

    return {
      success: true,
      stats: {
        arrivalsCount: arrivals.length,
        departuresCount: departures.length,
        inHouseCount: inHouse.length,
        occupiedCount,
        dirtyCount,
        totalRoomsCount: rooms.length,
      },
      arrivals,
      departures,
      inHouse,
      rooms,
    };
  } catch (error: any) {
    console.error("Prisma error in getFrontDeskOverviewAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      return {
        success: false,
        stats: { arrivalsCount: 0, departuresCount: 0, inHouseCount: 0, occupiedCount: 0, dirtyCount: 0, totalRoomsCount: 0 },
        arrivals: [],
        departures: [],
        inHouse: [],
        rooms: [],
      };
    }
    
    throw new Error(error.message || "Failed to fetch Front Desk details.");
  }
}

"use server";

import { db } from "@/lib/db";

export async function postMinibarChargeAction(
  propertyId: string,
  roomId: string,
  itemType: string,
  amount: number,
  description: string
) {
  try {
    // 1. Find active reservation for the selected room
    const reservation = await db.reservation.findFirst({
      where: {
        roomId,
        propertyId,
        status: "CHECKED_IN",
      },
      include: { folio: true },
    });

    if (!reservation) {
      throw new Error("No active guest checked into this room.");
    }

    let folio = reservation.folio;

    // 2. If folio doesn't exist, create it
    if (!folio) {
      folio = await db.folio.create({
        data: {
          reservationId: reservation.id,
          status: "OPEN",
        },
      });
    }

    // 3. Post FolioCharge
    const charge = await db.folioCharge.create({
      data: {
        folioId: folio.id,
        type: itemType === "MINIBAR" ? "OTHER" : "ROOM_SERVICE",
        amount,
        taxAmount: amount * 0.18, // 18% standard tax
        description,
      },
    });

    return { success: true, charge };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCheckedInRoomsAction(propertyId: string) {
  try {
    const reservations = await db.reservation.findMany({
      where: {
        propertyId,
        status: "CHECKED_IN",
      },
      include: { room: true },
    });

    const rooms = reservations.map((r) => r.room);
    return { success: true, rooms };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

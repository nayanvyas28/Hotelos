"use server";

import { db } from "@/lib/db";

export async function getGuestPortalDataAction(reservationId: string) {
  if (!reservationId) return { success: false, error: "Reservation ID is required" };

  try {
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: {
        room: true,
        guests: true,
        property: true,
      },
    });

    if (!reservation) {
      return { success: false, error: "Stay record not found" };
    }

    // Fetch previous orders from this guest stay
    const pastOrders = await db.restaurantOrder.findMany({
      where: { reservationId },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch active housekeeping tasks
    const activeTasks = await db.housekeepingTask.findMany({
      where: { roomId: reservation.roomId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
    });

    // Fetch active maintenance issues
    const activeIssues = await db.maintenanceLog.findMany({
      where: { roomId: reservation.roomId, status: { in: ["REPORTED", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
    });

    // Fetch available menu catalog items
    const menuCatalog = await db.menuItem.findMany({
      where: { propertyId: reservation.propertyId, isAvailable: true },
    });

    return {
      success: true,
      reservation,
      pastOrders,
      activeTasks,
      activeIssues,
      menuCatalog,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function placeGuestOrderAction(data: {
  reservationId: string;
  items: Array<{ menuItemId: string; quantity: number }>;
}) {
  try {
    const reservation = await db.reservation.findUnique({
      where: { id: data.reservationId },
    });

    if (!reservation) throw new Error("Stay record not found.");

    // Calculate total amount
    let total = 0;
    const orderItemsData = [];

    for (const item of data.items) {
      const menu = await db.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (menu) {
        total += menu.price * item.quantity;
        orderItemsData.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: menu.price,
        });
      }
    }

    // Create restaurant order charged directly to room folio
    const order = await db.restaurantOrder.create({
      data: {
        propertyId: reservation.propertyId,
        reservationId: data.reservationId,
        totalAmount: total,
        status: "PENDING",
        paymentStatus: "ROOM_CHARGE",
        orderItems: {
          create: orderItemsData,
        },
      },
    });

    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitGuestRequestAction(data: {
  reservationId: string;
  type: "HOUSEKEEPING" | "MAINTENANCE";
  notes: string;
}) {
  try {
    const reservation = await db.reservation.findUnique({
      where: { id: data.reservationId },
    });

    if (!reservation) throw new Error("Stay record not found.");

    if (data.type === "HOUSEKEEPING") {
      const task = await db.housekeepingTask.create({
        data: {
          roomId: reservation.roomId,
          status: "PENDING",
          priority: "MEDIUM",
          notes: data.notes,
        },
      });
      return { success: true, task };
    } else {
      const issue = await db.maintenanceLog.create({
        data: {
          roomId: reservation.roomId,
          issue: data.notes,
          priority: "MEDIUM",
          status: "REPORTED",
          isOutOfService: false,
        },
      });
      return { success: true, issue };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

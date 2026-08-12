"use server";

import { db } from "@/lib/db";

export async function processGuestMessageAction(message: string, propertyId: string) {
  try {
    const query = message.toLowerCase();
    let reply = "Hello! Your message has been received by our guest services team. We are looking into this immediately.";
    let actionTaken = "Logged in CRM notes";
    let taskCreated = null;

    // Try to find a room to link the request
    const room = await db.room.findFirst({
      where: { propertyId },
    });

    if (!room) {
      throw new Error("No rooms configured for this property.");
    }

    if (
      query.includes("towel") ||
      query.includes("water") ||
      query.includes("clean") ||
      query.includes("soap") ||
      query.includes("pillow") ||
      query.includes("blanket")
    ) {
      // Create Housekeeping Task
      const task = await db.housekeepingTask.create({
        data: {
          roomId: room.id,
          priority: "HIGH",
          notes: `Guest request via AI Concierge: "${message}"`,
          assignedTo: "Housekeeping Team",
          status: "PENDING",
        },
        include: { room: true },
      });
      reply = `Certainly! I have generated a priority housekeeping request for Room ${room.number}. A staff member has been dispatched to deliver the items.`;
      actionTaken = `Housekeeping task created for Room ${room.number}`;
      taskCreated = { id: task.id, type: "HOUSEKEEPING", desc: task.notes };
    } else if (
      query.includes("ac") ||
      query.includes("cool") ||
      query.includes("leak") ||
      query.includes("wifi") ||
      query.includes("tv") ||
      query.includes("light") ||
      query.includes("faucet") ||
      query.includes("lock")
    ) {
      // Create Maintenance Incident log
      const log = await db.maintenanceLog.create({
        data: {
          roomId: room.id,
          issue: `Guest request via AI Concierge: "${message}"`,
          priority: "HIGH",
          status: "REPORTED",
          isOutOfService: false,
        },
        include: { room: true },
      });
      reply = `Apologies for the inconvenience. I have registered a maintenance work order for Room ${room.number} regarding "${message}". Our engineering team will resolve this shortly.`;
      actionTaken = `Maintenance incident logged for Room ${room.number}`;
      taskCreated = { id: log.id, type: "MAINTENANCE", desc: log.issue };
    }

    return {
      success: true,
      reply,
      actionTaken,
      taskCreated,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

"use server";

import { db } from "@/lib/db";

/**
 * Fetches dashboard details for Housekeeping and Maintenance.
 */
export async function getHousekeepingOverviewAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    // 1. Fetch all rooms
    const rooms = await db.room.findMany({
      where: { propertyId },
      include: {
        roomType: { select: { name: true, code: true } },
        floor: { select: { number: true } },
      },
      orderBy: [{ floor: { number: "asc" } }, { number: "asc" }],
    });

    // 2. Fetch active housekeeping tasks (status !== "COMPLETED")
    const activeTasks = await db.housekeepingTask.findMany({
      where: {
        room: { propertyId },
        status: { not: "COMPLETED" },
      },
      include: {
        room: {
          select: {
            number: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch active maintenance logs (status !== "RESOLVED")
    const activeMaintenance = await db.maintenanceLog.findMany({
      where: {
        room: { propertyId },
        status: { not: "RESOLVED" },
      },
      include: {
        room: {
          select: {
            number: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Calculate operational statistics
    const stats = {
      totalRooms: rooms.length,
      availableCount: rooms.filter((r) => r.status === "AVAILABLE").length,
      occupiedCount: rooms.filter((r) => r.status === "OCCUPIED").length,
      dirtyCount: rooms.filter((r) => r.status === "DIRTY").length,
      cleaningCount: rooms.filter((r) => r.status === "CLEANING").length,
      oosCount: rooms.filter((r) => r.status === "OUT_OF_SERVICE").length,
    };

    return {
      success: true,
      stats,
      rooms,
      activeTasks,
      activeMaintenance,
    };
  } catch (error: any) {
    console.error("Prisma error in getHousekeepingOverviewAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      return {
        success: false,
        stats: { totalRooms: 0, availableCount: 0, occupiedCount: 0, dirtyCount: 0, cleaningCount: 0, oosCount: 0 },
        rooms: [],
        activeTasks: [],
        activeMaintenance: [],
      };
    }
    
    throw new Error(error.message || "Failed to fetch Housekeeping overview.");
  }
}

/**
 * Manually updates a room's status (AVAILABLE, OCCUPIED, DIRTY, CLEANING, OUT_OF_SERVICE).
 */
export async function updateRoomStatusAction(roomId: string, status: string) {
  if (!roomId || !status) {
    throw new Error("Room ID and Status are required.");
  }

  try {
    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: { status },
    });
    return { success: true, room: updatedRoom };
  } catch (error: any) {
    console.error("Prisma error in updateRoomStatusAction:", error);
    throw new Error(error.message || "Failed to update room status.");
  }
}

/**
 * Creates a housekeeping cleaning task.
 */
export async function createHousekeepingTaskAction(data: {
  roomId: string;
  assignedTo?: string;
  priority: string;
  notes?: string;
}) {
  if (!data.roomId) {
    throw new Error("Room ID is required.");
  }

  try {
    const task = await db.$transaction(async (tx) => {
      // Create task
      const newTask = await tx.housekeepingTask.create({
        data: {
          roomId: data.roomId,
          assignedTo: data.assignedTo?.trim() || "",
          priority: data.priority,
          notes: data.notes?.trim() || "",
          status: "PENDING",
        },
      });

      // Update room status to DIRTY if it isn't occupied or OOS, or keep as is
      return newTask;
    });

    return { success: true, task };
  } catch (error: any) {
    console.error("Prisma error in createHousekeepingTaskAction:", error);
    throw new Error(error.message || "Failed to create housekeeping task.");
  }
}

/**
 * Updates cleaning task status. Changes room status to CLEANING or AVAILABLE/OCCUPIED.
 */
export async function updateHousekeepingTaskAction(taskId: string, status: string) {
  if (!taskId || !status) {
    throw new Error("Task ID and Status are required.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const task = await tx.housekeepingTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error("Housekeeping task not found.");
      }

      // Update task status
      const updatedTask = await tx.housekeepingTask.update({
        where: { id: taskId },
        data: { status },
      });

      // Synchronize room status
      if (status === "IN_PROGRESS") {
        await tx.room.update({
          where: { id: task.roomId },
          data: { status: "CLEANING" },
        });
      } else if (status === "COMPLETED") {
        // Find if guest is checked in
        const activeStay = await tx.reservation.findFirst({
          where: {
            roomId: task.roomId,
            status: "CHECKED_IN",
          },
        });

        const targetStatus = activeStay ? "OCCUPIED" : "AVAILABLE";

        await tx.room.update({
          where: { id: task.roomId },
          data: { status: targetStatus },
        });
      }

      return updatedTask;
    });

    return { success: true, task: result };
  } catch (error: any) {
    console.error("Prisma error in updateHousekeepingTaskAction:", error);
    throw new Error(error.message || "Failed to update cleaning task.");
  }
}

/**
 * Reports a room maintenance issue. If isOutOfService is true, marks room OUT_OF_SERVICE.
 */
export async function createMaintenanceLogAction(data: {
  roomId: string;
  issue: string;
  priority: string;
  isOutOfService: boolean;
}) {
  if (!data.roomId || !data.issue) {
    throw new Error("Room ID and Issue description are required.");
  }

  try {
    const log = await db.$transaction(async (tx) => {
      const newLog = await tx.maintenanceLog.create({
        data: {
          roomId: data.roomId,
          issue: data.issue.trim(),
          priority: data.priority,
          isOutOfService: data.isOutOfService,
          status: "REPORTED",
        },
      });

      if (data.isOutOfService) {
        await tx.room.update({
          where: { id: data.roomId },
          data: { status: "OUT_OF_SERVICE" },
        });
      }

      return newLog;
    });

    return { success: true, log };
  } catch (error: any) {
    console.error("Prisma error in createMaintenanceLogAction:", error);
    throw new Error(error.message || "Failed to create maintenance log.");
  }
}

/**
 * Resolves a maintenance log, changing room status to DIRTY (requiring cleaning before sell).
 */
export async function resolveMaintenanceLogAction(logId: string) {
  if (!logId) {
    throw new Error("Maintenance Log ID is required.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUnique({
        where: { id: logId },
      });

      if (!log) {
        throw new Error("Maintenance log not found.");
      }

      // Mark maintenance resolved
      const updatedLog = await tx.maintenanceLog.update({
        where: { id: logId },
        data: { status: "RESOLVED" },
      });

      // Set room status back to DIRTY (so housekeeping sweeps and inspects it!)
      // Unless guest is already checked-in (in which case it stays OCCUPIED)
      if (log.isOutOfService) {
        const activeStay = await tx.reservation.findFirst({
          where: {
            roomId: log.roomId,
            status: "CHECKED_IN",
          },
        });

        const targetStatus = activeStay ? "OCCUPIED" : "DIRTY";

        await tx.room.update({
          where: { id: log.roomId },
          data: { status: targetStatus },
        });
      }

      return updatedLog;
    });

    return { success: true, log: result };
  } catch (error: any) {
    console.error("Prisma error in resolveMaintenanceLogAction:", error);
    throw new Error(error.message || "Failed to resolve maintenance log.");
  }
}

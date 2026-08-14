"use server";

import { db } from "@/lib/db";

export async function getDashboardStatsAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const totalRooms = await db.room.count({ where: { propertyId } });
    const occupiedRooms = await db.room.count({ where: { propertyId, status: "OCCUPIED" } });
    const dirtyRooms = await db.room.count({ where: { propertyId, status: "DIRTY" } });
    const maintenanceRooms = await db.room.count({ where: { propertyId, status: "MAINTENANCE" } });

    const inHouseCount = await db.reservation.count({
      where: { propertyId, status: "CHECKED_IN" },
    });

    const totalGuests = await db.guest.count({
      where: { propertyId },
    });

    // Simple revenue calculations from payments on this property
    const payments = await db.folioPayment.findMany({
      where: {
        type: "PAYMENT",
        folio: {
          reservation: {
            propertyId,
          },
        },
      },
      select: { amount: true },
    });

    const refunds = await db.folioPayment.findMany({
      where: {
        type: "REFUND",
        folio: {
          reservation: {
            propertyId,
          },
        },
      },
      select: { amount: true },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0) - refunds.reduce((sum, r) => sum + r.amount, 0);

    // Dynamic rates plans count
    const ratePlansCount = await db.ratePlan.count({ where: { propertyId } });

    // Recent checkout rooms
    const checkedOutCount = await db.reservation.count({
      where: { propertyId, status: "CHECKED_OUT" },
    });

    // Overdue tasks
    const pendingTasksCount = await db.housekeepingTask.count({
      where: { room: { propertyId }, status: { in: ["PENDING", "IN_PROGRESS"] } },
    });

    return {
      success: true,
      stats: {
        totalRooms,
        occupiedRooms,
        dirtyRooms,
        vacantRooms: Math.max(0, totalRooms - occupiedRooms - dirtyRooms - maintenanceRooms),
        maintenanceRooms,
        inHouseCount,
        totalGuests,
        totalRevenue,
        ratePlansCount,
        checkedOutCount,
        pendingTasksCount,
      },
    };
  } catch (error: any) {
    console.error("Prisma error in getDashboardStatsAction:", error);
    return { success: false, error: error.message };
  }
}

export async function getGroupDashboardStatsAction(organizationId?: string) {
  try {
    const where = organizationId ? { organizationId } : {};
    const properties = await db.property.findMany({
      where,
      include: {
        rooms: true,
        reservations: {
          include: {
            guests: true,
          },
        },
      },
    });

    const propertySummaries = await Promise.all(
      properties.map(async (p) => {
        // Calculate revenue for this property
        const payments = await db.folioPayment.findMany({
          where: {
            type: "PAYMENT",
            folio: {
              reservation: {
                propertyId: p.id,
              },
            },
          },
          select: { amount: true },
        });

        const refunds = await db.folioPayment.findMany({
          where: {
            type: "REFUND",
            folio: {
              reservation: {
                propertyId: p.id,
              },
            },
          },
          select: { amount: true },
        });

        const revenue = payments.reduce((sum, pay) => sum + pay.amount, 0) - refunds.reduce((sum, ref) => sum + ref.amount, 0);
        const totalRooms = p.rooms.length;
        const occupiedRooms = p.rooms.filter((r) => r.status === "OCCUPIED").length;
        const occupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
        const adr = occupiedRooms > 0 ? parseFloat((revenue / occupiedRooms).toFixed(2)) : 0;

        return {
          id: p.id,
          name: p.name,
          totalRooms,
          occupiedRooms,
          occupancy,
          revenue,
          adr,
          revPar: totalRooms > 0 ? parseFloat((revenue / totalRooms).toFixed(2)) : 0,
        };
      })
    );

    const totalGroupRevenue = propertySummaries.reduce((sum, p) => sum + p.revenue, 0);
    const totalGroupRooms = propertySummaries.reduce((sum, p) => sum + p.totalRooms, 0);
    const totalGroupOccupied = propertySummaries.reduce((sum, p) => sum + p.occupiedRooms, 0);
    const groupOccupancy = totalGroupRooms > 0 ? Math.round((totalGroupOccupied / totalGroupRooms) * 100) : 0;

    return {
      success: true,
      groupStats: {
        totalGroupRevenue,
        groupOccupancy,
        totalGroupRooms,
        totalGroupOccupied,
        propertySummaries,
      },
    };
  } catch (error: any) {
    console.error("Prisma error in getGroupDashboardStatsAction:", error);
    return { success: false, error: error.message };
  }
}

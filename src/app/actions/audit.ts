"use server";

import { db } from "@/lib/db";

/**
 * Normalizes a date to start and end of day in UTC/local timezone context.
 */
function getDayRange(date: Date) {
  const parsed = date ? new Date(date) : new Date();
  const valid = !isNaN(parsed.getTime());
  const fallback = valid ? parsed : new Date();

  const start = new Date(fallback);
  start.setHours(0, 0, 0, 0);
  const end = new Date(fallback);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Helper to calculate nights.
 */
function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1;
}

export async function getAuditStatusAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error("Property not found.");
    }

    let businessDate = new Date();
    if (property.businessDate) {
      const parsed = new Date(property.businessDate);
      if (!isNaN(parsed.getTime())) {
        businessDate = parsed;
      }
    }
    const { start: startOfBusinessDate, end: endOfBusinessDate } = getDayRange(businessDate);

    // 1. Pending Departures (Checked in, and checkout is on or before businessDate)
    const pendingDepartures = await db.reservation.findMany({
      where: {
        propertyId,
        status: "CHECKED_IN",
        checkOut: { lte: endOfBusinessDate },
      },
      include: {
        guests: { select: { firstName: true, lastName: true } },
        room: { select: { number: true } },
      },
    });

    // 2. Pending Arrivals (Confirmed/Pending, and checkIn is on or before businessDate)
    const pendingArrivals = await db.reservation.findMany({
      where: {
        propertyId,
        status: { in: ["CONFIRMED", "PENDING"] },
        checkIn: { lte: endOfBusinessDate },
      },
      include: {
        guests: { select: { firstName: true, lastName: true } },
        room: { select: { number: true } },
      },
    });

    // 3. Projected Room Charges (All checked-in guests staying overnight)
    const activeStays = await db.reservation.findMany({
      where: {
        propertyId,
        status: "CHECKED_IN",
        checkIn: { lt: endOfBusinessDate },
        checkOut: { gt: startOfBusinessDate },
      },
      include: {
        room: { include: { roomType: true } },
      },
    });

    let projectedChargesCount = 0;
    let projectedRevenue = 0;
    const taxRate = 0.12; // 12% GST

    for (const stay of activeStays) {
      // Calculate daily rate
      const nights = calculateNights(new Date(stay.checkIn), new Date(stay.checkOut));
      const dailyRate = stay.totalPrice / nights;

      // Check if already posted for today
      const dateStr = businessDate.toLocaleDateString();
      const existingCharge = await db.folioCharge.findFirst({
        where: {
          folio: { reservationId: stay.id },
          type: "ROOM_RATE",
          description: { contains: dateStr },
        },
      });

      if (!existingCharge) {
        projectedChargesCount++;
        projectedRevenue += dailyRate;
      }
    }

    return {
      success: true,
      businessDate: property.businessDate,
      stats: {
        pendingDeparturesCount: pendingDepartures.length,
        pendingArrivalsCount: pendingArrivals.length,
        projectedChargesCount,
        projectedRevenueAmount: parseFloat(projectedRevenue.toFixed(2)),
        projectedTaxAmount: parseFloat((projectedRevenue * taxRate).toFixed(2)),
      },
      pendingDepartures,
      pendingArrivals,
    };
  } catch (error: any) {
    console.error("Prisma error in getAuditStatusAction:", error);
    throw new Error(error.message || "Failed to fetch night audit status.");
  }
}

export async function runNightAuditAction(propertyId: string, performedBy: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }
  if (!performedBy) {
    throw new Error("Auditor name/email is required.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Retrieve Property
      const property = await tx.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new Error("Property not found.");
      }

      let businessDate = new Date();
      if (property.businessDate) {
        const parsed = new Date(property.businessDate);
        if (!isNaN(parsed.getTime())) {
          businessDate = parsed;
        }
      }
      const { start: startOfBusiness, end: endOfBusiness } = getDayRange(businessDate);
      const dateStr = businessDate.toLocaleDateString();

      // 2. Auto-Process No-Shows
      // Find all confirmed/pending bookings that had checkIn <= businessDate and didn't check in
      const noShows = await tx.reservation.findMany({
        where: {
          propertyId,
          status: { in: ["CONFIRMED", "PENDING"] },
          checkIn: { lte: endOfBusiness },
        },
      });

      for (const ns of noShows) {
        await tx.reservation.update({
          where: { id: ns.id },
          data: { status: "NO_SHOW" },
        });

        // Optionally create an empty Folio and charge a no-show cancellation fee (e.g. 1 night base price)
        let folio = await tx.folio.findUnique({ where: { reservationId: ns.id } });
        if (!folio) {
          folio = await tx.folio.create({
            data: { reservationId: ns.id, status: "OPEN" },
          });
        }

        // Post cancellation penalty fee
        await tx.folioCharge.create({
          data: {
            folioId: folio.id,
            type: "OTHER",
            amount: ns.totalPrice > 0 ? parseFloat((ns.totalPrice / calculateNights(new Date(ns.checkIn), new Date(ns.checkOut))).toFixed(2)) : 1000,
            taxAmount: 0,
            description: `No-Show Penalty Cancellation Fee`,
          },
        });
      }

      // 3. Auto-Post Room Rates & Taxes for Checked-in stays
      const activeStays = await tx.reservation.findMany({
        where: {
          propertyId,
          status: "CHECKED_IN",
          checkIn: { lt: endOfBusiness },
          checkOut: { gt: startOfBusiness },
        },
        include: {
          room: { select: { number: true } },
        },
      });

      let totalRoomCharges = 0;
      let totalTaxPosted = 0;
      const taxRate = 0.12;

      for (const stay of activeStays) {
        // Find or create folio
        let folio = await tx.folio.findUnique({ where: { reservationId: stay.id } });
        if (!folio) {
          folio = await tx.folio.create({
            data: { reservationId: stay.id, status: "OPEN" },
          });
        }

        // Calculate single night charge
        const nights = calculateNights(new Date(stay.checkIn), new Date(stay.checkOut));
        const dailyPrice = stay.totalPrice / nights;
        const amount = parseFloat(dailyPrice.toFixed(2));
        const taxAmount = parseFloat((amount * taxRate).toFixed(2));

        // Check for duplicate rate postings on the same business date
        const existingCharge = await tx.folioCharge.findFirst({
          where: {
            folioId: folio.id,
            type: "ROOM_RATE",
            description: { contains: dateStr },
          },
        });

        if (!existingCharge) {
          await tx.folioCharge.create({
            data: {
              folioId: folio.id,
              type: "ROOM_RATE",
              amount,
              taxAmount,
              description: `Room Charge - Night of ${dateStr} (Room ${stay.room.number})`,
            },
          });

          totalRoomCharges += amount;
          totalTaxPosted += taxAmount;
        }
      }

      // 4. Sum Revenue Collected (Any payment on the business date)
      const payments = await tx.folioPayment.findMany({
        where: {
          folio: { reservation: { propertyId } },
          createdAt: { gte: startOfBusiness, lte: endOfBusiness },
        },
      });

      const totalRevenue = payments.reduce((sum, p) => {
        return sum + (p.type === "REFUND" ? -p.amount : p.amount);
      }, 0);

      // 5. Sum Expenses on the business date
      const expenses = await tx.expense.findMany({
        where: {
          propertyId,
          date: { gte: startOfBusiness, lte: endOfBusiness },
        },
      });

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      // 6. Roll Business Date Forward by 1 day
      const nextDate = new Date(businessDate);
      nextDate.setDate(businessDate.getDate() + 1);

      await tx.property.update({
        where: { id: propertyId },
        data: { businessDate: nextDate },
      });

      // 7. Write NightAuditLog
      const auditLog = await tx.nightAuditLog.create({
        data: {
          propertyId,
          auditDate: businessDate,
          rolledToDate: nextDate,
          totalRoomCharges,
          totalTaxPosted,
          totalRevenue,
          totalExpenses,
          noShowsProcessed: noShows.length,
          performedBy,
        },
      });

      return auditLog;
    });

    return { success: true, auditLog: result };
  } catch (error: any) {
    console.error("Prisma error in runNightAuditAction:", error);
    throw new Error(error.message || "Failed to execute night audit close.");
  }
}

export async function getAuditLogsAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const logs = await db.nightAuditLog.findMany({
      where: { propertyId },
      orderBy: { auditDate: "desc" },
    });

    return { success: true, logs };
  } catch (error: any) {
    console.error("Prisma error in getAuditLogsAction:", error);
    throw new Error(error.message || "Failed to fetch audit logs history.");
  }
}

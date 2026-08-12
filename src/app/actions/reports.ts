"use server";

import { db } from "@/lib/db";

interface ExpenseInput {
  propertyId: string;
  amount: number;
  category: string;
  description: string;
  date: string | Date;
}

/**
 * Computes business intelligence reports and analytics metrics for a property.
 */
export async function getAnalyticsReportAction(
  propertyId: string,
  startDateStr: string,
  endDateStr: string
) {
  if (!propertyId || !startDateStr || !endDateStr) {
    throw new Error("Property ID, Start Date, and End Date are required.");
  }

  try {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      throw new Error("Start Date must be on or before End Date.");
    }

    // Number of days in the period (inclusive)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysInPeriod = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // 1. Fetch all rooms to count total inventory
    const totalRooms = await db.room.count({ where: { propertyId } });
    const totalPossibleRoomNights = totalRooms * daysInPeriod;

    // 2. Fetch reservations overlapping this period to compute occupied room-nights
    const reservations = await db.reservation.findMany({
      where: {
        propertyId,
        status: { not: "CANCELLED" },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
    });

    let occupiedNights = 0;
    let totalStayNightsForALOS = 0;
    let totalStaysForALOS = 0;

    reservations.forEach((res) => {
      // Stay duration
      const resIn = new Date(res.checkIn);
      const resOut = new Date(res.checkOut);

      // Overlap with period
      const overlapStart = resIn > start ? resIn : start;
      const overlapEnd = resOut < end ? resOut : end;
      
      const overlapTime = overlapEnd.getTime() - overlapStart.getTime();
      const nights = Math.max(0, Math.ceil(overlapTime / (1000 * 60 * 60 * 24)));
      occupiedNights += nights;

      // For ALOS (Average Length of Stay)
      const stayTime = resOut.getTime() - resIn.getTime();
      const stayNights = Math.max(1, Math.ceil(stayTime / (1000 * 60 * 60 * 24)));
      totalStayNightsForALOS += stayNights;
      totalStaysForALOS += 1;
    });

    const occupancyRate = totalPossibleRoomNights > 0 
      ? Math.min(100, Math.round((occupiedNights / totalPossibleRoomNights) * 100)) 
      : 0;

    const alos = totalStaysForALOS > 0 
      ? Math.round((totalStayNightsForALOS / totalStaysForALOS) * 10) / 10 
      : 0;

    // 3. Fetch all Folio Charges posted during the period
    const charges = await db.folioCharge.findMany({
      where: {
        folio: { reservation: { propertyId } },
        createdAt: { gte: start, lte: end },
      },
      select: {
        type: true,
        amount: true,
        taxAmount: true,
      },
    });

    let roomRevenue = 0;
    let taxBilled = 0;
    let totalChargesBilled = 0;

    const chargeBreakdown: Record<string, number> = {
      ROOM_RATE: 0,
      TAX: 0,
      ROOM_SERVICE: 0,
      RESTAURANT: 0,
      SPA: 0,
      OTHER: 0,
    };

    charges.forEach((c) => {
      totalChargesBilled += c.amount;
      taxBilled += c.taxAmount;
      
      if (c.type === "ROOM_RATE") {
        roomRevenue += c.amount;
      }
      
      if (c.type in chargeBreakdown) {
        chargeBreakdown[c.type] += c.amount;
      } else {
        chargeBreakdown["OTHER"] += c.amount;
      }
    });

    // Compute ADR and RevPAR
    const adr = occupiedNights > 0 ? roomRevenue / occupiedNights : 0;
    const revpar = totalPossibleRoomNights > 0 ? roomRevenue / totalPossibleRoomNights : 0;

    // 4. Fetch all Folio Payments during the period
    const payments = await db.folioPayment.findMany({
      where: {
        folio: { reservation: { propertyId } },
        createdAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
        type: true,
      },
    });

    let totalCollected = 0;
    let totalRefunded = 0;

    payments.forEach((p) => {
      if (p.type === "PAYMENT") {
        totalCollected += p.amount;
      } else if (p.type === "REFUND") {
        totalRefunded += p.amount;
      }
    });

    const netRevenue = totalCollected - totalRefunded;

    // 5. Fetch all Expenses during the period
    const expenses = await db.expense.findMany({
      where: {
        propertyId,
        date: { gte: start, lte: end },
      },
    });

    let totalExpenses = 0;
    const expenseBreakdown: Record<string, number> = {
      UTILITIES: 0,
      SALARIES: 0,
      MAINTENANCE: 0,
      LAUNDRY: 0,
      OTHER: 0,
    };

    expenses.forEach((e) => {
      totalExpenses += e.amount;
      if (e.category in expenseBreakdown) {
        expenseBreakdown[e.category] += e.amount;
      } else {
        expenseBreakdown["OTHER"] += e.amount;
      }
    });

    const netProfit = netRevenue - totalExpenses;

    // 6. Generate day-by-day occupancy data for trends (maximum 31 days to prevent UI overload)
    const dailyOccupancyTrends = [];
    const maxDaysTrend = Math.min(31, daysInPeriod);

    for (let i = 0; i < maxDaysTrend; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      // Count overlapping reservations for this specific day
      const dayReservationsCount = reservations.filter((res) => {
        const resIn = new Date(res.checkIn);
        const resOut = new Date(res.checkOut);
        return resIn < dayEnd && resOut > dayStart;
      }).length;

      const dayRate = totalRooms > 0 
        ? Math.min(100, Math.round((dayReservationsCount / totalRooms) * 100)) 
        : 0;

      dailyOccupancyTrends.push({
        dateLabel: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        occupancy: dayRate,
        roomsOccupied: dayReservationsCount,
      });
    }

    // 7. Get transactions log (merged charges and payments)
    const chargeTransactions = charges.map((c) => ({
      date: start, // fallback
      type: "CHARGE",
      category: c.type,
      description: `Billed Charge: ${c.type}`,
      amount: c.amount,
    }));

    const paymentTransactions = payments.map((p) => ({
      date: start, // fallback
      type: p.type, // PAYMENT, REFUND
      category: "CASH_TRANSACTION",
      description: `${p.type === "PAYMENT" ? "Settled Payment" : "Folio Refund"}`,
      amount: p.type === "PAYMENT" ? -p.amount : p.amount, // payment decreases outstanding, refund increases
    }));

    return {
      success: true,
      summary: {
        occupancyRate,
        adr,
        revpar,
        alos,
        netRevenue,
        totalExpenses,
        netProfit,
        taxBilled,
        totalChargesBilled,
        occupiedNights,
        totalPossibleRoomNights,
      },
      chargeBreakdown,
      expenseBreakdown,
      dailyOccupancyTrends,
    };
  } catch (error: any) {
    console.error("Prisma error in getAnalyticsReportAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      return {
        success: false,
        summary: {
          occupancyRate: 0, adr: 0, revpar: 0, alos: 0, netRevenue: 0, totalExpenses: 0, netProfit: 0, taxBilled: 0, totalChargesBilled: 0, occupiedNights: 0, totalPossibleRoomNights: 0
        },
        chargeBreakdown: {},
        expenseBreakdown: {},
        dailyOccupancyTrends: [],
      };
    }
    
    throw new Error(error.message || "Failed to compile analytics report.");
  }
}

/**
 * Logs a new property expense item.
 */
export async function createExpenseAction(data: ExpenseInput) {
  if (!data.propertyId || !data.amount || !data.category) {
    throw new Error("Property ID, Amount, and Category are required.");
  }

  try {
    const expense = await db.expense.create({
      data: {
        propertyId: data.propertyId,
        amount: Number(data.amount),
        category: data.category,
        description: data.description?.trim() || "",
        date: new Date(data.date),
      },
    });
    return { success: true, expense };
  } catch (error: any) {
    console.error("Prisma error in createExpenseAction:", error);
    throw new Error(error.message || "Failed to log property expense.");
  }
}

/**
 * Fetches all expenses for a property.
 */
export async function getExpensesAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const expenses = await db.expense.findMany({
      where: { propertyId },
      orderBy: { date: "desc" },
    });
    return { success: true, expenses };
  } catch (error: any) {
    console.error("Prisma error in getExpensesAction:", error);
    throw new Error(error.message || "Failed to fetch property expenses.");
  }
}

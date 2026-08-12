"use server";

import { db } from "@/lib/db";

interface RatePlanInput {
  propertyId: string;
  name: string;
  code: string;
  modifierType: string; // PERCENTAGE, FIXED
  modifierValue: number;
}

interface SeasonInput {
  propertyId: string;
  name: string;
  startDate: string;
  endDate: string;
  modifierType: string; // PERCENTAGE, FIXED
  modifierValue: number;
}

export async function createRatePlanAction(data: RatePlanInput) {
  if (!data.propertyId || !data.name || !data.code || !data.modifierType) {
    throw new Error("Missing required rate plan fields.");
  }

  try {
    const ratePlan = await db.ratePlan.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        modifierType: data.modifierType,
        modifierValue: Number(data.modifierValue),
      },
    });

    return { success: true, ratePlan };
  } catch (error: any) {
    console.error("Prisma error in createRatePlanAction:", error);
    throw new Error(error.message || "Failed to create rate plan.");
  }
}

export async function getRatePlansAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const ratePlans = await db.ratePlan.findMany({
      where: { propertyId, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, ratePlans };
  } catch (error: any) {
    console.error("Prisma error in getRatePlansAction:", error);
    throw new Error(error.message || "Failed to fetch rate plans.");
  }
}

export async function createSeasonAction(data: SeasonInput) {
  if (!data.propertyId || !data.name || !data.startDate || !data.endDate || !data.modifierType) {
    throw new Error("Missing required season fields.");
  }

  try {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      throw new Error("End date cannot be before start date.");
    }

    const season = await db.season.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        startDate: start,
        endDate: end,
        modifierType: data.modifierType,
        modifierValue: Number(data.modifierValue),
      },
    });

    return { success: true, season };
  } catch (error: any) {
    console.error("Prisma error in createSeasonAction:", error);
    throw new Error(error.message || "Failed to create season.");
  }
}

export async function getSeasonsAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const seasons = await db.season.findMany({
      where: { propertyId, isActive: true },
      orderBy: { startDate: "asc" },
    });

    return { success: true, seasons };
  } catch (error: any) {
    console.error("Prisma error in getSeasonsAction:", error);
    throw new Error(error.message || "Failed to fetch seasons.");
  }
}

/**
 * Calculates day-by-day room pricing, applying seasonal adjustments, rate plan modifiers, and corporate discounts.
 */
export async function calculateStayPriceAction(
  propertyId: string,
  roomTypeId: string,
  ratePlanId: string | null,
  checkInStr: string,
  checkOutStr: string,
  companyId?: string | null
) {
  if (!propertyId || !roomTypeId || !checkInStr || !checkOutStr) {
    throw new Error("Missing pricing calculation parameters.");
  }

  try {
    // 1. Fetch Room Type Base Price
    const roomType = await db.roomType.findUnique({
      where: { id: roomTypeId },
    });

    if (!roomType) {
      throw new Error("Room type not found.");
    }

    // 2. Fetch Rate Plan if selected
    let ratePlan: any = null;
    if (ratePlanId) {
      ratePlan = await db.ratePlan.findUnique({
        where: { id: ratePlanId },
      });
    }

    // 3. Fetch Seasons
    const seasons = await db.season.findMany({
      where: { propertyId, isActive: true },
    });

    // 4. Fetch Corporate Account Discount
    let corporateDiscountPercent = 0;
    if (companyId) {
      const company = await db.company.findUnique({
        where: { id: companyId },
      });
      if (company) {
        corporateDiscountPercent = company.discountPercent;
      }
    }

    // 5. Calculate Nights
    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    let totalPrice = 0;
    const dailyBreakdown = [];

    // Loop over each night stay
    for (let i = 0; i < nights; i++) {
      const nightDate = new Date(checkIn);
      nightDate.setDate(checkIn.getDate() + i);
      nightDate.setHours(12, 0, 0, 0); // Midday normalization

      const dateStr = nightDate.toISOString().split("T")[0];
      const basePrice = roomType.basePrice;

      // Find matching Season (if any)
      const matchingSeason = seasons.find((s) => {
        const sStart = new Date(s.startDate);
        sStart.setHours(0, 0, 0, 0);
        const sEnd = new Date(s.endDate);
        sEnd.setHours(23, 59, 59, 999);
        return nightDate >= sStart && nightDate <= sEnd;
      });

      let seasonalBase = basePrice;
      let seasonAdjustment = 0;
      let seasonName = "";

      if (matchingSeason) {
        seasonName = matchingSeason.name;
        if (matchingSeason.modifierType === "PERCENTAGE") {
          seasonAdjustment = basePrice * (matchingSeason.modifierValue / 100);
        } else {
          seasonAdjustment = matchingSeason.modifierValue;
        }
        seasonalBase += seasonAdjustment;
      }

      let finalDailyPrice = seasonalBase;
      let rateAdjustment = 0;
      let rateName = "Rack Rate";

      if (ratePlan) {
        rateName = ratePlan.name;
        if (ratePlan.modifierType === "PERCENTAGE") {
          rateAdjustment = seasonalBase * (ratePlan.modifierValue / 100);
        } else {
          rateAdjustment = ratePlan.modifierValue;
        }
        finalDailyPrice += rateAdjustment;
      }

      // Safeguard price never negative
      finalDailyPrice = Math.max(0, finalDailyPrice);
      totalPrice += finalDailyPrice;

      dailyBreakdown.push({
        date: dateStr,
        basePrice: parseFloat(basePrice.toFixed(2)),
        seasonName,
        seasonAdjustment: parseFloat(seasonAdjustment.toFixed(2)),
        rateName,
        rateAdjustment: parseFloat(rateAdjustment.toFixed(2)),
        finalPrice: parseFloat(finalDailyPrice.toFixed(2)),
      });
    }

    const corporateDiscountAmount = parseFloat((totalPrice * (corporateDiscountPercent / 100)).toFixed(2));
    totalPrice = Math.max(0, totalPrice - corporateDiscountAmount);

    const taxRate = 0.12; // 12% GST standard
    const taxAmount = parseFloat((totalPrice * taxRate).toFixed(2));

    return {
      success: true,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      taxAmount,
      corporateDiscountAmount,
      nights,
      dailyBreakdown,
    };
  } catch (error: any) {
    console.error("Prisma error in calculateStayPriceAction:", error);
    throw new Error(error.message || "Failed to calculate pricing breakdown.");
  }
}

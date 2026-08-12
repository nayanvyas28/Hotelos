"use server";

import { db } from "@/lib/db";
import { randomUUID } from "crypto";

interface ShiftInput {
  propertyId: string;
  userId: string;
  roleName: string;
  startTime: string;
  endTime: string;
}

interface WebhookInput {
  propertyId: string;
  targetUrl: string;
  eventTypes: string; // e.g. "guest.checkin,reservation.create"
}

interface ApiKeyInput {
  propertyId: string;
  name: string;
}

/**
 * Staff & Shift Scheduling
 */
export async function getStaffMembersAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { organizationId: true },
    });

    if (!property) {
      throw new Error("Property not found.");
    }

    const staff = await db.user.findMany({
      where: { organizationId: property.organizationId },
      include: {
        userRoles: { include: { role: true } },
      },
      orderBy: { email: "asc" },
    });

    return { success: true, staff };
  } catch (error: any) {
    console.error("Prisma error in getStaffMembersAction:", error);
    throw new Error(error.message || "Failed to fetch staff members roster.");
  }
}

export async function createShiftAction(data: ShiftInput) {
  if (!data.propertyId || !data.userId || !data.roleName || !data.startTime || !data.endTime) {
    throw new Error("Missing required shift parameters.");
  }

  try {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end < start) {
      throw new Error("Shift end time must be after start time.");
    }

    const shift = await db.shift.create({
      data: {
        propertyId: data.propertyId,
        userId: data.userId,
        roleName: data.roleName,
        startTime: start,
        endTime: end,
      },
    });

    return { success: true, shift };
  } catch (error: any) {
    console.error("Prisma error in createShiftAction:", error);
    throw new Error(error.message || "Failed to schedule employee shift.");
  }
}

export async function getShiftsAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const shifts = await db.shift.findMany({
      where: { propertyId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return { success: true, shifts };
  } catch (error: any) {
    console.error("Prisma error in getShiftsAction:", error);
    throw new Error(error.message || "Failed to fetch scheduled shifts.");
  }
}

/**
 * Activity Audit Logging
 */
export async function logActivityAction(
  propertyId: string,
  action: string,
  details: string,
  performedBy: string
) {
  if (!propertyId || !action || !performedBy) return;

  try {
    await db.auditLog.create({
      data: {
        propertyId,
        action,
        details,
        performedBy,
      },
    });
  } catch (error) {
    console.error("Failed to write to system audit log:", error);
  }
}

export async function getSystemAuditLogsAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const logs = await db.auditLog.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
      take: 200, // Limit historical retrieve
    });

    return { success: true, logs };
  } catch (error: any) {
    console.error("Prisma error in getSystemAuditLogsAction:", error);
    throw new Error(error.message || "Failed to fetch system audit logs.");
  }
}

/**
 * Webhooks & Developers API keys
 */
export async function createWebhookSubscriptionAction(data: WebhookInput) {
  if (!data.propertyId || !data.targetUrl || !data.eventTypes) {
    throw new Error("Missing required webhook parameters.");
  }

  try {
    const webhook = await db.webhookSubscription.create({
      data: {
        propertyId: data.propertyId,
        targetUrl: data.targetUrl.trim(),
        eventTypes: data.eventTypes.trim(),
      },
    });

    return { success: true, webhook };
  } catch (error: any) {
    console.error("Prisma error in createWebhookSubscriptionAction:", error);
    throw new Error(error.message || "Failed to register webhook subscriber.");
  }
}

export async function getWebhookSubscriptionsAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const webhooks = await db.webhookSubscription.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, webhooks };
  } catch (error: any) {
    console.error("Prisma error in getWebhookSubscriptionsAction:", error);
    throw new Error(error.message || "Failed to fetch webhook subscriptions.");
  }
}

export async function createApiKeyAction(data: ApiKeyInput) {
  if (!data.propertyId || !data.name) {
    throw new Error("Property ID and API Key identifier name are required.");
  }

  try {
    const keyToken = `hos_live_${randomUUID().replace(/-/g, "")}`;

    const apiKey = await db.apiKey.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        token: keyToken, // Store key token
      },
    });

    return { success: true, apiKey };
  } catch (error: any) {
    console.error("Prisma error in createApiKeyAction:", error);
    throw new Error(error.message || "Failed to generate REST API Key.");
  }
}

export async function getApiKeysAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const apiKeys = await db.apiKey.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, apiKeys };
  } catch (error: any) {
    console.error("Prisma error in getApiKeysAction:", error);
    throw new Error(error.message || "Failed to fetch API key registers.");
  }
}

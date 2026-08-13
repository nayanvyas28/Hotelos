"use server";

import { db } from "@/lib/db";

/**
 * Logs a Break-Glass emergency support simulation event in the audit trail.
 */
export async function logSaaSSupportSessionStartAction(
  propertyId: string,
  reason: string,
  durationMins: number
) {
  if (!propertyId || !reason) {
    return { success: false, error: "Property ID and access reason are required." };
  }

  try {
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { name: true },
    });

    await db.auditLog.create({
      data: {
        action: "SUPPORT_ACCESS_START",
        details: `JIT Support session simulated for hotel: "${property?.name || propertyId}". Reason: "${reason}". Session duration allocated: ${durationMins} minutes.`,
        performedBy: "SaaS Owner (Break-glass support role)",
        propertyId,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves all active announcements.
 */
export async function getSaaSAnnouncementsAction() {
  try {
    const announcements = await db.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: { name: true },
        },
      },
    });
    return { success: true, announcements };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Publishes a new broadcast announcement.
 */
export async function createSaaSAnnouncementAction(
  title: string,
  content: string,
  level: string,
  propertyId?: string | null
) {
  if (!title || !content) {
    return { success: false, error: "Title and message content are required." };
  }

  try {
    const newAnnouncement = await db.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        level,
        propertyId: propertyId || null,
      },
    });
    return { success: true, announcement: newAnnouncement };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Deletes/Archives a broadcast announcement.
 */
export async function deleteSaaSAnnouncementAction(id: string) {
  if (!id) {
    return { success: false, error: "Announcement ID is required." };
  }

  try {
    await db.announcement.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

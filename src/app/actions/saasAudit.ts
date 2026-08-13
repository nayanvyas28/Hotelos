"use server";

import { db } from "@/lib/db";

/**
 * Fetches all administrative audit logs across all property instances.
 */
export async function getSaaSAuditLogsAction(
  searchQuery?: string,
  actionType?: string
) {
  try {
    const logs = await db.auditLog.findMany({
      where: {
        AND: [
          actionType ? { action: actionType } : {},
          searchQuery
            ? {
                OR: [
                  { performedBy: { contains: searchQuery, mode: "insensitive" } },
                  { details: { contains: searchQuery, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        property: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, logs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

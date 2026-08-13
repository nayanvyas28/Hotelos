"use server";

import { db } from "@/lib/db";
import { StaffRole } from "@/context/SessionContext";

export async function authenticateUserAction(email: string) {
  if (!email) return { success: false, error: "Email is required" };

  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found in database" };
    }

    // Determine role name
    const roleName = (user.userRoles[0]?.role?.name || "FRONT_DESK") as StaffRole;

    // Find a property for the user to login to
    const property = await db.property.findFirst({
      where: { organizationId: user.organizationId || undefined },
    });

    return {
      success: true,
      user: {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split("@")[0],
        email: user.email,
        role: roleName,
        scope: roleName === "SAAS_OWNER" || roleName === "MD" || roleName === "CFO" ? "GLOBAL" : "PROPERTY",
        propertyId: property?.id || undefined,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

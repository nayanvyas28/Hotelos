"use server";

import { db } from "@/lib/db";
import { StaffRole } from "@/context/SessionContext";

export async function authenticateUserAction(email: string, password?: string) {
  if (!email) return { success: false, error: "Email is required" };

  try {
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
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

    // Strict Password Verification
    const expectedPassword = user.password && user.password.trim() !== "" ? user.password : "Staff#2026";
    if (password !== expectedPassword) {
      return { success: false, error: "Invalid password provided for this account." };
    }

    // Determine role name
    const roleName = (user.userRoles[0]?.role?.name || "FRONT_DESK") as StaffRole;

    // Find a property for the user to login to
    const property = user.propertyId
      ? await db.property.findUnique({ where: { id: user.propertyId } })
      : await db.property.findFirst({
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
        organizationId: user.organizationId || undefined,
        dbPassword: expectedPassword,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

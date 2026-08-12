"use server";

import { db } from "@/lib/db";

export async function createOrganizationAction(name: string) {
  if (!name || name.trim() === "") {
    throw new Error("Organization name is required");
  }

  try {
    const org = await db.organization.create({
      data: {
        name: name.trim(),
      },
    });
    return { success: true, organization: org };
  } catch (error: any) {
    console.error("Prisma error in createOrganizationAction:", error);
    
    // Check for common connection errors
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database") ||
      errorStr.includes("database system is starting up")
    ) {
      throw new Error(
        "Database connection failed. Please ensure you have replaced the '[password]' placeholder with your actual Supabase database password in the .env file."
      );
    }
    
    throw new Error(error.message || "Failed to create organization.");
  }
}

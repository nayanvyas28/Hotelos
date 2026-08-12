"use server";

import { db } from "@/lib/db";

export async function getSaaSOverviewAction() {
  try {
    const properties = await db.property.findMany({
      include: { organization: true },
    });

    const organizations = await db.organization.findMany();

    // Mock SaaS stats
    const stats = {
      mrr: 45000, // Monthly Recurring Revenue in USD
      churnRate: "1.2%",
      apiLoad: "99.98% uptime",
      totalLicenses: properties.length + 5,
    };

    return {
      success: true,
      properties,
      organizations,
      stats,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSaaSPropertyAction(
  orgName: string,
  propertyName: string,
  address: string
) {
  try {
    // 1. Find or create Organization
    let org = await db.organization.findFirst({
      where: { name: orgName },
    });

    if (!org) {
      org = await db.organization.create({
        data: { name: orgName },
      });
    }

    // 2. Create Property
    const prop = await db.property.create({
      data: {
        name: propertyName,
        address,
        organizationId: org.id,
      },
    });

    return { success: true, property: prop };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

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

    // 3. Auto-generate default roles if missing in DB
    const roles = ["MD", "GM", "FRONT_DESK"];
    const roleIdMap: Record<string, string> = {};

    for (const roleName of roles) {
      let roleRecord = await db.role.findUnique({
        where: { name: roleName },
      });
      if (!roleRecord) {
        roleRecord = await db.role.create({
          data: {
            name: roleName,
            description: `${roleName} default system role`,
          },
        });
      }
      roleIdMap[roleName] = roleRecord.id;
    }

    // 4. Auto-generate default user credentials for this client group
    const sanitizedOrg = orgName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const sanitizedProp = propertyName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const defaultUsers = [
      {
        email: `md.${sanitizedOrg}@hotelos.com`,
        firstName: "Managing",
        lastName: "Director",
        role: "MD",
      },
      {
        email: `gm.${sanitizedProp}@hotelos.com`,
        firstName: "General",
        lastName: "Manager",
        role: "GM",
      },
      {
        email: `fd.${sanitizedProp}@hotelos.com`,
        firstName: "Front",
        lastName: "Desk",
        role: "FRONT_DESK",
      },
    ];

    for (const u of defaultUsers) {
      const emailLower = u.email.toLowerCase();
      let userRecord = await db.user.findUnique({
        where: { email: emailLower },
      });

      if (!userRecord) {
        userRecord = await db.user.create({
          data: {
            email: emailLower,
            firstName: u.firstName,
            lastName: u.lastName,
            organizationId: org.id,
          },
        });

        // Link user to role
        await db.userRole.create({
          data: {
            userId: userRecord.id,
            roleId: roleIdMap[u.role],
          },
        });
      }
    }

    // 5. Add audit log record
    await db.auditLog.create({
      data: {
        propertyId: prop.id,
        action: "PROVISION_PROPERTY",
        performedBy: "owner@hotelos.com",
        details: `Successfully provisioned hotel property ${propertyName} under organization ${orgName} and auto-created default staff roles.`,
      },
    });

    return { success: true, property: prop };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSaaSPropertyAction(
  propertyId: string,
  data: {
    name?: string;
    address?: string;
    currency?: string;
    timezone?: string;
    organizationId?: string;
    groqApiKey?: string;
    planString?: string;
    activeModulesString?: string;
    uiConfigString?: string;
    deploymentMode?: string;
    appVersion?: string;
    featureFlagsString?: string;
  }
) {
  try {
    const updated = await db.property.update({
      where: { id: propertyId },
      data,
    });
    return { success: true, property: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSaaSPropertyAction(propertyId: string) {
  try {
    await db.property.delete({
      where: { id: propertyId },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSaaSOrganizationAction(name: string) {
  try {
    const org = await db.organization.create({
      data: { name },
    });
    return { success: true, organization: org };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSaaSOrganizationAction(
  organizationId: string,
  name: string
) {
  try {
    const updated = await db.organization.update({
      where: { id: organizationId },
      data: { name },
    });
    return { success: true, organization: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSaaSOrganizationAction(organizationId: string) {
  try {
    await db.organization.delete({
      where: { id: organizationId },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

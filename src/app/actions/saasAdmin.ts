"use server";

import { db } from "@/lib/db";

export async function getSaaSOverviewAction() {
  try {
    const properties = await db.property.findMany({
      include: { 
        organization: {
          include: {
            users: {
              include: {
                userRoles: {
                  include: { role: true }
                }
              }
            }
          }
        } 
      },
    });

    const organizations = await db.organization.findMany({
      include: {
        users: {
          include: {
            userRoles: {
              include: { role: true }
            }
          }
        }
      }
    });

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
  address: string,
  ownerEmail: string
) {
  if (!ownerEmail || !ownerEmail.includes("@")) {
    return { success: false, error: "A valid corporate administrator email is required." };
  }

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

    // 3. Find or create MD Role record
    let mdRole = await db.role.findUnique({
      where: { name: "MD" },
    });
    if (!mdRole) {
      mdRole = await db.role.create({
        data: {
          name: "MD",
          description: "Managing Director (Organization Owner)",
        },
      });
    }

    // 4. Provision single master organization owner (MD)
    const emailLower = ownerEmail.trim().toLowerCase();
    let userRecord = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (!userRecord) {
      userRecord = await db.user.create({
        data: {
          email: emailLower,
          firstName: "Organization",
          lastName: "Administrator",
          organizationId: org.id,
        },
      });

      // Link user to MD role
      await db.userRole.create({
        data: {
          userId: userRecord.id,
          roleId: mdRole.id,
        },
      });
    }

    // 5. Add audit log record
    await db.auditLog.create({
      data: {
        propertyId: prop.id,
        action: "PROVISION_PROPERTY",
        performedBy: "owner@hotelos.com",
        details: `Successfully provisioned hotel property ${propertyName} under organization ${orgName} with master admin account ${emailLower}.`,
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

export async function createSaaSOrganizationAction(
  name: string,
  ownerEmail?: string,
  maxProperties?: number,
  password?: string,
  dbUrl?: string,
  customDomain?: string
) {
  if (!name || name.trim() === "") {
    return { success: false, error: "Organization name is required." };
  }

  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const targetEmail = ownerEmail && ownerEmail.includes("@")
    ? ownerEmail.trim().toLowerCase()
    : `admin.${sanitizedName}@hotelos.com`;

  try {
    // 1. Find or create MD Role record
    let mdRole = await db.role.findUnique({
      where: { name: "MD" },
    });
    if (!mdRole) {
      mdRole = await db.role.create({
        data: {
          name: "MD",
          description: "Managing Director (Organization Owner)",
        },
      });
    }

    // 2. Create Organization
    const org = await db.organization.create({
      data: {
        name: name.trim(),
        maxProperties: Number(maxProperties || 3),
        dbUrl: dbUrl || "",
        customDomain: customDomain || "",
      },
    });

    // 3. Create MD User Account
    const emailLower = targetEmail;
    const userRecord = await db.user.create({
      data: {
        email: emailLower,
        password: password || "",
        firstName: "Organization",
        lastName: "Administrator",
        organizationId: org.id,
      },
    });

    // Link MD User to Role
    await db.userRole.create({
      data: {
        userId: userRecord.id,
        roleId: mdRole.id,
      },
    });

    return { success: true, organization: org };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSaaSOrganizationLimitsAction(
  organizationId: string,
  maxProperties: number,
  dbUrl?: string,
  customDomain?: string
) {
  if (!organizationId) {
    return { success: false, error: "Organization ID is required." };
  }

  try {
    const updated = await db.organization.update({
      where: { id: organizationId },
      data: {
        maxProperties: Number(maxProperties),
        dbUrl: dbUrl ?? undefined,
        customDomain: customDomain ?? undefined,
      },
    });

    return { success: true, organization: updated };
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

/**
 * Fetches the MD User (Organization Owner) email and password for a selected property.
 */
export async function getSaaSPropertyOwnerAction(propertyId: string) {
  if (!propertyId) return { success: false, error: "Property ID is required." };

  try {
    const prop = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        organization: {
          include: {
            users: {
              where: {
                userRoles: {
                  some: {
                    role: { name: "MD" },
                  },
                },
              },
            },
          },
        },
      },
    });

    const mdUser = prop?.organization?.users[0];
    return {
      success: true,
      ownerEmail: mdUser?.email || "",
      ownerPassword: mdUser?.password || "",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Updates or creates the MD User (Organization Owner) email and password credentials.
 */
export async function updateSaaSPropertyOwnerAction(
  propertyId: string,
  email: string,
  password?: string
) {
  if (!propertyId || !email) {
    return { success: false, error: "Property ID and Owner Email are required." };
  }

  try {
    const prop = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!prop) return { success: false, error: "Property not found." };

    // Find MD Role
    let mdRole = await db.role.findUnique({
      where: { name: "MD" },
    });
    if (!mdRole) {
      mdRole = await db.role.create({
        data: {
          name: "MD",
          description: "Managing Director (Organization Owner)",
        },
      });
    }

    const emailLower = email.trim().toLowerCase();

    // Look for existing MD user in this organization
    const existingMd = await db.user.findFirst({
      where: {
        organizationId: prop.organizationId,
        userRoles: {
          some: {
            role: { name: "MD" },
          },
        },
      },
    });

    if (existingMd) {
      // Update existing MD email and password
      await db.user.update({
        where: { id: existingMd.id },
        data: {
          email: emailLower,
          password: password || "",
        },
      });
    } else {
      // Create new MD user in this organization
      const newUser = await db.user.create({
        data: {
          email: emailLower,
          password: password || "",
          firstName: "Organization",
          lastName: "Administrator",
          organizationId: prop.organizationId,
        },
      });

      // Link User to MD Role
      await db.userRole.create({
        data: {
          userId: newUser.id,
          roleId: mdRole.id,
        },
      });
    }

    // Add audit log record
    await db.auditLog.create({
      data: {
        propertyId,
        action: "LICENSE_CHANGE",
        performedBy: "owner@hotelos.com",
        details: `Updated tenant organization owner credentials to email: ${emailLower}.`,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSaaSOrgOwnerAction(orgId: string) {
  if (!orgId) return { success: false, error: "Organization ID is required." };

  try {
    const org = await db.organization.findUnique({
      where: { id: orgId },
      include: {
        users: {
          where: {
            userRoles: {
              some: {
                role: { name: "MD" },
              },
            },
          },
        },
      },
    });

    const mdUser = org?.users[0];
    return {
      success: true,
      ownerEmail: mdUser?.email || "",
      ownerPassword: mdUser?.password || "",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSaaSOrgOwnerAction(
  orgId: string,
  email: string,
  password?: string
) {
  if (!orgId || !email) {
    return { success: false, error: "Organization ID and Owner Email are required." };
  }

  try {
    // Find MD Role
    let mdRole = await db.role.findUnique({
      where: { name: "MD" },
    });
    if (!mdRole) {
      mdRole = await db.role.create({
        data: {
          name: "MD",
          description: "Managing Director (Organization Owner)",
        },
      });
    }

    const emailLower = email.trim().toLowerCase();

    // Look for existing MD user in this organization
    const existingMd = await db.user.findFirst({
      where: {
        organizationId: orgId,
        userRoles: {
          some: {
            role: { name: "MD" },
          },
        },
      },
    });

    if (existingMd) {
      const updated = await db.user.update({
        where: { id: existingMd.id },
        data: {
          email: emailLower,
          password: password ?? existingMd.password,
        },
      });
      return { success: true, user: updated };
    } else {
      // Create new MD user for this organization
      const newUser = await db.user.create({
        data: {
          email: emailLower,
          password: password || "",
          firstName: "Organization",
          lastName: "Administrator",
          organizationId: orgId,
        },
      });

      await db.userRole.create({
        data: {
          userId: newUser.id,
          roleId: mdRole.id,
        },
      });

      return { success: true, user: newUser };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSaaSOrganizationLicensesAction(
  orgId: string,
  data: {
    planString?: string;
    deploymentMode?: string;
    activeModulesString?: string;
  }
) {
  if (!orgId) return { success: false, error: "Organization ID is required." };

  try {
    // Update all properties belonging to this organization
    await db.property.updateMany({
      where: { organizationId: orgId },
      data,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSaaSOrganizationUiConfigAction(
  orgId: string,
  uiConfigString: string
) {
  if (!orgId) return { success: false, error: "Organization ID is required." };

  try {
    await db.property.updateMany({
      where: { organizationId: orgId },
      data: { uiConfigString },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function upgradeSaaSOrganizationVersionAction(
  orgId: string,
  targetVersion: string
) {
  if (!orgId) return { success: false, error: "Organization ID is required." };

  try {
    await db.property.updateMany({
      where: { organizationId: orgId },
      data: { appVersion: targetVersion },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

"use server";

import { db } from "@/lib/db";

interface SetupPropertyInput {
  name: string;
  currency: string;
  timezone: string;
  organizationId: string;
  address?: string;
}

export async function setupPropertyAction(data: SetupPropertyInput) {
  if (!data.name || data.name.trim() === "") {
    throw new Error("Property name is required");
  }
  if (!data.organizationId) {
    throw new Error("Organization ID is required");
  }

  try {
    const property = await db.property.create({
      data: {
        name: data.name.trim(),
        currency: data.currency || "INR",
        timezone: data.timezone || "Asia/Kolkata",
        address: data.address?.trim() || "",
        organizationId: data.organizationId,
      },
    });
    return { success: true, property };
  } catch (error: any) {
    console.error("Prisma error in setupPropertyAction:", error);
    
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
    
    throw new Error(error.message || "Failed to setup property.");
  }
}

interface RoomTypeInput {
  name: string;
  code: string;
  description?: string;
  capacity: number;
  beds: number;
  basePrice: number;
}

interface RoomInput {
  number: string;
  floorNumber: number;
  roomTypeCode: string;
}

export async function setupRoomsAction(
  propertyId: string,
  floors: number[],
  roomTypes: RoomTypeInput[],
  rooms: RoomInput[]
) {
  if (!propertyId) {
    throw new Error("Property ID is required");
  }

  try {
    // Run everything in a single transaction to maintain consistency
    const result = await db.$transaction(async (tx) => {
      // 1. Create floors
      const createdFloors: any[] = [];
      for (const floorNum of floors) {
        const floor = await tx.floor.create({
          data: {
            number: floorNum,
            name: `Floor ${floorNum}`,
            propertyId,
          },
        });
        createdFloors.push(floor);
      }

      // 2. Create room types
      const createdRoomTypes: any[] = [];
      for (const rt of roomTypes) {
        const roomType = await tx.roomType.create({
          data: {
            name: rt.name,
            code: rt.code,
            description: rt.description || "",
            capacity: rt.capacity,
            beds: rt.beds,
            basePrice: rt.basePrice,
            propertyId,
          },
        });
        createdRoomTypes.push(roomType);
      }

      // 3. Create rooms in bulk using createMany to minimize roundtrips
      const roomsData = rooms.map((r) => {
        const floor = createdFloors.find((f) => f.number === r.floorNumber);
        const roomType = createdRoomTypes.find((rt) => rt.code === r.roomTypeCode);

        if (!floor) {
          throw new Error(`Floor ${r.floorNumber} was not created in transaction`);
        }
        if (!roomType) {
          throw new Error(`Room Type Code ${r.roomTypeCode} was not created in transaction`);
        }

        return {
          number: r.number,
          status: "AVAILABLE",
          propertyId,
          floorId: floor.id,
          roomTypeId: roomType.id,
        };
      });

      const createManyResult = await tx.room.createMany({
        data: roomsData,
      });

      return {
        floorsCount: createdFloors.length,
        roomTypesCount: createdRoomTypes.length,
        roomsCount: createManyResult.count,
      };
    }, {
      timeout: 30000, // 30 seconds to prevent timeout errors over high-latency networks
    });

    return { success: true, summary: result };
  } catch (error: any) {
    console.error("Transaction error in setupRoomsAction:", error);
    
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
    
    throw new Error(error.message || "Failed to setup floors, room types, and rooms.");
  }
}

export async function getPropertiesAction(organizationId?: string) {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookieOrgId = cookieStore.get("hotelos_org_id")?.value;
    const cookieRole = cookieStore.get("hotelos_role")?.value;
    const cookiePropId = cookieStore.get("hotelos_prop_id")?.value;

    const finalOrgId = cookieRole === "SAAS_OWNER"
      ? organizationId
      : (organizationId || cookieOrgId);

    if (cookieRole !== "SAAS_OWNER" && !finalOrgId) {
      return { success: true, properties: [] };
    }

    // Location-scoped roles (GM, Front Desk, Housekeeper, Spa, etc.) should ONLY see their assigned property
    const isGlobalRole = cookieRole === "SAAS_OWNER" || cookieRole === "MD" || cookieRole === "CFO";

    let where: any = {};
    if (!isGlobalRole && cookiePropId) {
      where = { id: cookiePropId };
    } else if (finalOrgId) {
      where = { organizationId: finalOrgId };
    }

    const properties = await db.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return { success: true, properties };
  } catch (error: any) {
    console.error("Prisma error in getPropertiesAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      return { success: false, properties: [] };
    }
    
    throw new Error(error.message || "Failed to fetch properties.");
  }
}

/**
 * Exposes a client-side property creator for the MD (Organization Owner).
 * Enforces max properties limit set on the Organization.
 */
export async function createPropertyByOwnerAction(
  name: string,
  address: string,
  organizationId: string
) {
  if (!name || name.trim() === "") {
    throw new Error("Property name is required.");
  }
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  try {
    // 1. Get organization and count current properties
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { properties: true },
        },
      },
    });

    if (!org) {
      throw new Error("Organization not found.");
    }

    if (org._count.properties >= org.maxProperties) {
      throw new Error(
        `Hotel creation limit reached! Your current subscription plan only allows registering up to ${org.maxProperties} properties.`
      );
    }

    // 2. Create the property
    const prop = await db.property.create({
      data: {
        name: name.trim(),
        address: address?.trim() || "",
        organizationId: org.id,
      },
    });

    // 3. Auto-generate GM user template for that hotel property
    const sanitizedProp = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const gmEmail = `gm.${sanitizedProp}@hotelos.com`;

    let gmRole = await db.role.findUnique({
      where: { name: "GM" },
    });
    if (!gmRole) {
      gmRole = await db.role.create({
        data: {
          name: "GM",
          description: "General Manager (Hotel Operations Owner)",
        },
      });
    }

    let gmUser = await db.user.findUnique({
      where: { email: gmEmail },
    });

    if (!gmUser) {
      gmUser = await db.user.create({
        data: {
          email: gmEmail,
          firstName: "General",
          lastName: "Manager",
          organizationId: org.id,
        },
      });

      await db.userRole.create({
        data: {
          userId: gmUser.id,
          roleId: gmRole.id,
        },
      });
    }

    // 4. Audit Log record
    await db.auditLog.create({
      data: {
        propertyId: prop.id,
        action: "PROVISION_PROPERTY",
        performedBy: gmEmail,
        details: `Successfully registered hotel property ${name} by Organization Owner.`,
      },
    });

    return { success: true, property: prop };
  } catch (error: any) {
    console.error("Failed to create property by Owner:", error);
    throw new Error(error.message || "Failed to create property.");
  }
}

export async function registerOrganizationStaffAction(data: {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  roleName: string;
  organizationId: string;
  propertyId?: string;
}) {
  if (!data.email || !data.roleName || !data.organizationId) {
    throw new Error("Email, Role, and Organization ID are required.");
  }

  try {
    // 1. Find or create Role record
    let role = await db.role.findUnique({
      where: { name: data.roleName },
    });
    if (!role) {
      role = await db.role.create({
        data: {
          name: data.roleName,
          description: `${data.roleName} Staff Role`,
        },
      });
    }

    // 2. Create User account
    const user = await db.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        password: data.password || "",
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        organizationId: data.organizationId,
        propertyId: data.propertyId || null,
      },
    });

    // 3. Link User to Role
    await db.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    return { success: true, user };
  } catch (error: any) {
    console.error("Failed to register staff member:", error);
    throw new Error(error.message || "Failed to register staff member.");
  }
}

/**
 * Fetches all rooms, room types, and floors for a property.
 */
export async function getPropertyRoomDetailsAction(propertyId: string) {
  if (!propertyId) {
    return { success: true, rooms: [], roomTypes: [], floors: [] };
  }

  try {
    const [rooms, roomTypes, floors] = await Promise.all([
      db.room.findMany({
        where: { propertyId },
        include: {
          floor: { select: { name: true, number: true } },
          roomType: { select: { name: true, code: true, basePrice: true } },
        },
        orderBy: { number: "asc" },
      }),
      db.roomType.findMany({
        where: { propertyId },
        orderBy: { name: "asc" },
      }),
      db.floor.findMany({
        where: { propertyId },
        orderBy: { number: "asc" },
      }),
    ]);

    return { success: true, rooms, roomTypes, floors };
  } catch (error: any) {
    console.error("Failed to fetch property room details:", error);
    return { success: false, rooms: [], roomTypes: [], floors: [] };
  }
}

/**
 * Creates a single room.
 */
export async function createSingleRoomAction(data: {
  propertyId: string;
  number: string;
  floorId: string;
  roomTypeId: string;
}) {
  if (!data.propertyId || !data.number || !data.floorId || !data.roomTypeId) {
    throw new Error("Property ID, Room Number, Floor, and Room Type are required.");
  }

  try {
    const room = await db.room.create({
      data: {
        propertyId: data.propertyId,
        number: data.number.trim(),
        floorId: data.floorId,
        roomTypeId: data.roomTypeId,
        status: "AVAILABLE",
      },
    });
    return { success: true, room };
  } catch (error: any) {
    console.error("Failed to create room:", error);
    throw new Error(error.message || "Failed to create room.");
  }
}

/**
 * Creates a single room type.
 */
export async function createSingleRoomTypeAction(data: {
  propertyId: string;
  name: string;
  code: string;
  basePrice: number;
  capacity?: number;
  beds?: number;
}) {
  if (!data.propertyId || !data.name || !data.code || !data.basePrice) {
    throw new Error("Property ID, Room Type Name, Code, and Base Price are required.");
  }

  try {
    const roomType = await db.roomType.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        basePrice: Number(data.basePrice),
        capacity: Number(data.capacity || 2),
        beds: Number(data.beds || 1),
      },
    });
    return { success: true, roomType };
  } catch (error: any) {
    console.error("Failed to create room type:", error);
    throw new Error(error.message || "Failed to create room type.");
  }
}

/**
 * Creates a single floor.
 */
export async function createSingleFloorAction(data: {
  propertyId: string;
  number: number;
  name?: string;
}) {
  if (!data.propertyId || data.number === undefined) {
    throw new Error("Property ID and Floor Number are required.");
  }

  try {
    const floor = await db.floor.create({
      data: {
        propertyId: data.propertyId,
        number: Number(data.number),
        name: data.name?.trim() || `Floor ${data.number}`,
      },
    });
    return { success: true, floor };
  } catch (error: any) {
    console.error("Failed to create floor:", error);
    throw new Error(error.message || "Failed to create floor.");
  }
}


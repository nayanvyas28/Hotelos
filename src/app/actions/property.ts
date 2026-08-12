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

export async function getPropertiesAction() {
  try {
    const properties = await db.property.findMany({
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

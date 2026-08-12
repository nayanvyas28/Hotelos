"use server";

import { db } from "@/lib/db";

interface GuestInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  dateOfBirth?: Date | string;
  vipStatus?: boolean;
  propertyId: string;
  
  // Optional relations
  address?: {
    addressLine1: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  
  document?: {
    type: string;
    documentNumber: string;
    fileKey?: string;
  };
}

export async function createGuestAction(data: GuestInput) {
  if (!data.firstName || !data.lastName || !data.propertyId) {
    throw new Error("First name, last name, and property ID are required");
  }

  try {
    const guest = await db.$transaction(async (tx) => {
      // Create guest
      const createdGuest = await tx.guest.create({
        data: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email?.trim() || null,
          phone: data.phone?.trim() || null,
          nationality: data.nationality?.trim() || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          vipStatus: !!data.vipStatus,
          propertyId: data.propertyId,
        },
      });

      // Create address if provided
      if (data.address && data.address.addressLine1.trim() !== "") {
        await tx.guestAddress.create({
          data: {
            addressLine1: data.address.addressLine1.trim(),
            city: data.address.city.trim(),
            state: data.address.state.trim(),
            country: data.address.country.trim(),
            postalCode: data.address.postalCode.trim(),
            guestId: createdGuest.id,
          },
        });
      }

      // Create document if provided
      if (data.document && data.document.documentNumber.trim() !== "") {
        await tx.guestDocument.create({
          data: {
            type: data.document.type,
            documentNumber: data.document.documentNumber.trim(),
            fileKey: data.document.fileKey || null,
            guestId: createdGuest.id,
          },
        });
      }

      return createdGuest;
    });

    return { success: true, guest };
  } catch (error: any) {
    console.error("Prisma error in createGuestAction:", error);
    throw new Error(error.message || "Failed to create guest.");
  }
}

export async function updateGuestAction(id: string, data: Partial<GuestInput>) {
  if (!id) {
    throw new Error("Guest ID is required");
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      // Update basic details
      const guest = await tx.guest.update({
        where: { id },
        data: {
          firstName: data.firstName?.trim(),
          lastName: data.lastName?.trim(),
          email: data.email !== undefined ? (data.email?.trim() || null) : undefined,
          phone: data.phone !== undefined ? (data.phone?.trim() || null) : undefined,
          nationality: data.nationality !== undefined ? (data.nationality?.trim() || null) : undefined,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          vipStatus: data.vipStatus !== undefined ? !!data.vipStatus : undefined,
        },
      });

      // Update or create address
      if (data.address) {
        const existingAddress = await tx.guestAddress.findFirst({
          where: { guestId: id },
        });

        if (existingAddress) {
          await tx.guestAddress.update({
            where: { id: existingAddress.id },
            data: {
              addressLine1: data.address.addressLine1.trim(),
              city: data.address.city.trim(),
              state: data.address.state.trim(),
              country: data.address.country.trim(),
              postalCode: data.address.postalCode.trim(),
            },
          });
        } else if (data.address.addressLine1.trim() !== "") {
          await tx.guestAddress.create({
            data: {
              addressLine1: data.address.addressLine1.trim(),
              city: data.address.city.trim(),
              state: data.address.state.trim(),
              country: data.address.country.trim(),
              postalCode: data.address.postalCode.trim(),
              guestId: id,
            },
          });
        }
      }

      // Update or create document
      if (data.document) {
        const existingDoc = await tx.guestDocument.findFirst({
          where: { guestId: id },
        });

        if (existingDoc) {
          await tx.guestDocument.update({
            where: { id: existingDoc.id },
            data: {
              type: data.document.type,
              documentNumber: data.document.documentNumber.trim(),
              fileKey: data.document.fileKey || null,
            },
          });
        } else if (data.document.documentNumber.trim() !== "") {
          await tx.guestDocument.create({
            data: {
              type: data.document.type,
              documentNumber: data.document.documentNumber.trim(),
              fileKey: data.document.fileKey || null,
              guestId: id,
            },
          });
        }
      }

      return guest;
    });

    return { success: true, guest: updated };
  } catch (error: any) {
    console.error("Prisma error in updateGuestAction:", error);
    throw new Error(error.message || "Failed to update guest.");
  }
}

export async function deleteGuestAction(id: string) {
  if (!id) {
    throw new Error("Guest ID is required");
  }

  try {
    await db.guest.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Prisma error in deleteGuestAction:", error);
    throw new Error(error.message || "Failed to delete guest.");
  }
}

export async function getGuestsAction(filters: {
  search?: string;
  vipOnly?: boolean;
  propertyId: string;
}) {
  if (!filters.propertyId) {
    throw new Error("Property ID is required");
  }

  try {
    const whereClause: any = {
      propertyId: filters.propertyId,
    };

    if (filters.vipOnly) {
      whereClause.vipStatus = true;
    }

    if (filters.search && filters.search.trim() !== "") {
      const searchTrim = filters.search.trim();
      whereClause.OR = [
        { firstName: { contains: searchTrim, mode: "insensitive" } },
        { lastName: { contains: searchTrim, mode: "insensitive" } },
        { email: { contains: searchTrim, mode: "insensitive" } },
        { phone: { contains: searchTrim, mode: "insensitive" } },
        { nationality: { contains: searchTrim, mode: "insensitive" } },
      ];
    }

    const guests = await db.guest.findMany({
      where: whereClause,
      include: {
        addresses: true,
        documents: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, guests };
  } catch (error: any) {
    console.error("Prisma error in getGuestsAction:", error);
    throw new Error(error.message || "Failed to fetch guests.");
  }
}

export async function getGuestDetailAction(id: string) {
  if (!id) {
    throw new Error("Guest ID is required");
  }

  try {
    const guest = await db.guest.findUnique({
      where: { id },
      include: {
        addresses: true,
        documents: true,
        notes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!guest) {
      throw new Error("Guest not found");
    }

    return { success: true, guest };
  } catch (error: any) {
    console.error("Prisma error in getGuestDetailAction:", error);
    throw new Error(error.message || "Failed to fetch guest details.");
  }
}

export async function addGuestNoteAction(guestId: string, text: string, createdById?: string) {
  if (!guestId || !text || text.trim() === "") {
    throw new Error("Guest ID and note text are required");
  }

  try {
    const note = await db.guestNote.create({
      data: {
        guestId,
        text: text.trim(),
        createdById: createdById || null,
      },
    });
    return { success: true, note };
  } catch (error: any) {
    console.error("Prisma error in addGuestNoteAction:", error);
    throw new Error(error.message || "Failed to add guest note.");
  }
}

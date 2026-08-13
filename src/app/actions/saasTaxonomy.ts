"use server";

import { db } from "@/lib/db";

const DEFAULT_SEEDS = [
  // Room Types
  { category: "ROOM_TYPE", name: "Standard Room", code: "STD" },
  { category: "ROOM_TYPE", name: "Deluxe Room", code: "DLX" },
  { category: "ROOM_TYPE", name: "Executive Suite", code: "EXE" },
  { category: "ROOM_TYPE", name: "Presidential Suite", code: "PRSU" },
  
  // Room Features
  { category: "ROOM_FEATURE", name: "King Size Bed", code: "KBED" },
  { category: "ROOM_FEATURE", name: "Ocean View Horizon", code: "OVIEW" },
  { category: "ROOM_FEATURE", name: "Private Balcony", code: "BALC" },
  { category: "ROOM_FEATURE", name: "Air Conditioning", code: "AC" },
  
  // Amenities
  { category: "AMENITY", name: "Free High-Speed Wi-Fi", code: "WIFI" },
  { category: "AMENITY", name: "Infinity Swimming Pool", code: "POOL" },
  { category: "AMENITY", name: "Valet Parking Space", code: "PARK" },
  { category: "AMENITY", name: "Premium Mini Bar", code: "MBAR" },
  
  // Payment Methods
  { category: "PAYMENT_METHOD", name: "Cash Settlement", code: "CASH" },
  { category: "PAYMENT_METHOD", name: "Credit/Debit Card", code: "CARD" },
  { category: "PAYMENT_METHOD", name: "UPI Instant Payment", code: "UPI" },
  { category: "PAYMENT_METHOD", name: "Bank Wire Transfer", code: "WIRE" },
];

/**
 * Retrieves global taxonomy items.
 * If empty, seeds default taxonomy categories and items automatically.
 */
export async function getSaaSTaxonomyItemsAction(category?: string) {
  try {
    let count = await db.globalTaxonomy.count();
    if (count === 0) {
      // Auto-seed
      await db.globalTaxonomy.createMany({
        data: DEFAULT_SEEDS,
      });
    }

    const items = await db.globalTaxonomy.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Creates a new taxonomy item in the global catalog.
 */
export async function createSaaSTaxonomyItemAction(
  category: string,
  name: string,
  code: string
) {
  if (!category || !name || !code) {
    return { success: false, error: "Category, Name, and Code are required." };
  }

  try {
    const newItem = await db.globalTaxonomy.create({
      data: {
        category,
        name: name.trim(),
        code: code.trim().toUpperCase(),
      },
    });

    return { success: true, item: newItem };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Updates a taxonomy item's details or active status.
 */
export async function updateSaaSTaxonomyItemAction(
  id: string,
  name: string,
  code: string,
  isActive: boolean
) {
  if (!id || !name || !code) {
    return { success: false, error: "Item ID, Name, and Code are required." };
  }

  try {
    const updated = await db.globalTaxonomy.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        isActive,
      },
    });

    return { success: true, item: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a taxonomy item from the global catalog.
 */
export async function deleteSaaSTaxonomyItemAction(id: string) {
  if (!id) {
    return { success: false, error: "Taxonomy item ID is required." };
  }

  try {
    await db.globalTaxonomy.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

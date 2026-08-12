"use server";

import { db } from "@/lib/db";

interface SupplierInput {
  propertyId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface InventoryItemInput {
  propertyId: string;
  name: string;
  sku?: string;
  category: string; // HOUSEKEEPING, TOILETRIES, RESTAURANT_RAW, OFFICE_SUPPLIES
  quantity: number;
  minQuantity: number;
  unitCost: number;
}

interface TransactionInput {
  inventoryItemId: string;
  type: string; // PURCHASE, USAGE, ADJUSTMENT
  quantity: number; // positive for purchase, negative/positive adjustment
  supplierId?: string;
  cost?: number;
  notes?: string;
  logAsExpense?: boolean;
}

/**
 * Fetches dashboard details for Inventory & Suppliers.
 */
export async function getInventoryOverviewAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    // 1. Fetch suppliers
    const suppliers = await db.supplier.findMany({
      where: { propertyId },
      orderBy: { name: "asc" },
    });

    // 2. Fetch inventory items
    const rawItems = await db.inventoryItem.findMany({
      where: { propertyId },
      orderBy: { name: "asc" },
    });

    const inventoryItems = rawItems.map((item) => ({
      ...item,
      lowStockAlert: item.quantity <= item.minQuantity,
    }));

    // 3. Fetch recent stock transactions
    const transactions = await db.stockTransaction.findMany({
      where: {
        inventoryItem: { propertyId },
      },
      include: {
        inventoryItem: { select: { name: true, sku: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return {
      success: true,
      suppliers,
      inventoryItems,
      transactions,
    };
  } catch (error: any) {
    console.error("Prisma error in getInventoryOverviewAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      return {
        success: false,
        suppliers: [],
        inventoryItems: [],
        transactions: [],
      };
    }
    
    throw new Error(error.message || "Failed to fetch Inventory overview.");
  }
}

/**
 * Registers a new supplier in the directory.
 */
export async function createSupplierAction(data: SupplierInput) {
  if (!data.propertyId || !data.name) {
    throw new Error("Property ID and Supplier Name are required.");
  }

  try {
    const supplier = await db.supplier.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        contactName: data.contactName?.trim() || "",
        email: data.email?.trim() || "",
        phone: data.phone?.trim() || "",
        address: data.address?.trim() || "",
      },
    });
    return { success: true, supplier };
  } catch (error: any) {
    console.error("Prisma error in createSupplierAction:", error);
    throw new Error(error.message || "Failed to register supplier.");
  }
}

/**
 * Registers a new inventory item SKU.
 */
export async function createInventoryItemAction(data: InventoryItemInput) {
  if (!data.propertyId || !data.name || !data.category) {
    throw new Error("Property ID, Item Name, and Category are required.");
  }

  try {
    const item = await db.inventoryItem.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        sku: data.sku?.trim() || "",
        category: data.category,
        quantity: Number(data.quantity) || 0,
        minQuantity: Number(data.minQuantity) || 5,
        unitCost: Number(data.unitCost) || 0,
      },
    });
    return { success: true, item };
  } catch (error: any) {
    console.error("Prisma error in createInventoryItemAction:", error);
    throw new Error(error.message || "Failed to register inventory item.");
  }
}

/**
 * Logs a stock transaction, syncing count quantities and logging optional Expenses.
 */
export async function logStockTransactionAction(data: TransactionInput) {
  if (!data.inventoryItemId || !data.type || data.quantity === 0) {
    throw new Error("Item ID, Transaction Type, and Non-zero Quantity are required.");
  }

  try {
    const transaction = await db.$transaction(async (tx) => {
      // 1. Fetch item detail
      const item = await tx.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
      });

      if (!item) {
        throw new Error("Inventory item not found.");
      }

      // Calculate quantity adjustment
      let qtyAdjust = Number(data.quantity);
      if (data.type === "USAGE") {
        qtyAdjust = -Math.abs(qtyAdjust); // force negative depletion
      }

      // 2. Create Stock transaction
      const newTx = await tx.stockTransaction.create({
        data: {
          inventoryItemId: data.inventoryItemId,
          type: data.type,
          quantity: qtyAdjust,
          supplierId: data.supplierId || null,
          cost: data.cost ? Number(data.cost) : null,
          notes: data.notes?.trim() || "",
        },
      });

      // 3. Update stock levels
      await tx.inventoryItem.update({
        where: { id: data.inventoryItemId },
        data: {
          quantity: {
            increment: qtyAdjust,
          },
        },
      });

      // 4. Log automated financial Expense if check-flag is set (e.g. for PURCHASE)
      if (data.logAsExpense && data.cost && data.cost > 0) {
        await tx.expense.create({
          data: {
            propertyId: item.propertyId,
            amount: Number(data.cost),
            category: "INVENTORY",
            description: `Stock Purchase: ${item.name} (x${data.quantity})`,
            date: new Date(),
          },
        });
      }

      return newTx;
    });

    return { success: true, transaction };
  } catch (error: any) {
    console.error("Prisma error in logStockTransactionAction:", error);
    throw new Error(error.message || "Failed to record stock transaction.");
  }
}

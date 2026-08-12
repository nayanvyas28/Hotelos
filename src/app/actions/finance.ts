"use server";

import { db } from "@/lib/db";

export async function getExpensesAction(propertyId: string) {
  if (!propertyId) throw new Error("Property ID is required.");
  try {
    const expenses = await db.expense.findMany({
      where: { propertyId },
      orderBy: { date: "desc" },
    });
    return { success: true, expenses };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createExpenseAction(data: {
  propertyId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}) {
  if (!data.propertyId || !data.amount || !data.category || !data.description) {
    throw new Error("Missing required expense attributes.");
  }
  try {
    const expense = await db.expense.create({
      data: {
        propertyId: data.propertyId,
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        date: new Date(data.date || new Date()),
      },
    });
    return { success: true, expense };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteExpenseAction(expenseId: string) {
  if (!expenseId) throw new Error("Expense ID is required.");
  try {
    await db.expense.delete({
      where: { id: expenseId },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addStaffMemberAction(data: {
  propertyId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
}) {
  if (!data.propertyId || !data.email || !data.roleName) {
    throw new Error("Property, email, and role are required.");
  }
  try {
    const property = await db.property.findUnique({
      where: { id: data.propertyId },
      select: { organizationId: true },
    });

    if (!property) throw new Error("Property not found.");

    // Create user inside organization
    const user = await db.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationId: property.organizationId,
      },
    });

    // Find role
    let role = await db.role.findFirst({
      where: { name: data.roleName },
    });

    if (!role) {
      role = await db.role.create({
        data: { name: data.roleName, description: `${data.roleName} staff role` },
      });
    }

    // Assign Role
    await db.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeStaffMemberAction(userId: string) {
  if (!userId) throw new Error("User ID is required.");
  try {
    await db.user.delete({
      where: { id: userId },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

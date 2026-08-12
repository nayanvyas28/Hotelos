"use server";

import { db } from "@/lib/db";

interface CompanyInput {
  propertyId: string;
  name: string;
  taxId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  discountPercent?: number;
}

export async function createCompanyAction(data: CompanyInput) {
  if (!data.propertyId || !data.name) {
    throw new Error("Property ID and Company Name are required.");
  }

  try {
    const company = await db.company.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        taxId: data.taxId?.trim() || null,
        contactName: data.contactName?.trim() || null,
        contactEmail: data.contactEmail?.trim() || null,
        contactPhone: data.contactPhone?.trim() || null,
        discountPercent: data.discountPercent !== undefined ? Number(data.discountPercent) : 0,
      },
    });

    return { success: true, company };
  } catch (error: any) {
    console.error("Prisma error in createCompanyAction:", error);
    throw new Error(error.message || "Failed to create corporate profile.");
  }
}

export async function getCompaniesAction(propertyId: string) {
  if (!propertyId) {
    throw new Error("Property ID is required.");
  }

  try {
    const companies = await db.company.findMany({
      where: { propertyId },
      orderBy: { name: "asc" },
    });

    return { success: true, companies };
  } catch (error: any) {
    console.error("Prisma error in getCompaniesAction:", error);
    throw new Error(error.message || "Failed to fetch corporate accounts.");
  }
}

export async function linkGuestToCompanyAction(guestId: string, companyId: string | null) {
  if (!guestId) {
    throw new Error("Guest ID is required.");
  }

  try {
    const guest = await db.guest.update({
      where: { id: guestId },
      data: { companyId },
    });

    return { success: true, guest };
  } catch (error: any) {
    console.error("Prisma error in linkGuestToCompanyAction:", error);
    throw new Error(error.message || "Failed to associate guest to corporate account.");
  }
}

export async function getCompanyDetailsAction(companyId: string) {
  if (!companyId) {
    throw new Error("Company ID is required.");
  }

  try {
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        reservations: {
          include: {
            room: { select: { number: true } },
            guests: { select: { firstName: true, lastName: true } },
          },
          orderBy: { checkIn: "desc" },
        },
      },
    });

    if (!company) {
      throw new Error("Corporate profile not found.");
    }

    return { success: true, company };
  } catch (error: any) {
    console.error("Prisma error in getCompanyDetailsAction:", error);
    throw new Error(error.message || "Failed to retrieve corporate logs.");
  }
}

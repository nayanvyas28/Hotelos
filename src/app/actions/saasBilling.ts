"use server";

import { db } from "@/lib/db";

/**
 * Retrieves all tenant organizations with active property counts, computed MRR, and invoices.
 * Auto-seeds historical mock invoices if none exist.
 */
export async function getSaaSSubscriptionsAction() {
  try {
    const orgs = await db.organization.findMany({
      include: {
        properties: true,
        users: {
          include: {
            userRoles: {
              include: { role: true },
            },
          },
        },
        saasInvoices: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const invoiceCount = await db.saasInvoice.count();
    if (invoiceCount === 0 && orgs.length > 0) {
      // Auto-seed two invoices per organization
      for (const org of orgs) {
        // Last Month Invoice (PAID)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        await db.saasInvoice.create({
          data: {
            invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            amount: org.properties.length * 2500 || 2500,
            status: "PAID",
            organizationId: org.id,
            dueDate: lastMonth,
            createdAt: lastMonth,
          },
        });

        // Current Month Invoice (PENDING)
        const currentMonth = new Date();
        currentMonth.setDate(currentMonth.getDate() + 15);
        await db.saasInvoice.create({
          data: {
            invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            amount: org.properties.length * 2500 || 2500,
            status: "PENDING",
            organizationId: org.id,
            dueDate: currentMonth,
            createdAt: new Date(),
          },
        });
      }

      // Re-fetch with newly seeded invoices
      const updatedOrgs = await db.organization.findMany({
        include: {
          properties: true,
          saasInvoices: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
      return { success: true, organizations: updatedOrgs };
    }

    return { success: true, organizations: orgs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Creates a new SaaS Invoice.
 */
export async function createSaaSInvoiceAction(
  organizationId: string,
  amount: number,
  status: string,
  dueDateString: string
) {
  if (!organizationId || !amount || !status || !dueDateString) {
    return { success: false, error: "All invoice fields are required." };
  }

  try {
    const org = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return { success: false, error: "Organization group not found." };
    }

    const newInvoice = await db.saasInvoice.create({
      data: {
        invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: parseFloat(String(amount)),
        status,
        organizationId,
        dueDate: new Date(dueDateString),
      },
    });

    // Create an audit trail log under organization's first property if exists
    const prop = await db.property.findFirst({
      where: { organizationId },
    });
    if (prop) {
      await db.auditLog.create({
        data: {
          propertyId: prop.id,
          action: "LICENSE_CHANGE",
          performedBy: "saas_owner@hotelos.com",
          details: `Dispatched SaaS Billing Invoice ${newInvoice.invoiceNumber} amount $${amount} to tenant organization.`,
        },
      });
    }

    return { success: true, invoice: newInvoice };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

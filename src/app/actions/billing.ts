"use server";

import { db } from "@/lib/db";

/**
 * Calculates number of nights between two dates.
 */
function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1; // minimum 1 night
}

/**
 * Fetches the folio for a reservation, creating it and auto-posting room rates if it doesn't exist.
 */
export async function getOrCreateFolioAction(reservationId: string) {
  if (!reservationId) {
    throw new Error("Reservation ID is required.");
  }

  try {
    // 1. Check if folio already exists
    const existingFolio = await db.folio.findUnique({
      where: { reservationId },
      include: {
        charges: { orderBy: { createdAt: "asc" } },
        payments: { orderBy: { createdAt: "asc" } },
        reservation: {
          include: {
            guests: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            room: {
              select: {
                number: true,
                roomType: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (existingFolio) {
      return { success: true, folio: existingFolio };
    }

    // 2. Fetch reservation to initialize folio
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new Error("Reservation not found.");
    }

    // 3. Create folio and auto-post room charges inside transaction
    const result = await db.$transaction(async (tx) => {
      // Create Folio
      const folio = await tx.folio.create({
        data: {
          reservationId,
          status: "OPEN",
        },
      });

      const nights = calculateNights(new Date(reservation.checkIn), new Date(reservation.checkOut));
      const dailyPrice = reservation.totalPrice / nights;
      const taxRate = 0.12; // 12% GST standard

      // Post Room Charges for each night of the stay
      const checkInDate = new Date(reservation.checkIn);
      const chargePromises = [];

      for (let i = 0; i < nights; i++) {
        const nightDate = new Date(checkInDate);
        nightDate.setDate(checkInDate.getDate() + i);
        const dateStr = nightDate.toLocaleDateString();

        const amount = parseFloat(dailyPrice.toFixed(2));
        const taxAmount = parseFloat((amount * taxRate).toFixed(2));

        chargePromises.push(
          tx.folioCharge.create({
            data: {
              folioId: folio.id,
              type: "ROOM_RATE",
              amount,
              taxAmount,
              description: `Room Charge - Night of ${dateStr} (Room ${reservation.room.number})`,
            },
          })
        );
      }

      await Promise.all(chargePromises);

      // Fetch newly created folio in full
      return tx.folio.findUnique({
        where: { id: folio.id },
        include: {
          charges: { orderBy: { createdAt: "asc" } },
          payments: { orderBy: { createdAt: "asc" } },
          reservation: {
            include: {
              guests: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
              room: {
                select: {
                  number: true,
                  roomType: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    return { success: true, folio: result };
  } catch (error: any) {
    console.error("Prisma error in getOrCreateFolioAction:", error);
    
    const errorStr = String(error.message || error);
    if (
      errorStr.includes("password") || 
      errorStr.includes("P1001") || 
      errorStr.includes("Can't reach database")
    ) {
      return { success: false, folio: null };
    }
    
    throw new Error(error.message || "Failed to initialize guest stay folio.");
  }
}

/**
 * Posts a charge line item to a folio.
 */
export async function postChargeAction(
  folioId: string,
  data: { type: string; amount: number; taxAmount: number; description: string }
) {
  if (!folioId) {
    throw new Error("Folio ID is required.");
  }
  if (data.amount <= 0) {
    throw new Error("Charge amount must be greater than 0.");
  }

  try {
    const charge = await db.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) {
        throw new Error("Folio not found.");
      }
      if (folio.status === "CLOSED") {
        throw new Error("Cannot post charges to a closed folio.");
      }

      return tx.folioCharge.create({
        data: {
          folioId,
          type: data.type,
          amount: data.amount,
          taxAmount: data.taxAmount || 0,
          description: data.description.trim(),
        },
      });
    });

    return { success: true, charge };
  } catch (error: any) {
    console.error("Prisma error in postChargeAction:", error);
    throw new Error(error.message || "Failed to post charge.");
  }
}

/**
 * Records a payment or refund transaction on a folio.
 */
export async function postPaymentAction(
  folioId: string,
  data: { amount: number; type: string; method: string; reference?: string }
) {
  if (!folioId) {
    throw new Error("Folio ID is required.");
  }
  if (data.amount <= 0) {
    throw new Error("Payment amount must be greater than 0.");
  }

  try {
    const payment = await db.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) {
        throw new Error("Folio not found.");
      }
      if (folio.status === "CLOSED") {
        throw new Error("Cannot post transactions to a closed folio.");
      }

      return tx.folioPayment.create({
        data: {
          folioId,
          amount: data.amount,
          type: data.type || "PAYMENT",
          method: data.method,
          reference: data.reference?.trim() || "",
        },
      });
    });

    return { success: true, payment };
  } catch (error: any) {
    console.error("Prisma error in postPaymentAction:", error);
    throw new Error(error.message || "Failed to record payment transaction.");
  }
}

/**
 * Settles and closes a folio.
 */
export async function closeFolioAction(folioId: string) {
  if (!folioId) {
    throw new Error("Folio ID is required.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({
        where: { id: folioId },
        include: {
          charges: true,
          payments: true,
        },
      });

      if (!folio) {
        throw new Error("Folio not found.");
      }

      if (folio.status === "CLOSED") {
        throw new Error("Folio is already closed.");
      }

      // Calculate net balance
      const totalCharges = folio.charges.reduce((sum, c) => sum + c.amount + c.taxAmount, 0);
      const totalPayments = folio.payments.reduce((sum, p) => {
        return sum + (p.type === "REFUND" ? -p.amount : p.amount);
      }, 0);
      
      const balance = parseFloat((totalCharges - totalPayments).toFixed(2));

      if (Math.abs(balance) > 0.05) {
        throw new Error(`Cannot close folio. Folio must be settled to 0.00 balance. Current balance: INR ${balance}`);
      }

      // Update folio status to CLOSED
      return tx.folio.update({
        where: { id: folioId },
        data: { status: "CLOSED" },
      });
    });

    return { success: true, folio: result };
  } catch (error: any) {
    console.error("Prisma error in closeFolioAction:", error);
    throw new Error(error.message || "Failed to close folio.");
  }
}

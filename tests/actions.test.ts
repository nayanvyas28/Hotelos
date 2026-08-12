import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOrganizationAction } from "../src/app/actions/organization";
import { setupPropertyAction, setupRoomsAction } from "../src/app/actions/property";
import { createGuestAction, getGuestsAction, addGuestNoteAction } from "../src/app/actions/guest";
import { createReservationAction, updateReservationAction, getReservationsAction, checkRoomAvailability } from "../src/app/actions/reservation";
import { checkInAction, checkOutAction, transferRoomAction } from "../src/app/actions/frontdesk";
import { getOrCreateFolioAction, postChargeAction, postPaymentAction, closeFolioAction } from "../src/app/actions/billing";
import { getHousekeepingOverviewAction, updateRoomStatusAction, createHousekeepingTaskAction, updateHousekeepingTaskAction, createMaintenanceLogAction, resolveMaintenanceLogAction } from "../src/app/actions/housekeeping";
import { getAnalyticsReportAction, createExpenseAction, getExpensesAction } from "../src/app/actions/reports";
import { createMenuItemAction, createRestaurantTableAction, createRestaurantOrderAction, chargeOrderToRoomFolioAction } from "../src/app/actions/restaurant";
import { createSupplierAction, createInventoryItemAction, logStockTransactionAction } from "../src/app/actions/inventory";
import { createBanquetHallAction, createEventBookingAction, chargeEventToGuestFolioAction } from "../src/app/actions/events";
import { createSpaServiceAction, createTherapistAction, createSpaBookingAction, chargeSpaToGuestFolioAction } from "../src/app/actions/spa";
import { getAuditStatusAction, runNightAuditAction, getAuditLogsAction } from "../src/app/actions/audit";
import { createRatePlanAction, getRatePlansAction, createSeasonAction, getSeasonsAction, calculateStayPriceAction } from "../src/app/actions/rates";
import { createCompanyAction, getCompaniesAction, linkGuestToCompanyAction, getCompanyDetailsAction } from "../src/app/actions/corporate";
import { generateReportSummaryAction, generateGuestEmailAction, generateRevenueInsightsAction, askAICopilotAction } from "../src/app/actions/ai";
import { getStaffMembersAction, createShiftAction, getShiftsAction, getSystemAuditLogsAction, createWebhookSubscriptionAction, getWebhookSubscriptionsAction, createApiKeyAction, getApiKeysAction } from "../src/app/actions/system";

// 1. Mock transaction object
const mockTx = {
  auditLog: {
    create: vi.fn(),
  },
  floor: {
    create: vi.fn(),
  },
  roomType: {
    create: vi.fn(),
  },
  room: {
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
  },
  guest: {
    create: vi.fn(),
  },
  guestAddress: {
    create: vi.fn(),
  },
  guestDocument: {
    create: vi.fn(),
  },
  reservation: {
    create: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  folio: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  folioCharge: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  folioPayment: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  housekeepingTask: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  maintenanceLog: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  menuItem: {
    findMany: vi.fn(),
  },
  restaurantOrder: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  restaurantTable: {
    update: vi.fn(),
  },
  supplier: {
    create: vi.fn(),
  },
  inventoryItem: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  stockTransaction: {
    create: vi.fn(),
  },
  expense: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  banquetHall: {
    create: vi.fn(),
  },
  eventBooking: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  spaService: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  therapist: {
    create: vi.fn(),
  },
  spaBooking: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  property: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  nightAuditLog: {
    create: vi.fn(),
  },
  ratePlan: {
    findUnique: vi.fn(),
  },
  season: {
    findMany: vi.fn(),
  },
};

// 2. Mock db client
vi.mock("../src/lib/db", () => {
  return {
    db: {
      organization: {
        create: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
      },
      shift: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      webhookSubscription: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      apiKey: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      property: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      company: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      ratePlan: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      season: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      roomType: {
        findUnique: vi.fn(),
      },
      guest: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      guestNote: {
        create: vi.fn(),
      },
      reservation: {
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      room: {
        findMany: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      folio: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      folioCharge: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      folioPayment: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      housekeepingTask: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      maintenanceLog: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      expense: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      menuItem: {
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      restaurantTable: {
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      restaurantOrder: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      supplier: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      inventoryItem: {
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      stockTransaction: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      banquetHall: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      eventBooking: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      spaService: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      therapist: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      spaBooking: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      nightAuditLog: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockTx)),
    },
  };
});

// Import mocked db to define mock return values
import { db } from "../src/lib/db";

describe("HotelOS Server Actions Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Organization Actions", () => {
    it("should successfully create an organization", async () => {
      const mockOrg = { id: "org-1", name: "Grand Horizon Hotels", createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(db.organization.create).mockResolvedValue(mockOrg as any);

      const result = await createOrganizationAction("Grand Horizon Hotels");
      
      expect(result.success).toBe(true);
      expect(result.organization.name).toBe("Grand Horizon Hotels");
      expect(db.organization.create).toHaveBeenCalledWith({
        data: { name: "Grand Horizon Hotels" },
      });
    });

    it("should throw error for empty organization name", async () => {
      await expect(createOrganizationAction("")).rejects.toThrow("Organization name is required");
    });
  });

  describe("Property Actions", () => {
    it("should successfully create a property", async () => {
      const mockProp = {
        id: "prop-1",
        name: "Lakeview Resort",
        currency: "INR",
        timezone: "Asia/Kolkata",
        address: "Lake Road",
        organizationId: "org-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(db.property.create).mockResolvedValue(mockProp as any);

      const result = await setupPropertyAction({
        name: "Lakeview Resort",
        currency: "INR",
        timezone: "Asia/Kolkata",
        address: "Lake Road",
        organizationId: "org-1",
      });

      expect(result.success).toBe(true);
      expect(result.property.name).toBe("Lakeview Resort");
      expect(db.property.create).toHaveBeenCalledWith({
        data: {
          name: "Lakeview Resort",
          currency: "INR",
          timezone: "Asia/Kolkata",
          address: "Lake Road",
          organizationId: "org-1",
        },
      });
    });

    it("should successfully setup floors, room types, and rooms in transaction", async () => {
      vi.mocked(mockTx.floor.create).mockResolvedValue({ id: "floor-1", number: 1 } as any);
      vi.mocked(mockTx.roomType.create).mockResolvedValue({ id: "type-std", code: "STD", name: "Standard" } as any);
      vi.mocked(mockTx.room.createMany).mockResolvedValue({ count: 1 } as any);

      const result = await setupRoomsAction(
        "prop-1",
        [1],
        [{ name: "Standard", code: "STD", capacity: 2, beds: 1, basePrice: 2000 }],
        [{ number: "101", floorNumber: 1, roomTypeCode: "STD" }]
      );

      expect(result.success).toBe(true);
      expect(result.summary.roomsCount).toBe(1);
      expect(result.summary.roomTypesCount).toBe(1);
      expect(result.summary.floorsCount).toBe(1);
      
      expect(db.$transaction).toHaveBeenCalled();
      expect(mockTx.floor.create).toHaveBeenCalled();
      expect(mockTx.roomType.create).toHaveBeenCalled();
      expect(mockTx.room.createMany).toHaveBeenCalled();
    });
  });

  describe("Guest CRM Actions", () => {
    it("should successfully create a guest with address and document", async () => {
      const mockGuest = {
        id: "guest-1",
        firstName: "Rahul",
        lastName: "Sharma",
        email: "rahul@example.com",
        phone: "+91 9876543210",
        nationality: "Indian",
        dateOfBirth: new Date("1990-01-01"),
        vipStatus: true,
        propertyId: "prop-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(mockTx.guest.create).mockResolvedValue(mockGuest as any);

      const result = await createGuestAction({
        firstName: "Rahul",
        lastName: "Sharma",
        email: "rahul@example.com",
        phone: "+91 9876543210",
        nationality: "Indian",
        dateOfBirth: new Date("1990-01-01"),
        vipStatus: true,
        propertyId: "prop-1",
        address: {
          addressLine1: "123 Street",
          city: "Bhopal",
          state: "MP",
          country: "India",
          postalCode: "462001",
        },
        document: {
          type: "PASSPORT",
          documentNumber: "L9876543",
        },
      });

      expect(result.success).toBe(true);
      expect(result.guest.firstName).toBe("Rahul");
      expect(db.$transaction).toHaveBeenCalled();
      expect(mockTx.guest.create).toHaveBeenCalled();
      expect(mockTx.guestAddress.create).toHaveBeenCalled();
      expect(mockTx.guestDocument.create).toHaveBeenCalled();
    });

    it("should fetch guests matching search query", async () => {
      const mockGuests = [
        { id: "guest-1", firstName: "Rahul", lastName: "Sharma", propertyId: "prop-1" },
      ];
      vi.mocked(db.guest.findMany).mockResolvedValue(mockGuests as any);

      const result = await getGuestsAction({
        propertyId: "prop-1",
        search: "Rahul",
        vipOnly: false,
      });

      expect(result.success).toBe(true);
      expect(result.guests.length).toBe(1);
      expect(db.guest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyId: "prop-1",
            OR: expect.any(Array),
          }),
        })
      );
    });

    it("should successfully append a staff note to guest CRM", async () => {
      const mockNote = {
        id: "note-1",
        text: "Prefers low floor rooms",
        guestId: "guest-1",
        createdById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(db.guestNote.create).mockResolvedValue(mockNote as any);

      const result = await addGuestNoteAction("guest-1", "Prefers low floor rooms", "user-1");

      expect(result.success).toBe(true);
      expect(result.note.text).toBe("Prefers low floor rooms");
      expect(db.guestNote.create).toHaveBeenCalledWith({
        data: {
          guestId: "guest-1",
          text: "Prefers low floor rooms",
          createdById: "user-1",
        },
      });
    });
  });

  describe("Reservation & Availability Actions", () => {
    it("should return null when room is fully available", async () => {
      vi.mocked(db.reservation.findFirst).mockResolvedValue(null as any);
      vi.mocked(db.maintenanceLog.findFirst).mockResolvedValue(null as any);

      const result = await checkRoomAvailability("room-1", "2026-09-01", "2026-09-05");

      expect(result).toBeNull();
    });

    it("should return conflicting reservation when overlapping dates are found", async () => {
      const mockConflict = { id: "res-conflict", roomId: "room-1", checkIn: new Date(), checkOut: new Date() };
      vi.mocked(db.reservation.findFirst).mockResolvedValue(mockConflict as any);
      vi.mocked(db.maintenanceLog.findFirst).mockResolvedValue(null as any);

      const result = await checkRoomAvailability("room-1", "2026-09-01", "2026-09-05");

      expect(result).toBe(mockConflict);
    });

    it("should successfully create a reservation if no conflicts exist in transaction", async () => {
      vi.mocked(mockTx.reservation.findFirst).mockResolvedValue(null as any);
      vi.mocked(mockTx.maintenanceLog.findFirst).mockResolvedValue(null as any);
      
      const mockReservation = {
        id: "res-new",
        checkIn: new Date("2026-09-01"),
        checkOut: new Date("2026-09-05"),
        status: "CONFIRMED",
        totalPrice: 4000,
        roomId: "room-1",
        propertyId: "prop-1",
      };
      vi.mocked(mockTx.reservation.create).mockResolvedValue(mockReservation as any);

      const result = await createReservationAction({
        checkIn: "2026-09-01",
        checkOut: "2026-09-05",
        roomId: "room-1",
        propertyId: "prop-1",
        guestIds: ["guest-1"],
        totalPrice: 4000,
      });

      expect(result.success).toBe(true);
      expect(result.reservation.id).toBe("res-new");
      expect(mockTx.reservation.findFirst).toHaveBeenCalled();
      expect(mockTx.reservation.create).toHaveBeenCalled();
    });

    it("should throw conflict error if room is booked during transaction", async () => {
      vi.mocked(mockTx.reservation.findFirst).mockResolvedValue({ id: "conflict-id" } as any);
      vi.mocked(mockTx.maintenanceLog.findFirst).mockResolvedValue(null as any);

      await expect(
        createReservationAction({
          checkIn: "2026-09-01",
          checkOut: "2026-09-05",
          roomId: "room-1",
          propertyId: "prop-1",
          guestIds: ["guest-1"],
          totalPrice: 4000,
        })
      ).rejects.toThrow("Room is already booked for the selected dates");
    });
  });

  describe("Front Desk Operations", () => {
    it("should successfully check in a guest stay", async () => {
      const mockReservation = { id: "res-1", status: "CONFIRMED", roomId: "room-101", room: { number: "101" } };
      vi.mocked(mockTx.reservation.findUnique).mockResolvedValue(mockReservation as any);
      vi.mocked(mockTx.reservation.update).mockResolvedValue({ ...mockReservation, status: "CHECKED_IN", depositPaid: 1000 } as any);

      const result = await checkInAction("res-1", 1000);

      expect(result.success).toBe(true);
      expect(result.reservation.status).toBe("CHECKED_IN");
      expect(result.reservation.depositPaid).toBe(1000);
      expect(mockTx.reservation.update).toHaveBeenCalledWith({
        where: { id: "res-1" },
        data: { status: "CHECKED_IN", depositPaid: 1000 },
      });
      expect(mockTx.room.update).toHaveBeenCalledWith({
        where: { id: "room-101" },
        data: { status: "OCCUPIED" },
      });
    });

    it("should successfully check out a guest stay", async () => {
      const mockReservation = { id: "res-1", status: "CHECKED_IN", roomId: "room-101" };
      vi.mocked(mockTx.reservation.findUnique).mockResolvedValue(mockReservation as any);
      vi.mocked(mockTx.reservation.update).mockResolvedValue({ ...mockReservation, status: "CHECKED_OUT" } as any);

      const result = await checkOutAction("res-1");

      expect(result.success).toBe(true);
      expect(result.reservation.status).toBe("CHECKED_OUT");
      expect(mockTx.room.update).toHaveBeenCalledWith({
        where: { id: "room-101" },
        data: { status: "DIRTY" },
      });
    });

    it("should successfully transfer room stay to available target room", async () => {
      const mockReservation = { id: "res-1", status: "CHECKED_IN", roomId: "room-101", checkIn: new Date(), checkOut: new Date() };
      vi.mocked(mockTx.reservation.findUnique).mockResolvedValue(mockReservation as any);
      vi.mocked(mockTx.reservation.findFirst).mockResolvedValue(null as any); // no conflict
      vi.mocked(mockTx.reservation.update).mockResolvedValue({ ...mockReservation, roomId: "room-102" } as any);

      const result = await transferRoomAction("res-1", "room-102");

      expect(result.success).toBe(true);
      expect(result.reservation.roomId).toBe("room-102");
      expect(mockTx.room.update).toHaveBeenCalledWith({
        where: { id: "room-101" },
        data: { status: "DIRTY" },
      });
      expect(mockTx.room.update).toHaveBeenCalledWith({
        where: { id: "room-102" },
        data: { status: "OCCUPIED" },
      });
    });
  });

  describe("Billing & Folio Operations", () => {
    it("should return existing folio if found", async () => {
      const mockFolio = { id: "folio-1", reservationId: "res-1", status: "OPEN", charges: [], payments: [] };
      vi.mocked(db.folio.findUnique).mockResolvedValue(mockFolio as any);

      const result = await getOrCreateFolioAction("res-1");

      expect(result.success).toBe(true);
      expect(result.folio.id).toBe("folio-1");
      expect(db.folio.findUnique).toHaveBeenCalled();
    });

    it("should initialize a new folio and auto-post room charges if not found", async () => {
      vi.mocked(db.folio.findUnique).mockResolvedValue(null as any);
      
      const mockReservation = {
        id: "res-1",
        checkIn: new Date("2026-09-01"),
        checkOut: new Date("2026-09-03"), // 2 nights
        totalPrice: 4000,
        room: { number: "101", roomType: { name: "Standard" } },
      };
      vi.mocked(db.reservation.findUnique).mockResolvedValue(mockReservation as any);

      const mockFolio = { id: "folio-new", reservationId: "res-1", status: "OPEN" };
      vi.mocked(mockTx.folio.create).mockResolvedValue(mockFolio as any);
      vi.mocked(mockTx.folio.findUnique).mockResolvedValue({
        ...mockFolio,
        charges: [{ id: "c-1", amount: 2000, taxAmount: 240, description: "Room Charge" }],
        payments: [],
      } as any);

      const result = await getOrCreateFolioAction("res-1");

      expect(result.success).toBe(true);
      expect(result.folio.id).toBe("folio-new");
      expect(db.$transaction).toHaveBeenCalled();
      expect(mockTx.folio.create).toHaveBeenCalled();
      expect(mockTx.folioCharge.create).toHaveBeenCalled(); // auto-posted charges
    });

    it("should successfully post a custom folio charge", async () => {
      const mockFolio = { id: "folio-1", status: "OPEN" };
      vi.mocked(mockTx.folio.findUnique).mockResolvedValue(mockFolio as any);
      vi.mocked(mockTx.folioCharge.create).mockResolvedValue({ id: "charge-1", amount: 500 } as any);

      const result = await postChargeAction("folio-1", {
        type: "ROOM_SERVICE",
        amount: 500,
        taxAmount: 60,
        description: "Dinner Room Service",
      });

      expect(result.success).toBe(true);
      expect(result.charge.amount).toBe(500);
      expect(mockTx.folioCharge.create).toHaveBeenCalled();
    });

    it("should successfully post a payment transaction", async () => {
      const mockFolio = { id: "folio-1", status: "OPEN" };
      vi.mocked(mockTx.folio.findUnique).mockResolvedValue(mockFolio as any);
      vi.mocked(mockTx.folioPayment.create).mockResolvedValue({ id: "pay-1", amount: 4480 } as any);

      const result = await postPaymentAction("folio-1", {
        amount: 4480,
        type: "PAYMENT",
        method: "UPI",
        reference: "TXN12345",
      });

      expect(result.success).toBe(true);
      expect(result.payment.amount).toBe(4480);
      expect(mockTx.folioPayment.create).toHaveBeenCalled();
    });
  });

  describe("Housekeeping & Maintenance Operations", () => {
    it("should successfully update manual room status", async () => {
      const mockRoom = { id: "room-1", status: "AVAILABLE" };
      vi.mocked(db.room.update).mockResolvedValue({ ...mockRoom, status: "DIRTY" } as any);

      const result = await updateRoomStatusAction("room-1", "DIRTY");

      expect(result.success).toBe(true);
      expect(result.room.status).toBe("DIRTY");
      expect(db.room.update).toHaveBeenCalledWith({
        where: { id: "room-1" },
        data: { status: "DIRTY" },
      });
    });

    it("should successfully create a housekeeping cleaning task", async () => {
      const mockTask = { id: "task-1", roomId: "room-1", status: "PENDING", priority: "HIGH" };
      vi.mocked(mockTx.housekeepingTask.create).mockResolvedValue(mockTask as any);

      const result = await createHousekeepingTaskAction({
        roomId: "room-1",
        assignedTo: "Amit Kumar",
        priority: "HIGH",
        notes: "Checkout room",
      });

      expect(result.success).toBe(true);
      expect(result.task.id).toBe("task-1");
      expect(mockTx.housekeepingTask.create).toHaveBeenCalled();
    });

    it("should successfully complete a housekeeping task and mark room available", async () => {
      const mockTask = { id: "task-1", roomId: "room-1", status: "IN_PROGRESS" };
      vi.mocked(mockTx.housekeepingTask.findUnique).mockResolvedValue(mockTask as any);
      vi.mocked(mockTx.housekeepingTask.update).mockResolvedValue({ ...mockTask, status: "COMPLETED" } as any);
      vi.mocked(mockTx.reservation.findFirst).mockResolvedValue(null as any); // no guest in-house

      const result = await updateHousekeepingTaskAction("task-1", "COMPLETED");

      expect(result.success).toBe(true);
      expect(result.task.status).toBe("COMPLETED");
      expect(mockTx.room.update).toHaveBeenCalledWith({
        where: { id: "room-1" },
        data: { status: "AVAILABLE" },
      });
    });

    it("should successfully log maintenance request and mark room Out Of Service", async () => {
      const mockLog = { id: "log-1", roomId: "room-1", issue: "Broken flushing", isOutOfService: true };
      vi.mocked(mockTx.maintenanceLog.create).mockResolvedValue(mockLog as any);

      const result = await createMaintenanceLogAction({
        roomId: "room-1",
        issue: "Broken flushing",
        priority: "HIGH",
        isOutOfService: true,
      });

      expect(result.success).toBe(true);
      expect(result.log.id).toBe("log-1");
      expect(mockTx.room.update).toHaveBeenCalledWith({
        where: { id: "room-1" },
        data: { status: "OUT_OF_SERVICE" },
      });
    });

    it("should resolve maintenance request and return room to Dirty status", async () => {
      const mockLog = { id: "log-1", roomId: "room-1", isOutOfService: true, status: "REPORTED" };
      vi.mocked(mockTx.maintenanceLog.findUnique).mockResolvedValue(mockLog as any);
      vi.mocked(mockTx.maintenanceLog.update).mockResolvedValue({ ...mockLog, status: "RESOLVED" } as any);
      vi.mocked(mockTx.reservation.findFirst).mockResolvedValue(null as any); // no guest checked in

      const result = await resolveMaintenanceLogAction("log-1");

      expect(result.success).toBe(true);
      expect(result.log.status).toBe("RESOLVED");
      expect(mockTx.room.update).toHaveBeenCalledWith({
        where: { id: "room-1" },
        data: { status: "DIRTY" },
      });
    });
  });

  describe("Reports & Analytics Operations", () => {
    it("should compute hotel financial analytics summary correctly", async () => {
      vi.mocked(db.room.count).mockResolvedValue(10);
      
      const mockReservations = [
        {
          id: "res-1",
          checkIn: new Date("2026-09-01"),
          checkOut: new Date("2026-09-05"), // 4 nights stay
          status: "CHECKED_IN",
        },
      ];
      vi.mocked(db.reservation.findMany).mockResolvedValue(mockReservations as any);

      const mockCharges = [
        { type: "ROOM_RATE", amount: 8000, taxAmount: 960 },
        { type: "ROOM_SERVICE", amount: 1500, taxAmount: 180 },
      ];
      vi.mocked(db.folioCharge.findMany).mockResolvedValue(mockCharges as any);

      const mockPayments = [
        { type: "PAYMENT", amount: 9500 },
      ];
      vi.mocked(db.folioPayment.findMany).mockResolvedValue(mockPayments as any);

      const mockExpenses = [
        { amount: 2000, category: "UTILITIES" },
      ];
      vi.mocked(db.expense.findMany).mockResolvedValue(mockExpenses as any);

      const result = await getAnalyticsReportAction("prop-1", "2026-09-01", "2026-09-10"); // 10 days range

      expect(result.success).toBe(true);
      expect(result.summary.occupancyRate).toBe(4); // 4 occupied nights / 100 possible room nights * 100 = 4%
      expect(result.summary.adr).toBe(2000); // 8000 / 4 occupied nights = 2000 ADR
      expect(result.summary.revpar).toBe(80); // 8000 / 100 possible room nights = 80 RevPAR
      expect(result.summary.netRevenue).toBe(9500); // payments - refunds
      expect(result.summary.netProfit).toBe(7500); // 9500 revenue - 2000 expenses = 7500 profit
    });

    it("should successfully log a property expense", async () => {
      const mockExpense = { id: "exp-1", amount: 1500, category: "MAINTENANCE" };
      vi.mocked(db.expense.create).mockResolvedValue(mockExpense as any);

      const result = await createExpenseAction({
        propertyId: "prop-1",
        amount: 1500,
        category: "MAINTENANCE",
        description: "Bulb replacements",
        date: "2026-09-01",
      });

      expect(result.success).toBe(true);
      expect(result.expense.id).toBe("exp-1");
      expect(db.expense.create).toHaveBeenCalled();
    });
  });

  describe("Restaurant POS Operations", () => {
    it("should successfully add a MenuItem to the property catalog", async () => {
      const mockItem = { id: "menu-1", name: "Butter Chicken", price: 450, category: "MAIN_COURSE" };
      vi.mocked(db.menuItem.create).mockResolvedValue(mockItem as any);

      const result = await createMenuItemAction({
        propertyId: "prop-1",
        name: "Butter Chicken",
        description: "Signature Punjabi dish",
        price: 450,
        category: "MAIN_COURSE",
      });

      expect(result.success).toBe(true);
      expect(result.menuItem.id).toBe("menu-1");
      expect(db.menuItem.create).toHaveBeenCalled();
    });

    it("should successfully register a restaurant table", async () => {
      const mockTable = { id: "table-1", number: "Table 1", capacity: 4 };
      vi.mocked(db.restaurantTable.create).mockResolvedValue(mockTable as any);

      const result = await createRestaurantTableAction({
        propertyId: "prop-1",
        number: "Table 1",
        capacity: 4,
      });

      expect(result.success).toBe(true);
      expect(result.table.id).toBe("table-1");
      expect(db.restaurantTable.create).toHaveBeenCalled();
    });

    it("should successfully submit a restaurant order ticket and set table occupied", async () => {
      vi.mocked(mockTx.menuItem.findMany).mockResolvedValue([
        { id: "menu-1", price: 450, name: "Butter Chicken" },
      ] as any);

      const mockOrder = { id: "order-1", totalAmount: 900, status: "PENDING" };
      vi.mocked(mockTx.restaurantOrder.create).mockResolvedValue(mockOrder as any);

      const result = await createRestaurantOrderAction({
        propertyId: "prop-1",
        tableId: "table-1",
        items: [{ menuItemId: "menu-1", quantity: 2 }],
      });

      expect(result.success).toBe(true);
      expect(result.order.id).toBe("order-1");
      expect(mockTx.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: "table-1" },
        data: { status: "OCCUPIED" },
      });
    });

    it("should charge restaurant order total to hotel guest's room folio", async () => {
      const mockReservation = { id: "res-1", status: "CHECKED_IN" };
      vi.mocked(mockTx.reservation.findUnique).mockResolvedValue(mockReservation as any);

      const mockOrder = { id: "order-1", totalAmount: 900, tableId: "table-1" };
      vi.mocked(mockTx.restaurantOrder.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(mockTx.folio.findUnique).mockResolvedValue({ id: "folio-1" } as any);

      const result = await chargeOrderToRoomFolioAction("order-1", "res-1");

      expect(result.success).toBe(true);
      expect(mockTx.folioCharge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "RESTAURANT",
            amount: 900,
          }),
        })
      );
      expect(mockTx.restaurantOrder.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          status: "SERVED",
          paymentStatus: "ROOM_CHARGE",
          reservationId: "res-1",
        },
      });
      expect(mockTx.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: "table-1" },
        data: { status: "AVAILABLE" },
      });
    });
  });

  describe("Inventory & Suppliers Operations", () => {
    it("should successfully register a supplier", async () => {
      const mockSupplier = { id: "sup-1", name: "Metro Wholesale" };
      vi.mocked(db.supplier.create).mockResolvedValue(mockSupplier as any);

      const result = await createSupplierAction({
        propertyId: "prop-1",
        name: "Metro Wholesale",
        contactName: "Bimal Sen",
      });

      expect(result.success).toBe(true);
      expect(result.supplier.id).toBe("sup-1");
      expect(db.supplier.create).toHaveBeenCalled();
    });

    it("should successfully register a new inventory SKU", async () => {
      const mockItem = { id: "item-1", name: "Soaps", sku: "SOAP-01", quantity: 50 };
      vi.mocked(db.inventoryItem.create).mockResolvedValue(mockItem as any);

      const result = await createInventoryItemAction({
        propertyId: "prop-1",
        name: "Soaps",
        sku: "SOAP-01",
        category: "TOILETRIES",
        quantity: 50,
        minQuantity: 10,
        unitCost: 15,
      });

      expect(result.success).toBe(true);
      expect(result.item.id).toBe("item-1");
      expect(db.inventoryItem.create).toHaveBeenCalled();
    });

    it("should log stock purchase and automatically post property expense", async () => {
      vi.mocked(mockTx.inventoryItem.findUnique).mockResolvedValue({
        id: "item-1",
        propertyId: "prop-1",
        name: "Bath towels",
      } as any);

      const mockTxRecord = { id: "tx-1", quantity: 20, type: "PURCHASE", cost: 4000 };
      vi.mocked(mockTx.stockTransaction.create).mockResolvedValue(mockTxRecord as any);

      const result = await logStockTransactionAction({
        inventoryItemId: "item-1",
        type: "PURCHASE",
        quantity: 20,
        supplierId: "sup-1",
        cost: 4000,
        logAsExpense: true,
      });

      expect(result.success).toBe(true);
      expect(result.transaction.id).toBe("tx-1");
      expect(mockTx.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { quantity: { increment: 20 } },
      });
      expect(mockTx.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 4000,
            category: "INVENTORY",
          }),
        })
      );
    });
  });

  describe("Events & Banquets Operations", () => {
    it("should successfully register a banquet space", async () => {
      const mockHall = { id: "hall-1", name: "Royal Ballroom", capacity: 200 };
      vi.mocked(db.banquetHall.create).mockResolvedValue(mockHall as any);

      const result = await createBanquetHallAction({
        propertyId: "prop-1",
        name: "Royal Ballroom",
        capacity: 200,
        basePrice: 25000,
      });

      expect(result.success).toBe(true);
      expect(result.hall.id).toBe("hall-1");
      expect(db.banquetHall.create).toHaveBeenCalled();
    });

    it("should successfully reserve banquet space when no overlaps exist", async () => {
      vi.mocked(mockTx.eventBooking.findFirst).mockResolvedValue(null as any);

      const mockBooking = { id: "booking-1", eventName: "Corporate Seminar", totalAmount: 25000 };
      vi.mocked(mockTx.eventBooking.create).mockResolvedValue(mockBooking as any);

      const result = await createEventBookingAction({
        propertyId: "prop-1",
        hallId: "hall-1",
        eventName: "Corporate Seminar",
        contactName: "Sunil Dutt",
        contactPhone: "9876543210",
        contactEmail: "sunil@tata.com",
        startDateTime: "2026-10-01T10:00:00.000Z",
        endDateTime: "2026-10-01T18:00:00.000Z",
        paxCount: 100,
        totalAmount: 25000,
      });

      expect(result.success).toBe(true);
      expect(result.booking.id).toBe("booking-1");
      expect(mockTx.eventBooking.create).toHaveBeenCalled();
    });

    it("should throw overlap conflict warning if hall is already reserved", async () => {
      vi.mocked(mockTx.eventBooking.findFirst).mockResolvedValue({
        id: "conflict-booking",
        eventName: "Wedding Party",
        startDateTime: new Date(),
        endDateTime: new Date(),
      } as any);

      await expect(
        createEventBookingAction({
          propertyId: "prop-1",
          hallId: "hall-1",
          eventName: "Corporate Seminar",
          contactName: "Sunil Dutt",
          contactPhone: "9876543210",
          contactEmail: "sunil@tata.com",
          startDateTime: "2026-10-01T10:00:00.000Z",
          endDateTime: "2026-10-01T18:00:00.000Z",
          paxCount: 100,
          totalAmount: 25000,
        })
      ).rejects.toThrow("overlaps with event");
    });

    it("should charge event billing total to guest room folio statement", async () => {
      const mockReservation = { id: "res-1", status: "CHECKED_IN" };
      vi.mocked(mockTx.reservation.findUnique).mockResolvedValue(mockReservation as any);

      const mockBooking = { id: "booking-1", eventName: "Corporate Seminar", totalAmount: 25000, hall: { name: "Ballroom" } };
      vi.mocked(mockTx.eventBooking.findUnique).mockResolvedValue(mockBooking as any);
      vi.mocked(mockTx.folio.findUnique).mockResolvedValue({ id: "folio-1" } as any);

      const result = await chargeEventToGuestFolioAction("booking-1", "res-1");

      expect(result.success).toBe(true);
      expect(mockTx.folioCharge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "OTHER",
            amount: 25000,
          }),
        })
      );
      expect(mockTx.eventBooking.update).toHaveBeenCalledWith({
        where: { id: "booking-1" },
        data: {
          status: "COMPLETED",
          paymentStatus: "ROOM_CHARGE",
        },
      });
    });
  });

  describe("Spa & Wellness Operations", () => {
    it("should successfully register a spa service", async () => {
      const mockService = { id: "service-1", name: "Swedish Massage", duration: 60, price: 2500 };
      vi.mocked(db.spaService.create).mockResolvedValue(mockService as any);

      const result = await createSpaServiceAction({
        propertyId: "prop-1",
        name: "Swedish Massage",
        duration: 60,
        price: 2500,
      });

      expect(result.success).toBe(true);
      expect(result.service.id).toBe("service-1");
      expect(db.spaService.create).toHaveBeenCalled();
    });

    it("should successfully register a therapist", async () => {
      const mockTherapist = { id: "t-1", name: "Jenny Adams", specialization: "Reflexology" };
      vi.mocked(db.therapist.create).mockResolvedValue(mockTherapist as any);

      const result = await createTherapistAction({
        propertyId: "prop-1",
        name: "Jenny Adams",
        specialization: "Reflexology",
      });

      expect(result.success).toBe(true);
      expect(result.therapist.id).toBe("t-1");
      expect(db.therapist.create).toHaveBeenCalled();
    });

    it("should reserve spa slot when therapist is free", async () => {
      vi.mocked(mockTx.spaService.findUnique).mockResolvedValue({ id: "service-1", price: 2500, duration: 60 } as any);
      vi.mocked(mockTx.spaBooking.findMany).mockResolvedValue([]); // no active bookings

      const mockBooking = { id: "b-1", contactName: "Amit Sen", totalAmount: 2500 };
      vi.mocked(mockTx.spaBooking.create).mockResolvedValue(mockBooking as any);

      const result = await createSpaBookingAction({
        propertyId: "prop-1",
        serviceId: "service-1",
        therapistId: "t-1",
        contactName: "Amit Sen",
        contactPhone: "9876543210",
        bookingDateTime: "2026-11-01T10:00:00.000Z",
      });

      expect(result.success).toBe(true);
      expect(result.booking.id).toBe("b-1");
      expect(mockTx.spaBooking.create).toHaveBeenCalled();
    });

    it("should prevent spa booking if therapist has overlapping appointment", async () => {
      vi.mocked(mockTx.spaService.findUnique).mockResolvedValue({ id: "service-1", price: 2500, duration: 60 } as any);
      vi.mocked(mockTx.spaBooking.findMany).mockResolvedValue([
        {
          id: "active-b",
          bookingDateTime: new Date("2026-11-01T10:30:00.000Z"), // overlaps 10:00 to 11:00 slot
          service: { duration: 60 },
        },
      ] as any);

      await expect(
        createSpaBookingAction({
          propertyId: "prop-1",
          serviceId: "service-1",
          therapistId: "t-1",
          contactName: "Amit Sen",
          contactPhone: "9876543210",
          bookingDateTime: "2026-11-01T10:00:00.000Z",
        })
      ).rejects.toThrow("Therapist assignment conflict");
    });

    it("should charge spa treatment to checked-in hotel guest room folio", async () => {
      const mockReservation = { id: "res-1", status: "CHECKED_IN" };
      vi.mocked(mockTx.reservation.findUnique).mockResolvedValue(mockReservation as any);

      const mockBooking = { id: "b-1", totalAmount: 2500, service: { name: "Swedish Massage" } };
      vi.mocked(mockTx.spaBooking.findUnique).mockResolvedValue(mockBooking as any);
      vi.mocked(mockTx.folio.findUnique).mockResolvedValue({ id: "folio-1" } as any);

      const result = await chargeSpaToGuestFolioAction("b-1", "res-1");

      expect(result.success).toBe(true);
      expect(mockTx.folioCharge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "SPA",
            amount: 2500,
          }),
        })
      );
      expect(mockTx.spaBooking.update).toHaveBeenCalledWith({
        where: { id: "b-1" },
        data: {
          status: "COMPLETED",
          paymentStatus: "ROOM_CHARGE",
        },
      });
    });
  });

  describe("Night Audit Close & Date Roll Operations", () => {
    it("should successfully fetch audit status details with pending counts", async () => {
      const mockProperty = { id: "prop-1", businessDate: new Date("2026-08-10T00:00:00.000Z") };
      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);
      vi.mocked(db.reservation.findMany).mockResolvedValue([]);

      const result = await getAuditStatusAction("prop-1");

      expect(result.success).toBe(true);
      expect(result.stats.pendingDeparturesCount).toBe(0);
      expect(result.stats.pendingArrivalsCount).toBe(0);
      expect(db.property.findUnique).toHaveBeenCalledWith({ where: { id: "prop-1" } });
    });

    it("should process rollover, sweep no-shows, post room rate charges, and write log in transaction", async () => {
      const mockProperty = { id: "prop-1", businessDate: new Date("2026-08-10T00:00:00.000Z") };
      vi.mocked(mockTx.property.findUnique).mockResolvedValue(mockProperty as any);
      
      // Sweep No-Shows: mock return value for confirmed reservations due on/before Aug 10
      vi.mocked(mockTx.reservation.findMany)
        .mockResolvedValueOnce([{ id: "res-noshow", totalPrice: 3000, checkIn: new Date("2026-08-10"), checkOut: new Date("2026-08-11") }] as any) // first call inside runNightAuditAction (noShows)
        .mockResolvedValueOnce([{ id: "res-active", totalPrice: 4000, checkIn: new Date("2026-08-09"), checkOut: new Date("2026-08-11"), room: { number: "101" } }] as any); // second call (activeStays)

      vi.mocked(mockTx.folio.findUnique).mockResolvedValue({ id: "folio-active" } as any);
      vi.mocked(mockTx.folioCharge.findFirst).mockResolvedValue(null as any); // no previous room rate posted today
      vi.mocked(mockTx.folioPayment.findMany).mockResolvedValue([]);
      vi.mocked(mockTx.expense.findMany).mockResolvedValue([]);

      const mockAuditLog = { id: "log-1", propertyId: "prop-1", noShowsProcessed: 1, totalRoomCharges: 2000 };
      vi.mocked(mockTx.nightAuditLog.create).mockResolvedValue(mockAuditLog as any);

      const result = await runNightAuditAction("prop-1", "rahul@hotel.com");

      expect(result.success).toBe(true);
      expect(result.auditLog.id).toBe("log-1");
      expect(mockTx.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "res-noshow" },
          data: { status: "NO_SHOW" },
        })
      );
      expect(mockTx.folioCharge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "ROOM_RATE",
            amount: 2000, // 4000 total price / 2 nights
          }),
        })
      );
      expect(mockTx.property.update).toHaveBeenCalled();
      expect(mockTx.nightAuditLog.create).toHaveBeenCalled();
    });
  });

  describe("Seasonal Rates & Rate Plans Engine", () => {
    it("should successfully register a rate plan in the catalog", async () => {
      const mockPlan = { id: "rp-1", name: "Non-Refundable", code: "NON_REF", modifierType: "PERCENTAGE", modifierValue: -10 };
      vi.mocked(db.ratePlan.create).mockResolvedValue(mockPlan as any);

      const result = await createRatePlanAction({
        propertyId: "prop-1",
        name: "Non-Refundable",
        code: "NON_REF",
        modifierType: "PERCENTAGE",
        modifierValue: -10,
      });

      expect(result.success).toBe(true);
      expect(result.ratePlan.code).toBe("NON_REF");
      expect(db.ratePlan.create).toHaveBeenCalled();
    });

    it("should successfully register a seasonal calendar window", async () => {
      const mockSeason = { id: "s-1", name: "Peak Winter", startDate: new Date("2026-12-20"), endDate: new Date("2026-12-31"), modifierType: "PERCENTAGE", modifierValue: 25 };
      vi.mocked(db.season.create).mockResolvedValue(mockSeason as any);

      const result = await createSeasonAction({
        propertyId: "prop-1",
        name: "Peak Winter",
        startDate: "2026-12-20",
        endDate: "2026-12-31",
        modifierType: "PERCENTAGE",
        modifierValue: 25,
      });

      expect(result.success).toBe(true);
      expect(result.season.name).toBe("Peak Winter");
      expect(db.season.create).toHaveBeenCalled();
    });

    it("should calculate correct stay pricing with seasonal markup and rate plan discounts", async () => {
      // Mock standard room type
      vi.mocked(db.roomType.findUnique).mockResolvedValue({ id: "rt-std", name: "Standard Room", basePrice: 2000 } as any);
      
      // Mock Non-Refundable rate plan
      vi.mocked(db.ratePlan.findUnique).mockResolvedValue({ id: "rp-nonref", name: "Non-Refundable", modifierType: "PERCENTAGE", modifierValue: -10 } as any);
      
      // Mock Peak Winter Season
      vi.mocked(db.season.findMany).mockResolvedValue([
        { id: "s-peak", name: "Peak Winter", startDate: new Date("2026-12-20"), endDate: new Date("2026-12-31"), modifierType: "PERCENTAGE", modifierValue: 25, isActive: true },
      ] as any);

      // 2 nights stay: Dec 24 to Dec 26
      const result = await calculateStayPriceAction(
        "prop-1",
        "rt-std",
        "rp-nonref",
        "2026-12-24",
        "2026-12-26"
      );

      expect(result.success).toBe(true);
      expect(result.nights).toBe(2);
      
      // Verification:
      // Base: 2000
      // Season Peak Winter: +25% -> 2500
      // Rate Plan Non-Refundable: -10% -> 2250
      // Total: 2250 * 2 = 4500
      // Tax: 4500 * 0.12 = 540
      expect(result.totalPrice).toBe(4500);
      expect(result.taxAmount).toBe(540);
      expect(result.dailyBreakdown.length).toBe(2);
      expect(result.dailyBreakdown[0].seasonName).toBe("Peak Winter");
      expect(result.dailyBreakdown[0].finalPrice).toBe(2250);
    });
  });

  describe("Corporate Contracts & Guest Profiles Engine", () => {
    it("should successfully register a corporate company profile", async () => {
      const mockCompany = { id: "comp-1", name: "Google India", taxId: "12345", discountPercent: 15 };
      vi.mocked(db.company.create).mockResolvedValue(mockCompany as any);

      const result = await createCompanyAction({
        propertyId: "prop-1",
        name: "Google India",
        taxId: "12345",
        discountPercent: 15,
      });

      expect(result.success).toBe(true);
      expect(result.company.name).toBe("Google India");
      expect(db.company.create).toHaveBeenCalled();
    });

    it("should successfully associate employee guest profile to company account", async () => {
      const mockGuest = { id: "guest-1", firstName: "Rahul", companyId: "comp-1" };
      vi.mocked(db.guest.update).mockResolvedValue(mockGuest as any);

      const result = await linkGuestToCompanyAction("guest-1", "comp-1");

      expect(result.success).toBe(true);
      expect(result.guest.companyId).toBe("comp-1");
      expect(db.guest.update).toHaveBeenCalledWith({
        where: { id: "guest-1" },
        data: { companyId: "comp-1" },
      });
    });

    it("should apply corporate stay discount percentage to stay price quote", async () => {
      // Mock room type
      vi.mocked(db.roomType.findUnique).mockResolvedValue({ id: "rt-std", name: "Standard Room", basePrice: 2000 } as any);
      
      // Mock no seasons
      vi.mocked(db.season.findMany).mockResolvedValue([]);

      // Mock Corporate client with 15% discount
      vi.mocked(db.company.findUnique).mockResolvedValue({ id: "comp-1", name: "Google India", discountPercent: 15 } as any);

      // 2 nights stay: Dec 24 to Dec 26
      const result = await calculateStayPriceAction(
        "prop-1",
        "rt-std",
        null,
        "2026-12-24",
        "2026-12-26",
        "comp-1"
      );

      expect(result.success).toBe(true);
      expect(result.nights).toBe(2);
      
      // Base: 2000 * 2 = 4000
      // Corporate discount: 15% of 4000 = 600
      // Net room charges: 4000 - 600 = 3400
      // Tax: 3400 * 12% = 408
      expect(result.totalPrice).toBe(3400);
      expect(result.corporateDiscountAmount).toBe(600);
      expect(result.taxAmount).toBe(408);
    });
  });

  describe("AI Assistant & Copilot Operations Engine", () => {
    it("should generate financial report executive summary", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue({ id: "prop-1", name: "Grand Horizon" } as any);
      vi.mocked(db.room.count).mockResolvedValue(10);
      vi.mocked(db.reservation.count).mockResolvedValue(5);
      vi.mocked(db.folioPayment.findMany).mockResolvedValue([{ amount: 10000, type: "PAYMENT" }] as any);
      vi.mocked(db.expense.findMany).mockResolvedValue([{ amount: 2000 }] as any);

      const result = await generateReportSummaryAction("prop-1", "FINANCIAL");

      expect(result.success).toBe(true);
      expect(result.summary).toContain("Grand Horizon");
      expect(result.summary).toContain("10,000");
      expect(result.summary).toContain("2,000");
    });

    it("should draft personalized welcome email template for in-house guest", async () => {
      vi.mocked(db.reservation.findUnique).mockResolvedValue({
        id: "res-1",
        checkIn: new Date("2026-08-10"),
        checkOut: new Date("2026-08-15"),
        totalPrice: 8000,
        guests: [{ firstName: "Rahul", lastName: "Sharma", email: "rahul@example.com" }],
        room: { number: "101", roomType: { name: "Deluxe Suite" } },
        property: { name: "Grand Horizon" },
      } as any);

      const result = await generateGuestEmailAction("res-1", "WELCOME");

      expect(result.success).toBe(true);
      expect(result.email.recipient).toBe("rahul@example.com");
      expect(result.email.subject).toContain("Welcome");
      expect(result.email.body).toContain("Rahul Sharma");
      expect(result.email.body).toContain("Room 101");
    });

    it("should respond to conversational pms assistant occupancy query", async () => {
      vi.mocked(db.room.count).mockResolvedValue(20);
      vi.mocked(db.reservation.count).mockResolvedValue(10);

      const result = await askAICopilotAction("prop-1", "What is our occupancy today?");

      expect(result.success).toBe(true);
      expect(result.answer).toContain("50% occupancy");
      expect(result.answer).toContain("10 checked-in rooms");
    });
  });

  describe("System Settings & Enterprise Hardening Engine", () => {
    it("should successfully schedule a staff shift", async () => {
      const mockShift = { id: "shift-1", roleName: "FRONT_DESK", startTime: new Date("2026-08-11T08:00:00Z") };
      vi.mocked(db.shift.create).mockResolvedValue(mockShift as any);

      const result = await createShiftAction({
        propertyId: "prop-1",
        userId: "user-1",
        roleName: "FRONT_DESK",
        startTime: "2026-08-11T08:00:00Z",
        endTime: "2026-08-11T16:00:00Z",
      });

      expect(result.success).toBe(true);
      expect(result.shift.roleName).toBe("FRONT_DESK");
      expect(db.shift.create).toHaveBeenCalled();
    });

    it("should fetch system audit activity logs", async () => {
      vi.mocked(db.auditLog.findMany).mockResolvedValue([
        { id: "log-1", action: "GUEST_CHECKIN", details: "Rahul check-in", performedBy: "Front Desk Staff" },
      ] as any);

      const result = await getSystemAuditLogsAction("prop-1");

      expect(result.success).toBe(true);
      expect(result.logs.length).toBe(1);
      expect(result.logs[0].action).toBe("GUEST_CHECKIN");
    });

    it("should register a developer webhook subscription endpoint", async () => {
      const mockWebhook = { id: "web-1", targetUrl: "https://example.com/hooks" };
      vi.mocked(db.webhookSubscription.create).mockResolvedValue(mockWebhook as any);

      const result = await createWebhookSubscriptionAction({
        propertyId: "prop-1",
        targetUrl: "https://example.com/hooks",
        eventTypes: "guest.checkin",
      });

      expect(result.success).toBe(true);
      expect(result.webhook.targetUrl).toBe("https://example.com/hooks");
    });

    it("should generate a secure REST API key token", async () => {
      const mockApiKey = { id: "key-1", name: "OTA link", token: "hos_live_12345" };
      vi.mocked(db.apiKey.create).mockResolvedValue(mockApiKey as any);

      const result = await createApiKeyAction({
        propertyId: "prop-1",
        name: "OTA link",
      });

      expect(result.success).toBe(true);
      expect(result.apiKey.token).toContain("hos_live_");
    });
  });

  describe("Role-Based Access Control (RBAC) Checks", () => {
    const hasPermission = (activeRole: string, allowedRoles?: string[]) => {
      if (!allowedRoles || allowedRoles.length === 0) return true;
      return allowedRoles.includes(activeRole);
    };

    it("should allow any role if no roles are explicitly allowed", () => {
      expect(hasPermission("HOUSEKEEPER")).toBe(true);
      expect(hasPermission("MANAGER", [])).toBe(true);
    });

    it("should allow matching role", () => {
      expect(hasPermission("MANAGER", ["MANAGER", "FRONT_DESK"])).toBe(true);
      expect(hasPermission("FRONT_DESK", ["MANAGER", "FRONT_DESK"])).toBe(true);
    });

    it("should reject non-matching role", () => {
      expect(hasPermission("HOUSEKEEPER", ["MANAGER", "FRONT_DESK"])).toBe(false);
      expect(hasPermission("SPA_THERAPIST", ["MANAGER"])).toBe(false);
    });
  });
});

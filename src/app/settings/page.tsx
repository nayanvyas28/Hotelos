"use client";

import { useState, useEffect } from "react";
import {
  getPropertiesAction,
  createPropertyByOwnerAction,
  registerOrganizationStaffAction,
  getPropertyRoomDetailsAction,
  createSingleRoomAction,
  createSingleRoomTypeAction,
  createSingleFloorAction,
} from "@/app/actions/property";
import { useSession } from "@/context/SessionContext";
import {
  getStaffMembersAction,
  createShiftAction,
  getShiftsAction,
  getSystemAuditLogsAction,
  createWebhookSubscriptionAction,
  getWebhookSubscriptionsAction,
  createApiKeyAction,
  getApiKeysAction,
} from "@/app/actions/system";
import {
  Hotel,
  Shield,
  Clock,
  History,
  Terminal,
  Plus,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Users,
  CheckCircle,
  Copy,
  Code,
  Key,
  Bed,
  Layers,
  Building2,
  X,
  Check,
  UserPlus,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";

const PRESET_ROOM_CATEGORIES = [
  { name: "Deluxe Room", code: "DLX", price: 4000, capacity: 2, beds: 1 },
  { name: "Standard Room", code: "STD", price: 2500, capacity: 2, beds: 1 },
  { name: "Executive Suite", code: "EXE", price: 7500, capacity: 4, beds: 2 },
  { name: "Presidential Suite", code: "PRS", price: 15000, capacity: 4, beds: 2 },
  { name: "Family Villa / Suite", code: "FAM", price: 9000, capacity: 6, beds: 3 },
  { name: "Penthouse Suite", code: "PNT", price: 20000, capacity: 4, beds: 2 },
  { name: "Single Economy Room", code: "SGL", price: 1800, capacity: 1, beds: 1 },
  { name: "Twin Deluxe Room", code: "TWN", price: 4500, capacity: 2, beds: 2 },
  { name: "Honeymoon Ocean Suite", code: "HNM", price: 12000, capacity: 2, beds: 1 },
  { name: "Accessible Room", code: "ACC", price: 3000, capacity: 2, beds: 1 },
  { name: "CUSTOM", code: "", price: 3500, capacity: 2, beds: 1 },
];

export default function SettingsPage() {
  const { currentUser } = useSession();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [staff, setStaff] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  // Room Inventory States
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"ROOMS" | "ROSTER" | "LOGS" | "DEVELOPER" | "PROPERTIES">("ROSTER");

  // Modals
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isAddRoomTypeModalOpen, setIsAddRoomTypeModalOpen] = useState(false);
  const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false);
  const [isRegisterStaffModalOpen, setIsRegisterStaffModalOpen] = useState(false);

  // Room Form States
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomFloorId, setNewRoomFloorId] = useState("");
  const [newRoomTypeId, setNewRoomTypeId] = useState("");

  // Room Type Form States
  const [newRoomTypeName, setNewRoomTypeName] = useState("");
  const [newRoomTypeCode, setNewRoomTypeCode] = useState("");
  const [newRoomTypePrice, setNewRoomTypePrice] = useState(5000);
  const [newRoomTypeCapacity, setNewRoomTypeCapacity] = useState(2);
  const [newRoomTypeBeds, setNewRoomTypeBeds] = useState(1);

  // Floor Form States
  const [newFloorNumber, setNewFloorNumber] = useState(1);
  const [newFloorName, setNewFloorName] = useState("");

  // Add Hotel states
  const [newHotelName, setNewHotelName] = useState("");
  const [newHotelAddress, setNewHotelAddress] = useState("");

  // Staff registration form states
  const [newStaffFirstName, setNewStaffFirstName] = useState("");
  const [newStaffLastName, setNewStaffLastName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("HR_MANAGER");
  const [customRoleName, setCustomRoleName] = useState("");
  const [newStaffPropertyId, setNewStaffPropertyId] = useState("");

  // Shift & Integration form states
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [shiftRole, setShiftRole] = useState("Front Desk Agent");
  const [shiftStartTime, setShiftStartTime] = useState("");
  const [shiftEndTime, setShiftEndTime] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState("RESERVATION_CREATED");
  const [apiKeyName, setApiKeyName] = useState("");

  // Load properties on mount
  useEffect(() => {
    async function loadProperties() {
      try {
        const orgId = currentUser?.role === "SAAS_OWNER" ? undefined : currentUser?.organizationId;
        const res = await getPropertiesAction(orgId);
        if (res.success && res.properties.length > 0) {
          setProperties(res.properties);
          setSelectedPropertyId(res.properties[0].id);
          setNewStaffPropertyId(res.properties[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load property context.");
        setIsLoading(false);
      }
    }
    loadProperties();
  }, [currentUser]);

  // Load settings and room inventory data whenever property changes
  useEffect(() => {
    if (selectedPropertyId) {
      loadSettingsData();
    }
  }, [selectedPropertyId]);

  const loadSettingsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        staffRes,
        shiftRes,
        auditRes,
        webhookRes,
        apiKeysRes,
        roomDetailsRes,
      ] = await Promise.all([
        getStaffMembersAction(selectedPropertyId),
        getShiftsAction(selectedPropertyId),
        getSystemAuditLogsAction(selectedPropertyId),
        getWebhookSubscriptionsAction(selectedPropertyId),
        getApiKeysAction(selectedPropertyId),
        getPropertyRoomDetailsAction(selectedPropertyId),
      ]);

      if (staffRes.success) setStaff(staffRes.staff);
      if (shiftRes.success) setShifts(shiftRes.shifts);
      if (auditRes.success) setAuditLogs(auditRes.logs);
      if (webhookRes.success) setWebhooks(webhookRes.webhooks);
      if (apiKeysRes.success) setApiKeys(apiKeysRes.apiKeys);

      if (roomDetailsRes.success) {
        setRooms(roomDetailsRes.rooms || []);
        setRoomTypes(roomDetailsRes.roomTypes || []);
        setFloors(roomDetailsRes.floors || []);

        if (roomDetailsRes.floors.length > 0) setNewRoomFloorId(roomDetailsRes.floors[0].id);
        if (roomDetailsRes.roomTypes.length > 0) setNewRoomTypeId(roomDetailsRes.roomTypes[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch settings data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for Room Inventory Setup
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber || !newRoomFloorId || !newRoomTypeId || !selectedPropertyId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createSingleRoomAction({
        propertyId: selectedPropertyId,
        number: newRoomNumber,
        floorId: newRoomFloorId,
        roomTypeId: newRoomTypeId,
      });

      if (res.success) {
        setNewRoomNumber("");
        setIsAddRoomModalOpen(false);
        await loadSettingsData();
        alert("New Room added successfully!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to add room.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTypeName || !newRoomTypeCode || !newRoomTypePrice || !selectedPropertyId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createSingleRoomTypeAction({
        propertyId: selectedPropertyId,
        name: newRoomTypeName,
        code: newRoomTypeCode,
        basePrice: newRoomTypePrice,
        capacity: newRoomTypeCapacity,
        beds: newRoomTypeBeds,
      });

      if (res.success) {
        setNewRoomTypeName("");
        setNewRoomTypeCode("");
        setIsAddRoomTypeModalOpen(false);
        await loadSettingsData();
        alert("New Room Type created successfully!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to add room type.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorNumber || !selectedPropertyId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createSingleFloorAction({
        propertyId: selectedPropertyId,
        number: newFloorNumber,
        name: newFloorName || `Floor ${newFloorNumber}`,
      });

      if (res.success) {
        setNewFloorNumber((prev) => prev + 1);
        setNewFloorName("");
        setIsAddFloorModalOpen(false);
        await loadSettingsData();
        alert("New Floor added successfully!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to add floor.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handlers for Staff Roster & Shifts
  const handleScheduleShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !shiftRole || !shiftStartTime || !shiftEndTime) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createShiftAction({
        propertyId: selectedPropertyId,
        userId: selectedStaffId,
        roleName: shiftRole,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
      });

      if (res.success) {
        setShiftStartTime("");
        setShiftEndTime("");
        await loadSettingsData();
        alert("Shift scheduled successfully!");
      }
    } catch (err: any) {
      setError(err.message || "Failed to schedule shift.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreatePropertyByOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotelName || !currentUser?.organizationId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createPropertyByOwnerAction(
        newHotelName,
        newHotelAddress,
        currentUser.organizationId
      );

      if (res.success && res.property) {
        setNewHotelName("");
        setNewHotelAddress("");
        alert("New Hotel Property registered successfully!");
        
        const orgId = currentUser.role === "SAAS_OWNER" ? undefined : currentUser.organizationId;
        const propRes = await getPropertiesAction(orgId);
        if (propRes.success) {
          setProperties(propRes.properties);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create property.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail || !newStaffFirstName || !currentUser?.organizationId) return;

    const roleToAssign = newStaffRole === "CUSTOM" ? customRoleName.trim() : newStaffRole;
    if (!roleToAssign) {
      alert("Please specify a custom role name.");
      return;
    }

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await registerOrganizationStaffAction({
        firstName: newStaffFirstName,
        lastName: newStaffLastName,
        email: newStaffEmail,
        password: newStaffPassword,
        roleName: roleToAssign,
        organizationId: currentUser.organizationId,
        propertyId: newStaffPropertyId || undefined,
      });

      if (res.success) {
        setNewStaffFirstName("");
        setNewStaffLastName("");
        setNewStaffEmail("");
        setNewStaffPassword("");
        setIsRegisterStaffModalOpen(false);
        alert("Staff Account registered successfully!");
        await loadSettingsData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to register staff account.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createWebhookSubscriptionAction({
        propertyId: selectedPropertyId,
        targetUrl: webhookUrl,
        eventTypes: webhookEvents,
      });

      if (res.success) {
        setWebhookUrl("");
        await loadSettingsData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to subscribe webhook.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyName) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createApiKeyAction({
        propertyId: selectedPropertyId,
        name: apiKeyName,
      });

      if (res.success) {
        setApiKeyName("");
        await loadSettingsData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate API Key.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-app-bg text-text-primary">
      {/* 1. Sidebar Nav */}
      <Sidebar />

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="min-h-16 py-3 md:py-0 bg-surface border-b border-border-default px-4 md:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <span className="md:hidden font-bold text-primary mr-2">HotelOS</span>
            {properties.length > 0 && (
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="px-3 py-1.5 border border-border-default rounded bg-surface text-xs font-semibold text-text-secondary focus:outline-none"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏨 {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <HeaderStaffSwitcher />
            <button
              onClick={loadSettingsData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${isLoading || isActionLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MANAGER"]}>
            <>
              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-sm text-error flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm text-text-secondary">Loading Administration Desk...</p>
                </div>
              ) : properties.length === 0 ? (
                <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
                  <Hotel className="w-12 h-12 text-text-muted mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                    <p className="text-sm text-text-secondary">
                      Complete onboarding setup to begin configuring system parameters.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 font-sans">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-text-primary tracking-tight">System Settings & Administration</h1>
                      <p className="text-sm text-text-secondary">
                        Configure rooms, register staff accounts, manage shift schedules, and inspect live audit logs.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsRegisterStaffModalOpen(true)}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-4 h-4" /> Register Employee Account
                    </button>
                  </div>

                  {/* 5 Tabs */}
                  <div className="flex border-b border-border-default space-x-6 text-sm font-medium overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setActiveTab("ROSTER")}
                      className={`pb-3 relative transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "ROSTER"
                          ? "text-primary font-extrabold border-b-2 border-primary"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Staff Roster & Shift Schedules
                    </button>
                    <button
                      onClick={() => setActiveTab("ROOMS")}
                      className={`pb-3 relative transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === "ROOMS"
                          ? "text-primary font-extrabold border-b-2 border-primary"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <Bed className="w-4 h-4 text-primary" /> Room & Property Inventory ({rooms.length} Rooms)
                    </button>
                    <button
                      onClick={() => setActiveTab("LOGS")}
                      className={`pb-3 relative transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "LOGS"
                          ? "text-primary font-extrabold border-b-2 border-primary"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Activity Audit Logs ({auditLogs.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("DEVELOPER")}
                      className={`pb-3 relative transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "DEVELOPER"
                          ? "text-primary font-extrabold border-b-2 border-primary"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Developer Portal (API & Webhooks)
                    </button>
                    {(currentUser?.role === "MD" || currentUser?.role === "SAAS_OWNER") && (
                      <button
                        onClick={() => setActiveTab("PROPERTIES")}
                        className={`pb-3 relative transition-all cursor-pointer whitespace-nowrap ${
                          activeTab === "PROPERTIES"
                            ? "text-primary font-extrabold border-b-2 border-primary"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        Manage Organization Properties
                      </button>
                    )}
                  </div>

                  {/* TAB 1: STAFF ROSTER & SHIFT SCHEDULES */}
                  {activeTab === "ROSTER" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                        <div className="flex items-center justify-between border-b border-border-default pb-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold text-text-primary">Schedule Staff Shift</h3>
                          </div>
                          <button
                            onClick={() => setIsRegisterStaffModalOpen(true)}
                            className="text-[10px] text-primary font-extrabold hover:underline"
                          >
                            + New Staff
                          </button>
                        </div>

                        <form onSubmit={handleScheduleShift} className="space-y-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-bold text-text-secondary block">Select Employee</label>
                            <select
                              value={selectedStaffId}
                              onChange={(e) => setSelectedStaffId(e.target.value)}
                              className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                            >
                              <option value="">-- Choose Employee --</option>
                              {staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                  👤 {s.firstName} {s.lastName} ({s.email})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-text-secondary block">Assign Shift Role</label>
                            <select
                              value={shiftRole}
                              onChange={(e) => setShiftRole(e.target.value)}
                              className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                            >
                              <option value="Front Desk Agent">Front Desk Agent</option>
                              <option value="Housekeeping Staff">Housekeeping Staff</option>
                              <option value="General Manager">General Manager</option>
                              <option value="Finance Officer">Finance Officer</option>
                              <option value="Spa Therapist">Spa Therapist</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-text-secondary block">Shift Start Time</label>
                            <input
                              type="datetime-local"
                              required
                              value={shiftStartTime}
                              onChange={(e) => setShiftStartTime(e.target.value)}
                              className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-text-secondary block">Shift End Time</label>
                            <input
                              type="datetime-local"
                              required
                              value={shiftEndTime}
                              onChange={(e) => setShiftEndTime(e.target.value)}
                              className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isActionLoading}
                            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-small cursor-pointer"
                          >
                            + Schedule Shift
                          </button>
                        </form>
                      </div>

                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                          <div className="flex justify-between items-center border-b border-border-default pb-3">
                            <h3 className="text-sm font-bold text-text-primary">
                              Registered Employees Directory ({staff.length})
                            </h3>
                            <button
                              onClick={() => setIsRegisterStaffModalOpen(true)}
                              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-small flex items-center gap-1 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Register Employee
                            </button>
                          </div>
                          <div className="divide-y divide-border-default text-xs">
                            {staff.map((s) => (
                              <div key={s.id} className="py-2.5 flex justify-between items-center">
                                <div>
                                  <div className="font-bold text-text-primary">{s.firstName} {s.lastName}</div>
                                  <div className="text-[10px] text-text-muted">{s.email}</div>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase">
                                  {s.userRoles?.[0]?.role?.name || "Staff"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ROOM & PROPERTY INVENTORY SETUP */}
                  {activeTab === "ROOMS" && (
                    <div className="space-y-6">
                      {/* Action Bar */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-border-default p-4 rounded-lg shadow-small">
                        <div>
                          <h3 className="text-sm font-bold text-text-primary">Hotel Room & Physical Inventory Setup</h3>
                          <p className="text-xs text-text-secondary">Configure floors, room categories/rates, and individual guest rooms.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setIsAddFloorModalOpen(true)}
                            className="px-3 py-1.5 bg-surface border border-border-default hover:bg-surface-hover text-xs font-bold rounded shadow-small flex items-center gap-1.5 cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5 text-primary" /> + Add Floor
                          </button>
                          <button
                            onClick={() => setIsAddRoomTypeModalOpen(true)}
                            className="px-3 py-1.5 bg-surface border border-border-default hover:bg-surface-hover text-xs font-bold rounded shadow-small flex items-center gap-1.5 cursor-pointer"
                          >
                            <Building2 className="w-3.5 h-3.5 text-primary" /> + Add Room Type
                          </button>
                          <button
                            onClick={() => setIsAddRoomModalOpen(true)}
                            className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded shadow-small flex items-center gap-1.5 cursor-pointer"
                          >
                            <Bed className="w-3.5 h-3.5" /> + Add Room Number
                          </button>
                        </div>
                      </div>

                      {/* Room Inventory Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-surface border border-border-default rounded-lg shadow-small space-y-1">
                          <span className="text-[10px] font-bold text-text-muted uppercase">Total Configured Rooms</span>
                          <div className="text-2xl font-black text-text-primary">{rooms.length} Rooms</div>
                          <span className="text-[9px] text-success font-bold">100% Operational Inventory</span>
                        </div>

                        <div className="p-4 bg-surface border border-border-default rounded-lg shadow-small space-y-1">
                          <span className="text-[10px] font-bold text-text-muted uppercase">Room Categories / Types</span>
                          <div className="text-2xl font-black text-primary">{roomTypes.length} Categories</div>
                          <span className="text-[9px] text-text-secondary">Deluxe, Suite, Standard</span>
                        </div>

                        <div className="p-4 bg-surface border border-border-default rounded-lg shadow-small space-y-1">
                          <span className="text-[10px] font-bold text-text-muted uppercase">Configured Floors</span>
                          <div className="text-2xl font-black text-amber-500">{floors.length} Floors</div>
                          <span className="text-[9px] text-text-secondary">Floor 1 to Floor {floors.length}</span>
                        </div>
                      </div>

                      {/* Rooms Master Table */}
                      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                        <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3">
                          Configured Guest Rooms List
                        </h3>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                <th className="p-3">Room Number</th>
                                <th className="p-3">Floor</th>
                                <th className="p-3">Room Category</th>
                                <th className="p-3">Base Nightly Rate</th>
                                <th className="p-3">Housekeeping Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                              {rooms.map((r) => (
                                <tr key={r.id} className="hover:bg-surface-secondary/20">
                                  <td className="p-3 font-extrabold text-text-primary flex items-center gap-2">
                                    <Bed className="w-4 h-4 text-primary" /> Room {r.number}
                                  </td>
                                  <td className="p-3 font-semibold">{r.floor?.name || `Floor ${r.floor?.number}`}</td>
                                  <td className="p-3 font-bold text-text-primary">
                                    {r.roomType?.name} ({r.roomType?.code})
                                  </td>
                                  <td className="p-3 font-bold text-success font-mono">
                                    ₹{r.roomType?.basePrice?.toLocaleString()} / night
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded bg-success/10 text-success text-[10px] font-black uppercase">
                                      ● {r.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {rooms.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-text-muted italic">
                                    No rooms configured for this property yet. Click "+ Add Room Number" above to create rooms.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ACTIVITY AUDIT LOGS */}
                  {activeTab === "LOGS" && (
                    <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                      <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3">
                        System Activity & Governance Audit Logs
                      </h3>
                      <div className="divide-y divide-border-default text-xs">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="py-3 flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="font-bold text-primary block">{log.action}</span>
                              <p className="text-text-secondary">{log.details}</p>
                              <span className="text-[10px] text-text-muted block">By: {log.performedBy}</span>
                            </div>
                            <span className="text-[10px] text-text-muted font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        ))}
                        {auditLogs.length === 0 && (
                          <p className="py-8 text-center text-text-muted italic">No activity logs recorded yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: DEVELOPER PORTAL */}
                  {activeTab === "DEVELOPER" && (
                    <div className="space-y-6">
                      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                        <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3">API Keys</h3>
                        <form onSubmit={handleCreateApiKey} className="flex gap-3 text-xs">
                          <input
                            type="text"
                            required
                            placeholder="Key Name (e.g. Channel Manager Sync)"
                            value={apiKeyName}
                            onChange={(e) => setApiKeyName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                          />
                          <button type="submit" disabled={isActionLoading} className="px-4 py-2 bg-primary text-white font-bold rounded shadow-small cursor-pointer">
                            Generate API Key
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: MANAGE ORGANIZATION PROPERTIES & STAFF */}
                  {activeTab === "PROPERTIES" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Register New Property / Hotel Form */}
                      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                        <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                          <Hotel className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-bold text-text-primary">Register New Hotel Property</h3>
                        </div>

                        <form onSubmit={handleCreatePropertyByOwner} className="space-y-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-bold text-text-secondary block">Hotel Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Radisson Blu Mumbai"
                              value={newHotelName}
                              onChange={(e) => setNewHotelName(e.target.value)}
                              className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-text-secondary block">Property Address</label>
                            <input
                              type="text"
                              placeholder="e.g. Bandra Kurla Complex, Mumbai"
                              value={newHotelAddress}
                              onChange={(e) => setNewHotelAddress(e.target.value)}
                              className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isActionLoading}
                            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-small cursor-pointer"
                          >
                            + Register Property
                          </button>
                        </form>
                      </div>

                      {/* Register New Employee Account Form */}
                      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                        <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                          <UserPlus className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-bold text-text-primary">Register Employee Account</h3>
                        </div>

                        <form onSubmit={handleRegisterStaff} className="space-y-4 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-text-secondary block">First Name</label>
                              <input
                                type="text"
                                required
                                value={newStaffFirstName}
                                onChange={(e) => setNewStaffFirstName(e.target.value)}
                                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-text-secondary block">Last Name</label>
                              <input
                                type="text"
                                value={newStaffLastName}
                                onChange={(e) => setNewStaffLastName(e.target.value)}
                                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-text-secondary block">Login Email</label>
                              <input
                                type="email"
                                required
                                value={newStaffEmail}
                                onChange={(e) => setNewStaffEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-text-secondary block">Account Password</label>
                              <input
                                type="password"
                                placeholder="Default: Staff#2026"
                                value={newStaffPassword}
                                onChange={(e) => setNewStaffPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-text-secondary block">System Role</label>
                              <select
                                value={newStaffRole}
                                onChange={(e) => setNewStaffRole(e.target.value)}
                                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                              >
                                <option value="HR_MANAGER">👔 HR Manager (HR Operations)</option>
                                <option value="HR_COORDINATOR">📋 HR Coordinator / Recruiter</option>
                                <option value="GM">🏢 General Manager (GM)</option>
                                <option value="FRONT_DESK">🛎️ Front Desk Agent</option>
                                <option value="HOUSEKEEPER">🧹 Housekeeping Lead</option>
                                <option value="CFO">💰 Finance Controller (CFO)</option>
                                <option value="SPA_THERAPIST">💆 Spa & Wellness Therapist</option>
                                <option value="ENGINEERING">🔧 Engineering & Maintenance</option>
                                <option value="FB_STAFF">🍽️ Food & Beverage Executive</option>
                                <option value="CUSTOM">➕ + Add Custom Role / Designation...</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-text-secondary block">Assign Hotel</label>
                              <select
                                value={newStaffPropertyId}
                                onChange={(e) => setNewStaffPropertyId(e.target.value)}
                                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                              >
                                {properties.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    📍 {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {newStaffRole === "CUSTOM" && (
                            <div className="space-y-1 p-3 bg-primary/5 border border-primary/30 rounded-lg">
                              <label className="font-extrabold text-primary block text-xs">
                                ✏️ Enter Custom Role / Designation Title
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Chief Sommelier, Night Auditor, Executive Chef, Security Head"
                                value={customRoleName}
                                onChange={(e) => setCustomRoleName(e.target.value)}
                                className="w-full px-3 py-2 border border-primary rounded bg-surface text-text-primary font-bold focus:outline-none"
                              />
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isActionLoading}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded shadow-small cursor-pointer"
                          >
                            + Register Employee Account
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          </RoleProtected>
        </main>
      </div>

      {/* MODAL: Register Employee Account */}
      {isRegisterStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border-default pb-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Register New Employee Account
              </h3>
              <button onClick={() => setIsRegisterStaffModalOpen(false)} className="text-text-muted hover:text-text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">First Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffFirstName}
                    onChange={(e) => setNewStaffFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Last Name</label>
                  <input
                    type="text"
                    value={newStaffLastName}
                    onChange={(e) => setNewStaffLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Login Email</label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Account Password</label>
                  <input
                    type="password"
                    placeholder="Default: Staff#2026"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">System Role</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  >
                    <option value="HR_MANAGER">👔 HR Manager (HR Operations)</option>
                    <option value="HR_COORDINATOR">📋 HR Coordinator / Recruiter</option>
                    <option value="GM">🏢 General Manager (GM)</option>
                    <option value="FRONT_DESK">🛎️ Front Desk Agent</option>
                    <option value="HOUSEKEEPER">🧹 Housekeeping Lead</option>
                    <option value="CFO">💰 Finance Controller (CFO)</option>
                    <option value="SPA_THERAPIST">💆 Spa & Wellness Therapist</option>
                    <option value="ENGINEERING">🔧 Engineering & Maintenance</option>
                    <option value="FB_STAFF">🍽️ Food & Beverage Executive</option>
                    <option value="CUSTOM">➕ + Add Custom Role / Designation...</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Assign Hotel</label>
                  <select
                    value={newStaffPropertyId}
                    onChange={(e) => setNewStaffPropertyId(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        📍 {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newStaffRole === "CUSTOM" && (
                <div className="space-y-1 p-3 bg-primary/5 border border-primary/30 rounded-lg">
                  <label className="font-extrabold text-primary block text-xs">
                    ✏️ Enter Custom Role / Designation Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Sommelier, Night Auditor, Executive Chef, Security Head"
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    className="w-full px-3 py-2 border border-primary rounded bg-surface text-text-primary font-bold focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterStaffModalOpen(false)}
                  className="px-4 py-2 border border-border-default rounded hover:bg-surface-hover font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded shadow-small cursor-pointer"
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Room */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border-default pb-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Bed className="w-5 h-5 text-primary" /> Add New Guest Room
              </h3>
              <button onClick={() => setIsAddRoomModalOpen(false)} className="text-text-muted hover:text-text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Room Number / Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101, 202, 305"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Select Floor</label>
                <select
                  value={newRoomFloorId}
                  onChange={(e) => setNewRoomFloorId(e.target.value)}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                >
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      🏢 {f.name} (Floor {f.number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Select Room Category / Type</label>
                <select
                  value={newRoomTypeId}
                  onChange={(e) => setNewRoomTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      🛏️ {rt.name} ({rt.code}) — ₹{rt.basePrice}/night
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-4 py-2 border border-border-default rounded hover:bg-surface-hover font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-small cursor-pointer"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Room Type */}
      {isAddRoomTypeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border-default pb-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Create Room Category / Type
              </h3>
              <button onClick={() => setIsAddRoomTypeModalOpen(false)} className="text-text-muted hover:text-text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoomType} className="space-y-4 text-xs">
              {/* Prominent Category Dropdown Selection */}
              <div className="p-3 bg-primary/5 border border-primary/30 rounded-lg space-y-1.5">
                <label className="font-extrabold text-primary block text-xs uppercase tracking-wider">
                  🛏️ Select Room Category Preset
                </label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    const preset = PRESET_ROOM_CATEGORIES.find((p) => p.name === val);
                    if (preset && val !== "CUSTOM") {
                      setNewRoomTypeName(preset.name);
                      setNewRoomTypeCode(preset.code);
                      setNewRoomTypePrice(preset.price);
                      setNewRoomTypeCapacity(preset.capacity);
                      setNewRoomTypeBeds(preset.beds);
                    } else if (val === "CUSTOM") {
                      setNewRoomTypeName("");
                      setNewRoomTypeCode("");
                    }
                  }}
                  className="w-full px-3 py-2 border border-primary/40 rounded-md bg-surface text-text-primary font-bold text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="" disabled>-- Click to Select Category Preset --</option>
                  {PRESET_ROOM_CATEGORIES.filter((p) => p.name !== "CUSTOM").map((cat) => (
                    <option key={cat.code} value={cat.name}>
                      {cat.name} ({cat.code}) — ₹{cat.price.toLocaleString()} / night
                    </option>
                  ))}
                  <option value="CUSTOM">➕ + Add Custom Category...</option>
                </select>
                <p className="text-[10px] text-text-secondary">Selecting a category auto-populates the code and base rate below.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deluxe Room"
                    value={newRoomTypeName}
                    onChange={(e) => setNewRoomTypeName(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">
                    Category Code <span className="text-primary font-normal">(Auto-Selected)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DLX"
                    maxLength={5}
                    value={newRoomTypeCode}
                    onChange={(e) => setNewRoomTypeCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-bold font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Base Nightly Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={newRoomTypePrice}
                  onChange={(e) => setNewRoomTypePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Max Capacity (Pax)</label>
                  <input
                    type="number"
                    value={newRoomTypeCapacity}
                    onChange={(e) => setNewRoomTypeCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block">Beds Count</label>
                  <input
                    type="number"
                    value={newRoomTypeBeds}
                    onChange={(e) => setNewRoomTypeBeds(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoomTypeModalOpen(false)}
                  className="px-4 py-2 border border-border-default rounded hover:bg-surface-hover font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-small cursor-pointer"
                >
                  Create Room Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Floor */}
      {isAddFloorModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border-default pb-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Add Building Floor
              </h3>
              <button onClick={() => setIsAddFloorModalOpen(false)} className="text-text-muted hover:text-text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFloor} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Floor Number</label>
                <input
                  type="number"
                  required
                  value={newFloorNumber}
                  onChange={(e) => setNewFloorNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary block">Floor Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ground Floor, Executive Level 3"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFloorModalOpen(false)}
                  className="px-4 py-2 border border-border-default rounded hover:bg-surface-hover font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-small cursor-pointer"
                >
                  Add Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import {
  getRestaurantOverviewAction,
  createMenuItemAction,
  toggleMenuItemAvailabilityAction,
  createRestaurantTableAction,
  createRestaurantOrderAction,
  updateOrderStatusAction,
  settleOrderWithPaymentAction,
  chargeOrderToRoomFolioAction,
} from "@/app/actions/restaurant";
import { Hotel, KeyRound, Calendar as CalendarIcon, Users, Brush, BarChart3, Plus, Loader2, Utensils, Wrench, CheckCircle, Search, RefreshCw, ShoppingCart, ShieldAlert, Archive, Sparkles, HeartPulse } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";

export default function RestaurantPOS() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [checkedInStays, setCheckedInStays] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"TABLES" | "MENU" | "KITCHEN" | "ORDER">("TABLES");

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals / forms state
  const [isMenuFormOpen, setIsMenuFormOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "MAIN_COURSE",
  });

  const [isTableFormOpen, setIsTableFormOpen] = useState(false);
  const [tableForm, setTableForm] = useState({
    number: "",
    capacity: "4",
  });

  // Active Selected Table/Order detail view
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [roomChargeStayId, setRoomChargeStayId] = useState("");

  // Cart / Create Order State
  const [cart, setCart] = useState<Array<{ item: any; quantity: number }>>([]);
  const [orderTarget, setOrderTarget] = useState({
    tableId: "",
    reservationId: "",
    isRoomService: false,
  });

  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategoryFilter, setMenuCategoryFilter] = useState("ALL");

  // Load properties on mount
  useEffect(() => {
    async function loadProperties() {
      setIsLoading(true);
      try {
        const res = await getPropertiesAction();
        if (res.success && res.properties.length > 0) {
          setProperties(res.properties);
          setSelectedPropertyId(res.properties[0].id);
        } else {
          setProperties([]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load properties.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProperties();
  }, []);

  // Fetch POS data
  const loadPOSData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const res = await getRestaurantOverviewAction(selectedPropertyId);
      if (res.success) {
        setMenuItems(res.menuItems || []);
        setTables(res.tables || []);
        setActiveOrders(res.activeOrders || []);
        setCheckedInStays(res.checkedInStays || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load restaurant POS.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadPOSData();
    }
  }, [selectedPropertyId]);

  // Sync selected table's active order details
  useEffect(() => {
    if (selectedTable) {
      const order = activeOrders.find((o) => o.tableId === selectedTable.id);
      setSelectedOrder(order || null);
    }
  }, [selectedTable, activeOrders]);

  // Menu item availability toggler
  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    setIsActionLoading(true);
    try {
      const res = await toggleMenuItemAvailabilityAction(itemId, isAvailable);
      if (res.success) {
        await loadPOSData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to toggle availability.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Add Menu Item Form submit
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.price) return;

    setIsActionLoading(true);
    try {
      const res = await createMenuItemAction({
        propertyId: selectedPropertyId,
        name: menuForm.name,
        description: menuForm.description,
        price: Number(menuForm.price),
        category: menuForm.category,
      });

      if (res.success) {
        setIsMenuFormOpen(false);
        setMenuForm({ name: "", description: "", price: "", category: "MAIN_COURSE" });
        await loadPOSData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to add menu item.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Add Dining Table Form submit
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.number || !tableForm.capacity) return;

    setIsActionLoading(true);
    try {
      const res = await createRestaurantTableAction({
        propertyId: selectedPropertyId,
        number: tableForm.number,
        capacity: Number(tableForm.capacity),
      });

      if (res.success) {
        setIsTableFormOpen(false);
        setTableForm({ number: "", capacity: "4" });
        await loadPOSData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to add table.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Cart operations
  const handleAddToCart = (item: any) => {
    const existing = cart.find((i) => i.item.id === item.id);
    if (existing) {
      setCart(cart.map((i) => (i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const handleUpdateCartQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((i) => i.item.id !== itemId));
    } else {
      setCart(cart.map((i) => (i.item.id === itemId ? { ...i, quantity: qty } : i)));
    }
  };

  // Place Order handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsActionLoading(true);
    try {
      const items = cart.map((c) => ({
        menuItemId: c.item.id,
        quantity: c.quantity,
      }));

      const res = await createRestaurantOrderAction({
        propertyId: selectedPropertyId,
        tableId: orderTarget.isRoomService ? undefined : orderTarget.tableId || undefined,
        reservationId: orderTarget.isRoomService ? orderTarget.reservationId || undefined : undefined,
        items,
      });

      if (res.success) {
        setCart([]);
        setOrderTarget({ tableId: "", reservationId: "", isRoomService: false });
        setActiveTab("TABLES");
        await loadPOSData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to place restaurant order.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Settle active order handler
  const handleSettleOrder = async (orderId: string, method: string) => {
    setIsActionLoading(true);
    try {
      const res = await settleOrderWithPaymentAction(orderId, method);
      if (res.success) {
        setSelectedTable(null);
        setSelectedOrder(null);
        await loadPOSData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to settle payment.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Settle active order via Room Folio Charge
  const handleChargeToRoom = async (orderId: string) => {
    if (!roomChargeStayId) return;

    setIsActionLoading(true);
    try {
      const res = await chargeOrderToRoomFolioAction(orderId, roomChargeStayId);
      if (res.success) {
        setSelectedTable(null);
        setSelectedOrder(null);
        setRoomChargeStayId("");
        await loadPOSData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to charge order to room folio.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Kitchen operations
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsActionLoading(true);
    try {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.success) {
        await loadPOSData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update order status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filtered menu items
  const filteredMenu = menuItems.filter((i) => {
    if (menuCategoryFilter !== "ALL" && i.category !== menuCategoryFilter) return false;
    if (menuSearch && !i.name.toLowerCase().includes(menuSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      {/* 1. Sidebar Nav */}
      <Sidebar />

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
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
              onClick={loadPOSData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${(isLoading || isActionLoading) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading Restaurant POS Terminal...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Utensils className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Add dining tables and menu items to configure your hotel restaurant operations.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">Restaurant POS Terminal</h1>
                  <p className="text-sm text-text-secondary">
                    Place table orders, direct room charges, and monitor kitchen prep tickets.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsTableFormOpen(true)}
                    className="inline-flex justify-center items-center py-2 px-3 border border-border-default rounded text-sm font-semibold text-text-primary hover:bg-surface-hover bg-surface transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Register Table
                  </button>
                  <button
                    onClick={() => setIsMenuFormOpen(true)}
                    className="inline-flex justify-center items-center py-2 px-3 border border-transparent rounded text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-small transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add Menu Item
                  </button>
                </div>
              </div>

              {/* Tabs selectors */}
              <div className="flex border-b border-border-default space-x-6 text-sm font-medium">
                <button
                  onClick={() => {
                    setActiveTab("TABLES");
                    setSelectedTable(null);
                  }}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "TABLES"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Dining Tables ({tables.length})
                </button>
                <button
                  onClick={() => setActiveTab("ORDER")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "ORDER"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Create New Order Cart ({cart.length})
                </button>
                <button
                  onClick={() => setActiveTab("KITCHEN")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "KITCHEN"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Kitchen Prep ({activeOrders.filter((o) => o.status !== "SERVED").length})
                </button>
                <button
                  onClick={() => setActiveTab("MENU")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "MENU"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Menu Catalog ({menuItems.length})
                </button>
              </div>

              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Layout Content blocks */}
              {activeTab === "TABLES" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Tables list grid */}
                  <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {tables.map((table) => {
                      const isActive = activeOrders.some((o) => o.tableId === table.id);
                      return (
                        <button
                          key={table.id}
                          onClick={() => setSelectedTable(table)}
                          className={`p-5 border rounded-lg text-left shadow-small hover:scale-[1.01] hover:shadow-medium transition-all ${
                            selectedTable?.id === table.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : isActive
                              ? "border-error/20 bg-error/5"
                              : "border-border-default bg-surface hover:bg-surface-hover"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-lg text-text-primary">Table {table.number}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xxs font-bold uppercase ${
                                isActive ? "bg-error/10 text-error" : "bg-success/10 text-success"
                              }`}
                            >
                              {isActive ? "OCCUPIED" : "AVAILABLE"}
                            </span>
                          </div>
                          <div className="text-xxs text-text-secondary mt-2">Capacity: {table.capacity} Pax</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Order Detail Sidepanel */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                    {selectedTable ? (
                      <div className="space-y-6">
                        <div className="border-b border-border-default pb-4">
                          <h3 className="font-bold text-lg text-text-primary">Table {selectedTable.number} Details</h3>
                          <p className="text-xs text-text-secondary">Capacity: {selectedTable.capacity} seating guests</p>
                        </div>

                        {selectedOrder ? (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs font-semibold text-text-secondary">
                                <span>Order ID:</span>
                                <span className="font-mono text-text-primary font-bold">#{selectedOrder.id.slice(0, 8)}</span>
                              </div>
                              <div className="flex justify-between text-xs font-semibold text-text-secondary">
                                <span>Order Status:</span>
                                <span className="capitalize text-warning font-bold">{selectedOrder.status.toLowerCase()}</span>
                              </div>
                              <div className="flex justify-between text-xs font-semibold text-text-secondary">
                                <span>Total Bill:</span>
                                <span className="font-bold text-primary">INR {selectedOrder.totalAmount.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="border border-border-default rounded-md bg-surface-secondary/50 p-3 space-y-2">
                              <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Ordered items</div>
                              <div className="divide-y divide-border-default max-h-[160px] overflow-y-auto pr-1">
                                {selectedOrder.orderItems.map((oi: any) => (
                                  <div key={oi.id} className="py-2 flex justify-between text-xs text-text-primary font-medium">
                                    <span>{oi.menuItem.name} (x{oi.quantity})</span>
                                    <span>INR {(oi.unitPrice * oi.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Settlement Actions */}
                            <div className="space-y-4 pt-4 border-t border-border-default">
                              <div className="text-xs font-semibold text-text-secondary">Payment Settlement</div>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => handleSettleOrder(selectedOrder.id, "CASH")}
                                  className="py-2 border border-border-default rounded hover:bg-surface-hover text-xs font-bold text-text-primary transition-all"
                                >
                                  Cash
                                </button>
                                <button
                                  onClick={() => handleSettleOrder(selectedOrder.id, "CARD")}
                                  className="py-2 border border-border-default rounded hover:bg-surface-hover text-xs font-bold text-text-primary transition-all"
                                >
                                  Card
                                </button>
                                <button
                                  onClick={() => handleSettleOrder(selectedOrder.id, "UPI")}
                                  className="py-2 border border-border-default rounded hover:bg-surface-hover text-xs font-bold text-text-primary transition-all"
                                >
                                  UPI
                                </button>
                              </div>

                              <div className="space-y-2 pt-2">
                                <label className="text-xs font-semibold text-text-secondary block">Charge Stay Folio (Hotel Guest)</label>
                                <div className="flex space-x-2">
                                  <select
                                    value={roomChargeStayId}
                                    onChange={(e) => setRoomChargeStayId(e.target.value)}
                                    className="flex-1 px-3 py-1.5 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                                  >
                                    <option value="">Select checked-in guest...</option>
                                    {checkedInStays.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        Room {s.room.number} — {s.guests[0]?.firstName} {s.guests[0]?.lastName}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleChargeToRoom(selectedOrder.id)}
                                    disabled={!roomChargeStayId}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-text-muted rounded shadow-small transition-all"
                                  >
                                    Charge
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-10 space-y-4">
                            <Utensils className="w-10 h-10 text-text-muted mx-auto" />
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-text-primary">No active order for this table</p>
                              <p className="text-xs text-text-secondary">Click "Create New Order" tab to open a ticket.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-text-secondary space-y-4">
                        <Utensils className="w-12 h-12 text-text-muted mx-auto" />
                        <p className="text-sm font-semibold">Select a dining table to view details and settle active tickets.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "ORDER" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Menu Items Catalog to Add to Cart */}
                  <div className="lg:col-span-2 bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                    {/* Filters & Search - Swiggy Style */}
                    <div className="space-y-4 pb-4 border-b border-border-default">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                          <h3 className="font-extrabold text-sm text-text-primary">Add dishes to order cart</h3>
                          <p className="text-[10px] text-text-secondary mt-0.5">Explore premium chef specials and local cuisines</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
                          <input
                            type="text"
                            placeholder="Search dishes..."
                            value={menuSearch}
                            onChange={(e) => setMenuSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-border-default rounded-md bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {/* Swiggy Style Pills */}
                      <div className="flex flex-wrap gap-2 pt-2 scrollbar-none overflow-x-auto">
                        {[
                          { key: "ALL", label: "🍽️ All Dishes" },
                          { key: "APPETIZER", label: "🍟 Appetizers" },
                          { key: "MAIN_COURSE", label: "🍛 Main Courses" },
                          { key: "DESSERT", label: "🍨 Desserts" },
                          { key: "BEVERAGE", label: "🍹 Beverages" },
                        ].map((cat) => (
                          <button
                            key={cat.key}
                            onClick={() => setMenuCategoryFilter(cat.key)}
                            className={`px-3 py-1.5 rounded-full text-xxs font-extrabold border transition-all ${
                              menuCategoryFilter === cat.key
                                ? "bg-primary text-white border-primary shadow-small"
                                : "bg-surface border-border-default hover:bg-surface-hover text-text-secondary"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Swiggy Style Dishes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredMenu.filter((i) => i.isAvailable).map((item) => {
                        const isVeg = item.category !== "MAIN_COURSE" || item.name.toLowerCase().includes("veg") || !item.name.toLowerCase().includes("chicken") && !item.name.toLowerCase().includes("fish");
                        return (
                          <div key={item.id} className="p-4 border border-border-default rounded-xl bg-surface hover:bg-surface-hover/30 hover:scale-[1.01] hover:shadow-medium flex justify-between items-center transition-all">
                            <div className="space-y-1.5">
                              {/* Veg / Non-Veg Indicator Dot */}
                              <span className={`inline-flex items-center justify-center w-4 h-4 border p-0.5 rounded ${isVeg ? 'border-emerald-500' : 'border-red-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              </span>
                              <div className="font-extrabold text-sm text-text-primary mt-1">{item.name}</div>
                              <div className="text-[10px] text-text-secondary leading-relaxed max-w-[200px]">{item.description || "Freshly cooked premium delicacy."}</div>
                              <div className="text-xs font-black text-primary font-mono mt-1">₹{item.price.toFixed(2)}</div>
                            </div>

                            <button
                              onClick={() => handleAddToCart(item)}
                              className="px-3.5 py-1.5 text-xxs font-extrabold text-success border border-success/35 hover:bg-success/5 bg-surface rounded-lg shadow-xxs transition-all uppercase hover:scale-105 shrink-0"
                            >
                              + Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cart Details Panel */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6 flex flex-col justify-between">
                    <div>
                      <div className="border-b border-border-default pb-4 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-text-primary">Order Cart</h3>
                        <ShoppingCart className="w-5 h-5 text-text-muted" />
                      </div>

                      {cart.length === 0 ? (
                        <div className="text-center py-16 text-text-secondary">
                          <p className="text-sm font-semibold">Order cart is empty</p>
                          <p className="text-xs text-text-muted mt-1">Add items from the catalog.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border-default py-4 max-h-[220px] overflow-y-auto pr-1">
                          {cart.map((cartItem) => (
                            <div key={cartItem.item.id} className="py-2.5 flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-text-primary block">{cartItem.item.name}</span>
                                <span className="text-xxs text-text-secondary">INR {cartItem.item.price.toFixed(2)} each</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleUpdateCartQuantity(cartItem.item.id, cartItem.quantity - 1)}
                                  className="w-6 h-6 border border-border-default rounded bg-surface hover:bg-surface-hover flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="font-bold w-4 text-center">{cartItem.quantity}</span>
                                <button
                                  onClick={() => handleUpdateCartQuantity(cartItem.item.id, cartItem.quantity + 1)}
                                  className="w-6 h-6 border border-border-default rounded bg-surface hover:bg-surface-hover flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {cart.length > 0 && (
                      <form onSubmit={handlePlaceOrder} className="space-y-4 pt-4 border-t border-border-default">
                        <div className="flex justify-between items-center font-extrabold text-sm text-text-primary">
                          <span>Subtotal:</span>
                          <span className="text-primary">
                            INR {cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Order targets */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isRoomService"
                              checked={orderTarget.isRoomService}
                              onChange={(e) =>
                                setOrderTarget({ ...orderTarget, isRoomService: e.target.checked })
                              }
                              className="w-4.5 h-4.5 accent-primary cursor-pointer"
                            />
                            <label htmlFor="isRoomService" className="text-xs font-bold text-text-secondary cursor-pointer select-none">
                              Direct Room Service Dining?
                            </label>
                          </div>

                          {orderTarget.isRoomService ? (
                            <div className="space-y-1">
                              <label className="text-xxs font-bold text-text-secondary uppercase">Select Checked-in Guest Room</label>
                              <select
                                value={orderTarget.reservationId}
                                onChange={(e) => setOrderTarget({ ...orderTarget, reservationId: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                              >
                                <option value="">Choose active room stay...</option>
                                {checkedInStays.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    Room {s.room.number} — {s.guests[0]?.firstName} {s.guests[0]?.lastName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <label className="text-xxs font-bold text-text-secondary uppercase">Assign Table</label>
                              <select
                                value={orderTarget.tableId}
                                onChange={(e) => setOrderTarget({ ...orderTarget, tableId: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                              >
                                <option value="">Select table...</option>
                                {tables.filter((t) => t.status === "AVAILABLE").map((t) => (
                                  <option key={t.id} value={t.id}>
                                    Table {t.number} ({t.capacity} Seating)
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isActionLoading}
                          className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded shadow-small text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none transition-all"
                        >
                          Place POS Order
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "KITCHEN" && (
                <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                  <h3 className="font-bold text-sm text-text-primary">Active Kitchen Preparation Tickets</h3>
                  {activeOrders.filter((o) => o.status !== "SERVED").length === 0 ? (
                    <div className="text-center py-16 text-text-secondary">
                      <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
                      <p className="text-sm font-medium">All kitchen preparation tickets served!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeOrders.filter((o) => o.status !== "SERVED").map((order) => (
                        <div key={order.id} className="p-5 border border-border-default rounded-lg bg-surface-secondary/40 space-y-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start border-b border-border-default pb-2">
                              <span className="font-bold text-sm text-text-primary">
                                {order.table ? `Table ${order.table.number}` : `Room Service (${order.reservation?.room.number || 'Direct'})`}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  order.status === "PENDING"
                                    ? "bg-warning/10 text-warning"
                                    : "bg-indigo-500/10 text-indigo-500"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>

                            <div className="py-2.5 space-y-1.5 text-xs text-text-primary font-medium">
                              {order.orderItems.map((oi: any) => (
                                <div key={oi.id}>
                                  🍳 {oi.menuItem.name} <span className="font-extrabold text-primary">x{oi.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border-default flex space-x-2">
                            {order.status === "PENDING" && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, "KITCHEN")}
                                className="flex-1 py-2 text-center text-xs font-semibold text-white bg-warning hover:bg-warning/95 rounded shadow-small transition-all"
                              >
                                Preparing
                              </button>
                            )}
                            {(order.status === "PENDING" || order.status === "KITCHEN") && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, "SERVED")}
                                className="flex-1 py-2 text-center text-xs font-semibold text-white bg-success hover:bg-success/95 rounded shadow-small transition-all"
                              >
                                Serve dish
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "MENU" && (
                <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-2 border-b border-border-default">
                    <h3 className="font-bold text-sm text-text-primary">Menu Items Catalog</h3>
                    <div className="flex space-x-2">
                      <select
                        value={menuCategoryFilter}
                        onChange={(e) => setMenuCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 border border-border-default rounded bg-surface text-xs font-semibold text-text-secondary focus:outline-none"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="APPETIZER">Appetizer</option>
                        <option value="MAIN_COURSE">Main Course</option>
                        <option value="DESSERT">Dessert</option>
                        <option value="BEVERAGE">Beverage</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                          <th className="p-3">Item</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Description</th>
                          <th className="p-3">Price</th>
                          <th className="p-3 text-right">Availability Toggle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {filteredMenu.map((item) => (
                          <tr key={item.id} className="hover:bg-surface-secondary/40 transition-all">
                            <td className="p-3 font-semibold text-text-primary">{item.name}</td>
                            <td className="p-3 text-text-secondary text-xs capitalize">{item.category.replace("_", " ").toLowerCase()}</td>
                            <td className="p-3 text-text-secondary text-xs">{item.description || "—"}</td>
                            <td className="p-3 font-bold text-text-primary">INR {item.price.toFixed(2)}</td>
                            <td className="p-3 text-right">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.isAvailable}
                                  onChange={(e) => handleToggleAvailability(item.id, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Register Table Modal */}
      {isTableFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Register Dining Table</h3>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Table Number / Label</label>
                <input
                  type="text"
                  placeholder="e.g. T-10, VIP-1"
                  value={tableForm.number}
                  onChange={(e) => setTableForm({ ...tableForm, number: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Seating Capacity (Pax)</label>
                <input
                  type="number"
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTableFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Register Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {isMenuFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Add Menu Item</h3>
            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paneer Butter Masala"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Cottage cheese cooked in creamy tomato gravy"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Price (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Category</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  >
                    <option value="APPETIZER">Appetizer</option>
                    <option value="MAIN_COURSE">Main Course</option>
                    <option value="DESSERT">Dessert</option>
                    <option value="BEVERAGE">Beverage</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMenuFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

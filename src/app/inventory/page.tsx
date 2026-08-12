"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import {
  getInventoryOverviewAction,
  createSupplierAction,
  createInventoryItemAction,
  logStockTransactionAction,
} from "@/app/actions/inventory";
import { Hotel, KeyRound, Calendar as CalendarIcon, Users, Brush, BarChart3, Utensils, Archive, Plus, Wrench, AlertTriangle, CheckCircle, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, ClipboardList, Sparkles, HeartPulse } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

export default function InventoryDashboard() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"STOCK" | "SUPPLIERS" | "LEDGER">("STOCK");

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: "",
    sku: "",
    category: "TOILETRIES",
    quantity: "0",
    minQuantity: "5",
    unitCost: "0",
  });

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txForm, setTxForm] = useState({
    inventoryItemId: "",
    type: "PURCHASE", // PURCHASE, USAGE, ADJUSTMENT
    quantity: "",
    supplierId: "",
    cost: "",
    notes: "",
    logAsExpense: true,
  });

  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch Inventory overview
  const loadInventoryData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const res = await getInventoryOverviewAction(selectedPropertyId);
      if (res.success) {
        setInventoryItems(res.inventoryItems || []);
        setSuppliers(res.suppliers || []);
        setTransactions(res.transactions || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load inventory assets.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadInventoryData();
    }
  }, [selectedPropertyId]);

  // Handle register SKU submit
  const handleRegisterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name) return;

    setIsActionLoading(true);
    try {
      const res = await createInventoryItemAction({
        propertyId: selectedPropertyId,
        name: itemForm.name,
        sku: itemForm.sku,
        category: itemForm.category,
        quantity: Number(itemForm.quantity) || 0,
        minQuantity: Number(itemForm.minQuantity) || 5,
        unitCost: Number(itemForm.unitCost) || 0,
      });

      if (res.success) {
        setIsItemModalOpen(false);
        setItemForm({ name: "", sku: "", category: "TOILETRIES", quantity: "0", minQuantity: "5", unitCost: "0" });
        await loadInventoryData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to register SKU.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Register Supplier submit
  const handleRegisterSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) return;

    setIsActionLoading(true);
    try {
      const res = await createSupplierAction({
        ...supplierForm,
        propertyId: selectedPropertyId,
      });

      if (res.success) {
        setIsSupplierModalOpen(false);
        setSupplierForm({ name: "", contactName: "", email: "", phone: "", address: "" });
        await loadInventoryData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to register supplier.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open Log Transaction
  const handleOpenTx = (itemId?: string) => {
    setTxForm({
      inventoryItemId: itemId || inventoryItems[0]?.id || "",
      type: "PURCHASE",
      quantity: "",
      supplierId: "",
      cost: "",
      notes: "",
      logAsExpense: true,
    });
    setIsTxModalOpen(true);
  };

  // Handle Log Stock Transaction submit
  const handleLogTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.inventoryItemId || !txForm.quantity) return;

    setIsActionLoading(true);
    try {
      const res = await logStockTransactionAction({
        inventoryItemId: txForm.inventoryItemId,
        type: txForm.type,
        quantity: Number(txForm.quantity),
        supplierId: txForm.supplierId || undefined,
        cost: txForm.cost ? Number(txForm.cost) : undefined,
        notes: txForm.notes,
        logAsExpense: txForm.type === "PURCHASE" ? txForm.logAsExpense : false,
      });

      if (res.success) {
        setIsTxModalOpen(false);
        await loadInventoryData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to record stock update.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Low Stock Items selector
  const lowStockItems = inventoryItems.filter((i) => i.lowStockAlert);
  const totalSKUs = inventoryItems.length;
  const assetValue = inventoryItems.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  // Filtered Stock registry
  const filteredStock = inventoryItems.filter((i) => {
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase()) && !i.sku?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      {/* 1. Sidebar Panel */}
      <Sidebar />

      {/* 2. Main content */}
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
          <button
            onClick={loadInventoryData}
            disabled={isActionLoading || isLoading}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${(isLoading || isActionLoading) ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading Stock Ledger Assets...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Archive className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Complete onboarding wizard to register inventory items and utilities.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">Inventory & Suppliers</h1>
                  <p className="text-sm text-text-secondary">
                    Monitor hotel consumables, log stock transitions, and coordinate supplier contact records.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsSupplierModalOpen(true)}
                    className="inline-flex justify-center items-center py-2 px-3 border border-border-default rounded text-sm font-semibold text-text-primary hover:bg-surface-hover bg-surface transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Register Supplier
                  </button>
                  <button
                    onClick={() => setIsItemModalOpen(true)}
                    className="inline-flex justify-center items-center py-2 px-3 border border-transparent rounded text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-small transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Register SKU
                  </button>
                </div>
              </div>

              {/* KPI cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Total Registered SKUs</div>
                  <div className="text-2xl font-black text-primary mt-1">{totalSKUs} Items</div>
                </div>

                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Asset Valuation</div>
                  <div className="text-2xl font-black text-success mt-1">INR {assetValue.toFixed(2)}</div>
                </div>

                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Low Stock Warnings</div>
                  <div className={`text-2xl font-black mt-1 ${lowStockItems.length > 0 ? 'text-error' : 'text-success'}`}>
                    {lowStockItems.length} Warnings
                  </div>
                </div>
              </div>

              {/* Low stock alerts banners */}
              {lowStockItems.length > 0 && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-lg flex items-start space-x-3 text-error">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold">Low Stock Warning Alerts</h4>
                    <p className="text-xs text-error/90 mt-1">
                      The following consumables have dipped below their defined safety threshold:{" "}
                      <span className="font-extrabold">{lowStockItems.map((i) => `${i.name} (${i.quantity} left)`).join(", ")}</span>. 
                      Reorder soon to prevent operations bottlenecks!
                    </p>
                  </div>
                </div>
              )}

              {/* Tab selectors */}
              <div className="flex border-b border-border-default space-x-6 text-sm font-medium">
                <button
                  onClick={() => setActiveTab("STOCK")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "STOCK"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Stock Registry ({inventoryItems.length})
                </button>
                <button
                  onClick={() => setActiveTab("SUPPLIERS")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "SUPPLIERS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Suppliers Directory ({suppliers.length})
                </button>
                <button
                  onClick={() => setActiveTab("LEDGER")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "LEDGER"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Transaction Ledger ({transactions.length})
                </button>
              </div>

              {/* Tab Content blocks */}
              <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                {activeTab === "STOCK" && (
                  <div>
                    {/* Search query */}
                    <div className="p-4 border-b border-border-default">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search stock item by name or SKU..."
                        className="w-full max-w-md px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                            <th className="p-3">Item SKU</th>
                            <th className="p-3">Item Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Current Stock</th>
                            <th className="p-3">Min Safety Level</th>
                            <th className="p-3">Unit Cost</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                          {filteredStock.map((item) => (
                            <tr key={item.id} className="hover:bg-surface-secondary/40 transition-all">
                              <td className="p-3 font-mono text-text-secondary text-xs">{item.sku || "—"}</td>
                              <td className="p-3 font-semibold text-text-primary">
                                <span className="flex items-center">
                                  {item.name}
                                  {item.lowStockAlert && (
                                    <span className="ml-2 w-2 h-2 rounded-full bg-error animate-ping" />
                                  )}
                                </span>
                              </td>
                              <td className="p-3 text-text-secondary text-xs capitalize">
                                {item.category.replace("_", " ").toLowerCase()}
                              </td>
                              <td className={`p-3 font-bold ${item.lowStockAlert ? 'text-error' : 'text-text-primary'}`}>
                                {item.quantity} units
                              </td>
                              <td className="p-3 text-text-secondary font-medium">{item.minQuantity} units</td>
                              <td className="p-3 text-text-secondary">INR {item.unitCost.toFixed(2)}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleOpenTx(item.id)}
                                  disabled={isActionLoading}
                                  className="inline-flex items-center px-2.5 py-1 border border-border-default rounded text-xs font-semibold hover:bg-surface-hover text-text-secondary transition-all"
                                >
                                  <ClipboardList className="w-3 h-3 mr-1" /> Log Transaction
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "SUPPLIERS" && (
                  <div>
                    {suppliers.length === 0 ? (
                      <div className="text-center py-16 text-text-secondary">
                        <Users className="w-10 h-10 text-text-muted mx-auto mb-2" />
                        <p className="text-sm font-medium">No suppliers registered yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                              <th className="p-3">Supplier Name</th>
                              <th className="p-3">Contact Person</th>
                              <th className="p-3">Email Address</th>
                              <th className="p-3">Phone Line</th>
                              <th className="p-3">Office Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default">
                            {suppliers.map((s) => (
                              <tr key={s.id} className="hover:bg-surface-secondary/40 transition-all">
                                <td className="p-3 font-bold text-text-primary">{s.name}</td>
                                <td className="p-3 text-text-primary font-medium">{s.contactName || "—"}</td>
                                <td className="p-3 text-text-secondary text-xs">{s.email || "—"}</td>
                                <td className="p-3 text-text-secondary text-xs">{s.phone || "—"}</td>
                                <td className="p-3 text-text-secondary text-xs">{s.address || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "LEDGER" && (
                  <div>
                    {transactions.length === 0 ? (
                      <div className="text-center py-16 text-text-secondary">
                        <ClipboardList className="w-10 h-10 text-text-muted mx-auto mb-2" />
                        <p className="text-sm font-medium">No transactions recorded yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                              <th className="p-3">Timestamp</th>
                              <th className="p-3">Item Name</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Quantity</th>
                              <th className="p-3">Supplier</th>
                              <th className="p-3">Cost Recorded</th>
                              <th className="p-3">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default">
                            {transactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-surface-secondary/40 transition-all">
                                <td className="p-3 text-text-secondary text-xs">
                                  {new Date(tx.createdAt).toLocaleString()}
                                </td>
                                <td className="p-3 font-semibold text-text-primary">{tx.inventoryItem.name}</td>
                                <td className="p-3 text-xs">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      tx.type === "PURCHASE"
                                        ? "bg-success/10 text-success"
                                        : tx.type === "USAGE"
                                        ? "bg-error/10 text-error"
                                        : "bg-warning/10 text-warning"
                                    }`}
                                  >
                                    {tx.type}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-bold">
                                  {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                                </td>
                                <td className="p-3 text-text-secondary text-xs">{tx.supplier?.name || "—"}</td>
                                <td className="p-3 text-text-secondary">
                                  {tx.cost ? `INR ${tx.cost.toFixed(2)}` : "—"}
                                </td>
                                <td className="p-3 text-text-secondary text-xs">{tx.notes || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Register SKU Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Register Inventory SKU</h3>
            <form onSubmit={handleRegisterItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Consumable Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Toilet Soaps, Bed Sheets"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Item SKU Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SOAP-001"
                    value={itemForm.sku}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  >
                    <option value="HOUSEKEEPING">Housekeeping</option>
                    <option value="TOILETRIES">Toiletries / Guest Kit</option>
                    <option value="RESTAURANT_RAW">F&B Raw Materials</option>
                    <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Init Stock</label>
                  <input
                    type="number"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Safety Limit</label>
                  <input
                    type="number"
                    value={itemForm.minQuantity}
                    onChange={(e) => setItemForm({ ...itemForm, minQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Unit Cost</label>
                  <input
                    type="number"
                    value={itemForm.unitCost}
                    onChange={(e) => setItemForm({ ...itemForm, unitCost: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Register Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Register Supplier Contact</h3>
            <form onSubmit={handleRegisterSupplier} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Supplier / Agency Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vardhman Laundry Agency"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Amit Jain"
                    value={supplierForm.contactName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Phone Line</label>
                  <input
                    type="text"
                    placeholder="+91 9999988888"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Email Address</label>
                <input
                  type="email"
                  placeholder="sales@vardhman.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Office Address</label>
                <input
                  type="text"
                  placeholder="Industrial Area, Bhopal"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Register Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Log Stock Transaction</h3>
            <form onSubmit={handleLogTx} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Select Stock Consumable</label>
                <select
                  value={txForm.inventoryItemId}
                  onChange={(e) => setTxForm({ ...txForm, inventoryItemId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                >
                  {inventoryItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (SKU: {i.sku || "N/A"} — Stock: {i.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Transaction Type</label>
                  <select
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  >
                    <option value="PURCHASE">PURCHASE (Restock)</option>
                    <option value="USAGE">USAGE (Depletion)</option>
                    <option value="ADJUSTMENT">ADJUSTMENT (Count Correction)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Quantity</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={txForm.quantity}
                    onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              {txForm.type === "PURCHASE" && (
                <div className="space-y-4 pt-2 border-t border-border-default">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary">Select Supplier</label>
                      <select
                        value={txForm.supplierId}
                        onChange={(e) => setTxForm({ ...txForm, supplierId: e.target.value })}
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                      >
                        <option value="">Select supplier...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary">Total Bill Cost (INR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2500"
                        value={txForm.cost}
                        onChange={(e) => setTxForm({ ...txForm, cost: e.target.value })}
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="logAsExpense"
                      checked={txForm.logAsExpense}
                      onChange={(e) => setTxForm({ ...txForm, logAsExpense: e.target.checked })}
                      className="w-4.5 h-4.5 accent-primary cursor-pointer"
                    />
                    <label htmlFor="logAsExpense" className="text-xs font-bold text-text-secondary cursor-pointer select-none">
                      Automatically Log as Property Expense?
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Audit Note / Comment</label>
                <input
                  type="text"
                  placeholder="e.g. restocked guest shampoos, count discrepancy correction"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

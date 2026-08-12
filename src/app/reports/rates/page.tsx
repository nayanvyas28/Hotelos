"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import { getRatePlansAction, createRatePlanAction, getSeasonsAction, createSeasonAction, calculateStayPriceAction } from "@/app/actions/rates";
import { getFrontDeskOverviewAction } from "@/app/actions/frontdesk";
import {
  Hotel,
  Calendar as CalendarIcon,
  Tag,
  Plus,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Play,
  Calculator,
  Compass,
  ArrowRight,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";

export default function SeasonalRatesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [ratePlans, setRatePlans] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals / Tabs
  const [activeTab, setActiveTab] = useState<"PLANS" | "SEASONS" | "SIMULATOR">("SIMULATOR");

  // Rate Plan Form
  const [ratePlanForm, setRatePlanForm] = useState({
    name: "",
    code: "",
    modifierType: "PERCENTAGE",
    modifierValue: "",
  });

  // Season Form
  const [seasonForm, setSeasonForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    modifierType: "PERCENTAGE",
    modifierValue: "",
  });

  // Simulator Form
  const [simForm, setSimForm] = useState({
    roomTypeId: "",
    ratePlanId: "",
    checkIn: "",
    checkOut: "",
  });

  const [simResult, setSimResult] = useState<any | null>(null);

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

  const loadRatesData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const plansRes = await getRatePlansAction(selectedPropertyId);
      if (plansRes.success) {
        setRatePlans(plansRes.ratePlans || []);
      }

      const seasonsRes = await getSeasonsAction(selectedPropertyId);
      if (seasonsRes.success) {
        setSeasons(seasonsRes.seasons || []);
      }

      const fdRes = await getFrontDeskOverviewAction(selectedPropertyId);
      if (fdRes.success && fdRes.rooms) {
        // Collect unique room types from rooms
        const uniqueTypesMap = new Map();
        fdRes.rooms.forEach((r: any) => {
          if (r.roomType && !uniqueTypesMap.has(r.roomType.id)) {
            uniqueTypesMap.set(r.roomType.id, {
              id: r.roomType.id,
              name: r.roomType.name,
              code: r.roomType.code,
              basePrice: r.roomType.basePrice,
            });
          }
        });
        setRoomTypes(Array.from(uniqueTypesMap.values()));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load rate configurations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadRatesData();
    }
  }, [selectedPropertyId]);

  const handleCreateRatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratePlanForm.name || !ratePlanForm.code || !selectedPropertyId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createRatePlanAction({
        propertyId: selectedPropertyId,
        name: ratePlanForm.name,
        code: ratePlanForm.code,
        modifierType: ratePlanForm.modifierType,
        modifierValue: Number(ratePlanForm.modifierValue || 0),
      });

      if (res.success) {
        setRatePlanForm({ name: "", code: "", modifierType: "PERCENTAGE", modifierValue: "" });
        await loadRatesData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create rate plan.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonForm.name || !seasonForm.startDate || !seasonForm.endDate || !selectedPropertyId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createSeasonAction({
        propertyId: selectedPropertyId,
        name: seasonForm.name,
        startDate: seasonForm.startDate,
        endDate: seasonForm.endDate,
        modifierType: seasonForm.modifierType,
        modifierValue: Number(seasonForm.modifierValue || 0),
      });

      if (res.success) {
        setSeasonForm({ name: "", startDate: "", endDate: "", modifierType: "PERCENTAGE", modifierValue: "" });
        await loadRatesData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create seasonal rate window.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSimulatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simForm.roomTypeId || !simForm.checkIn || !simForm.checkOut || !selectedPropertyId) return;

    setIsActionLoading(true);
    setError(null);
    setSimResult(null);

    try {
      const res = await calculateStayPriceAction(
        selectedPropertyId,
        simForm.roomTypeId,
        simForm.ratePlanId || null,
        simForm.checkIn,
        simForm.checkOut
      );

      if (res.success) {
        setSimResult(res);
      }
    } catch (err: any) {
      setError(err.message || "Failed to calculate stay pricing.");
    } finally {
      setIsActionLoading(false);
    }
  };

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
              onClick={loadRatesData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
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
              <p className="text-sm text-text-secondary">Loading Pricing Desk...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Hotel className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Complete onboarding setup to begin configuring rates and seasonal windows.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">Seasonal Rates & Rate Plans</h1>
                  <p className="text-sm text-text-secondary">
                    Configure special marketing rate plans, map seasonal dates with modifiers, and calculate stay quotes.
                  </p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-black bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  IDeaS RevPlan Active
                </span>
              </div>

              {/* IDeaS RevPlan Projections */}
              <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                <div className="flex items-center justify-between border-b border-border-default/50 pb-2">
                  <h3 className="text-xs font-black uppercase text-text-muted tracking-wider">
                    IDeaS RevPlan Yield Pricing Projections
                  </h3>
                  <span className="text-[10px] text-text-secondary font-semibold">Feed synced: 15 mins ago</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
                  <div>
                    <span className="text-[10px] text-text-muted block uppercase font-bold">Forecast Occupancy</span>
                    <span className="text-base font-extrabold text-text-primary">86.4%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block uppercase font-bold">ADR Yield Projections</span>
                    <span className="text-base font-extrabold text-text-primary">INR 9,450.00</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block uppercase font-bold">MLOS Restriction</span>
                    <span className="text-base font-extrabold text-warning">2 Nights</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block uppercase font-bold">Total RevPAR Index</span>
                    <span className="text-base font-extrabold text-success">104.2</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border-default space-x-6 text-sm font-medium">
                <button
                  onClick={() => {
                    setActiveTab("SIMULATOR");
                    setSimResult(null);
                  }}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "SIMULATOR"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Stay Price Simulator & Quotes
                </button>
                <button
                  onClick={() => setActiveTab("PLANS")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "PLANS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Rate Plans Catalog ({ratePlans.length})
                </button>
                <button
                  onClick={() => setActiveTab("SEASONS")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "SEASONS"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Seasonal Windows ({seasons.length})
                </button>
              </div>

              {/* Tab: Price Simulator */}
              {activeTab === "SIMULATOR" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Form Controls */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6 self-start">
                    <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                      <Calculator className="w-5 h-5 text-primary" />
                      <h2 className="font-bold text-sm text-text-primary">Calculator Parameters</h2>
                    </div>

                    <form onSubmit={handleSimulatePrice} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Assigned Room Type</label>
                        <select
                          value={simForm.roomTypeId}
                          onChange={(e) => setSimForm({ ...simForm, roomTypeId: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        >
                          <option value="">Select room type...</option>
                          {roomTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} (Base: INR {t.basePrice.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Select Rate Plan (Optional)</label>
                        <select
                          value={simForm.ratePlanId}
                          onChange={(e) => setSimForm({ ...simForm, ratePlanId: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        >
                          <option value="">Standard Rack Rate (0.00 modifier)</option>
                          {ratePlans.map((rp) => (
                            <option key={rp.id} value={rp.id}>
                              {rp.name} ({rp.modifierValue >= 0 ? "+" : ""}{rp.modifierValue}{rp.modifierType === "PERCENTAGE" ? "%" : " INR"})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary block">Check-In Date</label>
                          <input
                            type="date"
                            value={simForm.checkIn}
                            onChange={(e) => setSimForm({ ...simForm, checkIn: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary block">Check-Out Date</label>
                          <input
                            type="date"
                            value={simForm.checkOut}
                            onChange={(e) => setSimForm({ ...simForm, checkOut: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isActionLoading || !simForm.roomTypeId || !simForm.checkIn || !simForm.checkOut}
                        className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white text-xs font-bold rounded shadow transition-all inline-flex justify-center items-center cursor-pointer"
                      >
                        {isActionLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculating...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" /> Calculate stay Price
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Breakdown Results */}
                  <div className="lg:col-span-2 space-y-4">
                    {simResult ? (
                      <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                        <div className="border-b border-border-default pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div>
                            <h3 className="font-black text-lg text-text-primary">Calculated Stay Price Quote</h3>
                            <p className="text-xs text-text-secondary mt-0.5">Stay Length: {simResult.nights} Nights</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Estimated Total (Stay + Tax)</div>
                            <div className="text-2xl font-black text-primary">
                              INR {(simResult.totalPrice + simResult.taxAmount).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-text-secondary mt-0.5">
                              Room: INR {simResult.totalPrice.toFixed(2)} + GST: INR {simResult.taxAmount.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Day-by-day table breakdown */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-text-primary">Daily Rate Breakdown Ledger</h4>
                          <div className="overflow-x-auto divide-y divide-border-default border border-border-default rounded">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-surface-secondary/60 text-text-muted font-bold uppercase tracking-wider text-[9px] border-b border-border-default">
                                  <th className="py-2.5 px-4">Date</th>
                                  <th className="py-2.5 px-4">Base Rate</th>
                                  <th className="py-2.5 px-4">Seasonal Adjust</th>
                                  <th className="py-2.5 px-4">Rate Plan Modifier</th>
                                  <th className="py-2.5 px-4 text-right">Daily price</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                                {simResult.dailyBreakdown.map((day: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-surface-hover/20">
                                    <td className="py-2.5 px-4 font-bold text-text-primary">{day.date}</td>
                                    <td className="py-2.5 px-4">INR {day.basePrice.toFixed(2)}</td>
                                    <td className="py-2.5 px-4">
                                      {day.seasonName ? (
                                        <span className="text-primary font-semibold">
                                          {day.seasonAdjustment >= 0 ? "+" : ""}{day.seasonAdjustment.toFixed(2)} ({day.seasonName})
                                        </span>
                                      ) : (
                                        <span className="text-text-muted">None</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-4">
                                      {day.rateAdjustment !== 0 ? (
                                        <span className="text-indigo-600 font-semibold">
                                          {day.rateAdjustment >= 0 ? "+" : ""}{day.rateAdjustment.toFixed(2)} ({day.rateName})
                                        </span>
                                      ) : (
                                        <span className="text-text-muted">{day.rateName}</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-bold text-text-primary">
                                      INR {day.finalPrice.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-surface border border-border-default border-dashed rounded-lg p-16 text-center text-text-secondary flex flex-col items-center justify-center space-y-4">
                        <Compass className="w-12 h-12 text-text-muted animate-spin-slow" />
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-text-primary">Simulator Output Panel</h3>
                          <p className="text-xs text-text-secondary max-w-sm">
                            Configure Room Type and Dates on the parameters pane to generate daily price breakdowns.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Rate Plans List & Form */}
              {activeTab === "PLANS" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create Rate Plan Form */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6 self-start">
                    <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                      <Tag className="w-5 h-5 text-primary" />
                      <h2 className="font-bold text-sm text-text-primary">Register Rate Plan</h2>
                    </div>

                    <form onSubmit={handleCreateRatePlan} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Rate Plan Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Non-Refundable, Corporate Deal"
                          value={ratePlanForm.name}
                          onChange={(e) => setRatePlanForm({ ...ratePlanForm, name: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary block">Plan Code</label>
                          <input
                            type="text"
                            placeholder="e.g. NON_REF"
                            value={ratePlanForm.code}
                            onChange={(e) => setRatePlanForm({ ...ratePlanForm, code: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary block">Modifier Type</label>
                          <select
                            value={ratePlanForm.modifierType}
                            onChange={(e) => setRatePlanForm({ ...ratePlanForm, modifierType: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED">Fixed Amount (INR)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Modifier Value</label>
                        <input
                          type="number"
                          placeholder="e.g. -10 for discount, 500 for markup"
                          value={ratePlanForm.modifierValue}
                          onChange={(e) => setRatePlanForm({ ...ratePlanForm, modifierValue: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isActionLoading || !ratePlanForm.name || !ratePlanForm.code}
                        className="w-full py-2 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white text-xs font-bold rounded shadow transition-all inline-flex justify-center items-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Add Rate Plan
                      </button>
                    </form>
                  </div>

                  {/* Rate Plans List */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                      <h3 className="font-bold text-sm text-text-primary border-b border-border-default pb-3">
                        Active Rate Catalog Plans
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ratePlans.length === 0 ? (
                          <div className="col-span-2 py-10 text-center text-text-muted text-xs">
                            No marketing rate plans created yet. Add standard modifiers using the creation form.
                          </div>
                        ) : (
                          ratePlans.map((rp) => (
                            <div key={rp.id} className="p-4 border border-border-default rounded-lg bg-surface-secondary/20 space-y-2 flex flex-col justify-between shadow-small">
                              <div>
                                <div className="flex justify-between items-start">
                                  <span className="font-black text-sm text-text-primary">{rp.name}</span>
                                  <span className="px-2 py-0.5 rounded bg-primary-light text-primary font-bold text-[9px] uppercase tracking-wider">
                                    {rp.code}
                                  </span>
                                </div>
                                <p className="text-xxs text-text-secondary mt-1">
                                  Adjusts base prices by: {rp.modifierValue >= 0 ? "+" : ""}{rp.modifierValue}{rp.modifierType === "PERCENTAGE" ? "%" : " INR"}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-success mt-4 block">● ACTIVE</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Seasons List & Form */}
              {activeTab === "SEASONS" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create Season Form */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6 self-start">
                    <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                      <h2 className="font-bold text-sm text-text-primary">Schedule Season Window</h2>
                    </div>

                    <form onSubmit={handleCreateSeason} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Season Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Peak Summer, Winter Vacation"
                          value={seasonForm.name}
                          onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary block">Start Date</label>
                          <input
                            type="date"
                            value={seasonForm.startDate}
                            onChange={(e) => setSeasonForm({ ...seasonForm, startDate: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary block">End Date</label>
                          <input
                            type="date"
                            value={seasonForm.endDate}
                            onChange={(e) => setSeasonForm({ ...seasonForm, endDate: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary block">Modifier Type</label>
                          <select
                            value={seasonForm.modifierType}
                            onChange={(e) => setSeasonForm({ ...seasonForm, modifierType: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED">Fixed Amount (INR)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text-secondary block">Modifier Value</label>
                          <input
                            type="number"
                            placeholder="e.g. 20 or -150"
                            value={seasonForm.modifierValue}
                            onChange={(e) => setSeasonForm({ ...seasonForm, modifierValue: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isActionLoading || !seasonForm.name || !seasonForm.startDate || !seasonForm.endDate}
                        className="w-full py-2 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white text-xs font-bold rounded shadow transition-all inline-flex justify-center items-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Schedule Season
                      </button>
                    </form>
                  </div>

                  {/* Seasons List */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                      <h3 className="font-bold text-sm text-text-primary border-b border-border-default pb-3">
                        Configured Seasonal pricing Calendar Windows
                      </h3>

                      <div className="divide-y divide-border-default">
                        {seasons.length === 0 ? (
                          <div className="py-10 text-center text-text-muted text-xs">
                            No seasonal pricing window calendar rules configured. Add peak or low season rules.
                          </div>
                        ) : (
                          seasons.map((s) => (
                            <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                              <div className="space-y-1">
                                <div className="font-bold text-sm text-text-primary">{s.name}</div>
                                <div className="text-xxs text-text-secondary flex items-center space-x-1.5">
                                  <span>📅 {new Date(s.startDate).toLocaleDateString()}</span>
                                  <ArrowRight className="w-3 h-3 text-text-muted" />
                                  <span>{new Date(s.endDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className={`px-2 py-0.5 rounded text-xxs font-bold uppercase ${s.modifierValue >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                  {s.modifierValue >= 0 ? "+" : ""}{s.modifierValue}{s.modifierType === "PERCENTAGE" ? "%" : " INR"} adjustment
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
            </>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import { getAnalyticsReportAction, createExpenseAction, getExpensesAction } from "@/app/actions/reports";
import { Hotel, KeyRound, Calendar as CalendarIcon, Users, Brush, BarChart3, Plus, Download, Printer, Loader2, Wrench, RefreshCw, IndianRupee, Utensils, Archive, Sparkles, HeartPulse } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";

export default function ReportsDashboard() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  // Default date range: Last 30 days
  const [startDateStr, setStartDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDateStr, setEndDateStr] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BI Data State
  const [summary, setSummary] = useState<any>({
    occupancyRate: 0,
    adr: 0,
    revpar: 0,
    alos: 0,
    netRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    taxBilled: 0,
    totalChargesBilled: 0,
    occupiedNights: 0,
    totalPossibleRoomNights: 0,
  });

  const [chargeBreakdown, setChargeBreakdown] = useState<Record<string, number>>({});
  const [expenseBreakdown, setExpenseBreakdown] = useState<Record<string, number>>({});
  const [dailyTrends, setDailyTrends] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"BI" | "EXPENSES" | "GUEST_EXP">("BI");

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "UTILITIES",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

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

  // Fetch report data
  const loadReportData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const res = await getAnalyticsReportAction(selectedPropertyId, startDateStr, endDateStr);
      if (res.success) {
        setSummary(res.summary);
        setChargeBreakdown(res.chargeBreakdown || {});
        setExpenseBreakdown(res.expenseBreakdown || {});
        setDailyTrends(res.dailyOccupancyTrends || []);
      }

      const expRes = await getExpensesAction(selectedPropertyId);
      if (expRes.success) {
        setExpenses(expRes.expenses || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId && startDateStr && endDateStr) {
      setIsLoading(true);
      loadReportData();
    }
  }, [selectedPropertyId, startDateStr, endDateStr]);

  // Log Expense handler
  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await createExpenseAction({
        propertyId: selectedPropertyId,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description,
        date: expenseForm.date,
      });

      if (res.success) {
        setExpenseForm({
          amount: "",
          category: "UTILITIES",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
        await loadReportData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to log expense.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Client side CSV exporter
  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "HotelOS Reports & Analytics Ledger\n";
      csvContent += `Property ID: ${selectedPropertyId}\n`;
      csvContent += `Period: ${startDateStr} to ${endDateStr}\n\n`;

      csvContent += "METRIC,VALUE\n";
      csvContent += `Occupancy Rate,${summary.occupancyRate}%\n`;
      csvContent += `Average Daily Rate (ADR),INR ${summary.adr.toFixed(2)}\n`;
      csvContent += `Revenue Per Available Room (RevPAR),INR ${summary.revpar.toFixed(2)}\n`;
      csvContent += `Average Length of Stay (ALOS),${summary.alos} nights\n`;
      csvContent += `Net Settled Revenue,INR ${summary.netRevenue.toFixed(2)}\n`;
      csvContent += `Total Billed Charges,INR ${summary.totalChargesBilled.toFixed(2)}\n`;
      csvContent += `Tax Billed,INR ${summary.taxBilled.toFixed(2)}\n`;
      csvContent += `Total Expenses,INR ${summary.totalExpenses.toFixed(2)}\n`;
      csvContent += `Net Profit,INR ${summary.netProfit.toFixed(2)}\n\n`;

      csvContent += "CHARGE BREAKDOWN (DEPARTMENT),AMOUNT\n";
      Object.entries(chargeBreakdown).forEach(([dept, val]) => {
        csvContent += `${dept},${val.toFixed(2)}\n`;
      });
      csvContent += "\n";

      csvContent += "EXPENSE BREAKDOWN,AMOUNT\n";
      Object.entries(expenseBreakdown).forEach(([cat, val]) => {
        csvContent += `${cat},${val.toFixed(2)}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `hotelos_report_${startDateStr}_to_${endDateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export CSV report.");
    }
  };

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary print:bg-white print:text-black">
      {/* 1. Sidebar Panel (hidden during print) */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between print:hidden">
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
              onClick={loadReportData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${(isLoading || isActionLoading) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto print:p-0 print:overflow-visible">
          <RoleProtected allowedRoles={["MANAGER"]}>
            <>
              {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 print:hidden">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Compiling Reports & Financial Statements...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small print:hidden">
              <Hotel className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Complete your property wizard to start monitoring financial statistics.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 print:border-b print:pb-4 print:mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight print:text-3xl">Business Intelligence & Reports</h1>
                  <p className="text-sm text-text-secondary print:text-xs">
                    Periodical financial statements, Room ADR/RevPAR KPIs, and expense logs.
                  </p>
                  <p className="hidden print:block text-xs text-text-secondary mt-1">
                    Selected Range: {startDateStr} to {endDateStr}
                  </p>
                </div>
                <div className="flex space-x-2 print:hidden">
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex justify-center items-center py-2 px-3 border border-border-default rounded text-sm font-semibold text-text-primary hover:bg-surface-hover bg-surface transition-all"
                  >
                    <Download className="w-4 h-4 mr-1.5" /> Export CSV
                  </button>
                  <button
                    onClick={handlePrintReport}
                    className="inline-flex justify-center items-center py-2 px-3 border border-transparent rounded text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-small transition-all"
                  >
                    <Printer className="w-4 h-4 mr-1.5" /> Print Statement
                  </button>
                </div>
              </div>

              {/* Filters (Hidden during print) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface border border-border-default rounded-md print:hidden">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-text-secondary">From:</label>
                  <input
                    type="date"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="px-3 py-1.5 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-text-secondary">To:</label>
                  <input
                    type="date"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="px-3 py-1.5 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm font-medium print:hidden">
                  {error}
                </div>
              )}

              {/* KPI cards grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small print:border print:shadow-none">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Occupancy Rate</div>
                  <div className="text-2xl font-black text-primary mt-1">{summary.occupancyRate}%</div>
                  <div className="text-xxs text-text-secondary mt-1">{summary.occupiedNights} / {summary.totalPossibleRoomNights} room-nights</div>
                </div>

                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small print:border print:shadow-none">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Average Daily Rate (ADR)</div>
                  <div className="text-2xl font-black text-success mt-1">INR {summary.adr.toFixed(2)}</div>
                  <div className="text-xxs text-text-secondary mt-1">Revenue per sold room</div>
                </div>

                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small print:border print:shadow-none">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">RevPAR</div>
                  <div className="text-2xl font-black text-indigo-500 mt-1">INR {summary.revpar.toFixed(2)}</div>
                  <div className="text-xxs text-text-secondary mt-1">Revenue per available room</div>
                </div>

                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small print:border print:shadow-none">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider">Net Profitability</div>
                  <div className={`text-2xl font-black mt-1 ${summary.netProfit >= 0 ? 'text-success' : 'text-error'}`}>
                    INR {summary.netProfit.toFixed(2)}
                  </div>
                  <div className="text-xxs text-text-secondary mt-1">Revenue minus Expenses</div>
                </div>

                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small print:border print:shadow-none">
                  <div className="text-xxs font-bold text-text-muted uppercase tracking-wider font-semibold">Average Stay Length</div>
                  <div className="text-2xl font-black text-slate-500 mt-1">{summary.alos} nights</div>
                  <div className="text-xxs text-text-secondary mt-1">ALOS for reservations</div>
                </div>
              </div>

              {/* Tabs selector */}
              <div className="flex border-b border-border-default space-x-6 text-sm font-medium print:hidden">
                <button
                  onClick={() => setActiveTab("BI")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "BI"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Financial Overview & Trends
                </button>
                <button
                  onClick={() => setActiveTab("EXPENSES")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "EXPENSES"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Expense Logbook
                </button>
                <button
                  onClick={() => setActiveTab("GUEST_EXP")}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    activeTab === "GUEST_EXP"
                      ? "text-primary font-bold border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  ReviewPro Guest Experience
                </button>
              </div>

              {/* Tab BI Overview Content */}
              {activeTab === "BI" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
                  {/* Revenue breakdown by category */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small print:border-0 print:p-0">
                    <h3 className="text-sm font-bold text-text-primary mb-4">Department Billing Revenue Distribution</h3>
                    <div className="space-y-4">
                      {Object.entries(chargeBreakdown).map(([category, amount]) => {
                        const percent = summary.totalChargesBilled > 0 ? Math.round((amount / summary.totalChargesBilled) * 100) : 0;
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-text-secondary">
                              <span className="capitalize">{category.replace("_", " ").toLowerCase()}</span>
                              <span>INR {amount.toFixed(2)} ({percent}%)</span>
                            </div>
                            <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-default">
                              <div
                                className="bg-primary h-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-4 border-t border-border-default flex justify-between text-sm font-extrabold text-text-primary">
                        <span>Total Charges Billed</span>
                        <span>INR {summary.totalChargesBilled.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-success">
                        <span>Net Settled Cash Revenue</span>
                        <span>INR {summary.netRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Occupancy trends list */}
                  <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small print:break-before-page print:border-0 print:p-0">
                    <h3 className="text-sm font-bold text-text-primary mb-4">Daily Occupancy Trends (First 31 Days)</h3>
                    <div className="max-h-[320px] overflow-y-auto space-y-3 pr-2">
                      {dailyTrends.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="w-20 font-bold text-text-secondary">{t.dateLabel}</span>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-default">
                              <div
                                className="bg-indigo-500 h-full transition-all"
                                style={{ width: `${t.occupancy}%` }}
                              />
                            </div>
                          </div>
                          <span className="w-24 text-right font-semibold text-text-primary">
                            {t.occupancy}% ({t.roomsOccupied} occupied)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Expenses Content */}
              {activeTab === "EXPENSES" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
                  {/* Expense Form (hidden during print) */}
                  <div className="lg:col-span-1 bg-surface border border-border-default rounded-lg p-6 shadow-small print:hidden">
                    <h3 className="text-sm font-bold text-text-primary mb-4">Log Property Expense</h3>
                    <form onSubmit={handleLogExpense} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Amount (INR)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Category</label>
                        <select
                          value={expenseForm.category}
                          onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                        >
                          <option value="UTILITIES">Utilities / Electricity</option>
                          <option value="SALARIES">Staff Salaries</option>
                          <option value="MAINTENANCE">Maintenance Repairs</option>
                          <option value="LAUNDRY">Laundry Services</option>
                          <option value="OTHER">Other Miscellaneous</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Generator Diesel refill"
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary">Expense Date</label>
                        <input
                          type="date"
                          value={expenseForm.date}
                          onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isActionLoading}
                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded shadow-small text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none transition-all"
                      >
                        {isActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Log Expense
                      </button>
                    </form>
                  </div>

                  {/* Expense Table List */}
                  <div className="lg:col-span-2 bg-surface border border-border-default rounded-lg p-6 shadow-small print:border-0 print:p-0">
                    <h3 className="text-sm font-bold text-text-primary mb-4">Property Expenses Statement</h3>
                    {expenses.length === 0 ? (
                      <div className="text-center py-16 text-text-secondary">
                        <IndianRupee className="w-10 h-10 text-text-muted mx-auto mb-2" />
                        <p className="text-sm font-medium">No expenses logged for this property yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                              <th className="p-3">Date</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Description</th>
                              <th className="p-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default">
                            {expenses.map((exp) => (
                              <tr key={exp.id} className="hover:bg-surface-secondary/40 transition-all">
                                <td className="p-3 text-text-secondary">
                                  {new Date(exp.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                </td>
                                <td className="p-3 font-semibold text-text-primary">
                                  {exp.category.replace("_", " ")}
                                </td>
                                <td className="p-3 text-text-secondary text-xs">{exp.description || "—"}</td>
                                <td className="p-3 text-right font-bold text-text-primary">INR {exp.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "GUEST_EXP" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ReviewPro CSAT Sentiment Details */}
                  <div className="md:col-span-2 bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                    <div className="flex justify-between items-center border-b border-border-default/50 pb-2">
                      <h3 className="text-sm font-bold text-text-primary">ReviewPro Reputation & Sentiment Analytics</h3>
                      <span className="text-[10px] text-text-secondary font-semibold">CSAT Feed: Active Sync</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                      <div className="p-4 bg-surface-secondary/40 border border-border-default/60 rounded">
                        <span className="text-[10px] text-text-muted block uppercase font-bold">Overall Guest CSAT</span>
                        <span className="text-xl font-extrabold text-success">92.4%</span>
                        <span className="text-[9px] text-text-muted block mt-1">Target threshold: 90%</span>
                      </div>
                      <div className="p-4 bg-surface-secondary/40 border border-border-default/60 rounded">
                        <span className="text-[10px] text-text-muted block uppercase font-bold">Net Promoter Score (NPS)</span>
                        <span className="text-xl font-extrabold text-primary">+78</span>
                        <span className="text-[9px] text-text-muted block mt-1">Excellent guest loyalty index</span>
                      </div>
                      <div className="p-4 bg-surface-secondary/40 border border-border-default/60 rounded">
                        <span className="text-[10px] text-text-muted block uppercase font-bold">AI Chatbot Resolution</span>
                        <span className="text-xl font-extrabold text-indigo-500">94.8%</span>
                        <span className="text-[9px] text-text-muted block mt-1">Average response time: 42s</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-text-primary">Guest Sentiment Keyword Projections</h4>
                      <div className="flex flex-wrap gap-2 text-xxs font-bold">
                        <span className="px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/20">Clean Rooms (96%)</span>
                        <span className="px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/20">Front Desk Helpfulness (92%)</span>
                        <span className="px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/20">Spa Treatments (90%)</span>
                        <span className="px-2.5 py-1 rounded-full bg-error/15 text-error border border-error/20">AC cooling latency (Room 205)</span>
                        <span className="px-2.5 py-1 rounded-full bg-warning/15 text-warning border border-warning/20">Check-in queue delays</span>
                      </div>
                    </div>
                  </div>

                  {/* Reputation Alerts & Survey counters */}
                  <div className="md:col-span-1 bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                    <h3 className="text-sm font-bold text-text-primary">CSAT Action Alerts</h3>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-error/5 border border-error/25 rounded space-y-1.5">
                        <span className="font-bold text-error block text-[10px] uppercase">🚨 Critical Survey Alert</span>
                        <p className="text-text-secondary leading-normal text-[11px]">Room 205 checked out today and logged a CSAT score of 4/10 due to AC latency.</p>
                      </div>
                      <div className="p-3 bg-warning/5 border border-warning/25 rounded space-y-1.5">
                        <span className="font-bold text-warning block text-[10px] uppercase">⚠️ Moderate Alert</span>
                        <p className="text-text-secondary leading-normal text-[11px]">Queue times rose to 12 minutes during peak morning arrivals block.</p>
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

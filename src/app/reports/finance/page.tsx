"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";
import { getExpensesAction, createExpenseAction, deleteExpenseAction, addStaffMemberAction, removeStaffMemberAction } from "@/app/actions/finance";
import { getStaffMembersAction } from "@/app/actions/system";
import { getPropertiesAction } from "@/app/actions/property";
import { useSession } from "@/context/SessionContext";
import { BarChart3, TrendingUp, TrendingDown, Users, Trash2, Plus, RefreshCw, Loader2, DollarSign, Wallet, ClipboardList } from "lucide-react";

export default function FinanceDashboard() {
  const [properties, setProperties] = useState<any[]>([]);
  const { activePropertyId: selectedPropertyId, setActivePropertyId: setSelectedPropertyId } = useSession();

  const [activeTab, setActiveTab] = useState<"REVENUE" | "EXPENSES" | "EMPLOYEES">("REVENUE");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forms state
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "UTILITIES",
    description: "",
    date: new Date().toISOString().substring(0, 10),
  });

  const [staffForm, setStaffForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    roleName: "FRONT_DESK",
    salary: "35000",
  });

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);

  // Load properties on mount
  useEffect(() => {
    async function loadProperties() {
      setIsLoading(true);
      try {
        const res = await getPropertiesAction();
        if (res.success && res.properties.length > 0) {
          setProperties(res.properties);
          if (!selectedPropertyId) {
            setSelectedPropertyId(res.properties[0].id);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load properties.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProperties();
  }, []);

  const loadFinancialData = async () => {
    if (!selectedPropertyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const expRes = await getExpensesAction(selectedPropertyId);
      if (expRes.success) setExpenses(expRes.expenses || []);

      const staffRes = await getStaffMembersAction(selectedPropertyId);
      if (staffRes.success) setStaff(staffRes.staff || []);
    } catch (err: any) {
      setError(err.message || "Failed to load ledger records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      loadFinancialData();
    }
  }, [selectedPropertyId]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description) return;

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
        setIsExpenseOpen(false);
        setExpenseForm({
          amount: "",
          category: "UTILITIES",
          description: "",
          date: new Date().toISOString().substring(0, 10),
        });
        await loadFinancialData();
      } else {
        alert(res.error || "Failed to log expense.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to log expense.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    setIsActionLoading(true);
    try {
      const res = await deleteExpenseAction(id);
      if (res.success) {
        await loadFinancialData();
      } else {
        alert(res.error || "Failed to delete expense.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete expense.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.email || !staffForm.firstName) return;

    setIsActionLoading(true);
    try {
      const res = await addStaffMemberAction({
        propertyId: selectedPropertyId,
        email: staffForm.email,
        firstName: staffForm.firstName,
        lastName: staffForm.lastName,
        roleName: staffForm.roleName,
      });

      if (res.success) {
        setIsStaffOpen(false);
        setStaffForm({
          email: "",
          firstName: "",
          lastName: "",
          roleName: "FRONT_DESK",
          salary: "35000",
        });
        await loadFinancialData();
      } else {
        alert(res.error || "Failed to hire employee.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to hire employee.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveStaff = async (id: string) => {
    if (!confirm("Are you sure you want to terminate this staff member and revoke access?")) return;
    setIsActionLoading(true);
    try {
      const res = await removeStaffMemberAction(id);
      if (res.success) {
        await loadFinancialData();
      } else {
        alert(res.error || "Failed to terminate staff.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to terminate staff.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Math totals calculations
  const totalBookingsRevenue = 145000; // Simulated rooms booking revenue
  const totalRestaurantRevenue = 32800; // Simulated POS dining revenue
  const totalRevenueSum = totalBookingsRevenue + totalRestaurantRevenue;
  
  const customExpensesSum = expenses.reduce((sum, item) => sum + item.amount, 0);
  const staffPayrollSum = staff.length * 35000; // Mock salary ₹35k per staff member
  const totalExpensesSum = customExpensesSum + staffPayrollSum;
  
  const netProfit = totalRevenueSum - totalExpensesSum;

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
          <HeaderStaffSwitcher />
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <RoleProtected allowedRoles={["MD", "CFO"]}>
            <>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary">Revenue, Expenses & Payroll</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Monitor property cashflow, track operating expenses (OpEx), manage employee payroll salaries, and onboard staff.
                  </p>
                </div>
                <div className="flex space-x-2 shrink-0">
                  <button
                    onClick={() => setIsExpenseOpen(true)}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold text-text-primary bg-surface border border-border-default hover:bg-surface-hover rounded shadow-small transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Log Expense
                  </button>
                  <button
                    onClick={() => setIsStaffOpen(true)}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small transition-all"
                  >
                    <Users className="w-4 h-4 mr-1.5" /> Hire Employee
                  </button>
                </div>
              </div>

              {/* Financial Dashboard summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue Card */}
                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Consolidated Revenue</span>
                    <div className="text-2xl font-black text-success font-mono">₹{totalRevenueSum.toLocaleString()}</div>
                    <div className="text-[10px] text-text-muted leading-relaxed">Rooms: ₹1.45L | Restaurant: ₹32.8K</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success shrink-0 opacity-80" />
                </div>

                {/* Expenses Card */}
                <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Total Expenses & Payroll</span>
                    <div className="text-2xl font-black text-error font-mono font-bold">₹{totalExpensesSum.toLocaleString()}</div>
                    <div className="text-[10px] text-text-muted leading-relaxed">Staff Payroll: ₹{(staffPayrollSum/1000)}K | OpEx: ₹{(customExpensesSum/1000)}K</div>
                  </div>
                  <TrendingDown className="w-8 h-8 text-error shrink-0 opacity-80" />
                </div>

                {/* Profit Card */}
                <div className={`border rounded-lg p-5 shadow-small flex items-center justify-between bg-surface ${netProfit >= 0 ? 'border-success/35' : 'border-error/35'}`}>
                  <div className="space-y-1">
                    <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Net Operating Income</span>
                    <div className={`text-2xl font-black font-mono ${netProfit >= 0 ? 'text-success' : 'text-error'}`}>
                      ₹{netProfit.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-text-muted leading-relaxed">
                      {netProfit >= 0 ? "Operating at net margin profit!" : "Deficit warnings alert active."}
                    </div>
                  </div>
                  <DollarSign className={`w-8 h-8 shrink-0 opacity-80 ${netProfit >= 0 ? 'text-success' : 'text-error'}`} />
                </div>
              </div>

              {/* Tabs list */}
              <div className="flex border-b border-border-default space-x-6 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("REVENUE")}
                  className={`pb-2 transition-all ${activeTab === "REVENUE" ? "text-primary border-b-2 border-primary" : "text-text-secondary"}`}
                >
                  Revenue analytics
                </button>
                <button
                  onClick={() => setActiveTab("EXPENSES")}
                  className={`pb-2 transition-all ${activeTab === "EXPENSES" ? "text-primary border-b-2 border-primary" : "text-text-secondary"}`}
                >
                  Expenses Ledger ({expenses.length})
                </button>
                <button
                  onClick={() => setActiveTab("EMPLOYEES")}
                  className={`pb-2 transition-all ${activeTab === "EMPLOYEES" ? "text-primary border-b-2 border-primary" : "text-text-secondary"}`}
                >
                  Employee & Payroll Roster ({staff.length})
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Revenue Tab */}
                  {activeTab === "REVENUE" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4">
                        <h3 className="text-xs font-black uppercase text-text-muted tracking-wider flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1 text-success" /> Income Streams Allocation
                        </h3>
                        <div className="space-y-3 text-xs leading-normal">
                          <div className="flex justify-between items-center py-2 border-b border-border-default/50">
                            <span>Room Booking Receipts</span>
                            <span className="font-mono font-bold text-text-primary">₹1,45,000.00</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-border-default/50">
                            <span>Restaurant POS Dining Sales</span>
                            <span className="font-mono font-bold text-text-primary">₹32,800.00</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span>Total Gross Revenue</span>
                            <span className="font-mono font-black text-success">₹1,77,800.00</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-surface border border-border-default rounded-lg p-5 shadow-small space-y-4 leading-normal">
                        <h3 className="text-xs font-black uppercase text-text-muted tracking-wider flex items-center">
                          <Wallet className="w-4 h-4 mr-1 text-indigo-500" /> Operational Outflows (OpEx)
                        </h3>
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between items-center py-2 border-b border-border-default/50">
                            <span>Employee Salaries Payroll</span>
                            <span className="font-mono font-bold text-text-primary">₹{staffPayrollSum.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-border-default/50">
                            <span>Custom Operating Expenses (Ledger)</span>
                            <span className="font-mono font-bold text-text-primary">₹{customExpensesSum.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span>Total Operating Costs</span>
                            <span className="font-mono font-black text-error">₹{totalExpensesSum.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expenses Tab */}
                  {activeTab === "EXPENSES" && (
                    <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            <th className="p-4">Date</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Description</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                          {expenses.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-text-secondary italic">
                                No expenses logged. Click 'Log Expense' to begin.
                              </td>
                            </tr>
                          ) : (
                            expenses.map((exp) => (
                              <tr key={exp.id} className="hover:bg-surface-secondary/30 transition-all font-mono">
                                <td className="p-4 text-text-secondary">{new Date(exp.date).toLocaleDateString()}</td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-error/15 text-error border border-error/20">
                                    {exp.category}
                                  </span>
                                </td>
                                <td className="p-4 font-sans text-text-secondary font-semibold">{exp.description}</td>
                                <td className="p-4 text-right text-text-primary font-bold">₹{exp.amount.toLocaleString()}</td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleDeleteExpense(exp.id)}
                                    className="p-1 text-text-muted hover:text-error hover:bg-error/10 rounded transition-all inline-flex"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Employees Tab */}
                  {activeTab === "EMPLOYEES" && (
                    <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border-default text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            <th className="p-4">Employee Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role Assigned</th>
                            <th className="p-4 text-right">Base Salary</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                          {staff.map((member) => (
                            <tr key={member.id} className="hover:bg-surface-secondary/30 transition-all">
                              <td className="p-4 font-bold text-text-primary">
                                {member.firstName} {member.lastName || ""}
                              </td>
                              <td className="p-4 text-text-secondary font-mono">{member.email}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                  {member.userRoles[0]?.role?.name || "STAFF"}
                                </span>
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-text-primary">₹35,000 / mo</td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleRemoveStaff(member.id)}
                                  className="p-1 text-text-muted hover:text-error hover:bg-error/10 rounded transition-all inline-flex"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Log Expense Modal */}
              {isExpenseOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
                    <h3 className="text-sm font-bold text-text-primary">Log Operating Expense</h3>
                    <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-text-secondary font-semibold">Amount (INR)</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 15000"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-text-secondary font-semibold">Category</label>
                          <select
                            value={expenseForm.category}
                            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          >
                            <option value="SALARIES">Salaries & Payroll</option>
                            <option value="UTILITIES">Utilities (Electricity/Water)</option>
                            <option value="MAINTENANCE">Maintenance & Repairs</option>
                            <option value="INVENTORY">Inventory Supplier refills</option>
                            <option value="OTHER">Other Misc expenses</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-text-secondary font-semibold">Description</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Paid electric bill for July"
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-text-secondary font-semibold">Date</label>
                        <input
                          type="date"
                          value={expenseForm.date}
                          onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsExpenseOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-text-secondary border border-border-default rounded bg-surface"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isActionLoading}
                          className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                        >
                          {isActionLoading ? "Logging..." : "Log Expense"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Hire Employee Modal */}
              {isStaffOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
                    <h3 className="text-sm font-bold text-text-primary">Onboard Employee</h3>
                    <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-text-secondary font-semibold">First Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh"
                            value={staffForm.firstName}
                            onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-text-secondary font-semibold">Last Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Kumar"
                            value={staffForm.lastName}
                            onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-text-secondary font-semibold">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="ramesh@hotel-os.com"
                          value={staffForm.email}
                          onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-text-secondary font-semibold">Role</label>
                          <select
                            value={staffForm.roleName}
                            onChange={(e) => setStaffForm({ ...staffForm, roleName: e.target.value })}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                          >
                            <option value="FRONT_DESK">Front Desk Agent</option>
                            <option value="HOUSEKEEPER">Housekeeper</option>
                            <option value="SPA_THERAPIST">Spa Therapist</option>
                            <option value="GM">General Manager</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-text-secondary font-semibold">Default Salary (INR/mo)</label>
                          <input
                            type="number"
                            disabled
                            value={staffForm.salary}
                            className="w-full px-3 py-2 border border-border-default rounded bg-surface-secondary text-xs text-text-muted focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsStaffOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-text-secondary border border-border-default rounded bg-surface"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isActionLoading}
                          className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                        >
                          {isActionLoading ? "Hiring..." : "Hire Employee"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          </RoleProtected>
        </main>
      </div>
    </div>
  );
}

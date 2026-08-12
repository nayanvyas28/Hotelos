"use client";

import { useState, useEffect, use } from "react";
import { getOrCreateFolioAction, postChargeAction, postPaymentAction, closeFolioAction } from "@/app/actions/billing";
import { checkOutAction } from "@/app/actions/frontdesk";
import { ArrowLeft, Plus, DollarSign, Printer, CreditCard, Receipt, Loader2, CheckCircle2, ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";
import RoleProtected from "@/components/layout/RoleProtected";

interface BillingPageProps {
  params: Promise<{
    reservationId: string;
  }>;
}

export default function BillingPage({ params }: BillingPageProps) {
  const router = useRouter();
  const { reservationId } = use(params);

  const [folio, setFolio] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    type: "ROOM_SERVICE",
    amount: "",
    taxAmount: "",
    description: "",
  });

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    type: "PAYMENT",
    amount: "",
    method: "UPI",
    reference: "",
  });

  // Calculate taxes automatically on input change
  const handleChargeAmountChange = (val: string) => {
    const amt = parseFloat(val) || 0;
    const gst = parseFloat((amt * 0.12).toFixed(2)); // default 12% GST
    setChargeForm((prev) => ({
      ...prev,
      amount: val,
      taxAmount: String(gst),
    }));
  };

  const loadFolio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getOrCreateFolioAction(reservationId);
      if (res.success && res.folio) {
        setFolio(res.folio);
      } else {
        setError("Could not retrieve folio.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load stay folio details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reservationId) {
      loadFolio();
    }
  }, [reservationId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-app-bg text-text-primary space-y-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-text-secondary">Loading Folio Ledger...</p>
      </div>
    );
  }

  if (error || !folio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-app-bg text-text-primary p-6">
        <div className="max-w-md w-full bg-surface border border-border-default rounded-lg p-6 text-center space-y-4 shadow-small">
          <ShieldAlert className="w-12 h-12 text-error mx-auto" />
          <h3 className="text-lg font-bold text-text-primary">Folio Load Failed</h3>
          <p className="text-sm text-text-secondary">{error || "Folio not found."}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex justify-center items-center py-2 px-4 border border-border-default rounded text-sm font-semibold hover:bg-surface-hover text-text-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotalCharges = folio.charges.reduce((sum: number, c: any) => sum + c.amount, 0);
  const totalTax = folio.charges.reduce((sum: number, c: any) => sum + c.taxAmount, 0);
  const totalCharges = subtotalCharges + totalTax;

  const totalPayments = folio.payments.reduce((sum: number, p: any) => {
    return sum + (p.type === "REFUND" ? -p.amount : p.amount);
  }, 0);

  const balanceDue = parseFloat((totalCharges - totalPayments).toFixed(2));

  // Handlers
  const handlePostCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeForm.amount || parseFloat(chargeForm.amount) <= 0 || !chargeForm.description) {
      alert("Please fill in valid charge details.");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await postChargeAction(folio.id, {
        type: chargeForm.type,
        amount: parseFloat(chargeForm.amount),
        taxAmount: parseFloat(chargeForm.taxAmount) || 0,
        description: chargeForm.description,
      });

      if (res.success) {
        setIsChargeOpen(false);
        setChargeForm({ type: "ROOM_SERVICE", amount: "", taxAmount: "", description: "" });
        await loadFolio();
      }
    } catch (err: any) {
      alert(err.message || "Failed to post charge.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenPayment = () => {
    // Suggest payment amount equal to balance due
    setPaymentForm({
      type: balanceDue > 0 ? "PAYMENT" : "REFUND",
      amount: String(Math.abs(balanceDue)),
      method: "UPI",
      reference: "",
    });
    setIsPaymentOpen(true);
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await postPaymentAction(folio.id, {
        amount: parseFloat(paymentForm.amount),
        type: paymentForm.type,
        method: paymentForm.method,
        reference: paymentForm.reference,
      });

      if (res.success) {
        setIsPaymentOpen(false);
        await loadFolio();
      }
    } catch (err: any) {
      alert(err.message || "Failed to post transaction.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSettleAndClose = async () => {
    if (Math.abs(balanceDue) > 0.05) {
      alert(`Folio cannot be closed. Net balance must be 0.00. Current balance: INR ${balanceDue}`);
      return;
    }

    if (confirm("Are you sure you want to settle and lock this guest folio? No further changes will be allowed.")) {
      setIsActionLoading(true);
      try {
        const res = await closeFolioAction(folio.id);
        if (res.success) {
          // If stay was checked-in and checkout check-out is pending, automatically check out reservation
          if (folio.reservation.status === "CHECKED_IN") {
            await checkOutAction(reservationId);
          }
          await loadFolio();
        }
      } catch (err: any) {
        alert(err.message || "Failed to close folio.");
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  // Chronological transaction merges
  const ledgerItems = [
    ...folio.charges.map((c: any) => ({
      id: c.id,
      date: new Date(c.createdAt),
      type: "CHARGE",
      category: c.type,
      description: c.description,
      amount: c.amount,
      tax: c.taxAmount,
      total: c.amount + c.taxAmount,
    })),
    ...folio.payments.map((p: any) => ({
      id: p.id,
      date: new Date(p.createdAt),
      type: p.type, // PAYMENT / REFUND
      category: p.method,
      description: `${p.type} via ${p.method} ${p.reference ? `(Ref: ${p.reference})` : ""}`,
      amount: 0,
      tax: 0,
      total: p.type === "REFUND" ? -p.amount : -p.amount, // acts as credits
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="min-h-screen bg-app-bg text-text-primary">
      {/* Print-only Invoice Header */}
      <div className="hidden print:block p-8 space-y-6">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">HotelOS Invoice Statement</h1>
            <p className="text-xs text-slate-500 mt-1">Property Billing Voucher Statement</p>
          </div>
          <div className="text-right text-xs">
            <h3 className="font-bold text-slate-900">🏨 {folio.reservation.property?.name || "Hotel Property"}</h3>
            <p className="text-slate-500">Folio ID: {folio.id.substring(0, 8)}</p>
            <p className="text-slate-500">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-xs text-slate-700 py-2">
          <div>
            <h4 className="font-bold text-slate-900 uppercase">Guest Information</h4>
            <p className="mt-1 font-semibold text-slate-800">
              {folio.reservation.guests?.[0]
                ? `${folio.reservation.guests[0].firstName} ${folio.reservation.guests[0].lastName}`
                : "Guest"}
            </p>
            <p>{folio.reservation.guests?.[0]?.email || ""}</p>
            <p>{folio.reservation.guests?.[0]?.phone || ""}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 uppercase">Stay Details</h4>
            <p className="mt-1">Room: <span className="font-bold">Room {folio.reservation.room?.number}</span></p>
            <p>Dates: {new Date(folio.reservation.checkIn).toLocaleDateString()} to {new Date(folio.reservation.checkOut).toLocaleDateString()}</p>
            <p>Status: {folio.status} Ledger</p>
          </div>
        </div>
      </div>

      {/* Main UI Header */}
      <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3">
          <Link
            href="/frontdesk"
            className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Stay Folio & Billing</h2>
            <p className="text-xxs text-text-secondary">Reservation ID: {reservationId.substring(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <HeaderStaffSwitcher />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center p-2 text-xs font-semibold border border-border-default rounded bg-surface hover:bg-surface-hover transition-all"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Print Statement
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-6 print:p-0 print:max-w-none">
        <RoleProtected allowedRoles={["FRONT_DESK", "MANAGER"]}>
          <>
        {/* Info panel */}
        <div className="bg-surface border border-border-default rounded-lg p-6 flex flex-col md:flex-row md:justify-between gap-6 print:border-none print:p-0">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black text-text-primary">
                {folio.reservation.guests?.[0]
                  ? `${folio.reservation.guests[0].firstName} ${folio.reservation.guests[0].lastName}`
                  : "Direct Guest"}
              </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xxs font-bold uppercase tracking-wider border ${
                  folio.status === "OPEN"
                    ? "bg-warning/10 text-warning border-warning/20"
                    : "bg-success/10 text-success border-success/20"
                }`}
              >
                {folio.status} Ledger
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-text-muted font-medium block">Room Assigned</span>
                <span className="font-bold text-text-primary">Room {folio.reservation.room?.number}</span>
              </div>
              <div>
                <span className="text-text-muted font-medium block">Room Type</span>
                <span className="font-semibold text-text-secondary">{folio.reservation.room?.roomType?.name || "Standard"}</span>
              </div>
              <div>
                <span className="text-text-muted font-medium block">Stay Dates</span>
                <span className="font-medium text-text-secondary">
                  {new Date(folio.reservation.checkIn).toLocaleDateString()} ➔ {new Date(folio.reservation.checkOut).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-text-muted font-medium block">Guest Contact</span>
                <span className="font-medium text-text-secondary">{folio.reservation.guests?.[0]?.phone || "No phone"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between items-end gap-3 print:hidden">
            <div className="flex flex-wrap gap-2 justify-end">
              {folio.status === "OPEN" && (
                <>
                  <button
                    onClick={() => setIsChargeOpen(true)}
                    className="inline-flex items-center px-3.5 py-2 text-xs font-semibold border border-border-default rounded bg-surface hover:bg-surface-hover text-text-primary transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Post Charge
                  </button>
                  <button
                    onClick={handleOpenPayment}
                    className="inline-flex items-center px-3.5 py-2 text-xs font-semibold border border-transparent rounded text-white bg-primary hover:bg-primary-hover shadow-small transition-all"
                  >
                    <CreditCard className="w-4 h-4 mr-1.5" /> Record Payment
                  </button>
                </>
              )}
            </div>
            {folio.status === "OPEN" && (
              <button
                onClick={handleSettleAndClose}
                disabled={isActionLoading}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 text-xs font-bold text-white bg-success hover:bg-success/95 rounded shadow-small transition-all disabled:opacity-50"
              >
                {isActionLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Settle & Close Folio
              </button>
            )}
          </div>
        </div>

        {/* Ledger Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
          <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small print:p-2 print:border-slate-300">
            <div className="text-xxs font-semibold text-text-muted uppercase tracking-wider">Charges Subtotal</div>
            <div className="text-lg font-bold text-text-primary mt-1">INR {subtotalCharges.toFixed(2)}</div>
          </div>
          <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small print:p-2 print:border-slate-300">
            <div className="text-xxs font-semibold text-text-muted uppercase tracking-wider">Taxes Total</div>
            <div className="text-lg font-bold text-text-primary mt-1">INR {totalTax.toFixed(2)}</div>
          </div>
          <div className="bg-surface border border-border-default rounded-lg p-4 shadow-small print:p-2 print:border-slate-300">
            <div className="text-xxs font-semibold text-text-muted uppercase tracking-wider">Total Payments</div>
            <div className="text-lg font-bold text-indigo-500 mt-1">INR {totalPayments.toFixed(2)}</div>
          </div>
          <div className={`border rounded-lg p-4 shadow-small print:p-2 ${
            balanceDue > 0.05
              ? "bg-error/5 border-error/20 text-error"
              : balanceDue < -0.05
              ? "bg-warning/5 border-warning/20 text-warning"
              : "bg-success/5 border-success/20 text-success"
          }`}>
            <div className="text-xxs font-bold uppercase tracking-wider">Net Balance Due</div>
            <div className="text-xl font-black mt-1 flex items-center">
              INR {balanceDue.toFixed(2)}
              {Math.abs(balanceDue) <= 0.05 && (
                <CheckCircle2 className="w-4.5 h-4.5 text-success ml-1.5 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Ledger Items Table */}
        <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden print:border-none print:shadow-none">
          <div className="p-4 border-b border-border-default flex justify-between items-center print:hidden">
            <h3 className="text-sm font-bold text-text-primary">Folio Statement Ledger</h3>
            <span className="text-xs text-text-muted font-medium">{ledgerItems.length} transactions recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse print:text-xs">
              <thead>
                <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                  <th className="p-4 print:p-2">Date</th>
                  <th className="p-4 print:p-2">Description</th>
                  <th className="p-4 print:p-2">Type</th>
                  <th className="p-4 print:p-2 text-right">Amount (INR)</th>
                  <th className="p-4 print:p-2 text-right">Tax (INR)</th>
                  <th className="p-4 print:p-2 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default text-sm print:divide-slate-300">
                {ledgerItems.map((item) => {
                  const isCharge = item.type === "CHARGE";
                  return (
                    <tr key={item.id} className="hover:bg-surface-secondary/30 transition-all print:hover:bg-transparent">
                      <td className="p-4 print:p-2 text-text-secondary text-xs">{item.date.toLocaleDateString()}</td>
                      <td className="p-4 print:p-2 font-medium text-text-primary">{item.description}</td>
                      <td className="p-4 print:p-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xxs font-bold border ${
                          isCharge
                            ? "bg-warning/10 text-warning border-warning/20"
                            : item.type === "REFUND"
                            ? "bg-error/10 text-error border-error/20"
                            : "bg-success/10 text-success border-success/20"
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 print:p-2 text-right text-text-secondary font-mono">
                        {isCharge ? item.amount.toFixed(2) : ""}
                      </td>
                      <td className="p-4 print:p-2 text-right text-text-secondary font-mono">
                        {isCharge ? item.tax.toFixed(2) : ""}
                      </td>
                      <td className={`p-4 print:p-2 text-right font-bold font-mono ${isCharge ? 'text-text-primary' : 'text-indigo-500'}`}>
                        {item.total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Footer Details (Print only) */}
        <div className="hidden print:block pt-12 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-800">Thank you for staying with us!</p>
          <p className="mt-1">For any queries regarding this statement, please contact hotel operations.</p>
          <div className="mt-12 flex justify-between items-center border-t border-slate-300 pt-6">
            <div className="w-48 border-b border-slate-400 h-10 flex items-end justify-center">Guest Signature</div>
            <div className="w-48 border-b border-slate-400 h-10 flex items-end justify-center">Authorized Signature</div>
          </div>
        </div>
          </>
        </RoleProtected>
      </main>

      {/* Post Charge Modal */}
      {isChargeOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary">Post Folio Charge</h3>
              <button onClick={() => setIsChargeOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostCharge} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Charge Category</label>
                <select
                  value={chargeForm.type}
                  onChange={(e) => setChargeForm({ ...chargeForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                >
                  <option value="ROOM_SERVICE">Room Service</option>
                  <option value="RESTAURANT">Dining / Restaurant</option>
                  <option value="SPA">Spa & Health Club</option>
                  <option value="TAX">Tax Adjustment</option>
                  <option value="OTHER">Other Miscellaneous</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Amount (INR)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={chargeForm.amount}
                    onChange={(e) => handleChargeAmountChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">GST Tax (12%)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={chargeForm.taxAmount}
                    onChange={(e) => setChargeForm({ ...chargeForm, taxAmount: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Minibar - 2 water bottles"
                  value={chargeForm.description}
                  onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsChargeOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Post Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border-default rounded-lg max-w-sm w-full shadow-modal p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary">Record Transaction</h3>
              <button onClick={() => setIsPaymentOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Type</label>
                  <select
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  >
                    <option value="PAYMENT">Payment (Credit)</option>
                    <option value="REFUND">Refund (Debit)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Payment Method</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                  >
                    <option value="UPI">UPI / QR Scan</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Amount (INR)</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Transaction Reference (ID)</label>
                <input
                  type="text"
                  placeholder="e.g. TXN9876543210"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-small"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

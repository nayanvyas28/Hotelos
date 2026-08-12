"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import { getCompaniesAction, createCompanyAction, linkGuestToCompanyAction, getCompanyDetailsAction } from "@/app/actions/corporate";
import { getGuestsAction } from "@/app/actions/guest";
import { getReservationsAction } from "@/app/actions/reservation";
import {
  Hotel,
  Briefcase,
  Plus,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import HeaderStaffSwitcher from "@/components/layout/HeaderStaffSwitcher";

export default function CorporateCRMPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [companies, setCompanies] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forms
  const [companyForm, setCompanyForm] = useState({
    name: "",
    taxId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    discountPercent: "",
  });

  const [linkForm, setLinkForm] = useState({
    guestId: "",
    companyId: "",
  });

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

  const loadCorporateData = async () => {
    if (!selectedPropertyId) return;
    setError(null);
    try {
      const companiesRes = await getCompaniesAction(selectedPropertyId);
      if (companiesRes.success) {
        setCompanies(companiesRes.companies || []);
      }

      const guestsRes = await getGuestsAction({ propertyId: selectedPropertyId });
      if (guestsRes.success) {
        setGuests(guestsRes.guests || []);
      }

      const resRes = await getReservationsAction({ propertyId: selectedPropertyId });
      if (resRes.success) {
        setReservations(resRes.reservations || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load corporate accounts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setIsLoading(true);
      loadCorporateData();
      setSelectedCompanyId(null);
      setSelectedCompanyDetails(null);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    async function loadDetails() {
      if (!selectedCompanyId) {
        setSelectedCompanyDetails(null);
        return;
      }
      try {
        const res = await getCompanyDetailsAction(selectedCompanyId);
        if (res.success) {
          setSelectedCompanyDetails(res.company);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch corporate details.");
      }
    }
    loadDetails();
  }, [selectedCompanyId]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name || !selectedPropertyId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await createCompanyAction({
        propertyId: selectedPropertyId,
        name: companyForm.name,
        taxId: companyForm.taxId,
        contactName: companyForm.contactName,
        contactEmail: companyForm.contactEmail,
        contactPhone: companyForm.contactPhone,
        discountPercent: Number(companyForm.discountPercent || 0),
      });

      if (res.success) {
        setCompanyForm({
          name: "",
          taxId: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          discountPercent: "",
        });
        await loadCorporateData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to register corporate profile.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLinkGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.guestId || !linkForm.companyId) return;

    setIsActionLoading(true);
    setError(null);
    try {
      const res = await linkGuestToCompanyAction(linkForm.guestId, linkForm.companyId);
      if (res.success) {
        setLinkForm({ guestId: "", companyId: "" });
        alert("Employee mapped to corporate account successfully!");
        await loadCorporateData();
        if (selectedCompanyId) {
          // reload details
          const detailsRes = await getCompanyDetailsAction(selectedCompanyId);
          if (detailsRes.success) {
            setSelectedCompanyDetails(detailsRes.company);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to map guest to company.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter corporate reservations
  const corporateStays = reservations.filter((r) => r.companyId !== null);

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
              onClick={loadCorporateData}
              disabled={isActionLoading || isLoading}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${isLoading || isActionLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-sm text-error flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading Corporate profiles...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Hotel className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Complete onboarding setup to begin managing corporate contract accounts.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">Corporate CRM & Guest Profiles</h1>
                <p className="text-sm text-text-secondary">
                  Manage contracted agreements, register company billing profiles, and map guest accounts to corporate contracts.
                </p>
              </div>

              {/* Top Row: Account Registration & Linker */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Register Corporate Account */}
                <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                  <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-sm text-text-primary">Register Corporate Account</h2>
                  </div>

                  <form onSubmit={handleCreateCompany} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary block">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Google India"
                        value={companyForm.name}
                        onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary block">Tax ID / GSTIN</label>
                      <input
                        type="text"
                        placeholder="e.g. 07AAAAC1111A1Z1"
                        value={companyForm.taxId}
                        onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary block">Contact Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sen"
                        value={companyForm.contactName}
                        onChange={(e) => setCompanyForm({ ...companyForm, contactName: e.target.value })}
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary block">Contract Discount (%)</label>
                      <input
                        type="number"
                        placeholder="e.g. 15 for 15% off stays"
                        value={companyForm.discountPercent}
                        onChange={(e) => setCompanyForm({ ...companyForm, discountPercent: e.target.value })}
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary block">Contact Email</label>
                      <input
                        type="email"
                        placeholder="hr@google.com"
                        value={companyForm.contactEmail}
                        onChange={(e) => setCompanyForm({ ...companyForm, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary block">Contact Phone</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={companyForm.contactPhone}
                        onChange={(e) => setCompanyForm({ ...companyForm, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isActionLoading || !companyForm.name}
                      className="col-span-2 py-2 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white text-xs font-bold rounded shadow transition-all inline-flex justify-center items-center cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Save Corporate Profile
                    </button>
                  </form>
                </div>

                {/* 2. Employee Profile Linker */}
                <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                      <LinkIcon className="w-5 h-5 text-primary" />
                      <h2 className="font-bold text-sm text-text-primary">Map Employee to Corporate Account</h2>
                    </div>

                    <form onSubmit={handleLinkGuest} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Select Guest (CRM Profile)</label>
                        <select
                          value={linkForm.guestId}
                          onChange={(e) => setLinkForm({ ...linkForm, guestId: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        >
                          <option value="">Select guest...</option>
                          {guests.map((g) => (
                            <option key={g.id} value={g.id}>
                              👤 {g.firstName} {g.lastName} {g.email ? `(${g.email})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary block">Select Target Corporate Account</label>
                        <select
                          value={linkForm.companyId}
                          onChange={(e) => setLinkForm({ ...linkForm, companyId: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-border-default rounded bg-surface text-xs text-text-primary focus:outline-none"
                        >
                          <option value="">Select company...</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              🏢 {c.name} ({c.discountPercent}% discount)
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isActionLoading || !linkForm.guestId || !linkForm.companyId}
                        className="w-full py-2 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white text-xs font-bold rounded shadow transition-all inline-flex justify-center items-center cursor-pointer"
                      >
                        <LinkIcon className="w-4 h-4 mr-1.5" /> Map Employee
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Main Workspace Section: Corporate list & Detailed Pane */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Companies Catalog List */}
                <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                  <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                    <Users className="w-5 h-5 text-text-secondary" />
                    <h2 className="font-bold text-sm text-text-primary">Corporate Accounts Catalog</h2>
                  </div>

                  <div className="divide-y divide-border-default max-h-[400px] overflow-y-auto pr-1">
                    {companies.length === 0 ? (
                      <p className="text-xxs text-text-muted py-4 text-center">No corporate contract accounts.</p>
                    ) : (
                      companies.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCompanyId(c.id)}
                          className={`w-full text-left py-3 px-3 rounded-lg transition-all flex justify-between items-center ${
                            selectedCompanyId === c.id
                              ? "bg-primary/5 border border-primary/20"
                              : "hover:bg-surface-hover/40"
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs text-text-primary">{c.name}</div>
                            <div className="text-[10px] text-text-secondary mt-0.5">Tax ID: {c.taxId || "N/A"}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-success/10 text-success text-[10px] font-bold">
                            -{c.discountPercent}%
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Company Details Pane */}
                <div className="lg:col-span-2">
                  {selectedCompanyDetails ? (
                    <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-6">
                      {/* Company Stats header */}
                      <div className="border-b border-border-default pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                          <h3 className="font-black text-base text-text-primary">{selectedCompanyDetails.name}</h3>
                          <p className="text-xxs text-text-secondary mt-1">
                            Contact Person: {selectedCompanyDetails.contactName || "None"} • Email: {selectedCompanyDetails.contactEmail || "N/A"}
                          </p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-right">
                          <span className="text-[10px] font-bold text-indigo-700 block uppercase tracking-wider">Contracted Stay discount</span>
                          <span className="font-black text-indigo-800 text-lg">{selectedCompanyDetails.discountPercent}% OFF</span>
                        </div>
                      </div>

                      {/* Employees List */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-text-primary flex items-center space-x-1.5">
                          <User className="w-4 h-4 text-text-secondary" />
                          <span>Associated Guests (Employees) ({selectedCompanyDetails.guests?.length || 0})</span>
                        </h4>
                        <div className="border border-border-default rounded divide-y divide-border-default bg-surface-secondary/20 max-h-[150px] overflow-y-auto">
                          {selectedCompanyDetails.guests?.length === 0 ? (
                            <p className="text-xxs text-text-muted p-4 text-center">No employee profiles mapped to this corporate account.</p>
                          ) : (
                            selectedCompanyDetails.guests.map((g: any) => (
                              <div key={g.id} className="p-2.5 flex justify-between items-center text-xxs">
                                <span className="font-bold text-text-primary">{g.firstName} {g.lastName}</span>
                                <span className="text-text-secondary">{g.email} • {g.phone}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Corporate Booking history */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-text-primary flex items-center space-x-1.5">
                          <FileText className="w-4 h-4 text-text-secondary" />
                          <span>Contracted Stays Log Ledger ({selectedCompanyDetails.reservations?.length || 0})</span>
                        </h4>
                        <div className="border border-border-default rounded overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xxs">
                            <thead>
                              <tr className="bg-surface-secondary text-text-muted font-bold uppercase tracking-wider text-[9px] border-b border-border-default">
                                <th className="py-2 px-3">Guest</th>
                                <th className="py-2 px-3">Room</th>
                                <th className="py-2 px-3">Check-in</th>
                                <th className="py-2 px-3">Check-out</th>
                                <th className="py-2 px-3">Billing route</th>
                                <th className="py-2 px-3 text-right">Stay Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                              {selectedCompanyDetails.reservations?.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-6 text-center text-text-muted">
                                    No stay bookings recorded under this corporate agreement.
                                  </td>
                                </tr>
                              ) : (
                                selectedCompanyDetails.reservations.map((r: any) => (
                                  <tr key={r.id}>
                                    <td className="py-2 px-3 font-bold text-text-primary">
                                      {r.guests[0]?.firstName} {r.guests[0]?.lastName}
                                    </td>
                                    <td className="py-2 px-3">Room {r.room.number}</td>
                                    <td className="py-2 px-3">{new Date(r.checkIn).toLocaleDateString()}</td>
                                    <td className="py-2 px-3">{new Date(r.checkOut).toLocaleDateString()}</td>
                                    <td className="py-2 px-3">
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                        r.billingType === "COMPANY_PAY" ? "bg-primary-light text-primary" : "bg-slate-100 text-slate-700"
                                      }`}>
                                        {r.billingType}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-right font-bold text-text-primary">
                                      INR {r.totalPrice.toFixed(2)}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface border border-border-default border-dashed rounded-lg p-16 text-center text-text-secondary flex flex-col items-center justify-center space-y-4">
                      <Compass className="w-12 h-12 text-text-muted animate-spin-slow" />
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-text-primary">Corporate Detail Viewer</h3>
                        <p className="text-xs text-text-secondary max-w-sm">
                          Select a corporate account from the list to inspect linked employees, contract rates, and billing routing stays history.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Corporate Stays Ledger */}
              <div className="bg-surface border border-border-default rounded-lg p-6 shadow-small space-y-4">
                <div className="flex items-center space-x-2 border-b border-border-default pb-3">
                  <CreditCard className="w-5 h-5 text-text-secondary" />
                  <h2 className="font-bold text-sm text-text-primary">Global Corporate Billing Routing Ledger</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-secondary text-text-muted font-bold uppercase tracking-wider text-[10px] border-b border-border-default">
                        <th className="py-3 px-4">Guest Stay</th>
                        <th className="py-3 px-4">Corporate Client</th>
                        <th className="py-3 px-4">Billing Profile Route</th>
                        <th className="py-3 px-4">Check-in</th>
                        <th className="py-3 px-4">Check-out</th>
                        <th className="py-3 px-4 text-right">Stay Charge</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default font-medium text-text-secondary">
                      {corporateStays.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-text-muted">
                            No corporate billing stays recorded.
                          </td>
                        </tr>
                      ) : (
                        corporateStays.map((r) => {
                          const linkedCompany = companies.find((c) => c.id === r.companyId);
                          return (
                            <tr key={r.id} className="hover:bg-surface-hover/20">
                              <td className="py-3 px-4 font-bold text-text-primary">
                                {r.guests[0]?.firstName} {r.guests[0]?.lastName}
                              </td>
                              <td className="py-3 px-4 font-bold">
                                🏢 {linkedCompany?.name || "Corporate Account"}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.billingType === "COMPANY_PAY" ? "bg-primary-light text-primary" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {r.billingType}
                                </span>
                              </td>
                              <td className="py-3 px-4">{new Date(r.checkIn).toLocaleDateString()}</td>
                              <td className="py-3 px-4">{new Date(r.checkOut).toLocaleDateString()}</td>
                              <td className="py-3 px-4 text-right font-bold text-text-primary">
                                INR {r.totalPrice.toFixed(2)}
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-[10px] font-bold text-success">● {r.status}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

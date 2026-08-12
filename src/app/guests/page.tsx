"use client";

import { useState, useEffect } from "react";
import { getPropertiesAction } from "@/app/actions/property";
import { getGuestsAction, createGuestAction, updateGuestAction, deleteGuestAction } from "@/app/actions/guest";
import GuestForm from "@/components/guest/GuestForm";
import { Hotel, Users, Search, Crown, Plus, Trash2, Edit2, Loader2, ArrowRight, KeyRound, Calendar as CalendarIcon, Brush, BarChart3, Utensils, Archive, Sparkles, HeartPulse } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

export default function GuestDirectoryPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  
  const [guests, setGuests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [vipOnly, setVipOnly] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<any | null>(null);

  // Fetch properties on mount
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

  // Fetch guests whenever property, search query, or VIP toggle changes
  useEffect(() => {
    if (!selectedPropertyId) return;

    async function loadGuests() {
      setError(null);
      try {
        const res = await getGuestsAction({
          propertyId: selectedPropertyId,
          search: searchQuery,
          vipOnly,
        });
        if (res.success) {
          setGuests(res.guests);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load guests.");
      }
    }

    const timer = setTimeout(() => {
      loadGuests();
    }, 300); // Debounce search queries

    return () => clearTimeout(timer);
  }, [selectedPropertyId, searchQuery, vipOnly]);

  const handleSaveGuest = async (formData: any) => {
    setIsSubmitLoading(true);
    try {
      if (editingGuest) {
        // Update guest
        const res = await updateGuestAction(editingGuest.id, formData);
        if (res.success) {
          setGuests(guests.map((g) => (g.id === editingGuest.id ? { ...g, ...res.guest } : g)));
          setIsModalOpen(false);
          setEditingGuest(null);
        }
      } else {
        // Create new guest
        const res = await createGuestAction({
          ...formData,
          propertyId: selectedPropertyId,
        });
        if (res.success) {
          setGuests([res.guest, ...guests]);
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      throw new Error(err.message || "Failed to save guest.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (confirm("Are you sure you want to delete this guest profile? This action cannot be undone.")) {
      try {
        const res = await deleteGuestAction(id);
        if (res.success) {
          setGuests(guests.filter((g) => g.id !== id));
        }
      } catch (err: any) {
        alert(err.message || "Failed to delete guest.");
      }
    }
  };

  const handleEditClick = (guest: any) => {
    setEditingGuest(guest);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      {/* 1. Sidebar Panel */}
      <Sidebar />

      {/* 2. Main Dashboard Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Navigation */}
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
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
              N
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading properties database...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 space-y-6 bg-surface p-8 border border-border-default rounded-lg shadow-small">
              <Hotel className="w-12 h-12 text-text-muted mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">No Property Configured</h3>
                <p className="text-sm text-text-secondary">
                  Please complete the onboarding wizard first to set up your organization and property floors/rooms.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="inline-flex justify-center items-center py-2.5 px-5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded shadow-small transition-all"
              >
                Start Onboarding Wizard <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight">Guests CRM</h1>
                  <p className="text-sm text-text-secondary">
                    Manage guest profiles, check histories, and identity documents.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingGuest(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center py-2 px-4 border border-transparent rounded shadow-small text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-all"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Guest
                </button>
              </div>

              {/* Filters search */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface border border-border-default rounded-md">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search guest by name, email, phone, or nationality..."
                    className="w-full pl-9 pr-4 py-2 border border-border-default rounded bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="vipFilter"
                    type="checkbox"
                    checked={vipOnly}
                    onChange={(e) => setVipOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border-default"
                  />
                  <label htmlFor="vipFilter" className="text-sm font-medium text-text-secondary cursor-pointer select-none">
                    VIP Guests Only
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Guest List Grid/Table */}
              <div className="bg-surface border border-border-default rounded-lg shadow-small overflow-hidden">
                {guests.length === 0 ? (
                  <div className="text-center py-16 text-text-secondary">
                    <Users className="w-10 h-10 text-text-muted mx-auto mb-2" />
                    <p className="text-sm font-medium">No guest profiles found</p>
                    <p className="text-xs text-text-muted mt-1">Try broadening your search query or add a new guest.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-secondary border-b border-border-default text-xxs font-semibold text-text-muted uppercase tracking-wider">
                          <th className="p-4">Name</th>
                          <th className="p-4">Contact Info</th>
                          <th className="p-4">Nationality</th>
                          <th className="p-4">VIP Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default text-sm">
                        {guests.map((g) => (
                          <tr key={g.id} className="hover:bg-surface-secondary/50 transition-all">
                            <td className="p-4">
                              <Link
                                href={`/guests/${g.id}`}
                                className="font-semibold text-primary hover:underline block"
                              >
                                {g.firstName} {g.lastName}
                              </Link>
                            </td>
                            <td className="p-4 space-y-0.5">
                              <div className="text-text-primary text-xs">{g.email || "-"}</div>
                              <div className="text-text-secondary text-xs">{g.phone || "-"}</div>
                            </td>
                            <td className="p-4 text-text-secondary">{g.nationality || "-"}</td>
                            <td className="p-4">
                              {g.vipStatus ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
                                  <Crown className="w-3 h-3 mr-1" /> VIP
                                </span>
                              ) : (
                                <span className="text-text-muted text-xs">Standard</span>
                              )}
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => handleEditClick(g)}
                                className="p-1.5 text-text-muted hover:text-primary rounded hover:bg-surface-hover transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGuest(g.id)}
                                className="p-1.5 text-text-muted hover:text-error rounded hover:bg-surface-hover transition-all"
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
            </div>
          )}
        </main>
      </div>

      {/* Guest Modal */}
      {isModalOpen && (
        <GuestForm
          initialData={editingGuest}
          onSave={handleSaveGuest}
          onClose={() => {
            setIsModalOpen(false);
            setEditingGuest(null);
          }}
          isLoading={isSubmitLoading}
        />
      )}
    </div>
  );
}

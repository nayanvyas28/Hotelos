"use client";

import { useState, useEffect } from "react";
import { getGuestDetailAction, addGuestNoteAction, deleteGuestAction } from "@/app/actions/guest";
import { ArrowLeft, User, MapPin, FileText, Calendar, Plus, Loader2, Crown, Trash2, Send, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function GuestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const guestId = params.id as string;

  const [guest, setGuest] = useState<any | null>(null);
  const [noteText, setNoteText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isNoteLoading, setIsNoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guestId) return;

    async function loadGuestDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getGuestDetailAction(guestId);
        if (res.success) {
          setGuest(res.guest);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load guest profile.");
      } finally {
        setIsLoading(false);
      }
    }

    loadGuestDetail();
  }, [guestId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsNoteLoading(true);
    try {
      const res = await addGuestNoteAction(guestId, noteText);
      if (res.success && res.note) {
        setGuest({
          ...guest,
          notes: [res.note, ...(guest.notes || [])],
        });
        setNoteText("");
      }
    } catch (err: any) {
      alert(err.message || "Failed to add note.");
    } finally {
      setIsNoteLoading(false);
    }
  };

  const handleDeleteGuest = async () => {
    if (confirm("Are you sure you want to delete this guest profile? This action cannot be undone.")) {
      try {
        const res = await deleteGuestAction(guestId);
        if (res.success) {
          router.push("/guests");
        }
      } catch (err: any) {
        alert(err.message || "Failed to delete guest.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg text-text-primary space-y-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-text-secondary">Loading guest profile detail...</p>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg text-text-primary p-6">
        <div className="max-w-md mx-auto text-center space-y-4 bg-surface p-8 border border-border-default rounded-lg">
          <h3 className="text-lg font-bold text-error">Error Loading Profile</h3>
          <p className="text-sm text-text-secondary">{error || "Guest profile was not found."}</p>
          <Link
            href="/guests"
            className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Guests Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg text-text-primary pb-12">
      {/* 1. Header Navigation */}
      <header className="h-16 bg-surface border-b border-border-default px-6 flex items-center justify-between">
        <Link
          href="/guests"
          className="flex items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-all"
        >
          <ArrowLeft className="w-4.5 h-4.5 mr-1.5" /> Back to Directory
        </Link>
        <button
          onClick={handleDeleteGuest}
          className="flex items-center py-1.5 px-3 border border-error/20 rounded text-xs font-semibold text-error bg-error/5 hover:bg-error/10 transition-all"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Delete Profile
        </button>
      </header>

      {/* 2. Profile body Grid */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Guest Overview Card */}
        <div className="bg-surface border border-border-default rounded-lg p-6 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-small">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                  {guest.firstName} {guest.lastName}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-black bg-success/10 text-success border border-success/20 uppercase tracking-wider">
                  Reltio Synced
                </span>
                {guest.vipStatus && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-black bg-warning/10 text-warning border border-warning/20 uppercase tracking-wider">
                    <Crown className="w-3 h-3 mr-1" /> VVIP Platinum
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">{guest.email || "No email registered"}</p>
              <div className="text-xs text-text-muted flex flex-wrap gap-x-4">
                <span>Phone: {guest.phone || "No phone registered"}</span>
                <span className="font-mono text-[10px] text-primary">Reltio UID: RELTIO-{guest.id.substring(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-text-muted sm:text-right">
            Joined {new Date(guest.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left panel: Metadata */}
          <div className="md:col-span-1 space-y-6">
            {/* Reltio Guest 360 Stats */}
            <div className="bg-surface border border-border-default rounded-lg p-5 space-y-4 shadow-small">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center">
                <Crown className="w-4 h-4 mr-1.5 text-primary" /> Guest 360 Index
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-text-muted block">Loyalty Tier Rank</span>
                  <span className="font-bold text-text-primary">Platinum Club Member</span>
                </div>
                <div>
                  <span className="text-xs text-text-muted block">Group Stay Count</span>
                  <span className="font-semibold text-text-primary">12 stays globally</span>
                </div>
                <div>
                  <span className="text-xs text-text-muted block">Lifetime Group Spend</span>
                  <span className="font-bold text-success font-mono">INR 2,45,000.00</span>
                </div>
              </div>
            </div>

            {/* Guest Preferences */}
            <div className="bg-surface border border-border-default rounded-lg p-5 space-y-4 shadow-small">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center">
                <Settings className="w-4 h-4 mr-1.5 text-primary" /> Stay Preferences
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border-default/50">
                  <span className="text-text-muted">Room Level</span>
                  <span className="font-bold text-text-secondary">Low Floor Requested</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default/50">
                  <span className="text-text-muted">Pillow Type</span>
                  <span className="font-bold text-text-secondary">Feather Pillow</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default/50">
                  <span className="text-text-muted">Dietary</span>
                  <span className="font-bold text-text-secondary">Vegetarian Choice</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Airport Shuttle</span>
                  <span className="font-bold text-text-secondary">Private Cab Shuttle</span>
                </div>
              </div>
            </div>

            {/* Identity Info */}
            <div className="bg-surface border border-border-default rounded-lg p-5 space-y-4 shadow-small">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 mr-1.5 text-primary" /> Identity
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-text-muted block">Nationality</span>
                  <span className="font-semibold text-text-primary">{guest.nationality || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-text-muted block">Date of Birth</span>
                  <span className="font-semibold text-text-primary">
                    {guest.dateOfBirth
                      ? new Date(guest.dateOfBirth).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                {guest.documents?.[0] && (
                  <div className="pt-2 border-t border-border-default">
                    <span className="text-xs text-text-muted block">
                      {guest.documents[0].type.replace("_", " ")}
                    </span>
                    <span className="font-mono text-xs font-bold text-text-primary">
                      {guest.documents[0].documentNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Address Info */}
            <div className="bg-surface border border-border-default rounded-lg p-5 space-y-4 shadow-small">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-primary" /> Address
              </h3>
              {guest.addresses?.[0] ? (
                <div className="text-sm space-y-1.5 text-text-primary">
                  <p className="font-medium">{guest.addresses[0].addressLine1}</p>
                  <p className="text-text-secondary">
                    {guest.addresses[0].city}, {guest.addresses[0].state}
                  </p>
                  <p className="text-text-muted">
                    {guest.addresses[0].country} - {guest.addresses[0].postalCode}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">No address details registered.</p>
              )}
            </div>
          </div>

          {/* Right panel: Notes CRM Thread */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-surface border border-border-default rounded-lg p-6 space-y-4 shadow-small flex flex-col h-full min-h-[400px]">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                Staff CRM Notes
              </h3>

              {/* Note thread */}
              <div className="flex-1 overflow-y-auto max-h-[300px] border border-border-default rounded bg-surface-secondary p-4 space-y-3">
                {(!guest.notes || guest.notes.length === 0) ? (
                  <div className="text-center py-10 text-xs text-text-muted italic">
                    No staff notes registered for this guest. Add a note below to document preferences, VIP requests, or complains.
                  </div>
                ) : (
                  guest.notes.map((n: any) => (
                    <div key={n.id} className="p-3 border border-border-default rounded bg-surface space-y-1 shadow-small">
                      <p className="text-sm text-text-primary">{n.text}</p>
                      <div className="text-[10px] text-text-muted flex justify-between">
                        <span>Staff Note</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type a new guest note (e.g. Prefers low floor rooms)..."
                  disabled={isNoteLoading}
                  className="flex-1 px-4 py-2 border border-border-default rounded bg-surface text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isNoteLoading || !noteText.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded font-semibold text-sm flex items-center transition-all disabled:opacity-50"
                >
                  {isNoteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1.5" /> Post Note
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

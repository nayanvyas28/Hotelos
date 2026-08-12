"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

interface GuestFormProps {
  initialData?: any;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export default function GuestForm({ initialData, onSave, onClose, isLoading }: GuestFormProps) {
  const [firstName, setFirstName] = useState(initialData?.firstName || "");
  const [lastName, setLastName] = useState(initialData?.lastName || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [nationality, setNationality] = useState(initialData?.nationality || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    initialData?.dateOfBirth
      ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
      : ""
  );
  const [vipStatus, setVipStatus] = useState(!!initialData?.vipStatus);

  // Address
  const addressObj = initialData?.addresses?.[0] || {};
  const [addressLine1, setAddressLine1] = useState(addressObj.addressLine1 || "");
  const [city, setCity] = useState(addressObj.city || "");
  const [state, setState] = useState(addressObj.state || "");
  const [country, setCountry] = useState(addressObj.country || "");
  const [postalCode, setPostalCode] = useState(addressObj.postalCode || "");

  // Document
  const docObj = initialData?.documents?.[0] || {};
  const [docType, setDocType] = useState(docObj.type || "PASSPORT");
  const [docNumber, setDocNumber] = useState(docObj.documentNumber || "");

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setFormError("First name and last name are required");
      return;
    }

    setFormError(null);
    try {
      await onSave({
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        nationality: nationality || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        vipStatus,
        address: addressLine1.trim()
          ? {
              addressLine1,
              city,
              state,
              country,
              postalCode,
            }
          : undefined,
        document: docNumber.trim()
          ? {
              type: docType,
              documentNumber: docNumber,
            }
          : undefined,
      });
    } catch (err: any) {
      setFormError(err.message || "Failed to save guest.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-surface border border-border-default rounded-lg max-w-xl w-full max-h-[90vh] flex flex-col shadow-modal">
        {/* Modal Header */}
        <div className="p-4 border-b border-border-default flex justify-between items-center bg-surface-secondary rounded-t-lg">
          <h3 className="text-lg font-bold text-text-primary">
            {initialData ? "Edit Guest Profile" : "Add New Guest"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-surface transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-md text-error text-sm font-medium">
              {formError}
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              1. Basic Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Rahul"
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sharma"
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Nationality</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Indian"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                id="vipStatus"
                type="checkbox"
                checked={vipStatus}
                onChange={(e) => setVipStatus(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border-default"
              />
              <label htmlFor="vipStatus" className="text-sm font-medium text-text-primary">
                Mark as VIP Guest
              </label>
            </div>
          </div>

          <hr className="border-border-default" />

          {/* Section 2: Address */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              2. Address Details <span className="text-text-muted font-normal lowercase">(optional)</span>
            </h4>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">Street Address</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="123 Main Street, Sector 4"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bhopal"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">State / Region</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Madhya Pradesh"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="462001"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-border-default" />

          {/* Section 3: Identity Document */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              3. Identification Document <span className="text-text-muted font-normal lowercase">(optional)</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none"
                >
                  <option value="PASSPORT">Passport</option>
                  <option value="NATIONAL_ID">National ID / Aadhaar</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Document Number</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. L98765432"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-default rounded bg-surface transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !firstName.trim() || !lastName.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded shadow-small flex items-center transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Guest"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

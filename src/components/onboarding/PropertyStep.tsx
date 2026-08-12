"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PropertyStepProps {
  onNext: (data: { name: string; currency: string; timezone: string; address?: string }) => void;
  isLoading: boolean;
  error: string | null;
}

export default function PropertyStep({ onNext, isLoading, error }: PropertyStepProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNext({
        name: name.trim(),
        address: address.trim() || undefined,
        currency,
        timezone,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Configure your Hotel Property
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Set up the main details, currency, and timezone for this specific property.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="propertyName" className="block text-sm font-medium text-text-secondary">
            Property Name
          </label>
          <input
            id="propertyName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grand Horizon Lakeview Resort"
            required
            disabled={isLoading}
            className="w-full px-4 py-3 border border-border-default rounded-md bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="propertyAddress" className="block text-sm font-medium text-text-secondary">
            Address <span className="text-text-muted font-normal">(Optional)</span>
          </label>
          <input
            id="propertyAddress"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Lake Road, Bhopal, MP, India"
            disabled={isLoading}
            className="w-full px-4 py-3 border border-border-default rounded-md bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="currency" className="block text-sm font-medium text-text-secondary">
              Default Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all"
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="timezone" className="block text-sm font-medium text-text-secondary">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC (GMT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-md text-error text-sm font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !name.trim()}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-small text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Property...
          </>
        ) : (
          "Continue to Room Setup"
        )}
      </button>
    </form>
  );
}

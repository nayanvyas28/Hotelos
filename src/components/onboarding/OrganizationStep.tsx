"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface OrganizationStepProps {
  onNext: (orgName: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function OrganizationStep({ onNext, isLoading, error }: OrganizationStepProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNext(name.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Let's create your Organization
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Enter the name of your hotel brand, company, or organization to get started.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="orgName" className="block text-sm font-medium text-text-secondary">
          Organization Name
        </label>
        <input
          id="orgName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Grand Horizon Hotels"
          required
          disabled={isLoading}
          className="w-full px-4 py-3 border border-border-default rounded-md bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all"
        />
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
            Creating...
          </>
        ) : (
          "Continue"
        )}
      </button>
    </form>
  );
}

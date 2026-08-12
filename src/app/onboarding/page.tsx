"use client";

import { useState } from "react";
import { createOrganizationAction } from "@/app/actions/organization";
import { setupPropertyAction, setupRoomsAction } from "@/app/actions/property";
import OrganizationStep from "@/components/onboarding/OrganizationStep";
import PropertyStep from "@/components/onboarding/PropertyStep";
import RoomSetupStep from "@/components/onboarding/RoomSetupStep";
import { CheckCircle2, ChevronRight, Hotel, Loader2 } from "lucide-react";
import Link from "next/link";

type Step = "ORGANIZATION" | "PROPERTY" | "ROOMS" | "SUCCESS";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("ORGANIZATION");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard data state
  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [propertyName, setPropertyName] = useState("");

  const [setupSummary, setSetupSummary] = useState<{
    floorsCount: number;
    roomTypesCount: number;
    roomsCount: number;
  } | null>(null);

  const handleOrganizationSubmit = async (name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await createOrganizationAction(name);
      setOrgId(res.organization.id);
      setOrgName(res.organization.name);
      setStep("PROPERTY");
    } catch (err: any) {
      setError(err.message || "Failed to create organization.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertySubmit = async (data: {
    name: string;
    currency: string;
    timezone: string;
    address?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await setupPropertyAction({
        ...data,
        organizationId: orgId,
      });
      setPropertyId(res.property.id);
      setPropertyName(res.property.name);
      setStep("ROOMS");
    } catch (err: any) {
      setError(err.message || "Failed to setup property.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomsSubmit = async (data: {
    floors: number[];
    roomTypes: any[];
    rooms: any[];
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await setupRoomsAction(
        propertyId,
        data.floors,
        data.roomTypes,
        data.rooms
      );
      if (res.summary) {
        setSetupSummary(res.summary);
      }
      setStep("SUCCESS");
    } catch (err: any) {
      setError(err.message || "Failed to setup rooms.");
    } finally {
      setIsLoading(false);
    }
  };

  // Steps indicators config
  const getStepNumber = () => {
    switch (step) {
      case "ORGANIZATION":
        return 1;
      case "PROPERTY":
        return 2;
      case "ROOMS":
        return 3;
      case "SUCCESS":
        return 4;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-app-bg py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        {/* Premium Brand Header */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-white shadow-small">
            <Hotel className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-primary">
            HotelOS
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          Premium Hotel Operations & Property Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-surface py-8 px-6 sm:px-10 border border-border-default rounded-lg shadow-medium">
          {/* Progress Indicator */}
          {step !== "SUCCESS" && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
                <span>STEP {getStepNumber()} OF 3</span>
                <span className="text-primary uppercase tracking-wider">
                  {step} Setup
                </span>
              </div>
              <div className="mt-2 w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden border border-border-default">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(getStepNumber() / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Render Step forms */}
          {step === "ORGANIZATION" && (
            <OrganizationStep
              onNext={handleOrganizationSubmit}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === "PROPERTY" && (
            <PropertyStep
              onNext={handlePropertySubmit}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === "ROOMS" && (
            <RoomSetupStep
              onComplete={handleRoomsSubmit}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === "SUCCESS" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-success animate-bounce" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                  Setup Complete!
                </h2>
                <p className="text-sm text-text-secondary">
                  Your hotel organization and property have been initialized in the database successfully.
                </p>
              </div>

              {setupSummary && (
                <div className="p-4 border border-border-default rounded-md bg-surface-secondary text-left space-y-2">
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Property Configuration Summary
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-text-primary pt-1">
                    <div>
                      <div className="font-bold text-lg text-primary">{setupSummary.floorsCount}</div>
                      <div className="text-xs text-text-secondary">Floors</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-primary">{setupSummary.roomTypesCount}</div>
                      <div className="text-xs text-text-secondary">Room Types</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-primary">{setupSummary.roomsCount}</div>
                      <div className="text-xs text-text-secondary">Rooms Setup</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/"
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-md shadow-medium text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                >
                  Enter Dashboard <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

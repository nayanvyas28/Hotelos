"use server";

import { db } from "@/lib/db";
import crypto from "crypto";

/**
 * Fetches all API keys, webhooks, and active integrations for a property.
 */
export async function getSaaSPropertyApiAndIntegrationsAction(propertyId: string) {
  if (!propertyId) {
    return { success: false, error: "Property ID is required." };
  }

  try {
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        enabledIntegrationsString: true,
      },
    });

    const apiKeys = await db.apiKey.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
    });

    const webhooks = await db.webhookSubscription.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      enabledIntegrations: property?.enabledIntegrationsString
        ? property.enabledIntegrationsString.split(",")
        : ["Stripe", "BookingCom"],
      apiKeys,
      webhooks,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Generates and stores a new API key for a property.
 */
export async function createSaaSPropertyApiKeyAction(propertyId: string, name: string) {
  if (!propertyId || !name) {
    return { success: false, error: "Property ID and key name are required." };
  }

  try {
    const rawKey = crypto.randomBytes(24).toString("hex");
    const key = `hk_live_${rawKey}`;

    const newKey = await db.apiKey.create({
      data: {
        token: key,
        name: name.trim(),
        propertyId,
      },
    });

    return { success: true, apiKey: newKey };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Revokes and deletes an API key.
 */
export async function revokeSaaSPropertyApiKeyAction(keyId: string) {
  if (!keyId) {
    return { success: false, error: "Key ID is required." };
  }

  try {
    await db.apiKey.delete({
      where: { id: keyId },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Creates a new webhook subscription.
 */
export async function createSaaSPropertyWebhookAction(
  propertyId: string,
  url: string,
  events: string
) {
  if (!propertyId || !url || !events) {
    return { success: false, error: "Property ID, target URL, and event triggers are required." };
  }

  try {
    const newWebhook = await db.webhookSubscription.create({
      data: {
        targetUrl: url.trim(),
        eventTypes: events.trim(),
        propertyId,
      },
    });

    return { success: true, webhook: newWebhook };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a webhook subscription.
 */
export async function deleteSaaSPropertyWebhookAction(webhookId: string) {
  if (!webhookId) {
    return { success: false, error: "Webhook ID is required." };
  }

  try {
    await db.webhookSubscription.delete({
      where: { id: webhookId },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Updates the enabled marketplace integrations list for a property.
 */
export async function updateSaaSPropertyIntegrationsAction(
  propertyId: string,
  enabledIntegrationsList: string[]
) {
  if (!propertyId) {
    return { success: false, error: "Property ID is required." };
  }

  try {
    const enabledString = enabledIntegrationsList.join(",");

    const updated = await db.property.update({
      where: { id: propertyId },
      data: {
        enabledIntegrationsString: enabledString,
      },
    });

    return { success: true, property: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

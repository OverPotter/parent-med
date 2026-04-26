import { apiClient } from "./client";

type RawBillingDebugResponse = {
  family: unknown;
  access: unknown;
};

export type BillingProviderSyncPayload = {
  provider: "revenuecat" | "apple";
  plan_code: "free" | "plus" | "pro";
  status: "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired";
  product_id?: string | null;
  provider_customer_id?: string | null;
  provider_subscription_id?: string | null;
  entitlement_code?: string | null;
  expires_at?: string | null;
  trial_ends_at?: string | null;
  raw_payload?: Record<string, unknown>;
};

export async function applyBillingDebugAction(payload: {
  plan_code?: "free" | "plus" | "pro";
  status?: "active" | "grace" | "canceled" | "expired";
}): Promise<RawBillingDebugResponse> {
  const res = await apiClient.post<RawBillingDebugResponse>("/billing/debug/apply", payload);
  return res.data;
}

export async function resetBillingDebugToFree(): Promise<RawBillingDebugResponse> {
  const res = await apiClient.post<RawBillingDebugResponse>("/billing/debug/reset-free");
  return res.data;
}

export async function syncBillingProviderSnapshot(
  payload: BillingProviderSyncPayload
): Promise<RawBillingDebugResponse> {
  const res = await apiClient.post<RawBillingDebugResponse>("/billing/provider-sync", payload);
  return res.data;
}

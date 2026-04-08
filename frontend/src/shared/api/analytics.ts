import { apiClient } from "./client";

export type AnalyticsHashKind = "account" | "child" | "episode";

interface AnalyticsHashResponse {
  kind: AnalyticsHashKind;
  value_hash: string;
}

export async function hashIdentifierForAnalytics(
  kind: AnalyticsHashKind,
  value: string
): Promise<string> {
  const { data } = await apiClient.post<AnalyticsHashResponse>("/analytics/hash-identifier", {
    kind,
    value,
  });
  return data.value_hash;
}

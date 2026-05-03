import type { QueryClient } from "@tanstack/react-query";

export function buildRevenueCatSubscriptionInvalidationKeys(
  accountId: string | null,
  currentFamilyId: string | null
) {
  return [
    ["families", accountId],
    ["families", "me", accountId],
    ["families", "me", "access", accountId],
    ["families", "me", "access", currentFamilyId],
    ["children", currentFamilyId],
    ["pillbox-plans", currentFamilyId],
  ] as const;
}

export async function invalidateRevenueCatSubscriptionQueries(
  queryClient: QueryClient,
  accountId: string | null,
  currentFamilyId: string | null
) {
  const queryKeys = buildRevenueCatSubscriptionInvalidationKeys(accountId, currentFamilyId);
  await Promise.all(
    queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] }))
  );
}

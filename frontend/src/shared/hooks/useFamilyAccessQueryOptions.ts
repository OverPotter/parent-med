export const FAMILY_ACCESS_REFRESH_MS = 5_000;

export const familyAccessQueryOptions = {
  staleTime: FAMILY_ACCESS_REFRESH_MS,
  refetchInterval: FAMILY_ACCESS_REFRESH_MS,
  refetchOnWindowFocus: true,
} as const;

import type { QueryClient } from "@tanstack/react-query";

export async function invalidateAccessSensitiveQueries(
  queryClient: QueryClient,
  currentFamilyId: string | null
) {
  const invalidateJobs = [
    queryClient.invalidateQueries({ queryKey: ["children"] }),
    queryClient.invalidateQueries({ queryKey: ["illness-episodes"] }),
    queryClient.invalidateQueries({ queryKey: ["illness-episode-active"] }),
    queryClient.invalidateQueries({ queryKey: ["illness-comments"] }),
    queryClient.invalidateQueries({ queryKey: ["illness-history-summary"] }),
    queryClient.invalidateQueries({ queryKey: ["household-medicines"] }),
    queryClient.invalidateQueries({ queryKey: ["pillbox-plans"] }),
    queryClient.invalidateQueries({ queryKey: ["pillbox-plan"] }),
    queryClient.invalidateQueries({ queryKey: ["pillbox-history-summary"] }),
    queryClient.invalidateQueries({ queryKey: ["families"] }),
  ];

  if (currentFamilyId) {
    invalidateJobs.push(
      queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] }),
      queryClient.invalidateQueries({ queryKey: ["families", "me", currentFamilyId] }),
      queryClient.invalidateQueries({ queryKey: ["families", "me", "members", currentFamilyId] })
    );
  }

  await Promise.all(invalidateJobs);

  await Promise.all([
    queryClient.refetchQueries({ queryKey: ["children"], type: "active" }),
    queryClient.refetchQueries({ queryKey: ["illness-episodes"], type: "active" }),
    queryClient.refetchQueries({ queryKey: ["illness-episode-active"], type: "active" }),
    queryClient.refetchQueries({ queryKey: ["household-medicines"], type: "active" }),
    queryClient.refetchQueries({ queryKey: ["pillbox-plans"], type: "active" }),
  ]);
}

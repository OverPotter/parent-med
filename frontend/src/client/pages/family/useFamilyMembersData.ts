import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyFamilyMembers } from "@shared/api/families";
import type { FamilyMember } from "@shared/types/api";

export function useFamilyMembersData(
  currentFamilyId: string | null,
  currentAccountId: string | null
) {
  const {
    data: members = [],
    isLoading: isMembersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ["family-members", currentFamilyId],
    queryFn: fetchMyFamilyMembers,
    enabled: Boolean(currentFamilyId),
  });

  const currentMember = useMemo(
    () => members.find((member) => member.id === currentAccountId) ?? null,
    [currentAccountId, members]
  );
  const otherMembers = useMemo(
    () => members.filter((member) => member.id !== currentAccountId),
    [currentAccountId, members]
  );
  const adminsCount = useMemo(
    () => members.filter((member) => member.familyRole === "admin").length,
    [members]
  );

  return {
    members: members as FamilyMember[],
    isMembersLoading,
    membersError,
    currentMember,
    otherMembers,
    adminsCount,
  };
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteFamilyMember,
  updateFamilyMember,
  updateFamilyMemberProfile,
  updateMyFamily,
} from "@shared/api/families";
import { leaveMyFamily } from "@shared/api/auth";
import { createFamilyInvite } from "@shared/api/familyInvites";
import type { AuthStateResponse, Family, FamilyAccessPolicy, FamilyMember } from "@shared/types/api";
import { invalidateAccessSensitiveQueries } from "./invalidateAccessSensitiveQueries";
import { tFamily } from "./copy";

function getApiErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "detail" in error.response.data &&
    typeof error.response.data.detail === "string"
  ) {
    return error.response.data.detail;
  }
  return fallback;
}

function replaceMemberInList(
  current: FamilyMember[] | undefined,
  updatedMember: FamilyMember
): FamilyMember[] | undefined {
  if (!current) {
    return current;
  }
  return current.map((member) => (member.id === updatedMember.id ? updatedMember : member));
}

export function useFamilyPageMutations(args: {
  language: "ru" | "en";
  accountId: string | null;
  currentFamilyId: string | null;
  currentAccountId: string | null;
  setCurrentFamily: (family: Family | null) => void;
  setAuthState?: ((state: AuthStateResponse) => void) | null;
  setAccountFamilyContext: (family: {
    familyRole?: string | null;
    accessPolicy?: FamilyAccessPolicy | null;
  }) => void;
  setError: (value: string | null) => void;
}) {
  const {
    language,
    accountId,
    currentFamilyId,
    currentAccountId,
    setCurrentFamily,
    setAuthState,
    setAccountFamilyContext,
    setError,
  } = args;
  const queryClient = useQueryClient();

  const updateFamilyMutation = useMutation({
    mutationFn: (name: string) => updateMyFamily(name),
    onSuccess: (updatedFamily) => {
      setCurrentFamily(updatedFamily);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["families", accountId] });
    },
    onError: (error) => {
      setError(getApiErrorMessage(error, tFamily(language, "updateFamilyFailed")));
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: () => createFamilyInvite({ family_role: "member" }),
    onSuccess: () => {
      setError(null);
    },
    onError: (error) => {
      setError(getApiErrorMessage(error, tFamily(language, "createInviteFailed")));
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({
      memberAccountId,
      payload,
    }: {
      memberAccountId: string;
      payload: Parameters<typeof updateFamilyMember>[1];
    }) => updateFamilyMember(memberAccountId, payload),
    onSuccess: async (updatedMember) => {
      setError(null);
      queryClient.setQueryData<FamilyMember[] | undefined>(
        ["family-members", currentFamilyId],
        (current) => replaceMemberInList(current, updatedMember)
      );
      queryClient.setQueryData<FamilyMember[] | undefined>(
        ["families", "me", "members", currentFamilyId],
        (current) => replaceMemberInList(current, updatedMember)
      );
      if (updatedMember.id === currentAccountId) {
        setAccountFamilyContext({
          familyRole: updatedMember.familyRole,
          accessPolicy: updatedMember.accessPolicy,
        });
        await invalidateAccessSensitiveQueries(queryClient, currentFamilyId, accountId);
      } else {
        void queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
        void queryClient.invalidateQueries({
          queryKey: ["families", "me", "members", currentFamilyId],
        });
      }
    },
    onError: (error) => {
      setError(getApiErrorMessage(error, tFamily(language, "updateRoleFailed")));
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (memberAccountId: string) => deleteFamilyMember(memberAccountId),
    onSuccess: () => {
      setError(null);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] }),
        queryClient.invalidateQueries({ queryKey: ["families", "me", "members", currentFamilyId] }),
      ]);
    },
    onError: (error) => {
      setError(getApiErrorMessage(error, tFamily(language, "deleteMemberFailed")));
    },
  });

  const updateMemberProfileMutation = useMutation({
    mutationFn: ({
      memberAccountId,
      displayName,
      relationshipLabel,
      phone,
    }: {
      memberAccountId: string;
      displayName?: string;
      relationshipLabel?: string | null;
      phone?: string | null;
    }) =>
      updateFamilyMemberProfile(memberAccountId, {
        display_name: displayName,
        relationship_label: relationshipLabel,
        phone,
      }),
    onSuccess: (updatedMember) => {
      setError(null);
      queryClient.setQueryData<FamilyMember[] | undefined>(
        ["family-members", currentFamilyId],
        (current) => replaceMemberInList(current, updatedMember)
      );
      queryClient.setQueryData<FamilyMember[] | undefined>(
        ["families", "me", "members", currentFamilyId],
        (current) => replaceMemberInList(current, updatedMember)
      );
      void queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
      void queryClient.invalidateQueries({
        queryKey: ["families", "me", "members", currentFamilyId],
      });
    },
    onError: (error) => {
      setError(getApiErrorMessage(error, tFamily(language, "updateProfileFailed")));
    },
  });

  const leaveFamilyMutation = useMutation({
    mutationFn: () => leaveMyFamily(),
    onSuccess: async (nextState) => {
      const previousFamilyId = currentFamilyId;
      setAuthState?.(nextState);
      setCurrentFamily(nextState.family);
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["families", accountId] }),
        invalidateAccessSensitiveQueries(queryClient, previousFamilyId, accountId),
        invalidateAccessSensitiveQueries(queryClient, nextState.family.id, accountId),
        queryClient.invalidateQueries({ queryKey: ["children"] }),
        queryClient.invalidateQueries({ queryKey: ["pillbox-plans"] }),
        queryClient.invalidateQueries({ queryKey: ["household-medicines"] }),
      ]);
    },
    onError: (error) => {
      setError(getApiErrorMessage(error, tFamily(language, "leaveFamilyFailed")));
    },
  });

  return {
    updateFamilyMutation,
    createInviteMutation,
    updateMemberMutation,
    deleteMemberMutation,
    updateMemberProfileMutation,
    leaveFamilyMutation,
  };
}

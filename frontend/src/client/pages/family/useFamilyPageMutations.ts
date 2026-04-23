import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAccountProfile } from "@shared/api/auth";
import {
  deleteFamilyMember,
  updateFamilyMember,
  updateFamilyMemberProfile,
  updateMyFamily,
} from "@shared/api/families";
import { createFamilyInvite } from "@shared/api/familyInvites";
import type { Family, FamilyAccessPolicy } from "@shared/types/api";
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

export function useFamilyPageMutations(args: {
  language: "ru" | "en";
  accountId: string | null;
  currentFamilyId: string | null;
  currentAccountId: string | null;
  setCurrentFamily: (family: Family | null) => void;
  setAccountEmail: (email: string | null) => void;
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
    setAccountEmail,
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
      if (updatedMember.id === currentAccountId) {
        setAccountFamilyContext({
          familyRole: updatedMember.familyRole,
          accessPolicy: updatedMember.accessPolicy,
        });
        await invalidateAccessSensitiveQueries(queryClient, currentFamilyId);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
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
      void queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
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
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
    },
    onError: (error) => {
      setError(getApiErrorMessage(error, tFamily(language, "updateProfileFailed")));
    },
  });

  const updateMyProfileMutation = useMutation({
    mutationFn: ({ email }: { email: string | null }) => updateAccountProfile({ email }),
    onSuccess: (account) => {
      setAccountEmail(account.email);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
    },
    onError: (error) => {
      setError(getApiErrorMessage(error, tFamily(language, "updateProfileFailed")));
    },
  });

  return {
    updateFamilyMutation,
    createInviteMutation,
    updateMemberMutation,
    deleteMemberMutation,
    updateMemberProfileMutation,
    updateMyProfileMutation,
  };
}

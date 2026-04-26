import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { fetchChildrenByFamilyIdForManagement } from "@shared/api/children";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { fetchFamilies, fetchMyFamilyMembers } from "@shared/api/families";
import { PageIntro } from "@shared/components/PageIntro";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import type { FamilyAccessPolicy } from "@shared/types/api";
import { toFamilyAccessUpdatePayload } from "./family/accessPolicy";
import { buildMemberAccessSummaryItems } from "./family/accessPolicy";
import { MemberAccessHeaderCard } from "./family/MemberAccessHeaderCard";
import { MemberAccessEditor } from "./family/MemberAccessEditor";
import { tFamily } from "./family/copy";
import {
  canDeleteFamilyMember,
  canDemoteFamilyMember,
  canManageFamilyMemberAccess,
  canManageFamilyMembers,
  canPromoteFamilyMember,
} from "./family/memberManagement";
import { useFamilyPageMutations } from "./family/useFamilyPageMutations";

export function FamilyMemberAccessPage() {
  const { language } = useI18n();
  const { memberAccountId = "" } = useParams();
  const navigate = useNavigate();
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const currentAccountId = useAppStore((s) => s.accountId);
  const currentAccountRole = useAppStore((s) => s.accountFamilyRole);
  const setAccountFamilyContext = useAppStore((s) => s.setAccountFamilyContext);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const { data: families = [] } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: Boolean(accountId),
  });
  const family = families.find((item) => item.id === currentFamilyId) ?? families[0] ?? null;
  const canManageFamily = canManageFamilyMembers({
    familyOwnerAccountId: family?.ownerAccountId,
    currentAccountId,
    currentAccountRole,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPromoteConfirmOpen, setIsPromoteConfirmOpen] = useState(false);
  const [isDemoteConfirmOpen, setIsDemoteConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const {
    data: members = [],
    isLoading: isMembersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ["family-members", currentFamilyId],
    queryFn: fetchMyFamilyMembers,
    enabled: Boolean(currentFamilyId && canManageFamily),
  });

  const { data: familyChildren = [] } = useQuery({
    queryKey: ["family-children-management", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyIdForManagement(currentFamilyId!),
    enabled: Boolean(currentFamilyId && canManageFamily),
  });

  const member = useMemo(
    () => members.find((item) => item.id === memberAccountId) ?? null,
    [memberAccountId, members]
  );
  const [accessPolicy, setAccessPolicy] = useState<FamilyAccessPolicy | null>(member?.accessPolicy ?? null);

  useEffect(() => {
    if (member) {
      setAccessPolicy(member.accessPolicy);
    }
  }, [member]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [memberAccountId]);

  const { updateMemberMutation, deleteMemberMutation } = useFamilyPageMutations({
    language,
    accountId,
    currentFamilyId,
    currentAccountId,
    setCurrentFamily,
    setAccountFamilyContext,
    setError: setActionError,
  });

  if (!canManageFamily) {
    return <Navigate to="/family" replace />;
  }

  if (!currentFamilyId) {
    return <Navigate to="/family" replace />;
  }

  if (membersError) {
    return (
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <PageIntro
          title={tFamily(language, "accessEditorTitle")}
          subtitle={currentFamilyName || tFamily(language, "title")}
          action={
            <Link
              to="/family"
              className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
            >
              {language === "ru" ? "← Семья" : "← Family"}
            </Link>
          }
          compactOnMobile
          hideOnMobile
          className="app-safe-top-standalone"
        />
        <p className="soft-note-danger">
          {(membersError as { message?: string }).message ?? tFamily(language, "loadMembersFailed")}
        </p>
      </div>
    );
  }

  if (!isMembersLoading && !member) {
    return <Navigate to="/family" replace />;
  }

  const adminsCount = members.filter((item) => item.familyRole === "admin").length;
  const canManageTarget = Boolean(
    member &&
      canManageFamilyMemberAccess({
        familyOwnerAccountId: family?.ownerAccountId,
        currentAccountId,
        currentAccountRole,
        targetAccountId: member.id,
        targetFamilyRole: member.familyRole,
      })
  );
  const canPromote = Boolean(
    member &&
      canPromoteFamilyMember({
        familyOwnerAccountId: family?.ownerAccountId,
        currentAccountId,
        targetAccountId: member.id,
        targetFamilyRole: member.familyRole,
      })
  );
  const canDemote = Boolean(
    member &&
      canDemoteFamilyMember({
        familyOwnerAccountId: family?.ownerAccountId,
        currentAccountId,
        targetAccountId: member.id,
        targetFamilyRole: member.familyRole,
        adminsCount,
      })
  );
  const canDelete = Boolean(
    member &&
      canDeleteFamilyMember({
        familyOwnerAccountId: family?.ownerAccountId,
        currentAccountId,
        currentAccountRole,
        targetAccountId: member.id,
        targetFamilyRole: member.familyRole,
      })
  );
  const hasHeaderActions = Boolean(canPromote || canDemote || canDelete);
  const isActionPending = updateMemberMutation.isPending || deleteMemberMutation.isPending;
  const accessSummaryItems = member ? buildMemberAccessSummaryItems(member.accessPolicy, language) : [];

  if (member && !canManageTarget && !canPromote && !canDemote && !canDelete) {
    return <Navigate to="/family" replace />;
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <ConfirmDialog
        isOpen={isPromoteConfirmOpen}
        title={tFamily(language, "confirmPromoteTitle")}
        description={tFamily(language, "confirmPromoteDescription")}
        confirmLabel={tFamily(language, "confirmPromoteAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="danger"
        isPending={updateMemberMutation.isPending}
        onCancel={() => setIsPromoteConfirmOpen(false)}
        onConfirm={() => {
          updateMemberMutation.mutate({
            memberAccountId,
            payload: { family_role: "admin" },
          });
          setIsPromoteConfirmOpen(false);
        }}
      />
      <ConfirmDialog
        isOpen={isDemoteConfirmOpen}
        title={tFamily(language, "confirmDemoteTitle")}
        description={tFamily(language, "confirmDemoteDescription")}
        confirmLabel={tFamily(language, "confirmDemoteAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="danger"
        isPending={updateMemberMutation.isPending}
        onCancel={() => setIsDemoteConfirmOpen(false)}
        onConfirm={() => {
          updateMemberMutation.mutate({
            memberAccountId,
            payload: { family_role: "member" },
          });
          setIsDemoteConfirmOpen(false);
        }}
      />
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={tFamily(language, "confirmRemoveTitle")}
        description={tFamily(language, "confirmRemoveDescription")}
        confirmLabel={tFamily(language, "confirmRemoveAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="danger"
        isPending={deleteMemberMutation.isPending}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          deleteMemberMutation.mutate(memberAccountId, {
            onSuccess: () => {
              navigate("/family", { replace: true });
            },
          });
          setIsDeleteConfirmOpen(false);
        }}
      />
      <PageIntro
        title={tFamily(language, "accessEditorTitle")}
        subtitle={currentFamilyName || tFamily(language, "title")}
        action={
          <Link
            to="/family"
            className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Семья" : "← Family"}
          </Link>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <Link
            to="/family"
            className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Семья" : "← Family"}
          </Link>
          <h1 className="app-mobile-section-intro__title">{tFamily(language, "accessEditorTitle")}</h1>
          <p className="app-mobile-section-intro__hint">
            {currentFamilyName || tFamily(language, "title")}
          </p>
        </div>
      </div>

      {isMembersLoading || !member || !accessPolicy ? (
        <p className="text-sm text-muted">{tFamily(language, "membersLoading")}</p>
      ) : (
        <>
          {actionError ? <p className="soft-note-danger">{actionError}</p> : null}
          <MemberAccessHeaderCard
            language={language}
            member={member}
            familyOwnerAccountId={family?.ownerAccountId}
            accessSummaryItems={accessSummaryItems}
            hasHeaderActions={hasHeaderActions}
            canPromote={canPromote}
            canDemote={canDemote}
            canDelete={canDelete}
            isActionPending={isActionPending}
            onPromote={() => setIsPromoteConfirmOpen(true)}
            onDemote={() => setIsDemoteConfirmOpen(true)}
            onDelete={() => setIsDeleteConfirmOpen(true)}
          />

          <MemberAccessEditor
            language={language}
            familyChildren={familyChildren}
            accessPolicy={accessPolicy}
            isPending={updateMemberMutation.isPending}
            onChange={setAccessPolicy}
            onSave={() =>
              updateMemberMutation.mutate(
                {
                  memberAccountId,
                  payload: {
                    access_policy: toFamilyAccessUpdatePayload(accessPolicy),
                  },
                },
                {
                  onSuccess: () => {
                    navigate("/family", { replace: true });
                  },
                }
              )
            }
          />
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { fetchChildrenByFamilyIdForManagement } from "@shared/api/children";
import { fetchMyFamilyMembers, updateFamilyMember } from "@shared/api/families";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import type { FamilyAccessPolicy } from "@shared/types/api";
import { toFamilyAccessUpdatePayload } from "./family/accessPolicy";
import { invalidateAccessSensitiveQueries } from "./family/invalidateAccessSensitiveQueries";
import { MemberAccessEditor } from "./family/MemberAccessEditor";
import { roleLabel, tFamily } from "./family/copy";

export function FamilyMemberAccessPage() {
  const { language } = useI18n();
  const { memberAccountId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const currentAccountId = useAppStore((s) => s.accountId);
  const currentAccountRole = useAppStore((s) => s.accountFamilyRole);
  const setAccountFamilyContext = useAppStore((s) => s.setAccountFamilyContext);
  const canManageFamily = currentAccountRole === "admin";

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

  const updateMemberMutation = useMutation({
    mutationFn: (policy: FamilyAccessPolicy) =>
      updateFamilyMember(memberAccountId, {
        access_policy: toFamilyAccessUpdatePayload(policy),
      }),
    onSuccess: async (updatedMember) => {
      if (updatedMember.id === currentAccountId) {
        setAccountFamilyContext({
          familyRole: updatedMember.familyRole,
          accessPolicy: updatedMember.accessPolicy,
        });
        await invalidateAccessSensitiveQueries(queryClient, currentFamilyId);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
      }
      navigate("/family", { replace: true });
    },
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

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={tFamily(language, "accessEditorTitle")}
        subtitle={member?.displayName || member?.login || currentFamilyName || tFamily(language, "title")}
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
            {member?.displayName || member?.login || currentFamilyName || tFamily(language, "title")}
          </p>
        </div>
      </div>

      {isMembersLoading || !member || !accessPolicy ? (
        <p className="text-sm text-muted">{tFamily(language, "membersLoading")}</p>
      ) : (
        <>
          <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="app-card-title text-base">
                  {member.displayName || member.login || tFamily(language, "noName")}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] ${
                    member.familyRole === "admin" ? "soft-pill-primary" : "soft-pill"
                  }`}
                >
                  {roleLabel(member.familyRole, language)}
                </span>
              </div>
              <p className="text-sm text-muted">
                <span className="font-semibold text-foreground/90">Login: </span>@{member.login}
              </p>
              <p className="text-sm text-muted">
                <span className="font-semibold text-foreground/90">Email: </span>
                {member.email || tFamily(language, "emailMissing")}
              </p>
            </div>
          </RowSurface>

          <MemberAccessEditor
            language={language}
            familyChildren={familyChildren}
            accessPolicy={accessPolicy}
            isPending={updateMemberMutation.isPending}
            onChange={setAccessPolicy}
            onSave={() => updateMemberMutation.mutate(accessPolicy)}
          />
        </>
      )}
    </div>
  );
}

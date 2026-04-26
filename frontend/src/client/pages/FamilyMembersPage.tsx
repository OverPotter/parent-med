import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchFamilies } from "@shared/api/families";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import { MemberCard } from "./family/MemberCard";
import { tFamily } from "./family/copy";
import { useFamilyMembersData } from "./family/useFamilyMembersData";
import { useFamilyPageMutations } from "./family/useFamilyPageMutations";

export function FamilyMembersPage() {
  const { language } = useI18n();
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
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
  const isFamilyOwner = Boolean(family?.ownerAccountId && family.ownerAccountId === currentAccountId);
  const isFamilyAdmin = !isFamilyOwner && currentAccountRole === "admin";

  const { members, isMembersLoading, membersError, currentMember, otherMembers, adminsCount } =
    useFamilyMembersData(currentFamilyId, currentAccountId);

  const {
    updateMemberMutation,
    deleteMemberMutation,
    updateMemberProfileMutation,
  } = useFamilyPageMutations({
    language,
    accountId,
    currentFamilyId,
    currentAccountId,
    setCurrentFamily,
    setAccountFamilyContext,
    setError: () => {},
  });

  const isPending =
    updateMemberMutation.isPending ||
    updateMemberProfileMutation.isPending ||
    deleteMemberMutation.isPending;

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={tFamily(language, "allMembersTitle")}
        subtitle={tFamily(language, "allMembersDescription")}
        action={
          <Link
            to="/family"
            className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← К семье" : "← Back to family"}
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
            {language === "ru" ? "← К семье" : "← Back to family"}
          </Link>
          <h1 className="app-mobile-section-intro__title">{tFamily(language, "allMembersTitle")}</h1>
          <p className="app-mobile-section-intro__hint">{tFamily(language, "allMembersDescription")}</p>
        </div>
      </div>

      {membersError ? (
        <p className="soft-note-danger">
          {(membersError as { message?: string }).message ?? tFamily(language, "loadMembersFailed")}
        </p>
      ) : null}

      {isMembersLoading ? (
        <p className="px-1 text-sm text-muted">{tFamily(language, "membersLoading")}</p>
      ) : members.length === 0 ? (
        <p className="px-1 text-sm text-muted">{tFamily(language, "noMembers")}</p>
      ) : (
        <div className="space-y-4">
          {[...(currentMember ? [currentMember] : []), ...otherMembers].map((member) => {
            const isCurrent = member.id === currentAccountId;
            const canManageTarget =
              !isCurrent && (isFamilyOwner || (isFamilyAdmin && member.familyRole === "member"));
            const canManageRoles = isFamilyOwner;
            const canDeleteMember =
              !isCurrent && (isFamilyOwner || (isFamilyAdmin && member.familyRole === "member"));
            const accessHref = canManageTarget ? `/family/members/${member.id}/access` : undefined;
            return (
              <RowSurface
                key={member.id}
                className="rounded-[26px] border border-white/5 px-4 py-4 sm:px-5 sm:py-5"
              >
                <MemberCard
                  member={member}
                  familyOwnerAccountId={family?.ownerAccountId}
                  isCurrent={isCurrent}
                  forceEdit={false}
                  canManageAccess={canManageTarget}
                  canManageRoles={canManageRoles}
                  canDeleteMember={canDeleteMember}
                  canEditProfile={isCurrent}
                  adminsCount={adminsCount}
                  isPending={isPending}
                  onPromote={() =>
                    updateMemberMutation.mutate({
                      memberAccountId: member.id,
                      payload: { family_role: "admin" },
                    })
                  }
                  onDemote={() =>
                    updateMemberMutation.mutate({
                      memberAccountId: member.id,
                      payload: { family_role: "member" },
                    })
                  }
                  accessHref={accessHref}
                  onDelete={() => deleteMemberMutation.mutate(member.id)}
                  onSaveProfile={async (payload) => {
                    try {
                      await updateMemberProfileMutation.mutateAsync({
                        memberAccountId: member.id,
                        displayName: payload.displayName,
                        relationshipLabel: payload.relationshipLabel,
                        phone: payload.phone,
                      });
                      return true;
                    } catch {
                      return false;
                    }
                  }}
                  onHideForcedEdit={() => {}}
                  language={language}
                />
              </RowSurface>
            );
          })}
        </div>
      )}
    </div>
  );
}

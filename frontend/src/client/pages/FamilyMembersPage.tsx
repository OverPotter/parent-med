import { Link } from "react-router-dom";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import { SectionTitle } from "./child-illness/shared";
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
  const canManageFamily = currentAccountRole === "admin";

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

      <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
        <SectionTitle
          title={tFamily(language, "yourProfileTitle")}
          subtitle={tFamily(language, "yourProfileDescription")}
        />

        {isMembersLoading ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "membersLoading")}</p>
        ) : currentMember ? (
          <div className="mt-4">
            <MemberCard
              member={currentMember}
              isCurrent
              forceEdit={false}
              canManageAccess={canManageFamily}
              canEditProfile
              adminsCount={adminsCount}
              isPending={isPending}
              onPromote={() =>
                updateMemberMutation.mutate({
                  memberAccountId: currentMember.id,
                  payload: { family_role: "admin" },
                })
              }
              onDemote={() =>
                updateMemberMutation.mutate({
                  memberAccountId: currentMember.id,
                  payload: { family_role: "member" },
                })
              }
              accessHref={`/family/members/${currentMember.id}/access`}
              onDelete={() => deleteMemberMutation.mutate(currentMember.id)}
              onSaveProfile={async (payload) => {
                try {
                  await updateMemberProfileMutation.mutateAsync({
                    memberAccountId: currentMember.id,
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
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "noMembers")}</p>
        )}
      </RowSurface>

      <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
        <SectionTitle
          title={tFamily(language, "otherMembersTitle")}
          subtitle={tFamily(language, "allMembersDescription")}
          action={
            <span className="text-sm font-semibold text-muted">
              {members.length} {tFamily(language, "peopleShort")}
            </span>
          }
        />

        {isMembersLoading ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "membersLoading")}</p>
        ) : otherMembers.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "noOtherMembers")}</p>
        ) : (
          <div className="mt-4 divide-y divide-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)]">
            {otherMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrent={false}
                forceEdit={false}
                canManageAccess={canManageFamily}
                canEditProfile={false}
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
                accessHref={`/family/members/${member.id}/access`}
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
            ))}
          </div>
        )}
      </RowSurface>
    </div>
  );
}

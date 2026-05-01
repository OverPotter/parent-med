import { RowSurface } from "@shared/components/Surface";
import type { AppLanguage } from "@shared/i18n";
import type { FamilyMember } from "@shared/types/api";
import { roleLabel, tFamily } from "./copy";

export function MemberAccessHeaderCard({
  language,
  member,
  familyOwnerAccountId,
  accessSummaryItems,
  hasHeaderActions,
  canPromote,
  canDemote,
  canDelete,
  isActionPending,
  onPromote,
  onDemote,
  onDelete,
}: {
  language: AppLanguage;
  member: FamilyMember;
  familyOwnerAccountId?: string | null;
  accessSummaryItems: Array<{ key: string; label: string; toneClass: string }>;
  hasHeaderActions: boolean;
  canPromote: boolean;
  canDemote: boolean;
  canDelete: boolean;
  isActionPending: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onDelete: () => void;
}) {
  const isOwner = familyOwnerAccountId === member.id;
  const profileFacts = [
    {
      label: tFamily(language, "displayName"),
      value: member.displayName || tFamily(language, "noName"),
    },
    member.relationshipLabel
      ? {
          label: tFamily(language, "relationship"),
          value: member.relationshipLabel,
        }
      : null,
    member.phone
      ? {
          label: tFamily(language, "phone"),
          value: member.phone,
        }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] ${
                  isOwner || member.familyRole === "admin" ? "soft-pill-primary" : "soft-pill"
                }`}
              >
                {roleLabel(member.familyRole, language, { isOwner })}
              </span>
            </div>
            <div className="grid gap-1.5">
              {profileFacts.map((fact) => (
                <p key={fact.label} className="text-sm text-muted">
                  <span className="font-semibold text-foreground/90">{fact.label}: </span>
                  <span className="break-all">{fact.value}</span>
                </p>
              ))}
            </div>
          </div>
          {hasHeaderActions ? (
            <div className="min-w-0 shrink-0 space-y-2 sm:max-w-[18rem]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted/85">
                {tFamily(language, "actionsTitle")}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                {canPromote ? (
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={onPromote}
                    className="soft-pill app-profile-action min-h-[2.2rem] px-3 text-[0.76rem] disabled:opacity-50"
                  >
                    {tFamily(language, "makeOwner")}
                  </button>
                ) : null}
                {canDemote ? (
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={onDemote}
                    className="soft-pill app-profile-action min-h-[2.2rem] px-3 text-[0.76rem] disabled:opacity-50"
                  >
                    {tFamily(language, "makeAdult")}
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={onDelete}
                    className="soft-pill-danger app-profile-action min-h-[2.2rem] px-3 text-[0.76rem] disabled:opacity-50"
                  >
                    {tFamily(language, "deleteMemberShort")}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="space-y-2.5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted/85">
            {tFamily(language, "currentAccessTitle")}
          </p>
          <div className="flex flex-wrap gap-2">
            {accessSummaryItems.map((item) => (
              <span
                key={item.key}
                className={[
                  "inline-flex min-h-[2.35rem] items-center rounded-[18px] px-3 py-1.5 text-[11px] font-semibold tracking-[-0.01em]",
                  item.toneClass,
                ].join(" ")}
              >
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </RowSurface>
  );
}

import { OverlayDialog } from "@shared/components/OverlayDialog";
import type { AppLanguage } from "@shared/i18n";
import type { FamilyMember } from "@shared/types/api";
import { roleLabel, tFamily } from "./copy";

export function OtherMembersSheet({
  language,
  isOpen,
  members,
  familyOwnerAccountId,
  onClose,
  onSelectMember,
}: {
  language: AppLanguage;
  isOpen: boolean;
  members: FamilyMember[];
  familyOwnerAccountId?: string | null;
  onClose: () => void;
  onSelectMember: (memberId: string) => void;
}) {
  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom"
      zIndexClassName="z-[890]"
      backdropAriaLabel={tFamily(language, "allMembersTitle")}
      containerClassName="flex items-end"
      backdropClassName="bg-[rgba(15,23,42,0.32)]"
    >
      <div
        data-ios-disable-back-swipe="true"
        className="relative z-[1] w-full rounded-t-[30px] bg-background px-4 pb-[max(1.25rem,var(--app-safe-bottom-runtime,env(safe-area-inset-bottom)))] pt-4 shadow-[0_-24px_64px_rgba(15,23,42,0.24)] sm:mx-auto sm:max-w-xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_16%,transparent)]" />
        <div className="space-y-1.5">
          <h2 className="app-card-title text-[1.08rem] sm:text-[1.15rem]">
            {tFamily(language, "otherMembersTitle")}
          </h2>
          <p className="text-sm leading-5 text-muted">
            {language === "ru"
              ? "Выберите участника, чтобы открыть его настройки."
              : "Choose a member to open their settings."}
          </p>
        </div>

        {members.length === 0 ? (
          <p className="soft-note-warning mt-4">{tFamily(language, "noOtherMembers")}</p>
        ) : (
          <div className="soft-choice-list mt-4 max-h-[min(60vh,28rem)] overflow-y-auto">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectMember(member.id)}
                className="soft-choice-row"
              >
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-semibold tracking-[-0.02em] text-foreground">
                    {member.displayName || tFamily(language, "noName")}
                  </span>
                  <span className="mt-1 block text-[0.82rem] leading-5 text-muted">
                    {member.relationshipLabel ||
                      roleLabel(member.familyRole, language, {
                        isOwner: familyOwnerAccountId === member.id,
                      })}
                  </span>
                </span>
                <span className="soft-choice-check text-muted">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </OverlayDialog>
  );
}

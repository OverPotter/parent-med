import { RowSurface } from "@shared/components/Surface";
import type { AppLanguage } from "@shared/i18n";
import { formatLocalizedDateTime } from "@shared/utils/date";
import { appBtnJournalSecondaryClass } from "../child-illness/shared";
import { tFamily } from "./copy";

interface FamilyInviteSectionProps {
  language: AppLanguage;
  isPending: boolean;
  isInviteSharePending: boolean;
  canShareInvite: boolean;
  inviteLocked?: boolean;
  inviteLockedReason?: string | null;
  inviteCopied: boolean;
  latestInviteCode: string;
  inviteExpiresAt?: string;
  onCreateInvite: () => void;
  onLockedInviteAttempt?: () => void;
  onShareInvite: () => void;
  onCopyInvite: () => void;
}

export function FamilyInviteSection({
  language,
  isPending,
  isInviteSharePending,
  canShareInvite,
  inviteLocked = false,
  inviteLockedReason = null,
  inviteCopied,
  latestInviteCode,
  inviteExpiresAt,
  onCreateInvite,
  onLockedInviteAttempt,
  onShareInvite,
  onCopyInvite,
}: FamilyInviteSectionProps) {
  return (
    <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
      <div className="grid gap-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h2 className="app-card-title">{tFamily(language, "inviteTitle")}</h2>
          <div className="flex shrink-0 items-center justify-end">
            <button
              type="button"
              onClick={inviteLocked ? onLockedInviteAttempt : onCreateInvite}
              disabled={isPending || isInviteSharePending}
              className={`${appBtnJournalSecondaryClass} min-h-[2.35rem] whitespace-nowrap px-3 text-[0.78rem] disabled:opacity-50`}
            >
              {isPending || isInviteSharePending
                ? tFamily(language, "creatingInvite")
                : tFamily(language, "createInvite")}
            </button>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted">{tFamily(language, "inviteDescription")}</p>
      </div>

      <p className="mt-2 text-sm font-semibold text-muted">{tFamily(language, "ownerOnly")}</p>
      {inviteLockedReason ? (
        <p className="mt-2 text-sm font-semibold text-primary">{inviteLockedReason}</p>
      ) : null}

      {inviteExpiresAt ? (
        <div className="mt-4 border-t border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] pt-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            {tFamily(language, "newLink")}
          </p>
          <p className="mt-2 break-all text-sm font-semibold tracking-[0.12em] text-foreground">
            {latestInviteCode}
          </p>
          <p className="mt-2 text-sm text-muted">
            {tFamily(language, "validUntil")} {formatLocalizedDateTime(inviteExpiresAt, language)}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {canShareInvite ? (
              <button
                type="button"
                onClick={onShareInvite}
                disabled={isInviteSharePending}
                className={`${appBtnJournalSecondaryClass} inline-flex`}
              >
                {tFamily(language, "shareInvite")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCopyInvite}
              className={`${appBtnJournalSecondaryClass} inline-flex`}
            >
              {inviteCopied ? tFamily(language, "inviteCopied") : tFamily(language, "copyInvite")}
            </button>
          </div>
        </div>
      ) : null}
    </RowSurface>
  );
}

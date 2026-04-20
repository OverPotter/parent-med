import { RowSurface } from "@shared/components/Surface";
import type { AppLanguage } from "@shared/i18n";
import {
  appBtnJournalSecondaryClass,
} from "../child-illness/shared";
import { tFamily } from "./copy";

interface FamilyInviteSectionProps {
  language: AppLanguage;
  isPending: boolean;
  isInviteSharePending: boolean;
  canShareInvite: boolean;
  inviteCopied: boolean;
  latestInviteUrl: string;
  inviteExpiresAt?: string;
  onCreateInvite: () => void;
  onShareInvite: () => void;
  onCopyInvite: () => void;
}

export function FamilyInviteSection({
  language,
  isPending,
  isInviteSharePending,
  canShareInvite,
  inviteCopied,
  latestInviteUrl,
  inviteExpiresAt,
  onCreateInvite,
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
              onClick={onCreateInvite}
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

      {inviteExpiresAt ? (
        <div className="mt-4 border-t border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] pt-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            {tFamily(language, "newLink")}
          </p>
          <p className="mt-2 break-all text-sm text-foreground">{latestInviteUrl}</p>
          <p className="mt-2 text-sm text-muted">
            {tFamily(language, "validUntil")}{" "}
            {new Date(inviteExpiresAt).toLocaleString(language === "ru" ? "ru-RU" : "en-US")}.
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

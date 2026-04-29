import type { AppLanguage } from "@shared/i18n";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import { blurActiveField } from "@shared/utils/focus";
import { useLayoutEffect } from "react";
import { getUpgradeDialogCopy, type UpgradeEntryPoint } from "./upgradeDialogCopy";
import { TestPaywallDialogContainer } from "./TestPaywallDialogContainer";
import { consumeUpgradeDialogReopenPending } from "./upgradeDialogReopen";

type UpgradeDialogProps = {
  isOpen: boolean;
  language: AppLanguage;
  entryPoint: UpgradeEntryPoint;
  isPending?: boolean;
  canUpgrade?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onRequestOpen?: () => void;
  onUpgrade: (preferredPackageIdentifier?: string | null) => Promise<unknown> | void;
  onRestorePurchases?: () => Promise<unknown> | void;
};

export function UpgradeDialog({
  isOpen,
  language,
  entryPoint,
  isPending = false,
  canUpgrade = true,
  errorMessage = null,
  onClose,
  onRequestOpen,
  onUpgrade,
  onRestorePurchases,
}: UpgradeDialogProps) {
  useLayoutEffect(() => {
    if (isOpen || !onRequestOpen) {
      return;
    }
    if (consumeUpgradeDialogReopenPending()) {
      onRequestOpen();
      blurActiveField();
      return;
    }
  }, [isOpen, onRequestOpen]);

  if (!isOpen) {
    return null;
  }

  if (canUpgrade) {
    return (
      <TestPaywallDialogContainer
        isOpen={isOpen}
        language={language}
        onClose={() => {
          blurActiveField();
          onClose();
        }}
        onUpgrade={onUpgrade}
        onRestorePurchases={
          onRestorePurchases
            ? () => {
                blurActiveField();
                return onRestorePurchases();
              }
            : async () => undefined
        }
        isPending={isPending}
        errorMessage={errorMessage}
      />
    );
  }

  const copy = getUpgradeDialogCopy(language, entryPoint);

  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={
        isPending
          ? undefined
          : () => {
              blurActiveField();
              onClose();
            }
      }
      closeDisabled={isPending}
      zIndexClassName="z-[180]"
      backdropAriaLabel={language === "ru" ? "Закрыть окно Plus" : "Close Plus dialog"}
    >
      <div className="soft-panel relative z-[1] w-full max-w-md rounded-[30px] p-5 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-6">
        <div className="mb-3 inline-flex rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-primary">
          Plus
        </div>
        <div className="space-y-2">
          <h2 className="app-card-title text-[1.08rem] sm:text-[1.15rem]">{copy.title}</h2>
          <p className="text-sm leading-6 text-muted">{copy.description}</p>
          {!canUpgrade ? (
            <p className="text-sm leading-6 text-primary">
              {language === "ru"
                ? "Plus для семьи оформляет владелец семейного аккаунта. Попросите его подключить или восстановить подписку."
                : "The family owner manages Plus for everyone. Ask them to purchase or restore the subscription."}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="soft-note-danger text-sm leading-6">{errorMessage}</p>
          ) : null}
        </div>
        <div className="mt-5 space-y-2 rounded-[22px] border border-border/60 bg-card-muted/50 px-4 py-4">
          {copy.highlights.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm leading-6 text-foreground">
              <span className="mt-[0.42rem] inline-flex h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className={`mt-5 grid gap-2 ${canUpgrade ? "sm:grid-cols-2" : ""}`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="soft-pill app-profile-action min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[2.6rem] sm:text-[0.82rem]"
          >
            {canUpgrade
              ? language === "ru"
                ? "Позже"
                : "Later"
              : language === "ru"
                ? "Понятно"
                : "Got it"}
          </button>
        </div>
      </div>
    </OverlayDialog>
  );
}

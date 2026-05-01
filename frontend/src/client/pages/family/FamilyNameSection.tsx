import { useRef } from "react";
import type { FocusEvent, FormEvent } from "react";
import { RowSurface } from "@shared/components/Surface";
import type { AppLanguage } from "@shared/i18n";
import { scrollFieldIntoView } from "@shared/utils/focus";
import { appBtnJournalPrimaryClass, appBtnJournalSecondaryClass } from "../child-illness/shared";
import { tFamily } from "./copy";

interface FamilyNameSectionProps {
  language: AppLanguage;
  familyName: string;
  currentFamilyName: string | null | undefined;
  canManageFamily: boolean;
  isEditing: boolean;
  isFamilyLoading: boolean;
  isPending: boolean;
  onFamilyNameChange: (value: string) => void;
  onToggleEditing: () => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function FamilyNameSection({
  language,
  familyName,
  currentFamilyName,
  canManageFamily,
  isEditing,
  isFamilyLoading,
  isPending,
  onFamilyNameChange,
  onToggleEditing,
  onCancel,
  onSubmit,
}: FamilyNameSectionProps) {
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);

  const ensureEditingFieldVisible = (event: FocusEvent<HTMLFormElement>) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const saveButton = saveButtonRef.current;
    const documentElement = document.documentElement;

    const readKeyboardHeight = () => {
      const raw = window
        .getComputedStyle(documentElement)
        .getPropertyValue("--app-keyboard-height")
        .trim()
        .replace("px", "");
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    };

    const scrollIntoComfortView = () => {
      scrollFieldIntoView(target, { block: "center" });

      const scrollContainer =
        target.closest<HTMLElement>('[data-client-scroll-root="true"]') ??
        target.closest<HTMLElement>("main") ??
        target.closest<HTMLElement>('[data-fullscreen-overlay-scroll="true"]');
      if (!scrollContainer) {
        return;
      }

      const containerRect = scrollContainer.getBoundingClientRect();
      const keyboardHeight = readKeyboardHeight();
      const safeBottomInset = 24;
      const visibleBottom = Math.min(
        containerRect.bottom,
        window.innerHeight - keyboardHeight - safeBottomInset
      );
      const targetRect = target.getBoundingClientRect();
      const bottomGap = targetRect.bottom - visibleBottom;
      if (bottomGap > 0) {
        scrollContainer.scrollBy({
          top: bottomGap + 24,
          behavior: "smooth",
        });
      }

      const visibleTop = containerRect.top + 12;
      const topGap = visibleTop - targetRect.top;
      if (topGap > 0) {
        scrollContainer.scrollBy({
          top: -(topGap + 12),
          behavior: "smooth",
        });
      }

      if (saveButton) {
        const buttonRect = saveButton.getBoundingClientRect();
        const buttonBottomGap = buttonRect.bottom - visibleBottom;
        if (buttonBottomGap > 0) {
          scrollContainer.scrollBy({
            top: buttonBottomGap + 16,
            behavior: "smooth",
          });
        }
      }
    };

    scrollIntoComfortView();
    window.setTimeout(scrollIntoComfortView, 120);
    window.setTimeout(scrollIntoComfortView, 320);
    window.setTimeout(scrollIntoComfortView, 520);
  };

  return (
    <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
      <div className="grid gap-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h2 className="app-card-title">{tFamily(language, "familyNameTitle")}</h2>
          {canManageFamily ? (
            <div className="flex shrink-0 items-center justify-end">
              <button
                type="button"
                onClick={onToggleEditing}
                className={`${appBtnJournalSecondaryClass} min-h-[2.35rem] whitespace-nowrap px-3 text-[0.78rem]`}
              >
                {isEditing ? tFamily(language, "hide") : tFamily(language, "edit")}
              </button>
            </div>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-muted">{tFamily(language, "familyNameDescription")}</p>
      </div>

      <div className="mt-4 space-y-4">
        <p className="app-card-title truncate">
          {currentFamilyName || tFamily(language, "familyNameMissing")}
        </p>

        {isEditing ? (
          <form
            onSubmit={onSubmit}
            onFocusCapture={ensureEditingFieldVisible}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="min-w-0 flex-1">
              <span className="soft-field-label">{tFamily(language, "newFamilyName")}</span>
              <input
                type="text"
                value={familyName}
                onChange={(event) => onFamilyNameChange(event.target.value)}
                className="soft-input w-full px-4"
                placeholder={tFamily(language, "newFamilyNamePlaceholder")}
                style={{
                  scrollMarginTop: "1rem",
                  scrollMarginBottom:
                    "calc(8rem + var(--app-keyboard-height, 0px) + max(1rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom))))",
                }}
              />
            </label>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <button
                ref={saveButtonRef}
                type="submit"
                disabled={
                  isFamilyLoading ||
                  isPending ||
                  !familyName.trim() ||
                  familyName.trim() === (currentFamilyName ?? "")
                }
                className={`${appBtnJournalPrimaryClass} inline-flex w-full disabled:opacity-50 sm:w-auto`}
              >
                {isPending ? tFamily(language, "saving") : tFamily(language, "save")}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isPending}
                className={`${appBtnJournalSecondaryClass} inline-flex w-full sm:w-auto`}
              >
                {tFamily(language, "cancel")}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </RowSurface>
  );
}

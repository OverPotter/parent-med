import type { FormEvent } from "react";
import { RowSurface } from "@shared/components/Surface";
import type { AppLanguage } from "@shared/i18n";
import {
  appBtnJournalPrimaryClass,
  appBtnJournalSecondaryClass,
} from "../child-illness/shared";
import { tFamily } from "./copy";

interface FamilyNameSectionProps {
  language: AppLanguage;
  familyName: string;
  currentFamilyName: string | null | undefined;
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
  isEditing,
  isFamilyLoading,
  isPending,
  onFamilyNameChange,
  onToggleEditing,
  onCancel,
  onSubmit,
}: FamilyNameSectionProps) {
  return (
    <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
      <div className="grid gap-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h2 className="app-card-title">{tFamily(language, "familyNameTitle")}</h2>
          <div className="flex shrink-0 items-center justify-end">
            <button
              type="button"
              onClick={onToggleEditing}
              className={`${appBtnJournalSecondaryClass} min-h-[2.35rem] whitespace-nowrap px-3 text-[0.78rem]`}
            >
              {isEditing ? tFamily(language, "hide") : tFamily(language, "edit")}
            </button>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted">{tFamily(language, "familyNameDescription")}</p>
      </div>

      <div className="mt-4 space-y-4">
        <p className="app-card-title truncate">
          {currentFamilyName || tFamily(language, "familyNameMissing")}
        </p>

        {isEditing ? (
          <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1">
              <span className="soft-field-label">{tFamily(language, "newFamilyName")}</span>
              <input
                type="text"
                value={familyName}
                onChange={(event) => onFamilyNameChange(event.target.value)}
                className="soft-input w-full px-4"
                placeholder={tFamily(language, "newFamilyNamePlaceholder")}
              />
            </label>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <button
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

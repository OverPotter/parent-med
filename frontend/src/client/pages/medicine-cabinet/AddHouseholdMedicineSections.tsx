import { DateField } from "@shared/components/DateField";
import type { AppLanguage } from "@shared/i18n";
import type { MedicineCatalogItem } from "@shared/types/api";
import { tCabinet } from "./copy";
import {
  cabinetActionSecondaryClass,
  cabinetCatalogListClass,
  cabinetCatalogRowClass,
  cabinetCompactInputClass,
  cabinetCompactTextareaClass,
  cabinetFilterPillClass,
  cabinetListClass,
  cabinetListRowClass,
  cabinetManualPillClass,
  cabinetPanelClass,
} from "./styles";
import {
  formatDoseCalcValue,
  getLocalizedMedicineForm,
  type MedicineCatalogCategory,
  type getMedicineCatalogCategoryOptions,
  type getManualMedicineCategoryOptions,
} from "./utils";

type ManualMedicineCategoryOption = ReturnType<typeof getManualMedicineCategoryOptions>[number];
type MedicineCategoryOption = ReturnType<typeof getMedicineCatalogCategoryOptions>[number];

export function CatalogSearchSection({
  language,
  searchName,
  selectedCategory,
  categoryOptions,
  onSearchNameChange,
  onSelectCategory,
}: {
  language: AppLanguage;
  searchName: string;
  selectedCategory: MedicineCatalogCategory;
  categoryOptions: MedicineCategoryOption[];
  onSearchNameChange: (value: string) => void;
  onSelectCategory: (value: MedicineCatalogCategory) => void;
}) {
  return (
    <div className={`${cabinetPanelClass} px-3.5 py-3`}>
      <label className="block space-y-1.5">
        <span className="soft-field-label">{tCabinet(language, "catalogSearch")}</span>
        <input
          type="text"
          value={searchName}
          onChange={(event) => onSearchNameChange(event.target.value)}
          className={cabinetCompactInputClass}
          placeholder={tCabinet(language, "catalogSearchPlaceholder")}
        />
      </label>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {categoryOptions.map((option) => {
          const isSelected = selectedCategory === option.value;
          return (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => onSelectCategory(option.value as MedicineCatalogCategory)}
              className={`${cabinetFilterPillClass} ${
                isSelected
                  ? "soft-pill-primary app-profile-action app-profile-action--selected"
                  : "soft-pill app-profile-action"
              } shrink-0`}
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-muted">
        {tCabinet(language, "catalogSearchHint")}
      </p>
    </div>
  );
}

export function CatalogSearchResults({
  language,
  catalogItems,
  onSelect,
}: {
  language: AppLanguage;
  catalogItems: MedicineCatalogItem[];
  onSelect: (item: MedicineCatalogItem) => void;
}) {
  return (
    <ul className={`${cabinetCatalogListClass} max-h-[26rem] overflow-y-auto`}>
      {catalogItems.map((item) => {
        const doseCalcValue = formatDoseCalcValue(item, language);

        return (
          <li
            key={item.id}
            className="border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] last:border-b-0"
          >
            <button type="button" onClick={() => onSelect(item)} className={cabinetCatalogRowClass}>
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_72%,var(--color-info)_28%)]" />
                  <span className="min-w-0 break-words text-sm font-semibold leading-5 text-foreground">
                    {item.name}
                  </span>
                </span>
                <span className="mt-0.5 block pl-4 text-xs font-semibold leading-5 text-muted">
                  {[
                    getLocalizedMedicineForm(item.form, language),
                    item.concentration,
                    item.defaultOpenedShelfDays
                      ? tCabinet(language, "openedShelfHint", {
                          days: item.defaultOpenedShelfDays,
                        })
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="mt-0.5 block pl-4 text-xs leading-5 text-muted/90">
                  {tCabinet(language, "doseCalcField", {
                    value: doseCalcValue ?? (language === "ru" ? "Нет" : "None"),
                  })}
                </span>
                {item.dosage ? (
                  <span className="mt-0.5 block pl-4 text-xs leading-5 text-muted/90">
                    {tCabinet(language, "dosageHint", { value: item.dosage })}
                  </span>
                ) : null}
                {item.description ? (
                  <span className="mt-0.5 line-clamp-2 block pl-4 text-xs leading-5 text-muted/80">
                    {item.description}
                  </span>
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className="text-right text-lg font-semibold leading-none text-muted"
              >
                ›
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function SelectedCatalogMedicine({
  language,
  catalogItem,
  onChangeMedicine,
}: {
  language: AppLanguage;
  catalogItem: MedicineCatalogItem;
  onChangeMedicine: () => void;
}) {
  const doseCalcValue = formatDoseCalcValue(catalogItem, language);

  return (
    <div className={cabinetListClass}>
      <div className={cabinetListRowClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{catalogItem.name}</p>
            <p className="mt-1 text-sm text-muted">
              {[getLocalizedMedicineForm(catalogItem.form, language), catalogItem.concentration]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {catalogItem.dosage ? (
              <p className="mt-1 text-sm text-muted">
                {tCabinet(language, "dosageHint", { value: catalogItem.dosage })}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-muted">
              {tCabinet(language, "doseCalcField", {
                value: doseCalcValue ?? (language === "ru" ? "Нет" : "None"),
              })}
            </p>
            {catalogItem.description ? (
              <p className="mt-2 text-sm text-muted">
                {tCabinet(language, "descriptionLabel", { value: catalogItem.description })}
              </p>
            ) : null}
            {catalogItem.defaultOpenedShelfDays ? (
              <p className="mt-2 text-sm text-muted">
                {tCabinet(language, "openedShelfHint", {
                  days: catalogItem.defaultOpenedShelfDays,
                })}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onChangeMedicine} className={cabinetActionSecondaryClass}>
            {tCabinet(language, "switchMedicine")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ManualMedicineMainSection({
  language,
  medicineCategoryOptions,
  newMedicineName,
  newMedicineCategory,
  newMedicineConcentration,
  onNameChange,
  onCategoryChange,
  onConcentrationChange,
}: {
  language: AppLanguage;
  medicineCategoryOptions: ManualMedicineCategoryOption[];
  newMedicineName: string;
  newMedicineCategory: string;
  newMedicineConcentration: string;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onConcentrationChange: (value: string) => void;
}) {
  return (
    <div className={`${cabinetPanelClass} space-y-2.5 px-3.5 py-2.5`}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_72%,var(--color-info)_28%)]" />
        <p className="text-[0.82rem] font-extrabold tracking-[-0.025em] text-foreground">
          {tCabinet(language, "manualMainSection")}
        </p>
      </div>
      <label className="block space-y-1.5">
        <span className="soft-field-label">{tCabinet(language, "newMedicineName")}</span>
        <input
          type="text"
          value={newMedicineName}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={tCabinet(language, "newMedicineNamePlaceholder")}
          className={cabinetCompactInputClass}
        />
      </label>
      <div className="space-y-1.5">
        <span className="soft-field-label">{tCabinet(language, "manualMedicineCategory")}</span>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {medicineCategoryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onCategoryChange(option.value)}
              className={`${cabinetManualPillClass} ${
                newMedicineCategory === option.value
                  ? "soft-pill-primary app-profile-action app-profile-action--selected"
                  : "soft-pill app-profile-action"
              }`}
              aria-pressed={newMedicineCategory === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <label className="block space-y-1.5">
        <span className="soft-field-label">{tCabinet(language, "concentration")}</span>
        <input
          type="text"
          value={newMedicineConcentration}
          onChange={(event) => onConcentrationChange(event.target.value)}
          placeholder={tCabinet(language, "manualConcentrationPlaceholder")}
          className={cabinetCompactInputClass}
        />
      </label>
    </div>
  );
}

export function ManualMedicineTextSection({
  language,
  newMedicineDescription,
  newMedicineDosage,
  onDescriptionChange,
  onDosageChange,
}: {
  language: AppLanguage;
  newMedicineDescription: string;
  newMedicineDosage: string;
  onDescriptionChange: (value: string) => void;
  onDosageChange: (value: string) => void;
}) {
  return (
    <div className={`${cabinetPanelClass} space-y-2.5 px-3.5 py-2.5`}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[color:color-mix(in_srgb,var(--color-info)_68%,var(--color-primary)_32%)]" />
        <p className="text-[0.82rem] font-extrabold tracking-[-0.025em] text-foreground">
          {tCabinet(language, "manualTextSection")}
        </p>
      </div>
      <label className="block space-y-1.5 sm:col-span-2">
        <span className="soft-field-label">{tCabinet(language, "description")}</span>
        <textarea
          value={newMedicineDescription}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className={cabinetCompactTextareaClass}
          placeholder={tCabinet(language, "descriptionPlaceholder")}
        />
      </label>
      <label className="block space-y-1.5 sm:col-span-2">
        <span className="soft-field-label">{tCabinet(language, "usage")}</span>
        <textarea
          value={newMedicineDosage}
          onChange={(event) => onDosageChange(event.target.value)}
          className={cabinetCompactTextareaClass}
          placeholder={tCabinet(language, "usagePlaceholder")}
        />
      </label>
    </div>
  );
}

export function PackageFieldsSection({
  language,
  expiryDate,
  openedAt,
  openedShelfDays,
  comment,
  catalogDefaultOpenedShelfDays,
  isExpired,
  hasUnknownAfterOpening,
  onExpiryDateChange,
  onOpenedAtChange,
  onOpenedShelfDaysChange,
  onCommentChange,
}: {
  language: AppLanguage;
  expiryDate: string;
  openedAt: string;
  openedShelfDays: string;
  comment: string;
  catalogDefaultOpenedShelfDays?: number | null;
  isExpired: boolean;
  hasUnknownAfterOpening: boolean;
  onExpiryDateChange: (value: string) => void;
  onOpenedAtChange: (value: string) => void;
  onOpenedShelfDaysChange: (value: string) => void;
  onCommentChange: (value: string) => void;
}) {
  return (
    <div className={`${cabinetPanelClass} space-y-2.5 px-3.5 py-2.5`}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[color:color-mix(in_srgb,var(--color-success)_64%,var(--color-primary)_36%)]" />
        <p className="text-[0.82rem] font-extrabold tracking-[-0.025em] text-foreground">
          {tCabinet(language, "packageSection")}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="soft-field-label">{tCabinet(language, "expiryDate")}</span>
          <DateField
            value={expiryDate}
            onChange={onExpiryDateChange}
            className="cabinet-compact-date-field"
            language={language}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="soft-field-label">{tCabinet(language, "openedAt")}</span>
          <DateField
            value={openedAt}
            onChange={onOpenedAtChange}
            className="cabinet-compact-date-field"
            language={language}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="soft-field-label">{tCabinet(language, "openedShelfDays")}</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="3650"
            value={openedShelfDays}
            onChange={(event) => onOpenedShelfDaysChange(event.target.value)}
            className={cabinetCompactInputClass}
            placeholder={
              catalogDefaultOpenedShelfDays
                ? String(catalogDefaultOpenedShelfDays)
                : tCabinet(language, "openedShelfDaysUnknown")
            }
          />
          <span className="mt-1 block text-xs text-muted">
            {tCabinet(language, "openedShelfDaysAuto")}
          </span>
        </label>
      </div>
      {isExpired ? (
        <p className="soft-note-warning rounded-2xl px-4 py-3 text-sm">
          {tCabinet(language, "expiredWarning")}
        </p>
      ) : null}
      {hasUnknownAfterOpening ? (
        <p className="soft-note-info rounded-2xl px-4 py-3 text-sm">
          {tCabinet(language, "openedUnknownWarning")}
        </p>
      ) : null}
      <label className="block space-y-1.5">
        <span className="soft-field-label">{tCabinet(language, "comment")}</span>
        <textarea
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          className={cabinetCompactTextareaClass}
          placeholder={tCabinet(language, "commentPlaceholder")}
        />
      </label>
    </div>
  );
}

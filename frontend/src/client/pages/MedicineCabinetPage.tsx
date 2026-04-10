/**
 * Аптечка: список упаковок по семье, добавление (справочник + срок годности).
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchHouseholdMedicines,
  createHouseholdMedicine,
  deleteHouseholdMedicine,
  updateHouseholdMedicine,
} from "@shared/api/householdMedicines";
import { searchMedicineCatalog } from "@shared/api/medicineCatalog";
import { DateField } from "@shared/components/DateField";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface, Surface } from "@shared/components/Surface";
import { trackHouseholdMedicineAdded } from "@shared/analytics";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import type { AppLanguage } from "@shared/i18n";
import type { HouseholdMedicine, MedicineCatalogItem } from "@shared/types/api";
import { formatDate, getLocalIsoDate } from "@shared/utils/date";
import { normalizeIsoDateInput } from "@shared/utils/dateInput";
import { useAppStore } from "@shared/store/useAppStore";

const STATUS_CARD_STYLES: Record<string, string> = {
  ok: "soft-card-status-success",
  expiring_soon: "soft-card-status-warning",
  expiring_after_opening: "soft-card-status-warning",
  expired: "soft-card-status-danger",
  expired_after_opening: "soft-card-status-danger",
};

const cabinetActionPrimaryClass =
  "app-btn-primary-md soft-button-primary inline-flex min-h-[2.5rem] w-auto items-center justify-center px-3 text-[0.8rem] font-semibold tracking-[-0.02em]";
const cabinetActionSecondaryClass =
  "app-btn-secondary-md soft-button-secondary inline-flex min-h-[2.5rem] w-auto items-center justify-center px-3 text-[0.8rem] font-semibold tracking-[-0.02em]";

const cabinetCopy = {
  ru: {
    title: "Аптечка",
    subtitle:
      "Реальные упаковки дома: срок годности, дата вскрытия и можно ли использовать препарат сейчас.",
    mobileHint: "Домашние лекарства, сроки и статус.",
    addTab: "Добавить препарат",
    cabinetTab: "Наша аптечка",
    loading: "Загрузка…",
    loadError: "Ошибка загрузки",
    empty: "В аптечке пока нет препаратов. Переключитесь на «Добавить препарат».",
    searchLabel: "Найти в аптечке",
    searchPlaceholder: "Название, форма или комментарий",
    foundCount: "Найдено: {{count}}",
    nothingFound: "По запросу ничего не найдено.",
    intakeForbidden: "Просрочено",
    intakeCheckOpened: "Проверьте дату вскрытия",
    intakeAllowed: "Можно использовать",
    untilOpened: "После вскрытия до {{date}}",
    untilExpiry: "Годен до {{date}}",
    openedHint: "Вскрыли {{date}} · после вскрытия {{days}} дн.",
    addPack: "Добавить упаковку",
    catalogSearch: "Поиск по справочнику",
    catalogSearchPlaceholder: "Название препарата",
    searching: "Поиск…",
    dosageHint: "Как применять: {{value}}",
    descriptionLabel: "Описание: {{value}}",
    openedShelfHint: "После вскрытия: {{days}} дн.",
    switchMedicine: "Сменить препарат",
    newMedicineName: "Название нового препарата",
    newMedicineNamePlaceholder: "Название нового препарата",
    medicineForm: "Форма препарата",
    concentration: "Концентрация",
    concentrationPlaceholder: "Концентрация",
    description: "Описание",
    descriptionPlaceholder: "Для чего препарат и в каких случаях нужен",
    usage: "Как применять",
    usagePlaceholder: "Например: по 5 мл 3 раза в день после еды",
    expiryDate: "Срок годности",
    openedAt: "Дата вскрытия",
    openedShelfDays: "Срок после вскрытия, дней",
    openedShelfDaysUnknown: "Если не знаете, оставьте пустым",
    openedShelfDaysAuto:
      "Если у препарата есть срок после вскрытия в справочнике, он подставится автоматически.",
    openedShelfDaysError: "Срок после вскрытия укажите числом от 1 до 3650 дней.",
    expiredWarning:
      "Срок годности уже истёк. Препарат можно сохранить в аптечку для учёта, но Safety Engine не даст использовать его в приёмах.",
    openedUnknownWarning:
      "Дата вскрытия указана, но срок после вскрытия не задан. Препарат сохранится, но оценка после вскрытия будет считаться неизвестной.",
    comment: "Комментарий",
    commentPlaceholder: "Например: только ночью после еды",
    addToKit: "Добавить в аптечку",
    addOwnToKit: "Добавить свой препарат в аптечку",
    reset: "Сбросить",
    expiryDateError: "Укажите корректный срок годности через календарь.",
    openedAtError: "Укажите корректную дату вскрытия через календарь.",
    addError: "Не удалось добавить препарат.",
    writeOffTitle: "Списать препарат · {{name}}",
    writeOffDescription:
      "Карточка будет удалена из аптечки. Используйте это для реально списанной или выброшенной упаковки.",
    writeOffPending: "Списываем…",
    writeOff: "Списать",
    hide: "Скрыть",
    details: "Подробнее",
    newPack: "Новая упаковка",
    close: "Закрыть",
    formField: "Форма: {{value}}",
    openedFieldKnown: "Вскрыто: {{date}} · После вскрытия: {{days}} дн.{{untilText}}",
    openedFieldUnknown: "Вскрыто: {{date}} · Срок после вскрытия не указан{{untilText}}",
    useUntil: " · Использовать до: {{date}}",
    usageField: "Как применять: {{value}}",
    descriptionField: "Описание: {{value}}",
    commentField: "Комментарий: {{value}}",
    newPackHint:
      "Если купили новую упаковку этого же препарата, обновите здесь срок годности и дату вскрытия. Старую карточку заводить заново не нужно.",
    medicineName: "Название препарата",
    formShort: "Форма",
    save: "Сохранить",
    expiredCardWarning:
      "Срок годности уже истёк. Препарат останется в аптечке для учёта, но использовать его в приёмах нельзя.",
    openedCardWarning:
      "Дата вскрытия указана, но срок после вскрытия не задан. Статус после вскрытия будет считаться неизвестным.",
    tablets: "Таблетки",
    syrup: "Сироп",
    drops: "Капли",
    suspension: "Суспензия",
    solution: "Раствор",
    suppositories: "Суппозитории (свечи)",
  },
  en: {
    title: "First aid kit",
    subtitle:
      "Real packs at home: expiry dates, opened dates and whether a medicine can be used right now.",
    mobileHint: "Home medicines, expiry dates and status.",
    addTab: "Add medicine",
    cabinetTab: "Our first aid kit",
    loading: "Loading…",
    loadError: "Failed to load data",
    empty: "There are no medicines in your first aid kit yet. Switch to “Add medicine”.",
    searchLabel: "Search first aid kit",
    searchPlaceholder: "Name, form or comment",
    foundCount: "Found: {{count}}",
    nothingFound: "Nothing matches this search.",
    intakeForbidden: "Expired",
    intakeCheckOpened: "Check opened date",
    intakeAllowed: "Usable",
    untilOpened: "After opening until {{date}}",
    untilExpiry: "Good until {{date}}",
    openedHint: "Opened on {{date}} · after opening {{days}} days",
    addPack: "Add pack",
    catalogSearch: "Catalog search",
    catalogSearchPlaceholder: "Medicine name",
    searching: "Searching…",
    dosageHint: "How to use: {{value}}",
    descriptionLabel: "Description: {{value}}",
    openedShelfHint: "After opening: {{days}} days",
    switchMedicine: "Change medicine",
    newMedicineName: "New medicine name",
    newMedicineNamePlaceholder: "New medicine name",
    medicineForm: "Medicine form",
    concentration: "Concentration",
    concentrationPlaceholder: "Concentration",
    description: "Description",
    descriptionPlaceholder: "What it is for and when it is used",
    usage: "How to use",
    usagePlaceholder: "Example: 5 ml 3 times a day after meals",
    expiryDate: "Expiry date",
    openedAt: "Opened date",
    openedShelfDays: "Shelf life after opening, days",
    openedShelfDaysUnknown: "Leave empty if you do not know it",
    openedShelfDaysAuto:
      "If the catalog already has a shelf life after opening, it will be filled in automatically.",
    openedShelfDaysError: "Shelf life after opening must be a number from 1 to 3650 days.",
    expiredWarning:
      "The expiry date has already passed. You can still keep the medicine in the first aid kit for reference, but the Safety Engine will not allow it in medication plans.",
    openedUnknownWarning:
      "Opened date is set, but shelf life after opening is missing. The medicine will be saved, but post-opening status will stay unknown.",
    comment: "Comment",
    commentPlaceholder: "For example: only at night after meals",
    addToKit: "Add to first aid kit",
    addOwnToKit: "Add your own medicine to the first aid kit",
    reset: "Reset",
    expiryDateError: "Pick a valid expiry date from the calendar.",
    openedAtError: "Pick a valid opened date from the calendar.",
    addError: "Could not add the medicine.",
    writeOffTitle: "Remove medicine · {{name}}",
    writeOffDescription:
      "This card will be removed from the first aid kit. Use this only for a pack that was actually discarded or written off.",
    writeOffPending: "Removing…",
    writeOff: "Remove",
    hide: "Hide",
    details: "Details",
    newPack: "New pack",
    close: "Close",
    formField: "Form: {{value}}",
    openedFieldKnown: "Opened: {{date}} · After opening: {{days}} days{{untilText}}",
    openedFieldUnknown: "Opened: {{date}} · Shelf life after opening is unknown{{untilText}}",
    useUntil: " · Use until: {{date}}",
    usageField: "How to use: {{value}}",
    descriptionField: "Description: {{value}}",
    commentField: "Comment: {{value}}",
    newPackHint:
      "If you bought a new pack of the same medicine, update the expiry date and opened date here. You do not need to create a second card.",
    medicineName: "Medicine name",
    formShort: "Form",
    save: "Save",
    expiredCardWarning:
      "The expiry date has already passed. The medicine stays in the first aid kit for reference, but it cannot be used in medication plans.",
    openedCardWarning:
      "Opened date is set, but shelf life after opening is missing. Post-opening status will stay unknown.",
    tablets: "Tablets",
    syrup: "Syrup",
    drops: "Drops",
    suspension: "Suspension",
    solution: "Solution",
    suppositories: "Suppositories",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

function tCabinet(
  language: AppLanguage,
  key: keyof (typeof cabinetCopy)["ru"],
  variables?: Record<string, string | number>
) {
  const template = cabinetCopy[language][key];
  if (!variables) return template;
  return Object.entries(variables).reduce(
    (result, [name, value]) => result.replace(`{{${name}}}`, String(value)),
    template
  );
}

function getMedicineFormOptions(language: AppLanguage) {
  return [
    { value: "таблетки", label: tCabinet(language, "tablets") },
    { value: "сироп", label: tCabinet(language, "syrup") },
    { value: "капли", label: tCabinet(language, "drops") },
    { value: "суспензия", label: tCabinet(language, "suspension") },
    { value: "раствор", label: tCabinet(language, "solution") },
    { value: "суппозитории", label: tCabinet(language, "suppositories") },
  ];
}

function getLocalizedMedicineForm(value: string, language: AppLanguage): string {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return value;
  }

  const knownForms: Record<string, keyof (typeof cabinetCopy)["ru"]> = {
    таблетки: "tablets",
    syrup: "syrup",
    сироп: "syrup",
    капли: "drops",
    drops: "drops",
    суспензия: "suspension",
    suspension: "suspension",
    раствор: "solution",
    solution: "solution",
    суппозитории: "suppositories",
    suppositories: "suppositories",
  };

  const matchedKey = knownForms[normalized];
  return matchedKey ? tCabinet(language, matchedKey) : value;
}

export function MedicineCabinetPage() {
  const { language } = useI18n();
  const isIosShell = useIsIosShell();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"cabinet" | "add">("cabinet");
  const [cabinetSearch, setCabinetSearch] = useState("");
  const accountId = useAppStore((s) => s.accountId);
  const liveQueryOptions = useLiveQueryOptions(10000);

  const {
    data: medicines = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["household-medicines", accountId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!accountId,
    ...liveQueryOptions,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHouseholdMedicine,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["household-medicines", accountId] }),
  });

  const normalizedCabinetSearch = cabinetSearch.trim().toLowerCase();
  const isSearchMode = normalizedCabinetSearch.length > 0;
  const filteredMedicines = medicines.filter((medicine) => {
    if (!normalizedCabinetSearch) {
      return true;
    }

    return [
      medicine.medicineName,
      medicine.medicineConcentration ?? "",
      medicine.medicineForm,
      medicine.comment ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedCabinetSearch);
  });

  return (
    <div className="min-w-0 space-y-6">
      {!isIosShell ? (
        <PageIntro
          title={tCabinet(language, "title")}
          subtitle={tCabinet(language, "subtitle")}
          compactOnMobile
          hideOnMobile
          mobileLikeDesktop
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setView("add")}
                className={view === "add" ? cabinetActionPrimaryClass : cabinetActionSecondaryClass}
              >
                {tCabinet(language, "addTab")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("cabinet");
                  setCabinetSearch("");
                }}
                className={
                  view === "cabinet" ? cabinetActionPrimaryClass : cabinetActionSecondaryClass
                }
              >
                {tCabinet(language, "cabinetTab")}
              </button>
            </div>
          }
          className="app-desktop-mobile-like-intro app-desktop-mobile-like-intro--cabinet [&_.app-title]:text-[1.78rem] [&_.app-title]:tracking-[-0.045em] sm:[&_.app-title]:text-[2rem] [&_.app-subtitle]:text-[0.94rem] sm:[&_.app-subtitle]:text-[0.98rem]"
        />
      ) : null}

      <div className={isIosShell ? "space-y-2.5" : "space-y-2.5 sm:hidden"}>
        <div className="app-mobile-section-intro">
          <h1 className="app-mobile-section-intro__title">{tCabinet(language, "title")}</h1>
          <p className="app-mobile-section-intro__hint app-mobile-section-intro__hint--single-line">
            {tCabinet(language, "mobileHint")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("add")}
            className={view === "add" ? cabinetActionPrimaryClass : cabinetActionSecondaryClass}
          >
            {tCabinet(language, "addTab")}
          </button>
          <button
            type="button"
            onClick={() => {
              setView("cabinet");
              setCabinetSearch("");
            }}
            className={view === "cabinet" ? cabinetActionPrimaryClass : cabinetActionSecondaryClass}
          >
            {tCabinet(language, "cabinetTab")}
          </button>
        </div>
      </div>

      {view === "add" ? (
        <AddHouseholdMedicineForm language={language} onCreated={() => setView("cabinet")} />
      ) : (
        <>
          {isLoading && <p className="mt-4 text-muted">{tCabinet(language, "loading")}</p>}
          {error && (
            <p className="soft-note-danger">
              {(error as { message?: string }).message ?? tCabinet(language, "loadError")}
            </p>
          )}
          {!isLoading && !error && medicines.length === 0 && (
            <div className="soft-panel-muted rounded-[24px] px-5 py-4 text-sm text-muted">
              {tCabinet(language, "empty")}
            </div>
          )}
          {medicines.length > 0 && (
            <div className="mt-4 soft-panel-muted rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
              <label className="block">
                <span className="soft-field-label">{tCabinet(language, "searchLabel")}</span>
                <input
                  type="search"
                  value={cabinetSearch}
                  onChange={(event) => setCabinetSearch(event.target.value)}
                  placeholder={tCabinet(language, "searchPlaceholder")}
                  className="soft-input mt-2 w-full px-4 text-base sm:text-sm"
                />
              </label>
              {isSearchMode && (
                <p className="mt-2 text-xs text-muted">
                  {tCabinet(language, "foundCount", { count: filteredMedicines.length })}
                </p>
              )}
            </div>
          )}
          {medicines.length > 0 && filteredMedicines.length === 0 && (
            <p className="soft-panel-muted mt-4 rounded-[24px] px-5 py-4 text-sm text-muted">
              {tCabinet(language, "nothingFound")}
            </p>
          )}
          {medicines.length > 0 && (
            <ul className="mt-6 space-y-3">
              {filteredMedicines.map((m) => (
                <MedicineItemCard
                  key={m.id}
                  language={language}
                  medicine={m}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === m.id}
                  compact={isSearchMode}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function isExpiredDate(value: string): boolean {
  if (!value) return false;
  const today = getLocalIsoDate();
  return value < today;
}

function toOpenedShelfDaysOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.floor(parsed);
  if (rounded < 1 || rounded > 3650) return null;
  return rounded;
}

function hasUnknownOpenedShelfLife(openedAt: string, openedShelfDays: string): boolean {
  return Boolean(openedAt && !openedShelfDays);
}

function getIntakeMessage(
  medicine: HouseholdMedicine,
  language: AppLanguage
): {
  text: string;
  icon: string;
  className: string;
} {
  if (medicine.status === "expired" || medicine.status === "expired_after_opening") {
    return {
      text: tCabinet(language, "intakeForbidden"),
      icon: "✕",
      className: "soft-pill-danger inline-flex rounded-full px-3 py-1 text-xs",
    };
  }

  if (!medicine.openedAt) {
    return {
      text: tCabinet(language, "intakeCheckOpened"),
      icon: "!",
      className: "soft-pill-warning inline-flex rounded-full px-3 py-1 text-xs",
    };
  }

  return {
    text: tCabinet(language, "intakeAllowed"),
    icon: "✓",
    className: "soft-pill-success inline-flex rounded-full px-3 py-1 text-xs",
  };
}

function getStatusDateText(medicine: HouseholdMedicine, language: AppLanguage): string {
  if (
    (medicine.status === "expired_after_opening" || medicine.status === "expiring_after_opening") &&
    medicine.openedExpiresAt
  ) {
    return tCabinet(language, "untilOpened", {
      date: formatDate(medicine.openedExpiresAt),
    });
  }

  return tCabinet(language, "untilExpiry", { date: formatDate(medicine.expiryDate) });
}

function getOpenedStatusHint(medicine: HouseholdMedicine, language: AppLanguage): string | null {
  if (
    (medicine.status === "expired_after_opening" || medicine.status === "expiring_after_opening") &&
    medicine.openedAt &&
    medicine.effectiveOpenedShelfDays
  ) {
    return tCabinet(language, "openedHint", {
      date: formatDate(medicine.openedAt),
      days: medicine.effectiveOpenedShelfDays,
    });
  }

  return null;
}

function AddHouseholdMedicineForm({
  language,
  onCreated,
}: {
  language: AppLanguage;
  onCreated: () => void;
}) {
  const [searchName, setSearchName] = useState("");
  const [catalogItem, setCatalogItem] = useState<MedicineCatalogItem | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [openedAt, setOpenedAt] = useState("");
  const [openedShelfDays, setOpenedShelfDays] = useState("");
  const [comment, setComment] = useState("");
  const [newMedicineName, setNewMedicineName] = useState("");
  const [newMedicineForm, setNewMedicineForm] = useState("сироп");
  const [newMedicineConcentration, setNewMedicineConcentration] = useState("");
  const [newMedicineDescription, setNewMedicineDescription] = useState("");
  const [newMedicineDosage, setNewMedicineDosage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const medicineFormOptions = getMedicineFormOptions(language);
  const isExpired = isExpiredDate(expiryDate);
  const hasUnknownAfterOpening = hasUnknownOpenedShelfLife(openedAt, openedShelfDays);
  const normalizedCatalogSearch = searchName.trim();

  const { data: catalogItems = [], isLoading: searchLoading } = useQuery({
    queryKey: ["medicine-catalog-search", normalizedCatalogSearch],
    queryFn: () => searchMedicineCatalog(normalizedCatalogSearch, 10),
    enabled: normalizedCatalogSearch.length >= 2,
  });

  const createHouseholdMutation = useMutation({
    mutationFn: createHouseholdMedicine,
    onSuccess: (_data, variables) => {
      const source = variables.catalog_item_id ? "catalog" : "manual";
      trackHouseholdMedicineAdded(source);
      queryClient.invalidateQueries({ queryKey: ["household-medicines", accountId] });
      setFormError(null);
      setCatalogItem(null);
      setExpiryDate("");
      setOpenedAt("");
      setOpenedShelfDays("");
      setComment("");
      setSearchName("");
      setNewMedicineName("");
      setNewMedicineForm("сироп");
      setNewMedicineConcentration("");
      setNewMedicineDescription("");
      setNewMedicineDosage("");
      onCreated();
    },
  });

  const resetPackageFields = () => {
    setExpiryDate("");
    setOpenedAt("");
    setOpenedShelfDays("");
    setComment("");
    setFormError(null);
  };

  const handleAddFromCatalog = (item: MedicineCatalogItem) => {
    resetPackageFields();
    setCatalogItem(item);
    setSearchName(item.name);
    if (item.defaultOpenedShelfDays) {
      setOpenedShelfDays(String(item.defaultOpenedShelfDays));
    }
  };

  const handleCreateNewAndAdd = () => {
    const normalizedExpiryDate = normalizeIsoDateInput(expiryDate);
    const normalizedOpenedAt = normalizeIsoDateInput(openedAt);

    const parsedOpenedShelfDays = toOpenedShelfDaysOrNull(openedShelfDays);

    if (!newMedicineName.trim()) return;
    if (!normalizedExpiryDate) {
      setFormError(tCabinet(language, "expiryDateError"));
      return;
    }
    if (openedAt && !normalizedOpenedAt) {
      setFormError(tCabinet(language, "openedAtError"));
      return;
    }
    if (openedShelfDays.trim() && parsedOpenedShelfDays === null) {
      setFormError(tCabinet(language, "openedShelfDaysError"));
      return;
    }

    setFormError(null);
    createHouseholdMutation.mutate({
      medicine_name: newMedicineName.trim(),
      medicine_form: newMedicineForm,
      medicine_concentration: newMedicineConcentration.trim() || null,
      medicine_description: newMedicineDescription.trim() || null,
      medicine_dosage: newMedicineDosage.trim() || null,
      expiry_date: normalizedExpiryDate,
      opened_at: normalizedOpenedAt,
      opened_shelf_days: parsedOpenedShelfDays,
      comment: comment.trim() || null,
    });
  };

  const handleAddSelected = () => {
    const normalizedExpiryDate = normalizeIsoDateInput(expiryDate);
    const normalizedOpenedAt = normalizeIsoDateInput(openedAt);

    const parsedOpenedShelfDays = toOpenedShelfDaysOrNull(openedShelfDays);

    if (!catalogItem) return;
    if (!normalizedExpiryDate) {
      setFormError(tCabinet(language, "expiryDateError"));
      return;
    }
    if (openedAt && !normalizedOpenedAt) {
      setFormError(tCabinet(language, "openedAtError"));
      return;
    }
    if (openedShelfDays.trim() && parsedOpenedShelfDays === null) {
      setFormError(tCabinet(language, "openedShelfDaysError"));
      return;
    }

    setFormError(null);
    createHouseholdMutation.mutate({
      catalog_item_id: catalogItem.id,
      expiry_date: normalizedExpiryDate,
      opened_at: normalizedOpenedAt,
      opened_shelf_days: parsedOpenedShelfDays,
      comment: comment.trim() || null,
    });
  };

  return (
    <Surface className="app-section-surface mt-4">
      <div className="space-y-4">
        <h2 className="app-card-title">{tCabinet(language, "addPack")}</h2>

        <div className="flex flex-wrap gap-4">
          <label className="min-w-0 flex-1 space-y-1.5">
            <span className="soft-field-label">{tCabinet(language, "catalogSearch")}</span>
            <input
              type="text"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                setFormError(null);
              }}
              className="soft-input w-full min-w-0 px-4 sm:max-w-xs"
              placeholder={tCabinet(language, "catalogSearchPlaceholder")}
            />
          </label>
        </div>
        {searchLoading && <p className="text-sm text-muted">{tCabinet(language, "searching")}</p>}
        {!catalogItem && normalizedCatalogSearch.length >= 2 && catalogItems.length > 0 && (
          <ul className="grid gap-2">
            {catalogItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleAddFromCatalog(item)}
                  className="soft-card w-full rounded-[22px] px-4 py-4 text-left text-sm transition-colors hover:bg-[color:var(--color-surface-soft)]"
                >
                  <p className="font-medium text-foreground">
                    {item.name} ({getLocalizedMedicineForm(item.form, language)}
                    {item.concentration ? `, ${item.concentration}` : ""})
                  </p>
                  {item.dosage && (
                    <p className="mt-1 text-xs text-muted">
                      {tCabinet(language, "dosageHint", { value: item.dosage })}
                    </p>
                  )}
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>
                  )}
                  {item.defaultOpenedShelfDays && (
                    <p className="mt-1 text-xs text-muted">
                      {tCabinet(language, "openedShelfHint", {
                        days: item.defaultOpenedShelfDays,
                      })}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {catalogItem && (
          <div className="soft-panel-muted rounded-[24px] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {catalogItem.name} ({getLocalizedMedicineForm(catalogItem.form, language)}
                  {catalogItem.concentration ? `, ${catalogItem.concentration}` : ""})
                </p>
                {catalogItem.dosage && (
                  <p className="mt-1 text-sm text-muted">
                    {tCabinet(language, "dosageHint", { value: catalogItem.dosage })}
                  </p>
                )}
                {catalogItem.description && (
                  <p className="mt-2 text-sm text-muted">
                    {tCabinet(language, "descriptionLabel", { value: catalogItem.description })}
                  </p>
                )}
                {catalogItem.defaultOpenedShelfDays && (
                  <p className="mt-2 text-sm text-muted">
                    {tCabinet(language, "openedShelfHint", {
                      days: catalogItem.defaultOpenedShelfDays,
                    })}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  resetPackageFields();
                  setCatalogItem(null);
                  setSearchName("");
                }}
                className="soft-button-secondary app-btn-secondary-md inline-flex"
              >
                {tCabinet(language, "switchMedicine")}
              </button>
            </div>
          </div>
        )}

        {!catalogItem && (
          <div className="grid gap-3">
            <label className="block space-y-1.5">
              <span className="soft-field-label">{tCabinet(language, "newMedicineName")}</span>
              <input
                type="text"
                value={newMedicineName}
                onChange={(e) => {
                  setNewMedicineName(e.target.value);
                  setFormError(null);
                }}
                placeholder={tCabinet(language, "newMedicineNamePlaceholder")}
                className="soft-input w-full px-4"
              />
            </label>
            <div>
              <span className="soft-field-label">{tCabinet(language, "medicineForm")}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {medicineFormOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setNewMedicineForm(option.value);
                      setFormError(null);
                    }}
                    className={`inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-3.5 text-[0.82rem] tracking-[-0.025em] transition-colors sm:min-h-[2.9rem] sm:px-4 sm:text-[0.87rem] ${
                      newMedicineForm === option.value ? "soft-tab-active" : "soft-tab"
                    }`}
                    aria-pressed={newMedicineForm === option.value}
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
                onChange={(e) => {
                  setNewMedicineConcentration(e.target.value);
                  setFormError(null);
                }}
                placeholder={tCabinet(language, "concentrationPlaceholder")}
                className="soft-input w-full px-4"
              />
            </label>
          </div>
        )}

        {(catalogItem || newMedicineName) && (
          <>
            {!catalogItem && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="soft-field-label">{tCabinet(language, "description")}</span>
                  <textarea
                    value={newMedicineDescription}
                    onChange={(e) => {
                      setNewMedicineDescription(e.target.value);
                      setFormError(null);
                    }}
                    className="soft-input min-h-20 w-full px-4"
                    placeholder={tCabinet(language, "descriptionPlaceholder")}
                  />
                </label>
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="soft-field-label">{tCabinet(language, "usage")}</span>
                  <textarea
                    value={newMedicineDosage}
                    onChange={(e) => {
                      setNewMedicineDosage(e.target.value);
                      setFormError(null);
                    }}
                    className="soft-input min-h-20 w-full px-4"
                    placeholder={tCabinet(language, "usagePlaceholder")}
                  />
                </label>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="soft-field-label">{tCabinet(language, "expiryDate")}</span>
                <DateField
                  value={expiryDate}
                  onChange={(nextValue) => {
                    setExpiryDate(nextValue);
                    setFormError(null);
                  }}
                  className=""
                  language={language}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="soft-field-label">{tCabinet(language, "openedAt")}</span>
                <DateField
                  value={openedAt}
                  onChange={(nextValue) => {
                    setOpenedAt(nextValue);
                    setFormError(null);
                  }}
                  className=""
                  language={language}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="soft-field-label">{tCabinet(language, "openedShelfDays")}</span>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={openedShelfDays}
                  onChange={(e) => {
                    setOpenedShelfDays(e.target.value);
                    setFormError(null);
                  }}
                  className="soft-input w-full px-4"
                  placeholder={
                    catalogItem?.defaultOpenedShelfDays
                      ? String(catalogItem.defaultOpenedShelfDays)
                      : tCabinet(language, "openedShelfDaysUnknown")
                  }
                />
                <span className="mt-1 block text-xs text-muted">
                  {tCabinet(language, "openedShelfDaysAuto")}
                </span>
              </label>
            </div>
            {isExpired && (
              <p className="soft-note-warning rounded-2xl px-4 py-3 text-sm">
                {tCabinet(language, "expiredWarning")}
              </p>
            )}
            {hasUnknownAfterOpening && (
              <p className="soft-note-info rounded-2xl px-4 py-3 text-sm">
                {tCabinet(language, "openedUnknownWarning")}
              </p>
            )}
            <label className="block space-y-1.5">
              <span className="soft-field-label">{tCabinet(language, "comment")}</span>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setFormError(null);
                }}
                className="soft-input min-h-20 w-full px-4"
                placeholder={tCabinet(language, "commentPlaceholder")}
              />
            </label>
            {(formError ||
              (createHouseholdMutation.error as { response?: { data?: { detail?: string } } })
                ?.response?.data?.detail) && (
              <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
                {formError ??
                  (
                    createHouseholdMutation.error as {
                      response?: { data?: { detail?: string } };
                    }
                  ).response?.data?.detail ??
                  tCabinet(language, "addError")}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              {catalogItem ? (
                <button
                  type="button"
                  onClick={handleAddSelected}
                  disabled={!expiryDate || createHouseholdMutation.isPending}
                  className="soft-button-primary app-btn-primary-md inline-flex w-full disabled:opacity-50 sm:w-auto"
                >
                  {tCabinet(language, "addToKit")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateNewAndAdd}
                  disabled={
                    !newMedicineName.trim() || !expiryDate || createHouseholdMutation.isPending
                  }
                  className="soft-button-primary app-btn-primary-md inline-flex w-full disabled:opacity-50 sm:w-auto"
                >
                  {tCabinet(language, "addOwnToKit")}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCatalogItem(null);
                  setExpiryDate("");
                  setOpenedAt("");
                  setOpenedShelfDays("");
                  setComment("");
                  setSearchName("");
                  setNewMedicineName("");
                  setNewMedicineForm("сироп");
                  setNewMedicineConcentration("");
                  setNewMedicineDescription("");
                  setNewMedicineDosage("");
                  setFormError(null);
                }}
                className="soft-button-secondary app-btn-secondary-md inline-flex w-full sm:w-auto"
              >
                {tCabinet(language, "reset")}
              </button>
            </div>
          </>
        )}
      </div>
    </Surface>
  );
}

function MedicineItemCard({
  language,
  medicine,
  onDelete,
  isDeleting = false,
  compact = false,
}: {
  language: AppLanguage;
  medicine: HouseholdMedicine;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isMobileActionsExpanded, setIsMobileActionsExpanded] = useState(false);
  const [expiryDate, setExpiryDate] = useState(medicine.expiryDate);
  const [openedAt, setOpenedAt] = useState(medicine.openedAt?.slice(0, 10) ?? "");
  const [openedShelfDays, setOpenedShelfDays] = useState(
    medicine.openedShelfDays ? String(medicine.openedShelfDays) : ""
  );
  const [comment, setComment] = useState(medicine.comment ?? "");
  const [medicineName, setMedicineName] = useState(medicine.medicineName);
  const [medicineForm, setMedicineForm] = useState(medicine.medicineForm);
  const [medicineConcentration, setMedicineConcentration] = useState(
    medicine.medicineConcentration ?? ""
  );
  const [medicineDescription, setMedicineDescription] = useState(
    medicine.medicineDescription ?? ""
  );
  const [medicineDosage, setMedicineDosage] = useState(medicine.medicineDosage ?? "");
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const isExpired = isExpiredDate(expiryDate);
  const hasUnknownAfterOpening = hasUnknownOpenedShelfLife(openedAt, openedShelfDays);
  const isOwnMedicine = medicine.catalogItemId === null;
  const intakeMessage = getIntakeMessage(medicine, language);
  const statusDateText = getStatusDateText(medicine, language);
  const openedStatusHint = getOpenedStatusHint(medicine, language);
  const localizedMedicineForm = getLocalizedMedicineForm(medicine.medicineForm, language);
  const useUntilText = medicine.openedExpiresAt
    ? tCabinet(language, "useUntil", { date: formatDate(medicine.openedExpiresAt) })
    : "";

  const collapseMobileCard = () => {
    setIsMobileActionsExpanded(false);
    setIsDetailsExpanded(false);
    setIsEditing(false);
  };

  const toggleMobileCard = () => {
    if (compact) {
      if (isMobileActionsExpanded || isDetailsExpanded || isEditing) {
        collapseMobileCard();
        return;
      }
      setIsMobileActionsExpanded(true);
      return;
    }
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsDetailsExpanded((value) => !value);
      setIsEditing(false);
      return;
    }
    if (isMobileActionsExpanded || isDetailsExpanded || isEditing) {
      collapseMobileCard();
      return;
    }
    setIsMobileActionsExpanded(true);
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      updateHouseholdMedicine(medicine.id, {
        ...(isOwnMedicine
          ? {
              medicine_name: medicineName.trim(),
              medicine_form: medicineForm.trim(),
              medicine_concentration: medicineConcentration.trim() || null,
              medicine_description: medicineDescription.trim() || null,
              medicine_dosage: medicineDosage.trim() || null,
            }
          : {}),
        expiry_date: expiryDate,
        opened_at: openedAt || null,
        opened_shelf_days: toOpenedShelfDaysOrNull(openedShelfDays),
        comment: comment.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-medicines", accountId] });
      setIsEditing(false);
      setEditFormError(null);
    },
  });

  if (compact) {
    return (
      <li>
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          title={tCabinet(language, "writeOffTitle", { name: medicine.medicineName })}
          description={tCabinet(language, "writeOffDescription")}
          confirmLabel={
            isDeleting ? tCabinet(language, "writeOffPending") : tCabinet(language, "writeOff")
          }
          confirmTone="danger"
          isPending={isDeleting}
          cancelLabel={tCabinet(language, "close")}
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onConfirm={() => {
            setIsDeleteConfirmOpen(false);
            onDelete(medicine.id);
          }}
        />
        <RowSurface
          className={`min-w-0 px-4 py-4 sm:px-5 sm:py-4 ${STATUS_CARD_STYLES[medicine.status] ?? ""}`}
        >
          <div className="space-y-3">
            <button
              type="button"
              onClick={toggleMobileCard}
              className="block w-full text-left"
              aria-expanded={isMobileActionsExpanded || isDetailsExpanded}
            >
              <div className="flex min-w-0 items-start gap-2">
                <div className="group relative shrink-0">
                  <span
                    aria-label={intakeMessage.text}
                    className={`${intakeMessage.className} inline-flex h-7 min-w-7 shrink-0 items-center justify-center px-2 font-semibold`}
                  >
                    {intakeMessage.icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="min-w-0 break-words text-sm font-semibold text-foreground">
                      {medicine.medicineName}
                      {medicine.medicineConcentration ? `, ${medicine.medicineConcentration}` : ""}
                    </p>
                    <span className="text-xs text-muted">{statusDateText}</span>
                  </div>
                  {medicine.medicineForm &&
                  medicine.medicineForm.trim().toLowerCase() !== "не указано" ? (
                    <p className="mt-1 text-xs text-muted">{localizedMedicineForm}</p>
                  ) : null}
                  <p className="mt-1 text-xs font-medium text-muted">{intakeMessage.text}</p>
                </div>
              </div>
            </button>

            {isMobileActionsExpanded && (
              <div className="space-y-3 border-t border-border/60 pt-3">
                {isDetailsExpanded && (
                  <div className="space-y-1.5 text-sm text-muted">
                    <p>{tCabinet(language, "formField", { value: localizedMedicineForm })}</p>
                    {medicine.openedAt && (
                      <p>
                        {medicine.effectiveOpenedShelfDays
                          ? tCabinet(language, "openedFieldKnown", {
                              date: formatDate(medicine.openedAt),
                              days: medicine.effectiveOpenedShelfDays,
                              untilText: useUntilText,
                            })
                          : tCabinet(language, "openedFieldUnknown", {
                              date: formatDate(medicine.openedAt),
                              untilText: useUntilText,
                            })}
                      </p>
                    )}
                    {medicine.medicineDosage && (
                      <p>{tCabinet(language, "usageField", { value: medicine.medicineDosage })}</p>
                    )}
                    {medicine.medicineDescription && (
                      <p>
                        {tCabinet(language, "descriptionField", {
                          value: medicine.medicineDescription,
                        })}
                      </p>
                    )}
                    {medicine.comment && (
                      <p>{tCabinet(language, "commentField", { value: medicine.comment })}</p>
                    )}
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setIsDetailsExpanded((value) => !value)}
                    className="app-btn-secondary-md soft-button-secondary inline-flex w-full items-center justify-center px-3.5"
                  >
                    {isDetailsExpanded ? tCabinet(language, "hide") : tCabinet(language, "details")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="app-btn-danger-md soft-button-danger inline-flex w-full items-center justify-center px-3.5"
                  >
                    {tCabinet(language, "writeOff")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </RowSurface>
      </li>
    );
  }

  return (
    <li>
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={tCabinet(language, "writeOffTitle", { name: medicine.medicineName })}
        description={tCabinet(language, "writeOffDescription")}
        confirmLabel={
          isDeleting ? tCabinet(language, "writeOffPending") : tCabinet(language, "writeOff")
        }
        confirmTone="danger"
        isPending={isDeleting}
        cancelLabel={tCabinet(language, "close")}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete(medicine.id);
        }}
      />
      <RowSurface className={`min-w-0 ${STATUS_CARD_STYLES[medicine.status] ?? ""}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2">
              <div
                className="min-w-0 cursor-pointer"
                onClick={toggleMobileCard}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleMobileCard();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isMobileActionsExpanded || isDetailsExpanded || isEditing}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <div className="group relative shrink-0">
                    <span
                      aria-label={intakeMessage.text}
                      className={`${intakeMessage.className} inline-flex h-7 min-w-7 shrink-0 items-center justify-center px-2 font-semibold`}
                    >
                      {intakeMessage.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 sm:items-center">
                      <p className="min-w-0 break-words font-medium text-foreground">
                        {medicine.medicineName}
                        {medicine.medicineConcentration
                          ? `, ${medicine.medicineConcentration}`
                          : ""}
                      </p>
                      <span className="soft-pill rounded-full px-3 py-1 text-xs">
                        {statusDateText}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-muted">{intakeMessage.text}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2" />
                {!compact && openedStatusHint && (
                  <p className="mt-2 text-xs text-muted">{openedStatusHint}</p>
                )}
              </div>
            </div>

            {isDetailsExpanded && (
              <div className="mt-4 space-y-2 border-t border-border/70 pt-4 text-sm text-muted">
                <p>{tCabinet(language, "formField", { value: localizedMedicineForm })}</p>
                {medicine.openedAt && (
                  <p>
                    {medicine.effectiveOpenedShelfDays
                      ? tCabinet(language, "openedFieldKnown", {
                          date: formatDate(medicine.openedAt),
                          days: medicine.effectiveOpenedShelfDays,
                          untilText: useUntilText,
                        })
                      : tCabinet(language, "openedFieldUnknown", {
                          date: formatDate(medicine.openedAt),
                          untilText: useUntilText,
                        })}
                  </p>
                )}
                {medicine.medicineDosage && (
                  <p>{tCabinet(language, "usageField", { value: medicine.medicineDosage })}</p>
                )}
                {medicine.medicineDescription && (
                  <p>
                    {tCabinet(language, "descriptionField", {
                      value: medicine.medicineDescription,
                    })}
                  </p>
                )}
                {medicine.comment && (
                  <p>{tCabinet(language, "commentField", { value: medicine.comment })}</p>
                )}
              </div>
            )}
          </div>
          {isMobileActionsExpanded && (
            <div className={compact ? "w-full" : "w-full md:hidden"}>
              <div className={`grid gap-2 ${compact ? "grid-cols-2" : ""}`}>
                <button
                  type="button"
                  onClick={() => setIsDetailsExpanded((value) => !value)}
                  className="app-btn-secondary-md soft-button-secondary inline-flex w-full items-center justify-center px-3.5"
                >
                  {isDetailsExpanded ? tCabinet(language, "hide") : tCabinet(language, "details")}
                </button>
                {!compact && (
                  <button
                    type="button"
                    onClick={() => setIsEditing((value) => !value)}
                    className="app-btn-secondary-md soft-button-secondary inline-flex w-full items-center justify-center px-3.5"
                  >
                    {isEditing ? tCabinet(language, "close") : tCabinet(language, "newPack")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="app-btn-danger-md soft-button-danger inline-flex w-full items-center justify-center px-3.5"
                >
                  {tCabinet(language, "writeOff")}
                </button>
              </div>
            </div>
          )}
          {!compact && (
            <div className="hidden md:flex md:w-auto md:flex-row md:flex-wrap md:gap-2">
              <button
                type="button"
                onClick={() => setIsDetailsExpanded((value) => !value)}
                className="app-btn-secondary-md soft-button-secondary inline-flex items-center justify-center px-3.5"
              >
                {isDetailsExpanded ? tCabinet(language, "hide") : tCabinet(language, "details")}
              </button>
              {!compact && (
                <button
                  type="button"
                  onClick={() => setIsEditing((value) => !value)}
                  className="app-btn-secondary-md soft-button-secondary inline-flex items-center justify-center px-3.5"
                >
                  {isEditing ? tCabinet(language, "close") : tCabinet(language, "newPack")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="app-btn-danger-md soft-button-danger inline-flex items-center justify-center px-3.5"
              >
                {tCabinet(language, "writeOff")}
              </button>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm text-muted">{tCabinet(language, "newPackHint")}</p>
            {isOwnMedicine && (
              <>
                <label className="block space-y-1.5">
                  <span className="soft-field-label">{tCabinet(language, "medicineName")}</span>
                  <input
                    type="text"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    className="soft-input w-full px-4"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="soft-field-label">{tCabinet(language, "formShort")}</span>
                  <input
                    type="text"
                    value={medicineForm}
                    onChange={(e) => setMedicineForm(e.target.value)}
                    className="soft-input w-full px-4"
                  />
                </label>
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="soft-field-label">{tCabinet(language, "concentration")}</span>
                  <input
                    type="text"
                    value={medicineConcentration}
                    onChange={(e) => setMedicineConcentration(e.target.value)}
                    className="soft-input w-full px-4"
                  />
                </label>
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="soft-field-label">{tCabinet(language, "description")}</span>
                  <textarea
                    value={medicineDescription}
                    onChange={(e) => setMedicineDescription(e.target.value)}
                    className="soft-input min-h-20 w-full px-4"
                  />
                </label>
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="soft-field-label">{tCabinet(language, "usage")}</span>
                  <textarea
                    value={medicineDosage}
                    onChange={(e) => setMedicineDosage(e.target.value)}
                    className="soft-input min-h-20 w-full px-4"
                  />
                </label>
              </>
            )}
            <label className="block space-y-1.5">
              <span className="soft-field-label">{tCabinet(language, "expiryDate")}</span>
              <DateField
                value={expiryDate}
                onChange={setExpiryDate}
                className=""
                language={language}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="soft-field-label">{tCabinet(language, "openedAt")}</span>
              <DateField value={openedAt} onChange={setOpenedAt} className="" language={language} />
            </label>
            <label className="block space-y-1.5">
              <span className="soft-field-label">{tCabinet(language, "openedShelfDays")}</span>
              <input
                type="number"
                min="1"
                max="3650"
                value={openedShelfDays}
                onChange={(e) => {
                  setOpenedShelfDays(e.target.value);
                  setEditFormError(null);
                }}
                className="soft-input w-full px-4"
              />
            </label>
            {isExpired && (
              <p className="soft-note-warning rounded-2xl px-4 py-3 text-sm sm:col-span-2">
                {tCabinet(language, "expiredCardWarning")}
              </p>
            )}
            {hasUnknownAfterOpening && (
              <p className="soft-note-info rounded-2xl px-4 py-3 text-sm sm:col-span-2">
                {tCabinet(language, "openedCardWarning")}
              </p>
            )}
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="soft-field-label">{tCabinet(language, "comment")}</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="soft-input min-h-20 w-full px-4"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => {
                  const parsedOpenedShelfDays = toOpenedShelfDaysOrNull(openedShelfDays);
                  if (openedShelfDays.trim() && parsedOpenedShelfDays === null) {
                    setEditFormError(tCabinet(language, "openedShelfDaysError"));
                    return;
                  }
                  setEditFormError(null);
                  updateMutation.mutate();
                }}
                disabled={
                  updateMutation.isPending ||
                  (isOwnMedicine && (!medicineName.trim() || !medicineForm.trim()))
                }
                className="app-btn-primary-md soft-button-primary inline-flex items-center justify-center px-4 disabled:opacity-50 sm:px-5"
              >
                {tCabinet(language, "save")}
              </button>
              {editFormError ? (
                <p className="soft-note-danger mt-3 rounded-2xl px-4 py-3 text-sm">
                  {editFormError}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </RowSurface>
    </li>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useBackdatedDateTimePicker } from "../../../shared/hooks/useBackdatedDateTimePicker";
import {
  useMobileI18n,
  type MobileLocale,
} from "../../../shared/i18n/mobileI18n";
import { formatBackdatedDate } from "../../../shared/lib/backdatedDateTime";
import type { MobileAuthSession } from "../../auth/api/authApi";
import { createMobileHouseholdMedicine } from "../api/mobileHouseholdMedicinesApi";
import {
  searchMobileMedicineCatalog,
  type MobileMedicineCatalogItem,
} from "../api/mobileMedicineCatalogApi";
import {
  normalizeAfterOpeningCustomValue,
  resolveAfterOpeningMode,
  type AfterOpeningMode,
} from "../model/afterOpeningShelfLife";
import { formatIsoDate, parseIsoDate } from "../model/manualMedicineCreateFlow";
import {
  getReferenceCategoryMatch,
  type ReferenceCategoryKey,
  type ReferenceCreateStep,
} from "../model/referenceMedicineCreateFlow";

function getUiLocale(locale: string): MobileLocale {
  if (locale === "ru") return "ru";
  if (locale === "de") return "de";
  if (locale === "pl") return "pl";
  return "en";
}

export function useMedicineCabinetReferenceCreateFlow({
  authSession,
  onBack,
  onCreated,
}: {
  authSession: MobileAuthSession | null;
  onBack: () => void;
  onCreated: () => void;
}) {
  const { locale } = useMobileI18n();
  const uiLocale = getUiLocale(locale);

  const [step, setStep] = useState<ReferenceCreateStep>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ReferenceCategoryKey>("all");
  const [catalogItems, setCatalogItems] = useState<MobileMedicineCatalogItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasLoadedSearch, setHasLoadedSearch] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MobileMedicineCatalogItem | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [openedDate, setOpenedDate] = useState("");
  const [openedShelfDays, setOpenedShelfDays] = useState("");
  const [openedShelfMode, setOpenedShelfMode] = useState<AfterOpeningMode>(null);
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccessSheetOpen, setIsSuccessSheetOpen] = useState(false);
  const [isShelfSheetOpen, setIsShelfSheetOpen] = useState(false);
  const [isCustomShelfSheetOpen, setIsCustomShelfSheetOpen] = useState(false);
  const [customShelfValue, setCustomShelfValue] = useState("");

  const expiryPicker = useBackdatedDateTimePicker(new Date());
  const openedPicker = useBackdatedDateTimePicker(new Date());

  useEffect(() => {
    if (!authSession || step !== "search") {
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timeoutId = setTimeout(() => {
      void searchMobileMedicineCatalog({
        accessToken: authSession.accessToken,
        language: uiLocale,
        query: searchQuery.trim() || undefined,
        limit: searchQuery.trim() ? 40 : 24,
      })
        .then((items) => {
          if (!cancelled) {
            setCatalogItems(items);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCatalogItems([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
            setHasLoadedSearch(true);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [authSession, searchQuery, step, uiLocale]);

  useEffect(() => {
    setExpiryDate("");
    setOpenedDate("");
    setComment("");
    setCustomShelfValue("");

    if (!selectedItem) {
      setOpenedShelfDays("");
      setOpenedShelfMode(null);
      return;
    }

    if (!selectedItem.defaultOpenedShelfDays) {
      setOpenedShelfDays("");
      setOpenedShelfMode(null);
      return;
    }

    const next = String(selectedItem.defaultOpenedShelfDays);
    setOpenedShelfDays(next);
    setOpenedShelfMode(resolveAfterOpeningMode(next));
  }, [selectedItem?.id]);

  const visibleItems = useMemo(
    () => catalogItems.filter((item) => getReferenceCategoryMatch(item, activeCategory)),
    [activeCategory, catalogItems],
  );

  useEffect(() => {
    if (step !== "search") {
      return;
    }
    setSelectedItem(null);
  }, [activeCategory, searchQuery, step]);

  const showEmptyState = step === "search" && hasLoadedSearch && !isSearching && visibleItems.length === 0;
  const emptyStateTitle =
    searchQuery.trim().length > 0
      ? "Пока что ничего не найдено."
      : "Пока что нет данных в справочнике.";

  const expiryDateLabel = expiryDate
    ? formatBackdatedDate(parseIsoDate(expiryDate, new Date()), uiLocale)
    : "";
  const openedDateLabel = openedDate
    ? formatBackdatedDate(parseIsoDate(openedDate, new Date()), uiLocale)
    : "";
  const openedShelfLabel = openedShelfDays ? `${openedShelfDays} дн.` : "";

  const handleBackPress = () => {
    if (step === "search") {
      onBack();
      return;
    }
    setStep("search");
  };

  const handleOpenExpiryDatePicker = () => {
    expiryPicker.reset(parseIsoDate(expiryDate, new Date()));
    expiryPicker.openPicker("date");
  };

  const handleOpenOpenedDatePicker = () => {
    openedPicker.reset(parseIsoDate(openedDate, new Date()));
    openedPicker.openPicker("date");
  };

  const handleConfirmExpiryDatePicker = () => {
    const next = new Date(expiryPicker.selectedDate);
    next.setFullYear(
      expiryPicker.pickerYear,
      expiryPicker.pickerMonthIndex,
      expiryPicker.pickerDay,
    );
    expiryPicker.setSelectedDate(next);
    setExpiryDate(formatIsoDate(next));
    expiryPicker.confirmPicker();
  };

  const handleConfirmOpenedDatePicker = () => {
    const next = new Date(openedPicker.selectedDate);
    next.setFullYear(
      openedPicker.pickerYear,
      openedPicker.pickerMonthIndex,
      openedPicker.pickerDay,
    );
    openedPicker.setSelectedDate(next);
    setOpenedDate(formatIsoDate(next));
    openedPicker.confirmPicker();
  };

  const handleSelectShelfOption = (value: number | null) => {
    if (value === null) {
      return;
    }
    const next = String(value);
    setOpenedShelfDays(next);
    setOpenedShelfMode(resolveAfterOpeningMode(next));
    setIsShelfSheetOpen(false);
  };

  const handleOpenCustomShelf = () => {
    setOpenedShelfMode("custom");
    setIsShelfSheetOpen(false);
    setCustomShelfValue(openedShelfDays);
    setIsCustomShelfSheetOpen(true);
  };

  const handleSaveCustomShelfValue = () => {
    const normalized = normalizeAfterOpeningCustomValue(customShelfValue);
    if (!normalized) {
      return;
    }

    setOpenedShelfMode("custom");
    setOpenedShelfDays(normalized);
    setIsCustomShelfSheetOpen(false);
  };

  const canSubmitStorage = !!selectedItem && !!expiryDate;

  const handlePrimaryPress = () => {
    if (step === "search") {
      if (selectedItem) {
        setStep("storage");
      }
      return;
    }

    if (!authSession || !selectedItem || !expiryDate || isSaving) {
      return;
    }

    setIsSaving(true);
    void createMobileHouseholdMedicine({
      accessToken: authSession.accessToken,
      medicineName: selectedItem.name,
      medicineForm: selectedItem.form,
      medicineConcentration: selectedItem.concentration,
      medicineDescription: selectedItem.description,
      medicineDosage: selectedItem.dosage,
      pediatricDoseMgPerKgMin: selectedItem.pediatricDoseMgPerKgMin,
      pediatricDoseMgPerKgMax: selectedItem.pediatricDoseMgPerKgMax,
      pediatricDoseNote: selectedItem.pediatricDoseNote,
      expiryDate,
      openedAt: openedDate || null,
      openedShelfDays: openedShelfDays ? Number(openedShelfDays) : null,
      comment: comment.trim() || null,
    })
      .then(() => {
        setIsSuccessSheetOpen(true);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Не получилось добавить препарат. Попробуйте ещё раз.";
        Alert.alert("Не получилось сохранить", message);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return {
    step,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    visibleItems,
    selectedItem,
    setSelectedItem,
    showEmptyState,
    emptyStateTitle,
    isSearching,
    expiryDateLabel,
    openedDateLabel,
    openedShelfLabel,
    comment,
    setComment,
    isSaving,
    isSuccessSheetOpen,
    setIsSuccessSheetOpen,
    canSubmitStorage,
    isShelfSheetOpen,
    setIsShelfSheetOpen,
    isCustomShelfSheetOpen,
    setIsCustomShelfSheetOpen,
    customShelfValue,
    setCustomShelfValue,
    openedShelfMode,
    uiLocale,
    expiryPicker,
    openedPicker,
    handleBackPress,
    handlePrimaryPress,
    handleOpenExpiryDatePicker,
    handleOpenOpenedDatePicker,
    handleConfirmExpiryDatePicker,
    handleConfirmOpenedDatePicker,
    handleSelectShelfOption,
    handleOpenCustomShelf,
    handleSaveCustomShelfValue,
    handleSuccessClose: () => {
      setIsSuccessSheetOpen(false);
      onCreated();
      onBack();
    },
  };
}

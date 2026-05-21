import { useState } from "react";
import { Alert, useWindowDimensions } from "react-native";
import { useBackdatedDateTimePicker } from "../../../shared/hooks/useBackdatedDateTimePicker";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import {
  useMobileI18n,
  type MobileLocale,
} from "../../../shared/i18n/mobileI18n";
import { formatBackdatedDate } from "../../../shared/lib/backdatedDateTime";
import type { MobileAuthSession } from "../../auth/api/authApi";
import { createMobileHouseholdMedicine } from "../api/mobileHouseholdMedicinesApi";
import {
  getManualCategoryFormValue,
  getManualCategoryStorageValue,
  type ManualCategory,
} from "../model/manualMedicineFlow";
import {
  buildManualCreatePreviewState,
  formatIsoDate,
  manualAfterOpeningOptions,
  resolveAfterOpeningMode,
  parseIsoDate,
  resolvePreviousStep,
} from "../model/manualMedicineCreateFlow";
import { normalizeAfterOpeningCustomValue, type AfterOpeningMode } from "../model/afterOpeningShelfLife";
import type { FlowStep } from "./MedicineCabinetManualCreateParts";

export function useManualMedicineCreateFlow({
  authSession,
  onBack,
  onCreated,
}: {
  authSession: MobileAuthSession | null;
  onBack: () => void;
  onCreated: () => void;
}) {
  const { locale } = useMobileI18n();
  const { width } = useWindowDimensions();
  const isRu = locale === "ru";
  const uiLocale: MobileLocale =
    isRu ? "ru" : locale === "de" ? "de" : locale === "pl" ? "pl" : "en";

  const [step, setStep] = useState<FlowStep>(1);
  const [medicineName, setMedicineName] = useState("");
  const [category, setCategory] = useState<ManualCategory | null>(null);
  const [concentration, setConcentration] = useState("");
  const [purpose, setPurpose] = useState("");
  const [howToUse, setHowToUse] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [openedDate, setOpenedDate] = useState("");
  const [afterOpeningPeriod, setAfterOpeningPeriod] = useState("");
  const [afterOpeningMode, setAfterOpeningMode] = useState<AfterOpeningMode>(null);
  const [isAfterOpeningSheetOpen, setIsAfterOpeningSheetOpen] = useState(false);
  const [isAfterOpeningCustomSheetOpen, setIsAfterOpeningCustomSheetOpen] =
    useState(false);
  const [afterOpeningCustomValue, setAfterOpeningCustomValue] = useState("");
  const [storageComment, setStorageComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const expiryPicker = useBackdatedDateTimePicker(new Date());
  const openedPicker = useBackdatedDateTimePicker(new Date());

  const canGoNextFromStep1 =
    medicineName.trim().length > 0 && category !== null;
  const canSaveStep3 = expiryDate.trim().length > 0 && !isSaving;

  const expiryDateLabel = expiryDate
    ? formatBackdatedDate(parseIsoDate(expiryDate, new Date()), uiLocale)
    : "";
  const openedDateLabel = openedDate
    ? formatBackdatedDate(parseIsoDate(openedDate, new Date()), uiLocale)
    : "";

  const previewState = buildManualCreatePreviewState({
    medicineName,
    category,
    expiryDate,
    openedDateLabel,
    afterOpeningPeriod,
    afterOpeningMode,
    locale: uiLocale,
  });

  const handlePrimaryAction = () => {
    if (step === 1) {
      if (!canGoNextFromStep1) {
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (!authSession || isSaving || !expiryDate.trim()) {
      return;
    }

    setIsSaving(true);
    void createMobileHouseholdMedicine({
      accessToken: authSession.accessToken,
      medicineName: medicineName.trim(),
      medicineForm: getManualCategoryFormValue(category),
      medicineCategory: getManualCategoryStorageValue(category),
      medicineConcentration: concentration.trim() || null,
      medicineDescription: purpose.trim() || null,
      medicineDosage: howToUse.trim() || null,
      expiryDate,
      openedAt: openedDate || null,
      openedShelfDays: afterOpeningPeriod ? Number(afterOpeningPeriod) : null,
      comment: storageComment.trim() || null,
    })
      .then(() => {
        onCreated();
        onBack();
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : isRu
              ? "Не получилось сохранить препарат. Попробуйте ещё раз."
              : locale === "de"
                ? "Das Medikament konnte nicht gespeichert werden. Versuchen Sie es erneut."
                : locale === "pl"
                  ? "Nie udało się zapisać leku. Spróbuj ponownie."
                  : "Couldn't save the medicine. Try again.";
        Alert.alert(
          isRu
            ? "Не получилось сохранить"
            : locale === "de"
              ? "Speichern fehlgeschlagen"
              : locale === "pl"
                ? "Nie udało się zapisać"
                : "Couldn't save",
          message,
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleBackNavigation = () => {
    if (step === 1) {
      onBack();
      return;
    }
    setStep((current) => (current === 3 ? 2 : 1));
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

  const handleSelectAfterOpeningOption = (value: number | null) => {
    if (value === null) {
      return;
    }
    const next = String(value);
    setAfterOpeningMode(resolveAfterOpeningMode(next));
    setAfterOpeningPeriod(next);
    setIsAfterOpeningSheetOpen(false);
  };

  const handleAfterOpeningCustomPress = () => {
    setIsAfterOpeningSheetOpen(false);
    setAfterOpeningCustomValue(
      afterOpeningMode === "custom" ? afterOpeningPeriod : "",
    );
    setIsAfterOpeningCustomSheetOpen(true);
  };

  const handleSaveAfterOpeningCustomValue = () => {
    const normalized = normalizeAfterOpeningCustomValue(afterOpeningCustomValue);
    if (!normalized) {
      return;
    }
    setAfterOpeningMode("custom");
    setAfterOpeningPeriod(normalized);
    setIsAfterOpeningCustomSheetOpen(false);
  };

  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: true,
    width,
    onBack: handleBackNavigation,
    shouldCloseOnBack: step === 1,
  });

  return {
    isRu,
    uiLocale,
    step,
    previousStep: resolvePreviousStep(step),
    translateX,
    panHandlers,
    swipeCaptureWidth,
    canGoNextFromStep1,
    canSaveStep3,
    medicineName,
    setMedicineName,
    category,
    setCategory,
    concentration,
    setConcentration,
    purpose,
    setPurpose,
    howToUse,
    setHowToUse,
    expiryDateLabel,
    openedDateLabel,
    afterOpeningPeriod,
    afterOpeningMode,
    storageComment,
    setStorageComment,
    afterOpeningCustomValue,
    setAfterOpeningCustomValue,
    isAfterOpeningSheetOpen,
    setIsAfterOpeningSheetOpen,
    isAfterOpeningCustomSheetOpen,
    setIsAfterOpeningCustomSheetOpen,
    previewState,
    manualAfterOpeningOptions,
    isSaving,
    expiryPicker,
    openedPicker,
    handleBackNavigation,
    handlePrimaryAction,
    handleOpenExpiryDatePicker,
    handleOpenOpenedDatePicker,
    handleConfirmExpiryDatePicker,
    handleConfirmOpenedDatePicker,
    handleSelectAfterOpeningOption,
    handleAfterOpeningCustomPress,
    handleSaveAfterOpeningCustomValue,
  };
}

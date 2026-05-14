import { useEffect, useState } from "react";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import type { MobileAuthSession } from "../../auth/api/authApi";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import {
  deleteMobileHouseholdMedicine,
  updateMobileHouseholdMedicine,
} from "../api/mobileHouseholdMedicinesApi";
import type { MedicineCardItem } from "../model/medicineCabinetOverviewModel";
import { useCabinetRecipientsController } from "./useCabinetRecipientsController";
import { useMedicineCabinetListController } from "./useMedicineCabinetListController";

export type MedicineCabinetOverviewScreenKey =
  | "overview"
  | "manual-create"
  | "reference-create"
  | "details";

export function useMedicineCabinetOverviewController({
  authSession,
  familyMembers,
  onOverlayVisibilityChange,
}: {
  authSession: MobileAuthSession | null;
  familyMembers: MobileFamilyMember[];
  onOverlayVisibilityChange?: (visible: boolean) => void;
}) {
  const { locale } = useMobileI18n();
  const isRu = locale === "ru";
  const [activeScreen, setActiveScreen] =
    useState<MedicineCabinetOverviewScreenKey>("overview");
  const [transientNotice, setTransientNotice] = useState<string | null>(null);
  const [isAddChoiceSheetOpen, setIsAddChoiceSheetOpen] = useState(false);
  const [pendingAddChoiceTarget, setPendingAddChoiceTarget] = useState<
    "reference-create" | "manual-create" | null
  >(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<MedicineCardItem | null>(null);
  const list = useMedicineCabinetListController({ authSession, isRu });
  const recipients = useCabinetRecipientsController({ authSession, familyMembers });

  const isAnyCabinetOverlayVisible =
    activeScreen !== "overview" ||
    isAddChoiceSheetOpen ||
    recipients.isRecipientsSheetOpen ||
    pendingDeleteItem !== null;

  useEffect(() => {
    onOverlayVisibilityChange?.(isAnyCabinetOverlayVisible);
    return () => {
      onOverlayVisibilityChange?.(false);
    };
  }, [isAnyCabinetOverlayVisible, onOverlayVisibilityChange]);

  useEffect(() => {
    if (!transientNotice) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setTransientNotice(null);
    }, 2200);

    return () => clearTimeout(timeoutId);
  }, [transientNotice]);

  useEffect(() => {
    if (isAddChoiceSheetOpen || !pendingAddChoiceTarget) {
      return;
    }

    const target = pendingAddChoiceTarget;
    setPendingAddChoiceTarget(null);
    setActiveScreen(target);
  }, [isAddChoiceSheetOpen, pendingAddChoiceTarget]);

  const sectionSubtitle = list.filteredItems.length
    ? `${list.filteredItems.length} ${
        isRu ? (list.filteredItems.length === 1 ? "карточка" : "карточки") : "items"
      }`
    : isRu
      ? "Подберите другой фильтр или добавьте первый препарат"
      : "Try a different filter or add your first medicine";

  const handleConfirmDelete = () => {
    if (!pendingDeleteItem || !authSession) {
      return;
    }

    const deletingItemId = pendingDeleteItem.id;
    setPendingDeleteItem(null);
    if (list.selectedMedicine?.id === deletingItemId) {
      list.setSelectedMedicineId(null);
    }

    void deleteMobileHouseholdMedicine({
      accessToken: authSession.accessToken,
      id: deletingItemId,
    }).then(() => {
      setTransientNotice("Препарат списан");
      void list.loadMedicines({ resetFilter: true });
    });
  };

  const handleRenewPack = (payload: { expiryDate: string; openedDate: string | null }) => {
    if (!authSession || !list.selectedMedicine) {
      return;
    }

    void updateMobileHouseholdMedicine({
      accessToken: authSession.accessToken,
      id: list.selectedMedicine.id,
      expiryDate: payload.expiryDate,
      openedAt: payload.openedDate,
    }).then(() => {
      list.setSelectedMedicineId(null);
      setActiveScreen("overview");
      setTransientNotice("Упаковка обновлена");
      void list.loadMedicines();
    });
  };

  const handleCreated = () => {
    void list.loadMedicines({ resetFilter: true });
    setTransientNotice("Препарат добавлен");
  };

  return {
    authSession,
    isRu,
    ...list,
    activeScreen,
    setActiveScreen,
    transientNotice,
    isAddChoiceSheetOpen,
    setIsAddChoiceSheetOpen,
    setPendingAddChoiceTarget,
    pendingDeleteItem,
    setPendingDeleteItem,
    sectionSubtitle,
    ...recipients,
    handleConfirmDelete,
    handleRenewPack,
    handleCreated,
  };
}

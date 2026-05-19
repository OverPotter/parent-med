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
  | "reference-create";

export type CabinetTabBarMode = "foreground" | "background" | "hidden";

function getItemCountLabel(count: number, locale: string) {
  if (locale === "ru") {
    return count === 1 ? "карточка" : "карточки";
  }
  if (locale === "de") {
    return count === 1 ? "Eintrag" : "Einträge";
  }
  if (locale === "pl") {
    return count === 1 ? "pozycja" : "pozycji";
  }
  return count === 1 ? "item" : "items";
}

export function useMedicineCabinetOverviewController({
  authSession,
  familyMembers,
  onTabBarModeChange,
}: {
  authSession: MobileAuthSession | null;
  familyMembers: MobileFamilyMember[];
  onTabBarModeChange?: (mode: CabinetTabBarMode) => void;
}) {
  const { locale } = useMobileI18n();
  const [activeScreen, setActiveScreen] =
    useState<MedicineCabinetOverviewScreenKey>("overview");
  const [transientNotice, setTransientNotice] = useState<string | null>(null);
  const [isAddChoiceSheetOpen, setIsAddChoiceSheetOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<MedicineCardItem | null>(null);
  const [expandedMedicineId, setExpandedMedicineId] = useState<string | null>(null);
  const [pendingRenewItem, setPendingRenewItem] = useState<MedicineCardItem | null>(null);
  const list = useMedicineCabinetListController({ authSession, locale });
  const recipients = useCabinetRecipientsController({ authSession, familyMembers, locale });

  const tabBarMode: CabinetTabBarMode =
    isAddChoiceSheetOpen ||
    recipients.isRecipientsSheetOpen ||
    pendingDeleteItem !== null ||
    pendingRenewItem !== null ||
    activeScreen !== "overview"
      ? "hidden"
      : "foreground";

  useEffect(() => {
    onTabBarModeChange?.(tabBarMode);
    return () => {
      onTabBarModeChange?.("foreground");
    };
  }, [onTabBarModeChange, tabBarMode]);

  useEffect(() => {
    if (!transientNotice) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setTransientNotice(null);
    }, 2200);

    return () => clearTimeout(timeoutId);
  }, [transientNotice]);

  const sectionSubtitle = list.filteredItems.length
    ? `${list.filteredItems.length} ${getItemCountLabel(list.filteredItems.length, locale)}`
    : locale === "ru"
      ? "Подберите другой фильтр или добавьте первый препарат"
      : locale === "de"
        ? "Wählen Sie einen anderen Filter oder fügen Sie das erste Medikament hinzu"
        : locale === "pl"
          ? "Wybierz inny filtr albo dodaj pierwszy lek"
          : "Try a different filter or add your first medicine";

  const handleConfirmDelete = () => {
    if (!pendingDeleteItem || !authSession) {
      return;
    }

    const deletingItemId = pendingDeleteItem.id;
    setPendingDeleteItem(null);
    setExpandedMedicineId((current) =>
      current === deletingItemId ? null : current,
    );

    void deleteMobileHouseholdMedicine({
      accessToken: authSession.accessToken,
      id: deletingItemId,
    }).then(() => {
      setTransientNotice(
        locale === "ru"
          ? "Препарат списан"
          : locale === "de"
            ? "Medikament entfernt"
            : locale === "pl"
              ? "Lek usunięty"
              : "Medicine removed",
      );
      void list.loadMedicines({ resetFilter: true });
    });
  };

  const handleRenewPack = (payload: { expiryDate: string; openedDate: string | null }) => {
    if (!authSession || !pendingRenewItem) {
      return;
    }

    void updateMobileHouseholdMedicine({
      accessToken: authSession.accessToken,
      id: pendingRenewItem.id,
      expiryDate: payload.expiryDate,
      openedAt: payload.openedDate,
    }).then(() => {
      setPendingRenewItem(null);
      setActiveScreen("overview");
      setTransientNotice(
        locale === "ru"
          ? "Упаковка обновлена"
          : locale === "de"
            ? "Packung aktualisiert"
            : locale === "pl"
              ? "Opakowanie zaktualizowane"
              : "Pack updated",
      );
      void list.loadMedicines();
    });
  };

  const handleCreated = () => {
    void list.loadMedicines({ resetFilter: true });
    setTransientNotice(
      locale === "ru"
        ? "Препарат добавлен"
        : locale === "de"
          ? "Medikament hinzugefügt"
          : locale === "pl"
            ? "Lek dodany"
            : "Medicine added",
    );
  };

  return {
    authSession,
    locale,
    ...list,
    activeScreen,
    setActiveScreen,
    transientNotice,
    expandedMedicineId,
    setExpandedMedicineId,
    isAddChoiceSheetOpen,
    setIsAddChoiceSheetOpen,
    pendingRenewItem,
    setPendingRenewItem,
    pendingDeleteItem,
    setPendingDeleteItem,
    sectionSubtitle,
    ...recipients,
    handleConfirmDelete,
    handleRenewPack,
    handleCreated,
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  fetchMobileHouseholdMedicines,
  type MobileHouseholdMedicine,
} from "../api/mobileHouseholdMedicinesApi";
import {
  buildCabinetSummaryStats,
  getDefaultCabinetFilter,
  type CabinetFilterKey,
  type MedicineCardItem,
  toMedicineCardItem,
} from "../model/medicineCabinetOverviewModel";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export function useMedicineCabinetListController({
  authSession,
  locale,
}: {
  authSession: MobileAuthSession | null;
  locale: MobileLocale;
}) {
  const [medicineItems, setMedicineItems] = useState<MedicineCardItem[]>([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(false);
  const [medicinesError, setMedicinesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CabinetFilterKey>("all");
  const [openSwipeCardId, setOpenSwipeCardId] = useState<string | null>(null);

  const loadMedicines = useCallback(
    async (options?: { resetFilter?: boolean }) => {
      if (!authSession) {
        setMedicineItems([]);
        setMedicinesError(null);
        return;
      }

      setIsLoadingMedicines(true);
      try {
        const medicines = await fetchMobileHouseholdMedicines({
          accessToken: authSession.accessToken,
        });
        setMedicineItems(
          medicines.map((medicine) => toMedicineCardItem(medicine, locale)),
        );
        setMedicinesError(null);
        if (options?.resetFilter) {
          setActiveFilter(getDefaultCabinetFilter(medicines));
        }
      } catch {
        setMedicineItems([]);
        setMedicinesError(
          locale === "ru"
            ? "Не получилось загрузить аптечку. Попробуйте ещё раз."
            : locale === "de"
              ? "Die Hausapotheke konnte nicht geladen werden. Versuchen Sie es erneut."
              : locale === "pl"
                ? "Nie udało się załadować apteczki. Spróbuj ponownie."
            : "Couldn't load the cabinet. Try again.",
        );
      } finally {
        setIsLoadingMedicines(false);
      }
    },
    [authSession, locale],
  );

  useEffect(() => {
    void loadMedicines({ resetFilter: true });
  }, [loadMedicines]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return medicineItems.filter((item) => {
      const filterMatch =
        activeFilter === "all" ? true : item.cabinetStatus === activeFilter;
      if (!filterMatch) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      return [
        item.title,
        item.subtitle,
        ...item.tags.map((tag) => tag.text),
        item.statusText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeFilter, medicineItems, searchQuery]);

  const summaryStats = useMemo(
    () => buildCabinetSummaryStats(medicineItems.map((item) => item.raw), locale),
    [locale, medicineItems],
  );

  return {
    medicineItems,
    isLoadingMedicines,
    medicinesError,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    openSwipeCardId,
    setOpenSwipeCardId,
    filteredItems,
    summaryStats,
    loadMedicines,
  };
}

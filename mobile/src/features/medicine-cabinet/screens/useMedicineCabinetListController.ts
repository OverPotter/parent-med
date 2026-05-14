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

export function useMedicineCabinetListController({
  authSession,
  isRu,
}: {
  authSession: MobileAuthSession | null;
  isRu: boolean;
}) {
  const [medicineItems, setMedicineItems] = useState<MedicineCardItem[]>([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(false);
  const [medicinesError, setMedicinesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CabinetFilterKey>("all");
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);
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
        setMedicineItems(medicines.map(toMedicineCardItem));
        setMedicinesError(null);
        if (options?.resetFilter) {
          setActiveFilter(getDefaultCabinetFilter(medicines));
        }
      } catch {
        setMedicineItems([]);
        setMedicinesError(
          isRu
            ? "Не получилось загрузить аптечку. Попробуйте ещё раз."
            : "Couldn't load the cabinet. Try again.",
        );
      } finally {
        setIsLoadingMedicines(false);
      }
    },
    [authSession, isRu],
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
    () => buildCabinetSummaryStats(medicineItems.map((item) => item.raw)),
    [medicineItems],
  );

  const selectedMedicine = selectedMedicineId
    ? medicineItems.find((item) => item.id === selectedMedicineId) ?? null
    : null;

  return {
    medicineItems,
    isLoadingMedicines,
    medicinesError,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedMedicine,
    setSelectedMedicineId,
    openSwipeCardId,
    setOpenSwipeCardId,
    filteredItems,
    summaryStats,
    loadMedicines,
  };
}

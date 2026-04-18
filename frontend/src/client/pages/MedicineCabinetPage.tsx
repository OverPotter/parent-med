/**
 * Аптечка: список упаковок по семье, добавление из справочника или вручную.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { deleteHouseholdMedicine, fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { PageIntro } from "@shared/components/PageIntro";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useAppStore } from "@shared/store/useAppStore";
import type { AppLanguage } from "@shared/i18n";
import type { HouseholdMedicine } from "@shared/types/api";
import { AddHouseholdMedicineForm } from "./medicine-cabinet/AddHouseholdMedicineForm";
import { AddMedicineChoiceDialog } from "./medicine-cabinet/AddMedicineChoiceDialog";
import { tCabinet } from "./medicine-cabinet/copy";
import { MedicineItemCard } from "./medicine-cabinet/MedicineItemCard";
import { NewPackPage } from "./medicine-cabinet/NewPackPage";
import {
  cabinetActionPrimaryClass,
  cabinetActionSecondaryClass,
  cabinetListClass,
  cabinetPanelClass,
} from "./medicine-cabinet/styles";

type AddMedicineFlow = null | "choice" | "catalog" | "manual";
type CabinetFilterKey = "attention" | "ready" | "all";

function needsAttention(status: string) {
  return (
    status === "expired" ||
    status === "expired_after_opening" ||
    status === "expiring_soon" ||
    status === "expiring_after_opening"
  );
}

function getDefaultFilter(medicines: HouseholdMedicine[]): CabinetFilterKey {
  if (medicines.some((medicine) => needsAttention(medicine.status))) {
    return "attention";
  }
  if (medicines.some((medicine) => !needsAttention(medicine.status))) {
    return "ready";
  }
  return "all";
}

function getFilterDotClass(filter: CabinetFilterKey) {
  if (filter === "attention") {
    return "bg-[color:color-mix(in_srgb,var(--color-warning)_78%,var(--color-danger)_22%)]";
  }
  if (filter === "ready") {
    return "bg-[color:color-mix(in_srgb,var(--color-success)_82%,var(--color-primary)_18%)]";
  }
  return "bg-[color:color-mix(in_srgb,var(--color-info)_76%,var(--color-primary)_24%)]";
}

export function MedicineCabinetPage() {
  const { language } = useI18n();
  const isIosShell = useIsIosShell();
  const navigate = useNavigate();
  const location = useLocation();
  const { medicineId } = useParams<{ medicineId?: string }>();
  const queryClient = useQueryClient();
  const [cabinetSearch, setCabinetSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<CabinetFilterKey | null>(null);
  const [expandedMedicineId, setExpandedMedicineId] = useState<string | null>(null);
  const accountId = useAppStore((s) => s.accountId);
  const liveQueryOptions = useLiveQueryOptions(10000);

  const addFlow: AddMedicineFlow =
    location.pathname === "/medicine-cabinet/add"
      ? "choice"
      : location.pathname === "/medicine-cabinet/add/catalog"
        ? "catalog"
        : location.pathname === "/medicine-cabinet/add/manual"
          ? "manual"
          : location.pathname.startsWith("/medicine-cabinet/add/")
            ? "choice"
            : null;
  const isNewPackFlow = Boolean(location.pathname.match(/^\/medicine-cabinet\/[^/]+\/new-pack$/));

  const openAddFlow = (flow: Exclude<AddMedicineFlow, null>, options?: { replace?: boolean }) => {
    const replace = options?.replace ?? addFlow === flow;
    const target = flow === "choice" ? "/medicine-cabinet/add" : `/medicine-cabinet/add/${flow}`;
    navigate(target, { replace });
  };

  const closeAddFlow = (options?: { replace?: boolean }) => {
    navigate("/medicine-cabinet", { replace: options?.replace ?? false });
  };

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
  const baseFilteredMedicines = medicines.filter((medicine) => {
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
  const activeFilter: CabinetFilterKey =
    medicines.length === 0 ? "all" : (selectedFilter ?? getDefaultFilter(medicines));
  const attentionMedicines = baseFilteredMedicines.filter((medicine) =>
    needsAttention(medicine.status)
  );
  const readyMedicines = baseFilteredMedicines.filter(
    (medicine) => !needsAttention(medicine.status)
  );
  const displayedMedicines =
    activeFilter === "attention"
      ? attentionMedicines
      : activeFilter === "ready"
        ? readyMedicines
        : baseFilteredMedicines;
  const filterItems: Array<{
    key: CabinetFilterKey;
    label: string;
    count: number;
  }> = [
    {
      key: "attention",
      label: tCabinet(language, "filterAttention"),
      count: attentionMedicines.length,
    },
    {
      key: "ready",
      label: tCabinet(language, "filterReady"),
      count: readyMedicines.length,
    },
    {
      key: "all",
      label: tCabinet(language, "filterAll"),
      count: baseFilteredMedicines.length,
    },
  ];
  const listTitle =
    activeFilter === "attention"
      ? tCabinet(language, "attentionSectionTitle")
      : activeFilter === "ready"
        ? tCabinet(language, "readySectionTitle")
        : tCabinet(language, "allSectionTitle");
  const listHint =
    activeFilter === "attention"
      ? tCabinet(language, "attentionSectionHint")
      : activeFilter === "ready"
        ? tCabinet(language, "readySectionHint")
        : tCabinet(language, "allSectionHint");
  const showSplitSections = activeFilter === "all";

  if (addFlow === "choice") {
    return (
      <AddMedicineChoiceDialog
        language={language}
        onClose={() => closeAddFlow()}
        onCatalog={() => openAddFlow("catalog")}
        onManual={() => openAddFlow("manual")}
      />
    );
  }

  if (addFlow === "catalog" || addFlow === "manual") {
    return (
      <AddHouseholdMedicineForm
        language={language}
        mode={addFlow}
        onClose={() => openAddFlow("choice", { replace: true })}
        onCreated={() => {
          closeAddFlow({ replace: true });
          setCabinetSearch("");
        }}
      />
    );
  }

  if (isNewPackFlow) {
    if (isLoading) {
      return <p className="mt-4 text-muted">{tCabinet(language, "loading")}</p>;
    }

    if (error) {
      return (
        <p className="soft-note-danger">
          {(error as { message?: string }).message ?? tCabinet(language, "loadError")}
        </p>
      );
    }

    const currentMedicine = medicines.find((medicine) => medicine.id === medicineId);
    if (!currentMedicine) {
      return <Navigate to="/medicine-cabinet" replace />;
    }

    return <NewPackPage language={language} medicine={currentMedicine} onClose={closeAddFlow} />;
  }

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
                onClick={() => openAddFlow("choice")}
                className={addFlow ? cabinetActionPrimaryClass : cabinetActionSecondaryClass}
              >
                {tCabinet(language, "addTab")}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeAddFlow();
                  setCabinetSearch("");
                }}
                className={!addFlow ? cabinetActionPrimaryClass : cabinetActionSecondaryClass}
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
            onClick={() => openAddFlow("choice")}
            className={addFlow ? cabinetActionPrimaryClass : cabinetActionSecondaryClass}
          >
            {tCabinet(language, "addTab")}
          </button>
          <button
            type="button"
            onClick={() => {
              closeAddFlow();
              setCabinetSearch("");
            }}
            className={!addFlow ? cabinetActionPrimaryClass : cabinetActionSecondaryClass}
          >
            {tCabinet(language, "cabinetTab")}
          </button>
        </div>
      </div>

      {isLoading && <p className="mt-4 text-muted">{tCabinet(language, "loading")}</p>}
      {error && (
        <p className="soft-note-danger">
          {(error as { message?: string }).message ?? tCabinet(language, "loadError")}
        </p>
      )}
      {!isLoading && !error && medicines.length === 0 && (
        <div className={`${cabinetPanelClass} px-5 py-4 text-sm text-muted`}>
          {tCabinet(language, "empty")}
        </div>
      )}
      {medicines.length > 0 && (
        <div className={`mt-4 ${cabinetPanelClass} px-4 py-4 sm:px-5 sm:py-5`}>
          <label className="block">
            <span className="soft-field-label">{tCabinet(language, "searchLabel")}</span>
            <input
              type="search"
              value={cabinetSearch}
              onChange={(event) => {
                setCabinetSearch(event.target.value);
                setExpandedMedicineId(null);
              }}
              placeholder={tCabinet(language, "searchPlaceholder")}
              className="soft-input mt-2 w-full px-4 text-base sm:text-sm"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
            {filterItems.map((item) => {
              const isActive = item.key === activeFilter;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(item.key);
                    setExpandedMedicineId(null);
                  }}
                  className={[
                    "soft-pill inline-flex min-h-[2.2rem] items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
                    isActive ? "text-foreground" : "opacity-55",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 rounded-full ${getFilterDotClass(item.key)}`}
                  />
                  <span>{item.label}</span>
                  <span className="text-[0.7rem] text-muted">{item.count}</span>
                </button>
              );
            })}
          </div>
          {isSearchMode && (
            <p className="mt-2 text-xs text-muted">
              {tCabinet(language, "foundCount", { count: displayedMedicines.length })}
            </p>
          )}
        </div>
      )}
      {medicines.length > 0 && displayedMedicines.length === 0 && (
        <p className={`mt-4 ${cabinetPanelClass} px-5 py-4 text-sm text-muted`}>
          {isSearchMode ? tCabinet(language, "nothingFound") : tCabinet(language, "emptyFilter")}
        </p>
      )}
      {medicines.length > 0 && !showSplitSections && displayedMedicines.length > 0 && (
        <MedicineSection
          language={language}
          title={listTitle}
          hint={listHint}
          count={displayedMedicines.length}
          medicines={displayedMedicines}
          compact={isSearchMode}
          expandedMedicineId={expandedMedicineId}
          isDeleting={deleteMutation.isPending}
          deletingMedicineId={deleteMutation.variables ?? null}
          onDelete={(id) => deleteMutation.mutate(id)}
          onExpandChange={setExpandedMedicineId}
        />
      )}
      {medicines.length > 0 && showSplitSections && attentionMedicines.length > 0 && (
        <MedicineSection
          language={language}
          title={tCabinet(language, "attentionSectionTitle")}
          hint={tCabinet(language, "attentionSectionHint")}
          count={attentionMedicines.length}
          medicines={attentionMedicines}
          compact={isSearchMode}
          expandedMedicineId={expandedMedicineId}
          isDeleting={deleteMutation.isPending}
          deletingMedicineId={deleteMutation.variables ?? null}
          onDelete={(id) => deleteMutation.mutate(id)}
          onExpandChange={setExpandedMedicineId}
        />
      )}
      {medicines.length > 0 && showSplitSections && readyMedicines.length > 0 && (
        <MedicineSection
          language={language}
          title={tCabinet(language, "readySectionTitle")}
          hint={tCabinet(language, "readySectionHint")}
          count={readyMedicines.length}
          medicines={readyMedicines}
          compact={isSearchMode}
          expandedMedicineId={expandedMedicineId}
          isDeleting={deleteMutation.isPending}
          deletingMedicineId={deleteMutation.variables ?? null}
          onDelete={(id) => deleteMutation.mutate(id)}
          onExpandChange={setExpandedMedicineId}
        />
      )}
    </div>
  );
}

function MedicineSection({
  language,
  title,
  hint,
  count,
  medicines,
  compact,
  expandedMedicineId,
  isDeleting,
  deletingMedicineId,
  onDelete,
  onExpandChange,
}: {
  language: AppLanguage;
  title: string;
  hint?: string;
  count: number;
  medicines: HouseholdMedicine[];
  compact: boolean;
  expandedMedicineId: string | null;
  isDeleting: boolean;
  deletingMedicineId: string | null;
  onDelete: (id: string) => void;
  onExpandChange: (value: string | null) => void;
}) {
  return (
    <section className="mt-5 space-y-2.5">
      <div className="px-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-[0.92rem] font-semibold tracking-[-0.025em] text-foreground">
              {title}
            </h2>
            <span className="text-[0.76rem] font-medium text-muted">
              {tCabinet(language, "sectionCount", { count })}
            </span>
          </div>
          {hint ? <p className="mt-0.5 text-[0.76rem] leading-5 text-muted">{hint}</p> : null}
        </div>
      </div>
      <ul className={cabinetListClass}>
        {medicines.map((medicine) => (
          <MedicineItemCard
            key={medicine.id}
            language={language}
            medicine={medicine}
            onDelete={onDelete}
            isDeleting={isDeleting && deletingMedicineId === medicine.id}
            compact={compact}
            isExpanded={expandedMedicineId === medicine.id}
            onExpandChange={(isExpanded) => {
              onExpandChange(isExpanded ? medicine.id : null);
            }}
          />
        ))}
      </ul>
    </section>
  );
}

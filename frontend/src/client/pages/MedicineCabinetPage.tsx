/**
 * Аптечка: список упаковок по семье, добавление из справочника или вручную.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { deleteHouseholdMedicine, fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import {
  fetchMyFamily,
  fetchMyFamilyMembers,
  updateMyFamilyCabinetRecipients,
} from "@shared/api/families";
import { PageIntro } from "@shared/components/PageIntro";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { canEditCabinet, canViewCabinet } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { AddHouseholdMedicineForm } from "./medicine-cabinet/AddHouseholdMedicineForm";
import { AddMedicineChoiceDialog } from "./medicine-cabinet/AddMedicineChoiceDialog";
import { CabinetPushRecipientsCard } from "./medicine-cabinet/CabinetPushRecipientsCard";
import { tCabinet } from "./medicine-cabinet/copy";
import { NewPackPage } from "./medicine-cabinet/NewPackPage";
import { MedicineSection } from "./medicine-cabinet/MedicineSection";
import {
  cabinetActionPrimaryClass,
  cabinetActionSecondaryClass,
  cabinetFilterPillClass,
  cabinetPanelClass,
  cabinetTopTabClass,
} from "./medicine-cabinet/styles";
import {
  CabinetFilterKey,
  getDefaultFilter,
  getFilterDotClass,
  isExpiredStatus,
  needsAttention,
} from "./medicine-cabinet/filtering";

type AddMedicineFlow = null | "choice" | "catalog" | "manual";

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
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const liveQueryOptions = useLiveQueryOptions(isIosShell ? 30_000 : 15_000);
  const canSeeCabinet = canViewCabinet(accountFamilyRole, accountAccessPolicy);
  const canMutateCabinet = canEditCabinet(accountFamilyRole, accountAccessPolicy);
  const canManageCabinetRecipients = accountFamilyRole === "admin";

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
    enabled: !!accountId && canSeeCabinet,
    ...liveQueryOptions,
  });

  const { data: family } = useQuery({
    queryKey: ["families", "me", currentFamilyId],
    queryFn: fetchMyFamily,
    enabled: !!currentFamilyId && canSeeCabinet,
    staleTime: 5 * 60 * 1000,
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["families", "me", "members", currentFamilyId],
    queryFn: fetchMyFamilyMembers,
    enabled: !!currentFamilyId && canSeeCabinet,
    staleTime: 5 * 60 * 1000,
  });
  const eligibleCabinetMembers = familyMembers.filter((member) =>
    canViewCabinet(member.familyRole, member.accessPolicy)
  );

  if (!canSeeCabinet) {
    return (
      <div>
        <h1 className="app-title">{tCabinet(language, "title")}</h1>
        <p className="mt-2 text-muted">
          {language === "ru"
            ? "Администратор семьи ещё не выдал вам доступ к аптечке."
            : "Your family admin has not granted access to the cabinet yet."}
        </p>
      </div>
    );
  }

  if (!canMutateCabinet && (addFlow || isNewPackFlow)) {
    return <Navigate to="/medicine-cabinet" replace />;
  }

  const deleteMutation = useMutation({
    mutationFn: deleteHouseholdMedicine,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["household-medicines", accountId] }),
  });

  const updateCabinetRecipientsMutation = useMutation({
    mutationFn: (memberAccountIds: string[]) => updateMyFamilyCabinetRecipients(memberAccountIds),
    onSuccess: (updatedFamily) => {
      queryClient.setQueryData(["families", "me", currentFamilyId], updatedFamily);
      queryClient.invalidateQueries({ queryKey: ["families"] });
    },
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
  const expiredMedicines = baseFilteredMedicines.filter((medicine) =>
    isExpiredStatus(medicine.status)
  );
  const reviewMedicines = baseFilteredMedicines.filter(
    (medicine) => needsAttention(medicine.status) && !isExpiredStatus(medicine.status)
  );
  const readyMedicines = baseFilteredMedicines.filter(
    (medicine) => !needsAttention(medicine.status)
  );
  const displayedMedicines =
    activeFilter === "expired"
      ? expiredMedicines
      : activeFilter === "attention"
        ? reviewMedicines
        : activeFilter === "ready"
          ? readyMedicines
          : baseFilteredMedicines;
  const filterItems: Array<{
    key: CabinetFilterKey;
    label: string;
  }> = [
    {
      key: "expired",
      label: tCabinet(language, "filterExpired"),
    },
    {
      key: "attention",
      label: tCabinet(language, "filterAttention"),
    },
    {
      key: "ready",
      label: tCabinet(language, "filterReady"),
    },
    {
      key: "all",
      label: tCabinet(language, "filterAll"),
    },
  ];
  const listTitle =
    activeFilter === "expired"
      ? tCabinet(language, "expiredSectionTitle")
      : activeFilter === "attention"
        ? tCabinet(language, "attentionSectionTitle")
        : activeFilter === "ready"
          ? tCabinet(language, "readySectionTitle")
          : tCabinet(language, "allSectionTitle");
  const listHint =
    activeFilter === "expired"
      ? tCabinet(language, "expiredSectionHint")
      : activeFilter === "attention"
        ? tCabinet(language, "attentionSectionHint")
        : activeFilter === "ready"
          ? tCabinet(language, "readySectionHint")
          : tCabinet(language, "allSectionHint");
  const showSplitSections = activeFilter === "all";

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
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {!isIosShell ? (
        <PageIntro
          title={
            <span className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span>{tCabinet(language, "title")}</span>
              {family && canManageCabinetRecipients ? (
                <CabinetPushRecipientsCard
                  language={language}
                  family={family}
                  familyMembers={eligibleCabinetMembers}
                  isPending={updateCabinetRecipientsMutation.isPending}
                  onSelectAll={() => updateCabinetRecipientsMutation.mutate([])}
                  onChangeSelection={(memberIds) => {
                    updateCabinetRecipientsMutation.mutate(memberIds);
                  }}
                />
              ) : null}
            </span>
          }
          subtitle={tCabinet(language, "subtitle")}
          compactOnMobile
          hideOnMobile
          mobileLikeDesktop
          action={
            <div className="grid grid-cols-2 gap-2">
              {canMutateCabinet ? (
                <button
                  type="button"
                  onClick={() => openAddFlow("choice")}
                  className={[
                    addFlow ? cabinetActionPrimaryClass : cabinetActionSecondaryClass,
                    cabinetTopTabClass,
                    "w-full",
                  ].join(" ")}
                >
                  {tCabinet(language, "addTab")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  closeAddFlow();
                  setCabinetSearch("");
                }}
                className={[
                  !addFlow ? cabinetActionPrimaryClass : cabinetActionSecondaryClass,
                  cabinetTopTabClass,
                  "w-full",
                ].join(" ")}
              >
                {tCabinet(language, "cabinetTab")}
              </button>
            </div>
          }
          className="app-desktop-mobile-like-intro app-desktop-mobile-like-intro--cabinet [&_.app-title]:text-[1.78rem] [&_.app-title]:tracking-[-0.045em] sm:[&_.app-title]:text-[2rem] [&_.app-subtitle]:text-[0.94rem] sm:[&_.app-subtitle]:text-[0.98rem]"
        />
      ) : null}

      <div className="app-root-mobile-header sm:hidden">
        <div className="app-mobile-section-intro">
          <div className="flex items-center justify-between gap-2">
            <h1 className="app-mobile-section-intro__title">{tCabinet(language, "title")}</h1>
            {family && canManageCabinetRecipients ? (
              <CabinetPushRecipientsCard
                language={language}
                family={family}
                familyMembers={eligibleCabinetMembers}
                isPending={updateCabinetRecipientsMutation.isPending}
                onSelectAll={() => updateCabinetRecipientsMutation.mutate([])}
                onChangeSelection={(memberIds) => {
                  updateCabinetRecipientsMutation.mutate(memberIds);
                }}
              />
            ) : null}
          </div>
          <p className="app-mobile-section-intro__hint app-mobile-section-intro__hint--single-line">
            {tCabinet(language, "mobileHint")}
          </p>
        </div>
      </div>
      {addFlow === "choice" ? (
        <AddMedicineChoiceDialog
          language={language}
          onClose={() => closeAddFlow()}
          onCatalog={() => openAddFlow("catalog")}
          onManual={() => openAddFlow("manual")}
        />
      ) : null}
      <div className={isIosShell ? "space-y-2.5" : "space-y-2.5 sm:hidden"}>
        <div className="grid grid-cols-2 gap-2">
          {canMutateCabinet ? (
            <button
              type="button"
              onClick={() => openAddFlow("choice")}
              className={[
                addFlow ? cabinetActionPrimaryClass : cabinetActionSecondaryClass,
                cabinetTopTabClass,
                "w-full",
              ].join(" ")}
            >
              {tCabinet(language, "addTab")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              closeAddFlow();
              setCabinetSearch("");
            }}
            className={[
              !addFlow ? cabinetActionPrimaryClass : cabinetActionSecondaryClass,
              cabinetTopTabClass,
              "w-full",
            ].join(" ")}
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
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
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
                    isActive ? cabinetActionPrimaryClass : cabinetActionSecondaryClass,
                    cabinetFilterPillClass,
                    "inline-flex items-center justify-center gap-1.5",
                    !isActive ? "opacity-75" : "",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 rounded-full ${getFilterDotClass(item.key, {
                      hasAttention: attentionMedicines.length > 0,
                    })}`}
                  />
                  <span className="min-w-0 whitespace-normal text-center leading-4">
                    {item.label}
                  </span>
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
          canEdit={canMutateCabinet}
          onExpandChange={setExpandedMedicineId}
        />
      )}
      {medicines.length > 0 && showSplitSections && expiredMedicines.length > 0 && (
        <MedicineSection
          language={language}
          title={tCabinet(language, "expiredSectionTitle")}
          hint={tCabinet(language, "expiredSectionHint")}
          count={expiredMedicines.length}
          medicines={expiredMedicines}
          compact={isSearchMode}
          expandedMedicineId={expandedMedicineId}
          isDeleting={deleteMutation.isPending}
          deletingMedicineId={deleteMutation.variables ?? null}
          onDelete={(id) => deleteMutation.mutate(id)}
          canEdit={canMutateCabinet}
          onExpandChange={setExpandedMedicineId}
        />
      )}
      {medicines.length > 0 && showSplitSections && reviewMedicines.length > 0 && (
        <MedicineSection
          language={language}
          title={tCabinet(language, "attentionSectionTitle")}
          hint={tCabinet(language, "attentionSectionHint")}
          count={reviewMedicines.length}
          medicines={reviewMedicines}
          compact={isSearchMode}
          expandedMedicineId={expandedMedicineId}
          isDeleting={deleteMutation.isPending}
          deletingMedicineId={deleteMutation.variables ?? null}
          onDelete={(id) => deleteMutation.mutate(id)}
          canEdit={canMutateCabinet}
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
          canEdit={canMutateCabinet}
          onExpandChange={setExpandedMedicineId}
        />
      )}
    </div>
  );
}

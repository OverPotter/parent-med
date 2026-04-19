import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import type { AppLanguage } from "@shared/i18n";
import {
  actionPrimaryClass,
  actionSecondaryClass,
  canMarkGroupDose,
  displayPillboxText,
  getPlanStateCompact,
  handleCardKeyDown,
  isLateDose,
  isOverdueDose,
  PillboxDeleteTarget,
  PillboxGroup,
  PillboxPlanListFilter,
  segmentedButtonActiveClass,
  segmentedButtonClass,
  segmentedControlClass,
  tPillbox,
} from "./shared";

export function PillboxHubScreen({
  language,
  isIosShell,
  listFilter,
  visibleGroups,
  highlightedPlanId,
  openAnalytics,
  openCreate,
  openDetails,
  setListFilter,
  markNextDoseTaken,
  takeDosePending,
  deleteTarget,
  planActionError,
  deletePlanPending,
  confirmDelete,
  closeDeleteDialog,
}: {
  language: AppLanguage;
  isIosShell: boolean;
  listFilter: PillboxPlanListFilter;
  visibleGroups: PillboxGroup[];
  highlightedPlanId: string | null;
  openAnalytics: (targetPlanId?: string | null, targetFilter?: PillboxPlanListFilter) => void;
  openCreate: () => void;
  openDetails: (group: PillboxGroup) => void;
  setListFilter: (next: PillboxPlanListFilter) => void;
  markNextDoseTaken: (group: PillboxGroup) => void;
  takeDosePending: boolean;
  deleteTarget: PillboxDeleteTarget | null;
  planActionError: string | null;
  deletePlanPending: boolean;
  confirmDelete: () => void;
  closeDeleteDialog: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <div className="app-mobile-section-intro">
          <h1 className="app-mobile-section-intro__title">{tPillbox(language, "hubTitle")}</h1>
          <p className="app-mobile-section-intro__hint">
            {isIosShell ? tPillbox(language, "hubMobileHint") : tPillbox(language, "hubSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAnalytics(undefined, listFilter)}
            className={actionSecondaryClass}
          >
            {tPillbox(language, "analytics")}
          </button>
          <button type="button" onClick={openCreate} className={actionPrimaryClass}>
            {tPillbox(language, "createPlan")}
          </button>
        </div>
        <div className={segmentedControlClass} aria-label={tPillbox(language, "hubTitle")}>
          <button
            type="button"
            onClick={() => setListFilter("active")}
            className={listFilter === "active" ? segmentedButtonActiveClass : segmentedButtonClass}
            aria-pressed={listFilter === "active"}
          >
            {tPillbox(language, "activeFilter")}
          </button>
          <button
            type="button"
            onClick={() => setListFilter("archive")}
            className={listFilter === "archive" ? segmentedButtonActiveClass : segmentedButtonClass}
            aria-pressed={listFilter === "archive"}
          >
            {tPillbox(language, "archiveFilter")}
          </button>
        </div>
      </div>

      <ul className="soft-panel divide-y divide-[color:color-mix(in_srgb,var(--color-border)_62%,transparent)] overflow-hidden rounded-[28px]">
        {visibleGroups.length === 0 ? (
          <li>
            <div className="px-5 py-4 text-sm text-muted">
              {listFilter === "archive"
                ? language === "ru"
                  ? "В архиве пока нет планов."
                  : "There are no archived plans yet."
                : tPillbox(language, "hubEmpty")}
            </div>
          </li>
        ) : null}
        {visibleGroups.map((group) => {
          const canMarkNow = canMarkGroupDose(group);
          const isOverdue = isOverdueDose(group.nextDoseAt, group.status);
          const isLate = isLateDose(group.nextDoseAt, group.status);
          const isHighlighted = group.id === highlightedPlanId;
          const planStateCompact = getPlanStateCompact(
            group.status,
            isOverdue,
            canMarkNow,
            isLate,
            language
          );
          return (
            <li key={group.id}>
              <div
                id={`pillbox-plan-${group.id}`}
                role="button"
                tabIndex={0}
                onClick={() => openDetails(group)}
                onKeyDown={(event) => handleCardKeyDown(event, () => openDetails(group))}
                className="block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <div
                  className={`px-4 py-3 transition hover:bg-[color:color-mix(in_srgb,var(--color-surface-glare-soft)_26%,transparent)] sm:px-5 ${
                    isHighlighted
                      ? "bg-[color:color-mix(in_srgb,var(--color-primary)_8%,transparent)]"
                      : ""
                  }`}
                >
                  <div className="grid gap-2.5">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                            group.status === "active"
                              ? "bg-[color:var(--color-success)]"
                              : group.status === "paused"
                                ? "bg-[color:var(--color-warning)]"
                                : "bg-[color:var(--color-danger)]"
                          }`}
                          aria-hidden="true"
                        />
                        <h2 className="app-card-title min-w-0">
                          {displayPillboxText(group.title)}
                        </h2>
                      </div>
                      <p className="mt-1 text-[0.82rem] leading-5 text-muted">
                        {planStateCompact}
                        <span className="mx-1.5">—</span>
                        {tPillbox(language, "nextDoseShort").toLowerCase()}
                        <span className="mx-1.5">—</span>
                        <span
                          className={
                            group.status === "paused" || group.status === "archived"
                              ? "text-muted"
                              : isOverdue || isLate
                                ? "font-semibold text-[color:var(--color-warning)]"
                                : canMarkNow
                                  ? "font-semibold text-[color:var(--color-success)]"
                                  : "font-semibold text-foreground"
                          }
                        >
                          {group.nextDose}
                        </span>
                      </p>
                    </div>

                    {canMarkNow ? (
                      <div className="flex justify-start">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            markNextDoseTaken(group);
                          }}
                          disabled={takeDosePending}
                          className={`${actionPrimaryClass} w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
                        >
                          {takeDosePending
                            ? tPillbox(language, "taking")
                            : tPillbox(language, "markTaken")}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[0.76rem] leading-5 text-muted">
                        {tPillbox(language, "tapToOpen")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={
          deleteTarget?.kind === "plan"
            ? tPillbox(language, "confirmDeletePlanTitle")
            : tPillbox(language, "confirmDeleteMedicineTitle")
        }
        description={`${deleteTarget?.kind === "plan" ? tPillbox(language, "confirmDeletePlanDescription") : tPillbox(language, "confirmDeleteMedicineDescription")}${planActionError ? `\n\n${planActionError}` : ""}`}
        confirmLabel={tPillbox(language, "delete")}
        cancelLabel={tPillbox(language, "cancel")}
        confirmTone="danger"
        isPending={deleteTarget?.kind === "plan" ? deletePlanPending : false}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}

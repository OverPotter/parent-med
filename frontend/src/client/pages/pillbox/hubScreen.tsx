import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { PlusBadge } from "@shared/components/PlusBadge";
import { EmptyState, RowSurface } from "@shared/components/Surface";
import { useNow } from "@shared/hooks/useNow";
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
  tPillbox,
} from "./shared";

export function PillboxHubScreen({
  language,
  isIosShell,
  listFilter,
  visibleGroups,
  canAct,
  canEdit,
  createPlanLocked,
  showFreeDowngradeNotice,
  freePrimaryPlanId,
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
  canAct: boolean;
  canEdit: boolean;
  createPlanLocked: boolean;
  showFreeDowngradeNotice: boolean;
  freePrimaryPlanId: string | null;
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
  const now = useNow(2_000);
  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <div className="app-root-mobile-header sm:hidden">
        <div className="app-mobile-section-intro">
          <h1 className="app-mobile-section-intro__title">{tPillbox(language, "hubTitle")}</h1>
          <p className="app-mobile-section-intro__hint">
            {isIosShell ? tPillbox(language, "hubMobileHint") : tPillbox(language, "hubSubtitle")}
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {canEdit ? (
            <button
              type="button"
              onClick={openCreate}
              className={`${actionSecondaryClass} min-w-0 px-3.5`}
            >
              <span className="inline-flex items-center gap-2">
                <span>{tPillbox(language, "createPlan")}</span>
                {createPlanLocked ? <PlusBadge /> : null}
              </span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => openAnalytics(undefined, listFilter)}
            className={`${actionSecondaryClass} min-w-0 px-3.5 ${canEdit ? "" : "col-span-2"}`}
          >
            {tPillbox(language, "analytics")}
          </button>
        </div>
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted">
              {language === "ru" ? "Показывать" : "Show"}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[0.88rem] font-medium tracking-[-0.02em]">
              <span className={listFilter === "active" ? "text-foreground" : "text-muted"}>
                {tPillbox(language, "activeFilter")}
              </span>
              <span className="text-muted/60">/</span>
              <span className={listFilter === "completed" ? "text-foreground" : "text-muted"}>
                {tPillbox(language, "archiveFilter")}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={listFilter === "completed"}
            aria-label={
              listFilter === "completed"
                ? tPillbox(language, "archiveFilter")
                : tPillbox(language, "activeFilter")
            }
            onClick={() => setListFilter(listFilter === "completed" ? "active" : "completed")}
            className={[
              "baby-mode-switch relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors",
              listFilter === "completed" ? "baby-mode-switch--active" : "",
            ].join(" ")}
          >
            <span
              className={[
                "baby-mode-switch__thumb absolute left-1 inline-block h-6 w-6 rounded-full transition-transform",
                listFilter === "completed" ? "translate-x-6" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {showFreeDowngradeNotice ? (
        <EmptyState className="text-foreground">
          <div className="space-y-3">
            <p className="app-card-title">{tPillbox(language, "freeDowngradeNoticeTitle")}</p>
            <p className="text-sm leading-6 text-muted">
              {tPillbox(language, "freeDowngradeNoticeDescription")}
            </p>
          </div>
        </EmptyState>
      ) : null}

      <ul className="grid gap-3">
        {visibleGroups.length === 0 ? (
          <li>
            <div className="soft-panel rounded-[28px] px-5 py-4 text-sm text-muted">
              {listFilter === "completed"
                ? language === "ru"
                  ? "Завершённых планов пока нет."
                  : "There are no completed plans yet."
                : tPillbox(language, "hubEmpty")}
            </div>
          </li>
        ) : null}
        {visibleGroups.map((group) => {
          const canMarkNow = canMarkGroupDose(group, now);
          const isOverdue = isOverdueDose(group.nextDoseAt, group.status, now);
          const isLate = isLateDose(group.nextDoseAt, group.status, now);
          const isHighlighted = group.id === highlightedPlanId;
          const isOperationalPlan = group.status !== "archived" && group.status !== "completed";
          const isFreePrimaryPlan =
            showFreeDowngradeNotice && isOperationalPlan && group.id === freePrimaryPlanId;
          const isFreeLockedPlan =
            showFreeDowngradeNotice && isOperationalPlan && group.id !== freePrimaryPlanId;
          const planStateCompact = getPlanStateCompact(
            group.status,
            isOverdue,
            canMarkNow,
            isLate,
            language
          );
          return (
            <li key={group.id}>
              <div id={`pillbox-plan-${group.id}`}>
                <RowSurface
                  className={`children-card-hero cursor-pointer text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                    isHighlighted ? "pillbox-next-medication-outline" : ""
                  }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetails(group)}
                    onKeyDown={(event) => handleCardKeyDown(event, () => openDetails(group))}
                    className="grid gap-4"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                            group.status === "active"
                              ? "bg-[color:var(--color-success)]"
                              : group.status === "paused"
                                ? "bg-[color:var(--color-warning)]"
                                : "bg-sky-500"
                          }`}
                          aria-hidden="true"
                        />
                        <h2 className="app-card-title min-w-0">
                          {displayPillboxText(group.title)}
                        </h2>
                        {isFreePrimaryPlan ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-success)_16%,transparent)] px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.01em] text-[color:color-mix(in_srgb,var(--color-success)_78%,var(--color-foreground))]">
                            {tPillbox(language, "freePrimaryPlanBadge")}
                          </span>
                        ) : null}
                        {isFreeLockedPlan ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-warning)_14%,transparent)] px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.01em] text-[color:color-mix(in_srgb,var(--color-warning)_82%,var(--color-foreground))]">
                            {tPillbox(language, "freeLockedPlanBadge")}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5 text-muted">
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.01em] ${
                            group.status === "active"
                              ? "bg-[color:color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[color:color-mix(in_srgb,var(--color-success)_78%,var(--color-foreground))]"
                              : group.status === "paused"
                                ? "bg-[color:color-mix(in_srgb,var(--color-warning)_14%,transparent)] text-[color:color-mix(in_srgb,var(--color-warning)_78%,var(--color-foreground))]"
                                : "bg-[color:color-mix(in_srgb,skyblue_18%,transparent)] text-[color:color-mix(in_srgb,skyblue_74%,var(--color-foreground))]"
                          }`}
                        >
                          {planStateCompact}
                        </span>
                        <span
                          aria-hidden="true"
                          className="h-1 w-1 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_30%,transparent)]"
                        />
                        <span>{formatPlanCountLabel(group.activeCount, language)}</span>
                      </div>
                      <p className="text-[0.82rem] leading-5 text-muted">
                        {group.status === "completed" || group.status === "archived" ? (
                          <span>
                            {language === "ru" ? "Курс уже завершён" : "Course is completed"}
                          </span>
                        ) : (
                          <>
                            {tPillbox(language, "nextDoseShort")}
                            {" · "}
                            <span
                              className={
                                group.status === "paused"
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
                          </>
                        )}
                      </p>
                    </div>

                    {canAct && canMarkNow ? (
                      <div className="flex justify-start">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            markNextDoseTaken(group);
                          }}
                          disabled={takeDosePending}
                          className={`${actionPrimaryClass} min-h-[2.42rem] w-full px-3.5 text-[0.8rem] sm:min-h-[2.5rem] sm:w-auto sm:text-[0.82rem] disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {takeDosePending
                            ? tPillbox(language, "taking")
                            : tPillbox(language, "markTaken")}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[0.76rem] leading-5 text-muted/88">
                        {tPillbox(language, "tapToOpen")}
                      </p>
                    )}
                  </div>
                </RowSurface>
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

function formatPlanCountLabel(count: number, language: AppLanguage) {
  if (language === "en") {
    return count === 1 ? "1 medicine" : `${count} medicines`;
  }

  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} лекарство`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} лекарства`;
  return `${count} лекарств`;
}

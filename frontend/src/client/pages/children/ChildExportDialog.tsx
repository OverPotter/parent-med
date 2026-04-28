import { type TouchEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  type ChildExportKind,
  type ChildExportPeriod,
  downloadChildExportArchive,
  downloadChildExportCsv,
} from "@shared/api/children";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import {
  childActionPrimaryClass,
  childActionSecondaryClass,
  childActionSuccessClass,
} from "./shared";
import {
  allExportsOption,
  clampExportSheetOffset,
  defaultExportPeriod,
  defaultExportSelection,
  resolvePrimaryExportAction,
  shouldDismissExportSheetSwipe,
  shouldTrackExportSheetSwipe,
  type ExportSelection,
} from "./childExportDialogModel";

type ChildExportDialogProps = {
  isOpen: boolean;
  childId: string;
  childName: string;
  language: "ru" | "en";
  onClose: () => void;
};

const exportKinds: ChildExportKind[] = ["analytics_summary", "child_illness", "child_care"];
const exportPeriods: ChildExportPeriod[] = ["two_weeks", "month", "half_year", "all"];

export function ChildExportDialog({
  isOpen,
  childId,
  childName,
  language,
  onClose,
}: ChildExportDialogProps) {
  const [selectedExport, setSelectedExport] = useState<ExportSelection>(defaultExportSelection);
  const [period, setPeriod] = useState<ChildExportPeriod>(defaultExportPeriod);
  const [isPending, setIsPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [sheetOffsetY, setSheetOffsetY] = useState(0);
  const [isSheetDismissAnimating, setIsSheetDismissAnimating] = useState(false);
  const copy = getCopy(language);
  const selectedExportDescription = useMemo(() => {
    if (selectedExport === allExportsOption) {
      return copy.allExports.description;
    }
    return copy.kindOptionDescriptions[selectedExport];
  }, [copy.allExports.description, copy.kindOptionDescriptions, selectedExport]);

  useEffect(() => {
    if (!isOpen) {
      setSheetOffsetY(0);
      setIsSheetDismissAnimating(false);
      return;
    }

    setSelectedExport(defaultExportSelection);
    setPeriod(defaultExportPeriod);
    setSuccessMessage(null);
    setErrorMessage(null);
    setSheetOffsetY(0);
    setIsSheetDismissAnimating(false);
    swipeStartRef.current = null;

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const runDownloadWithFormat = async (kind: ChildExportKind, format: "csv" | "xlsx") => {
    setIsPending(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const filename = await downloadChildExportCsv({
        childId,
        childName,
        exportKind: kind,
        period,
        format,
      });
      setSuccessMessage(copy.success(filename));
    } catch (error) {
      console.error("Child CSV export failed", error);
      if (isShareCanceledError(error)) {
        setSuccessMessage(copy.cancelled);
        return;
      }
      setErrorMessage(copy.error);
    } finally {
      setIsPending(false);
    }
  };

  const runDownloadAll = async (format: "zip" | "xlsx" = "zip") => {
    setIsPending(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const filename = await downloadChildExportArchive({
        childId,
        childName,
        period,
        format,
      });
      setSuccessMessage(format === "xlsx" ? copy.successWorkbook(filename) : copy.successAll(filename));
    } catch (error) {
      console.error("Child CSV archive export failed", error);
      if (isShareCanceledError(error)) {
        setSuccessMessage(copy.cancelled);
        return;
      }
      setErrorMessage(copy.error);
    } finally {
      setIsPending(false);
    }
  };

  const runPrimaryAction = async (format: "csv" | "xlsx") => {
    const action = resolvePrimaryExportAction(selectedExport);
    if (action === "archive") {
      await runDownloadAll(format === "xlsx" ? "xlsx" : "zip");
      return;
    }
    await runDownloadWithFormat(selectedExport as ChildExportKind, format);
  };

  const handleSheetTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch || isPending) {
      return;
    }
    setIsSheetDismissAnimating(false);
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleSheetTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (isPending) {
      return;
    }
    const start = swipeStartRef.current;
    const touch = event.touches[0];
    if (!start || !touch) {
      return;
    }

    const deltaX = Math.abs(touch.clientX - start.x);
    const deltaY = touch.clientY - start.y;
    if (!shouldTrackExportSheetSwipe(deltaX, deltaY)) {
      return;
    }

    setSheetOffsetY(clampExportSheetOffset(deltaY));
  };

  const handleSheetTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (isPending) {
      swipeStartRef.current = null;
      return;
    }
    const start = swipeStartRef.current;
    const touch = event.changedTouches[0];
    swipeStartRef.current = null;
    if (!start || !touch) {
      return;
    }

    const deltaX = Math.abs(touch.clientX - start.x);
    const deltaY = touch.clientY - start.y;
    if (!shouldDismissExportSheetSwipe(deltaX, deltaY)) {
      setIsSheetDismissAnimating(true);
      setSheetOffsetY(0);
      return;
    }

    setIsSheetDismissAnimating(true);
    setSheetOffsetY(420);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setSheetOffsetY(0);
      setIsSheetDismissAnimating(false);
      onClose();
    }, 180);
  };

  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={isPending ? undefined : onClose}
      closeDisabled={isPending}
      placement="bottom"
      zIndexClassName="z-[190]"
      containerClassName="flex items-end"
      backdropAriaLabel={copy.backdrop}
      backdropClassName="bg-[rgba(15,23,42,0.34)]"
    >
      <div
        className="relative z-[1] w-full rounded-t-[30px] bg-background px-4 pb-[max(1.25rem,var(--app-safe-bottom-runtime,env(safe-area-inset-bottom)))] pt-4 shadow-[0_-24px_64px_rgba(15,23,42,0.24)] sm:mx-auto sm:max-w-xl"
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        onTouchEnd={handleSheetTouchEnd}
        style={{
          transform: `translateY(${sheetOffsetY}px)`,
          transition: isSheetDismissAnimating ? "transform 180ms ease-out" : "none",
        }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_16%,transparent)]" />
        <div className="space-y-1.5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
            {copy.eyebrow}
          </p>
          <h2 className="app-card-title text-[1.08rem] sm:text-[1.15rem]">{copy.title}</h2>
          <p className="text-sm leading-6 text-muted">{copy.description}</p>
        </div>

        <div className="mt-5 space-y-5">
          <section className="space-y-2">
            <p className="soft-field-label">{copy.kindLabel}</p>
            <div className="grid grid-cols-2 gap-2">
              {exportKinds.map((kind) => {
                const isActive = selectedExport === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    disabled={isPending}
                    onClick={() => setSelectedExport(kind)}
                    className={`${isActive ? childActionPrimaryClass : childActionSecondaryClass} min-h-[3.5rem] items-center justify-center text-center`}
                  >
                    <span className="block text-[0.84rem] font-bold leading-5">
                      {copy.kindOptions[kind]}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                disabled={isPending}
                onClick={() => setSelectedExport(allExportsOption)}
                className={`${
                  selectedExport === allExportsOption
                    ? childActionPrimaryClass
                    : childActionSecondaryClass
                } min-h-[3.5rem] items-center justify-center text-center`}
              >
                <span className="block text-[0.84rem] font-bold leading-5">
                  {copy.allExports.title}
                </span>
              </button>
            </div>
            <p className="rounded-[18px] bg-surface-muted/70 px-3.5 py-3 text-[0.76rem] leading-5 text-muted">
              {selectedExportDescription}
            </p>
          </section>

          <section className="space-y-2">
            <p className="soft-field-label">{copy.periodLabel}</p>
            <div className="grid grid-cols-2 gap-2">
              {exportPeriods.map((value) => {
                const isActive = period === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isPending}
                    onClick={() => setPeriod(value)}
                    className={isActive ? childActionPrimaryClass : childActionSecondaryClass}
                  >
                    {copy.periodOptions[value]}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {successMessage ? (
          <p className="mt-4 rounded-[20px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-700">
            {successMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-4 rounded-[20px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void runPrimaryAction("csv")}
            disabled={isPending}
            className={childActionSuccessClass}
          >
            {isPending
              ? selectedExport === allExportsOption
                ? copy.loadingAll
                : copy.loading
              : copy.saveCsv}
          </button>
          <button
            type="button"
            onClick={() => void runPrimaryAction("xlsx")}
            disabled={isPending}
            className={childActionPrimaryClass}
          >
            {isPending
              ? selectedExport === allExportsOption
                ? copy.loadingWorkbook
                : copy.loadingWorkbook
              : copy.saveXlsx}
          </button>
        </div>
      </div>
    </OverlayDialog>
  );
}

function getCopy(language: "ru" | "en") {
  if (language === "ru") {
    return {
      backdrop: "Закрыть экспорт данных",
      eyebrow: "Экспорт CSV",
      title: "Поделиться данными ребёнка",
      description: "Выберите, какие данные нужны и за какой период.",
      kindLabel: "Что открыть",
      periodLabel: "Период",
      saveCsv: "Сохранить CSV",
      saveXlsx: "Сохранить XLSX",
      loading: "Подготавливаем файл…",
      loadingAll: "Собираем архив…",
      loadingWorkbook: "Собираем XLSX…",
      cancelled: "Экспорт отменён.",
      error: "Не удалось открыть экспорт. Попробуйте ещё раз чуть позже.",
      success: (_filename: string) => "CSV готов.",
      successAll: (_filename: string) => "ZIP готов.",
      successWorkbook: (_filename: string) => "XLSX готов.",
      kindOptions: {
        analytics_summary: "Сводка",
        child_illness: "Болезни",
        child_care: "Уход",
      } satisfies Record<ChildExportKind, string>,
      kindOptionDescriptions: {
        analytics_summary: "Рост, вес, сон, кормления и общие показатели за период.",
        child_illness: "Температура, лекарства, комментарии и эпизоды болезни.",
        child_care: "Отдельные таблицы со сном, кормлениями, весом и ростом.",
      } satisfies Record<ChildExportKind, string>,
      allExports: {
        title: "Все файлы",
        description: "Сводка, болезни и уход одним ZIP-архивом.",
      },
      periodOptions: {
        two_weeks: "2 недели",
        month: "30 дней",
        half_year: "6 месяцев",
        all: "Всё время",
      } satisfies Record<ChildExportPeriod, string>,
    };
  }

  return {
    backdrop: "Close child export",
    eyebrow: "CSV Export",
    title: "Share child data",
    description: "Choose which data you need and for what period.",
    kindLabel: "What to open",
    periodLabel: "Period",
    saveCsv: "Save CSV",
    saveXlsx: "Save XLSX",
    loading: "Preparing file…",
    loadingAll: "Preparing archive…",
    loadingWorkbook: "Preparing XLSX…",
    cancelled: "Export cancelled.",
    error: "Could not open the export. Try again a bit later.",
    success: (_filename: string) => "CSV is ready.",
    successAll: (_filename: string) => "ZIP is ready.",
    successWorkbook: (_filename: string) => "XLSX is ready.",
    kindOptions: {
      analytics_summary: "Summary",
      child_illness: "Illness",
      child_care: "Care",
    } satisfies Record<ChildExportKind, string>,
    kindOptionDescriptions: {
      analytics_summary: "Growth, weight, sleep, feedings, and key metrics for the period.",
      child_illness: "Temperature, medicines, comments, and illness episodes.",
      child_care: "Separate tables for sleep, feedings, weight, and height.",
    } satisfies Record<ChildExportKind, string>,
    allExports: {
      title: "All files",
      description: "Summary, illness, and care in one ZIP archive.",
    },
    periodOptions: {
      two_weeks: "2 weeks",
      month: "30 days",
      half_year: "6 months",
      all: "All time",
    } satisfies Record<ChildExportPeriod, string>,
  };
}

function isShareCanceledError(error: unknown): boolean {
  return error instanceof Error && error.message === "Share canceled";
}

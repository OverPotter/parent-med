import { useState } from "react";
import { illnessCompactInputClass } from "./shared";

function InlineHint({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const showTouchHint = () => {
    setIsOpen(true);
    window.setTimeout(() => {
      setIsOpen(false);
    }, 1400);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        title={text}
        aria-label={text}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onTouchStart={(event) => {
          event.preventDefault();
          showTouchHint();
        }}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/70 bg-surface-muted/70 px-0 text-[11px] font-semibold leading-none text-muted transition hover:border-border hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
      >
        i
      </button>
      {isOpen && (
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-2xl border border-border/80 bg-[color:var(--color-surface-soft)] px-3 py-2 text-xs font-normal leading-5 text-foreground shadow-lg shadow-black/10">
          {text}
        </span>
      )}
    </span>
  );
}

export function MedicationDoseCalculationCard({
  language,
  show,
  childWeightSummaryLabel,
  latestWeightMeta,
  summaryDosePerKgLabel,
  formulaSummary,
  isOpen,
  onToggle,
  latestWeightValue,
  weightKg,
  doseMgPerKg,
  referenceDosePerKgValue,
  onWeightChange,
  onDosePerKgChange,
}: {
  language: "ru" | "en";
  show: boolean;
  childWeightSummaryLabel: string;
  latestWeightMeta: string | null;
  summaryDosePerKgLabel: string | null;
  formulaSummary: string | null;
  isOpen: boolean;
  onToggle: () => void;
  latestWeightValue: number | null;
  weightKg: string;
  doseMgPerKg: string;
  referenceDosePerKgValue: number | null;
  onWeightChange: (value: string) => void;
  onDosePerKgChange: (value: string) => void;
}) {
  if (!show) {
    return null;
  }

  return (
    <div className="soft-note-info min-w-0 overflow-hidden rounded-[22px] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.8rem] font-semibold tracking-[-0.02em] text-foreground">
            {language === "ru" ? "Расчёт дозы" : "Dose calculation"}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="soft-pill app-profile-action min-h-[2.2rem] shrink-0 self-start px-3 text-[0.76rem] whitespace-nowrap"
        >
          {isOpen
            ? language === "ru"
              ? "Скрыть расчёт"
              : "Hide"
            : language === "ru"
              ? "Изменить расчёт"
              : "Adjust"}
        </button>
      </div>
      <div className="mt-2 space-y-1.5 text-sm leading-6 text-foreground">
        {latestWeightMeta ? (
          <p className="leading-5 break-words">
            <span className="font-medium text-foreground/72">{childWeightSummaryLabel}:</span>{" "}
            {latestWeightMeta}
          </p>
        ) : null}
        {summaryDosePerKgLabel ? (
          <p className="leading-5 break-words">
            <span className="font-medium text-foreground/72">
              {language === "ru" ? "Дозировка" : "Dosage"}:
            </span>{" "}
            {summaryDosePerKgLabel}
          </p>
        ) : null}
        {formulaSummary ? (
          <p className="leading-5 break-words">
            <span className="font-medium text-foreground/72">
              {language === "ru" ? "Получается" : "Result"}:
            </span>{" "}
            {formulaSummary}
          </p>
        ) : null}
      </div>
      {isOpen ? (
        <div className="mt-3 grid gap-3 border-t border-border/50 pt-3 xl:grid-cols-2">
          <div>
            <label className="block space-y-1.5">
              <span className="flex items-center gap-2 soft-field-label">
                {language === "ru" ? "Вес ребёнка, кг" : "Weight used for the check, kg"}
                <InlineHint
                  text={
                    language === "ru"
                      ? "По умолчанию берём последний записанный вес ребёнка. Можно поправить его только для этого напоминания."
                      : "By default this uses the child's latest recorded weight. You can adjust it just for this reminder."
                  }
                />
              </span>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={weightKg}
                onChange={(event) => onWeightChange(event.target.value)}
                placeholder={
                  latestWeightValue !== null
                    ? String(latestWeightValue)
                    : language === "ru"
                      ? "Необязательно"
                      : "Optional"
                }
                className={illnessCompactInputClass}
              />
            </label>
          </div>

          <div>
            <label className="block space-y-1.5">
              <span className="flex items-center gap-2 soft-field-label">
                {language === "ru" ? "Сколько мг на 1 кг, мг/кг" : "Dose per 1 kg, mg/kg"}
                <InlineHint
                  text={
                    language === "ru"
                      ? "Если для препарата есть типовая дозировка на 1 кг, мы подставим её. При необходимости можно изменить."
                      : "If the medicine has a typical mg/kg reference, it will be filled in automatically. You can still change it manually."
                  }
                />
              </span>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={doseMgPerKg}
                onChange={(event) => onDosePerKgChange(event.target.value)}
                placeholder={
                  referenceDosePerKgValue !== null
                    ? String(referenceDosePerKgValue)
                    : language === "ru"
                      ? "Если нужен расчёт"
                      : "If you want a weight check"
                }
                className={illnessCompactInputClass}
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

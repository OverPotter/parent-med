import { useState } from "react";
import { DateField } from "@shared/components/DateField";
import { useI18n } from "@shared/hooks/useI18n";
import { getLocalIsoDate } from "@shared/utils/date";
import {
  illnessCompactInputClass,
  illnessCompactPrimaryButtonClass,
  illnessCompactSecondaryButtonClass,
} from "./shared";

export function EpisodeActivationCard({
  isPending,
  errorMessage,
  onActivate,
  onCancel,
}: {
  isPending: boolean;
  errorMessage: string | null;
  onActivate: (payload: {
    started_at: string;
    title?: string | null;
    medication_mode: string;
    note?: string | null;
    temperatures: Array<{ value_celsius: number }>;
    administrations: Array<{
      household_medicine_id?: string | null;
      custom_medicine_name?: string | null;
      amount: string;
    }>;
    comments: Array<{ text: string }>;
    medication_plans: Array<{
      household_medicine_id?: string | null;
      custom_medicine_name?: string | null;
      dose_amount: string;
      min_interval_minutes: number;
      max_doses_per_day?: number | null;
      weight_kg?: number | null;
      dose_mg_per_kg?: number | null;
      notes?: string | null;
    }>;
  }) => void;
  onCancel: () => void;
}) {
  const { language } = useI18n();
  const [startedAt, setStartedAt] = useState(() => getLocalIsoDate());
  const [title, setTitle] = useState("");

  return (
    <div className="soft-panel rounded-[30px]">
      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        {errorMessage && (
          <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">{errorMessage}</div>
        )}
        <label className="block space-y-1.5">
          <span className="soft-field-label">
            {language === "ru" ? "Дата начала" : "Start date"}
          </span>
          <DateField
            value={startedAt}
            onChange={setStartedAt}
            language={language}
            max={getLocalIsoDate()}
            className=""
          />
        </label>
        <label className="block space-y-1.5">
          <span className="soft-field-label">
            {language === "ru" ? "Что случилось?" : "What happened?"}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              language === "ru" ? "Например: температура и кашель" : "Example: fever and cough"
            }
            className={illnessCompactInputClass}
          />
        </label>
        <div className="border-t border-border/60 pt-4 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          <button
            type="button"
            onClick={() =>
              onActivate({
                started_at: startedAt,
                title: title.trim() ? title.trim() : null,
                medication_mode: "guided",
                note: null,
                temperatures: [],
                administrations: [],
                comments: [],
                medication_plans: [],
              })
            }
            disabled={isPending || !startedAt}
            className={`${illnessCompactPrimaryButtonClass} w-full sm:w-auto`}
          >
            {isPending
              ? language === "ru"
                ? "Запускаем…"
                : "Starting…"
              : language === "ru"
                ? "Начать наблюдение"
                : "Start tracking"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className={`${illnessCompactSecondaryButtonClass} mt-2 w-full sm:mt-0 sm:w-auto`}
          >
            {language === "ru" ? "Назад" : "Back"}
          </button>
        </div>
      </div>
    </div>
  );
}

const illnessTemperatureInputClass =
  "soft-input illness-fast-input !min-h-[2.68rem] w-full px-4 py-0 text-left text-[16px] leading-[1.15] placeholder:text-left sm:!min-h-[2.76rem]";
const illnessTemperatureButtonClass = `${illnessCompactPrimaryButtonClass} min-h-[2.82rem] px-4 shadow-[0_14px_30px_rgba(15,23,42,0.14)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_34px_rgba(15,23,42,0.18)] sm:min-h-[2.92rem]`;
const illnessAdministrationButtonClass = `${illnessCompactPrimaryButtonClass} min-h-[2.82rem] px-4 shadow-[0_14px_30px_rgba(15,23,42,0.14)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_34px_rgba(15,23,42,0.18)] sm:min-h-[2.92rem]`;
export const illnessCompactTextareaClass =
  "soft-input min-h-[7.5rem] w-full px-4 py-3 text-left text-[16px] leading-6 placeholder:text-left";

export function TemperatureForm({
  value,
  onChange,
  onSubmit,
  isPending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { language } = useI18n();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
      <label className="block min-w-0 space-y-1.5">
        <span className="soft-field-label">
          {language === "ru" ? "Температура" : "Temperature"}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={language === "ru" ? "36.6" : "98.6 / 37.0"}
          className={illnessTemperatureInputClass}
        />
      </label>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending || !value}
        className={`${illnessTemperatureButtonClass} shrink-0 whitespace-nowrap`}
      >
        {isPending
          ? language === "ru"
            ? "Сохраняем…"
            : "Saving…"
          : language === "ru"
            ? "Добавить"
            : "Add"}
      </button>
    </div>
  );
}

export function AdministrationForm({
  customMedicineName,
  amount,
  onCustomMedicineNameChange,
  onAmountChange,
  onSubmit,
  isPending,
}: {
  customMedicineName: string;
  amount: string;
  onCustomMedicineNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { language } = useI18n();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.18fr)_minmax(0,0.88fr)_10.25rem] md:items-end">
        <label className="block min-w-0 space-y-1.5">
          <span className="soft-field-label">
            {language === "ru" ? "Что дали" : "What was given"}
          </span>
          <input
            type="text"
            value={customMedicineName}
            onChange={(e) => onCustomMedicineNameChange(e.target.value)}
            placeholder={language === "ru" ? "Например: Уголь" : "Example: charcoal"}
            className={`${illnessCompactInputClass} illness-fast-input`}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="soft-field-label">
            {language === "ru" ? "Сколько дали, если нужно" : "Dose given, if needed"}
          </span>
          <input
            type="text"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={language === "ru" ? "Например: 5 мл или 1 таб." : "Example: 5 ml or 1 tab"}
            className={`${illnessCompactInputClass} illness-fast-input`}
          />
        </label>
      </div>
      <div className="border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || !customMedicineName.trim()}
          className={`${illnessAdministrationButtonClass} w-full md:w-auto`}
        >
          {isPending
            ? language === "ru"
              ? "Сохраняем…"
              : "Saving…"
            : language === "ru"
              ? "Сохранить приём"
              : "Log dose"}
        </button>
      </div>
    </div>
  );
}

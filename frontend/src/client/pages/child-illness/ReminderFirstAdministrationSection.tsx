import { DateField } from "@shared/components/DateField";
import { finalizeTimeInput, normalizeTimeInput } from "@client/utils/feedingRecordForm";
import { getLocalIsoDate } from "@shared/utils/date";
import {
  appBtnSecondaryClass,
  illnessPanelSoftClass,
} from "./shared";
import { reminderModeButtonClass } from "./reminderUtils";

export function ReminderFirstAdministrationSection({
  language,
  firstDoseStatus,
  firstDoseDate,
  firstDoseTime,
  hasFutureFirstDoseSelection,
  onStatusChange,
  onDateChange,
  onTimeChange,
}: {
  language: "ru" | "en";
  firstDoseStatus: "already_given" | "not_given";
  firstDoseDate: string;
  firstDoseTime: string;
  hasFutureFirstDoseSelection: boolean;
  onStatusChange: (value: "already_given" | "not_given") => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}) {
  return (
    <section className={`${illnessPanelSoftClass} rounded-[28px] p-4 sm:p-5`}>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="soft-field-label">
            {language === "ru" ? "Лекарство уже давали?" : "Has the medicine already been given?"}
          </p>
          <p className="text-sm leading-6 text-muted">
            {language === "ru"
              ? "Это нужно, чтобы правильно посчитать первое напоминание и не предложить приём слишком рано или слишком поздно."
              : "This helps calculate the first reminder correctly and avoids suggesting the medicine too early or too late."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onStatusChange("already_given")}
            className={reminderModeButtonClass(
              firstDoseStatus === "already_given",
              appBtnSecondaryClass
            )}
          >
            {language === "ru" ? "Да, уже давали" : "Yes, already given"}
          </button>
          <button
            type="button"
            onClick={() => onStatusChange("not_given")}
            className={reminderModeButtonClass(
              firstDoseStatus === "not_given",
              appBtnSecondaryClass
            )}
          >
            {language === "ru" ? "Нет, ещё не давали" : "No, not yet"}
          </button>
        </div>

        {firstDoseStatus === "already_given" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="soft-field-label">
                  {language === "ru" ? "Когда давали" : "When was it given"}
                </span>
                <DateField
                  value={firstDoseDate}
                  onChange={onDateChange}
                  language={language}
                  max={getLocalIsoDate()}
                  allowClear={false}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="soft-field-label">
                  {language === "ru" ? "Во сколько" : "Time"}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={firstDoseTime}
                  onChange={(event) => onTimeChange(normalizeTimeInput(event.target.value))}
                  onBlur={() => onTimeChange(finalizeTimeInput(firstDoseTime))}
                  placeholder="08:30"
                  className="soft-input min-h-[3.15rem] w-full px-4 text-center text-[1.02rem] font-semibold tracking-[-0.03em] text-foreground placeholder:text-muted tabular-nums sm:text-[1.12rem]"
                />
              </label>
            </div>
            <p className="rounded-2xl bg-[color:color-mix(in_srgb,var(--color-surface-soft)_84%,transparent)] px-3 py-2.5 text-xs leading-5 text-muted">
              {language === "ru"
                ? "Мы считаем следующее напоминание от этого времени. Например, если лекарство дали в 18:10, а интервал 6 часов, напомним примерно в 00:10."
                : "The next reminder will be counted from this time. For example, if the medicine was given at 6:10 PM and the interval is 6 hours, the reminder will appear around 12:10 AM."}
            </p>
          </>
        ) : (
          <p className="rounded-2xl bg-[color:color-mix(in_srgb,var(--color-surface-soft)_84%,transparent)] px-3 py-2.5 text-xs leading-5 text-muted">
            {language === "ru"
              ? "Если лекарство ещё не давали, первое напоминание пойдёт от момента сохранения. Например, если сохранить напоминание сейчас с интервалом 6 часов, оно сработает примерно через 6 часов."
              : "If the medicine has not been given yet, the first reminder will start from the moment you save it. For example, if you save a 6-hour reminder now, it will trigger in about 6 hours."}
          </p>
        )}

        {hasFutureFirstDoseSelection ? (
          <p className="soft-note-danger rounded-2xl px-3 py-2.5 text-xs leading-5">
            {language === "ru"
              ? "Нельзя указать время приёма в будущем. Выберите текущее время или раньше."
              : "You cannot set the administration time in the future. Choose the current time or earlier."}
          </p>
        ) : null}
      </div>
    </section>
  );
}

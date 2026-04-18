import { Surface } from "@shared/components/Surface";
import type { AppLanguage } from "@shared/i18n";
import { tSettings } from "./copy";

export function SettingsNotificationsSection({
  language,
  isPushEnabled,
  pushError,
  isNativePushBlocked,
  isPushConfigLoading,
  pushConfigEnabled,
  isGlobalPushSwitchDisabled,
  onGlobalPushSwitchToggle,
  onOpenSystemSettingsDialog,
  childrenEarlyReminderEnabled,
  pillboxEarlyReminderEnabled,
  cabinetEarlyReminderEnabled,
  selectedReminderMinutes,
  selectedPillboxReminderMinutes,
  selectedCabinetReminderDays,
  isPushPreferencesLoading,
  isUpdatePending,
  onChildrenToggle,
  onPillboxToggle,
  onCabinetToggle,
  onChildrenMinutesChange,
  onPillboxMinutesChange,
  onCabinetReminderSelect,
}: {
  language: AppLanguage;
  isPushEnabled: boolean;
  pushError: string | null;
  isNativePushBlocked: boolean;
  isPushConfigLoading: boolean;
  pushConfigEnabled?: boolean;
  isGlobalPushSwitchDisabled: boolean;
  onGlobalPushSwitchToggle: () => void;
  onOpenSystemSettingsDialog: () => void;
  childrenEarlyReminderEnabled: boolean;
  pillboxEarlyReminderEnabled: boolean;
  cabinetEarlyReminderEnabled: boolean;
  selectedReminderMinutes: string;
  selectedPillboxReminderMinutes: string;
  selectedCabinetReminderDays: 10 | 7 | 3 | null;
  isPushPreferencesLoading: boolean;
  isUpdatePending: boolean;
  onChildrenToggle: (enabled: boolean) => void;
  onPillboxToggle: (enabled: boolean) => void;
  onCabinetToggle: (enabled: boolean) => void;
  onChildrenMinutesChange: (value: string) => void;
  onPillboxMinutesChange: (value: string) => void;
  onCabinetReminderSelect: (days: 10 | 7 | 3) => void;
}) {
  return (
    <Surface className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="app-card-title">{tSettings(language, "notifications")}</p>
          <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full border text-[0.68rem] font-semibold ${
              isPushEnabled
                ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                : "border-amber-500/40 bg-amber-500/20 text-amber-700 dark:text-amber-300"
            }`}
          >
            {isPushEnabled ? "✓" : "✕"}
          </span>
          <span
            className={`text-xs ${isPushEnabled ? "text-muted" : "text-amber-700 dark:text-amber-300"}`}
          >
            {isPushEnabled
              ? tSettings(language, "notificationsStatusOn")
              : tSettings(language, "notificationsStatusOff")}
          </span>
        </div>
        <button
          type="button"
          onClick={onGlobalPushSwitchToggle}
          disabled={isGlobalPushSwitchDisabled}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
            isPushEnabled
              ? "border-emerald-500/45 bg-emerald-500/25"
              : "border-amber-500/45 bg-amber-500/20"
          } disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={
            isPushEnabled
              ? tSettings(language, "disableNotifications")
              : tSettings(language, "enableNotifications")
          }
        >
          <span
            className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[0.7rem] shadow-sm transition-transform dark:bg-slate-100 ${
              isPushEnabled ? "translate-x-6 text-emerald-600" : "translate-x-1 text-amber-700"
            }`}
          >
            {isPushEnabled ? "✓" : "✕"}
          </span>
        </button>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted">
        {tSettings(language, "notificationsHint")}
      </p>
      {pushError ? (
        <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">{pushError}</div>
      ) : null}
      {isNativePushBlocked && !pushError ? (
        <div className="soft-note-warning mt-4 space-y-3 rounded-2xl px-4 py-3 text-sm">
          <p className="font-semibold text-foreground">
            {tSettings(language, "nativePermissionBlockedTitle")}
          </p>
          <p className="leading-6 text-muted">
            {tSettings(language, "nativePermissionBlockedDescription")}
          </p>
          <button
            type="button"
            onClick={onOpenSystemSettingsDialog}
            className="soft-button-secondary inline-flex min-h-[2.55rem] items-center justify-center px-4 text-[0.84rem]"
          >
            {tSettings(language, "openSystemSettings")}
          </button>
        </div>
      ) : null}
      {!isPushConfigLoading && pushConfigEnabled === false ? (
        <div className="soft-note-warning mt-4 rounded-2xl px-4 py-3 text-sm">
          {tSettings(language, "pushServerMissing")}
        </div>
      ) : null}
      {isPushEnabled ? (
        <div className="mt-5 border-t border-border/70 pt-4">
          <ReminderCard
            language={language}
            title={tSettings(language, "childrenReminders")}
            hint={tSettings(language, "childrenRemindersSoftText")}
            enabled={childrenEarlyReminderEnabled}
            disabled={isPushPreferencesLoading || isUpdatePending}
            selectedValue={selectedReminderMinutes}
            onToggle={onChildrenToggle}
            options={[5, 10, 15].map((minutes) => ({
              key: String(minutes),
              label: `${minutes} ${tSettings(language, "minShort")}`,
            }))}
            onOptionSelect={onChildrenMinutesChange}
          />
          <ReminderCard
            language={language}
            title={tSettings(language, "pillboxReminders")}
            hint={tSettings(language, "pillboxRemindersSoftText")}
            enabled={pillboxEarlyReminderEnabled}
            disabled={isPushPreferencesLoading || isUpdatePending}
            selectedValue={selectedPillboxReminderMinutes}
            onToggle={onPillboxToggle}
            options={[5, 10, 15].map((minutes) => ({
              key: String(minutes),
              label: `${minutes} ${tSettings(language, "minShort")}`,
            }))}
            onOptionSelect={onPillboxMinutesChange}
          />
        </div>
      ) : null}
      {isPushEnabled ? (
        <div className="mt-5 border-t border-border/70 pt-4">
          <ReminderCard
            language={language}
            title={tSettings(language, "cabinetReminders")}
            hint={tSettings(language, "cabinetRemindersSoftText")}
            enabled={cabinetEarlyReminderEnabled}
            disabled={isPushPreferencesLoading || isUpdatePending}
            selectedValue={selectedCabinetReminderDays ? String(selectedCabinetReminderDays) : ""}
            onToggle={onCabinetToggle}
            options={[
              { key: "10", label: tSettings(language, "days10") },
              { key: "7", label: tSettings(language, "days7") },
              { key: "3", label: tSettings(language, "days3") },
            ]}
            onOptionSelect={(value) => onCabinetReminderSelect(Number(value) as 10 | 7 | 3)}
          />
        </div>
      ) : null}
    </Surface>
  );
}

function ReminderCard({
  language,
  title,
  hint,
  enabled,
  disabled,
  selectedValue,
  onToggle,
  options,
  onOptionSelect,
}: {
  language: AppLanguage;
  title: string;
  hint: string;
  enabled: boolean;
  disabled: boolean;
  selectedValue: string;
  onToggle: (enabled: boolean) => void;
  options: Array<{ key: string; label: string }>;
  onOptionSelect: (value: string) => void;
}) {
  return (
    <div className="soft-card mt-3 rounded-[20px] border border-border/70 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          disabled={disabled}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
            enabled ? "border-emerald-500/45 bg-emerald-500/25" : "border-border bg-card-muted"
          } disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={
            enabled ? tSettings(language, "reminderOff") : tSettings(language, "reminderOn")
          }
        >
          <span
            className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[0.7rem] shadow-sm transition-transform dark:bg-slate-100 ${
              enabled ? "translate-x-6 text-emerald-600" : "translate-x-1 text-slate-500"
            }`}
          >
            {enabled ? "✓" : "✕"}
          </span>
        </button>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{hint}</p>
      {enabled ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onOptionSelect(option.key)}
              disabled={disabled}
              className={`${
                selectedValue === option.key ? "soft-tab-active" : "soft-tab"
              } inline-flex min-h-[2.6rem] items-center justify-center px-3.5 text-[0.82rem] tracking-[-0.02em] disabled:opacity-50`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

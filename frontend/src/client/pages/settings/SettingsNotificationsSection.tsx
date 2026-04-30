import type { AppLanguage } from "@shared/i18n";
import { childActionSecondaryClass } from "../children/shared";
import { tSettings } from "./copy";
import { SettingsChoiceGroup, SettingsRow, SettingsSection } from "./ui";

export function SettingsNotificationsSection({
  language,
  isPushEnabled,
  pushError,
  showTestPushAction,
  testPushStatus,
  isTestPushPending,
  isNativePushBlocked,
  isPushConfigLoading,
  pushConfigEnabled,
  isGlobalPushSwitchDisabled,
  onGlobalPushSwitchToggle,
  onSendTestPush,
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
  showTestPushAction: boolean;
  testPushStatus: string | null;
  isTestPushPending: boolean;
  isNativePushBlocked: boolean;
  isPushConfigLoading: boolean;
  pushConfigEnabled?: boolean;
  isGlobalPushSwitchDisabled: boolean;
  onGlobalPushSwitchToggle: () => void;
  onSendTestPush: () => void;
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
    <SettingsSection
      title={tSettings(language, "notifications")}
      hint={tSettings(language, "notificationsHint")}
      badge={
        <div className="pt-0.5">
          <SettingsToggleSwitch
            language={language}
            enabled={isPushEnabled}
            disabled={isGlobalPushSwitchDisabled}
            onChange={(enabled) => {
              if (enabled === isPushEnabled) {
                return;
              }
              onGlobalPushSwitchToggle();
            }}
          />
        </div>
      }
    >
      {pushError ? (
        <div className="soft-note-danger mx-4 mt-1 rounded-2xl px-4 py-3 text-sm">{pushError}</div>
      ) : null}
      {isNativePushBlocked && !pushError ? (
        <div className="soft-note-warning mx-4 mt-1 space-y-3 rounded-2xl px-4 py-3 text-sm">
          <p className="font-semibold text-foreground">
            {tSettings(language, "nativePermissionBlockedTitle")}
          </p>
          <p className="leading-6 text-muted">
            {tSettings(language, "nativePermissionBlockedDescription")}
          </p>
          <button
            type="button"
            onClick={onOpenSystemSettingsDialog}
            className={`${childActionSecondaryClass} min-h-[2.6rem] px-4 text-[0.84rem]`}
          >
            {tSettings(language, "openSystemSettings")}
          </button>
        </div>
      ) : null}
      {!isPushConfigLoading && pushConfigEnabled === false ? (
        <div className="soft-note-warning mx-4 mt-1 rounded-2xl px-4 py-3 text-sm">
          {tSettings(language, "pushServerMissing")}
        </div>
      ) : null}
      {showTestPushAction ? (
        <SettingsRow
          separated={isPushEnabled}
          align="start"
          actions={
            <div className="w-full">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {tSettings(language, "testPushTitle")}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {tSettings(language, "testPushHint")}
                  </p>
                  {testPushStatus ? (
                    <p className="mt-2 text-sm leading-6 text-muted">{testPushStatus}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onSendTestPush}
                  disabled={isTestPushPending || !isPushEnabled}
                  className={`${childActionSecondaryClass} min-h-[2.6rem] px-4 text-[0.84rem] disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isTestPushPending ? tSettings(language, "saving") : tSettings(language, "testPushTitle")}
                </button>
              </div>
            </div>
          }
        />
      ) : null}
      {isPushEnabled ? (
        <>
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
            separated
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
            separated
          />
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
            separated
          />
        </>
      ) : null}
    </SettingsSection>
  );
}

function SettingsToggleSwitch({
  language,
  enabled,
  disabled,
  onChange,
}: {
  language: AppLanguage;
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
        enabled ? "border-emerald-500/45 bg-emerald-500/25" : "border-border bg-card-muted"
      } disabled:cursor-not-allowed disabled:opacity-60`}
      aria-label={
        enabled
          ? tSettings(language, "disableNotifications")
          : tSettings(language, "enableNotifications")
      }
      aria-pressed={enabled}
    >
      <span
        className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[0.7rem] shadow-sm transition-transform dark:bg-slate-100 ${
          enabled ? "translate-x-6 text-emerald-600" : "translate-x-1 text-slate-500"
        }`}
      >
        {enabled ? "✓" : "✕"}
      </span>
    </button>
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
  separated = false,
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
  separated?: boolean;
}) {
  return (
    <SettingsRow
      separated={separated}
      align="start"
      actions={
        <div className="w-full">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{hint}</p>
            </div>
            <div className="shrink-0">
              <SettingsToggleSwitch
                language={language}
                enabled={enabled}
                disabled={disabled}
                onChange={onToggle}
              />
            </div>
          </div>
          {enabled ? (
            <SettingsChoiceGroup
              className="mt-3 sm:max-w-[18rem] sm:justify-end"
              value={selectedValue}
              disabled={disabled}
              onChange={onOptionSelect}
              options={options.map((option) => ({
                value: option.key,
                label: option.label,
              }))}
            />
          ) : null}
        </div>
      }
    />
  );
}

import type { AppLanguage } from "@shared/i18n";
import { SettingsRow, SettingsSection } from "./ui";
import { tSettings } from "./copy";

export function SettingsLiveActivitiesSection({
  language,
  isIos,
  sleepEnabled,
  feedingEnabled,
  disabled = false,
  onSleepToggle,
  onFeedingToggle,
}: {
  language: AppLanguage;
  isIos: boolean;
  sleepEnabled: boolean;
  feedingEnabled: boolean;
  disabled?: boolean;
  onSleepToggle: (enabled: boolean) => void;
  onFeedingToggle: (enabled: boolean) => void;
}) {
  return (
    <SettingsSection
      title={tSettings(language, "liveActivities")}
      hint={tSettings(language, "liveActivitiesHint")}
    >
      <LiveActivityPreferenceRow
        title={tSettings(language, "liveActivitiesSleep")}
        hint={tSettings(language, "liveActivitiesSleepHint")}
        enabled={sleepEnabled}
        disabled={disabled}
        onToggle={onSleepToggle}
      />
      <LiveActivityPreferenceRow
        title={tSettings(language, "liveActivitiesFeeding")}
        hint={tSettings(language, "liveActivitiesFeedingHint")}
        enabled={feedingEnabled}
        disabled={disabled}
        onToggle={onFeedingToggle}
        separated
      />

      <div className="mx-4 mt-4 rounded-[24px] border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(244,247,255,0.88))] p-3.5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(19,26,44,0.94),rgba(12,18,31,0.9))]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted">
              {tSettings(language, "liveActivitiesPreviewLabel")}
            </p>
            <p className="mt-1 text-sm text-muted">{tSettings(language, "liveActivitiesAppleOnly")}</p>
          </div>
          <div className="rounded-full border border-black/5 bg-black px-3 py-1 text-[0.72rem] font-semibold text-white dark:border-white/10 dark:bg-white dark:text-slate-950">
            iPhone
          </div>
        </div>

        <div className="rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%),linear-gradient(180deg,#101828,#0f172a)] p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="mx-auto flex h-[1.875rem] w-28 items-center justify-center rounded-full border border-white/10 bg-black/70 text-[0.68rem] font-medium tracking-[0.08em] text-white/72">
            Dynamic Island
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <LiveActivityPreviewCard
              title={tSettings(language, "liveActivitiesSleepPreviewTitle")}
              timer="00:43"
              status={tSettings(language, "liveActivitiesSleepPreviewStatus")}
              accentClassName="from-sky-400/90 via-cyan-300/85 to-teal-300/90"
              accentSurfaceClassName="bg-cyan-300/12 text-cyan-100 border-cyan-200/15"
              iconName="moon.stars.fill"
              enabled={sleepEnabled}
              muted={!isIos}
              language={language}
            />
            <LiveActivityPreviewCard
              title={tSettings(language, "liveActivitiesFeedingPreviewTitle")}
              timer="00:12"
              status={tSettings(language, "liveActivitiesFeedingPreviewStatus")}
              accentClassName="from-violet-300/95 via-fuchsia-300/90 to-indigo-300/90"
              accentSurfaceClassName="bg-violet-300/12 text-violet-100 border-violet-200/15"
              iconName="drop.fill"
              enabled={feedingEnabled}
              muted={!isIos}
              language={language}
            />
          </div>
        </div>
      </div>

    </SettingsSection>
  );
}

function LiveActivityPreferenceRow({
  title,
  hint,
  enabled,
  disabled,
  onToggle,
  separated = false,
}: {
  title: string;
  hint: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: (enabled: boolean) => void;
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
                enabled={enabled}
                disabled={disabled}
                onChange={onToggle}
                ariaLabel={title}
              />
            </div>
          </div>
        </div>
      }
    />
  );
}

function SettingsToggleSwitch({
  enabled,
  disabled,
  onChange,
  ariaLabel,
}: {
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
        enabled ? "border-emerald-500/45 bg-emerald-500/25" : "border-border bg-card-muted"
      } disabled:cursor-not-allowed disabled:opacity-60`}
      aria-label={ariaLabel}
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

function LiveActivityPreviewCard({
  language,
  title,
  timer,
  status,
  accentClassName,
  accentSurfaceClassName,
  iconName,
  enabled,
  muted,
}: {
  language: AppLanguage;
  title: string;
  timer: string;
  status: string;
  accentClassName: string;
  accentSurfaceClassName: string;
  iconName: string;
  enabled: boolean;
  muted: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm transition-opacity ${
        enabled && !muted ? "opacity-100" : "opacity-55"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-[2.625rem] w-[2.625rem] shrink-0 items-center justify-center rounded-[14px] border ${accentSurfaceClassName}`}
          >
            <span className="sr-only">{title}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-[1.05rem] w-[1.05rem] fill-current text-white/90"
            >
              {iconName === "moon.stars.fill" ? (
                <path d="M21 12.79A9 9 0 0 1 11.21 3c0-.45.05-.89.13-1.32A1 1 0 0 0 10.08.57 10 10 0 1 0 23.43 13.92a1 1 0 0 0-1.11-1.26c-.43.08-.87.13-1.32.13Z" />
              ) : (
                <path d="M12 2.75c2.97 3.42 5.25 6.27 5.25 9.05A5.25 5.25 0 1 1 6.75 11.8c0-2.78 2.28-5.63 5.25-9.05Z" />
              )}
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 truncate text-[0.8rem] font-medium text-white/70">{status}</p>
          </div>
        </div>
      </div>
      <div className="mt-3.5 flex items-end justify-between gap-3">
        <p className="text-[1.65rem] font-semibold tracking-[-0.045em] text-white">{timer}</p>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-br ${accentClassName}`} />
          <span className="text-[0.72rem] font-medium text-white/66">
            {language === "ru" ? "сейчас" : "now"}
          </span>
        </div>
      </div>
      <div className="mt-2.5 space-y-1 text-[0.76rem] leading-5 text-white/72">
        <p>{tSettings(language, "liveActivitiesPreviewFromLockScreen")}</p>
        <p className="text-white/58">{tSettings(language, "liveActivitiesPreviewManageInApp")}</p>
      </div>
    </div>
  );
}

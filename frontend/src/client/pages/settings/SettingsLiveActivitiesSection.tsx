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

      <div className="mx-4 mt-4">
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

        <div className="grid gap-2.5 sm:grid-cols-2">
          <LiveActivityPreviewCard
            title={tSettings(language, "liveActivitiesSleepPreviewTitle")}
            timer="00:43"
            status={tSettings(language, "liveActivitiesSleepPreviewStatus")}
            accentClassName="from-[#61E0FA] via-[#61E0FA] to-[#61E0FA]"
            accentSurfaceClassName="bg-[#61E0FA]/16 text-[#61E0FA] border-[#61E0FA]/14"
            surfaceClassName="border-white/[0.09] bg-[linear-gradient(135deg,rgb(18,28,48),rgb(10,36,56),rgb(5,20,36))] shadow-[0_18px_36px_rgba(15,23,42,0.16)]"
            iconName="moon.stars.fill"
            enabled={sleepEnabled}
            muted={!isIos}
            language={language}
          />
          <LiveActivityPreviewCard
            title={tSettings(language, "liveActivitiesFeedingPreviewTitle")}
            timer="00:12"
            status={tSettings(language, "liveActivitiesFeedingPreviewStatus")}
            accentClassName="from-[#B394FA] via-[#B394FA] to-[#B394FA]"
            accentSurfaceClassName="bg-[#B394FA]/16 text-[#B394FA] border-[#B394FA]/14"
            surfaceClassName="border-white/[0.09] bg-[linear-gradient(135deg,rgb(33,23,51),rgb(46,28,77),rgb(23,15,41))] shadow-[0_18px_36px_rgba(15,23,42,0.16)]"
            iconName="drop.fill"
            enabled={feedingEnabled}
            muted={!isIos}
            language={language}
          />
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
  surfaceClassName,
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
  surfaceClassName: string;
  iconName: string;
  enabled: boolean;
  muted: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] border px-3 py-3 backdrop-blur-sm transition-opacity ${surfaceClassName} ${
        enabled && !muted ? "opacity-100" : "opacity-55"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-[2.625rem] w-[2.625rem] shrink-0 items-center justify-center rounded-[14px] border ${accentSurfaceClassName}`}
        >
          <span className="sr-only">{title}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-[0.95rem] w-[0.95rem] fill-current text-white/90"
          >
            {iconName === "moon.stars.fill" ? (
              <path d="M21 12.79A9 9 0 0 1 11.21 3c0-.45.05-.89.13-1.32A1 1 0 0 0 10.08.57 10 10 0 1 0 23.43 13.92a1 1 0 0 0-1.11-1.26c-.43.08-.87.13-1.32.13Z" />
            ) : (
              <path d="M12 2.75c2.97 3.42 5.25 6.27 5.25 9.05A5.25 5.25 0 1 1 6.75 11.8c0-2.78 2.28-5.63 5.25-9.05Z" />
            )}
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-white">
              {title}
            </p>
            <p className="shrink-0 text-[1.1rem] font-semibold tracking-[-0.04em] text-white">
              {timer}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-br ${accentClassName}`} />
            <p className="truncate text-[0.78rem] font-medium text-white/78">
              {status}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="text-[0.72rem] leading-5 text-white/72">
          {tSettings(language, "liveActivitiesPreviewFromLockScreen")}
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/15 px-3 py-1 text-[0.72rem] font-semibold text-white">
          {language === "ru" ? "Открыть" : "Open"}
        </span>
      </div>
    </div>
  );
}

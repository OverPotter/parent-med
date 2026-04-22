import type { AppLanguage } from "@shared/i18n";
import { SettingsRow, SettingsSection } from "./ui";
import { tSettings } from "./copy";

export function SettingsLiveActivitiesSection({
  language,
  isIos,
  sleepEnabled,
  feedingEnabled,
  illnessEnabled,
  disabled = false,
  onSleepToggle,
  onFeedingToggle,
  onIllnessToggle,
}: {
  language: AppLanguage;
  isIos: boolean;
  sleepEnabled: boolean;
  feedingEnabled: boolean;
  illnessEnabled: boolean;
  disabled?: boolean;
  onSleepToggle: (enabled: boolean) => void;
  onFeedingToggle: (enabled: boolean) => void;
  onIllnessToggle: (enabled: boolean) => void;
}) {
  const preferenceRows = [
    {
      key: "sleep",
      title: tSettings(language, "liveActivitiesSleep"),
      hint: tSettings(language, "liveActivitiesSleepHint"),
      enabled: sleepEnabled,
      onToggle: onSleepToggle,
    },
    {
      key: "feeding",
      title: tSettings(language, "liveActivitiesFeeding"),
      hint: tSettings(language, "liveActivitiesFeedingHint"),
      enabled: feedingEnabled,
      onToggle: onFeedingToggle,
    },
    {
      key: "illness",
      title: tSettings(language, "liveActivitiesIllness"),
      hint: tSettings(language, "liveActivitiesIllnessHint"),
      enabled: illnessEnabled,
      onToggle: onIllnessToggle,
    },
  ] as const;

  const previewCards = [
    {
      key: "sleep",
      title: tSettings(language, "liveActivitiesSleepPreviewTitle"),
      timer: "00:43",
      status: tSettings(language, "liveActivitiesSleepPreviewStatus"),
      accentClassName: "from-[#748DD1] via-[#748DD1] to-[#748DD1]",
      accentSurfaceClassName: "bg-[#748DD1]/16 text-[#748DD1] border-[#748DD1]/14",
      surfaceClassName:
        "border-white/[0.09] bg-[linear-gradient(135deg,rgb(36,46,79),rgb(46,60,102),rgb(30,39,69))] shadow-[0_18px_36px_rgba(15,23,42,0.16)]",
      iconName: "moon.stars.fill",
      enabled: sleepEnabled,
    },
    {
      key: "feeding",
      title: tSettings(language, "liveActivitiesFeedingPreviewTitle"),
      timer: "00:12",
      status: tSettings(language, "liveActivitiesFeedingPreviewStatus"),
      accentClassName: "from-[#BE6787] via-[#BE6787] to-[#BE6787]",
      accentSurfaceClassName: "bg-[#BE6787]/16 text-[#BE6787] border-[#BE6787]/14",
      surfaceClassName:
        "border-white/[0.09] bg-[linear-gradient(135deg,rgb(67,33,61),rgb(87,41,76),rgb(54,27,49))] shadow-[0_18px_36px_rgba(15,23,42,0.16)]",
      iconName: "drop.fill",
      enabled: feedingEnabled,
    },
    {
      key: "illness",
      title: tSettings(language, "liveActivitiesIllnessPreviewTitle"),
      timer: language === "ru" ? "2 дн" : "2 d",
      status: tSettings(language, "liveActivitiesIllnessPreviewStatus"),
      accentClassName: "from-[#8A7BBF] via-[#8A7BBF] to-[#8A7BBF]",
      accentSurfaceClassName: "bg-[#8A7BBF]/16 text-[#8A7BBF] border-[#8A7BBF]/14",
      surfaceClassName:
        "border-white/[0.09] bg-[linear-gradient(135deg,rgb(49,40,78),rgb(61,50,96),rgb(39,31,64))] shadow-[0_18px_36px_rgba(15,23,42,0.16)]",
      iconName: "cross.case.fill",
      enabled: illnessEnabled,
    },
  ] as const;

  return (
    <SettingsSection
      title={tSettings(language, "liveActivities")}
      hint={tSettings(language, "liveActivitiesHint")}
    >
      {preferenceRows.map((row, index) => (
        <LiveActivityPreferenceRow
          key={row.key}
          title={row.title}
          hint={row.hint}
          enabled={row.enabled}
          disabled={disabled}
          onToggle={row.onToggle}
          separated={index > 0}
        />
      ))}

      <div className="mx-4 mt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted">
              {tSettings(language, "liveActivitiesPreviewLabel")}
            </p>
            <p className="mt-1 text-sm text-foreground/78 dark:text-white/78">
              {tSettings(language, "liveActivitiesAppleOnly")}
            </p>
          </div>
          <div className="rounded-full border border-black/5 bg-black px-3 py-1 text-[0.72rem] font-semibold text-white dark:border-white/10 dark:bg-white dark:text-slate-950">
            iPhone
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {previewCards.map((card) => (
            <LiveActivityPreviewCard
              key={card.key}
              title={card.title}
              timer={card.timer}
              status={card.status}
              accentClassName={card.accentClassName}
              accentSurfaceClassName={card.accentSurfaceClassName}
              surfaceClassName={card.surfaceClassName}
              iconName={card.iconName}
              enabled={card.enabled}
              muted={!isIos}
              language={language}
            />
          ))}
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
            ) : iconName === "cross.case.fill" ? (
              <path d="M8.75 3.5A2.25 2.25 0 0 0 6.5 5.75V7H4.75A2.25 2.25 0 0 0 2.5 9.25v8A2.25 2.25 0 0 0 4.75 19.5h14.5a2.25 2.25 0 0 0 2.25-2.25v-8A2.25 2.25 0 0 0 19.25 7H17.5V5.75A2.25 2.25 0 0 0 15.25 3.5h-6.5Zm0 1.5h6.5c.414 0 .75.336.75.75V7h-8V5.75c0-.414.336-.75.75-.75Zm3.25 4a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 12 9Z" />
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
            <p className="truncate text-[0.8rem] font-semibold text-white/84">
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

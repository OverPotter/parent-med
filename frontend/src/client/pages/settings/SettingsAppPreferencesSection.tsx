import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import { Surface } from "@shared/components/Surface";
import type { AppLanguage } from "@shared/i18n";
import { tSettings } from "./copy";

type ThemePreference = "light" | "dark" | "system";

export function SettingsAppPreferencesSection({
  language,
  theme,
  setTheme,
  medicationIntervalUnit,
  setMedicationIntervalUnit,
}: {
  language: AppLanguage;
  theme: ThemePreference;
  setTheme: (value: ThemePreference) => void;
  medicationIntervalUnit: "hours" | "minutes";
  setMedicationIntervalUnit: (value: "hours" | "minutes") => void;
}) {
  return (
    <>
      <Surface className="p-5 sm:p-6">
        <p className="app-card-title">{tSettings(language, "appSettings")}</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          {tSettings(language, "appSettingsHint")}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="soft-card relative z-20 overflow-visible rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold tracking-[0.08em] text-muted">
              {tSettings(language, "interfaceLanguage")}
            </p>
            <div className="mt-3">
              <LanguageSwitch triggerClassName="soft-button-secondary min-h-[2.85rem] px-3.5 text-[0.84rem] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]" />
            </div>
          </div>

          <div className="soft-card relative z-10 rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold tracking-[0.08em] text-muted">
              {tSettings(language, "interfaceTheme")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  { value: "light", label: tSettings(language, "themeLight") },
                  { value: "dark", label: tSettings(language, "themeDark") },
                  { value: "system", label: tSettings(language, "themeAuto") },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`${
                    theme === option.value ? "soft-tab-active" : "soft-tab"
                  } inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <p className="app-card-title">{tSettings(language, "medicationPlans")}</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          {tSettings(language, "medicationPlansHint")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { value: "hours", label: tSettings(language, "hours") },
              { value: "minutes", label: tSettings(language, "minutes") },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMedicationIntervalUnit(option.value)}
              className={`${
                medicationIntervalUnit === option.value ? "soft-tab-active" : "soft-tab"
              } inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Surface>
    </>
  );
}

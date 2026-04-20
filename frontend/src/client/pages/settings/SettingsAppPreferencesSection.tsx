import { useRef, useState, useTransition } from "react";
import { updateAccountLanguage } from "@shared/api/auth";
import { ChoiceSheetField, type ChoiceSheetOption } from "@shared/components/ChoiceSheetField";
import type { AppLanguage } from "@shared/i18n";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import { tSettings } from "./copy";
import { SettingsSection } from "./ui";

type ThemePreference = "light" | "dark" | "system";

const settingsChoiceTriggerClassName =
  "!min-w-[4.35rem] !min-h-[2.34rem] !justify-between !gap-1 !px-2.25 !py-0 !text-[0.64rem] !font-semibold !normal-case !tracking-[-0.01em] sm:!min-h-[2.42rem] sm:!text-[0.68rem]";

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
  const themeOptions: ChoiceSheetOption<ThemePreference>[] = [
    {
      value: "light",
      label: tSettings(language, "themeLight"),
      shortLabel: language === "ru" ? "День" : "Day",
    },
    {
      value: "dark",
      label: tSettings(language, "themeDark"),
      shortLabel: language === "ru" ? "Ночь" : "Night",
    },
    {
      value: "system",
      label: tSettings(language, "themeAuto"),
      shortLabel: language === "ru" ? "Авто" : "Auto",
    },
  ];

  const medicationPlanOptions: ChoiceSheetOption<"hours" | "minutes">[] = [
    {
      value: "hours",
      label: tSettings(language, "hours"),
      shortLabel: language === "ru" ? "Часы" : "Hours",
    },
    {
      value: "minutes",
      label: tSettings(language, "minutes"),
      shortLabel: language === "ru" ? "Мин." : "Min.",
    },
  ];

  return (
    <>
      <SettingsSection
        title={tSettings(language, "interfaceLanguage")}
        hint={tSettings(language, "interfaceLanguageHint")}
        badge={<SettingsLanguageField language={language} />}
      >
        {null}
      </SettingsSection>

      <SettingsSection
        title={tSettings(language, "interfaceTheme")}
        hint={tSettings(language, "interfaceThemeHint")}
        badge={
          <ChoiceSheetField
            value={theme}
            options={themeOptions}
            onChange={async (nextTheme) => setTheme(nextTheme)}
            dialogTitle={language === "ru" ? "Выберите тему" : "Choose theme"}
            dialogHint={tSettings(language, "interfaceThemeHint")}
            dialogAriaLabel={language === "ru" ? "Выбор темы" : "Choose theme"}
            triggerClassName={settingsChoiceTriggerClassName}
            selectActionLabel={language === "ru" ? "Выбрать" : "Select"}
          />
        }
      >
        {null}
      </SettingsSection>

      <SettingsSection
        title={tSettings(language, "medicationPlans")}
        hint={tSettings(language, "medicationPlansHint")}
        badge={
          <ChoiceSheetField
            value={medicationIntervalUnit}
            options={medicationPlanOptions}
            onChange={async (nextUnit) => setMedicationIntervalUnit(nextUnit)}
            dialogTitle={language === "ru" ? "Единица интервала" : "Interval unit"}
            dialogHint={tSettings(language, "medicationPlansHint")}
            dialogAriaLabel={language === "ru" ? "Единица интервала" : "Interval unit"}
            triggerClassName={settingsChoiceTriggerClassName}
            selectActionLabel={language === "ru" ? "Выбрать" : "Select"}
          />
        }
      >
        {null}
      </SettingsSection>
    </>
  );
}

function SettingsLanguageField({ language }: { language: AppLanguage }) {
  const { setLanguage } = useI18n();
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const setAccountPreferredLanguage = useAppStore((s) => s.setAccountPreferredLanguage);
  const [isChangingLanguage, startLanguageTransition] = useTransition();
  const [isPersisting, setIsPersisting] = useState(false);
  const requestSeqRef = useRef(0);

  const options: ChoiceSheetOption<AppLanguage>[] = [
    { value: "ru", label: "RU", shortLabel: "RU" },
    { value: "en", label: "EN", shortLabel: "EN" },
  ];

  return (
    <ChoiceSheetField
      value={language}
      options={options}
      onChange={async (nextLanguage) => {
        if (nextLanguage === language || isChangingLanguage || isPersisting) {
          return;
        }

        startLanguageTransition(() => {
          setLanguage(nextLanguage);
        });

        if (authToken && accountId) {
          setIsPersisting(true);
          const requestSeq = requestSeqRef.current + 1;
          requestSeqRef.current = requestSeq;
          try {
            const account = await updateAccountLanguage(nextLanguage);
            if (requestSeq === requestSeqRef.current) {
              setAccountPreferredLanguage(account.preferredLanguage);
            }
          } catch {
            // Keep the local choice even if the server could not persist it yet.
          } finally {
            if (requestSeq === requestSeqRef.current) {
              setIsPersisting(false);
            }
          }
        }
      }}
      dialogTitle={language === "ru" ? "Выберите язык" : "Choose language"}
      dialogHint={tSettings(language, "interfaceLanguageHint")}
      dialogAriaLabel={language === "ru" ? "Выбор языка" : "Choose language"}
      triggerClassName={settingsChoiceTriggerClassName}
      selectActionLabel={language === "ru" ? "Выбрать" : "Select"}
      disabled={isChangingLanguage || isPersisting}
    />
  );
}

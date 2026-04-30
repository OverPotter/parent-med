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
      shortLabel: tSettings(language, "themeShortLight"),
    },
    {
      value: "dark",
      label: tSettings(language, "themeDark"),
      shortLabel: tSettings(language, "themeShortDark"),
    },
    {
      value: "system",
      label: tSettings(language, "themeAuto"),
      shortLabel: tSettings(language, "themeShortAuto"),
    },
  ];

  const medicationPlanOptions: ChoiceSheetOption<"hours" | "minutes">[] = [
    {
      value: "hours",
      label: tSettings(language, "hours"),
      shortLabel: tSettings(language, "hoursShort"),
    },
    {
      value: "minutes",
      label: tSettings(language, "minutes"),
      shortLabel: tSettings(language, "minutesShort"),
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
            dialogTitle={tSettings(language, "chooseTheme")}
            dialogHint={tSettings(language, "interfaceThemeHint")}
            dialogAriaLabel={tSettings(language, "chooseThemeAria")}
            triggerClassName={settingsChoiceTriggerClassName}
            selectActionLabel={tSettings(language, "chooseAction")}
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
            dialogTitle={tSettings(language, "intervalUnitTitle")}
            dialogHint={tSettings(language, "medicationPlansHint")}
            dialogAriaLabel={tSettings(language, "intervalUnitTitle")}
            triggerClassName={settingsChoiceTriggerClassName}
            selectActionLabel={tSettings(language, "chooseAction")}
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
      dialogTitle={tSettings(language, "chooseLanguage")}
      dialogHint={tSettings(language, "interfaceLanguageHint")}
      dialogAriaLabel={tSettings(language, "chooseLanguageAria")}
      triggerClassName={settingsChoiceTriggerClassName}
      selectActionLabel={tSettings(language, "chooseAction")}
      disabled={isChangingLanguage || isPersisting}
    />
  );
}

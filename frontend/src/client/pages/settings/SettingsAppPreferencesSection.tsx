import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import type { AppLanguage } from "@shared/i18n";
import { tSettings } from "./copy";
import { SettingsSection } from "./ui";

type ThemePreference = "light" | "dark" | "system";

const settingsDropdownTriggerClassName =
  "min-w-[4.55rem] justify-between gap-0.5 px-2 py-0 text-[0.66rem] font-semibold normal-case tracking-[-0.012em] sm:min-h-[2.16rem] sm:text-[0.69rem]";

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
      <SettingsSection
        title={tSettings(language, "interfaceLanguage")}
        hint={tSettings(language, "interfaceLanguageHint")}
        badge={
          <LanguageSwitch
            className="relative z-20"
            triggerClassName={settingsDropdownTriggerClassName}
          />
        }
      >
        {null}
      </SettingsSection>

      <SettingsSection
        title={tSettings(language, "interfaceTheme")}
        hint={tSettings(language, "interfaceThemeHint")}
        badge={<ThemeSwitch language={language} value={theme} onChange={setTheme} />}
      >
        {null}
      </SettingsSection>

      <SettingsSection
        title={tSettings(language, "medicationPlans")}
        hint={tSettings(language, "medicationPlansHint")}
        badge={
          <InlineDropdownSwitch
            language={language}
            value={medicationIntervalUnit}
            onChange={setMedicationIntervalUnit}
            ariaLabelRu="Единица интервала"
            ariaLabelEn="Interval unit"
            minMenuWidthClassName="min-w-[8.5rem]"
            options={[
              {
                value: "hours",
                label: tSettings(language, "hours"),
                shortLabel: language === "ru" ? "Часы" : "Hours",
              },
              {
                value: "minutes",
                label: tSettings(language, "minutes"),
                shortLabel: language === "ru" ? "Мин." : "Min",
              },
            ]}
          />
        }
      >
        {null}
      </SettingsSection>
    </>
  );
}

function ThemeSwitch({
  language,
  value,
  onChange,
}: {
  language: AppLanguage;
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}) {
  return (
    <InlineDropdownSwitch
      language={language}
      value={value}
      onChange={onChange}
      ariaLabelRu="Выбор темы"
      ariaLabelEn="Choose theme"
      minMenuWidthClassName="min-w-[8.25rem]"
      options={[
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
      ]}
    />
  );
}

function InlineDropdownSwitch<T extends string>({
  language,
  value,
  onChange,
  options,
  ariaLabelRu,
  ariaLabelEn,
  minMenuWidthClassName,
}: {
  language: AppLanguage;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; shortLabel: string }>;
  ariaLabelRu: string;
  ariaLabelEn: string;
  minMenuWidthClassName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updateMenuRect = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setMenuRect({
        top: rect.bottom + 8,
        left: rect.right,
        width: rect.width,
      });
    };

    updateMenuRect();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div ref={rootRef} className="soft-language-dropdown relative z-20">
      <button
        ref={triggerRef}
        type="button"
        className={`soft-language-dropdown__trigger relative justify-center text-center ${settingsDropdownTriggerClassName} ${
          isOpen ? "soft-language-dropdown__trigger-active" : ""
        }`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={language === "ru" ? ariaLabelRu : ariaLabelEn}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="flex-1 text-center">{activeOption?.shortLabel}</span>
        <span
          className={`soft-language-dropdown__chevron absolute right-2 top-1/2 -translate-y-1/2 ${
            isOpen ? "soft-language-dropdown__chevron-open" : ""
          }`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-none stroke-current">
            <path
              d="m5.5 7.75 4.5 4.5 4.5-4.5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && menuRect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className={`soft-language-dropdown__menu ${minMenuWidthClassName}`}
              role="menu"
              aria-label={language === "ru" ? ariaLabelRu : ariaLabelEn}
              style={{
                position: "fixed",
                top: menuRect.top,
                left: menuRect.left,
                minWidth: Math.max(menuRect.width, 132),
                transform: "translateX(-100%)",
                zIndex: 9999,
              }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={value === option.value}
                  className={`soft-language-dropdown__option text-[0.72rem] font-semibold normal-case tracking-[-0.012em] ${
                    value === option.value ? "soft-language-dropdown__option-active" : ""
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {value === option.value ? (
                    <span className="soft-language-dropdown__check" aria-hidden="true">
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-none stroke-current">
                        <path
                          d="m4.5 10 3.2 3.2L15.5 5.8"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : null}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

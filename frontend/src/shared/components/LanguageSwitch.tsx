import { useEffect, useRef, useState } from "react";
import { updateAccountLanguage } from "@shared/api/auth";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const languageLabels = {
  ru: "RU",
  en: "EN",
} as const;

export function LanguageSwitch({
  className,
  triggerClassName,
}: {
  className?: string;
  triggerClassName?: string;
}) {
  const { language, setLanguage, copy } = useI18n();
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const setAccountPreferredLanguage = useAppStore((s) => s.setAccountPreferredLanguage);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={joinClasses("soft-language-dropdown", className)}>
      <button
        type="button"
        className={joinClasses(
          "soft-language-dropdown__trigger",
          triggerClassName,
          isOpen && "soft-language-dropdown__trigger-active"
        )}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={copy.common.languageSwitcherLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span>{languageLabels[language]}</span>
        <span
          className={joinClasses(
            "soft-language-dropdown__chevron",
            isOpen && "soft-language-dropdown__chevron-open"
          )}
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

      {isOpen ? (
        <div
          className="soft-language-dropdown__menu"
          role="menu"
          aria-label={copy.common.languageSwitcherLabel}
        >
          {(["ru", "en"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={language === option}
              className={joinClasses(
                "soft-language-dropdown__option",
                language === option && "soft-language-dropdown__option-active"
              )}
              onClick={async () => {
                setLanguage(option);
                setIsOpen(false);
                if (authToken && accountId) {
                  try {
                    const account = await updateAccountLanguage(option);
                    setAccountPreferredLanguage(account.preferredLanguage);
                  } catch {
                    // Keep the local choice even if the server could not persist it yet.
                  }
                }
              }}
            >
              <span>{languageLabels[option]}</span>
              {language === option ? (
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
        </div>
      ) : null}
    </div>
  );
}

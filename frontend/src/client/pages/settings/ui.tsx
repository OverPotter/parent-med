import type { ReactNode } from "react";
import { illnessPanelSoftClass } from "../child-illness/shared";
import { childActionPrimaryClass, childActionSecondaryClass } from "../children/shared";

export function SettingsSection({
  title,
  hint,
  children,
  badge,
  tone = "default",
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  badge?: ReactNode;
  tone?: "default" | "danger";
}) {
  const hasBody = children !== null && children !== undefined && children !== false;

  return (
    <section className={`${illnessPanelSoftClass} overflow-visible p-5 sm:p-6`}>
      {title || hint || badge ? (
        <div className={`min-w-0 ${badge ? "relative pr-[8.75rem] sm:pr-[9.5rem]" : ""}`}>
          {title ? (
            <p
              className={`app-card-title ${
                tone === "danger" ? "text-[color:var(--color-danger)]" : ""
              }`}
            >
              {title}
            </p>
          ) : null}
          {hint ? <p className={`${title ? "mt-1 " : ""}text-sm leading-6 text-muted`}>{hint}</p> : null}
          {badge ? <div className="absolute right-0 top-0 min-w-0 shrink-0">{badge}</div> : null}
        </div>
      ) : null}
      {hasBody ? (
        <div
          className={`${title || hint || badge ? "mt-5 " : ""}overflow-visible rounded-[22px] bg-transparent`}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function SettingsRow({
  title,
  hint,
  actions,
  separated = false,
  align = "center",
  forceInlineActions = false,
}: {
  title?: string;
  hint?: string;
  actions?: ReactNode;
  separated?: boolean;
  align?: "center" | "start";
  forceInlineActions?: boolean;
}) {
  const layoutClassName = forceInlineActions
    ? `flex items-start justify-between gap-3 sm:gap-4 ${align === "center" ? "sm:items-center" : "sm:items-start"}`
    : `flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4 ${
        align === "center" ? "sm:items-center" : "sm:items-start"
      }`;

  return (
    <div
      className={`settings-preference-row px-4 py-4 ${layoutClassName} ${
        separated ? "settings-preference-row--separated" : ""
      }`}
    >
      {title || hint ? (
        <div className={`min-w-0 ${forceInlineActions ? "flex-1" : ""}`}>
          {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
          {hint ? <p className={`${title ? "mt-1 " : ""}text-sm leading-6 text-muted`}>{hint}</p> : null}
        </div>
      ) : (
        <div className="hidden sm:block" aria-hidden="true" />
      )}
      {actions ? (
        <div
          className={`min-w-0 ${
            forceInlineActions ? "w-auto shrink-0 self-start" : "w-full sm:w-auto sm:shrink-0"
          }`.trim()}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function SettingsChoiceGroup({
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  buttonClassName = "",
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}) {
  return (
    <div className={`flex w-full flex-wrap gap-2 ${className}`.trim()}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          aria-pressed={value === option.value}
          className={`${
            value === option.value ? childActionPrimaryClass : childActionSecondaryClass
          } min-h-[2.82rem] px-3.5 text-[0.84rem] disabled:opacity-50 sm:min-h-[2.92rem] sm:px-4 sm:text-[0.89rem] ${buttonClassName}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

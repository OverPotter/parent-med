import type { ReactNode } from "react";

type DisclosureHeaderProps = {
  actions?: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  desktopClosedLabel?: string;
  desktopOpenLabel?: string;
  mobileClosedLabel?: string;
  mobileOpenLabel?: string;
  className?: string;
  contentClassName?: string;
  desktopButtonClassName?: string;
  disabled?: boolean;
};

export function DisclosureHeader({
  actions,
  children,
  isOpen,
  onToggle,
  desktopClosedLabel = "Открыть",
  desktopOpenLabel = "Скрыть",
  mobileClosedLabel = "Открыть",
  mobileOpenLabel = "Скрыть",
  className = "",
  contentClassName = "",
  desktopButtonClassName = "soft-button-secondary",
  disabled = false,
}: DisclosureHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 ${className} ${
        disabled ? "" : "cursor-pointer"
      }`.trim()}
      onClick={disabled ? undefined : onToggle}
      onKeyDown={(event) => {
        if (disabled) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? undefined : 0}
      aria-expanded={disabled ? undefined : isOpen}
    >
      <div className={`min-w-0 ${contentClassName}`.trim()}>{children}</div>

      {(!disabled || actions) && (
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
          {!disabled && (
            <>
              <span className="soft-pill rounded-full px-3 py-1 text-xs sm:hidden">
                {isOpen ? mobileOpenLabel : mobileClosedLabel}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle();
                }}
                className={`hidden min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:inline-flex sm:min-h-[3rem] sm:px-4 sm:text-[0.88rem] ${desktopButtonClassName}`.trim()}
              >
                {isOpen ? desktopOpenLabel : desktopClosedLabel}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

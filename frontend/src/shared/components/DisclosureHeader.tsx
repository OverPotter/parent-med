import type { ReactNode } from "react";

type DisclosureHeaderProps = {
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
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`.trim()}>
      <div
        className={`min-w-0 ${disabled ? "" : "cursor-pointer"} ${contentClassName}`.trim()}
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
        {children}
      </div>

      {!disabled && (
        <>
          <span className="soft-pill rounded-full px-3 py-1 text-xs sm:hidden">
            {isOpen ? mobileOpenLabel : mobileClosedLabel}
          </span>
          <button
            type="button"
            onClick={onToggle}
            className={`hidden rounded-2xl px-4 py-2.5 text-sm sm:inline-flex ${desktopButtonClassName}`.trim()}
          >
            {isOpen ? desktopOpenLabel : desktopClosedLabel}
          </button>
        </>
      )}
    </div>
  );
}

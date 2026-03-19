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
}: DisclosureHeaderProps) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`.trim()}>
      <div
        className={`min-w-0 cursor-pointer ${contentClassName}`.trim()}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        {children}
      </div>

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
    </div>
  );
}

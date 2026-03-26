import type { ReactNode } from "react";

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={joinClasses("soft-panel rounded-[30px] sm:rounded-[34px]", className)}>
      {children}
    </div>
  );
}

export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={joinClasses(
        "soft-empty rounded-[30px] px-6 py-10 text-sm leading-7 text-muted",
        "sm:rounded-[30px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function RowSurface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={joinClasses(
        "soft-card rounded-[28px] px-4 py-4 sm:rounded-[32px] sm:px-6 sm:py-6",
        className
      )}
    >
      {children}
    </div>
  );
}

import type { ReactNode } from "react";

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={joinClasses("border border-border bg-background", className)}>{children}</div>
  );
}

export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={joinClasses(
        "border border-dashed border-border bg-background px-5 py-8 text-sm text-muted",
        className
      )}
    >
      {children}
    </div>
  );
}

export function RowSurface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={joinClasses("border border-border bg-background px-4 py-4", className)}>
      {children}
    </div>
  );
}

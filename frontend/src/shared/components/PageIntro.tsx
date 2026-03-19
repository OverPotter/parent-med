import type { ReactNode } from "react";
import { Surface } from "./Surface";

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function PageIntro({
  title,
  subtitle,
  action,
  eyebrow,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <Surface className={joinClasses("soft-page-intro overflow-hidden p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <span className="soft-pill-primary inline-flex rounded-full px-3 py-1 text-[11px] tracking-[0.08em]">
              {eyebrow}
            </span>
          )}
          <h1
            className={joinClasses(
              eyebrow ? "mt-4" : "",
              "text-2xl font-semibold text-foreground sm:text-3xl"
            )}
          >
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0">{action}</div>}
      </div>
    </Surface>
  );
}

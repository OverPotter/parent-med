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
  compactOnMobile = false,
  hideOnMobile = false,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
  className?: string;
  compactOnMobile?: boolean;
  hideOnMobile?: boolean;
}) {
  return (
    <Surface
      className={joinClasses(
        "soft-page-intro overflow-hidden",
        hideOnMobile && "hidden sm:block",
        compactOnMobile ? "p-4 sm:p-6" : "p-5 sm:p-6",
        className
      )}
    >
      <div
        className={joinClasses(
          "flex flex-col lg:flex-row lg:items-end lg:justify-between",
          compactOnMobile ? "gap-3 sm:gap-5" : "gap-4 sm:gap-5"
        )}
      >
        <div className="min-w-0">
          {eyebrow && (
            <span className="soft-pill-primary inline-flex rounded-full px-3 py-1 text-[11px] tracking-[0.08em]">
              {eyebrow}
            </span>
          )}
          <h1
            className={joinClasses(
              eyebrow ? "mt-4" : "",
              compactOnMobile
                ? "text-xl font-semibold text-foreground sm:text-3xl"
                : "text-2xl font-semibold text-foreground sm:text-3xl"
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={joinClasses(
                "max-w-3xl text-sm text-muted",
                compactOnMobile ? "mt-1 leading-6 sm:mt-2 sm:leading-7" : "mt-2 leading-7"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex shrink-0">{action}</div>}
      </div>
    </Surface>
  );
}

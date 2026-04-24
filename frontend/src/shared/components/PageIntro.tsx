import type { ReactNode } from "react";
import { Surface } from "./Surface";

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function PageIntro({
  title,
  subtitle,
  afterSubtitle,
  action,
  eyebrow,
  className,
  compactOnMobile = false,
  hideOnMobile = false,
  mobileLikeDesktop = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  afterSubtitle?: ReactNode;
  action?: ReactNode;
  eyebrow?: string;
  className?: string;
  compactOnMobile?: boolean;
  hideOnMobile?: boolean;
  mobileLikeDesktop?: boolean;
}) {
  return (
    <Surface
      className={joinClasses(
        "soft-page-intro overflow-hidden",
        mobileLikeDesktop && "soft-page-intro--mobile-like",
        hideOnMobile && "hidden sm:block",
        compactOnMobile ? "p-4 sm:p-6" : "p-5 sm:p-7 lg:p-8",
        className
      )}
    >
      <div
        className={joinClasses(
          "flex flex-col lg:flex-row lg:items-end lg:justify-between",
          mobileLikeDesktop && "soft-page-intro__inner--mobile-like",
          compactOnMobile ? "gap-3 sm:gap-5" : "gap-4 sm:gap-5"
        )}
      >
        <div className="min-w-0">
          {eyebrow && (
            <span className="soft-pill-primary inline-flex rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.04em]">
              {eyebrow}
            </span>
          )}
          <h1
            className={joinClasses(
              eyebrow ? "mt-4" : "",
              compactOnMobile
                ? "app-title text-[1.68rem] sm:text-[2.25rem]"
                : "app-title text-[1.92rem] sm:text-[2.65rem]"
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={joinClasses(
                "app-subtitle max-w-3xl text-[0.96rem]",
                compactOnMobile
                  ? "mt-1.5 leading-6 sm:mt-2.5 sm:leading-7"
                  : "mt-2.5 leading-7 sm:text-base"
              )}
            >
              {subtitle}
            </p>
          )}
          {afterSubtitle}
        </div>
        {action && (
          <div className="flex w-full shrink-0 items-center sm:w-auto sm:justify-end">{action}</div>
        )}
      </div>
    </Surface>
  );
}

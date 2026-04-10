import { NavLink, matchPath, useLocation } from "react-router-dom";
import { useI18n } from "@shared/hooks/useI18n";
import { renderNavIcon } from "./navIcons";

export interface LayoutNavLink {
  to: string;
  label: string;
  mobileLabel?: string;
  activePaths?: string[];
  exactActivePaths?: string[];
  attentionCount?: number;
  attentionTone?: "danger" | "warning" | "success";
}

export function TopNav({ links }: { links: LayoutNavLink[] }) {
  const { language } = useI18n();
  const location = useLocation();

  if (links.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={language === "ru" ? "Основная навигация" : "Primary navigation"}
      className="app-desktop-nav hidden md:flex md:justify-center"
    >
      <div
        className="app-desktop-nav__grid grid w-full max-w-[60rem]"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
      >
        {links.map(
          ({ to, label, activePaths, exactActivePaths, attentionCount, attentionTone }) => {
            const exactMatches = exactActivePaths ?? [to];
            const prefixMatches = activePaths ?? [];
            const isActive =
              exactMatches.some((path) => matchPath({ path, end: true }, location.pathname)) ||
              prefixMatches.some((path) => matchPath({ path, end: false }, location.pathname));
            const badgeToneClass =
              attentionTone === "success"
                ? "bg-[color:var(--color-success)]"
                : attentionTone === "warning"
                  ? "bg-[color:var(--color-warning)]"
                  : "bg-[color:var(--color-danger)]";

            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={() =>
                  [
                    "app-desktop-nav__item app-primary-tab flex min-h-[3.4rem] items-center justify-center gap-2.5 px-4 py-3 text-center text-[0.98rem] font-extrabold tracking-[-0.04em] transition-colors",
                    isActive
                      ? "app-desktop-nav__item--active app-primary-tab--active"
                      : "app-desktop-nav__item--inactive",
                  ].join(" ")
                }
              >
                <span className="relative inline-flex h-[1.35rem] min-w-[1.35rem] shrink-0 items-center justify-center">
                  <span className="relative z-[1] inline-flex">{renderNavIcon(to, isActive)}</span>
                  {attentionCount && attentionCount > 0 ? (
                    <span
                      className={`absolute -right-[0.42rem] -top-[0.42rem] z-[2] inline-flex min-h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full ${badgeToneClass} px-1 text-[10px] font-bold leading-none text-white shadow-sm`}
                    >
                      {attentionCount > 9 ? "9+" : attentionCount}
                    </span>
                  ) : null}
                </span>
                {label}
              </NavLink>
            );
          }
        )}
      </div>
    </nav>
  );
}

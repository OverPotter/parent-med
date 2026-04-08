import { createPortal } from "react-dom";
import { NavLink, matchPath, useLocation } from "react-router-dom";
import { useI18n } from "@shared/hooks/useI18n";
import type { LayoutNavLink } from "./TopNav";
import { renderNavIcon } from "./navIcons";

export function BottomTabBar({ links }: { links: LayoutNavLink[] }) {
  const { language } = useI18n();
  const location = useLocation();

  if (links.length === 0) {
    return null;
  }

  const nav = (
    <nav
      aria-label={language === "ru" ? "Нижняя навигация" : "Bottom navigation"}
      className="app-bottom-nav-wrap fixed inset-x-0 bottom-0 z-[90] px-0 pb-0 pt-0 md:hidden"
    >
      <div className="w-full px-0">
        <div
          className="app-bottom-nav-shell soft-nav-shell grid gap-1"
          style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
        >
          {links.map(
            ({
              to,
              label,
              mobileLabel,
              activePaths,
              exactActivePaths,
              attentionCount,
              attentionTone,
            }) => {
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
                      "app-bottom-nav-link relative flex min-h-[3.55rem] min-w-0 flex-col items-center justify-center rounded-[16px] px-1.5 py-2 text-center text-[10px] font-extrabold leading-[1.05] tracking-[-0.03em] transition-colors",
                      isActive ? "app-bottom-nav-link--active" : "",
                    ].join(" ")
                  }
                >
                  <span className="relative mb-1 inline-flex">
                    <span className="relative z-[1] inline-flex">{renderNavIcon(to)}</span>
                    {attentionCount && attentionCount > 0 ? (
                      <span
                        className={`absolute -right-[0.42rem] -top-[0.42rem] z-0 inline-flex min-h-[1.08rem] min-w-[1.08rem] items-center justify-center rounded-full ${badgeToneClass} px-[0.2rem] text-[9px] font-bold leading-none text-white shadow-sm [clip-path:inset(0_0_2%_2%)]`}
                      >
                        {attentionCount > 9 ? "9+" : attentionCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate">{mobileLabel ?? label}</span>
                </NavLink>
              );
            }
          )}
        </div>
      </div>
    </nav>
  );

  if (typeof document === "undefined") {
    return nav;
  }

  return createPortal(nav, document.body);
}

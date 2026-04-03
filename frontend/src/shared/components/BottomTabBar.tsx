import { NavLink, matchPath, useLocation } from "react-router-dom";
import type { LayoutNavLink } from "./TopNav";
import { renderNavIcon } from "./navIcons";

export function BottomTabBar({ links }: { links: LayoutNavLink[] }) {
  const location = useLocation();

  if (links.length === 0) {
    return null;
  }

  return (
    <nav className="app-bottom-nav-wrap fixed inset-x-0 bottom-0 z-[90] px-0 pb-0 pt-0 md:hidden">
      <div className="w-full px-0">
        <div
          className="app-bottom-nav-shell soft-nav-shell grid gap-1"
          style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
        >
          {links.map(({ to, label, mobileLabel, activePaths, exactActivePaths }) => {
            const exactMatches = exactActivePaths ?? [to];
            const prefixMatches = activePaths ?? [];
            const isActive =
              exactMatches.some((path) => matchPath({ path, end: true }, location.pathname)) ||
              prefixMatches.some((path) => matchPath({ path, end: false }, location.pathname));

            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={() =>
                  [
                    "app-bottom-nav-link flex min-h-[3.55rem] min-w-0 flex-col items-center justify-center overflow-hidden rounded-[16px] px-1.5 py-2 text-center text-[10px] font-extrabold leading-[1.05] tracking-[-0.03em] transition-colors",
                    isActive ? "app-bottom-nav-link--active" : "",
                  ].join(" ")
                }
              >
                <span className="mb-1 inline-flex">{renderNavIcon(to)}</span>
                <span className="truncate">{mobileLabel ?? label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

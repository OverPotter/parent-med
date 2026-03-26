import { NavLink, matchPath, useLocation } from "react-router-dom";
import type { LayoutNavLink } from "./TopNav";
import { renderNavIcon } from "./navIcons";

export function BottomTabBar({ links }: { links: LayoutNavLink[] }) {
  const location = useLocation();

  if (links.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 md:hidden">
      <div className="mx-auto w-full max-w-[28rem]">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
        >
          {links.map(({ to, label, mobileLabel, activePaths }) => {
            const isActive = (activePaths ?? [to]).some((path) =>
              matchPath({ path, end: path === to }, location.pathname)
            );

            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={() =>
                  [
                    "flex min-h-[3.7rem] min-w-0 flex-col items-center justify-center overflow-hidden rounded-[24px] px-1.5 py-2 text-center text-[10px] font-extrabold leading-[1.05] tracking-[-0.03em] transition-colors",
                    isActive ? "soft-tab-active" : "soft-tab",
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

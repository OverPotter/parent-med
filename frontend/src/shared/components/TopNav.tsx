import { NavLink, matchPath, useLocation } from "react-router-dom";
import { renderNavIcon } from "./navIcons";

export interface LayoutNavLink {
  to: string;
  label: string;
  mobileLabel?: string;
  activePaths?: string[];
}

export function TopNav({ links }: { links: LayoutNavLink[] }) {
  const location = useLocation();

  if (links.length === 0) {
    return null;
  }

  return (
    <nav className="hidden md:flex md:justify-center">
      <div
        className="grid w-full max-w-[60rem] gap-2"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
      >
        {links.map(({ to, label, activePaths }) => {
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
                  "flex min-h-[3.2rem] items-center justify-center gap-2 rounded-[22px] px-4 py-2.5 text-center text-[0.95rem] font-extrabold tracking-[-0.03em] shadow-[0_10px_24px_-20px_rgba(15,23,42,0.22)] transition-colors",
                  isActive ? "soft-tab-active" : "soft-tab",
                ].join(" ")
              }
            >
              <span className="inline-flex shrink-0">{renderNavIcon(to)}</span>
              {label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

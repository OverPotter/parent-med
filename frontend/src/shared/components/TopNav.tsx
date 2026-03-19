import { NavLink, matchPath, useLocation } from "react-router-dom";

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
      <div className="soft-nav-shell inline-flex items-center gap-1.5 rounded-[24px] p-1.5">
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
                  "whitespace-nowrap rounded-[18px] px-4 py-2 text-sm transition-colors",
                  isActive ? "soft-tab-active" : "soft-tab",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

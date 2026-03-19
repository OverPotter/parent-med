import { NavLink } from "react-router-dom";

export interface LayoutNavLink {
  to: string;
  label: string;
  mobileLabel?: string;
}

export function TopNav({ links }: { links: LayoutNavLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <nav className="hidden md:flex md:justify-center">
      <div className="soft-nav-shell inline-flex items-center gap-1.5 rounded-full p-1.5">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              [
                "whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors",
                isActive ? "soft-tab-active" : "soft-tab",
              ].join(" ")
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

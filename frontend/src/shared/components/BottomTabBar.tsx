import { NavLink } from "react-router-dom";
import type { LayoutNavLink } from "./TopNav";

export function BottomTabBar({ links }: { links: LayoutNavLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 md:hidden">
      <div className="soft-panel mx-auto w-full max-w-[28rem] rounded-[28px] px-2 py-2">
        <div className="grid grid-cols-4 gap-1.5">
          {links.map(({ to, label, mobileLabel }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                [
                  "flex min-h-12 min-w-0 items-center justify-center overflow-hidden rounded-[18px] px-1 py-2 text-center text-[10px] font-medium leading-3.5 transition-colors",
                  isActive ? "soft-tab-active" : "soft-tab",
                ].join(" ")
              }
            >
              {mobileLabel ?? label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

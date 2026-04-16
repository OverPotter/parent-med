import { createPortal } from "react-dom";
import { useState } from "react";
import { NavLink, matchPath, useLocation } from "react-router-dom";
import { useI18n } from "@shared/hooks/useI18n";
import type { LayoutNavLink } from "./TopNav";
import { renderNavIcon } from "./navIcons";

export function BottomTabBar({
  links,
  forceVisible = false,
}: {
  links: LayoutNavLink[];
  forceVisible?: boolean;
}) {
  const { language } = useI18n();
  const location = useLocation();
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  if (links.length === 0) {
    return null;
  }

  const nav = (
    <nav
      aria-label={language === "ru" ? "Нижняя навигация" : "Bottom navigation"}
      className={forceVisible ? "app-bottom-nav-wrap" : "app-bottom-nav-wrap md:hidden"}
    >
      <div
        className="app-bottom-nav-shell"
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
                ? "app-bottom-nav-badge--success"
                : attentionTone === "warning"
                  ? "app-bottom-nav-badge--warning"
                  : "app-bottom-nav-badge--danger";

            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onPointerDown={(event) => {
                  if (event.pointerType === "mouse") {
                    return;
                  }
                  setPressedTab(to);
                }}
                onPointerUp={() => setPressedTab((current) => (current === to ? null : current))}
                onPointerCancel={() =>
                  setPressedTab((current) => (current === to ? null : current))
                }
                onPointerLeave={() =>
                  setPressedTab((current) => (current === to ? null : current))
                }
                className={() =>
                  [
                    "app-bottom-nav-link",
                    isActive
                      ? "app-bottom-nav-link--active"
                      : "",
                    pressedTab === to ? "app-bottom-nav-link--pressed" : "",
                  ].join(" ")
                }
              >
                <span className="app-bottom-nav-icon-wrap">
                  <span className="app-bottom-nav-icon">{renderNavIcon(to, isActive)}</span>
                  {attentionCount && attentionCount > 0 ? (
                    <span className={`app-bottom-nav-badge ${badgeToneClass}`}>
                      {attentionCount > 9 ? "9+" : attentionCount}
                    </span>
                  ) : null}
                </span>
                <span className="app-bottom-nav-label">{mobileLabel ?? label}</span>
              </NavLink>
            );
          }
        )}
      </div>
    </nav>
  );

  if (typeof document === "undefined") {
    return nav;
  }

  return createPortal(nav, document.body);
}

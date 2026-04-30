import { createPortal } from "react-dom";
import { useState } from "react";
import { NavLink, matchPath, useLocation } from "react-router-dom";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import type { LayoutNavLink } from "./TopNav";
import { renderNavIcon } from "./navIcons";

export function BottomTabBar({
  links,
  forceVisible = false,
  hidden = false,
}: {
  links: LayoutNavLink[];
  forceVisible?: boolean;
  hidden?: boolean;
}) {
  const { language } = useI18n();
  const location = useLocation();
  const isIosShell = useIsIosShell();
  const [pressedTab, setPressedTab] = useState<string | null>(null);
  const enablePressedState = !isIosShell;

  if (links.length === 0) {
    return null;
  }

  const nav = (
    <nav
      aria-label={language === "ru" ? "Нижняя навигация" : "Bottom navigation"}
      className={[
        forceVisible ? "app-bottom-nav-wrap" : "app-bottom-nav-wrap md:hidden",
        hidden ? "app-bottom-nav-wrap--hidden" : "",
      ]
        .filter(Boolean)
        .join(" ")}
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
            const attentionToneClass =
              attentionCount && attentionCount > 0
                ? attentionTone === "success"
                  ? "app-bottom-nav-link--attention-success"
                  : attentionTone === "info"
                    ? "app-bottom-nav-link--attention-info"
                    : attentionTone === "warning"
                      ? "app-bottom-nav-link--attention-warning"
                      : "app-bottom-nav-link--attention-danger"
                : "";

            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onPointerDown={(event) => {
                  if (!enablePressedState) {
                    return;
                  }
                  if (event.pointerType === "mouse") {
                    return;
                  }
                  setPressedTab(to);
                }}
                onPointerUp={() => {
                  if (!enablePressedState) {
                    return;
                  }
                  setPressedTab((current) => (current === to ? null : current));
                }}
                onPointerCancel={() =>
                  !enablePressedState
                    ? undefined
                    : setPressedTab((current) => (current === to ? null : current))
                }
                onPointerLeave={() =>
                  !enablePressedState
                    ? undefined
                    : setPressedTab((current) => (current === to ? null : current))
                }
                aria-label={
                  attentionCount && attentionCount > 0
                    ? `${mobileLabel ?? label}: ${attentionCount}`
                    : (mobileLabel ?? label)
                }
                className={() =>
                  [
                    "app-bottom-nav-link",
                    isActive ? "app-bottom-nav-link--active" : "",
                    attentionToneClass,
                    enablePressedState && pressedTab === to ? "app-bottom-nav-link--pressed" : "",
                  ].join(" ")
                }
              >
                <span className="app-bottom-nav-icon-wrap">
                  <span className="app-bottom-nav-icon">{renderNavIcon(to, isActive)}</span>
                </span>
                <span className="app-bottom-nav-label">{mobileLabel ?? label}</span>
              </NavLink>
            );
          }
        )}
      </div>
    </nav>
  );

  if (typeof document === "undefined" || isIosShell) {
    return nav;
  }

  return createPortal(nav, document.body);
}

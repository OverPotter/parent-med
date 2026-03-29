/**
 * Общий layout: шапка с темой и навигация (переиспользуемый в client/admin).
 */

import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { logout } from "@shared/api/auth";
import { useAppStore } from "@shared/store/useAppStore";
import { BottomTabBar } from "./BottomTabBar";
import { TopNav, type LayoutNavLink } from "./TopNav";
import { V3BackgroundDoodles } from "./V3BackgroundDoodles";

type ThemeIconStyle = CSSProperties & {
  "--soft-theme-icon-from"?: string;
  "--soft-theme-icon-to"?: string;
  "--soft-theme-icon-scale"?: number;
};

interface LayoutProps {
  children: React.ReactNode;
  /** Ссылки для навигации (client или admin). */
  navLinks?: LayoutNavLink[];
  mobileNavLinks?: LayoutNavLink[];
  showCurrentFamily?: boolean;
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1.05rem] w-[1.05rem] fill-none stroke-current"
    >
      <path
        d="M14.5 3.5a7.9 7.9 0 1 0 6 13.05A8.7 8.7 0 0 1 14.5 3.5Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1.05rem] w-[1.05rem] fill-none stroke-current"
    >
      <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
      <path
        d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.49 1.49M6.95 17.05l-1.49 1.49M18.54 18.54l-1.49-1.49M6.95 6.95 5.46 5.46"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Layout({
  children,
  navLinks = [],
  mobileNavLinks = [],
  showCurrentFamily = false,
}: LayoutProps) {
  const { theme, toggleTheme, currentFamilyName, accountLogin, accountDisplayName, clearSession } =
    useAppStore();
  const accountLabel = accountDisplayName || accountLogin || "Пользователь";
  const hasMobileNav = mobileNavLinks.length > 0;

  const spinTimeoutRef = useRef<number | null>(null);
  const [isIconSpinning, setIsIconSpinning] = useState(false);
  const initialRotation = theme === "light" ? -12 : 12;
  const [iconSpin, setIconSpin] = useState({ from: initialRotation, to: initialRotation });

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current !== null) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Локальный выход всё равно должен отработать, даже если сессия уже истекла.
    } finally {
      clearSession();
    }
  };

  const iconStyle: ThemeIconStyle = {
    "--soft-theme-icon-from": `${iconSpin.from}deg`,
    "--soft-theme-icon-to": `${iconSpin.to}deg`,
    "--soft-theme-icon-scale": theme === "light" ? 1 : 1.06,
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    const nextRotation = nextTheme === "light" ? -12 : 12;
    setIconSpin((current) => ({ from: current.to, to: nextRotation }));
    setIsIconSpinning(true);
    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current);
    }
    spinTimeoutRef.current = window.setTimeout(() => {
      setIsIconSpinning(false);
      spinTimeoutRef.current = null;
    }, 420);
    toggleTheme();
  };

  const themeToggleLabel = theme === "light" ? "Тёмная тема" : "Светлая тема";
  const themeToggleText = theme === "light" ? "Ночь" : "День";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="app-v3-background" aria-hidden="true">
        <V3BackgroundDoodles />
        <div className="app-v3-decor app-v3-decor-a" />
        <div className="app-v3-decor app-v3-decor-b" />
        <div className="app-v3-decor app-v3-decor-c" />
        <div className="app-v3-noise" />
      </div>
      <header className="min-w-0 px-3 pt-3 sm:px-4 sm:pt-3">
        <div className="relative z-[1] mx-auto max-w-5xl">
          <div className="md:hidden">
            <div className="soft-nav-shell app-mobile-header rounded-[30px] px-3.5 py-3.5">
              <div className="flex flex-col gap-3">
                <div className="app-mobile-header__row flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/"
                      className="app-mobile-header__brand inline-flex min-w-0 items-center gap-3"
                    >
                      <img
                        src="/pwa-icon.svg"
                        alt=""
                        className="app-mobile-header__logo h-10 w-10 rounded-[18px]"
                      />
                      <div className="min-w-0">
                        <span className="app-brand-text block truncate text-[1.04rem]">
                          Parent Med
                        </span>
                        <span className="hidden truncate text-[11px] text-muted sm:block">
                          Семейный кабинет здоровья
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="app-mobile-header__actions flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="soft-theme-toggle"
                      onClick={handleThemeToggle}
                      aria-label={themeToggleLabel}
                      title={themeToggleLabel}
                    >
                      <span
                        className={[
                          "soft-theme-toggle__icon",
                          theme === "light"
                            ? "soft-theme-toggle__icon--moon"
                            : "soft-theme-toggle__icon--sun",
                          isIconSpinning ? "soft-theme-toggle__icon--spin" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                        style={iconStyle}
                      >
                        {theme === "light" ? <MoonIcon /> : <SunIcon />}
                      </span>
                      <span className="text-xs font-semibold">{themeToggleText}</span>
                    </button>
                    {accountLogin && (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="soft-button-secondary rounded-full px-3.5 py-1.5 text-xs"
                      >
                        Выйти
                      </button>
                    )}
                  </div>
                </div>
                {(showCurrentFamily && currentFamilyName) || accountLogin ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {showCurrentFamily && currentFamilyName ? (
                      <span className="soft-pill inline-flex max-w-full items-center truncate rounded-full px-3.5 py-1.5 text-[11px]">
                        {currentFamilyName}
                      </span>
                    ) : null}
                    {accountLogin ? (
                      <span className="soft-pill inline-flex max-w-[11rem] items-center truncate rounded-full px-3.5 py-1.5 text-[11px]">
                        {accountLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="hidden md:block md:py-2">
            <div className="soft-nav-shell rounded-[32px] px-4 py-3.5">
              <div className="flex items-center justify-between gap-5">
                <Link to="/" className="inline-flex min-w-0 items-center gap-3">
                  <img src="/pwa-icon.svg" alt="" className="h-9 w-9 rounded-2xl" />
                  <p className="app-brand-text truncate text-[1.12rem]">Parent Med</p>
                </Link>

                <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                  {showCurrentFamily && currentFamilyName && (
                    <span className="soft-pill max-w-[12rem] truncate rounded-full px-3.5 py-1.5 text-xs">
                      {currentFamilyName}
                    </span>
                  )}
                  {accountLogin && (
                    <span className="soft-pill max-w-[14rem] truncate rounded-full px-3.5 py-1.5 text-xs">
                      {accountLabel}
                    </span>
                  )}
                  <button
                    type="button"
                    className="soft-theme-toggle"
                    onClick={handleThemeToggle}
                    aria-label={themeToggleLabel}
                    title={themeToggleLabel}
                  >
                    <span
                      className={[
                        "soft-theme-toggle__icon",
                        theme === "light"
                          ? "soft-theme-toggle__icon--moon"
                          : "soft-theme-toggle__icon--sun",
                        isIconSpinning ? "soft-theme-toggle__icon--spin" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-hidden="true"
                      style={iconStyle}
                    >
                      {theme === "light" ? <MoonIcon /> : <SunIcon />}
                    </span>
                    <span className="text-xs font-semibold">{themeToggleText}</span>
                  </button>
                  {accountLogin && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="soft-button-secondary rounded-full px-3.5 py-1.5 text-xs"
                    >
                      Выйти
                    </button>
                  )}
                </div>
              </div>
            </div>

            {navLinks.length > 0 && (
              <div className="mt-3 px-2">
                <TopNav links={navLinks} />
              </div>
            )}
          </div>
        </div>
      </header>
      <main
        className={[
          "relative z-[1] mx-auto flex-1 w-full max-w-5xl min-w-0 px-3 py-6 sm:px-6 sm:py-11",
          hasMobileNav ? "pb-28 md:pb-11" : "",
        ].join(" ")}
      >
        {children}
      </main>
      {hasMobileNav && <BottomTabBar links={mobileNavLinks} />}
    </div>
  );
}

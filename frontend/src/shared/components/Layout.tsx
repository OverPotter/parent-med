/**
 * Общий layout: шапка с темой и навигация (переиспользуемый в client/admin).
 */

import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Capacitor } from "@capacitor/core";
import { logout } from "@shared/api/auth";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import { BottomTabBar } from "./BottomTabBar";
import { LanguageSwitch } from "./LanguageSwitch";
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

function FeedbackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1.16rem] w-[1.16rem] fill-none stroke-current"
    >
      <path
        d="M5.5 6.5h13a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-7.2l-3.9 3v-3H5.5A1.5 1.5 0 0 1 4 16V8a1.5 1.5 0 0 1 1.5-1.5Z"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.25 11.25h7.5M8.25 14h5.25" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ProfileMenu({
  accountLabel,
  servicesLabel,
  settingsLabel,
  logoutLabel,
  menuLabel,
  onLogout,
}: {
  accountLabel: string;
  servicesLabel: string;
  settingsLabel: string;
  logoutLabel: string;
  menuLabel: string;
  onLogout: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!rootRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="app-profile-menu">
      <button
        type="button"
        className="app-profile-menu__trigger"
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {accountLabel}
      </button>
      {isOpen ? (
        <div className="app-profile-menu__panel" role="menu">
          <Link
            to="/more"
            role="menuitem"
            className="app-profile-menu__item"
            onClick={() => setIsOpen(false)}
          >
            {servicesLabel}
          </Link>
          <Link
            to="/settings"
            role="menuitem"
            className="app-profile-menu__item"
            onClick={() => setIsOpen(false)}
          >
            {settingsLabel}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="app-profile-menu__item app-profile-menu__item--danger"
            onClick={() => {
              setIsOpen(false);
              void onLogout();
            }}
          >
            {logoutLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Layout({ children, navLinks = [], mobileNavLinks = [] }: LayoutProps) {
  const { copy } = useI18n();
  const { effectiveTheme, toggleTheme, accountLogin, accountDisplayName, clearSession } =
    useAppStore();
  const accountLabel = accountDisplayName || accountLogin || copy.common.userFallback;
  const hasMobileNav = mobileNavLinks.length > 0;
  const isAuthenticated = Boolean(accountLogin);
  const isNativeRuntime = Capacitor.isNativePlatform();
  const isIosShell = useIsIosShell();

  const spinTimeoutRef = useRef<number | null>(null);
  const [isIconSpinning, setIsIconSpinning] = useState(false);
  const initialRotation = effectiveTheme === "light" ? -12 : 12;
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
    "--soft-theme-icon-scale": effectiveTheme === "light" ? 1 : 1.06,
  };

  const handleThemeToggle = () => {
    const nextTheme = effectiveTheme === "light" ? "dark" : "light";
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

  const themeToggleLabel =
    effectiveTheme === "light" ? copy.common.themeDarkLabel : copy.common.themeLightLabel;

  return (
    <div className="app-shell-auth min-h-screen flex flex-col bg-background text-foreground">
      <div className="app-v3-background" aria-hidden="true">
        {!isNativeRuntime && !isIosShell ? <V3BackgroundDoodles /> : null}
        <div className="app-v3-decor app-v3-decor-a" />
        <div className="app-v3-decor app-v3-decor-b" />
        <div className="app-v3-decor app-v3-decor-c" />
        <div className="app-v3-noise" />
      </div>
      <header className="app-safe-top-header relative z-30 min-w-0 px-3 pt-3 sm:px-4 sm:pt-3">
        <div className="relative z-30 mx-auto max-w-5xl">
          <div className={isIosShell ? "block" : "md:hidden"}>
            <div className="app-mobile-header">
              <div className="app-mobile-header__row">
                <Link
                  to="/"
                  className="app-mobile-header__logo-link inline-flex shrink-0 items-center justify-center"
                  aria-label={copy.common.brandName}
                >
                  <img src="/pwa-icon.png" alt="" className="app-mobile-header__logo" />
                </Link>
                <div className="app-mobile-header__actions flex shrink-0 items-center">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/feedback"
                        className="app-header-utility-button inline-flex items-center justify-center p-0"
                        aria-label={copy.feedback.navShort}
                        title={copy.feedback.navShort}
                      >
                        <FeedbackIcon />
                        <span className="sr-only">{copy.feedback.navShort}</span>
                      </Link>
                      <ProfileMenu
                        accountLabel={accountLabel}
                        servicesLabel={copy.clientLayout.nav.more}
                        settingsLabel={copy.common.settings}
                        logoutLabel={copy.common.logoutFromAccount}
                        menuLabel={copy.common.profileMenuLabel}
                        onLogout={handleLogout}
                      />
                    </>
                  ) : (
                    <>
                      <LanguageSwitch className="app-header-language-switch" />
                      <button
                        type="button"
                        className="soft-theme-toggle app-header-theme-toggle"
                        onClick={handleThemeToggle}
                        aria-label={themeToggleLabel}
                        title={themeToggleLabel}
                      >
                        <span
                          className={[
                            "soft-theme-toggle__icon",
                            effectiveTheme === "light"
                              ? "soft-theme-toggle__icon--moon"
                              : "soft-theme-toggle__icon--sun",
                            isIconSpinning ? "soft-theme-toggle__icon--spin" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-hidden="true"
                          style={iconStyle}
                        >
                          {effectiveTheme === "light" ? <MoonIcon /> : <SunIcon />}
                        </span>
                      </button>
                      <Link to="/auth?mode=login" className="app-header-utility-button">
                        {copy.common.login}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={isIosShell ? "hidden" : "hidden md:block md:py-2"}>
            <div className="app-desktop-header relative z-20">
              <div className="app-desktop-header__row">
                <Link
                  to="/"
                  className="app-desktop-header__brand app-desktop-header__brand--compact"
                  aria-label={copy.common.brandName}
                >
                  <img src="/pwa-icon.png" alt="" className="app-desktop-header__logo" />
                </Link>

                <div className="app-desktop-header__actions">
                  {isAuthenticated ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <Link
                        to="/feedback"
                        className="app-header-utility-button inline-flex h-[2.72rem] w-[2.72rem] shrink-0 items-center justify-center p-0"
                        aria-label={copy.feedback.navShort}
                        title={copy.feedback.navShort}
                      >
                        <FeedbackIcon />
                        <span className="sr-only">{copy.feedback.navShort}</span>
                      </Link>
                      <ProfileMenu
                        accountLabel={accountLabel}
                        servicesLabel={copy.clientLayout.nav.more}
                        settingsLabel={copy.common.settings}
                        logoutLabel={copy.common.logoutFromAccount}
                        menuLabel={copy.common.profileMenuLabel}
                        onLogout={handleLogout}
                      />
                    </div>
                  ) : (
                    <>
                      <Link to="/auth?mode=login" className="app-header-utility-button">
                        {copy.common.login}
                      </Link>
                      <LanguageSwitch className="app-header-language-switch" />
                      <button
                        type="button"
                        className="soft-theme-toggle app-header-theme-toggle"
                        onClick={handleThemeToggle}
                        aria-label={themeToggleLabel}
                        title={themeToggleLabel}
                      >
                        <span
                          className={[
                            "soft-theme-toggle__icon",
                            effectiveTheme === "light"
                              ? "soft-theme-toggle__icon--moon"
                              : "soft-theme-toggle__icon--sun",
                            isIconSpinning ? "soft-theme-toggle__icon--spin" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-hidden="true"
                          style={iconStyle}
                        >
                          {effectiveTheme === "light" ? <MoonIcon /> : <SunIcon />}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {navLinks.length > 0 && (
              <div className="relative z-10 mt-3 px-2">
                <TopNav links={navLinks} />
              </div>
            )}
          </div>
        </div>
      </header>
      <main
        id="app-main-content"
        tabIndex={-1}
        className={[
          "app-main-shell relative z-[1] mx-auto flex-1 w-full max-w-5xl min-w-0 px-3 py-6 sm:px-6 sm:py-11",
          hasMobileNav ? "pb-28 md:pb-11" : "",
        ].join(" ")}
      >
        {children}
      </main>
      {hasMobileNav && <BottomTabBar links={mobileNavLinks} forceVisible={isIosShell} />}
    </div>
  );
}

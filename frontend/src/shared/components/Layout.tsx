/**
 * Общий layout: шапка с темой и навигация (переиспользуемый в client/admin).
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { Capacitor } from "@capacitor/core";
import { logout } from "@shared/api/auth";
import { setBearerToken } from "@shared/api/client";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import { cleanupDeviceSessionArtifacts } from "@shared/utils/sessionCleanup";
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
  mobileNavHidden?: boolean;
  hideHeader?: boolean;
  compactHiddenChrome?: boolean;
  showNotificationBell?: boolean;
  isNotificationBellActive?: boolean;
  notificationBellVariant?: "danger" | "warning";
  onNotificationBellClick?: (() => void) | null;
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

export function FeedbackIcon() {
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

export function NotificationBellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1.12rem] w-[1.12rem] fill-none stroke-current"
    >
      <path
        d="M9.25 18.25h5.5m-8-1.75h10.5a1 1 0 0 0 .8-1.6l-1.3-1.75v-2.65a4.75 4.75 0 1 0-9.5 0v2.65l-1.3 1.75a1 1 0 0 0 .8 1.6Z"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.35 18.25a1.65 1.65 0 0 0 3.3 0" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1.12rem] w-[1.12rem] fill-none stroke-current"
    >
      <path
        d="M12 12.25a4.05 4.05 0 1 0 0-8.1 4.05 4.05 0 0 0 0 8.1Z"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.75 20.1a7.4 7.4 0 0 1 14.5 0"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileMenu({
  accountLabel,
  servicesLabel,
  settingsLabel,
  logoutLabel,
  menuLabel,
  onLogout,
  iconOnly = false,
}: {
  accountLabel: string;
  servicesLabel: string;
  settingsLabel: string;
  logoutLabel: string;
  menuLabel: string;
  onLogout: () => Promise<void>;
  iconOnly?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { copy } = useI18n();

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

  useEffect(() => {
    setIsOpen(false);
  }, [location.key, location.pathname, location.search]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePageHide = () => {
      setIsOpen(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsOpen(false);
      }
    };

    const handlePopState = () => {
      setIsOpen(false);
    };

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen]);

  const handleMenuNavigate =
    (to: string) => (event: ReactMouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setIsOpen(false);
      window.requestAnimationFrame(() => {
        navigate(to);
      });
    };

  return (
    <div ref={rootRef} className="app-profile-menu">
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        title={copy.common.logoutConfirmTitle}
        description={copy.common.logoutConfirmDescription}
        confirmLabel={copy.common.logoutConfirmAction}
        cancelLabel={copy.common.cancel}
        confirmTone="danger"
        onCancel={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          void onLogout();
        }}
      />
      <button
        type="button"
        className={[
          "app-profile-menu__trigger",
          iconOnly ? "app-profile-menu__trigger--icon-only" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {iconOnly ? <ProfileIcon /> : accountLabel}
      </button>
      {isOpen ? (
        <div className="app-profile-menu__panel" role="menu">
          <Link
            to="/more"
            role="menuitem"
            className="app-profile-menu__item"
            onClick={handleMenuNavigate("/more")}
          >
            {servicesLabel}
          </Link>
          <Link
            to="/settings"
            role="menuitem"
            className="app-profile-menu__item"
            onClick={handleMenuNavigate("/settings")}
          >
            {settingsLabel}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="app-profile-menu__item app-profile-menu__item--danger"
            onClick={() => {
              setIsOpen(false);
              setIsLogoutConfirmOpen(true);
            }}
          >
            {logoutLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function HeaderUtilityActions({
  accountLabel,
  servicesLabel,
  settingsLabel,
  logoutLabel,
  menuLabel,
  onLogout,
  feedbackLabel,
  notificationLabel,
  showNotificationBell = false,
  isNotificationBellActive = false,
  notificationBellVariant = "danger",
  onNotificationBellClick = null,
}: {
  accountLabel: string;
  servicesLabel: string;
  settingsLabel: string;
  logoutLabel: string;
  menuLabel: string;
  onLogout: () => Promise<void>;
  feedbackLabel: string;
  notificationLabel: string;
  showNotificationBell?: boolean;
  isNotificationBellActive?: boolean;
  notificationBellVariant?: "danger" | "warning";
  onNotificationBellClick?: (() => void) | null;
}) {
  return (
    <>
      {showNotificationBell ? (
        <button
          type="button"
          onClick={onNotificationBellClick ?? undefined}
          className={[
            "app-header-utility-button app-header-icon-button app-header-notification-button inline-flex items-center justify-center p-0",
            isNotificationBellActive ? "app-header-notification-button--active" : "",
            isNotificationBellActive
              ? `app-header-notification-button--${notificationBellVariant}`
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={notificationLabel}
          title={notificationLabel}
        >
          <span className="app-header-notification-icon" aria-hidden="true">
            <NotificationBellIcon />
          </span>
          <span className="sr-only">{notificationLabel}</span>
        </button>
      ) : null}
      <Link
        to="/feedback"
        className="app-header-utility-button app-header-icon-button inline-flex items-center justify-center p-0"
        aria-label={feedbackLabel}
        title={feedbackLabel}
      >
        <FeedbackIcon />
        <span className="sr-only">{feedbackLabel}</span>
      </Link>
      <ProfileMenu
        accountLabel={accountLabel}
        servicesLabel={servicesLabel}
        settingsLabel={settingsLabel}
        logoutLabel={logoutLabel}
        menuLabel={menuLabel}
        onLogout={onLogout}
        iconOnly
      />
    </>
  );
}

export function Layout({
  children,
  navLinks = [],
  mobileNavLinks = [],
  mobileNavHidden = false,
  hideHeader = false,
  compactHiddenChrome = false,
  showNotificationBell = false,
  isNotificationBellActive = false,
  notificationBellVariant = "danger",
  onNotificationBellClick = null,
}: LayoutProps) {
  const { copy } = useI18n();
  const { effectiveTheme, toggleTheme, accountId, accountEmail, accountDisplayName, clearSession } =
    useAppStore();
  const accountLabel = accountDisplayName || accountEmail || copy.common.userFallback;
  const hasMobileNav = mobileNavLinks.length > 0;
  const hasVisibleMobileNav = hasMobileNav && !mobileNavHidden;
  const isAuthenticated = Boolean(accountId);
  const isNativeRuntime = Capacitor.isNativePlatform();
  const isIosShell = useIsIosShell();
  const shouldRenderDecorBackground = !isNativeRuntime && !isIosShell;

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
    const refreshToken = useAppStore.getState().refreshToken;
    try {
      await cleanupDeviceSessionArtifacts();
      await logout(refreshToken);
    } catch {
      // Локальный выход всё равно должен отработать, даже если сессия уже истекла.
    } finally {
      setBearerToken(null);
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
        {shouldRenderDecorBackground ? <V3BackgroundDoodles /> : null}
        {shouldRenderDecorBackground ? <div className="app-v3-decor app-v3-decor-a" /> : null}
        {shouldRenderDecorBackground ? <div className="app-v3-decor app-v3-decor-b" /> : null}
        {shouldRenderDecorBackground ? <div className="app-v3-decor app-v3-decor-c" /> : null}
        {shouldRenderDecorBackground ? <div className="app-v3-noise" /> : null}
      </div>
      <div className="app-shell-frame relative z-[1] flex min-h-screen flex-col bg-background">
        {!hideHeader ? (
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
                        <HeaderUtilityActions
                          accountLabel={accountLabel}
                          servicesLabel={copy.clientLayout.nav.more}
                          settingsLabel={copy.common.settings}
                          logoutLabel={copy.common.logoutFromAccount}
                          menuLabel={copy.common.profileMenuLabel}
                          onLogout={handleLogout}
                          feedbackLabel={copy.feedback.navShort}
                          notificationLabel={copy.clientLayout.pushPrompt.title}
                          showNotificationBell={showNotificationBell}
                          isNotificationBellActive={isNotificationBellActive}
                          notificationBellVariant={notificationBellVariant}
                          onNotificationBellClick={onNotificationBellClick}
                        />
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
                          <HeaderUtilityActions
                            accountLabel={accountLabel}
                            servicesLabel={copy.clientLayout.nav.more}
                            settingsLabel={copy.common.settings}
                            logoutLabel={copy.common.logoutFromAccount}
                            menuLabel={copy.common.profileMenuLabel}
                            onLogout={handleLogout}
                            feedbackLabel={copy.feedback.navShort}
                            notificationLabel={copy.clientLayout.pushPrompt.title}
                            showNotificationBell={showNotificationBell}
                            isNotificationBellActive={isNotificationBellActive}
                            notificationBellVariant={notificationBellVariant}
                            onNotificationBellClick={onNotificationBellClick}
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
        ) : null}
        <main
          id="app-main-content"
          tabIndex={-1}
          className={[
            "app-main-shell relative z-[1] mx-auto flex-1 w-full max-w-5xl min-w-0 px-3 sm:px-6",
            hideHeader
              ? compactHiddenChrome
                ? "app-main-shell--hidden-chrome bg-background pb-3 sm:pb-5"
                : "pt-3 pb-6 sm:pt-5 sm:pb-8"
              : "py-6 sm:py-11",
            hasVisibleMobileNav ? "pb-28 md:pb-11" : "",
          ].join(" ")}
        >
          {children}
        </main>
        {hasMobileNav && (
          <BottomTabBar
            links={mobileNavLinks}
            forceVisible={isIosShell}
            hidden={mobileNavHidden}
          />
        )}
      </div>
    </div>
  );
}

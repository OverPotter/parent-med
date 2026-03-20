/**
 * Общий layout: шапка с темой и навигация (переиспользуемый в client/admin).
 */

import { Link } from "react-router-dom";
import { logout } from "@shared/api/auth";
import { useAppStore } from "@shared/store/useAppStore";
import { BottomTabBar } from "./BottomTabBar";
import { TopNav, type LayoutNavLink } from "./TopNav";

interface LayoutProps {
  children: React.ReactNode;
  /** Ссылки для навигации (client или admin). */
  navLinks?: LayoutNavLink[];
  mobileNavLinks?: LayoutNavLink[];
  showCurrentFamily?: boolean;
}

export function Layout({
  children,
  navLinks = [],
  mobileNavLinks = [],
  showCurrentFamily = false,
}: LayoutProps) {
  const {
    theme,
    toggleTheme,
    currentFamilyName,
    accountLogin,
    accountEmail,
    accountDisplayName,
    clearSession,
  } = useAppStore();
  const accountLabel = accountDisplayName || accountLogin;
  const hasMobileNav = mobileNavLinks.length > 0;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Локальный выход всё равно должен отработать, даже если сессия уже истекла.
    } finally {
      clearSession();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="min-w-0 px-2 pt-2 sm:px-4 sm:pt-3">
        <div className="mx-auto max-w-5xl">
          <div className="md:hidden">
            <div className="soft-nav-shell rounded-[26px] px-3 py-3">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <img src="/pwa-icon.svg" alt="" className="h-8 w-8 rounded-2xl" />
                <span className="text-sm font-semibold tracking-[0.04em] text-primary">
                  Parent Med
                </span>
              </Link>
            </div>
          </div>

          <div className="hidden md:block md:py-2">
            <div className="soft-nav-shell rounded-[28px] px-4 py-3">
              <div className="flex items-center justify-between gap-5">
                <Link to="/" className="inline-flex min-w-0 items-center gap-3">
                  <img src="/pwa-icon.svg" alt="" className="h-9 w-9 rounded-2xl" />
                  <p className="truncate text-lg font-semibold tracking-[0.03em] text-primary">
                    Parent Med
                  </p>
                </Link>

                <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                  {showCurrentFamily && currentFamilyName && (
                    <span className="soft-pill max-w-[12rem] truncate rounded-full px-3.5 py-1.5 text-xs">
                      {currentFamilyName}
                    </span>
                  )}
                  {accountLogin && (
                    <>
                      {accountLabel && (
                        <span className="soft-pill max-w-[12rem] truncate rounded-full px-3.5 py-1.5 text-xs">
                          {accountLabel}
                        </span>
                      )}
                      <span className="soft-pill max-w-[14rem] truncate rounded-full px-3.5 py-1.5 text-xs">
                        @{accountLogin}
                      </span>
                      {accountEmail && (
                        <span className="soft-pill max-w-[14rem] truncate rounded-full px-3.5 py-1.5 text-xs">
                          {accountEmail}
                        </span>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    className="soft-button-secondary rounded-full px-3.5 py-1.5 text-xs"
                    onClick={toggleTheme}
                    aria-label={theme === "light" ? "Тёмная тема" : "Светлая тема"}
                  >
                    {theme === "light" ? "Ночь" : "День"}
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
          "mx-auto flex-1 w-full max-w-5xl min-w-0 px-4 py-9 sm:px-6 sm:py-11",
          hasMobileNav ? "pb-28 md:pb-11" : "",
        ].join(" ")}
      >
        {children}
      </main>
      {hasMobileNav && <BottomTabBar links={mobileNavLinks} />}
    </div>
  );
}

/**
 * Общий layout: шапка с темой и навигация (переиспользуемый в client/admin).
 */

import { Link, NavLink } from "react-router-dom";
import { logout } from "@shared/api/auth";
import { useAppStore } from "@shared/store/useAppStore";

interface LayoutProps {
  children: React.ReactNode;
  /** Ссылки для навигации (client или admin). */
  navLinks?: { to: string; label: string }[];
  showCurrentFamily?: boolean;
}

export function Layout({ children, navLinks = [], showCurrentFamily = false }: LayoutProps) {
  const { theme, toggleTheme, currentFamilyName, accountEmail, clearSession } = useAppStore();

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
      <header className="sticky top-0 z-10 min-w-0 border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4 py-6">
            <Link to="/" className="min-w-0">
              <p className="truncate text-base font-semibold tracking-[0.04em] text-primary sm:text-lg">
                Parent Med
              </p>
              <p className="mt-1 text-sm leading-7 text-muted">Семейный журнал здоровья</p>
            </Link>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {showCurrentFamily && currentFamilyName && (
                <span className="soft-pill max-w-full truncate rounded-full px-3.5 py-1.5 text-xs">
                  {currentFamilyName}
                </span>
              )}
              {accountEmail && (
                <span className="soft-pill max-w-full truncate rounded-full px-3.5 py-1.5 text-xs">
                  {accountEmail}
                </span>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className="soft-button-secondary rounded-full px-3.5 py-1.5 text-xs"
                aria-label={theme === "light" ? "Тёмная тема" : "Светлая тема"}
              >
                {theme === "light" ? "Ночь" : "День"}
              </button>
              {accountEmail && (
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

          {navLinks.length > 0 && (
            <nav className="-mx-1 flex gap-2 overflow-x-auto pb-6">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    [
                      "whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition-colors",
                      isActive ? "soft-tab-active" : "soft-tab",
                    ].join(" ")
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto flex-1 w-full max-w-5xl min-w-0 px-4 py-9 sm:px-6 sm:py-11">
        {children}
      </main>
    </div>
  );
}

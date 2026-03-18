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
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur min-w-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link to="/" className="block min-w-0">
                <p className="truncate text-lg font-semibold tracking-[0.08em] text-primary">
                  Parent Med
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                  Семейный журнал здоровья
                </p>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {showCurrentFamily && currentFamilyName && (
                <span className="max-w-full truncate border border-border bg-muted/10 px-3 py-1.5 text-xs text-muted">
                  Семья: {currentFamilyName}
                </span>
              )}
              {accountEmail && (
                <span className="max-w-full truncate border border-border bg-background px-3 py-1.5 text-xs text-muted">
                  {accountEmail}
                </span>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className="border border-border px-3 py-1.5 text-xs text-muted hover:bg-muted/30"
                aria-label={theme === "light" ? "Тёмная тема" : "Светлая тема"}
              >
                {theme === "light" ? "Тема: ночь" : "Тема: день"}
              </button>
              {accountEmail && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted/30"
                >
                  Выйти
                </button>
              )}
            </div>
          </div>

          {navLinks.length > 0 && (
            <nav className="-mx-1 flex gap-2 overflow-x-auto pb-4">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    [
                      "whitespace-nowrap border px-4 py-2 text-sm transition-colors",
                      isActive
                        ? "border-primary/30 bg-primary text-white"
                        : "border-border bg-background text-foreground hover:bg-muted/30",
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
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 min-w-0">
        {children}
      </main>
    </div>
  );
}

/**
 * Общий layout: шапка с темой и навигация (переиспользуемый в client/admin).
 */

import { Link } from "react-router-dom";
import { useAppStore } from "@shared/store/useAppStore";

interface LayoutProps {
  children: React.ReactNode;
  /** Ссылки для навигации (client или admin). */
  navLinks?: { to: string; label: string }[];
  showCurrentFamily?: boolean;
}

export function Layout({ children, navLinks = [], showCurrentFamily = false }: LayoutProps) {
  const { theme, toggleTheme, currentFamilyName } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur min-w-0">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="truncate font-semibold text-primary">
            Parent Med
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4 min-w-0">
            {showCurrentFamily && currentFamilyName && (
              <span className="hidden max-w-40 truncate rounded-full border border-border px-2 py-1 text-xs text-muted sm:inline">
                Семья: {currentFamilyName}
              </span>
            )}
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm text-foreground hover:text-primary truncate"
              >
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md p-2 text-muted hover:bg-border"
              aria-label={theme === "light" ? "Тёмная тема" : "Светлая тема"}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 min-w-0">
        {children}
      </main>
    </div>
  );
}

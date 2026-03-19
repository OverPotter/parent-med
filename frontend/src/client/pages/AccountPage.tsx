import { logout } from "@shared/api/auth";
import { Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";

export function AccountPage() {
  const accountEmail = useAppStore((s) => s.accountEmail);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const clearSession = useAppStore((s) => s.clearSession);
  const handleChangePassword = () => {
    window.alert("Смена пароля появится позже, когда будет готов backend API.");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Локальный выход остаётся приоритетом.
    } finally {
      clearSession();
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Аккаунт</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Личные настройки и действия, которые не должны мешать ежедневной работе с детьми и
          записями.
        </p>
      </div>

      <Surface className="p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Профиль</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoCard label="Email" value={accountEmail || "Не удалось получить email"} />
          <InfoCard label="Тема" value={theme === "light" ? "Светлая" : "Тёмная"} />
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Быстрые действия</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleChangePassword}
            className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
          >
            Сменить пароль
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
          >
            Переключить на {theme === "light" ? "тёмную" : "светлую"} тему
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
          >
            Выйти из аккаунта
          </button>
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Безопасность</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Кнопка смены пароля уже показана в интерфейсе, но пока работает как заглушка. Когда
          появится API, здесь можно будет подключить полноценную форму.
        </p>
      </Surface>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-card rounded-[24px] px-4 py-4 sm:px-5">
      <p className="text-xs tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-3 text-base font-medium text-foreground">{value}</p>
    </div>
  );
}

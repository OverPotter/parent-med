/**
 * Публичная стартовая страница: о сервисе, регистрация и вход.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, register } from "@shared/api/auth";
import { AuthPasswordField, RememberMeCard } from "@shared/components/AuthFormControls";
import { Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";

type Mode = "login" | "register";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("register");
  const [loginValue, setLoginValue] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAppStore((s) => s.setSession);

  const loginMutation = useMutation({
    mutationFn: (payload: { login: string; password: string; remember_me: boolean }) =>
      login(payload),
    onSuccess: (data) => {
      setSession(data);
      setError(null);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка входа");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: {
      login: string;
      email?: string;
      password: string;
      display_name?: string;
      relationship_label?: string;
      phone?: string;
      remember_me: boolean;
    }) => register(payload),
    onSuccess: (data) => {
      setSession(data);
      setError(null);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка регистрации");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLogin = loginValue.trim();
    const trimmedEmail = email.trim();
    if (!trimmedLogin || password.length < 6) {
      return;
    }
    if (mode === "register" && password !== passwordConfirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (mode === "login") {
      setError(null);
      loginMutation.mutate({ login: trimmedLogin, password, remember_me: rememberMe });
      return;
    }
    setError(null);
    registerMutation.mutate({
      login: trimmedLogin,
      email: trimmedEmail || undefined,
      password,
      display_name: displayName.trim() || undefined,
      relationship_label: relationshipLabel.trim() || undefined,
      phone: phone.trim() || undefined,
      remember_me: rememberMe,
    });
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;
  const passwordsMismatch =
    mode === "register" && passwordConfirm.length > 0 && password !== passwordConfirm;
  const isRegisterMode = mode === "register";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1fr_0.92fr] lg:items-start">
        <section className="min-w-0">
          <span className="soft-pill inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
            Parent Med
          </span>
          <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Семейный кабинет для детей, лекарств и истории болезни.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            У каждого взрослого свой личный аккаунт. Внутри семьи остаются общими дети, домашняя
            аптечка, эпизоды болезни и журнал приёма лекарств.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="soft-card rounded-[24px] p-4">
              <h2 className="text-sm font-medium text-foreground">О семье</h2>
              <p className="mt-2 text-sm leading-5 text-muted">
                Общий контекст для родителей и опекунов.
              </p>
            </div>
            <div className="soft-card rounded-[24px] p-4">
              <h2 className="text-sm font-medium text-foreground">О детях</h2>
              <p className="mt-2 text-sm leading-5 text-muted">Профили детей, вес и наблюдение.</p>
            </div>
            <div className="soft-card rounded-[24px] p-4">
              <h2 className="text-sm font-medium text-foreground">О лекарствах</h2>
              <p className="mt-2 text-sm leading-5 text-muted">
                Аптечка, напоминания и история приёмов.
              </p>
            </div>
          </div>
        </section>

        <Surface className="overflow-hidden p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-foreground">Начать работу</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Зарегистрируйте свой аккаунт или войдите в уже созданный. Семья создастся автоматически,
            а второго взрослого можно будет пригласить позже.
          </p>

          <div className="soft-panel-muted mt-5 flex rounded-[18px] p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                mode === "login" ? "soft-tab-active" : "soft-tab"
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                mode === "register" ? "soft-tab-active" : "soft-tab"
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="soft-panel rounded-[24px] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Обязательные поля</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Для входа и быстрой регистрации нужен только логин и пароль.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  className="soft-button-secondary shrink-0 rounded-full px-3 py-1.5 text-xs"
                >
                  {isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <div className={`grid gap-3 ${isRegisterMode ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                  <label className="block">
                    <span className="mb-2 block text-sm text-muted">Логин</span>
                    <input
                      type="text"
                      value={loginValue}
                      onChange={(e) => setLoginValue(e.target.value)}
                      className="soft-input w-full rounded-2xl px-4 py-3"
                      placeholder="Например: mama_anya"
                    />
                  </label>
                </div>

                <div className={`grid gap-3 ${isRegisterMode ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                  <AuthPasswordField
                    label="Пароль"
                    value={password}
                    onChange={setPassword}
                    placeholder="Минимум 6 символов"
                    isVisible={isPasswordVisible}
                  />
                  {isRegisterMode && (
                    <AuthPasswordField
                      label="Повторите пароль"
                      value={passwordConfirm}
                      onChange={setPasswordConfirm}
                      placeholder="Повторите пароль"
                      isVisible={isPasswordVisible}
                    />
                  )}
                </div>
              </div>
            </div>

            <RememberMeCard checked={rememberMe} onChange={setRememberMe} />

            {isRegisterMode && (
              <details className="soft-panel-muted rounded-[24px] p-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                  Дополнительные поля
                </summary>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Можно оставить пустым и вернуться к этому позже.
                </p>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm text-muted">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="soft-input w-full rounded-2xl px-4 py-3"
                    placeholder="you@example.com"
                  />
                  <span className="mt-2 block text-xs text-muted">
                    Для beta необязательно. Пригодится позже для восстановления доступа.
                  </span>
                </label>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm text-muted">Как показывать вас в семье</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="soft-input w-full rounded-2xl px-4 py-3"
                    placeholder="Например: Мама Аня"
                  />
                  <span className="mt-2 block text-xs text-muted">
                    Если пусто, используем логин.
                  </span>
                </label>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm text-muted">Кто вы в семье</span>
                    <input
                      type="text"
                      value={relationshipLabel}
                      onChange={(e) => setRelationshipLabel(e.target.value)}
                      className="soft-input w-full rounded-2xl px-4 py-3"
                      placeholder="Например: мама, папа, няня"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm text-muted">Телефон</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="soft-input w-full rounded-2xl px-4 py-3"
                      placeholder="+375 ..."
                    />
                  </label>
                </div>
              </details>
            )}

            {passwordsMismatch && (
              <p className="soft-note-warning rounded-2xl p-3 text-sm">Пароли должны совпадать.</p>
            )}

            {error && <p className="soft-note-danger rounded-2xl p-3 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={
                isPending ||
                !loginValue.trim() ||
                password.length < 6 ||
                (isRegisterMode && (!passwordConfirm || password !== passwordConfirm))
              }
              className="soft-button-primary w-full rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
            >
              {mode === "login"
                ? isPending
                  ? "Входим…"
                  : "Войти"
                : isPending
                  ? "Регистрируем…"
                  : "Создать аккаунт"}
            </button>
          </form>
        </Surface>
      </div>
    </div>
  );
}

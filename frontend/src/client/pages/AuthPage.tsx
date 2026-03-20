/**
 * Экран авторизации: вход и регистрация без лендингового контента.
 */

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, register } from "@shared/api/auth";
import { AuthPasswordField, RememberMeCard } from "@shared/components/AuthFormControls";
import { Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";
import { Link, useSearchParams } from "react-router-dom";

type Mode = "login" | "register";

export function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const [mode, setMode] = useState<Mode>(requestedMode === "login" ? "login" : "register");
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

  useEffect(() => {
    setMode(requestedMode === "login" ? "login" : "register");
  }, [requestedMode]);

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
  const pageTitle = isRegisterMode ? "Создать аккаунт" : "Войти в аккаунт";
  const pageDescription = isRegisterMode
    ? "Для beta достаточно логина и пароля. Остальные данные можно добавить позже в профиле семьи."
    : "Войдите под своим логином, чтобы попасть в общую семейную базу детей, аптечки и болезней.";
  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setSearchParams(nextMode === "register" ? { mode: "register" } : { mode: "login" });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/pwa-icon.svg" alt="" className="h-10 w-10 rounded-2xl" />
            <div>
              <p className="text-sm font-semibold tracking-[0.06em] text-primary">Parent Med</p>
              <p className="text-xs text-muted">Вернуться к описанию сервиса</p>
            </div>
          </Link>
          <Link to="/" className="soft-button-secondary rounded-full px-4 py-2 text-sm">
            На главную
          </Link>
        </div>

        <div className="mx-auto mt-8 max-w-2xl text-center">
          <span className="soft-pill inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
            Авторизация
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {pageTitle}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted sm:text-base">{pageDescription}</p>
        </div>

        <Surface className="mx-auto mt-8 max-w-[34rem] overflow-hidden p-5 sm:p-6">
          <div className="soft-panel-muted flex rounded-[18px] p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                mode === "login" ? "soft-tab-active" : "soft-tab"
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
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
                    Сначала только логин и пароль. Остальное можно заполнить уже после входа.
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
                  Дополнительные поля профиля
                </summary>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Они не мешают началу работы. Если оставить пусто, сервис подставит логин как имя.
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
                  <span className="mb-2 block text-sm text-muted">Имя в семье</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="soft-input w-full rounded-2xl px-4 py-3"
                    placeholder="Например: Аня"
                  />
                  <span className="mt-2 block text-xs text-muted">
                    Так имя будет показано в семье и в истории действий. Если пусто, используем
                    логин.
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
                      placeholder="Например: мама"
                    />
                    <span className="mt-2 block text-xs text-muted">
                      Короткая подпись рядом с именем: мама, папа, няня.
                    </span>
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

            <p className="text-center text-xs leading-6 text-muted">
              Если вас уже пригласили в семью, откройте ссылку приглашения из сообщения. Она сама
              приведёт в нужный flow.
            </p>
          </form>
        </Surface>
      </div>
    </div>
  );
}

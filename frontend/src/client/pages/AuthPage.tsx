/**
 * Экран авторизации: вход и регистрация без лендингового контента.
 */

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, register } from "@shared/api/auth";
import { AnalyticsEvents, normalizeClientError, trackEvent } from "@shared/analytics";
import { V3BackgroundDoodles } from "@shared/components/V3BackgroundDoodles";
import { useAppStore } from "@shared/store/useAppStore";
import { Link, useSearchParams } from "react-router-dom";

type Mode = "login" | "register";

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function FieldIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={joinClasses(
        "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2",
        className
      )}
    >
      {children}
    </span>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current">
      <path d="M4 7.5h16v9A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-9Z" strokeWidth="1.8" />
      <path d="m5 8 7 5 7-5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current">
      <path d="M7.5 10.25V8.5a4.5 4.5 0 1 1 9 0v1.75" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="5" y="10.25" width="14" height="9.75" rx="2.5" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current">
      <path
        d="m4.5 10 3.2 3.2L15.5 5.8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AuthField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  name,
  hint,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  name?: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="auth-v3-label">{label}</span>
      <div className="relative">
        <input
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="auth-v3-input w-full"
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {icon ? <FieldIcon className="auth-v3-input-icon">{icon}</FieldIcon> : null}
      </div>
      {hint ? <span className="auth-v3-hint">{hint}</span> : null}
    </label>
  );
}

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
      trackEvent(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { entry: "auth_page" });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка входа");
      trackEvent(AnalyticsEvents.AUTH_ERROR, {
        mode: "login",
        message: normalizeClientError(err),
      });
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
      trackEvent(AnalyticsEvents.AUTH_REGISTER_SUCCESS, { entry: "auth_page" });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка регистрации");
      trackEvent(AnalyticsEvents.AUTH_ERROR, {
        mode: "register",
        message: normalizeClientError(err),
      });
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
  const pageTitle = isRegisterMode ? "Регистрация" : "Вход";
  const pageDescription = isRegisterMode
    ? "Создайте семейный доступ к данным ребёнка, аптечке и общим событиям по здоровью."
    : "Быстрый доступ к данным ребёнка, аптечке и общим записям о здоровье.";
  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setSearchParams(nextMode === "register" ? { mode: "register" } : { mode: "login" });
    setError(null);
  };

  const submitLabel =
    mode === "login"
      ? isPending
        ? "Входим…"
        : "Войти"
      : isPending
        ? "Регистрируем…"
        : "Создать аккаунт";

  return (
    <div className="auth-v3-page min-h-screen text-foreground">
      <V3BackgroundDoodles className="auth-v3-doodle-layer" />
      <div className="auth-v3-orb auth-v3-orb-left" aria-hidden="true" />
      <div className="auth-v3-orb auth-v3-orb-right" aria-hidden="true" />
      <div className="auth-v3-noise" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(22rem,30rem)] lg:items-center">
          <section className="auth-v3-hero">
            <div className="auth-v3-header">
              <Link to="/" className="auth-v3-header-brand">
                <img
                  src="/pwa-icon.svg"
                  alt=""
                  className="h-11 w-11 rounded-[18px] shadow-[0_16px_32px_rgba(138,123,191,0.2)]"
                />
                <div>
                  <p className="auth-v3-brand">Parent Med</p>
                  <p className="auth-v3-caption">Система здоровья семьи</p>
                </div>
              </Link>
              <Link to="/" className="auth-v3-ghost-button">
                На главную
              </Link>
            </div>

            <div className="mt-10 max-w-xl">
              <h1 className="auth-v3-title">{pageTitle}</h1>
              <p className="auth-v3-subtitle mt-4">{pageDescription}</p>
            </div>

            <div className="auth-v3-feature-grid mt-8 hidden lg:grid">
              <article className="auth-v3-feature-card">
                <p className="auth-v3-feature-kicker">Семейный доступ</p>
                <h2 className="auth-v3-feature-title">
                  Один доступ к детям, болезням и лекарствам
                </h2>
                <p className="auth-v3-feature-text">
                  У входа и регистрации теперь единый спокойный сценарий в палитре V3.
                </p>
              </article>
              <article className="auth-v3-feature-card auth-v3-feature-card-soft">
                <p className="auth-v3-feature-kicker">Быстрый старт</p>
                <p className="auth-v3-feature-text">
                  Для начала достаточно логина и пароля. Остальные поля можно заполнить позже в
                  профиле семьи.
                </p>
              </article>
            </div>
          </section>

          <section className="auth-v3-panel">
            <div
              className="auth-v3-toggle"
              role="tablist"
              aria-label="Переключение режима авторизации"
            >
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={joinClasses(
                  "auth-v3-toggle-button",
                  mode === "login" && "auth-v3-toggle-button-active"
                )}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={joinClasses(
                  "auth-v3-toggle-button",
                  mode === "register" && "auth-v3-toggle-button-active"
                )}
              >
                Регистрация
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="auth-v3-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="auth-v3-section-title">
                      {mode === "login" ? "Вход" : "Регистрация"}
                    </p>
                    <p className="auth-v3-section-copy">
                      {isRegisterMode
                        ? "Создайте учётную запись семьи. Основные поля сверху, профильные данные можно раскрыть ниже."
                        : "Войдите по логину и паролю, чтобы быстро вернуться к семейной базе."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    className="auth-v3-inline-button"
                  >
                    {isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <AuthField
                    label={mode === "login" ? "Логин" : "Логин для входа"}
                    value={loginValue}
                    onChange={setLoginValue}
                    placeholder={mode === "login" ? "Email или логин" : "Придумайте логин"}
                    name="username"
                    autoComplete="username"
                    icon={<MailIcon />}
                    hint={
                      isRegisterMode
                        ? "Логин используется только для входа. Отображаемое имя семьи можно задать отдельно."
                        : undefined
                    }
                  />

                  <div className={joinClasses("grid gap-4", isRegisterMode && "sm:grid-cols-2")}>
                    <AuthField
                      label="Пароль"
                      value={password}
                      onChange={setPassword}
                      placeholder="Минимум 6 символов"
                      type={isPasswordVisible ? "text" : "password"}
                      name="current-password"
                      autoComplete={isRegisterMode ? "new-password" : "current-password"}
                      icon={<LockIcon />}
                    />
                    {isRegisterMode ? (
                      <AuthField
                        label="Повторите пароль"
                        value={passwordConfirm}
                        onChange={setPasswordConfirm}
                        placeholder="Повторите пароль"
                        type={isPasswordVisible ? "text" : "password"}
                        name="new-password-confirm"
                        autoComplete="new-password"
                        icon={<LockIcon />}
                      />
                    ) : null}
                  </div>

                  <div className="auth-v3-row">
                    <label className="auth-v3-checkbox">
                      <span className="auth-v3-checkbox-box">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(event) => setRememberMe(event.target.checked)}
                          className="peer absolute inset-0 cursor-pointer opacity-0"
                        />
                        <span className="auth-v3-checkbox-mark">
                          <CheckIcon />
                        </span>
                      </span>
                      <span>Запомнить меня</span>
                    </label>
                    <button type="button" className="auth-v3-linkish">
                      Забыли пароль?
                    </button>
                  </div>
                </div>
              </div>

              {isRegisterMode ? (
                <details className="auth-v3-secondary-card">
                  <summary className="auth-v3-summary">Дополнительные поля профиля</summary>
                  <p className="auth-v3-section-copy mt-2">
                    Эти данные необязательны на старте, но помогут корректно подписывать участников
                    семьи.
                  </p>
                  <div className="mt-4 space-y-4">
                    <AuthField
                      label="Email"
                      value={email}
                      onChange={setEmail}
                      placeholder="you@example.com"
                      type="email"
                      name="email"
                      autoComplete="email"
                    />
                    <AuthField
                      label="Имя в семье"
                      value={displayName}
                      onChange={setDisplayName}
                      placeholder="Например: Аня"
                      name="display-name"
                      autoComplete="name"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <AuthField
                        label="Роль в семье"
                        value={relationshipLabel}
                        onChange={setRelationshipLabel}
                        placeholder="Например: мама"
                        name="relationship-label"
                        autoComplete="organization-title"
                      />
                      <AuthField
                        label="Телефон"
                        value={phone}
                        onChange={setPhone}
                        placeholder="+375 ..."
                        type="tel"
                        name="tel"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                </details>
              ) : null}

              {passwordsMismatch ? (
                <p className="auth-v3-error auth-v3-error-warning">Пароли должны совпадать.</p>
              ) : null}

              {error ? <p className="auth-v3-error">{error}</p> : null}

              <button
                type="submit"
                disabled={
                  isPending ||
                  !loginValue.trim() ||
                  password.length < 6 ||
                  (isRegisterMode && (!passwordConfirm || password !== passwordConfirm))
                }
                className="auth-v3-submit"
              >
                {submitLabel}
              </button>

              <p className="auth-v3-footer-note">
                Если вас уже пригласили в семью, откройте ссылку приглашения из сообщения. Она сама
                приведёт в нужный сценарий.
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

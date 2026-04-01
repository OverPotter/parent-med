/**
 * Экран авторизации: вход и регистрация без лендингового контента.
 */

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, register } from "@shared/api/auth";
import { AnalyticsEvents, normalizeClientError, trackEvent } from "@shared/analytics";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import { V3BackgroundDoodles } from "@shared/components/V3BackgroundDoodles";
import { useI18n } from "@shared/hooks/useI18n";
import type { AppLanguage } from "@shared/i18n";
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current">
      <path
        d="M2.75 12s3.5-6 9.25-6 9.25 6 9.25 6-3.5 6-9.25 6S2.75 12 2.75 12Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.85" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current">
      <path d="M3.5 4.5 20.5 19.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M10.6 5.2A10.4 10.4 0 0 1 12 5.1c5.75 0 9.25 6 9.25 6a17.7 17.7 0 0 1-3.48 4.08M6.96 8.08A17.16 17.16 0 0 0 2.75 12s3.5 6 9.25 6c1.5 0 2.85-.41 4.06-1.03"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.88 9.88A3 3 0 0 0 14.12 14.12"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function getLocalizedAuthError(
  detail: string | undefined,
  language: AppLanguage,
  fallback: string
) {
  if (!detail) {
    return fallback;
  }

  if (language === "ru") {
    return detail;
  }

  const knownMessages: Record<string, string> = {
    "Неверный логин или пароль": "Invalid login or password.",
    "Аккаунт с таким логином уже существует": "An account with this login already exists.",
    "Аккаунт с таким email уже существует": "An account with this email already exists.",
  };

  return knownMessages[detail] ?? fallback;
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1rem] w-[1rem] fill-none stroke-current"
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
      className="h-[1rem] w-[1rem] fill-none stroke-current"
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
  action,
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
  action?: React.ReactNode;
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
        {action ? (
          <div className="auth-v3-input-action">{action}</div>
        ) : icon ? (
          <FieldIcon className="auth-v3-input-icon">{icon}</FieldIcon>
        ) : null}
      </div>
      {hint ? <span className="auth-v3-hint">{hint}</span> : null}
    </label>
  );
}

export function AuthPage() {
  const { copy, language } = useI18n();
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
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
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
      setError(
        getLocalizedAuthError(err.response?.data?.detail, language, copy.auth.errors.loginFailed)
      );
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
      setError(
        getLocalizedAuthError(err.response?.data?.detail, language, copy.auth.errors.registerFailed)
      );
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
      setError(copy.auth.errors.passwordsMismatch);
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
  const pageTitle = isRegisterMode ? copy.auth.page.registerTitle : copy.auth.page.loginTitle;
  const pageDescription = isRegisterMode
    ? copy.auth.page.registerDescription
    : copy.auth.page.loginDescription;
  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setSearchParams(nextMode === "register" ? { mode: "register" } : { mode: "login" });
    setError(null);
  };

  const submitLabel =
    mode === "login"
      ? isPending
        ? copy.auth.actions.loginLoading
        : copy.auth.actions.login
      : isPending
        ? copy.auth.actions.registerLoading
        : copy.auth.actions.register;

  return (
    <div className="auth-v3-page min-h-screen text-foreground">
      <V3BackgroundDoodles className="auth-v3-doodle-layer" dense />
      <div className="auth-v3-orb auth-v3-orb-left" aria-hidden="true" />
      <div className="auth-v3-orb auth-v3-orb-right" aria-hidden="true" />
      <div className="auth-v3-noise" aria-hidden="true" />

      <div className="auth-v3-shell">
        <section className="auth-v3-stage">
          <div className="auth-v3-header">
            <Link to="/" className="auth-v3-header-brand">
              <img
                src="/pwa-icon.png"
                alt=""
                className="h-10 w-10 rounded-[1.15rem] shadow-[0_16px_32px_rgba(138,123,191,0.18)]"
              />
              <BrandWordmark className="auth-v3-header-brand-text" />
            </Link>
            <div className="auth-v3-header-actions">
              <LanguageSwitch />
              <button
                type="button"
                className="auth-v3-theme-button"
                onClick={toggleTheme}
                aria-label={
                  theme === "light" ? copy.common.themeDarkLabel : copy.common.themeLightLabel
                }
                title={theme === "light" ? copy.common.themeDarkLabel : copy.common.themeLightLabel}
              >
                <span aria-hidden="true">{theme === "light" ? <MoonIcon /> : <SunIcon />}</span>
                <span className="auth-v3-theme-button-text">
                  {theme === "light" ? copy.common.themeDarkText : copy.common.themeLightText}
                </span>
              </button>
              <Link to="/" className="auth-v3-ghost-button auth-v3-home-link">
                {copy.common.goHome}
              </Link>
            </div>
          </div>
          <div className="auth-v3-mobile-home-wrap">
            <Link to="/" className="auth-v3-ghost-button auth-v3-mobile-home-link">
              {copy.common.goHome}
            </Link>
          </div>

          <div className="auth-v3-hero">
            <h1 className="auth-v3-title">{pageTitle}</h1>
            <p className="auth-v3-subtitle mt-4">{pageDescription}</p>
          </div>

          <section className="auth-v3-panel auth-v3-panel-compact">
            <div className="auth-v3-toggle" role="tablist" aria-label={copy.auth.page.toggleLabel}>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={joinClasses(
                  "auth-v3-toggle-button",
                  mode === "login" && "auth-v3-toggle-button-active"
                )}
              >
                {copy.auth.page.loginTab}
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={joinClasses(
                  "auth-v3-toggle-button",
                  mode === "register" && "auth-v3-toggle-button-active"
                )}
              >
                {copy.auth.page.registerTab}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="auth-v3-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="auth-v3-section-title">
                      {mode === "login"
                        ? copy.auth.page.loginCardTitle
                        : copy.auth.page.registerCardTitle}
                    </p>
                    <p className="auth-v3-section-copy">
                      {isRegisterMode
                        ? copy.auth.page.registerCardCopy
                        : copy.auth.page.loginCardCopy}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <AuthField
                    label={
                      mode === "login" ? copy.auth.fields.login : copy.auth.fields.loginForEntry
                    }
                    value={loginValue}
                    onChange={setLoginValue}
                    placeholder={
                      mode === "login"
                        ? copy.auth.fields.loginPlaceholder
                        : copy.auth.fields.loginPlaceholderRegister
                    }
                    name="username"
                    autoComplete="username"
                    icon={<MailIcon />}
                    hint={isRegisterMode ? copy.auth.fields.loginHint : undefined}
                  />

                  <div className={joinClasses("grid gap-4", isRegisterMode && "sm:grid-cols-2")}>
                    <AuthField
                      label={copy.auth.fields.password}
                      value={password}
                      onChange={setPassword}
                      placeholder={copy.auth.fields.passwordPlaceholder}
                      type={isPasswordVisible ? "text" : "password"}
                      name="current-password"
                      autoComplete={isRegisterMode ? "new-password" : "current-password"}
                      action={
                        <button
                          type="button"
                          className="auth-v3-input-toggle"
                          onClick={() => setIsPasswordVisible((current) => !current)}
                          aria-label={
                            isPasswordVisible
                              ? copy.auth.actions.hidePassword
                              : copy.auth.actions.showPassword
                          }
                          title={
                            isPasswordVisible
                              ? copy.auth.actions.hidePassword
                              : copy.auth.actions.showPassword
                          }
                        >
                          {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      }
                    />
                    {isRegisterMode ? (
                      <AuthField
                        label={copy.auth.fields.passwordConfirm}
                        value={passwordConfirm}
                        onChange={setPasswordConfirm}
                        placeholder={copy.auth.fields.passwordConfirmPlaceholder}
                        type={isPasswordVisible ? "text" : "password"}
                        name="new-password-confirm"
                        autoComplete="new-password"
                        action={
                          <button
                            type="button"
                            className="auth-v3-input-toggle"
                            onClick={() => setIsPasswordVisible((current) => !current)}
                            aria-label={
                              isPasswordVisible
                                ? copy.auth.actions.hidePassword
                                : copy.auth.actions.showPassword
                            }
                            title={
                              isPasswordVisible
                                ? copy.auth.actions.hidePassword
                                : copy.auth.actions.showPassword
                            }
                          >
                            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        }
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
                      <span>{copy.auth.page.rememberMe}</span>
                    </label>
                    <button type="button" className="auth-v3-linkish">
                      {copy.auth.page.forgotPassword}
                    </button>
                  </div>
                </div>
              </div>

              {isRegisterMode ? (
                <details className="auth-v3-secondary-card">
                  <summary className="auth-v3-summary">{copy.auth.page.extraProfileFields}</summary>
                  <p className="auth-v3-section-copy mt-2">{copy.auth.page.extraProfileCopy}</p>
                  <div className="mt-4 space-y-4">
                    <AuthField
                      label={copy.auth.fields.email}
                      value={email}
                      onChange={setEmail}
                      placeholder={copy.auth.fields.emailPlaceholder}
                      type="email"
                      name="email"
                      autoComplete="email"
                    />
                    <AuthField
                      label={copy.auth.fields.displayName}
                      value={displayName}
                      onChange={setDisplayName}
                      placeholder={copy.auth.fields.displayNamePlaceholder}
                      name="display-name"
                      autoComplete="name"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <AuthField
                        label={copy.auth.fields.relationship}
                        value={relationshipLabel}
                        onChange={setRelationshipLabel}
                        placeholder={copy.auth.fields.relationshipPlaceholder}
                        name="relationship-label"
                        autoComplete="organization-title"
                      />
                      <AuthField
                        label={copy.auth.fields.phone}
                        value={phone}
                        onChange={setPhone}
                        placeholder={copy.auth.fields.phonePlaceholder}
                        type="tel"
                        name="tel"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                </details>
              ) : null}

              {passwordsMismatch ? (
                <p className="auth-v3-error auth-v3-error-warning">
                  {copy.auth.page.passwordsMismatch}
                </p>
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

              <p className="auth-v3-footer-note">{copy.auth.page.invitationNote}</p>
            </form>
          </section>
        </section>
      </div>
    </div>
  );
}

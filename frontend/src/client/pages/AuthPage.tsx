/**
 * Экран авторизации: вход и регистрация без лендингового контента.
 */

import { memo, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { login, register } from "@shared/api/auth";
import { applySessionToClient } from "@shared/api/client";
import { AnalyticsEvents, normalizeClientError, trackEvent } from "@shared/analytics";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import { V3BackgroundDoodles } from "@shared/components/V3BackgroundDoodles";
import { useI18n } from "@shared/hooks/useI18n";
import type { AppLanguage } from "@shared/i18n";
import { shouldUsePublicWebsiteMode } from "@shared/runtime/publicWebsiteMode";
import {
  isNativePasswordAutofillSupported,
  requestNativePasswordCredential,
  saveNativePasswordCredential,
} from "@shared/security/nativePasswordAutofill";
import { useAppStore } from "@shared/store/useAppStore";
import {
  buildNativeAppUrl,
  getAppStoreUrl,
} from "@shared/config/nativeAppLinks";
import { blurActiveField } from "@shared/utils/focus";
import { Link, useSearchParams } from "react-router-dom";

type Mode = "login" | "register";

async function tryStoreCredentials(login: string, password: string): Promise<void> {
  if (typeof window === "undefined" || !login || !password) {
    return;
  }

  const credentialsApi = navigator.credentials;
  const PasswordCredentialCtor = (
    window as Window & { PasswordCredential?: new (data: Record<string, string>) => Credential }
  ).PasswordCredential;

  if (!credentialsApi?.store || !PasswordCredentialCtor) {
    return;
  }

  try {
    const credential = new PasswordCredentialCtor({
      id: login,
      password,
      name: login,
    });
    await credentialsApi.store(credential);
  } catch {
    // Some iOS runtimes may not allow storing credentials from WebView.
  }
}

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
    "Неверный email или пароль": "Invalid email or password.",
    "Аккаунт с таким email уже существует": "An account with this email already exists.",
    "Укажите корректный email": "Enter a valid email.",
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

const AuthField = memo(function AuthField({
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
  autoCapitalize,
  autoCorrect,
  spellCheck,
  inputMode,
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
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: "on" | "off";
  spellCheck?: boolean;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
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
          autoCapitalize={autoCapitalize ?? (type === "password" ? "none" : undefined)}
          autoCorrect={autoCorrect ?? (type === "password" ? "off" : undefined)}
          spellCheck={spellCheck ?? (type === "password" ? false : undefined)}
          inputMode={inputMode ?? (type === "password" ? "text" : undefined)}
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
});

export function AuthPage() {
  const isNativeRuntime = Capacitor.isNativePlatform();
  const isNativeIOS = isNativeRuntime && Capacitor.getPlatform() === "ios";
  const isPublicWebsiteMode = !isNativeRuntime && shouldUsePublicWebsiteMode();
  const appStoreUrl = getAppStoreUrl();
  const { copy, language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const [mode, setMode] = useState<Mode>(requestedMode === "login" ? "login" : "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordAutofillPending, setIsPasswordAutofillPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const effectiveTheme = useAppStore((s) => s.effectiveTheme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  useEffect(() => {
    setMode(requestedMode === "login" ? "login" : "register");
  }, [requestedMode]);

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string; remember_me: boolean }) =>
      login(payload),
    onSuccess: (data, variables) => {
      applySessionToClient(data);
      void tryStoreCredentials(variables.email, variables.password);
      void saveNativePasswordCredential(variables.email, variables.password).catch(() => {});
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
      email: string;
      password: string;
      remember_me: boolean;
      preferred_language: "ru" | "en";
    }) => register(payload),
    onSuccess: (data, variables) => {
      applySessionToClient(data);
      void tryStoreCredentials(variables.email, variables.password);
      void saveNativePasswordCredential(variables.email, variables.password).catch(() => {});
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
    const trimmedEmail = email.trim();
    if (
      !trimmedEmail ||
      (mode === "register" && password.length < 8) ||
      (mode === "login" && password.length === 0)
    ) {
      return;
    }
    if (mode === "register" && password !== passwordConfirm) {
      setError(copy.auth.errors.passwordsMismatch);
      return;
    }
    if (mode === "register" && !acceptLegal) {
      setError(copy.auth.errors.legalConsentRequired);
      return;
    }
    if (mode === "login") {
      setError(null);
      loginMutation.mutate({ email: trimmedEmail, password, remember_me: rememberMe });
      return;
    }
    setError(null);
    registerMutation.mutate({
      email: trimmedEmail,
      password,
      remember_me: rememberMe,
      preferred_language: language,
    });
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;
  const passwordsMismatch =
    mode === "register" && passwordConfirm.length > 0 && password !== passwordConfirm;
  const isRegisterMode = mode === "register";
  const pageDescription = isRegisterMode
    ? copy.auth.page.registerDescription
    : copy.auth.page.loginDescription;
  const resetAuthFormState = () => {
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setAcceptLegal(false);
    setIsPasswordVisible(false);
  };

  const switchMode = (nextMode: Mode) => {
    blurActiveField();
    resetAuthFormState();
    setMode(nextMode);
    setSearchParams(nextMode === "register" ? { mode: "register" } : { mode: "login" });
    setError(null);
    if (isNativeIOS) {
      return;
    }
    window.requestAnimationFrame(() => {
      stageRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const submitLabel =
    mode === "login"
      ? isPending
        ? copy.auth.actions.loginLoading
        : copy.auth.actions.login
      : isPending
        ? copy.auth.actions.registerLoading
        : copy.auth.actions.register;
  const isNativePasswordAutofillAvailable =
    isNativeIOS && mode === "login" && isNativePasswordAutofillSupported();
  const passwordAutofillLabel =
    language === "ru" ? "Заполнить из iPhone" : "Use saved iPhone password";
  const passwordAutofillError =
    language === "ru"
      ? "Не удалось получить сохранённый логин и пароль с iPhone."
      : "Could not load saved iPhone credentials.";

  const ensureSubmitVisible = () => {
    if (!isNativeIOS || mode !== "login" || typeof window === "undefined") {
      return;
    }

    const submitButton = submitButtonRef.current;
    if (!submitButton) {
      return;
    }

    window.setTimeout(() => {
      submitButton.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
    }, 120);
  };

  useEffect(() => {
    if (!isNativeIOS || mode !== "login" || (!email.trim() && !password.trim())) {
      return;
    }

    ensureSubmitVisible();
  }, [email, ensureSubmitVisible, isNativeIOS, mode, password]);

  const handleUseSavedPassword = async () => {
    if (!isNativePasswordAutofillAvailable || isPasswordAutofillPending) {
      return;
    }

    blurActiveField();
    setError(null);
    setIsPasswordAutofillPending(true);
    try {
      const credential = await requestNativePasswordCredential();
      if (!credential) {
        return;
      }
      setEmail(credential.username);
      setPassword(credential.password);
      setRememberMe(true);
    } catch {
      setError(passwordAutofillError);
    } finally {
      setIsPasswordAutofillPending(false);
    }
  };

  if (isPublicWebsiteMode) {
    const targetMode = mode === "register" ? "register" : "login";
    const nativeAuthUrl = buildNativeAppUrl(`/auth?mode=${targetMode}`);
    const title =
      language === "ru"
        ? targetMode === "register"
          ? "Создание аккаунта доступно в приложении для iPhone"
          : "Вход доступен в приложении для iPhone"
        : targetMode === "register"
          ? "Account creation happens in the iPhone app"
          : "Sign-in happens in the iPhone app";
    const description =
      language === "ru"
        ? "Сайт остаётся для знакомства с сервисом, юридической информации и перехода в приложение. Полноценный вход и регистрация происходят внутри PillPath для iPhone."
        : "The website stays for product discovery, legal pages, and app handoff. Full sign-in and registration happen inside the PillPath iPhone app.";
    const appStoreDescription =
      language === "ru"
        ? "Если приложения ещё нет на iPhone, сначала установите его из App Store."
        : "If the app is not installed on the iPhone yet, install it from the App Store first.";
    const primaryHref = appStoreUrl || nativeAuthUrl;
    const primaryLabel = appStoreUrl
      ? language === "ru"
        ? "Скачать в App Store"
        : "Download on the App Store"
      : language === "ru"
        ? "Открыть приложение"
        : "Open app";
    const fallbackLabel = language === "ru" ? "Вернуться на сайт" : "Back to website";

    return (
      <div className="auth-v3-page min-h-screen text-foreground">
        <V3BackgroundDoodles className="auth-v3-doodle-layer" dense />
        <div className="auth-v3-orb auth-v3-orb-left" aria-hidden="true" />
        <div className="auth-v3-orb auth-v3-orb-right" aria-hidden="true" />
        <div className="auth-v3-noise" aria-hidden="true" />
        <div className="auth-v3-shell">
          <section ref={stageRef} className="auth-v3-stage">
            <div className="auth-v3-header">
              <Link to="/" className="auth-v3-header-logo" aria-label={copy.common.brandName}>
                <img
                  src="/pwa-icon.png"
                  alt=""
                  className="h-10 w-10 rounded-[1.15rem] shadow-[0_16px_32px_rgba(138,123,191,0.18)]"
                />
              </Link>
              <Link to="/" className="auth-v3-header-brand" aria-label={copy.common.brandName}>
                <BrandWordmark className="auth-v3-header-brand-text" />
              </Link>
              <div className="auth-v3-header-actions">
                <LanguageSwitch
                  className="auth-v3-language-switch app-header-language-switch"
                  triggerClassName="app-header-utility-button"
                />
                <button
                  type="button"
                  className="soft-theme-toggle app-header-theme-toggle"
                  onClick={toggleTheme}
                  aria-label={
                    effectiveTheme === "light"
                      ? copy.common.themeDarkLabel
                      : copy.common.themeLightLabel
                  }
                  title={
                    effectiveTheme === "light"
                      ? copy.common.themeDarkLabel
                      : copy.common.themeLightLabel
                  }
                >
                  <span
                    aria-hidden="true"
                    className={[
                      "soft-theme-toggle__icon",
                      effectiveTheme === "light"
                        ? "soft-theme-toggle__icon--moon"
                        : "soft-theme-toggle__icon--sun",
                    ].join(" ")}
                  >
                    {effectiveTheme === "light" ? <MoonIcon /> : <SunIcon />}
                  </span>
                </button>
              </div>
            </div>

            <div className="auth-v3-hero">
              <p className="auth-v3-subtitle">{description}</p>
            </div>

            <section className="auth-v3-panel auth-v3-panel-compact soft-page-intro">
              <div className="auth-v3-card auth-v3-handoff-card space-y-4">
                <div>
                  <p className="auth-v3-section-copy">{title}</p>
                </div>
                <p className="text-sm leading-7 text-muted">{description}</p>
                <div className="auth-v3-handoff-stack">
                  <a
                    href={primaryHref}
                    className="auth-v3-submit auth-v3-handoff-primary text-center"
                    target={appStoreUrl ? "_blank" : undefined}
                    rel={appStoreUrl ? "noreferrer" : undefined}
                  >
                    {primaryLabel}
                  </a>
                  {appStoreUrl ? (
                    <a href={nativeAuthUrl} className="auth-v3-handoff-secondary text-center">
                      {language === "ru" ? "Открыть приложение" : "Open app"}
                    </a>
                  ) : (
                    <div className="auth-v3-handoff-note">{appStoreDescription}</div>
                  )}
                  <Link to="/" className="auth-v3-linkish auth-v3-handoff-back text-center">
                    {fallbackLabel}
                  </Link>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div
      className={joinClasses(
        "auth-v3-page min-h-screen text-foreground",
        mode === "login" && "auth-v3-page--login"
      )}
    >
      {!isNativeIOS ? <V3BackgroundDoodles className="auth-v3-doodle-layer" dense /> : null}
      {!isNativeIOS ? <div className="auth-v3-orb auth-v3-orb-left" aria-hidden="true" /> : null}
      {!isNativeIOS ? <div className="auth-v3-orb auth-v3-orb-right" aria-hidden="true" /> : null}
      {!isNativeIOS ? <div className="auth-v3-noise" aria-hidden="true" /> : null}

      <div className="auth-v3-shell">
        <section ref={stageRef} className="auth-v3-stage">
          <div className="auth-v3-header">
            <Link
              to="/"
              className={joinClasses(
                "auth-v3-header-logo",
                isNativeIOS && "auth-v3-header-logo--ios"
              )}
              aria-label={copy.common.brandName}
              onClick={blurActiveField}
            >
              <img
                src="/pwa-icon.png"
                alt=""
                className="h-10 w-10 rounded-[1.15rem] shadow-[0_16px_32px_rgba(138,123,191,0.18)]"
              />
            </Link>
            <Link
              to="/"
              className={joinClasses(
                "auth-v3-header-brand",
                isNativeIOS && "auth-v3-header-brand--ios"
              )}
              aria-label={copy.common.brandName}
              onClick={blurActiveField}
            >
              <BrandWordmark className="auth-v3-header-brand-text" />
            </Link>
            <div className="auth-v3-header-actions">
              <LanguageSwitch
                className="auth-v3-language-switch app-header-language-switch"
                triggerClassName="app-header-utility-button"
              />
              <button
                type="button"
                className="soft-theme-toggle app-header-theme-toggle"
                onClick={toggleTheme}
                aria-label={
                  effectiveTheme === "light"
                    ? copy.common.themeDarkLabel
                    : copy.common.themeLightLabel
                }
                title={
                  effectiveTheme === "light"
                    ? copy.common.themeDarkLabel
                    : copy.common.themeLightLabel
                }
              >
                <span
                  aria-hidden="true"
                  className={[
                    "soft-theme-toggle__icon",
                    effectiveTheme === "light"
                      ? "soft-theme-toggle__icon--moon"
                      : "soft-theme-toggle__icon--sun",
                  ].join(" ")}
                >
                  {effectiveTheme === "light" ? <MoonIcon /> : <SunIcon />}
                </span>
              </button>
            </div>
          </div>
          {isNativeIOS ? (
            <div className="auth-v3-ios-intro">
              <p className="auth-v3-subtitle auth-v3-subtitle--ios">{pageDescription}</p>
            </div>
          ) : null}
          {!isNativeRuntime ? (
            <div className="auth-v3-mobile-home-wrap">
              <Link
                to="/"
                className="app-header-utility-button auth-v3-mobile-home-link"
                onClick={blurActiveField}
              >
                {copy.common.aboutApp}
              </Link>
            </div>
          ) : null}

          <div className={joinClasses("auth-v3-hero", isNativeIOS && "auth-v3-hero--ios-hidden")}>
            <p className="auth-v3-subtitle">{pageDescription}</p>
          </div>

          <section
            className={joinClasses(
              "auth-v3-panel auth-v3-panel-compact soft-page-intro",
              mode === "login" && "auth-v3-panel-compact-login",
              isNativeIOS && "auth-v3-panel--ios"
            )}
          >
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

            <form
              onSubmit={handleSubmit}
              onFocusCapture={ensureSubmitVisible}
              className={joinClasses("mt-5 space-y-4", isNativeIOS && "auth-v3-form--ios")}
              method="post"
              autoComplete="on"
            >
              <div className="auth-v3-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="auth-v3-section-copy">
                      {isRegisterMode
                        ? copy.auth.page.registerCardCopy
                        : copy.auth.page.loginCardCopy}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <AuthField
                    label={copy.auth.fields.email}
                    value={email}
                    onChange={setEmail}
                    placeholder={copy.auth.fields.emailPlaceholder}
                    type="email"
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                    icon={<MailIcon />}
                    hint={isRegisterMode ? copy.auth.page.registerCardCopy : undefined}
                  />

                  <div className={joinClasses("grid gap-4", isRegisterMode && "sm:grid-cols-2")}>
                    <AuthField
                      label={copy.auth.fields.password}
                      value={password}
                      onChange={setPassword}
                      placeholder={copy.auth.fields.passwordPlaceholder}
                      type={isPasswordVisible ? "text" : "password"}
                      name={isRegisterMode ? "new-password" : "current-password"}
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
                    <Link to="/recover-password" className="auth-v3-linkish">
                      {copy.auth.page.forgotPassword}
                    </Link>
                  </div>
                  {isNativePasswordAutofillAvailable ? (
                    <div className="auth-v3-row">
                      <button
                        type="button"
                        onClick={handleUseSavedPassword}
                        disabled={isPasswordAutofillPending}
                        className="auth-v3-linkish disabled:opacity-50"
                      >
                        {isPasswordAutofillPending
                          ? `${passwordAutofillLabel}…`
                          : passwordAutofillLabel}
                      </button>
                    </div>
                  ) : null}
                  {isRegisterMode ? (
                    <label className="auth-v3-checkbox">
                      <span className="auth-v3-checkbox-box">
                        <input
                          type="checkbox"
                          checked={acceptLegal}
                          onChange={(event) => setAcceptLegal(event.target.checked)}
                          className="peer absolute inset-0 cursor-pointer opacity-0"
                        />
                        <span className="auth-v3-checkbox-mark">
                          <CheckIcon />
                        </span>
                      </span>
                      <span className="text-sm leading-6 text-muted">
                        {copy.auth.page.legalConsentPrefix}{" "}
                        <Link to="/legal/terms" className="underline">
                          {copy.auth.page.legalConsentTerms}
                        </Link>{" "}
                        {copy.auth.page.legalConsentAnd}{" "}
                        <Link to="/legal/privacy" className="underline">
                          {copy.auth.page.legalConsentPrivacy}
                        </Link>
                      </span>
                    </label>
                  ) : null}
                </div>
              </div>

              {passwordsMismatch ? (
                <p className="auth-v3-error auth-v3-error-warning">
                  {copy.auth.page.passwordsMismatch}
                </p>
              ) : null}

              {error ? <p className="auth-v3-error">{error}</p> : null}

              <button
                ref={submitButtonRef}
                type="submit"
                disabled={
                  isPending ||
                  !email.trim() ||
                  (isRegisterMode ? password.length < 8 : password.length === 0) ||
                  (isRegisterMode &&
                    (!passwordConfirm || password !== passwordConfirm || !acceptLegal))
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

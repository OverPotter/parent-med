import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { Link, useNavigate } from "react-router-dom";
import { login, resetPasswordByRecoveryCode } from "@shared/api/auth";
import { applySessionToClient } from "@shared/api/client";
import { AuthPasswordField } from "@shared/components/AuthFormControls";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { resolveInvitePublicBaseUrl } from "@shared/config/inviteLinks";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import { V3BackgroundDoodles } from "@shared/components/V3BackgroundDoodles";
import { buildNativeAppUrl, getAppStoreUrl } from "@shared/config/nativeAppLinks";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { shouldUsePublicWebsiteMode } from "@shared/runtime/publicWebsiteMode";
import { useAppStore } from "@shared/store/useAppStore";
import { blurActiveField } from "@shared/utils/focus";
import { normalizeRecoveryCode } from "@shared/utils/recoveryCode";

import { canSubmitRecoveryCode, canSubmitRecoveryPassword } from "./authRecovery";

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

function BackArrowThinIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current">
      <path
        d="M11.8 4.8 6.6 10l5.2 5.2"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function RecoverPasswordPage() {
  const navigate = useNavigate();
  const isIosShell = useIsIosShell();
  const isNativeRuntime = Capacitor.isNativePlatform();
  const isNativeIOS = isNativeRuntime && Capacitor.getPlatform() === "ios";
  const isPublicWebsiteMode = !isNativeRuntime && shouldUsePublicWebsiteMode();
  const publicSiteUrl = resolveInvitePublicBaseUrl();
  const { copy, language } = useI18n();
  const effectiveTheme = useAppStore((s) => s.effectiveTheme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const successRedirectTimeoutRef = useRef<number | null>(null);
  const [pendingSession, setPendingSession] = useState<Awaited<ReturnType<typeof login>> | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const ui =
    language === "ru"
      ? {
          title: "Восстановить пароль",
          hint: "Введите email, секретную фразу и новый пароль.",
          recoveryCode: "Секретная фраза",
          recoveryPlaceholder: "Например: quiet-river-42",
          newPassword: "Новый пароль",
          success: "Пароль обновлён. Теперь можно войти с новым паролем.",
          failed: "Не удалось обновить пароль.",
          saving: "Сохраняем…",
          done: "Готово",
          submit: "Сохранить новый пароль",
          back: "Назад",
        }
      : {
          title: "Reset password",
          hint: "Enter your email, recovery phrase, and a new password.",
          recoveryCode: "Recovery phrase",
          recoveryPlaceholder: "Example: quiet-river-42",
          newPassword: "New password",
          success: "Password updated. You can now sign in with the new password.",
          failed: "Could not update the password.",
          saving: "Saving…",
          done: "Done",
          submit: "Save new password",
          back: "Back",
        };

  const resetMutation = useMutation({
    mutationFn: async (payload: { email: string; recovery_code: string; new_password: string }) => {
      await resetPasswordByRecoveryCode(payload);
      return login({
        email: payload.email,
        password: payload.new_password,
        remember_me: false,
      });
    },
    onSuccess: (session) => {
      setPendingSession(session);
      successRedirectTimeoutRef.current = window.setTimeout(() => {
        applySessionToClient(session);
        navigate("/", { replace: true });
      }, 1200);
    },
    onError: () => {
      setPendingSession(null);
    },
  });
  const passwordsMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;
  const handleBack = useCallback(() => {
    if (pendingSession) {
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/auth?mode=login", { replace: true });
  }, [navigate, pendingSession]);

  useEffect(() => {
    return () => {
      if (successRedirectTimeoutRef.current !== null) {
        window.clearTimeout(successRedirectTimeoutRef.current);
      }
    };
  }, []);

  if (isPublicWebsiteMode) {
    const nativeRecoveryUrl = buildNativeAppUrl("/recover-password");
    const appStoreUrl = getAppStoreUrl();
    const primaryRecoveryHref = appStoreUrl || nativeRecoveryUrl;
    const title =
      language === "ru"
        ? "Сброс пароля доступен в приложении для iPhone"
        : "Password reset happens in the iPhone app";
    const description =
      language === "ru"
        ? "Сайт остаётся для знакомства с сервисом, юридической информации и перехода в приложение. Восстановление доступа выполняется внутри PillPath для iPhone."
        : "The website stays for product discovery, legal pages, and app handoff. Account recovery continues inside the PillPath iPhone app.";

    return (
      <div className="auth-v3-page min-h-screen text-foreground">
        <V3BackgroundDoodles className="auth-v3-doodle-layer" dense />
        <div className="auth-v3-orb auth-v3-orb-left" aria-hidden="true" />
        <div className="auth-v3-orb auth-v3-orb-right" aria-hidden="true" />
        <div className="auth-v3-noise" aria-hidden="true" />
        <div className="auth-v3-shell">
          <section className="auth-v3-stage">
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
                    href={primaryRecoveryHref}
                    className="auth-v3-submit auth-v3-handoff-primary text-center"
                    target={appStoreUrl ? "_blank" : undefined}
                    rel={appStoreUrl ? "noreferrer" : undefined}
                  >
                    {appStoreUrl
                      ? language === "ru"
                        ? "Скачать в App Store"
                        : "Download on the App Store"
                      : language === "ru"
                        ? "Открыть приложение"
                        : "Open app"}
                  </a>
                  {appStoreUrl ? (
                    <a href={nativeRecoveryUrl} className="auth-v3-handoff-secondary text-center">
                      {language === "ru" ? "Открыть приложение" : "Open app"}
                    </a>
                  ) : null}
                  <Link to="/" className="auth-v3-linkish auth-v3-handoff-back text-center">
                    {language === "ru" ? "Вернуться на сайт" : "Back to website"}
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
      ref={rootRef}
      className="auth-v3-page auth-v3-page--login auth-v3-page--recovery min-h-screen text-foreground"
    >
      <IosEdgeBackGesture isEnabled={isIosShell} onBack={handleBack} targetRef={rootRef} />
      {!isNativeIOS ? <V3BackgroundDoodles className="auth-v3-doodle-layer" dense /> : null}
      {!isNativeIOS ? <div className="auth-v3-orb auth-v3-orb-left" aria-hidden="true" /> : null}
      {!isNativeIOS ? <div className="auth-v3-orb auth-v3-orb-right" aria-hidden="true" /> : null}
      {!isNativeIOS ? <div className="auth-v3-noise" aria-hidden="true" /> : null}

      <div className="auth-v3-shell">
        <section className="auth-v3-stage">
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
                className="soft-theme-toggle app-header-theme-toggle shrink-0"
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

          <section
            className={joinClasses(
              "auth-v3-panel auth-v3-panel-compact auth-v3-panel-recovery",
              isIosShell && "auth-v3-panel--ios"
            )}
          >
            <div className="auth-v3-panel-head">
              <div className="min-w-0">
                <h1 className="text-[1.5rem] font-extrabold tracking-[-0.04em] text-foreground sm:text-[1.8rem]">
                  {ui.title}
                </h1>
                <p className="mt-2 max-w-[28rem] text-sm leading-6 text-muted">{ui.hint}</p>
              </div>
            </div>

            <form
              className={joinClasses(
                "mt-4 space-y-4 auth-v3-form-recovery",
                isIosShell && "auth-v3-form--ios"
              )}
              onSubmit={(event) => {
                event.preventDefault();
                resetMutation.mutate({
                  email: email.trim(),
                  recovery_code: normalizeRecoveryCode(recoveryCode),
                  new_password: password,
                });
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="soft-field-label">Email</span>
                  <input
                    name="username"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="soft-input mt-2 w-full px-4"
                    placeholder="you@example.com"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                  />
                </label>
                <label className="block">
                  <span className="soft-field-label">{ui.recoveryCode}</span>
                  <input
                    name="recovery-code"
                    type="text"
                    value={recoveryCode}
                    onChange={(event) => setRecoveryCode(event.target.value)}
                    className="soft-input mt-2 w-full px-4"
                    placeholder={ui.recoveryPlaceholder}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AuthPasswordField
                  label={ui.newPassword}
                  value={password}
                  onChange={setPassword}
                  placeholder={copy.auth.fields.passwordPlaceholder}
                  isVisible={isPasswordVisible}
                  onToggleVisibility={() => setIsPasswordVisible((current) => !current)}
                  name="new-password"
                  autoComplete="new-password"
                />
                <AuthPasswordField
                  label={copy.auth.fields.passwordConfirm}
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  placeholder={copy.auth.fields.passwordConfirmPlaceholder}
                  isVisible={isPasswordVisible}
                  onToggleVisibility={() => setIsPasswordVisible((current) => !current)}
                  name="new-password-confirm"
                  autoComplete="new-password"
                />
              </div>

              {passwordsMismatch ? (
                <p className="soft-note-warning">Пароли должны совпадать.</p>
              ) : null}
              {pendingSession ? <p className="soft-note-success">{ui.success}</p> : null}
              {resetMutation.isError ? (
                <p className="soft-note-danger">
                  {(resetMutation.error as { response?: { data?: { detail?: string } } })?.response
                    ?.data?.detail ?? ui.failed}
                </p>
              ) : null}

              <div className="app-form-action-bar app-form-action-bar--inline">
                <button
                  type="submit"
                  disabled={
                    Boolean(pendingSession) ||
                    resetMutation.isPending ||
                    !canSubmitRecoveryCode(email, recoveryCode) ||
                    !canSubmitRecoveryPassword(password, passwordConfirm)
                  }
                  className="auth-v3-submit"
                >
                  {resetMutation.isPending ? ui.saving : pendingSession ? ui.done : ui.submit}
                </button>
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={Boolean(pendingSession)}
                  className="auth-v3-back-link auth-v3-back-link--centered"
                >
                  <BackArrowThinIcon />
                  <span>{ui.back}</span>
                </button>
              </div>
            </form>
          </section>
          {isNativeIOS && publicSiteUrl ? (
            <div className="auth-v3-ios-about-row">
              <a
                href={publicSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="app-header-utility-button auth-v3-mobile-home-link"
                onClick={blurActiveField}
              >
                {copy.common.aboutApp}
              </a>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

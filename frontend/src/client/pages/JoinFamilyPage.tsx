import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, register } from "@shared/api/auth";
import { applySessionToClient } from "@shared/api/client";
import { acceptFamilyInvite, fetchFamilyInvitePreview } from "@shared/api/familyInvites";
import { AnalyticsEvents, normalizeClientError, trackEvent } from "@shared/analytics";
import { AuthPasswordField, RememberMeCard } from "@shared/components/AuthFormControls";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { buildNativeAppUrl, getAppStoreUrl } from "@shared/config/nativeAppLinks";
import { useI18n } from "@shared/hooks/useI18n";
import { shouldUsePublicWebsiteMode } from "@shared/runtime/publicWebsiteMode";
import { useAppStore } from "@shared/store/useAppStore";

type Mode = "register" | "login";
const INVITE_TOKEN_STORAGE_KEY = "pm_pending_family_invite_token_v1";
const INVITE_POST_INSTALL_KEY = "pm_pending_family_invite_post_install_v1";

function roleLabel(role: string, language: "ru" | "en"): string {
  if (role === "admin") {
    return language === "ru" ? "Администратор семьи" : "Family admin";
  }
  return language === "ru" ? "Участник семьи" : "Family member";
}

export function JoinFamilyPage() {
  const { language, copy } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNativeRuntime = Capacitor.isNativePlatform();
  const isPublicWebsiteMode = !isNativeRuntime && shouldUsePublicWebsiteMode();
  const token = searchParams.get("token")?.trim() ?? "";
  const appStoreUrl = getAppStoreUrl();
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accountId = useAppStore((s) => s.accountId);
  const accountEmail = useAppStore((s) => s.accountEmail);
  const accountDisplayName = useAppStore((s) => s.accountDisplayName);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const hasAttemptedPostInstallOpenRef = useRef(false);
  const ui =
    language === "ru"
      ? {
          incompleteInviteLink:
            "Ссылка приглашения неполная. Откройте корректную ссылку из сообщения.",
          loginFailed: "Не удалось войти в аккаунт.",
          registerFailed: "Не удалось создать аккаунт по приглашению.",
          acceptInviteFailed: "Не удалось принять приглашение.",
          passwordsMismatch: "Пароли не совпадают.",
          pageTitle: "Присоединиться к семейному кабинету",
          pageSubtitle:
            "У каждого взрослого свой личный аккаунт, но дети, аптечка и история болезни общие на уровне семьи.",
          pageEyebrow: "Приглашение в семью",
          leadsToTitle: "Куда ведёт ссылка",
          checkingInvite: "Проверяем приглашение…",
          family: "Семья",
          inviteRole: "Роль по ссылке",
          validUntil: "Действует до",
          currentAccountTitle: "Текущий аккаунт",
          familyName: "Имя в семье",
          you: "Вы",
          notSpecified: "Не указан",
          alreadyInFamily: "Этот аккаунт уже находится в нужной семье.",
          afterConfirmPrefix: "После подтверждения аккаунт войдёт в семью",
          joining: "Подключаем…",
          joinFamily: "Присоединиться к семье",
          authTitle: "Создать аккаунт или войти",
          authHint:
            "Новый аккаунт можно сразу привязать к семье по этой ссылке. Если аккаунт уже есть, войдите под ним, затем подтвердите присоединение.",
          requiredFields: "Обязательные поля",
          requiredFieldsHint: "Для входа и регистрации нужен только email и пароль.",
          emailHint:
            "После входа можно будет отдельно заполнить, как вас показывать в семье.",
          profileHint:
            "Имя в семье и дополнительные данные можно будет заполнить уже после подключения к семейному кабинету.",
          loginSubmit: "Войти и продолжить",
          loginLoading: "Входим…",
          registerSubmit: "Создать аккаунт в семье",
          registerLoading: "Создаём аккаунт…",
          publicTitle: "Приглашение открывается в приложении",
          publicSubtitle:
            "Сайт показывает, куда ведёт ссылка. Подключение к семье, вход и регистрация происходят внутри PillPath для iPhone.",
          publicEyebrow: "Приглашение в семью",
          nextStepTitle: "Что делать дальше",
          nextStepDescription:
            "Откройте PillPath на iPhone, чтобы войти, зарегистрироваться или принять приглашение в семью.",
          downloadApp: "Скачать в App Store",
          openApp: "Открыть приложение",
          installedApp: "Я уже установил приложение",
          installedAppHint:
            "Ссылка-приглашение сохранена в этой странице. После установки вернитесь сюда и нажмите «Я уже установил приложение», чтобы открыть PillPath с этим приглашением.",
        }
      : {
          incompleteInviteLink: "The invite link is incomplete. Open the full link from the message.",
          loginFailed: "Could not sign in.",
          registerFailed: "Could not create an account from this invite.",
          acceptInviteFailed: "Could not accept the invite.",
          passwordsMismatch: "Passwords do not match.",
          pageTitle: "Join the family workspace",
          pageSubtitle:
            "Each adult has a personal account, while children, the medicine cabinet, and the health history stay shared at the family level.",
          pageEyebrow: "Family invite",
          leadsToTitle: "Where this link leads",
          checkingInvite: "Checking the invite…",
          family: "Family",
          inviteRole: "Invite role",
          validUntil: "Valid until",
          currentAccountTitle: "Current account",
          familyName: "Family name",
          you: "You",
          notSpecified: "Not set",
          alreadyInFamily: "This account is already in the target family.",
          afterConfirmPrefix: "After confirmation this account will join the family",
          joining: "Joining…",
          joinFamily: "Join family",
          authTitle: "Create an account or sign in",
          authHint:
            "A new account can be linked to the family right from this link. If you already have an account, sign in first and then confirm joining.",
          requiredFields: "Required fields",
          requiredFieldsHint: "Only email and password are required for sign-in and registration.",
          emailHint: "After sign-in you can separately choose how your name appears inside the family.",
          profileHint:
            "Your family display name and extra details can be filled in after you join the family workspace.",
          loginSubmit: "Sign in and continue",
          loginLoading: "Signing in…",
          registerSubmit: "Create family account",
          registerLoading: "Creating account…",
          publicTitle: "This invite continues in the app",
          publicSubtitle:
            "The website shows where the link leads. Joining a family, signing in, and registration happen inside the PillPath iPhone app.",
          publicEyebrow: "Family invite",
          nextStepTitle: "What to do next",
          nextStepDescription:
            "Open PillPath on iPhone to sign in, create your account, or accept the family invite.",
          downloadApp: "Download on the App Store",
          openApp: "Open app",
          installedApp: "I already installed the app",
          installedAppHint:
            "This invite link stays on this page. After installation, come back here and tap “I already installed the app” to open PillPath with the same invite.",
        };

  const {
    data: invitePreview,
    isLoading: isInviteLoading,
    error: inviteError,
  } = useQuery({
    queryKey: ["family-invite", "preview", token],
    queryFn: () => fetchFamilyInvitePreview(token),
    enabled: Boolean(token),
    retry: false,
  });

  const isAuthenticated = Boolean(accountId);
  const isAlreadyInTargetFamily = Boolean(
    invitePreview && currentFamilyId === invitePreview.familyId
  );

  const inviteErrorMessage = useMemo(() => {
    if (!token) {
      return ui.incompleteInviteLink;
    }
    return (
      (inviteError as { response?: { data?: { detail?: string } } } | null)?.response?.data
        ?.detail ?? null
    );
  }, [inviteError, token, ui.incompleteInviteLink]);

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string; remember_me: boolean }) =>
      login(payload),
    onSuccess: (data) => {
      applySessionToClient(data);
      setError(null);
      trackEvent(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { entry: "join_family" });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? ui.loginFailed);
      trackEvent(AnalyticsEvents.AUTH_ERROR, {
        mode: "login",
        entry: "join_family",
        message: normalizeClientError(err),
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      remember_me: boolean;
      invite_token: string;
      preferred_language: "ru" | "en";
    }) => register(payload),
    onSuccess: (data) => {
      applySessionToClient(data);
      setError(null);
      trackEvent(AnalyticsEvents.AUTH_REGISTER_SUCCESS, { entry: "join_family" });
      queryClient.invalidateQueries({ queryKey: ["families"] });
      navigate("/family", { replace: true });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? ui.registerFailed);
      trackEvent(AnalyticsEvents.AUTH_ERROR, {
        mode: "register",
        entry: "join_family",
        message: normalizeClientError(err),
      });
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: () => acceptFamilyInvite(token),
    onSuccess: (data) => {
      applySessionToClient(data);
      setError(null);
      trackEvent(AnalyticsEvents.FAMILY_INVITE_ACCEPTED);
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
      navigate("/family", { replace: true });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? ui.acceptInviteFailed);
      trackEvent(AnalyticsEvents.AUTH_ERROR, {
        mode: "accept_invite",
        message: normalizeClientError(err),
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (
      !token ||
      !trimmedEmail ||
      (mode === "register" ? password.length < 8 : password.length === 0)
    ) {
      return;
    }
    if (mode === "login") {
      setError(null);
      loginMutation.mutate({ email: trimmedEmail, password, remember_me: rememberMe });
      return;
    }
    if (password !== passwordConfirm) {
      setError(ui.passwordsMismatch);
      return;
    }
    setError(null);
    registerMutation.mutate({
      email: trimmedEmail,
      password,
      remember_me: rememberMe,
      invite_token: token,
      preferred_language: language,
    });
  };

  const isPending =
    loginMutation.isPending || registerMutation.isPending || acceptInviteMutation.isPending;
  const passwordsMismatch =
    mode === "register" && passwordConfirm.length > 0 && password !== passwordConfirm;
  const isRegisterMode = mode === "register";
  const nativeJoinFamilyUrl = buildNativeAppUrl(
    token ? `/join-family?token=${encodeURIComponent(token)}` : "/join-family"
  );
  const primaryJoinFamilyHref = appStoreUrl || nativeJoinFamilyUrl;

  useEffect(() => {
    if (!isPublicWebsiteMode || !token || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(INVITE_TOKEN_STORAGE_KEY, token);
    } catch {
      // Best effort only: invite preview should still work without storage.
    }
  }, [isPublicWebsiteMode, token]);

  useEffect(() => {
    if (
      !isPublicWebsiteMode ||
      !token ||
      !appStoreUrl ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const tryOpenInstalledApp = () => {
      if (document.visibilityState !== "visible" || hasAttemptedPostInstallOpenRef.current) {
        return;
      }

      let savedToken: string | null = null;
      try {
        savedToken = window.localStorage.getItem(INVITE_POST_INSTALL_KEY);
      } catch {
        return;
      }

      if (savedToken !== token) {
        return;
      }

      hasAttemptedPostInstallOpenRef.current = true;
      window.localStorage.removeItem(INVITE_POST_INSTALL_KEY);
      window.setTimeout(() => {
        window.location.assign(nativeJoinFamilyUrl);
      }, 250);
    };

    tryOpenInstalledApp();
    window.addEventListener("pageshow", tryOpenInstalledApp);
    document.addEventListener("visibilitychange", tryOpenInstalledApp);

    return () => {
      window.removeEventListener("pageshow", tryOpenInstalledApp);
      document.removeEventListener("visibilitychange", tryOpenInstalledApp);
    };
  }, [appStoreUrl, isPublicWebsiteMode, nativeJoinFamilyUrl, token]);

  const handleAppStoreInviteInstallStart = () => {
    if (!isPublicWebsiteMode || !appStoreUrl || !token || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(INVITE_POST_INSTALL_KEY, token);
    } catch {
      // Best effort only: explicit fallback button remains available.
    }
  };

  if (isPublicWebsiteMode) {
    return (
      <div className="min-w-0 space-y-6">
        <PageIntro
          title={ui.publicTitle}
          subtitle={ui.publicSubtitle}
          eyebrow={ui.publicEyebrow}
          compactOnMobile
          hideOnMobile
        />

        <Surface className="p-5 sm:p-6">
          <p className="app-card-title">{ui.leadsToTitle}</p>
          {isInviteLoading ? (
            <p className="mt-3 text-sm text-muted">{ui.checkingInvite}</p>
          ) : inviteErrorMessage ? (
            <p className="soft-note-danger mt-3">{inviteErrorMessage}</p>
          ) : invitePreview ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoCard label={ui.family} value={invitePreview.familyName} />
              <InfoCard label={ui.inviteRole} value={roleLabel(invitePreview.familyRole, language)} />
              <InfoCard
                label={ui.validUntil}
                value={new Date(invitePreview.expiresAt).toLocaleString(
                  language === "ru" ? "ru-RU" : "en-US"
                )}
              />
            </div>
          ) : null}
        </Surface>

        <Surface className="auth-v3-handoff-card p-5 sm:p-6">
          <p className="app-card-title">{ui.nextStepTitle}</p>
          <div className="auth-v3-handoff-stack mt-4">
            <p className="text-sm leading-7 text-muted">{ui.nextStepDescription}</p>
            <a
              href={primaryJoinFamilyHref}
              onClick={appStoreUrl ? handleAppStoreInviteInstallStart : undefined}
              target={appStoreUrl ? "_blank" : undefined}
              rel={appStoreUrl ? "noreferrer" : undefined}
              className="auth-v3-submit auth-v3-handoff-primary text-center"
            >
              {appStoreUrl ? ui.downloadApp : ui.openApp}
            </a>
            {appStoreUrl ? (
              <>
                <a href={nativeJoinFamilyUrl} className="auth-v3-handoff-secondary text-center">
                  {ui.installedApp}
                </a>
                <div className="soft-note-info rounded-2xl px-4 py-3 text-sm leading-6">
                  {ui.installedAppHint}
                </div>
              </>
            ) : null}
          </div>
        </Surface>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageIntro
        title={ui.pageTitle}
        subtitle={ui.pageSubtitle}
        eyebrow={ui.pageEyebrow}
        compactOnMobile
        hideOnMobile
      />

      <Surface className="p-5 sm:p-6">
        <p className="app-card-title">{ui.leadsToTitle}</p>
        {isInviteLoading ? (
          <p className="mt-3 text-sm text-muted">{ui.checkingInvite}</p>
        ) : inviteErrorMessage ? (
          <p className="soft-note-danger mt-3">{inviteErrorMessage}</p>
        ) : invitePreview ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoCard label={ui.family} value={invitePreview.familyName} />
            <InfoCard label={ui.inviteRole} value={roleLabel(invitePreview.familyRole, language)} />
            <InfoCard
              label={ui.validUntil}
              value={new Date(invitePreview.expiresAt).toLocaleString(
                language === "ru" ? "ru-RU" : "en-US"
              )}
            />
          </div>
        ) : null}
      </Surface>

      {invitePreview && isAuthenticated ? (
        <Surface className="p-5 sm:p-6">
          <p className="app-card-title">{ui.currentAccountTitle}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoCard label={ui.familyName} value={accountDisplayName?.trim() || ui.you} />
            <InfoCard label={copy.auth.fields.email} value={accountEmail || ui.notSpecified} />
          </div>

          {isAlreadyInTargetFamily ? (
            <p className="soft-note-warning mt-4">{ui.alreadyInFamily}</p>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-muted">
                {ui.afterConfirmPrefix}{" "}
                <span className="font-medium text-foreground">{invitePreview.familyName}</span>.
              </p>
              {error && <p className="soft-note-danger mt-4">{error}</p>}
              <button
                type="button"
                onClick={() => acceptInviteMutation.mutate()}
                disabled={isPending}
                className="soft-button-primary mt-4 disabled:opacity-50"
              >
                {acceptInviteMutation.isPending ? ui.joining : ui.joinFamily}
              </button>
            </>
          )}
        </Surface>
      ) : (
        <Surface className="p-5 sm:p-6">
          <h2 className="app-card-title">{ui.authTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{ui.authHint}</p>

          <div className="soft-panel-muted mt-6 flex rounded-[20px] p-1.5">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 px-3 py-2.5 text-sm transition-colors ${
                mode === "register" ? "soft-tab-active" : "soft-tab"
              }`}
            >
              {copy.auth.page.registerTab}
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 px-3 py-2.5 text-sm transition-colors ${
                mode === "login" ? "soft-tab-active" : "soft-tab"
              }`}
            >
              {copy.auth.page.loginTab}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="soft-panel rounded-[24px] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="app-card-title">{ui.requiredFields}</p>
                  <p className="soft-field-hint mt-1">{ui.requiredFieldsHint}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="block">
                  <span className="soft-field-label">{copy.auth.fields.email}</span>
                  <input
                    name="username"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="soft-input w-full px-4"
                    placeholder={copy.auth.fields.emailPlaceholder}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                  />
                  <span className="soft-field-hint">{ui.emailHint}</span>
                </label>

                <div className={`grid gap-3 ${isRegisterMode ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                  <AuthPasswordField
                    label={copy.auth.fields.password}
                    value={password}
                    onChange={setPassword}
                    placeholder={copy.auth.fields.passwordPlaceholder}
                    isVisible={isPasswordVisible}
                    onToggleVisibility={() => setIsPasswordVisible((current) => !current)}
                    name={isRegisterMode ? "new-password" : "current-password"}
                    autoComplete={isRegisterMode ? "new-password" : "current-password"}
                  />
                  {isRegisterMode && (
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
                  )}
                </div>
              </div>
            </div>

            <RememberMeCard checked={rememberMe} onChange={setRememberMe} />

            {isRegisterMode && (
              <p className="soft-field-hint">{ui.profileHint}</p>
            )}

            {passwordsMismatch && <p className="soft-note-warning">{copy.auth.page.passwordsMismatch}</p>}
            {error && <p className="soft-note-danger">{error}</p>}

            <button
              type="submit"
              disabled={
                !token ||
                isPending ||
                !email.trim() ||
                (isRegisterMode ? password.length < 8 : password.length === 0) ||
                (isRegisterMode && (!passwordConfirm || password !== passwordConfirm))
              }
              className="auth-v3-submit w-full disabled:opacity-50"
            >
              {mode === "login"
                ? loginMutation.isPending
                  ? ui.loginLoading
                  : ui.loginSubmit
                : registerMutation.isPending
                  ? ui.registerLoading
                  : ui.registerSubmit}
            </button>
          </form>
        </Surface>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-panel rounded-[24px] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.025em] text-foreground">
        {value}
      </p>
    </div>
  );
}

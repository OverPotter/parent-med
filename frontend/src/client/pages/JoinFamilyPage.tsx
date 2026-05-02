import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { loginAndAcceptInvite, register } from "@shared/api/auth";
import { applySessionToClient } from "@shared/api/client";
import {
  fetchFamilyInvitePreview,
  fetchLatestDevFamilyInvitePreview,
} from "@shared/api/familyInvites";
import { AnalyticsEvents, normalizeClientError, trackEvent } from "@shared/analytics";
import { AuthPasswordField, RememberMeCard } from "@shared/components/AuthFormControls";
import { PageIntro } from "@shared/components/PageIntro";
import { PublicSiteHeader } from "@shared/components/PublicSiteHeader";
import { Surface } from "@shared/components/Surface";
import { buildNativeAppUrl, getAppStoreUrl } from "@shared/config/nativeAppLinks";
import { useMobileFormFocusHandlers } from "@shared/hooks/useMobileFormFocusHandlers";
import { useI18n } from "@shared/hooks/useI18n";
import {
  buildAuthLoginRoute,
  clearPendingFamilyInviteRoute,
  getInviteAuthIntentFromRoute,
} from "@shared/runtime/inviteFlow";
import {
  resolveInviteFailureState,
  type InviteFailureState,
} from "@shared/runtime/inviteFailureState";
import { useAppStore } from "@shared/store/useAppStore";
import { formatLocalizedDate } from "@shared/utils/date";
import {
  buildJoinFamilyLoginPayload,
  buildJoinFamilyRegisterPayload,
  getJoinFamilyApiErrorCode,
  getJoinFamilyApiErrorDetail,
  resolveJoinFamilyAction,
  type JoinFamilyMode as Mode,
  type JoinFamilySuccessState as SuccessState,
} from "./joinFamilyModel";

const appBtnPrimaryClass =
  "app-btn-primary-md soft-button-primary inline-flex items-center justify-center";
const appBtnSecondaryClass =
  "app-btn-secondary-md soft-button-secondary inline-flex items-center justify-center";

function roleLabel(role: string, language: "ru" | "en"): string {
  if (role === "admin") {
    return language === "ru" ? "Администратор семьи" : "Family admin";
  }
  return language === "ru" ? "Участник семьи" : "Family member";
}

function InviteSummaryCard(props: {
  familyName: string;
  subtitle: string;
  metadata: string[];
}) {
  return (
    <div className="soft-panel mt-4 rounded-[28px] p-4 sm:p-5">
      <p className="text-[1.18rem] font-bold tracking-[-0.03em] text-foreground">
        {props.familyName}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">{props.subtitle}</p>
      <div className="mt-4 space-y-2">
        {props.metadata.map((item) => (
          <p key={item} className="text-sm font-medium text-foreground/85">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function SuccessActions(props: {
  language: "ru" | "en";
  appStoreUrl: string;
  openAppUrl: string;
}) {
  const ui =
    props.language === "ru"
      ? {
          open: "Открыть приложение",
          download: "Скачать из App Store",
        }
      : {
          open: "Open app",
          download: "Download on the App Store",
        };

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => window.location.assign(props.openAppUrl)}
        className={`${appBtnPrimaryClass} w-full px-4 sm:w-auto`}
      >
        {ui.open}
      </button>
      {props.appStoreUrl ? (
        <a
          href={props.appStoreUrl}
          target="_blank"
          rel="noreferrer"
          className={`${appBtnSecondaryClass} w-full px-4 sm:w-auto`}
        >
          {ui.download}
        </a>
      ) : null}
    </div>
  );
}

function ChoiceCard(props: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`soft-panel w-full rounded-[28px] p-4 text-left transition ${
        props.selected ? "border-primary/60 bg-primary/5" : ""
      }`}
    >
      <p className="text-[1rem] font-bold tracking-[-0.025em] text-foreground">{props.title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{props.description}</p>
    </button>
  );
}

function InviteBlockedCard(props: {
  failure: InviteFailureState;
  language: "ru" | "en";
  hasSession: boolean;
  openAppUrl: string;
}) {
  const primaryLabel = props.language === "ru"
    ? props.hasSession
      ? "Перейти в приложение"
      : "Перейти ко входу"
    : props.hasSession
      ? "Go to the app"
      : "Go to sign in";
  const primaryHref = props.hasSession ? props.openAppUrl : "/auth?mode=login";

  return (
    <Surface className="p-5 sm:p-6">
      <h2 className="app-card-title">{props.failure.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{props.failure.description}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {props.hasSession ? (
          <a href={primaryHref} className={`${appBtnPrimaryClass} inline-flex justify-center px-4`}>
            {primaryLabel}
          </a>
        ) : (
          <Link to={primaryHref} className={`${appBtnPrimaryClass} inline-flex justify-center px-4`}>
            {primaryLabel}
          </Link>
        )}
        {props.failure.transient ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`${appBtnSecondaryClass} px-4`}
          >
            {props.language === "ru" ? "Попробовать снова" : "Try again"}
          </button>
        ) : null}
      </div>
    </Surface>
  );
}

export function JoinFamilyPage() {
  const { language, copy } = useI18n();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const isDevLatestShortcut =
    (import.meta.env.DEV || import.meta.env.MODE === "mobile-dev") &&
    searchParams.get("dev-latest") === "1";
  const inviteAuthIntent = getInviteAuthIntentFromRoute(
    `${searchParams.toString() ? `/join-family?${searchParams.toString()}` : "/join-family"}`
  );
  const appStoreUrl = getAppStoreUrl();
  const hasSession = Boolean(useAppStore((s) => s.accountId));
  const initialMode: Mode = inviteAuthIntent === "login" ? "login" : "register";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<SuccessState | null>(null);
  const formFocusHandlers = useMobileFormFocusHandlers();

  const ui =
    language === "ru"
      ? {
          incompleteInviteLink:
            "Ссылка приглашения неполная. Откройте корректную ссылку из сообщения.",
          loginFailed: "Не удалось войти в аккаунт.",
          registerFailed: "Не удалось создать аккаунт по приглашению.",
          passwordsMismatch: "Пароли не совпадают.",
          pageTitle: "Присоединиться к семье",
          pageSubtitle:
            "На этой странице можно присоединиться к семье через веб. После этого откройте приложение PillPath и войдите в него под своим аккаунтом.",
          pageEyebrow: "Семейное приглашение",
          leadsToTitle: "Вы приглашены в семью",
          leadsToSubtitle:
            "После успешного входа или регистрации вы будете добавлены в эту семью. Дальше останется только открыть приложение и войти в него.",
          checkingInvite: "Проверяем приглашение…",
          family: "Семья",
          inviteRole: "Роль по ссылке",
          validUntil: "Действует до",
          chooseTitle: "Как продолжить",
          chooseHint:
            "Выберите, есть ли у вас уже аккаунт PillPath. Дальше сценарий становится линейным и проходит через веб.",
          hasAccountTitle: "У меня уже есть аккаунт",
          hasAccountDescription:
            "Введите email и пароль. Если всё в порядке, мы сразу добавим этот аккаунт в семью. Если нельзя, покажем понятную причину.",
          noAccountTitle: "У меня нет аккаунта",
          noAccountDescription:
            "Создайте новый аккаунт. Мы сразу добавим его в семью из этого приглашения.",
          existingAccountTitle: "Войти и присоединиться",
          existingAccountHint:
            "После входа мы сразу проверим приглашение и добавим аккаунт в семью, если всё в порядке.",
          newAccountTitle: "Создать аккаунт",
          newAccountHint:
            "Новый аккаунт создаётся сразу для этой семьи. После этого откройте приложение и войдите под тем же email.",
          loginSubmit: "Войти и присоединиться",
          loginLoading: "Проверяем и присоединяем…",
          registerSubmit: "Создать аккаунт",
          registerLoading: "Создаём аккаунт…",
          successExistingTitle: "Аккаунт подключён к семье",
          successExistingDescription:
            "Готово: этот аккаунт уже добавлен в семью. Теперь откройте приложение PillPath и войдите под этим аккаунтом.",
          successExistingAlreadyInFamilyTitle: "Аккаунт уже в этой семье",
          successExistingAlreadyInFamilyDescription:
            "Вы уже состоите в этой семье. Просто откройте приложение PillPath и войдите под этим аккаунтом.",
          successNewTitle: "Аккаунт создан и привязан к семье",
          successNewDescription:
            "Готово: новый аккаунт уже создан и добавлен в семью. Теперь откройте приложение PillPath и войдите под этим email. Если приложения ещё нет, сначала скачайте его из App Store.",
          emailWillBeUsed: "Email для входа в приложение",
        }
      : {
          incompleteInviteLink:
            "The invite link is incomplete. Open the full link from the message.",
          loginFailed: "Could not sign in to the account.",
          registerFailed: "Could not create an account from this invite.",
          passwordsMismatch: "Passwords do not match.",
          pageTitle: "Join the family",
          pageSubtitle:
            "Use this page to join the family on the web. After that, open the PillPath app and sign in with your account.",
          pageEyebrow: "Family invite",
          leadsToTitle: "You are invited to a family",
          leadsToSubtitle:
            "After a successful sign-in or sign-up, you will be added to this family. Then you only need to open the app and sign in.",
          checkingInvite: "Checking the invite…",
          family: "Family",
          inviteRole: "Invite role",
          validUntil: "Valid until",
          chooseTitle: "How do you want to continue?",
          chooseHint:
            "Choose whether you already have a PillPath account. The rest of the flow stays linear on the web.",
          hasAccountTitle: "I already have an account",
          hasAccountDescription:
            "Enter your email and password. If everything is valid, we will add this account to the family right away. If not, we will show the exact reason.",
          noAccountTitle: "I need a new account",
          noAccountDescription:
            "Create a new account. We will add it to the invited family right away.",
          existingAccountTitle: "Sign in and join",
          existingAccountHint:
            "After sign-in we immediately verify the invite and add this account to the family if everything is valid.",
          newAccountTitle: "Create account",
          newAccountHint:
            "The new account is created directly for this family. Then open the app and sign in with the same email.",
          loginSubmit: "Sign in and join",
          loginLoading: "Checking and joining…",
          registerSubmit: "Create account",
          registerLoading: "Creating account…",
          successExistingTitle: "The account has joined the family",
          successExistingDescription:
            "Done: this account has already been added to the family. Now open the PillPath app and sign in with this account.",
          successExistingAlreadyInFamilyTitle: "This account is already in the family",
          successExistingAlreadyInFamilyDescription:
            "You are already in this family. Just open the PillPath app and sign in with this account.",
          successNewTitle: "The account was created and linked to the family",
          successNewDescription:
            "Done: the new account has already been created and added to the family. Now open the PillPath app and sign in with this email. If the app is not installed yet, download it from the App Store first.",
          emailWillBeUsed: "Email to use in the app",
        };

  const {
    data: invitePreview,
    isLoading: isInviteLoading,
    error: inviteError,
  } = useQuery({
    queryKey: ["family-invite", isDevLatestShortcut ? "dev-latest" : token],
    queryFn: () =>
      isDevLatestShortcut ? fetchLatestDevFamilyInvitePreview() : fetchFamilyInvitePreview(token),
    enabled: (isDevLatestShortcut || Boolean(token)) && !successState,
    retry: false,
  });

  const invitePreviewFailure = useMemo(() => {
    if (!token && !isDevLatestShortcut) {
      return {
        title:
          language === "ru" ? "Ссылка приглашения неполная" : "The invite link is incomplete",
        description: ui.incompleteInviteLink,
        inlineMessage: ui.incompleteInviteLink,
        blocksAuth: true,
        clearPendingRoute: true,
      } satisfies InviteFailureState;
    }

    if (!inviteError) {
      return null;
    }

    return resolveInviteFailureState({
      language,
      code: getJoinFamilyApiErrorCode(inviteError),
      detail: getJoinFamilyApiErrorDetail(inviteError),
      kind: "preview",
    });
  }, [inviteError, isDevLatestShortcut, language, token, ui.incompleteInviteLink]);

  useEffect(() => {
    if (successState || invitePreviewFailure?.clearPendingRoute) {
      clearPendingFamilyInviteRoute();
    }
  }, [invitePreviewFailure?.clearPendingRoute, successState]);

  const loginAndJoinMutation = useMutation({
    mutationFn: async (payload: { email: string; password: string; remember_me: boolean }) => {
      return loginAndAcceptInvite(
        buildJoinFamilyLoginPayload({
          email: payload.email,
          password: payload.password,
          rememberMe: payload.remember_me,
          token,
          isDevLatestShortcut,
        })
      );
    },
    onSuccess: (data, variables) => {
      applySessionToClient(data);
      setError(null);
      setSuccessState({
        kind: "login",
        email: data.account.email ?? variables.email.trim().toLowerCase(),
      });
      trackEvent(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { entry: "join_family_web" });
      trackEvent(AnalyticsEvents.FAMILY_INVITE_ACCEPTED, { entry: "join_family_web" });
    },
    onError: (err, variables) => {
      const resolution = resolveJoinFamilyAction({
        error: err,
        mode: "login",
        language,
        email: variables.email,
        loginFailedMessage: ui.loginFailed,
        registerFailedMessage: ui.registerFailed,
      });
      if (resolution.type === "success") {
        setError(null);
        setSuccessState(resolution.successState);
        return;
      }
      setError(resolution.errorMessage);
      trackEvent(AnalyticsEvents.AUTH_ERROR, {
        mode: "login",
        entry: "join_family_web",
        message: normalizeClientError(err),
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      remember_me: boolean;
      invite_token?: string;
      use_latest_dev_invite?: boolean;
      preferred_language: "ru" | "en";
    }) => register(payload),
    onSuccess: (data, variables) => {
      applySessionToClient(data);
      setError(null);
      setSuccessState({
        kind: "register",
        email: data.account.email ?? variables.email.trim().toLowerCase(),
      });
      setPassword("");
      setPasswordConfirm("");
      trackEvent(AnalyticsEvents.AUTH_REGISTER_SUCCESS, { entry: "join_family_web" });
      trackEvent(AnalyticsEvents.FAMILY_INVITE_ACCEPTED, { entry: "join_family_web" });
    },
    onError: (err, variables) => {
      const resolution = resolveJoinFamilyAction({
        error: err,
        mode: "register",
        language,
        email: variables.email,
        loginFailedMessage: ui.loginFailed,
        registerFailedMessage: ui.registerFailed,
      });
      setError(resolution.errorMessage);
      trackEvent(AnalyticsEvents.AUTH_ERROR, {
        mode: "register",
        entry: "join_family_web",
        message: normalizeClientError(err),
      });
    },
  });

  const isPending = loginAndJoinMutation.isPending || registerMutation.isPending;
  const passwordsMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;
  const openAppUrl = buildNativeAppUrl(buildAuthLoginRoute());
  const accountHref = hasSession ? "/more" : "/auth?mode=login";
  const accountLabel =
    language === "ru" ? (hasSession ? "Ещё" : "Войти") : hasSession ? "More" : "Login";

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setSuccessState(null);
    setPassword("");
    setPasswordConfirm("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return;
    }

    if (mode === "login") {
      if (!password) {
        return;
      }
      setError(null);
      loginAndJoinMutation.mutate({
        email: trimmedEmail,
        password,
        remember_me: rememberMe,
      });
      return;
    }

    if (password.length < 8 || !passwordConfirm) {
      return;
    }
    if (password !== passwordConfirm) {
      setError(ui.passwordsMismatch);
      return;
    }
    setError(null);
    registerMutation.mutate(
      buildJoinFamilyRegisterPayload({
        email: trimmedEmail,
        password,
        rememberMe,
        token,
        isDevLatestShortcut,
        language,
      })
    );
  };

  return (
    <div
      className="join-family-page mx-auto w-full max-w-3xl min-w-0 space-y-5 px-3 pb-6 sm:space-y-6 sm:px-0"
      onPointerDownCapture={formFocusHandlers.onPointerDownCapture}
    >
      <PublicSiteHeader accountHref={accountHref} accountLabel={accountLabel} />
      <PageIntro
        title={ui.pageTitle}
        subtitle={ui.pageSubtitle}
        eyebrow={ui.pageEyebrow}
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />

      {!invitePreviewFailure?.blocksAuth ? (
        <Surface className="p-5 sm:p-6">
          <p className="app-card-title">{ui.leadsToTitle}</p>
          {isInviteLoading ? (
            <p className="mt-3 text-sm text-muted">{ui.checkingInvite}</p>
          ) : invitePreview ? (
            <InviteSummaryCard
              familyName={invitePreview.familyName}
              subtitle={ui.leadsToSubtitle}
              metadata={[
                `${ui.inviteRole}: ${roleLabel(invitePreview.familyRole, language)}`,
                `${ui.validUntil}: ${formatLocalizedDate(invitePreview.expiresAt, language)}`,
              ]}
            />
          ) : null}
        </Surface>
      ) : null}

      {invitePreviewFailure?.blocksAuth ? (
        <InviteBlockedCard
          failure={invitePreviewFailure}
          language={language}
          hasSession={hasSession}
          openAppUrl={openAppUrl}
        />
      ) : successState ? (
        <Surface className="p-5 sm:p-6">
          <h2 className="app-card-title">
            {successState.kind === "register"
              ? ui.successNewTitle
              : successState.alreadyInFamily
                ? ui.successExistingAlreadyInFamilyTitle
                : ui.successExistingTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {successState.kind === "register"
              ? ui.successNewDescription
              : successState.alreadyInFamily
                ? ui.successExistingAlreadyInFamilyDescription
                : ui.successExistingDescription}
          </p>
          <div className="soft-panel mt-4 rounded-[28px] p-4">
            <p className="soft-field-label">{ui.emailWillBeUsed}</p>
            <p className="mt-2 text-[1.05rem] font-bold tracking-[-0.025em] text-foreground">
              {successState.email}
            </p>
            {invitePreview ? (
              <p className="mt-2 text-sm text-muted">
                {ui.family}:{" "}
                <span className="font-semibold text-foreground">{invitePreview.familyName}</span>
              </p>
            ) : null}
          </div>
          <SuccessActions
            language={language}
            appStoreUrl={appStoreUrl}
            openAppUrl={openAppUrl}
          />
        </Surface>
      ) : (
        <Surface className="p-5 sm:p-6">
          <h2 className="app-card-title">{ui.chooseTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{ui.chooseHint}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ChoiceCard
              title={ui.hasAccountTitle}
              description={ui.hasAccountDescription}
              selected={mode === "login"}
              onClick={() => handleModeChange("login")}
            />
            <ChoiceCard
              title={ui.noAccountTitle}
              description={ui.noAccountDescription}
              selected={mode === "register"}
              onClick={() => handleModeChange("register")}
            />
          </div>

          <form
            onSubmit={handleSubmit}
            onFocusCapture={formFocusHandlers.onFocusCapture}
            className="mt-6 space-y-4 pb-[calc(1.25rem+var(--app-keyboard-height,0px)+max(0.75rem,var(--app-safe-bottom-runtime,env(safe-area-inset-bottom))))]"
            method="post"
            autoComplete="on"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {mode === "login" ? ui.existingAccountTitle : ui.newAccountTitle}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {mode === "login" ? ui.existingAccountHint : ui.newAccountHint}
              </p>
            </div>

            <label className="block">
              <span className="soft-field-label">{copy.auth.fields.email}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="soft-input mt-2"
                placeholder={copy.auth.fields.emailPlaceholder}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
              />
            </label>

            <AuthPasswordField
              label={copy.auth.fields.password}
              value={password}
              onChange={setPassword}
              placeholder={copy.auth.fields.passwordPlaceholder}
              isVisible={isPasswordVisible}
              onToggleVisibility={() => setIsPasswordVisible((current) => !current)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              name="password"
            />

            {mode === "register" ? (
              <AuthPasswordField
                label={copy.auth.fields.passwordConfirm}
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                placeholder={copy.auth.fields.passwordConfirmPlaceholder}
                isVisible={isPasswordVisible}
                autoComplete="new-password"
                name="passwordConfirm"
              />
            ) : null}

            <RememberMeCard checked={rememberMe} onChange={setRememberMe} />

            {passwordsMismatch && mode === "register" ? (
              <p className="soft-note-warning">{ui.passwordsMismatch}</p>
            ) : null}
            {error ? <p className="soft-note-danger">{error}</p> : null}

            <button
              type="submit"
              disabled={
                isPending ||
                !email.trim() ||
                !password ||
                (mode === "register" &&
                  (password.length < 8 || !passwordConfirm || password !== passwordConfirm))
              }
              className={`${appBtnPrimaryClass} w-full px-4 disabled:opacity-50`}
            >
              {mode === "login"
                ? loginAndJoinMutation.isPending
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

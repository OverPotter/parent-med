import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, register } from "@shared/api/auth";
import { applySessionToClient } from "@shared/api/client";
import {
  acceptFamilyInvite,
  acceptFamilyInviteHandoff,
  acceptLatestDevFamilyInvite,
  createFamilyInviteHandoff,
  fetchFamilyInvitePreview,
  fetchLatestDevFamilyInvitePreview,
  resolveFamilyInviteHandoff,
} from "@shared/api/familyInvites";
import { AnalyticsEvents, normalizeClientError, trackEvent } from "@shared/analytics";
import { AuthPasswordField, RememberMeCard } from "@shared/components/AuthFormControls";
import { PageIntro } from "@shared/components/PageIntro";
import { PublicSiteHeader } from "@shared/components/PublicSiteHeader";
import { Surface } from "@shared/components/Surface";
import { buildNativeAppUrl, getAppStoreUrl } from "@shared/config/nativeAppLinks";
import { useI18n } from "@shared/hooks/useI18n";
import { shouldUsePublicWebsiteMode } from "@shared/runtime/publicWebsiteMode";
import {
  appendInviteAuthIntent,
  buildAuthLoginRoute,
  buildJoinFamilyRouteFromHandoff,
  buildJoinFamilyHandoffRoute,
  buildJoinFamilyRoute,
  clearPendingFamilyInviteRoute,
  getInviteAuthIntentFromRoute,
  normalizeInviteRoute,
  PENDING_FAMILY_INVITE_POST_INSTALL_KEY,
  clearPendingPostInstallAppRoute,
  persistPendingFamilyInviteRoute,
  persistPendingPostInstallAppRoute,
  readPendingPostInstallAppRoute,
} from "@shared/runtime/inviteFlow";
import {
  resolveInviteFailureState,
  type InviteFailureState,
} from "@shared/runtime/inviteFailureState";
import { useAppStore } from "@shared/store/useAppStore";

type Mode = "register" | "login";

type ApiErrorLike = {
  response?: {
    data?: {
      detail?: string;
      code?: string;
    };
  };
};

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

function getApiErrorCode(error: unknown): string | null {
  const code = (error as ApiErrorLike | null)?.response?.data?.code;
  return typeof code === "string" && code.trim() ? code : null;
}

function getApiErrorDetail(error: unknown): string | null {
  const detail = (error as ApiErrorLike | null)?.response?.data?.detail;
  return typeof detail === "string" && detail.trim() ? detail : null;
}

export function JoinFamilyPage() {
  const { language, copy } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNativeRuntime = Capacitor.isNativePlatform();
  const isDevLatestShortcut =
    (import.meta.env.DEV || import.meta.env.MODE === "mobile-dev") &&
    searchParams.get("dev-latest") === "1";
  const isPublicWebsiteMode =
    !isNativeRuntime && shouldUsePublicWebsiteMode() && !isDevLatestShortcut;
  const isNativeIOS = isNativeRuntime && Capacitor.getPlatform() === "ios";
  const token = searchParams.get("token")?.trim() ?? "";
  const handoffId = searchParams.get("hid")?.trim() ?? "";
  const appStoreUrl = getAppStoreUrl();
  const inviteAuthIntent = getInviteAuthIntentFromRoute(
    `${searchParams.toString() ? `/join-family?${searchParams.toString()}` : "/join-family"}`
  );
  const initialMode: Mode = inviteAuthIntent === "login" ? "login" : "register";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChoice, setAuthChoice] = useState<Mode | null>(inviteAuthIntent ?? null);
  const [isAppHandoffPending, setIsAppHandoffPending] = useState(false);
  const accountId = useAppStore((s) => s.accountId);
  const accountEmail = useAppStore((s) => s.accountEmail);
  const accountDisplayName = useAppStore((s) => s.accountDisplayName);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const hasAttemptedPostInstallOpenRef = useRef(false);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const hasSession = Boolean(accountId);
  const ui =
    language === "ru"
      ? {
          incompleteInviteLink:
            "Ссылка приглашения неполная. Откройте корректную ссылку из сообщения.",
          loginFailed: "Не удалось войти в аккаунт.",
          registerFailed: "Не удалось создать аккаунт по приглашению.",
          acceptInviteFailed: "Не удалось принять приглашение.",
          devLatestAuthHint:
            "Это dev-сценарий для последнего локального приглашения. Войдите под уже существующим test-аккаунтом, затем подтвердите присоединение как в обычном invite-flow.",
          passwordsMismatch: "Пароли не совпадают.",
          pageTitle: "Присоединиться к семейному кабинету",
          pageSubtitle:
            "У каждого взрослого свой личный аккаунт, но дети, аптечка и история болезни общие на уровне семьи.",
          pageEyebrow: "Приглашение в семью",
          leadsToTitle: "Вы присоединяетесь к семье",
          leadsToSubtitle:
            "После подтверждения у вас будет свой аккаунт, а дети, аптечка и записи останутся общими для всей семьи.",
          checkingInvite: "Проверяем приглашение…",
          family: "Семья",
          inviteRole: "Роль по ссылке",
          validUntil: "Действует до",
          continueInApp: "Дальше сценарий продолжится в приложении PillPath для iPhone.",
          currentAccountTitle: "Текущий аккаунт",
          currentAccountSubtitle:
            "Проверьте, что это тот аккаунт, который должен войти в новую семью.",
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
          chooseFlowTitle: "Как продолжить по приглашению",
          chooseFlowHint:
            "Выберите создание нового аккаунта или вход в уже существующий аккаунт PillPath.",
          chooseRegisterTitle: "У меня ещё нет аккаунта",
          chooseRegisterDescription:
            "Создайте новый аккаунт и сразу привяжите его к этой семье.",
          chooseLoginTitle: "У меня уже есть аккаунт",
          chooseLoginDescription:
            "Войдите в существующий аккаунт, затем подтвердите присоединение к семье.",
          requiredFields: "Обязательные поля",
          requiredFieldsHint: "Для входа и регистрации нужен только email и пароль.",
          emailHint: "После входа можно будет отдельно заполнить, как вас показывать в семье.",
          profileHint:
            "Имя в семье и дополнительные данные можно будет заполнить уже после подключения к семейному кабинету.",
          loginSubmit: "Войти и продолжить",
          loginLoading: "Входим…",
          registerSubmit: "Создать аккаунт в семье",
          registerLoading: "Создаём аккаунт…",
          publicTitle: "Приглашение открывается в приложении",
          publicSubtitle:
            "Здесь можно посмотреть, в какую семью ведёт приглашение, и при необходимости создать аккаунт. Дальше вы продолжите в приложении PillPath для iPhone.",
          publicEyebrow: "Приглашение в семью",
          nextStepTitle: "Создать аккаунт по приглашению",
          nextStepDescription:
            "Если у вас ещё нет аккаунта, создайте его прямо здесь. После регистрации продолжение семейного кабинета будет в приложении для iPhone.",
          handoffTitle: "Продолжить в приложении",
          handoffHint:
            "Если приложение уже установлено, откройте приглашение сразу. Если нет, сначала установите PillPath, а затем вернитесь на эту страницу.",
          downloadApp: "Скачать PillPath",
          openApp: "Открыть PillPath",
          installedApp: "Вернуться после установки",
          installedAppHint:
            "После установки снова откройте эту страницу и нажмите «Вернуться после установки», чтобы продолжить с тем же приглашением.",
          continueInAppFailed:
            "Не удалось подготовить переход в приложение. Попробуйте ещё раз.",
          publicRegisterTitle: "Создать аккаунт",
          publicRegisterHint:
            "Новый аккаунт сразу привяжется к семье из этого приглашения. После этого установите приложение и войдите под тем же email.",
          publicRegisterSubmit: "Создать аккаунт",
          publicRegisterLoading: "Создаём аккаунт…",
          publicRegisterSuccessTitle: "Аккаунт создан",
          publicRegisterSuccessDescription:
            "Теперь установите или откройте PillPath на iPhone и войдите под этим email, чтобы продолжить в семейном кабинете.",
          publicExistingAccountTitle: "У меня уже есть аккаунт",
          publicExistingAccountDescription:
            "Если аккаунт уже есть, не регистрируйтесь повторно. Откройте PillPath, войдите под своим аккаунтом и подтвердите присоединение к семье.",
          publicExistingAccountOpen: "Открыть приложение и войти",
          publicExistingAccountInstall:
            "Если приложения ещё нет, сначала установите его, затем снова откройте PillPath и войдите под существующим аккаунтом.",
          publicLoginTitle: "Войти в приложение",
          publicLoginHint:
            "Войдите под этим email внутри приложения. Аккаунт уже создан и привязан к семье по этому приглашению.",
          invalidInviteHelpTitle: "Нужна новая ссылка",
          invalidInviteHelpDescription:
            "По этой ссылке нельзя создать аккаунт или присоединиться к семье. Попросите владельца семьи отправить новое приглашение.",
        }
      : {
          incompleteInviteLink:
            "The invite link is incomplete. Open the full link from the message.",
          loginFailed: "Could not sign in.",
          registerFailed: "Could not create an account from this invite.",
          acceptInviteFailed: "Could not accept the invite.",
          devLatestAuthHint:
            "This is a dev shortcut for the latest local invite. Sign in with an existing test account first, then confirm joining through the normal invite flow.",
          passwordsMismatch: "Passwords do not match.",
          pageTitle: "Join the family workspace",
          pageSubtitle:
            "Each adult has a personal account, while children, the medicine cabinet, and the health history stay shared at the family level.",
          pageEyebrow: "Family invite",
          leadsToTitle: "You are joining this family",
          leadsToSubtitle:
            "After confirmation you will keep your own account, while children, the medicine cabinet, and records stay shared for the family.",
          checkingInvite: "Checking the invite…",
          family: "Family",
          inviteRole: "Invite role",
          validUntil: "Valid until",
          continueInApp: "The rest of this flow continues in the PillPath iPhone app.",
          currentAccountTitle: "Current account",
          currentAccountSubtitle: "Check that this is the account that should join the new family.",
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
          chooseFlowTitle: "How do you want to continue?",
          chooseFlowHint:
            "Choose whether you need a new PillPath account or want to sign in with an existing one.",
          chooseRegisterTitle: "I need a new account",
          chooseRegisterDescription:
            "Create a new account and link it to this family right away.",
          chooseLoginTitle: "I already have an account",
          chooseLoginDescription:
            "Sign in with your existing account and then confirm joining this family.",
          requiredFields: "Required fields",
          requiredFieldsHint: "Only email and password are required for sign-in and registration.",
          emailHint:
            "After sign-in you can separately choose how your name appears inside the family.",
          profileHint:
            "Your family display name and extra details can be filled in after you join the family workspace.",
          loginSubmit: "Sign in and continue",
          loginLoading: "Signing in…",
          registerSubmit: "Create family account",
          registerLoading: "Creating account…",
          publicTitle: "This invite continues in the app",
          publicSubtitle:
            "This page shows which family the invite belongs to and lets you create an account if needed. After that, continue in the PillPath iPhone app.",
          publicEyebrow: "Family invite",
          nextStepTitle: "Create an account from this invite",
          nextStepDescription:
            "If you do not have an account yet, create it here first. After that, continue the family flow in the PillPath iPhone app.",
          handoffTitle: "Continue in the app",
          handoffHint:
            "If the app is already installed, open the invite now. If not, install PillPath first and then return to this page.",
          downloadApp: "Download PillPath",
          openApp: "Open PillPath",
          installedApp: "Return after install",
          installedAppHint:
            "After installation, open this page again and tap “Return after install” to continue with the same invite.",
          continueInAppFailed:
            "Could not prepare the app handoff. Please try again.",
          publicRegisterTitle: "Create account",
          publicRegisterHint:
            "A new account created here will be linked to this family invite immediately. Then install or open the iPhone app and sign in with the same email.",
          publicRegisterSubmit: "Create account",
          publicRegisterLoading: "Creating account…",
          publicRegisterSuccessTitle: "Account created",
          publicRegisterSuccessDescription:
            "Now install or open PillPath on iPhone and sign in with this email to continue inside the family workspace.",
          publicExistingAccountTitle: "I already have an account",
          publicExistingAccountDescription:
            "If you already have an account, do not register again. Open PillPath, sign in, and confirm joining the family there.",
          publicExistingAccountOpen: "Open app and sign in",
          publicExistingAccountInstall:
            "If the app is not installed yet, install it first, then reopen PillPath and sign in with your existing account.",
          publicLoginTitle: "Sign in inside the app",
          publicLoginHint:
            "Sign in with this email inside the app. This account is already linked to the invited family.",
          invalidInviteHelpTitle: "A new invite link is needed",
          invalidInviteHelpDescription:
            "You cannot create an account or join a family from this link. Ask the family owner to send a new invite.",
        };
  const [publicInviteRegisteredEmail, setPublicInviteRegisteredEmail] = useState<string | null>(
    null
  );
  const canRegisterFromInvite = Boolean(token || handoffId) || isDevLatestShortcut;

  const {
    data: invitePreview,
    isLoading: isInviteLoading,
    error: inviteError,
  } = useQuery({
    queryKey: ["family-invite", isDevLatestShortcut ? "dev-latest" : handoffId ? "handoff" : "preview", handoffId || token],
    queryFn: () =>
      isDevLatestShortcut
        ? fetchLatestDevFamilyInvitePreview()
        : handoffId
          ? resolveFamilyInviteHandoff(handoffId)
          : fetchFamilyInvitePreview(token),
    enabled: isDevLatestShortcut || Boolean(token || handoffId),
    retry: false,
  });

  const isAuthenticated = Boolean(accountId);
  const isAlreadyInTargetFamily = Boolean(
    invitePreview && currentFamilyId === invitePreview.familyId
  );
  const invitePreviewFailure = useMemo(() => {
    if (!token && !handoffId && !isDevLatestShortcut) {
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
      code: getApiErrorCode(inviteError),
      detail: getApiErrorDetail(inviteError),
      kind: "preview",
    });
  }, [handoffId, inviteError, isDevLatestShortcut, language, token, ui.incompleteInviteLink]);

  useEffect(() => {
    if (!isAuthenticated || !isAlreadyInTargetFamily) {
      return;
    }
    clearPendingFamilyInviteRoute();
    navigate("/family", { replace: true });
  }, [isAlreadyInTargetFamily, isAuthenticated, navigate]);

  const inviteErrorMessage = invitePreviewFailure?.inlineMessage ?? null;
  const canRenderPublicInviteRegistration = Boolean(
    (token || handoffId) && invitePreview && !invitePreviewFailure && !isDevLatestShortcut
  );
  const isInvalidPublicInvite = Boolean(
    !publicInviteRegisteredEmail &&
      !isInviteLoading &&
      invitePreviewFailure?.blocksAuth &&
      !isDevLatestShortcut
  );

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string; remember_me: boolean }) =>
      login(payload),
    onSuccess: (data) => {
      applySessionToClient(data);
      setError(null);
      trackEvent(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { entry: "join_family" });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(getApiErrorDetail(err) ?? ui.loginFailed);
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
      invite_token?: string;
      invite_handoff_id?: string;
      use_latest_dev_invite?: boolean;
      preferred_language: "ru" | "en";
    }) => register(payload),
    onSuccess: (data) => {
      setError(null);
      trackEvent(AnalyticsEvents.AUTH_REGISTER_SUCCESS, { entry: "join_family" });
      if (isPublicWebsiteMode) {
        setPublicInviteRegisteredEmail(data.account.email ?? email.trim());
        setPassword("");
        setPasswordConfirm("");
        setIsPasswordVisible(false);
        return;
      }
      applySessionToClient(data);
      clearPendingFamilyInviteRoute();
      queryClient.invalidateQueries({ queryKey: ["families"] });
      navigate("/family", { replace: true });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const failure = resolveInviteFailureState({
        language,
        code: getApiErrorCode(err),
        detail: getApiErrorDetail(err),
        kind: "action",
      });
      if (failure.clearPendingRoute) {
        clearPendingFamilyInviteRoute();
      }
      setError(failure.inlineMessage ?? ui.registerFailed);
      trackEvent(AnalyticsEvents.AUTH_ERROR, {
        mode: "register",
        entry: "join_family",
        message: normalizeClientError(err),
      });
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: () =>
      isDevLatestShortcut
        ? acceptLatestDevFamilyInvite()
        : handoffId
          ? acceptFamilyInviteHandoff(handoffId)
          : acceptFamilyInvite(token),
    onSuccess: (data) => {
      applySessionToClient(data);
      clearPendingFamilyInviteRoute();
      setError(null);
      trackEvent(AnalyticsEvents.FAMILY_INVITE_ACCEPTED);
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
      navigate("/family", { replace: true });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const failure = resolveInviteFailureState({
        language,
        code: getApiErrorCode(err),
        detail: getApiErrorDetail(err),
        kind: "action",
      });
      if (failure.clearPendingRoute) {
        clearPendingFamilyInviteRoute();
      }
      setError(failure.inlineMessage ?? ui.acceptInviteFailed);
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
      (!token && !handoffId && !isDevLatestShortcut) ||
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
      invite_token: token || undefined,
      invite_handoff_id: handoffId || undefined,
      use_latest_dev_invite: isDevLatestShortcut || undefined,
      preferred_language: language,
    });
  };

  const isPending =
    loginMutation.isPending ||
    registerMutation.isPending ||
    acceptInviteMutation.isPending ||
    isAppHandoffPending;
  const passwordsMismatch =
    canRegisterFromInvite &&
    mode === "register" &&
    passwordConfirm.length > 0 &&
    password !== passwordConfirm;
  const isRegisterMode = canRegisterFromInvite && mode === "register";
  const inviteIdentity = token ? `token:${token}` : handoffId ? `handoff:${handoffId}` : null;
  const joinFamilyRoute = handoffId
    ? buildJoinFamilyRouteFromHandoff(handoffId)
    : buildJoinFamilyRoute(token);
  const nativeRegisterInviteUrl = buildNativeAppUrl(
    appendInviteAuthIntent(joinFamilyRoute, "register") ?? joinFamilyRoute
  );
  const nativeLoginInviteUrl = buildNativeAppUrl(
    appendInviteAuthIntent(joinFamilyRoute, "login") ?? joinFamilyRoute
  );
  const nativeAuthLoginUrl = buildNativeAppUrl(buildAuthLoginRoute());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const route = isDevLatestShortcut
        ? "/join-family?dev-latest=1"
        : handoffId
          ? buildJoinFamilyRouteFromHandoff(handoffId)
          : token
            ? buildJoinFamilyRoute(token)
          : null;
      if (!route) {
        clearPendingFamilyInviteRoute();
        return;
      }
      persistPendingFamilyInviteRoute(route);
    } catch {
      // Best effort only: invite preview should still work without storage.
    }
  }, [handoffId, isDevLatestShortcut, token]);

  useEffect(() => {
    if (!invitePreviewFailure?.clearPendingRoute) {
      return;
    }
    clearPendingFamilyInviteRoute();
  }, [invitePreviewFailure]);

  const accountHref = hasSession ? "/more" : "/auth?mode=login&next=invite";
  const accountLabel =
    language === "ru" ? (hasSession ? "Ещё" : "Войти") : hasSession ? "More" : "Login";

  const createPublicInviteHandoffRoute = useCallback(
    async (intent: "login" | "register" = "register"): Promise<string | null> => {
      if (!token && !handoffId) {
        return null;
      }

      if (handoffId) {
        const route = buildJoinFamilyHandoffRoute(handoffId);
        return appendInviteAuthIntent(route, intent) ?? route;
      }

      try {
        setIsAppHandoffPending(true);
        const handoff = await createFamilyInviteHandoff(token);
        setError(null);
        const route =
          normalizeInviteRoute(handoff.handoffPath) ??
          buildJoinFamilyHandoffRoute(handoff.handoffId);
        return appendInviteAuthIntent(route, intent) ?? route;
      } catch (err) {
        const failure = resolveInviteFailureState({
          language,
          code: getApiErrorCode(err),
          detail: getApiErrorDetail(err),
          kind: "action",
        });
        setError(failure.inlineMessage ?? ui.continueInAppFailed);
        return null;
      } finally {
        setIsAppHandoffPending(false);
      }
    },
    [handoffId, language, token, ui.continueInAppFailed]
  );

  const openNativeAppRoute = useCallback((route: string) => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.assign(buildNativeAppUrl(route));
  }, []);

  const continuePublicInstallFlow = useCallback(
    async (route: string | null) => {
      if (!isPublicWebsiteMode || !appStoreUrl || typeof window === "undefined" || !route) {
        return;
      }

      try {
        if (inviteIdentity) {
          window.localStorage.setItem(PENDING_FAMILY_INVITE_POST_INSTALL_KEY, inviteIdentity);
        }
        persistPendingPostInstallAppRoute(route, window.localStorage);
      } catch {
        // Best effort only: explicit fallback action remains available.
      }

      window.location.assign(appStoreUrl);
    },
    [appStoreUrl, inviteIdentity, isPublicWebsiteMode]
  );

  const resolvePublicAppRoute = useCallback(
    async (mode: "register" | "login" | "created-account"): Promise<string | null> => {
      if (mode === "created-account") {
        return buildAuthLoginRoute();
      }
      if (isPublicWebsiteMode && (token || handoffId)) {
        return createPublicInviteHandoffRoute(mode);
      }
      return appendInviteAuthIntent(joinFamilyRoute, mode) ?? joinFamilyRoute;
    },
    [createPublicInviteHandoffRoute, handoffId, isPublicWebsiteMode, joinFamilyRoute, token]
  );

  const startPublicAppStoreFlow = useCallback(
    async (mode: "register" | "login" | "created-account") => {
      await continuePublicInstallFlow(await resolvePublicAppRoute(mode));
    },
    [continuePublicInstallFlow, resolvePublicAppRoute]
  );

  const openPublicAppFlow = useCallback(
    async (mode: "register" | "login" | "created-account") => {
      const route = await resolvePublicAppRoute(mode);
      if (!route) {
        return;
      }
      openNativeAppRoute(route);
    },
    [openNativeAppRoute, resolvePublicAppRoute]
  );

  useEffect(() => {
    if (
      !isPublicWebsiteMode ||
      !inviteIdentity ||
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

      let savedIdentity: string | null = null;
      let savedRoute: string | null = null;
      try {
        savedIdentity = window.localStorage.getItem(PENDING_FAMILY_INVITE_POST_INSTALL_KEY);
        savedRoute = readPendingPostInstallAppRoute(window.localStorage);
      } catch {
        return;
      }

      if (!savedRoute || savedIdentity !== inviteIdentity) {
        return;
      }

      hasAttemptedPostInstallOpenRef.current = true;
      window.localStorage.removeItem(PENDING_FAMILY_INVITE_POST_INSTALL_KEY);
      clearPendingPostInstallAppRoute(window.localStorage);
      window.setTimeout(() => {
        window.location.assign(buildNativeAppUrl(savedRoute));
      }, 250);
    };

    tryOpenInstalledApp();
    window.addEventListener("pageshow", tryOpenInstalledApp);
    document.addEventListener("visibilitychange", tryOpenInstalledApp);

    return () => {
      window.removeEventListener("pageshow", tryOpenInstalledApp);
      document.removeEventListener("visibilitychange", tryOpenInstalledApp);
    };
  }, [appStoreUrl, inviteIdentity, isPublicWebsiteMode]);

  const handleModeChange = (nextMode: Mode) => {
    setAuthChoice(nextMode);
    setMode(nextMode);
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setError(null);
    setIsPasswordVisible(false);
  };

  const ensureSubmitVisible = useCallback(() => {
    if (!isNativeIOS || typeof window === "undefined") {
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
  }, [isNativeIOS]);

  useEffect(() => {
    if (!isNativeIOS || (!email.trim() && !password.trim() && !passwordConfirm.trim())) {
      return;
    }

    ensureSubmitVisible();
  }, [email, ensureSubmitVisible, isNativeIOS, password, passwordConfirm]);

  if (isPublicWebsiteMode) {
    return (
      <div className="join-family-page mx-auto w-full max-w-3xl min-w-0 space-y-6 px-3 pb-6 sm:px-0">
        <PublicSiteHeader accountHref={accountHref} accountLabel={accountLabel} />
        <PageIntro
          title={ui.publicTitle}
          subtitle={ui.publicSubtitle}
          eyebrow={ui.publicEyebrow}
          compactOnMobile
          hideOnMobile
          className="app-safe-top-standalone"
        />

        {!invitePreviewFailure?.blocksAuth ? (
          <Surface className="p-5 sm:p-6">
            <p className="app-card-title">{ui.leadsToTitle}</p>
            {isInviteLoading ? (
              <p className="mt-3 text-sm text-muted">{ui.checkingInvite}</p>
            ) : inviteErrorMessage ? (
              <p className="soft-note-danger mt-3">{inviteErrorMessage}</p>
            ) : invitePreview ? (
              <InviteSummaryCard
                familyName={invitePreview.familyName}
                subtitle={ui.leadsToSubtitle}
                metadata={[
                  `${ui.inviteRole}: ${roleLabel(invitePreview.familyRole, language)}`,
                  `${ui.validUntil} ${new Date(invitePreview.expiresAt).toLocaleString(
                    language === "ru" ? "ru-RU" : "en-US"
                  )}`,
                ]}
                note={appStoreUrl ? ui.continueInApp : null}
              />
            ) : null}
          </Surface>
        ) : null}

        <Surface className="p-5 sm:p-6">
          <h2 className="app-card-title">
            {publicInviteRegisteredEmail
              ? ui.publicRegisterSuccessTitle
              : isInvalidPublicInvite
                ? invitePreviewFailure?.title ?? ui.invalidInviteHelpTitle
                : ui.publicRegisterTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {publicInviteRegisteredEmail
              ? ui.publicRegisterSuccessDescription
              : isInvalidPublicInvite
                ? invitePreviewFailure?.description ?? ui.invalidInviteHelpDescription
                : ui.publicRegisterHint}
          </p>

          {publicInviteRegisteredEmail ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoCard label={copy.auth.fields.email} value={publicInviteRegisteredEmail} />
                <InfoCard label={ui.family} value={invitePreview?.familyName ?? ui.notSpecified} />
              </div>
              <PublicHandoffActions
                title={ui.publicLoginTitle}
                hint={ui.publicLoginHint}
                primaryLabel={appStoreUrl ? ui.downloadApp : ui.openApp}
                secondaryLabel={appStoreUrl ? ui.installedApp : null}
                secondaryHint={appStoreUrl ? ui.installedAppHint : null}
                primaryHref={appStoreUrl || nativeAuthLoginUrl}
                secondaryHref={appStoreUrl ? nativeAuthLoginUrl : null}
                onPrimaryAction={
                  appStoreUrl
                    ? () => startPublicAppStoreFlow("created-account")
                    : () => void openPublicAppFlow("created-account")
                }
                onSecondaryAction={
                  appStoreUrl ? () => void openPublicAppFlow("created-account") : undefined
                }
                isPending={isAppHandoffPending}
              />
            </>
          ) : isInvalidPublicInvite ? (
            <div className="mt-4">
              <p className="text-sm leading-6 text-muted">
                {invitePreviewFailure?.description ?? inviteErrorMessage}
              </p>
              {invitePreviewFailure?.transient ? (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className={`${appBtnSecondaryClass} mt-4 px-4`}
                >
                  {language === "ru" ? "Попробовать снова" : "Try again"}
                </button>
              ) : null}
            </div>
          ) : canRenderPublicInviteRegistration ? (
            <form
              onSubmit={handleSubmit}
              onFocusCapture={ensureSubmitVisible}
              className="mt-6 space-y-4"
              method="post"
              autoComplete="on"
            >
              <p className="text-sm leading-7 text-muted">{ui.nextStepDescription}</p>
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
              <label className="block">
                <span className="soft-field-label">{copy.auth.fields.password}</span>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="soft-input mt-2"
                  placeholder={copy.auth.fields.passwordPlaceholder}
                  autoComplete="new-password"
                />
              </label>
              <label className="block">
                <span className="soft-field-label">{copy.auth.fields.passwordConfirm}</span>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  className="soft-input mt-2"
                  placeholder={copy.auth.fields.passwordConfirmPlaceholder}
                  autoComplete="new-password"
                />
              </label>

              {passwordsMismatch ? (
                <p className="soft-note-warning">{ui.passwordsMismatch}</p>
              ) : null}
              {error ? <p className="soft-note-danger">{error}</p> : null}

              <button
                type="button"
                onClick={() => setIsPasswordVisible((current) => !current)}
                className={`${appBtnSecondaryClass} w-full px-4 sm:w-auto`}
              >
                {isPasswordVisible
                  ? copy.auth.actions.hidePassword
                  : copy.auth.actions.showPassword}
              </button>

              <button
                ref={submitButtonRef}
                type="submit"
                disabled={
                  registerMutation.isPending ||
                  !email.trim() ||
                  password.length < 8 ||
                  !passwordConfirm ||
                  password !== passwordConfirm
                }
                className={`${appBtnPrimaryClass} w-full px-4 disabled:opacity-50`}
              >
                {registerMutation.isPending ? ui.publicRegisterLoading : ui.publicRegisterSubmit}
              </button>

              <PublicHandoffActions
                title={ui.handoffTitle}
                hint={ui.handoffHint}
                primaryLabel={appStoreUrl ? ui.downloadApp : ui.openApp}
                secondaryLabel={appStoreUrl ? ui.installedApp : null}
                secondaryHint={appStoreUrl ? ui.installedAppHint : null}
                primaryHref={appStoreUrl || nativeRegisterInviteUrl}
                secondaryHref={appStoreUrl ? nativeRegisterInviteUrl : null}
                onPrimaryAction={
                  appStoreUrl
                    ? () => startPublicAppStoreFlow("register")
                    : () => void openPublicAppFlow("register")
                }
                onSecondaryAction={
                  appStoreUrl ? () => void openPublicAppFlow("register") : undefined
                }
                isPending={isAppHandoffPending}
                className="pt-2"
              />

              <div className="soft-panel mt-6 rounded-[24px] p-4">
                <p className="app-card-title">{ui.publicExistingAccountTitle}</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {ui.publicExistingAccountDescription}
                </p>
                <PublicHandoffActions
                  title={ui.chooseLoginTitle}
                  hint={ui.publicExistingAccountInstall}
                  primaryLabel={appStoreUrl ? ui.downloadApp : ui.publicExistingAccountOpen}
                  secondaryLabel={appStoreUrl ? ui.publicExistingAccountOpen : null}
                  secondaryHint={null}
                  primaryHref={appStoreUrl || nativeLoginInviteUrl}
                  secondaryHref={appStoreUrl ? nativeLoginInviteUrl : null}
                  onPrimaryAction={
                    appStoreUrl
                      ? () => startPublicAppStoreFlow("login")
                      : () => void openPublicAppFlow("login")
                  }
                  onSecondaryAction={
                    appStoreUrl ? () => void openPublicAppFlow("login") : undefined
                  }
                  isPending={isAppHandoffPending}
                  className="pt-2"
                />
              </div>
            </form>
          ) : null}
        </Surface>
      </div>
    );
  }

  return (
    <div className="join-family-page mx-auto w-full max-w-3xl min-w-0 space-y-5 px-3 pb-6 sm:space-y-6 sm:px-0">
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
          ) : inviteErrorMessage ? (
            <p className="soft-note-danger mt-3">{inviteErrorMessage}</p>
          ) : invitePreview ? (
            <InviteSummaryCard
              familyName={invitePreview.familyName}
              subtitle={ui.leadsToSubtitle}
              metadata={[
                `${ui.inviteRole}: ${roleLabel(invitePreview.familyRole, language)}`,
                `${ui.validUntil} ${new Date(invitePreview.expiresAt).toLocaleString(
                  language === "ru" ? "ru-RU" : "en-US"
                )}`,
              ]}
            />
          ) : null}
        </Surface>
      ) : null}

      {invitePreview && isAuthenticated ? (
        <Surface className="p-5 sm:p-6">
          <p className="app-card-title">{ui.currentAccountTitle}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{ui.currentAccountSubtitle}</p>
          <div className="mt-4">
            <p className="text-[1.08rem] font-bold tracking-[-0.03em] text-foreground">
              {accountEmail || ui.notSpecified}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {ui.familyName}:{" "}
              <span className="font-semibold text-foreground">
                {accountDisplayName?.trim() || ui.you}
              </span>
            </p>
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
                className={`${appBtnPrimaryClass} mt-4 w-full px-4 disabled:opacity-50 sm:w-auto`}
              >
                {acceptInviteMutation.isPending ? ui.joining : ui.joinFamily}
              </button>
            </>
          )}
        </Surface>
      ) : invitePreviewFailure?.blocksAuth ? (
        <Surface className="p-5 sm:p-6">
          <h2 className="app-card-title">{invitePreviewFailure.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{invitePreviewFailure.description}</p>
          {invitePreviewFailure.transient ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`${appBtnSecondaryClass} mt-4 px-4`}
            >
              {language === "ru" ? "Попробовать снова" : "Try again"}
            </button>
          ) : null}
        </Surface>
      ) : (
        <Surface className="p-5 sm:p-6">
          <h2 className="app-card-title">{ui.authTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {isDevLatestShortcut ? ui.devLatestAuthHint : ui.authHint}
          </p>

          {!authChoice && canRegisterFromInvite ? (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{ui.chooseFlowTitle}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{ui.chooseFlowHint}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleModeChange("register")}
                  className="soft-panel rounded-[24px] p-4 text-left transition-colors hover:border-primary/50"
                >
                  <p className="app-card-title">{ui.chooseRegisterTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{ui.chooseRegisterDescription}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("login")}
                  className="soft-panel rounded-[24px] p-4 text-left transition-colors hover:border-primary/50"
                >
                  <p className="app-card-title">{ui.chooseLoginTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{ui.chooseLoginDescription}</p>
                </button>
              </div>
            </div>
          ) : null}

          {canRegisterFromInvite && authChoice ? (
            <div className="soft-panel-muted mt-6 flex rounded-[20px] p-1.5">
              <button
                type="button"
                onClick={() => handleModeChange("register")}
                className={`flex-1 px-3 py-2.5 text-sm transition-colors ${
                  mode === "register" ? "soft-tab-active" : "soft-tab"
                }`}
              >
                {copy.auth.page.registerTab}
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className={`flex-1 px-3 py-2.5 text-sm transition-colors ${
                  mode === "login" ? "soft-tab-active" : "soft-tab"
                }`}
              >
                {copy.auth.page.loginTab}
              </button>
            </div>
          ) : null}

          {(!canRegisterFromInvite || authChoice) && (
            <form
              onSubmit={handleSubmit}
              onFocusCapture={ensureSubmitVisible}
              className="mt-5 space-y-4"
            >
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

            {isRegisterMode && <p className="soft-field-hint">{ui.profileHint}</p>}

            {passwordsMismatch && (
              <p className="soft-note-warning">{copy.auth.page.passwordsMismatch}</p>
            )}
            {error && <p className="soft-note-danger">{error}</p>}

            <button
              ref={submitButtonRef}
              type="submit"
              disabled={
                !canRegisterFromInvite ||
                isPending ||
                !email.trim() ||
                (isRegisterMode ? password.length < 8 : password.length === 0) ||
                (isRegisterMode && (!passwordConfirm || password !== passwordConfirm))
              }
              className={`${appBtnPrimaryClass} w-full px-4 disabled:opacity-50`}
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
          )}
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

function InviteSummaryCard({
  familyName,
  subtitle,
  metadata,
  note,
}: {
  familyName: string;
  subtitle: string;
  metadata: string[];
  note?: string | null;
}) {
  return (
    <div className="mt-4">
      <p className="text-[1.24rem] font-extrabold tracking-[-0.04em] text-foreground sm:text-[1.36rem]">
        {familyName}
      </p>
      <p className="mt-3 max-w-[34rem] text-sm leading-6 text-muted">{subtitle}</p>
      <p className="mt-4 text-sm leading-6 text-muted">{metadata.join(" • ")}</p>
      {note ? <p className="mt-3 text-sm leading-6 text-muted">{note}</p> : null}
    </div>
  );
}

function PublicHandoffActions({
  title,
  hint,
  primaryLabel,
  secondaryLabel,
  secondaryHint,
  primaryHref,
  secondaryHref,
  onPrimaryAction,
  onSecondaryAction,
  isPending = false,
  className,
}: {
  title: string;
  hint: string;
  primaryLabel: string;
  secondaryLabel?: string | null;
  secondaryHint?: string | null;
  primaryHref: string;
  secondaryHref?: string | null;
  onPrimaryAction?: (() => void | Promise<void>) | undefined;
  onSecondaryAction?: (() => void | Promise<void>) | undefined;
  isPending?: boolean;
  className?: string;
}) {
  return (
    <div className={`mt-6 space-y-3 ${className ?? ""}`.trim()}>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted">{hint}</p>
      </div>
      <div className="auth-v3-handoff-stack">
        {onPrimaryAction ? (
          <button
            type="button"
            onClick={() => {
              void onPrimaryAction();
            }}
            disabled={isPending}
            className={`${appBtnPrimaryClass} w-full px-4 text-center no-underline disabled:opacity-50`}
          >
            {primaryLabel}
          </button>
        ) : (
          <a
            href={primaryHref}
            className={`${appBtnPrimaryClass} w-full px-4 text-center no-underline`}
          >
            {primaryLabel}
          </a>
        )}
        {secondaryLabel && secondaryHref ? (
          onSecondaryAction ? (
            <button
              type="button"
              onClick={() => {
                void onSecondaryAction();
              }}
              disabled={isPending}
              className={`${appBtnSecondaryClass} w-full px-4 text-center no-underline disabled:opacity-50`}
            >
              {secondaryLabel}
            </button>
          ) : (
            <a
              href={secondaryHref}
              className={`${appBtnSecondaryClass} w-full px-4 text-center no-underline`}
            >
              {secondaryLabel}
            </a>
          )
        ) : null}
      </div>
      {secondaryHint ? <p className="text-sm leading-6 text-muted">{secondaryHint}</p> : null}
    </div>
  );
}

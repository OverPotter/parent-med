import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, register } from "@shared/api/auth";
import { applySessionToClient } from "@shared/api/client";
import {
  acceptFamilyInvite,
  acceptLatestDevFamilyInvite,
  fetchFamilyInvitePreview,
  fetchLatestDevFamilyInvitePreview,
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
  buildJoinFamilyRoute,
  clearPendingFamilyInviteRoute,
  PENDING_FAMILY_INVITE_POST_INSTALL_KEY,
  PENDING_FAMILY_INVITE_TOKEN_STORAGE_KEY,
  persistPendingFamilyInviteRoute,
} from "@shared/runtime/inviteFlow";
import { useAppStore } from "@shared/store/useAppStore";

type Mode = "register" | "login";
type InviteFailureState = {
  title: string;
  description: string;
  inlineMessage: string;
  blocksAuth: boolean;
  clearPendingRoute: boolean;
  transient?: boolean;
};

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

function resolveInviteFailureState(params: {
  language: "ru" | "en";
  code: string | null;
  detail: string | null;
  kind: "preview" | "action";
}): InviteFailureState {
  const fallbackDescription =
    params.language === "ru"
      ? "Не удалось проверить приглашение. Попробуйте ещё раз немного позже."
      : "Could not verify the invite right now. Try again a bit later.";
  const fallbackInlineMessage =
    params.detail ||
    (params.language === "ru"
      ? "Не удалось продолжить по приглашению."
      : "Could not continue with this invite.");

  switch (params.code) {
    case "FAMILY_INVITE_NOT_FOUND":
      return {
        title: params.language === "ru" ? "Приглашение не найдено" : "Invite not found",
        description:
          params.language === "ru"
            ? "Эта ссылка больше не работает. Попросите владельца семьи отправить новое приглашение."
            : "This link no longer works. Ask the family owner to send a new invite.",
        inlineMessage:
          params.language === "ru"
            ? "Эта ссылка больше не работает. Нужна новая ссылка."
            : "This link no longer works. A new invite link is needed.",
        blocksAuth: true,
        clearPendingRoute: true,
      };
    case "FAMILY_INVITE_ALREADY_USED":
      return {
        title: params.language === "ru" ? "Приглашение уже использовано" : "Invite already used",
        description:
          params.language === "ru"
            ? "По этой ссылке уже присоединились к семье. Попросите отправить новое приглашение."
            : "This link has already been used to join the family. Ask for a new invite.",
        inlineMessage:
          params.language === "ru"
            ? "Это приглашение уже использовано. Нужна новая ссылка."
            : "This invite has already been used. A new link is needed.",
        blocksAuth: true,
        clearPendingRoute: true,
      };
    case "FAMILY_INVITE_EXPIRED":
      return {
        title: params.language === "ru" ? "Срок приглашения истёк" : "Invite expired",
        description:
          params.language === "ru"
            ? "Срок действия этой ссылки закончился. Попросите владельца семьи отправить новое приглашение."
            : "This invite link has expired. Ask the family owner to send a new one.",
        inlineMessage:
          params.language === "ru"
            ? "Срок действия приглашения истёк. Нужна новая ссылка."
            : "This invite has expired. A new link is needed.",
        blocksAuth: true,
        clearPendingRoute: true,
      };
    case "FAMILY_INVITE_INVALID":
    case "DEV_INVITE_DISABLED":
      return {
        title: params.language === "ru" ? "Приглашение недоступно" : "Invite unavailable",
        description:
          params.language === "ru"
            ? "Семья по этой ссылке недоступна. Попросите отправить новое приглашение."
            : "The family behind this link is unavailable. Ask for a new invite.",
        inlineMessage:
          params.language === "ru"
            ? "По этой ссылке сейчас нельзя присоединиться к семье."
            : "You cannot join the family through this link right now.",
        blocksAuth: true,
        clearPendingRoute: true,
      };
    case "ALREADY_IN_FAMILY":
      return {
        title:
          params.language === "ru"
            ? "Аккаунт уже в этой семье"
            : "This account is already in the family",
        description:
          params.language === "ru"
            ? "Вы уже подключены к этой семье. Можно просто открыть семейный кабинет."
            : "You are already connected to this family. Open the family workspace directly.",
        inlineMessage:
          params.language === "ru"
            ? "Этот аккаунт уже состоит в нужной семье."
            : "This account is already in the target family.",
        blocksAuth: params.kind === "preview",
        clearPendingRoute: true,
      };
    case "CURRENT_FAMILY_NOT_EMPTY":
      return {
        title:
          params.language === "ru"
            ? "Сначала освободите текущую семью"
            : "Leave your current family first",
        description:
          params.language === "ru"
            ? "Нельзя перейти в другую семью, пока в вашей текущей семье есть другие участники."
            : "You cannot move to another family while your current family still has other members.",
        inlineMessage:
          params.language === "ru"
            ? "Сначала нужно освободить текущую семью: в ней ещё есть другие участники."
            : "Your current family still has other members, so you cannot join another family yet.",
        blocksAuth: false,
        clearPendingRoute: false,
      };
    default:
      return {
        title:
          params.language === "ru"
            ? "Не удалось продолжить по приглашению"
            : "Could not continue with this invite",
        description: params.detail || fallbackDescription,
        inlineMessage: fallbackInlineMessage,
        blocksAuth: params.kind === "preview",
        clearPendingRoute: false,
        transient: true,
      };
  }
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
          publicRegisterTitle: "Создать аккаунт",
          publicRegisterHint:
            "Новый аккаунт сразу привяжется к семье из этого приглашения. После этого установите приложение и войдите под тем же email.",
          publicRegisterSubmit: "Создать аккаунт",
          publicRegisterLoading: "Создаём аккаунт…",
          publicRegisterSuccessTitle: "Аккаунт создан",
          publicRegisterSuccessDescription:
            "Теперь установите или откройте PillPath на iPhone и войдите под этим email, чтобы продолжить в семейном кабинете.",
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
          publicRegisterTitle: "Create account",
          publicRegisterHint:
            "A new account created here will be linked to this family invite immediately. Then install or open the iPhone app and sign in with the same email.",
          publicRegisterSubmit: "Create account",
          publicRegisterLoading: "Creating account…",
          publicRegisterSuccessTitle: "Account created",
          publicRegisterSuccessDescription:
            "Now install or open PillPath on iPhone and sign in with this email to continue inside the family workspace.",
          invalidInviteHelpTitle: "A new invite link is needed",
          invalidInviteHelpDescription:
            "You cannot create an account or join a family from this link. Ask the family owner to send a new invite.",
        };
  const [publicInviteRegisteredEmail, setPublicInviteRegisteredEmail] = useState<string | null>(
    null
  );
  const canRegisterFromInvite = Boolean(token) || isDevLatestShortcut;

  const {
    data: invitePreview,
    isLoading: isInviteLoading,
    error: inviteError,
  } = useQuery({
    queryKey: ["family-invite", isDevLatestShortcut ? "dev-latest" : "preview", token],
    queryFn: () =>
      isDevLatestShortcut ? fetchLatestDevFamilyInvitePreview() : fetchFamilyInvitePreview(token),
    enabled: isDevLatestShortcut || Boolean(token),
    retry: false,
  });

  const isAuthenticated = Boolean(accountId);
  const isAlreadyInTargetFamily = Boolean(
    invitePreview && currentFamilyId === invitePreview.familyId
  );
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
      code: getApiErrorCode(inviteError),
      detail: getApiErrorDetail(inviteError),
      kind: "preview",
    });
  }, [inviteError, isDevLatestShortcut, language, token, ui.incompleteInviteLink]);

  useEffect(() => {
    if (!isAuthenticated || !isAlreadyInTargetFamily) {
      return;
    }
    clearPendingFamilyInviteRoute();
    navigate("/family", { replace: true });
  }, [isAlreadyInTargetFamily, isAuthenticated, navigate]);

  const inviteErrorMessage = invitePreviewFailure?.inlineMessage ?? null;
  const canRenderPublicInviteRegistration = Boolean(
    token && invitePreview && !invitePreviewFailure && !isDevLatestShortcut
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
      isDevLatestShortcut ? acceptLatestDevFamilyInvite() : acceptFamilyInvite(token),
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
      (!token && !isDevLatestShortcut) ||
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
      use_latest_dev_invite: isDevLatestShortcut || undefined,
      preferred_language: language,
    });
  };

  const isPending =
    loginMutation.isPending || registerMutation.isPending || acceptInviteMutation.isPending;
  const passwordsMismatch =
    canRegisterFromInvite &&
    mode === "register" &&
    passwordConfirm.length > 0 &&
    password !== passwordConfirm;
  const isRegisterMode = canRegisterFromInvite && mode === "register";
  const joinFamilyRoute = buildJoinFamilyRoute(token);
  const nativeJoinFamilyUrl = buildNativeAppUrl(joinFamilyRoute);
  const primaryJoinFamilyHref = appStoreUrl || nativeJoinFamilyUrl;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const route = isDevLatestShortcut
        ? "/join-family?dev-latest=1"
        : token
          ? buildJoinFamilyRoute(token)
          : null;
      if (!route) {
        clearPendingFamilyInviteRoute();
        return;
      }
      persistPendingFamilyInviteRoute(route);
      if (token) {
        window.localStorage.setItem(PENDING_FAMILY_INVITE_TOKEN_STORAGE_KEY, token);
      }
    } catch {
      // Best effort only: invite preview should still work without storage.
    }
  }, [isDevLatestShortcut, token]);

  useEffect(() => {
    if (!invitePreviewFailure?.clearPendingRoute) {
      return;
    }
    clearPendingFamilyInviteRoute();
  }, [invitePreviewFailure]);

  const accountHref = hasSession ? "/more" : "/auth?mode=login&next=invite";
  const accountLabel =
    language === "ru" ? (hasSession ? "Ещё" : "Войти") : hasSession ? "More" : "Login";

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
        savedToken = window.localStorage.getItem(PENDING_FAMILY_INVITE_POST_INSTALL_KEY);
      } catch {
        return;
      }

      if (savedToken !== token) {
        return;
      }

      hasAttemptedPostInstallOpenRef.current = true;
      window.localStorage.removeItem(PENDING_FAMILY_INVITE_POST_INSTALL_KEY);
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
      window.localStorage.setItem(PENDING_FAMILY_INVITE_POST_INSTALL_KEY, token);
    } catch {
      // Best effort only: explicit fallback button remains available.
    }
  };

  const handleModeChange = (nextMode: Mode) => {
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
                title={ui.handoffTitle}
                hint={ui.handoffHint}
                primaryLabel={appStoreUrl ? ui.downloadApp : ui.openApp}
                secondaryLabel={appStoreUrl ? ui.installedApp : null}
                secondaryHint={appStoreUrl ? ui.installedAppHint : null}
                primaryHref={primaryJoinFamilyHref}
                secondaryHref={appStoreUrl ? nativeJoinFamilyUrl : null}
                onPrimaryClick={appStoreUrl ? handleAppStoreInviteInstallStart : undefined}
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
                primaryHref={primaryJoinFamilyHref}
                secondaryHref={appStoreUrl ? nativeJoinFamilyUrl : null}
                onPrimaryClick={appStoreUrl ? handleAppStoreInviteInstallStart : undefined}
                className="pt-2"
              />
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

          {canRegisterFromInvite ? (
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

          <form onSubmit={handleSubmit} onFocusCapture={ensureSubmitVisible} className="mt-5 space-y-4">
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
  onPrimaryClick,
  className,
}: {
  title: string;
  hint: string;
  primaryLabel: string;
  secondaryLabel?: string | null;
  secondaryHint?: string | null;
  primaryHref: string;
  secondaryHref?: string | null;
  onPrimaryClick?: (() => void) | undefined;
  className?: string;
}) {
  return (
    <div className={`mt-6 space-y-3 ${className ?? ""}`.trim()}>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted">{hint}</p>
      </div>
      <div className="auth-v3-handoff-stack">
        <a
          href={primaryHref}
          onClick={onPrimaryClick}
          target={onPrimaryClick ? "_blank" : undefined}
          rel={onPrimaryClick ? "noreferrer" : undefined}
          className={`${appBtnPrimaryClass} w-full px-4 text-center no-underline`}
        >
          {primaryLabel}
        </a>
        {secondaryLabel && secondaryHref ? (
          <a
            href={secondaryHref}
            className={`${appBtnSecondaryClass} w-full px-4 text-center no-underline`}
          >
            {secondaryLabel}
          </a>
        ) : null}
      </div>
      {secondaryHint ? <p className="text-sm leading-6 text-muted">{secondaryHint}</p> : null}
    </div>
  );
}

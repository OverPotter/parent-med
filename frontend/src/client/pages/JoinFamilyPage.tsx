import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, register } from "@shared/api/auth";
import { acceptFamilyInvite, fetchFamilyInvitePreview } from "@shared/api/familyInvites";
import { AnalyticsEvents, normalizeClientError, trackEvent } from "@shared/analytics";
import { AuthPasswordField, RememberMeCard } from "@shared/components/AuthFormControls";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";

type Mode = "register" | "login";
const appBtnPrimaryClass =
  "app-btn-primary-md soft-button-primary inline-flex items-center justify-center px-4";

function roleLabel(role: string): string {
  return role === "admin" ? "Администратор" : "Участник семьи";
}

export function JoinFamilyPage() {
  const { language } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = searchParams.get("token")?.trim() ?? "";
  const [mode, setMode] = useState<Mode>("register");
  const [loginValue, setLoginValue] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accountId = useAppStore((s) => s.accountId);
  const accountLogin = useAppStore((s) => s.accountLogin);
  const accountEmail = useAppStore((s) => s.accountEmail);
  const accountDisplayName = useAppStore((s) => s.accountDisplayName);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const setSession = useAppStore((s) => s.setSession);

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
      return "Ссылка приглашения неполная. Откройте корректную ссылку из сообщения.";
    }
    return (
      (inviteError as { response?: { data?: { detail?: string } } } | null)?.response?.data
        ?.detail ?? null
    );
  }, [inviteError, token]);

  const loginMutation = useMutation({
    mutationFn: (payload: { login: string; password: string; remember_me: boolean }) =>
      login(payload),
    onSuccess: (data) => {
      setSession(data);
      setError(null);
      trackEvent(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { entry: "join_family" });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Не удалось войти в аккаунт.");
      trackEvent(AnalyticsEvents.AUTH_ERROR, {
        mode: "login",
        entry: "join_family",
        message: normalizeClientError(err),
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: {
      login: string;
      email: string;
      password: string;
      display_name: string;
      relationship_label?: string;
      phone?: string;
      remember_me: boolean;
      invite_token: string;
      preferred_language: "ru" | "en";
    }) => register(payload),
    onSuccess: (data) => {
      setSession(data);
      setError(null);
      trackEvent(AnalyticsEvents.AUTH_REGISTER_SUCCESS, { entry: "join_family" });
      queryClient.invalidateQueries({ queryKey: ["families"] });
      navigate("/family", { replace: true });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Не удалось создать аккаунт по приглашению.");
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
      setSession(data);
      setError(null);
      trackEvent(AnalyticsEvents.FAMILY_INVITE_ACCEPTED);
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
      navigate("/family", { replace: true });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Не удалось принять приглашение.");
      trackEvent(AnalyticsEvents.AUTH_ERROR, {
        mode: "accept_invite",
        message: normalizeClientError(err),
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedLogin = loginValue.trim();
    const trimmedEmail = email.trim();
    const trimmedDisplayName = displayName.trim();
    if (!token || !trimmedLogin || password.length < 6) {
      return;
    }
    if (mode === "login") {
      setError(null);
      loginMutation.mutate({ login: trimmedLogin, password, remember_me: rememberMe });
      return;
    }
    if (password !== passwordConfirm) {
      setError("Пароли не совпадают.");
      return;
    }
    if (!trimmedEmail || !trimmedDisplayName) {
      setError("Для регистрации нужны email и имя в семье.");
      return;
    }
    setError(null);
    registerMutation.mutate({
      login: trimmedLogin,
      email: trimmedEmail,
      password,
      display_name: trimmedDisplayName,
      relationship_label: relationshipLabel.trim() || undefined,
      phone: phone.trim() || undefined,
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

  return (
    <div className="min-w-0 space-y-6">
      <PageIntro
        title="Присоединиться к семейному кабинету"
        subtitle="У каждого взрослого свой личный аккаунт, но дети, аптечка и история болезни общие на уровне семьи."
        eyebrow="Приглашение в семью"
        compactOnMobile
        hideOnMobile
      />

      <Surface className="p-5 sm:p-6">
        <p className="app-card-title">Куда ведёт ссылка</p>
        {isInviteLoading ? (
          <p className="mt-3 text-sm text-muted">Проверяем приглашение…</p>
        ) : inviteErrorMessage ? (
          <p className="soft-note-danger mt-3">{inviteErrorMessage}</p>
        ) : invitePreview ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoCard label="Семья" value={invitePreview.familyName} />
            <InfoCard label="Роль по ссылке" value={roleLabel(invitePreview.familyRole)} />
            <InfoCard
              label="Действует до"
              value={new Date(invitePreview.expiresAt).toLocaleString("ru-RU")}
            />
          </div>
        ) : null}
      </Surface>

      {invitePreview && isAuthenticated ? (
        <Surface className="p-5 sm:p-6">
          <p className="app-card-title">Текущий аккаунт</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoCard
              label="Имя в семье"
              value={accountDisplayName || accountLogin || "Без имени"}
            />
            <InfoCard label="Логин" value={accountLogin ? `@${accountLogin}` : "Не указан"} />
            <InfoCard label="Email" value={accountEmail || "Не указан"} />
          </div>

          {isAlreadyInTargetFamily ? (
            <p className="soft-note-warning mt-4">Этот аккаунт уже находится в нужной семье.</p>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-muted">
                После подтверждения аккаунт войдёт в семью{" "}
                <span className="font-medium text-foreground">{invitePreview.familyName}</span>.
              </p>
              {error && <p className="soft-note-danger mt-4">{error}</p>}
              <button
                type="button"
                onClick={() => acceptInviteMutation.mutate()}
                disabled={isPending}
                className="soft-button-primary mt-4 disabled:opacity-50"
              >
                {acceptInviteMutation.isPending ? "Подключаем…" : "Присоединиться к семье"}
              </button>
            </>
          )}
        </Surface>
      ) : (
        <Surface className="p-5 sm:p-6">
          <h2 className="app-card-title">Создать аккаунт или войти</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Новый аккаунт можно сразу привязать к семье по этой ссылке. Если аккаунт уже есть,
            войдите под ним, затем подтвердите присоединение.
          </p>

          <div className="soft-panel-muted mt-6 flex rounded-[20px] p-1.5">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 px-3 py-2.5 text-sm transition-colors ${
                mode === "register" ? "soft-tab-active" : "soft-tab"
              }`}
            >
              Регистрация
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 px-3 py-2.5 text-sm transition-colors ${
                mode === "login" ? "soft-tab-active" : "soft-tab"
              }`}
            >
              Вход
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="soft-panel rounded-[24px] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="app-card-title">Обязательные поля</p>
                  <p className="soft-field-hint mt-1">
                    Для регистрации нужны логин, пароль, recovery email и имя в семье.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div
                  className={`grid gap-3 ${isRegisterMode ? "sm:grid-cols-2" : "grid-cols-1"}`}
                >
                  <label className="block">
                    <span className="soft-field-label">Логин</span>
                    <input
                      name="username"
                      type="text"
                      value={loginValue}
                      onChange={(event) => setLoginValue(event.target.value)}
                      className="soft-input w-full px-4"
                      placeholder="Придумайте логин для входа"
                      autoComplete="username"
                    />
                    <span className="soft-field-hint">
                      Логин нужен только для входа. Имя в семье задаётся отдельно.
                    </span>
                  </label>
                  {isRegisterMode ? (
                    <label className="block">
                      <span className="soft-field-label">Recovery email</span>
                      <input
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="soft-input w-full px-4"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                      <span className="soft-field-hint">
                        Email нужен для будущего восстановления доступа.
                      </span>
                    </label>
                  ) : null}
                </div>

                <div
                  className={`grid gap-3 ${isRegisterMode ? "sm:grid-cols-2" : "grid-cols-1"}`}
                >
                  {isRegisterMode ? (
                    <label className="block">
                      <span className="soft-field-label">Имя в семье</span>
                      <input
                        name="display-name"
                        type="text"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        className="soft-input w-full px-4"
                        placeholder="Например: Дима"
                        autoComplete="name"
                      />
                    </label>
                  ) : null}
                  <AuthPasswordField
                    label="Пароль"
                    value={password}
                    onChange={setPassword}
                    placeholder="Минимум 6 символов"
                    isVisible={isPasswordVisible}
                    onToggleVisibility={() => setIsPasswordVisible((current) => !current)}
                    name="current-password"
                    autoComplete={isRegisterMode ? "new-password" : "current-password"}
                  />
                  {isRegisterMode && (
                    <AuthPasswordField
                      label="Повторите пароль"
                      value={passwordConfirm}
                      onChange={setPasswordConfirm}
                      placeholder="Повторите пароль"
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
              <details className="soft-panel-muted rounded-[24px] p-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                  Дополнительные поля
                </summary>
                <p className="soft-field-hint mt-2">
                  Здесь можно указать дополнительные подписи и контакты.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="soft-field-label">Кто вы в семье</span>
                    <input
                      name="relationship-label"
                      type="text"
                      value={relationshipLabel}
                      onChange={(event) => setRelationshipLabel(event.target.value)}
                      className="soft-input w-full px-4"
                      placeholder="Например: папа"
                      autoComplete="organization-title"
                    />
                    <span className="soft-field-hint">
                      Короткая подпись рядом с именем: мама, папа, няня.
                    </span>
                  </label>
                  <label className="block">
                    <span className="soft-field-label">Телефон</span>
                    <input
                      name="tel"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="soft-input w-full px-4"
                      placeholder="+375 ..."
                      autoComplete="tel"
                    />
                  </label>
                </div>
              </details>
            )}

            {passwordsMismatch && <p className="soft-note-warning">Пароли должны совпадать.</p>}
            {error && <p className="soft-note-danger">{error}</p>}

            <button
              type="submit"
              disabled={
                !token ||
                isPending ||
                !loginValue.trim() ||
                password.length < 6 ||
                (isRegisterMode &&
                  (!email.trim() ||
                    !displayName.trim() ||
                    !passwordConfirm ||
                    password !== passwordConfirm))
              }
              className={`${appBtnPrimaryClass} w-full disabled:opacity-50`}
            >
              {mode === "login"
                ? loginMutation.isPending
                  ? "Входим…"
                  : "Войти и продолжить"
                : registerMutation.isPending
                  ? "Создаём аккаунт…"
                  : "Создать аккаунт в семье"}
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

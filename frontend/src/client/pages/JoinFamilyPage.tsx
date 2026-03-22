import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, register } from "@shared/api/auth";
import { acceptFamilyInvite, fetchFamilyInvitePreview } from "@shared/api/familyInvites";
import { AuthPasswordField, RememberMeCard } from "@shared/components/AuthFormControls";
import { Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";

type Mode = "register" | "login";

function roleLabel(role: string): string {
  return role === "owner" ? "Владелец" : "Участник семьи";
}

export function JoinFamilyPage() {
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
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Не удалось войти в аккаунт.");
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
      invite_token: string;
    }) => register(payload),
    onSuccess: (data) => {
      setSession(data);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["families"] });
      navigate("/family", { replace: true });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Не удалось создать аккаунт по приглашению.");
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: () => acceptFamilyInvite(token),
    onSuccess: (data) => {
      setSession(data);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
      navigate("/family", { replace: true });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Не удалось принять приглашение.");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedLogin = loginValue.trim();
    const trimmedEmail = email.trim();
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
    setError(null);
    registerMutation.mutate({
      login: trimmedLogin,
      email: trimmedEmail || undefined,
      password,
      display_name: displayName.trim() || undefined,
      relationship_label: relationshipLabel.trim() || undefined,
      phone: phone.trim() || undefined,
      remember_me: rememberMe,
      invite_token: token,
    });
  };

  const isPending =
    loginMutation.isPending || registerMutation.isPending || acceptInviteMutation.isPending;
  const passwordsMismatch =
    mode === "register" && passwordConfirm.length > 0 && password !== passwordConfirm;
  const isRegisterMode = mode === "register";

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <span className="soft-pill inline-flex rounded-full px-3 py-1 text-xs tracking-[0.04em]">
          Приглашение в семью
        </span>
        <h1 className="app-title mt-4 text-3xl sm:text-[2.6rem]">
          Присоединиться к семейному кабинету
        </h1>
        <p className="app-subtitle mt-3 max-w-2xl text-sm sm:text-base">
          У каждого взрослого свой личный аккаунт, но дети, аптечка и история болезни общие на
          уровне семьи.
        </p>
      </div>

      <Surface className="p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Куда ведёт ссылка</p>
        {isInviteLoading ? (
          <p className="mt-3 text-sm text-muted">Проверяем приглашение…</p>
        ) : inviteErrorMessage ? (
          <p className="soft-note-danger mt-3 rounded-2xl px-4 py-3 text-sm">
            {inviteErrorMessage}
          </p>
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
          <p className="text-sm font-medium text-foreground">Текущий аккаунт</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoCard
              label="Имя в семье"
              value={accountDisplayName || accountLogin || "Без имени"}
            />
            <InfoCard label="Логин" value={accountLogin ? `@${accountLogin}` : "Не указан"} />
            <InfoCard label="Email" value={accountEmail || "Не указан"} />
          </div>

          {isAlreadyInTargetFamily ? (
            <p className="soft-note-warning mt-4 rounded-2xl px-4 py-3 text-sm">
              Этот аккаунт уже находится в нужной семье.
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-muted">
                После подтверждения аккаунт войдёт в семью{" "}
                <span className="font-medium text-foreground">{invitePreview.familyName}</span>.
              </p>
              {error && (
                <p className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">{error}</p>
              )}
              <button
                type="button"
                onClick={() => acceptInviteMutation.mutate()}
                disabled={isPending}
                className="soft-button-primary mt-4 rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
              >
                {acceptInviteMutation.isPending ? "Подключаем…" : "Присоединиться к семье"}
              </button>
            </>
          )}
        </Surface>
      ) : (
        <Surface className="p-5 sm:p-6">
          <h2 className="app-card-title text-xl">Создать аккаунт или войти</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Новый аккаунт можно сразу привязать к семье по этой ссылке. Если аккаунт уже есть,
            войдите под ним, затем подтвердите присоединение.
          </p>

          <div className="soft-panel-muted mt-6 flex rounded-[20px] p-1.5">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                mode === "register" ? "soft-tab-active" : "soft-tab"
              }`}
            >
              Регистрация
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
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
                  <p className="text-sm font-medium text-foreground">Обязательные поля</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Для входа и быстрой регистрации нужен только логин для входа и пароль.
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
                <div className={`grid gap-3 ${isRegisterMode ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                  <label className="block">
                    <span className="mb-2 block text-sm text-muted">Логин</span>
                    <input
                      name="username"
                      type="text"
                      value={loginValue}
                      onChange={(event) => setLoginValue(event.target.value)}
                      className="soft-input w-full rounded-2xl px-4 py-3"
                      placeholder="Придумайте логин для входа"
                      autoComplete="username"
                    />
                    <span className="mt-2 block text-xs text-muted">
                      Логин нужен только для входа. Имя в семье задаётся отдельно.
                    </span>
                  </label>
                </div>

                <div className={`grid gap-3 ${isRegisterMode ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                  <AuthPasswordField
                    label="Пароль"
                    value={password}
                    onChange={setPassword}
                    placeholder="Минимум 6 символов"
                    isVisible={isPasswordVisible}
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
                <p className="mt-2 text-xs leading-5 text-muted">
                  Здесь можно указать, как вас будут видеть в семье.
                </p>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm text-muted">Email</span>
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="soft-input w-full rounded-2xl px-4 py-3"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <span className="mt-2 block text-xs text-muted">
                    Для beta необязательно. Можно добавить позже в настройках.
                  </span>
                </label>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm text-muted">Имя в семье</span>
                  <input
                    name="display-name"
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="soft-input w-full rounded-2xl px-4 py-3"
                    placeholder="Например: Дима"
                    autoComplete="name"
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
                      name="relationship-label"
                      type="text"
                      value={relationshipLabel}
                      onChange={(event) => setRelationshipLabel(event.target.value)}
                      className="soft-input w-full rounded-2xl px-4 py-3"
                      placeholder="Например: папа"
                      autoComplete="organization-title"
                    />
                    <span className="mt-2 block text-xs text-muted">
                      Короткая подпись рядом с именем: мама, папа, няня.
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm text-muted">Телефон</span>
                    <input
                      name="tel"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="soft-input w-full rounded-2xl px-4 py-3"
                      placeholder="+375 ..."
                      autoComplete="tel"
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
                !token ||
                isPending ||
                !loginValue.trim() ||
                password.length < 6 ||
                (isRegisterMode && (!passwordConfirm || password !== passwordConfirm))
              }
              className="soft-button-primary w-full rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
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
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, register } from "@shared/api/auth";
import { acceptFamilyInvite, fetchFamilyInvitePreview } from "@shared/api/familyInvites";
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
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const accountId = useAppStore((s) => s.accountId);
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
    mutationFn: (payload: { email: string; password: string }) => login(payload),
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
      email: string;
      password: string;
      display_name?: string;
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
    const trimmedEmail = email.trim();
    if (!token || !trimmedEmail || password.length < 6) {
      return;
    }
    if (mode === "login") {
      setError(null);
      loginMutation.mutate({ email: trimmedEmail, password });
      return;
    }
    if (password !== passwordConfirm) {
      setError("Пароли не совпадают.");
      return;
    }
    setError(null);
    registerMutation.mutate({
      email: trimmedEmail,
      password,
      display_name: displayName.trim() || undefined,
      invite_token: token,
    });
  };

  const isPending =
    loginMutation.isPending || registerMutation.isPending || acceptInviteMutation.isPending;
  const passwordsMismatch =
    mode === "register" && passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <span className="soft-pill inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
          Приглашение в семью
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
          Присоединиться к семейному кабинету
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
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
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Имя в семье" value={accountDisplayName || "Без имени"} />
            <InfoCard label="Email" value={accountEmail || "Не удалось получить email"} />
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
          <h2 className="text-xl font-semibold text-foreground">Создать аккаунт или войти</h2>
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

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <label className="block">
                <span className="block text-sm text-muted">Как вас показывать в семье</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                  placeholder="Например: Папа Дима"
                />
              </label>
            )}

            <label className="block">
              <span className="block text-sm text-muted">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                placeholder="Минимум 6 символов"
              />
            </label>

            {mode === "register" && (
              <label className="block">
                <span className="block text-sm text-muted">Повторите пароль</span>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                  placeholder="Повторите пароль"
                />
              </label>
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
                !email.trim() ||
                password.length < 6 ||
                (mode === "register" && (!passwordConfirm || password !== passwordConfirm))
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

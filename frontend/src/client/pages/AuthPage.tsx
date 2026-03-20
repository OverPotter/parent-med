/**
 * Публичная стартовая страница: о сервисе, регистрация и вход.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, register } from "@shared/api/auth";
import { Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";

type Mode = "login" | "register";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const setSession = useAppStore((s) => s.setSession);

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) => login(payload),
    onSuccess: (data) => {
      setSession(data);
      setError(null);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка входа");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: { email: string; password: string; display_name?: string }) =>
      register(payload),
    onSuccess: (data) => {
      setSession(data);
      setError(null);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка регистрации");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      return;
    }
    if (mode === "register" && password !== passwordConfirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (mode === "login") {
      setError(null);
      loginMutation.mutate({ email: trimmedEmail, password });
      return;
    }
    setError(null);
    registerMutation.mutate({
      email: trimmedEmail,
      password,
      display_name: displayName.trim() || undefined,
    });
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;
  const passwordsMismatch =
    mode === "register" && passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="min-w-0">
          <span className="soft-pill inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
            Parent Med
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Семейный кабинет для детей, лекарств и истории болезни.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            У каждого взрослого свой личный аккаунт. Внутри семьи остаются общими дети, домашняя
            аптечка, эпизоды болезни и журнал приёма лекарств.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="soft-card rounded-[24px] p-4">
              <h2 className="text-sm font-medium text-foreground">О семье</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Название семьи, участники и общий контекст для родителей и опекунов.
              </p>
            </div>
            <div className="soft-card rounded-[24px] p-4">
              <h2 className="text-sm font-medium text-foreground">О детях</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Профили детей, вес, эпизоды болезни и температура.
              </p>
            </div>
            <div className="soft-card rounded-[24px] p-4">
              <h2 className="text-sm font-medium text-foreground">О лекарствах</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Аптечка, сроки годности и базовые safety-проверки.
              </p>
            </div>
          </div>
        </section>

        <Surface className="overflow-hidden p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-foreground">Начать работу</h2>
          <p className="mt-2 text-sm text-muted">
            Зарегистрируйте свой аккаунт или войдите в уже созданный. Семья создастся автоматически,
            а второго взрослого можно будет пригласить позже.
          </p>

          <div className="soft-panel-muted mt-6 flex rounded-[20px] p-1.5">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                mode === "login" ? "soft-tab-active" : "soft-tab"
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                mode === "register" ? "soft-tab-active" : "soft-tab"
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="block text-sm text-muted">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                placeholder="Минимум 6 символов"
              />
            </label>

            {mode === "register" && (
              <label className="block">
                <span className="block text-sm text-muted">Как показывать вас в семье</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                  placeholder="Например: Мама Аня"
                />
              </label>
            )}

            {mode === "register" && (
              <label className="block">
                <span className="block text-sm text-muted">Повторите пароль</span>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
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
                isPending ||
                !email.trim() ||
                password.length < 6 ||
                (mode === "register" && (!passwordConfirm || password !== passwordConfirm))
              }
              className="soft-button-primary w-full rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
            >
              {mode === "login"
                ? isPending
                  ? "Входим…"
                  : "Войти"
                : isPending
                  ? "Регистрируем…"
                  : "Создать аккаунт"}
            </button>
          </form>
        </Surface>
      </div>
    </div>
  );
}

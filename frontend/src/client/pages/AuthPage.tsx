/**
 * Публичная стартовая страница: о сервисе, регистрация и вход.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, register } from "@shared/api/auth";
import { useAppStore } from "@shared/store/useAppStore";

type Mode = "login" | "register";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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
    mutationFn: (payload: { email: string; password: string }) => register(payload),
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
    registerMutation.mutate({ email: trimmedEmail, password });
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;
  const passwordsMismatch =
    mode === "register" && passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="min-w-0">
          <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted">
            Parent Med
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Семейный кабинет для детей, лекарств и истории болезни.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Один аккаунт соответствует одной семье. Внутри семьи можно вести родителей, детей,
            домашнюю аптечку, эпизоды болезни и журнал приёма лекарств.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <h2 className="text-sm font-medium text-foreground">О семье</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Название семьи, родители и общий контекст аккаунта.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <h2 className="text-sm font-medium text-foreground">О детях</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Профили детей, вес, эпизоды болезни и температура.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <h2 className="text-sm font-medium text-foreground">О лекарствах</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Аптечка, сроки годности и базовые safety-проверки.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-foreground">Начать работу</h2>
          <p className="mt-2 text-sm text-muted">
            Зарегистрируйте аккаунт или войдите в уже созданный профиль. Семья создастся
            автоматически внутри аккаунта.
          </p>

          <div className="mt-6 flex rounded-xl border border-border p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                mode === "login" ? "bg-primary text-white" : "text-foreground hover:bg-muted/30"
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                mode === "register" ? "bg-primary text-white" : "text-foreground hover:bg-muted/30"
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
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                placeholder="Минимум 6 символов"
              />
            </label>

            {mode === "register" && (
              <label className="block">
                <span className="block text-sm text-muted">Повторите пароль</span>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="Повторите пароль"
                />
              </label>
            )}

            {passwordsMismatch && (
              <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700">
                Пароли должны совпадать.
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                isPending ||
                !email.trim() ||
                password.length < 6 ||
                (mode === "register" && (!passwordConfirm || password !== passwordConfirm))
              }
              className="w-full rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
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
        </section>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  resetPasswordByRecovery,
  verifyPasswordRecovery,
} from "@shared/api/auth";
import { AuthPasswordField } from "@shared/components/AuthFormControls";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";

import {
  canSubmitRecoveryIdentity,
  canSubmitRecoveryPassword,
} from "./authRecovery";

export function RecoverPasswordPage() {
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: (payload: { login: string; email: string; display_name: string }) =>
      verifyPasswordRecovery(payload),
    onSuccess: (data) => {
      setRecoveryToken(data.recoveryToken);
    },
  });
  const resetMutation = useMutation({
    mutationFn: (payload: { recovery_token: string; new_password: string }) =>
      resetPasswordByRecovery(payload),
  });
  const passwordsMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <div className="min-w-0 space-y-6">
      <PageIntro
        title="Восстановить пароль"
        subtitle="Для MVP сверим логин, recovery email и имя в семье, а затем дадим задать новый пароль."
        eyebrow="Доступ к аккаунту"
        compactOnMobile
        hideOnMobile
      />

      <Surface className="p-5 sm:p-6">
        {!recoveryToken ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              verifyMutation.mutate({
                login: login.trim(),
                email: email.trim(),
                display_name: displayName.trim(),
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="soft-field-label">Логин</span>
                <input
                  name="username"
                  type="text"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  className="soft-input mt-2 w-full px-4"
                  placeholder="Ваш логин"
                  autoComplete="username"
                />
              </label>
              <label className="block">
                <span className="soft-field-label">Recovery email</span>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="soft-input mt-2 w-full px-4"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
            </div>

            <label className="block">
              <span className="soft-field-label">Имя в семье</span>
              <input
                name="display-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="soft-input mt-2 w-full px-4"
                placeholder="Например: Аня"
                autoComplete="name"
              />
            </label>

            {verifyMutation.isError ? (
              <p className="soft-note-danger">
                {(verifyMutation.error as { response?: { data?: { detail?: string } } })?.response
                  ?.data?.detail ?? "Не удалось подтвердить данные для восстановления."}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                verifyMutation.isPending || !canSubmitRecoveryIdentity(login, email, displayName)
              }
              className="app-btn-primary-md soft-button-primary inline-flex w-full items-center justify-center px-4 disabled:opacity-50"
            >
              {verifyMutation.isPending ? "Проверяем…" : "Продолжить"}
            </button>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              resetMutation.mutate({
                recovery_token: recoveryToken,
                new_password: password,
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthPasswordField
                label="Новый пароль"
                value={password}
                onChange={setPassword}
                placeholder="Минимум 6 символов"
                isVisible={isPasswordVisible}
                onToggleVisibility={() => setIsPasswordVisible((current) => !current)}
                name="new-password"
                autoComplete="new-password"
              />
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
            </div>

            {passwordsMismatch ? (
              <p className="soft-note-warning">Пароли должны совпадать.</p>
            ) : null}
            {resetMutation.isSuccess ? (
              <p className="soft-note-success">
                Пароль обновлён. Теперь можно войти с новым паролем.
              </p>
            ) : null}
            {resetMutation.isError ? (
              <p className="soft-note-danger">
                {(resetMutation.error as { response?: { data?: { detail?: string } } })?.response
                  ?.data?.detail ?? "Не удалось обновить пароль."}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                resetMutation.isPending ||
                !canSubmitRecoveryPassword(password, passwordConfirm)
              }
              className="app-btn-primary-md soft-button-primary inline-flex w-full items-center justify-center px-4 disabled:opacity-50"
            >
              {resetMutation.isPending ? "Сохраняем…" : "Сохранить новый пароль"}
            </button>
          </form>
        )}

        <Link to="/auth?mode=login" className="mt-4 inline-flex text-sm text-muted underline">
          Вернуться ко входу
        </Link>
      </Surface>
    </div>
  );
}

import type { AppLanguage } from "@shared/i18n";

export function getLocalizedAuthError(
  code: string | undefined,
  detail: string | undefined,
  language: AppLanguage,
  fallback: string
) {
  if (!detail) {
    return fallback;
  }

  if (language === "ru") {
    return detail;
  }

  const knownCodes: Record<string, string> = {
    INVALID_CREDENTIALS: "Invalid email or password.",
    ACCOUNT_EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
    FAMILY_INVITE_NOT_FOUND: "Family code not found.",
    FAMILY_INVITE_EXPIRED: "Family code expired.",
    FAMILY_INVITE_ALREADY_USED: "Family code was already used.",
    FAMILY_INVITE_INVALID: "This family code is no longer available.",
  };
  if (code && knownCodes[code]) {
    return knownCodes[code];
  }

  const knownMessages: Record<string, string> = {
    "Неверный email или пароль": "Invalid email or password.",
    "Аккаунт с таким email уже существует": "An account with this email already exists.",
    "Укажите корректный email": "Enter a valid email.",
    "Приглашение не найдено": "Family code not found.",
    "Срок действия приглашения истёк": "Family code expired.",
    "Приглашение уже использовано": "Family code was already used.",
    "Семья по приглашению не найдена": "This family code is no longer available.",
    "Приглашение недоступно": "This family code is no longer available.",
  };

  return knownMessages[detail] ?? fallback;
}

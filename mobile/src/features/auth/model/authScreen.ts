import { MobileLocale } from "../../../shared/i18n/mobileI18n";

type AuthTabKey = "login" | "register";

export type AuthFieldId =
  | "email"
  | "password"
  | "passwordConfirm";

export type AuthFieldConfig = {
  id: AuthFieldId;
  placeholder: string;
  kind: "email" | "password";
  leftIcon: string;
  rightIcon?: string;
};

export type AuthScreenContent = {
  backgroundSource: number;
  loginHeadline: string;
  registerHeadline: string;
  tabs: Array<{
    key: AuthTabKey;
    label: string;
  }>;
  loginFields: AuthFieldConfig[];
  registerFields: AuthFieldConfig[];
  forgotPasswordLabel: string;
  forgotPasswordSheetTitle: string;
  forgotPasswordSheetDescription: string;
  forgotPasswordRecoveryCodePlaceholder: string;
  forgotPasswordNewPasswordLabel: string;
  forgotPasswordConfirmPasswordLabel: string;
  forgotPasswordSheetButtonLabel: string;
  loginButtonLabel: string;
  registerButtonLabel: string;
  familyCodeToggleLabel: string;
  familyCodePlaceholder: string;
  familyCodeVerifyLabel: string;
  familyCodeVerifyingLabel: string;
  familyCodeVerifiedLabel: string;
  familyCodeChangeLabel: string;
  supportLabel: string;
  legalConsentTermsLabel: string;
  legalConsentPrivacyLabel: string;
  errors: {
    email: string;
    passwordRequired: string;
    passwordLength: string;
    passwordsMismatch: string;
    recoveryCode: string;
    familyCodeRequiredForPreview: string;
    familyCodeNeedsVerification: string;
  };
};

const authBackgroundSource = require("../../../redesign/screens/auth/assets/auth_family_background_spot.png");

function buildFields(locale: MobileLocale, variant: AuthTabKey): AuthFieldConfig[] {
  const isRu = locale === "ru";

  if (variant === "login") {
    return [
      {
        id: "email",
        placeholder: isRu ? "Электронная почта" : "Email",
        kind: "email",
        leftIcon: "email-outline",
      },
      {
        id: "password",
        placeholder: isRu ? "Пароль" : "Password",
        kind: "password",
        leftIcon: "lock-outline",
        rightIcon: "eye-outline",
      },
    ];
  }

  return [
    {
      id: "email",
      placeholder: isRu ? "Электронная почта" : "Email",
      kind: "email",
      leftIcon: "email-outline",
    },
    {
      id: "password",
      placeholder: isRu ? "Пароль" : "Password",
      kind: "password",
      leftIcon: "lock-outline",
      rightIcon: "eye-outline",
    },
    {
      id: "passwordConfirm",
      placeholder: isRu ? "Повторите пароль" : "Confirm password",
      kind: "password",
      leftIcon: "lock-check-outline",
      rightIcon: "eye-outline",
    },
  ];
}

export function buildAuthScreenContent(
  locale: MobileLocale,
): AuthScreenContent {
  const isRu = locale === "ru";

  return {
    backgroundSource: authBackgroundSource,
    loginHeadline: isRu
      ? "Войдите, чтобы вернуться к семейной базе."
      : "Log in to return to your family care base.",
    registerHeadline: isRu
      ? "Создайте семейную базу здоровья и ухода."
      : "Create your family health and care base.",
    tabs: [
      { key: "login", label: isRu ? "Вход" : "Log in" },
      { key: "register", label: isRu ? "Регистрация" : "Register" },
    ],
    loginFields: buildFields(locale, "login"),
    registerFields: buildFields(locale, "register"),
    forgotPasswordLabel: isRu ? "Забыли пароль?" : "Forgot password?",
    forgotPasswordSheetTitle: isRu ? "Восстановление доступа" : "Recover access",
    forgotPasswordSheetDescription: isRu
      ? "Введите email, секретную фразу и новый пароль."
      : "Enter your email, recovery phrase, and a new password.",
    forgotPasswordRecoveryCodePlaceholder: isRu
      ? "Например: quiet-river-42"
      : "Example: quiet-river-42",
    forgotPasswordNewPasswordLabel: isRu ? "Новый пароль" : "New password",
    forgotPasswordConfirmPasswordLabel: isRu
      ? "Повторите пароль"
      : "Repeat password",
    forgotPasswordSheetButtonLabel: isRu
      ? "Сохранить новый пароль"
      : "Save new password",
    loginButtonLabel: isRu ? "Войти" : "Log in",
    registerButtonLabel: isRu ? "Создать аккаунт" : "Create account",
    familyCodeToggleLabel: isRu ? "Есть код семьи?" : "Have a family code?",
    familyCodePlaceholder: isRu ? "Например: ABC12345" : "Example: ABC12345",
    familyCodeVerifyLabel: isRu ? "Проверить код" : "Verify code",
    familyCodeVerifyingLabel: isRu ? "Проверяем код…" : "Verifying code…",
    familyCodeVerifiedLabel: isRu ? "Код подтверждён" : "Code confirmed",
    familyCodeChangeLabel: isRu ? "Изменить код" : "Change code",
    supportLabel: isRu ? "Поддержка" : "Support",
    legalConsentTermsLabel: isRu ? "Условия использования" : "Terms of Use",
    legalConsentPrivacyLabel: isRu
      ? "Политику конфиденциальности"
      : "Privacy Policy",
    errors: {
      email: isRu
        ? "Введите корректную электронную почту"
        : "Enter a valid email address",
      passwordRequired: isRu ? "Введите пароль" : "Enter your password",
      passwordLength: isRu
        ? "Пароль должен содержать минимум 8 символов"
        : "Password must be at least 8 characters",
      passwordsMismatch: isRu ? "Пароли должны совпадать." : "Passwords must match.",
      recoveryCode: isRu
        ? "Введите корректную секретную фразу"
        : "Enter a valid recovery phrase",
      familyCodeRequiredForPreview: isRu
        ? "Введите код семьи."
        : "Enter a family code.",
      familyCodeNeedsVerification: isRu
        ? "Сначала проверьте код семьи."
        : "Verify the family code first.",
    },
  };
}

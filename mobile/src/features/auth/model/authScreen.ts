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
  forgotPasswordSubmittingLabel: string;
  loginButtonLabel: string;
  loginSubmittingLabel: string;
  registerButtonLabel: string;
  registerSubmittingLabel: string;
  joinFamilyButtonLabel: string;
  joinFamilySubmittingLabel: string;
  familyCodeToggleLabel: string;
  familyCodePlaceholder: string;
  familyCodeVerifiedLabel: string;
  familyCodeChangeLabel: string;
  familyCodeVerifyFailedError: string;
  supportLabel: string;
  legalConsentTermsLabel: string;
  legalConsentPrivacyLabel: string;
  loginFailedError: string;
  registerFailedError: string;
  resetPasswordFailedError: string;
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

const authBackgroundSource = require("../../../redesign/screens/auth/assets/auth_family_background_spot.jpg");

function buildFields(locale: MobileLocale, variant: AuthTabKey): AuthFieldConfig[] {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  if (variant === "login") {
    return [
      {
        id: "email",
        placeholder: isRu ? "Электронная почта" : isDe ? "E-Mail" : isPl ? "E-mail" : "Email",
        kind: "email",
        leftIcon: "email-outline",
      },
      {
        id: "password",
        placeholder: isRu ? "Пароль" : isDe ? "Passwort" : isPl ? "Hasło" : "Password",
        kind: "password",
        leftIcon: "lock-outline",
        rightIcon: "eye-outline",
      },
    ];
  }

  return [
    {
      id: "email",
      placeholder: isRu ? "Электронная почта" : isDe ? "E-Mail" : isPl ? "E-mail" : "Email",
      kind: "email",
      leftIcon: "email-outline",
    },
    {
      id: "password",
      placeholder: isRu ? "Пароль" : isDe ? "Passwort" : isPl ? "Hasło" : "Password",
      kind: "password",
      leftIcon: "lock-outline",
      rightIcon: "eye-outline",
    },
    {
      id: "passwordConfirm",
      placeholder: isRu
        ? "Повторите пароль"
        : isDe
          ? "Passwort wiederholen"
          : isPl
            ? "Powtórz hasło"
            : "Confirm password",
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
  const isDe = locale === "de";
  const isPl = locale === "pl";

  return {
    backgroundSource: authBackgroundSource,
    loginHeadline: isRu
      ? "Войдите, чтобы вернуться к семейной базе."
      : isDe
        ? "Melden Sie sich an, um zu Ihrer Familienzentrale zurückzukehren."
      : isPl
        ? "Zaloguj się, aby wrócić do rodzinnej bazy opieki."
      : "Log in to return to your family care base.",
    registerHeadline: isRu
      ? "Создайте семейную базу здоровья и ухода."
      : isDe
        ? "Erstellen Sie Ihre Familienzentrale für Gesundheit und Pflege."
      : isPl
        ? "Utwórz rodzinną bazę zdrowia i opieki."
      : "Create your family health and care base.",
    tabs: [
      { key: "login", label: isRu ? "Вход" : isDe ? "Anmelden" : isPl ? "Zaloguj się" : "Log in" },
      { key: "register", label: isRu ? "Регистрация" : isDe ? "Registrieren" : isPl ? "Rejestracja" : "Register" },
    ],
    loginFields: buildFields(locale, "login"),
    registerFields: buildFields(locale, "register"),
    forgotPasswordLabel: isRu ? "Забыли пароль?" : isDe ? "Passwort vergessen?" : isPl ? "Nie pamiętasz hasła?" : "Forgot password?",
    forgotPasswordSheetTitle: isRu ? "Восстановление доступа" : isDe ? "Zugang wiederherstellen" : isPl ? "Odzyskaj dostęp" : "Recover access",
    forgotPasswordSheetDescription: isRu
      ? "Введите email, секретную фразу и новый пароль."
      : isDe
        ? "Geben Sie Ihre E-Mail, den Wiederherstellungscode und ein neues Passwort ein."
      : isPl
        ? "Wpisz e-mail, kod odzyskiwania i nowe hasło."
      : "Enter your email, recovery phrase, and a new password.",
    forgotPasswordRecoveryCodePlaceholder: isRu
      ? "Например: quiet-river-42"
      : isDe
        ? "Zum Beispiel: quiet-river-42"
      : isPl
        ? "Na przykład: quiet-river-42"
      : "Example: quiet-river-42",
    forgotPasswordNewPasswordLabel: isRu ? "Новый пароль" : isDe ? "Neues Passwort" : isPl ? "Nowe hasło" : "New password",
    forgotPasswordConfirmPasswordLabel: isRu
      ? "Повторите пароль"
      : isDe
        ? "Passwort wiederholen"
      : isPl
        ? "Powtórz hasło"
      : "Repeat password",
    forgotPasswordSheetButtonLabel: isRu
      ? "Сохранить новый пароль"
      : isDe
        ? "Neues Passwort speichern"
      : isPl
        ? "Zapisz nowe hasło"
      : "Save new password",
    forgotPasswordSubmittingLabel: isRu ? "Сохраняем…" : isDe ? "Wird gespeichert…" : isPl ? "Zapisywanie…" : "Saving…",
    loginButtonLabel: isRu ? "Войти" : isDe ? "Anmelden" : isPl ? "Zaloguj się" : "Log in",
    loginSubmittingLabel: isRu ? "Входим…" : isDe ? "Anmeldung…" : isPl ? "Logowanie…" : "Signing in…",
    registerButtonLabel: isRu ? "Создать аккаунт" : isDe ? "Konto erstellen" : isPl ? "Utwórz konto" : "Create account",
    registerSubmittingLabel: isRu ? "Создаём…" : isDe ? "Wird erstellt…" : isPl ? "Tworzenie…" : "Creating…",
    joinFamilyButtonLabel: isRu
      ? "Присоединиться к семье"
      : isDe
        ? "Familie beitreten"
      : isPl
        ? "Dołącz do rodziny"
      : "Join family",
    joinFamilySubmittingLabel: isRu
      ? "Присоединяем…"
      : isDe
        ? "Beitritt…"
      : isPl
        ? "Dołączanie…"
      : "Joining…",
    familyCodeToggleLabel: isRu ? "Есть код семьи?" : isDe ? "Haben Sie einen Familiencode?" : isPl ? "Masz kod rodziny?" : "Have a family code?",
    familyCodePlaceholder: isRu ? "Например: ABC12345" : isDe ? "Zum Beispiel: ABC12345" : isPl ? "Na przykład: ABC12345" : "Example: ABC12345",
    familyCodeVerifiedLabel: isRu ? "Код подтверждён" : isDe ? "Code bestätigt" : isPl ? "Kod potwierdzony" : "Code confirmed",
    familyCodeChangeLabel: isRu ? "Изменить код" : isDe ? "Code ändern" : isPl ? "Zmień kod" : "Change code",
    familyCodeVerifyFailedError: isRu ? "Не удалось проверить код семьи." : isDe ? "Der Familiencode konnte nicht geprüft werden." : isPl ? "Nie udało się sprawdzić kodu rodziny." : "Could not verify the family code.",
    supportLabel: isRu ? "Поддержка" : isDe ? "Support" : isPl ? "Wsparcie" : "Support",
    legalConsentTermsLabel: isRu ? "Условия использования" : isDe ? "Nutzungsbedingungen" : isPl ? "Warunki korzystania" : "Terms of Use",
    legalConsentPrivacyLabel: isRu
      ? "Политику конфиденциальности"
      : isDe
        ? "Datenschutzerklärung"
      : isPl
        ? "Politykę prywatności"
      : "Privacy Policy",
    loginFailedError: isRu ? "Не удалось войти." : isDe ? "Anmeldung nicht möglich." : isPl ? "Nie udało się zalogować." : "Could not sign in.",
    registerFailedError: isRu ? "Не удалось создать аккаунт." : isDe ? "Konto konnte nicht erstellt werden." : isPl ? "Nie udało się utworzyć konta." : "Could not create account.",
    resetPasswordFailedError: isRu ? "Не удалось сбросить пароль." : isDe ? "Passwort konnte nicht zurückgesetzt werden." : isPl ? "Nie udało się zresetować hasła." : "Could not reset password.",
    errors: {
      email: isRu
        ? "Введите корректную электронную почту"
        : isDe
          ? "Geben Sie eine gültige E-Mail-Adresse ein"
        : isPl
          ? "Wpisz poprawny adres e-mail"
        : "Enter a valid email address",
      passwordRequired: isRu ? "Введите пароль" : isDe ? "Geben Sie Ihr Passwort ein" : isPl ? "Wpisz hasło" : "Enter your password",
      passwordLength: isRu
        ? "Пароль должен содержать минимум 8 символов"
        : isDe
          ? "Das Passwort muss mindestens 8 Zeichen lang sein"
        : isPl
          ? "Hasło musi mieć co najmniej 8 znaków"
        : "Password must be at least 8 characters",
      passwordsMismatch: isRu ? "Пароли должны совпадать." : isDe ? "Die Passwörter müssen übereinstimmen." : isPl ? "Hasła muszą być takie same." : "Passwords must match.",
      recoveryCode: isRu
        ? "Введите корректную секретную фразу"
        : isDe
          ? "Geben Sie einen gültigen Wiederherstellungscode ein"
        : isPl
          ? "Wpisz poprawny kod odzyskiwania"
        : "Enter a valid recovery phrase",
      familyCodeRequiredForPreview: isRu
        ? "Введите код семьи."
        : isDe
          ? "Geben Sie einen Familiencode ein."
        : isPl
          ? "Wpisz kod rodziny."
        : "Enter a family code.",
      familyCodeNeedsVerification: isRu
        ? "Сначала проверьте код семьи."
        : isDe
          ? "Prüfen Sie zuerst den Familiencode."
        : isPl
          ? "Najpierw sprawdź kod rodziny."
        : "Verify the family code first.",
    },
  };
}

import { MobileAuthApiError } from "../api/authApi";
import { normalizeFamilyCodeInput } from "./familyCode";
import { isRecoveryCodeValid } from "./recoveryCode";
import type { AuthFieldId, AuthScreenContent } from "./authScreen";

export type FormState = {
  email: string;
  password: string;
  passwordConfirm: string;
  familyCode: string;
};

export type ForgotPasswordState = {
  email: string;
  recoveryCode: string;
  newPassword: string;
  passwordConfirm: string;
};

export type ForgotPasswordFieldId =
  | "email"
  | "recoveryCode"
  | "newPassword"
  | "passwordConfirm";

export type FieldTouchedState<T extends string> = Partial<Record<T, boolean>>;
export type AuthValidationErrors = Partial<Record<AuthFieldId, string>>;
export type ForgotPasswordValidationErrors = Partial<
  Record<ForgotPasswordFieldId, string>
>;

type FieldFrame = {
  pageY: number;
  height: number;
};

type KeyboardAvoidanceResult = {
  appliedOffset: number;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

export function normalizeFormValue(key: keyof FormState, value: string) {
  return key === "familyCode" ? normalizeFamilyCodeInput(value) : value;
}

export function getFieldStyleId(fieldId: AuthFieldId, fieldsLength: number) {
  if (fieldsLength === 1) {
    return "single";
  }
  if (fieldId === "email") {
    return "top";
  }
  if (fieldId === "passwordConfirm" || fieldsLength === 2) {
    return "bottom";
  }
  return "middle";
}

export function getAuthErrorMessage(
  error: unknown,
  locale: "ru" | "en" | "pl" | "de",
  fallback: string,
) {
  if (!(error instanceof MobileAuthApiError)) {
    return fallback;
  }

  if (locale === "ru") {
    return error.detail ?? fallback;
  }

  const knownCodes: Record<string, string> = {
    INVALID_CREDENTIALS: "Invalid email or password.",
    ACCOUNT_EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  };

  const knownDetails: Record<string, string> = {
    "Неверный email или пароль": "Invalid email or password.",
    "Аккаунт с таким email уже существует": "An account with this email already exists.",
    "Укажите корректный email": "Enter a valid email.",
    "Recovery code must be at least 8 characters long": "Recovery code must be at least 8 characters long.",
  };

  if (error.code && knownCodes[error.code]) {
    return knownCodes[error.code];
  }

  if (error.detail && knownDetails[error.detail]) {
    return knownDetails[error.detail];
  }

  return error.detail ?? fallback;
}

export function buildAuthFormErrors(
  formState: FormState,
  isRegisterMode: boolean,
  messages: AuthScreenContent["errors"],
): AuthValidationErrors {
  const next: AuthValidationErrors = {};
  const passwordsMismatch =
    isRegisterMode &&
    formState.passwordConfirm.length > 0 &&
    formState.password !== formState.passwordConfirm;

  if (!isValidEmail(formState.email)) {
    next.email = messages.email;
  }

  if (!formState.password.trim()) {
    next.password = messages.passwordRequired;
  } else if (isRegisterMode && formState.password.trim().length < 8) {
    next.password = messages.passwordLength;
  }

  if (isRegisterMode) {
    if (!formState.passwordConfirm.trim()) {
      next.passwordConfirm = messages.passwordRequired;
    } else if (passwordsMismatch) {
      next.passwordConfirm = messages.passwordsMismatch;
    }
  }

  return next;
}

export function buildForgotPasswordErrors(
  formState: ForgotPasswordState,
  messages: AuthScreenContent["errors"],
): ForgotPasswordValidationErrors {
  const next: ForgotPasswordValidationErrors = {};

  if (!isValidEmail(formState.email)) {
    next.email = messages.email;
  }

  if (!isRecoveryCodeValid(formState.recoveryCode)) {
    next.recoveryCode = messages.recoveryCode;
  }

  if (!formState.newPassword.trim()) {
    next.newPassword = messages.passwordRequired;
  } else if (formState.newPassword.trim().length < 8) {
    next.newPassword = messages.passwordLength;
  }

  if (!formState.passwordConfirm.trim()) {
    next.passwordConfirm = messages.passwordRequired;
  } else if (formState.newPassword !== formState.passwordConfirm) {
    next.passwordConfirm = messages.passwordsMismatch;
  }

  return next;
}

export function findFirstVisibleError<T extends string>(
  orderedFields: T[],
  errors: Partial<Record<T, string>>,
  submitted: boolean,
  touchedFields: FieldTouchedState<T>,
) {
  return orderedFields.reduce<string | null>((current, fieldId) => {
    if (current) {
      return current;
    }

    const shouldShow = submitted || touchedFields[fieldId];
    return shouldShow && errors[fieldId] ? errors[fieldId] ?? null : null;
  }, null);
}

export function resolveKeyboardOffset(
  keyboardHeight: number,
  isRegisterMode: boolean,
  windowHeight: number,
  fieldFrame: FieldFrame | null,
): KeyboardAvoidanceResult {
  if (!fieldFrame) {
    return {
      appliedOffset: 0,
    };
  }

  const visibleBottomInset = isRegisterMode ? 30 : 24;
  const safetyPadding = isRegisterMode ? 18 : 14;
  const visibleBottom = windowHeight - keyboardHeight - visibleBottomInset;
  const fieldBottom = fieldFrame.pageY + fieldFrame.height;
  const overflow = fieldBottom - visibleBottom;

  if (overflow <= 0) {
    return {
      appliedOffset: 0,
    };
  }

  const maxOffset = Math.min(
    keyboardHeight - 24,
    isRegisterMode ? 260 : 180,
  );
  const requestedOffset = overflow + safetyPadding;

  return {
    appliedOffset: clamp(requestedOffset, 0, maxOffset),
  };
}

import { resolveInviteFailureState } from "../../shared/runtime/inviteFailureState.js";

type ApiErrorLike = {
  response?: {
    data?: {
      detail?: string;
      code?: string;
    };
  };
};

export type JoinFamilyMode = "login" | "register";

export type JoinFamilySuccessState = {
  kind: JoinFamilyMode;
  email: string;
  alreadyInFamily?: boolean;
};

export type JoinFamilyActionResolution =
  | {
      type: "success";
      successState: JoinFamilySuccessState;
      errorMessage: null;
    }
  | {
      type: "error";
      successState: null;
      errorMessage: string;
    };

const inviteActionErrorCodes = new Set([
  "ALREADY_IN_FAMILY",
  "BILLING_OWNER_TRANSFER_REQUIRED",
  "CURRENT_FAMILY_NOT_EMPTY",
  "CURRENT_FAMILY_HAS_CHILDREN",
  "CURRENT_FAMILY_HAS_MEDICINES",
  "CURRENT_FAMILY_HAS_PARENTS",
  "CURRENT_FAMILY_HAS_PILLBOX",
  "DEV_INVITE_DISABLED",
  "FAMILY_INVITE_ALREADY_USED",
  "FAMILY_INVITE_EXPIRED",
  "FAMILY_INVITE_INVALID",
  "FAMILY_INVITE_NOT_FOUND",
]);

export function getJoinFamilyApiErrorCode(error: unknown): string | null {
  const code = (error as ApiErrorLike | null)?.response?.data?.code;
  return typeof code === "string" && code.trim() ? code : null;
}

export function getJoinFamilyApiErrorDetail(error: unknown): string | null {
  const detail = (error as ApiErrorLike | null)?.response?.data?.detail;
  return typeof detail === "string" && detail.trim() ? detail : null;
}

export function resolveJoinFamilyAction(params: {
  error: unknown;
  mode: JoinFamilyMode;
  language: "ru" | "en";
  email: string;
  loginFailedMessage: string;
  registerFailedMessage: string;
}): JoinFamilyActionResolution {
  const code = getJoinFamilyApiErrorCode(params.error);
  const detail = getJoinFamilyApiErrorDetail(params.error);

  if (params.mode === "login" && code === "ALREADY_IN_FAMILY") {
    return {
      type: "success",
      successState: {
        kind: "login",
        email: params.email.trim().toLowerCase(),
        alreadyInFamily: true,
      },
      errorMessage: null,
    };
  }

  if (code && inviteActionErrorCodes.has(code)) {
    const failure = resolveInviteFailureState({
      language: params.language,
      code,
      detail,
      kind: "action",
    });
    return {
      type: "error",
      successState: null,
      errorMessage: failure.inlineMessage,
    };
  }

  return {
    type: "error",
    successState: null,
    errorMessage:
      detail ?? (params.mode === "login" ? params.loginFailedMessage : params.registerFailedMessage),
  };
}

export function buildJoinFamilyLoginPayload(params: {
  email: string;
  password: string;
  rememberMe: boolean;
  token: string;
  isDevLatestShortcut: boolean;
}) {
  return {
    email: params.email.trim(),
    password: params.password,
    remember_me: params.rememberMe,
    invite_token: params.token || undefined,
    use_latest_dev_invite: params.isDevLatestShortcut || undefined,
  };
}

export function buildJoinFamilyRegisterPayload(params: {
  email: string;
  password: string;
  rememberMe: boolean;
  token: string;
  isDevLatestShortcut: boolean;
  language: "ru" | "en";
}) {
  return {
    email: params.email.trim(),
    password: params.password,
    remember_me: params.rememberMe,
    invite_token: params.token || undefined,
    use_latest_dev_invite: params.isDevLatestShortcut || undefined,
    preferred_language: params.language,
  };
}

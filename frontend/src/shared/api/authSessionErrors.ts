export function shouldClearSessionForAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return false;
  }
  const response = (error as { response?: { status?: unknown } }).response;
  return response?.status === 401;
}

export function resolveAuthSessionFailureAction(args: {
  error: unknown;
  hasLocalSession: boolean;
}): "ignore" | "retain" | "clear" {
  const { error, hasLocalSession } = args;
  if (!error || !hasLocalSession) {
    return "ignore";
  }
  return shouldClearSessionForAuthError(error) ? "clear" : "retain";
}

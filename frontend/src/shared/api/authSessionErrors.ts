export function shouldClearSessionForAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return false;
  }
  const response = (error as { response?: { status?: unknown } }).response;
  return response?.status === 401;
}

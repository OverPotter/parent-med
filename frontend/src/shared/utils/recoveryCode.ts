export function normalizeRecoveryCode(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isRecoveryCodeValid(value: string): boolean {
  return normalizeRecoveryCode(value).length >= 8;
}

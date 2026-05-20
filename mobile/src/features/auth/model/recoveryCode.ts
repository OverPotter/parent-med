export function normalizeRecoveryCode(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isRecoveryCodeValid(value: string) {
  return normalizeRecoveryCode(value).length >= 8;
}

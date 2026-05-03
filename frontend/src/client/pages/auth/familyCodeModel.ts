export interface VerifiedFamilyCode {
  token: string;
  familyName: string;
  expiresAt: string;
}

export interface FamilyCodePreviewPayload {
  familyName: string;
  expiresAt: string;
}

const DEV_FAMILY_CODE_PATTERN = /^[A-Za-z0-9]{8}$/;
const LONG_FAMILY_CODE_PATTERN = /^[A-Za-z0-9_-]{32,}$/;

export function buildVerifiedFamilyCode(
  token: string,
  preview: FamilyCodePreviewPayload
): VerifiedFamilyCode {
  return {
    token,
    familyName: preview.familyName,
    expiresAt: preview.expiresAt,
  };
}

export function normalizeFamilyCodeInput(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

export function shouldAutoVerifyFamilyCode(value: string): boolean {
  return DEV_FAMILY_CODE_PATTERN.test(value) || LONG_FAMILY_CODE_PATTERN.test(value);
}

export function resolveFamilyCodeVerifyError(
  trimmedFamilyCodeInput: string,
  requiredMessage: string
): string | null {
  return trimmedFamilyCodeInput ? null : requiredMessage;
}

export function resolveFamilyCodeSubmitError(
  trimmedFamilyCodeInput: string,
  verifiedFamilyCode: VerifiedFamilyCode | null,
  needsVerificationMessage: string
): string | null {
  if (!trimmedFamilyCodeInput || verifiedFamilyCode) {
    return null;
  }
  return needsVerificationMessage;
}

export function resetVerifiedFamilyCode(): VerifiedFamilyCode | null {
  return null;
}

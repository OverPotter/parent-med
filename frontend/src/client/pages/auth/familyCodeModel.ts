export interface VerifiedFamilyCode {
  token: string;
  familyName: string;
  expiresAt: string;
}

export interface FamilyCodePreviewPayload {
  familyName: string;
  expiresAt: string;
}

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

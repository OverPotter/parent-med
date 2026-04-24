import { isRecoveryCodeValid } from "../../shared/utils/recoveryCode.js";

export function canSubmitRecoveryCode(email: string, recoveryCode: string): boolean {
  return Boolean(email.trim() && isRecoveryCodeValid(recoveryCode));
}

export function canSubmitRecoveryPassword(
  password: string,
  passwordConfirm: string
): boolean {
  return password.length >= 6 && passwordConfirm.length > 0 && password === passwordConfirm;
}

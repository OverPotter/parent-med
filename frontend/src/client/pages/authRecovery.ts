export function canSubmitRecoveryIdentity(
  login: string,
  email: string,
  displayName: string
): boolean {
  return Boolean(login.trim() && email.trim() && displayName.trim());
}

export function canSubmitRecoveryPassword(
  password: string,
  passwordConfirm: string
): boolean {
  return password.length >= 6 && passwordConfirm.length > 0 && password === passwordConfirm;
}

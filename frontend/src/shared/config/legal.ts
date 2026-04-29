export function getPrivacyPolicyUrl() {
  return import.meta.env.VITE_PRIVACY_POLICY_URL?.trim() || "/legal/privacy";
}

export function getTermsOfUseUrl() {
  return import.meta.env.VITE_TERMS_OF_USE_URL?.trim() || "/legal/terms";
}

export function getSupportUrl() {
  return import.meta.env.VITE_SUPPORT_URL?.trim() || "/legal/support";
}

export function getSupportEmail() {
  return import.meta.env.VITE_SUPPORT_EMAIL?.trim() || "";
}

export function getSupportMailtoUrl() {
  const email = getSupportEmail();
  return email ? `mailto:${email}` : "";
}

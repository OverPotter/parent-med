export function getPrivacyPolicyUrl() {
  return import.meta.env.VITE_PRIVACY_POLICY_URL?.trim() || "https://pillpath.app/privacy";
}

export function getTermsOfUseUrl() {
  return import.meta.env.VITE_TERMS_OF_USE_URL?.trim() || "https://pillpath.app/terms";
}

export function getSupportUrl() {
  return import.meta.env.VITE_SUPPORT_URL?.trim() || "/feedback";
}

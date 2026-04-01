export type AppLanguage = "ru" | "en";

export interface Translations {
  common: {
    brandName: string;
    userFallback: string;
    open: string;
    goHome: string;
    logout: string;
    languageSwitcherLabel: string;
    themeDarkLabel: string;
    themeLightLabel: string;
    themeDarkText: string;
    themeLightText: string;
  };
  layout: {
    familyWorkspace: string;
  };
  clientLayout: {
    nav: {
      observations: string;
      children: string;
      pillbox: string;
      cabinet: string;
      more: string;
    };
    pushPrompt: {
      title: string;
      description: string;
      enable: string;
      enabling: string;
      hide: string;
    };
    pushErrors: {
      supportMissing: string;
      serverNotReady: string;
      permissionTimeout: string;
      permissionDenied: string;
      subscribeTimeout: string;
      acceptTimeout: string;
      enableFailed: string;
      enabled: string;
    };
  };
  landing: {
    hero: {
      eyebrow: string;
      title: string;
      lead: string;
      createAccount: string;
      login: string;
      themeToggleAriaDark: string;
      themeToggleAriaLight: string;
    };
    cards: Array<{ title: string; description: string }>;
    product: {
      eyebrow: string;
      title: string;
      description: string;
      bullets: string[];
      screenshotsLabel: string;
      screenshots: [string, string, string];
    };
    comparison: {
      eyebrow: string;
      title: string;
      description: string;
      oldTitle: string;
      newTitle: string;
      oldWay: string[];
      newWay: string[];
    };
    workflow: {
      eyebrow: string;
      title: string;
      description: string;
      descriptionSecondary: string;
      steps: Array<{ step: string; title: string; description: string }>;
    };
    install: {
      eyebrow: string;
      title: string;
      description: string;
      iphoneTitle: string;
      androidTitle: string;
      iphoneSteps: string[];
      androidSteps: string[];
      ctaTitle: string;
      ctaDescription: string;
      createAccount: string;
      login: string;
      closePreview: string;
      previewCloseLabel: string;
      previewOpenLabel: string;
    };
  };
  auth: {
    page: {
      loginTitle: string;
      registerTitle: string;
      loginDescription: string;
      registerDescription: string;
      toggleLabel: string;
      loginTab: string;
      registerTab: string;
      loginCardTitle: string;
      registerCardTitle: string;
      loginCardCopy: string;
      registerCardCopy: string;
      rememberMe: string;
      forgotPassword: string;
      extraProfileFields: string;
      extraProfileCopy: string;
      invitationNote: string;
      passwordsMismatch: string;
    };
    fields: {
      login: string;
      loginForEntry: string;
      loginPlaceholder: string;
      loginPlaceholderRegister: string;
      loginHint: string;
      password: string;
      passwordPlaceholder: string;
      passwordConfirm: string;
      passwordConfirmPlaceholder: string;
      email: string;
      emailPlaceholder: string;
      displayName: string;
      displayNamePlaceholder: string;
      relationship: string;
      relationshipPlaceholder: string;
      phone: string;
      phonePlaceholder: string;
    };
    actions: {
      hidePassword: string;
      showPassword: string;
      login: string;
      loginLoading: string;
      register: string;
      registerLoading: string;
    };
    errors: {
      loginFailed: string;
      registerFailed: string;
      passwordsMismatch: string;
    };
  };
  more: {
    title: string;
    subtitle: string;
    openLabel: string;
    links: Array<{ to: string; title: string; description: string }>;
  };
  about: {
    eyebrow: string;
    subtitle: string;
    features: Array<{ title: string; description: string }>;
    install: {
      eyebrow: string;
      title: string;
      description: string;
      cards: Array<{ title: string; steps: string[] }>;
    };
  };
  clientHome: {
    sections: Array<{
      title: string;
      description: string;
      items: Array<{ title: string; description: string }>;
      action?: { to: string; label: string };
    }>;
    analytics: {
      title: string;
      description: string;
      items: Array<{ title: string; description: string }>;
    };
    install: {
      title: string;
      description: string;
      cards: Array<{ title: string; steps: string[] }>;
    };
  };
}

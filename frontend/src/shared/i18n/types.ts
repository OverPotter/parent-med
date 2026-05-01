export type AppLanguage = "ru" | "en";

export interface Translations {
  common: {
    brandName: string;
    userFallback: string;
    login: string;
    open: string;
    goHome: string;
    aboutApp: string;
    logout: string;
    cancel: string;
    logoutConfirmTitle: string;
    logoutConfirmDescription: string;
    logoutConfirmAction: string;
    profile: string;
    family: string;
    settings: string;
    logoutFromAccount: string;
    profileMenuLabel: string;
    languageSwitcherLabel: string;
    languageLabel: string;
    themeLabel: string;
    themeDarkLabel: string;
    themeLightLabel: string;
    themeAutoLabel: string;
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
      nativeBlockedTitle: string;
      nativeBlockedDescription: string;
      categoriesDisabledTitle: string;
      categoriesDisabledDescription: string;
      categoriesDisabledCta: string;
      openSettings: string;
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
      titleLines: [string, string, string];
      lead: string;
      loginPrompt: string;
      login: string;
      highlights: string[];
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
      login: string;
      closePreview: string;
      previewCloseLabel: string;
      previewOpenLabel: string;
    };
    sections: {
      carouselHeading: string;
      strip: Array<{ title: string; description: string }>;
      children: {
        title: string;
        description: string;
        mobilePoints: [string, string, string];
        chips: [string, string];
        cards: Array<{ title: string; lines: [string, string] }>;
        footer: string;
      };
      routine: {
        title: string;
        description: string;
        mobilePoints: [string, string, string];
        snapshotTitle: string;
        snapshotItems: [string, string, string];
        insightTitle: string;
        insightItems: [string, string, string];
        footer: string;
      };
      pillbox: {
        title: string;
        description: string;
        mobilePoints: [string, string, string];
        bullets: [string, string, string];
        chips: [string, string, string];
        footer: string;
      };
      cabinet: {
        title: string;
        description: string;
        mobilePoints: [string, string, string];
        statusTitle: string;
        statusItems: [string, string, string];
        checklistTitle: string;
        checklistItems: [string, string, string];
        footer: string;
      };
      family: {
        title: string;
        description: string;
        mobilePoints: [string, string, string];
        footer: string;
        roles: string[];
        flowTitle: string;
        flowSteps: [string, string, string];
      };
      trust: {
        title: string;
        description: string;
        mobilePoints: [string, string];
        cards: [string, string];
        footer: string;
      };
      pricing: {
        eyebrow: string;
        title: string;
        description: string;
        free: {
          name: string;
          price: string;
          period: string;
          badge: string;
          summary: string;
          points: [string, string, string];
        };
        plus: {
          name: string;
          price: string;
          period: string;
          badge: string;
          summary: string;
          points: [string, string, string];
          annualNote: string;
          cta: string;
        };
        tableTitle: string;
        rows: Array<{ label: string; free: string; plus: string }>;
        footnote: string;
      };
      faq: {
        title: string;
        showMore: string;
        showLess: string;
        items: Array<{ question: string; answer: string }>;
      };
      finalCta: {
        title: string;
        description: string;
        primary: string;
        secondary: string;
      };
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
      legalConsentPrefix: string;
      legalConsentTerms: string;
      legalConsentAnd: string;
      legalConsentPrivacy: string;
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
      legalConsentRequired: string;
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
  feedback: {
    navShort: string;
    pageTitle: string;
    pageSubtitle: string;
    formTitle: string;
    formHint: string;
    privacyHint: string;
    placeholder: string;
    submit: string;
    submitting: string;
    success: string;
    errors: {
      rateLimited: string;
      empty: string;
      generic: string;
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

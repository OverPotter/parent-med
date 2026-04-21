import type { Translations } from "./types";

export const en: Translations = {
  common: {
    brandName: "PillPath",
    userFallback: "User",
    login: "Log in",
    open: "Open",
    goHome: "Home",
    aboutApp: "About app",
    logout: "Log out",
    profile: "Profile",
    settings: "Settings",
    logoutFromAccount: "Log out",
    profileMenuLabel: "Profile menu",
    languageSwitcherLabel: "Choose language",
    languageLabel: "Language",
    themeLabel: "Theme",
    themeDarkLabel: "Dark theme",
    themeLightLabel: "Light theme",
    themeAutoLabel: "Auto",
  },
  layout: {
    familyWorkspace: "Family health workspace",
  },
  clientLayout: {
    nav: {
      observations: "Tracking",
      children: "Children",
      pillbox: "Meds",
      cabinet: "Cabinet",
      more: "More",
    },
    pushPrompt: {
      title: "Turn on notifications",
      description: "It is easier to catch reminders for tracking and your home medicine cabinet.",
      nativeBlockedTitle: "Notifications are off in iOS",
      nativeBlockedDescription:
        "Reminders will not arrive while notifications for PillPath are disabled in iPhone settings.",
      openSettings: "Open Settings",
      enable: "Enable notifications",
      enabling: "Enabling…",
      hide: "Hide for now",
    },
    pushErrors: {
      supportMissing: "This device or browser does not support push notifications.",
      serverNotReady: "Notifications are not configured on the server yet.",
      permissionTimeout: "The browser did not finish the notification permission request.",
      permissionDenied: "The browser did not grant notification permission.",
      subscribeTimeout: "Could not finish subscribing this device to push notifications.",
      acceptTimeout: "The server did not accept the device subscription.",
      enableFailed: "Could not enable notifications.",
      enabled: "Notifications are enabled.",
    },
  },
  landing: {
    hero: {
      eyebrow: "Family care for sick days and daily meds",
      titleLines: ["When a child is sick,", "the family needs one", "clear plan."],
      lead: "See what is happening now, what is already done, and what comes next: child tracking, dose reminders, and the home medicine cabinet in one place.",
      createAccount: "Try it free",
      loginPrompt: "Already have an account?",
      login: "Log in",
      highlights: [
        "One timeline for the whole illness story",
        "The family sees what is done and what comes next",
        "Reminders and expiry dates stay under control",
      ],
      themeToggleAriaDark: "Dark theme",
      themeToggleAriaLight: "Light theme",
    },
    cards: [
      {
        title: "Children",
        description: "Symptoms, temperature, notes, and doses in one timeline.",
      },
      {
        title: "Dose reminders",
        description: "Flexible schedules and reminders for the family.",
      },
      {
        title: "Home medicine cabinet",
        description: "See what is at home, what is running out, and what to replace.",
      },
      {
        title: "Family account",
        description: "One shared picture for parents and relatives.",
      },
    ],
    product: {
      eyebrow: "How the product looks",
      title: "Three screens that make the workflow obvious right away",
      description:
        "PillPath does not show isolated notes. It shows a full working flow: current tracking, history and a fast way into the child profile.",
      bullets: [
        "Current tracking helps you understand what you can do right now.",
        "History keeps temperature, medicines and notes in one timeline.",
        "The child profile gives you a fast way back into work without extra archive noise.",
      ],
      screenshotsLabel: "PillPath screenshots",
      screenshots: [
        "Current child tracking screen",
        "Child event timeline screen",
        "Children list screen",
      ],
    },
    comparison: {
      eyebrow: "Instead of chat threads",
      title: "When important details do not have to be dug out of chat",
      description:
        "Chat is fine for a quick message, but poor at showing the current state, recent actions, and the next step for the whole family.",
      oldTitle: "When everything stays in chat",
      newTitle: "When everything lives in PillPath",
      oldWay: [
        "an important note disappears upward too fast",
        "you have to ask again who already did what",
        "the full picture has to be rebuilt manually",
      ],
      newWay: [
        "the current state and latest notes are visible right away",
        "it is clear who logged a note or marked a dose",
        "the whole family sees the same picture and the next step",
      ],
    },
    workflow: {
      eyebrow: "Working flow",
      title: "Not just notes, but a clear workflow for the whole family",
      description:
        "PillPath is not for storing isolated notes. It helps the whole family understand the child’s current state, recent actions, and the next step faster.",
      descriptionSecondary:
        "Alongside tracking and reminders, PillPath also keeps the home medicine cabinet close.",
      steps: [
        {
          step: "01",
          title: "Add a child and open tracking",
          description:
            "Create a child profile and log symptoms, temperature, and important changes in one place.",
        },
        {
          step: "02",
          title: "Log doses, notes, and reminders",
          description:
            "Temperature, doses, notes, and reminders stay in one timeline instead of getting lost between messages.",
        },
        {
          step: "03",
          title: "The family sees what happens next",
          description:
            "All adults can see the current status and recent actions, so it is easier to understand what is already done and what needs attention next.",
        },
      ],
    },
    install: {
      eyebrow: "Install on your phone",
      title: "Add PillPath to your home screen",
      description:
        "Open PillPath in your browser and add it to the home screen so your family workspace stays close at hand.",
      iphoneTitle: "iPhone / iPad",
      androidTitle: "Android",
      iphoneSteps: [
        "Open PillPath in Safari.",
        "Tap Share.",
        "Choose Add to Home Screen.",
        "Confirm the install.",
      ],
      androidSteps: [
        "Open PillPath in Chrome.",
        "Open the browser menu.",
        "Choose Install app or Add to Home screen.",
        "Confirm the install.",
      ],
      ctaTitle: "Register first, then add PillPath to your home screen.",
      ctaDescription: "That way the icon opens your family workspace and current records right away.",
      createAccount: "Create account",
      login: "Log in",
      closePreview: "Close",
      previewCloseLabel: "Close enlarged preview",
      previewOpenLabel: "Open enlarged preview",
    },
    sections: {
      strip: [
        {
          title: "Children",
          description: "The whole illness story day by day in one timeline.",
        },
        {
          title: "Dose reminders",
          description: "Medicine schedules and reminders for the family.",
        },
        {
          title: "Home Medicine Cabinet",
          description: "Expiry dates and stock levels under control.",
        },
        {
          title: "Family Account",
          description: "One shared picture for parents and relatives.",
        },
      ],
      children: {
        title: "Children",
        description:
          "Create a child profile and track illness day by day: symptoms, temperature, notes, doses, and reminders in one timeline.",
        mobilePoints: [
          "Symptoms, temperature, and notes in one timeline",
          "See what is already done and what comes next",
          "A history you can quickly share with a doctor or family",
        ],
        chips: ["Child profile created", "Day-by-day timeline"],
        cards: [
          {
            title: "Condition",
            lines: ["Symptoms: cough, weakness", "Temperature: 38.1°"],
          },
          {
            title: "Treatment",
            lines: ["Medication plan added", "Note: day 2, feeling better"],
          },
          {
            title: "Reminders",
            lines: ["Give medicine at 2:00 PM", "Next step is clear"],
          },
        ],
        footer: "The whole illness story stays in one place for the family.",
      },
      pillbox: {
        title: "Dose reminders",
        description: "Set up medicine and vitamin schedules for yourself or a family member.",
        mobilePoints: [
          "Flexible schedules: daily, specific days, specific times",
          "Assign a plan to yourself or a family member",
          "See immediately which dose was already logged",
        ],
        bullets: [
          "Recurring reminders",
          "For yourself or loved ones",
          "A clear routine without confusion",
        ],
        chips: [
          "8:30 AM — Vitamin D daily",
          "Reminder active",
          "Created for grandma in the family account",
        ],
        footer: "One clear routine for the family, without missed doses.",
      },
      cabinet: {
        title: "Home Medicine Cabinet",
        description:
          "Shows what is at home, what is safe to use now, and what should be replaced or restocked soon.",
        mobilePoints: [
          "See what is at home and how much is left",
          "Get early expiry alerts",
          "Know what to add to the shopping list first",
        ],
        statusTitle: "Expiry and stock control",
        statusItems: [
          "Ibuprofen: 6 doses left",
          "Paracetamol: expires in 12 days",
          "Vitamin D: low stock, add to shopping list",
        ],
        checklistTitle: "What Home Medicine Cabinet gives you",
        checklistItems: [
          "Alerts before expiry dates are reached",
          "A low-stock signal",
          "A quick restock list",
        ],
        footer: "One-glance decision: use now, check soon, or restock.",
      },
      family: {
        title: "Family Account",
        description: "One parent creates the account and invites relatives into one shared care picture.",
        mobilePoints: [
          "One parent sends an invite link",
          "Everyone sees the same treatment plan and reminders",
          "It is clear who logged a note or marked a dose",
        ],
        footer: "Everyone sees the current notes, doses, and reminders in one place.",
        roles: ["Mom", "Dad", "Grandma", "Grandpa", "Other relatives"],
        flowTitle: "How family access works",
        flowSteps: [
          "Mom creates the account",
          "Sends an invite link",
          "Family sees one shared care plan",
        ],
      },
      trust: {
        title: "Trust & Privacy",
        description: "You share access only with people you trust.",
        mobilePoints: [
          "Only people you invite can access family data",
          "You can revoke access at any time",
        ],
        cards: ["You control who gets access.", "You can grant or revoke access anytime."],
        footer: "Shared data is visible only to family members you invite.",
      },
      faq: {
        title: "FAQ",
        showMore: "Show more",
        showLess: "Show less",
        items: [
          {
            question: "Who can see child data?",
            answer: "Only the family members you invite and choose to share access with.",
          },
          {
            question: "Can I track more than one child?",
            answer: "Yes, you can add multiple child profiles.",
          },
          {
            question: "Can I set up doses for another family member?",
            answer: "Yes, you can create a schedule for yourself or a loved one.",
          },
          {
            question: "Will I get medication reminders?",
            answer: "Yes, the app sends reminders based on the schedules and alerts you configure.",
          },
          {
            question: "What can I log in Children?",
            answer: "Symptoms, temperature, notes, doses, and reminders for your child.",
          },
          {
            question: "What does Home Medicine Cabinet warn about?",
            answer: "Upcoming expiry dates and medicines that should be checked or restocked soon.",
          },
        ],
      },
      finalCta: {
        title: "When a child is sick, it helps to miss nothing important.",
        description:
          "PillPath combines child tracking, dose reminders, and home medicine cabinet control.",
        primary: "Try it free",
        secondary: "Log in",
      },
    },
  },
  auth: {
    page: {
      loginTitle: "Log in",
      registerTitle: "Register",
      loginDescription:
        "Fast access to child data, the medicine cabinet and shared health records.",
      registerDescription:
        "Create shared family access to child data, the medicine cabinet and health events.",
      toggleLabel: "Switch authentication mode",
      loginTab: "Log in",
      registerTab: "Register",
      loginCardTitle: "Log in",
      registerCardTitle: "Register",
      loginCardCopy: "Sign in with your login and password to return to the family workspace.",
      registerCardCopy:
        "Create a family account. Put the core fields up top, then expand profile details if needed.",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      extraProfileFields: "Additional profile fields",
      extraProfileCopy:
        "These fields are optional at the start, but they help label family members correctly.",
      invitationNote:
        "If you were already invited into a family, open the invite link from the message. It will lead you into the right flow automatically.",
      passwordsMismatch: "Passwords must match.",
      legalConsentPrefix: "I accept the",
      legalConsentTerms: "Terms of Use",
      legalConsentAnd: "and",
      legalConsentPrivacy: "Privacy Policy",
    },
    fields: {
      login: "Login",
      loginForEntry: "Login",
      loginPlaceholder: "Login",
      loginPlaceholderRegister: "Create a login",
      loginHint:
        "The login is only used for sign-in. You can set a separate display name for the family.",
      password: "Password",
      passwordPlaceholder: "At least 6 characters",
      passwordConfirm: "Repeat password",
      passwordConfirmPlaceholder: "Repeat password",
      email: "Email",
      emailPlaceholder: "you@example.com",
      displayName: "Family name",
      displayNamePlaceholder: "Example: Anna",
      relationship: "Family role",
      relationshipPlaceholder: "Example: mom",
      phone: "Phone",
      phonePlaceholder: "+1 ...",
    },
    actions: {
      hidePassword: "Hide password",
      showPassword: "Show password",
      login: "Log in",
      loginLoading: "Logging in…",
      register: "Create account",
      registerLoading: "Creating account…",
    },
    errors: {
      loginFailed: "Login failed",
      registerFailed: "Registration failed",
      passwordsMismatch: "Passwords do not match",
      legalConsentRequired: "Please accept the terms and privacy policy.",
    },
  },
  more: {
    title: "More",
    subtitle: "Family, profile, settings and help.",
    openLabel: "Open",
    links: [
      {
        to: "/home",
        title: "Help",
        description: "Quick guide to key sections.",
      },
      {
        to: "/family",
        title: "Family",
        description: "Members, roles and invites.",
      },
      {
        to: "/account",
        title: "Profile",
        description: "Login, email, name and role.",
      },
      {
        to: "/settings",
        title: "Settings",
        description: "Language, theme, reminders and security.",
      },
      {
        to: "/feedback",
        title: "Feedback",
        description: "Send the team a bug report or suggestion.",
      },
      {
        to: "/legal",
        title: "Privacy · Terms · Support",
        description: "Policy, terms of use and support links.",
      },
    ],
  },
  feedback: {
    navShort: "Feedback",
    pageTitle: "Feedback",
    pageSubtitle: "Tell us about a bug, friction or idea — your message is saved for the team.",
    formTitle: "Message for the team",
    formHint: "Briefly describe what happened or what should be improved.",
    privacyHint:
      "Please do not include personal data, children’s names or health details — this is not a medical support channel.",
    placeholder: "Briefly describe what happened or what you’d like improved…",
    submit: "Send",
    submitting: "Sending…",
    success: "Thanks! Your message was saved.",
    errors: {
      rateLimited: "Too many messages per hour. Please try again later.",
      empty: "Please enter a message.",
      generic: "Could not send. Please try again.",
    },
  },
  about: {
    eyebrow: "About",
    subtitle:
      "A family workspace for children, the home medicine cabinet and illness history. It is not a daily working screen, so the product overview lives here separately.",
    features: [
      {
        title: "Family",
        description:
          "The family sets the account context: parents, children and one shared home medicine cabinet.",
      },
      {
        title: "Children",
        description:
          "Each child can have illness episodes, temperatures and history tracked separately.",
      },
      {
        title: "Medicines",
        description: "The medicine cabinet stores real packs, expiry dates and post-opening rules.",
      },
    ],
    install: {
      eyebrow: "Install on your phone",
      title: "The app can live on the home screen as an icon",
      description:
        "PillPath is already configured as a PWA. Installation happens through the browser without the App Store or Google Play.",
      cards: [
        {
          title: "iPhone / iPad",
          steps: [
            "Open the app in Safari.",
            "Tap Share.",
            "Choose Add to Home Screen.",
            "Confirm the install.",
          ],
        },
        {
          title: "Android",
          steps: [
            "Open the app in Chrome.",
            "Open the browser menu.",
            "Choose Install app or Add to Home screen.",
            "Confirm the install.",
          ],
        },
        {
          title: "Local development",
          steps: [
            "Open the app on your phone using your laptop IP in the same Wi‑Fi network.",
            "Use Safari or Chrome instead of an embedded webview.",
            "If the install icon does not appear, refresh the page and try again.",
          ],
        },
      ],
    },
  },
  clientHome: {
    sections: [
      {
        title: "First step",
        description: "Where to begin and where to go next.",
        items: [
          {
            title: "Where to start",
            description: "If this is your first time here, start with the Children section.",
          },
          {
            title: "You can return later",
            description: "This is just a guide. Close it anytime and continue using the app.",
          },
        ],
        action: { to: "/children", label: "Go to Children" },
      },
      {
        title: "Children",
        description: "Child profiles, history and tracking entry.",
        items: [
          {
            title: "Add a child",
            description: "Start here if the profile does not exist yet.",
          },
          {
            title: "Open history",
            description: "Go into a child and open completed episodes.",
          },
        ],
        action: { to: "/children", label: "Open children" },
      },
      {
        title: "Tracking",
        description: "Temperature, doses and notes for the current state.",
        items: [
          {
            title: "Start tracking",
            description: "Open a child card and launch a new tracking session.",
          },
          {
            title: "Add entries",
            description: "Inside a session you can log temperatures, doses and notes.",
          },
          {
            title: "Check reminders",
            description: "Nearest actions and plans stay visible.",
          },
        ],
        action: { to: "/illnesses/active", label: "Open tracking" },
      },
      {
        title: "Pillbox",
        description: "Medication plans: who takes what and when.",
        items: [
          {
            title: "Create a plan",
            description: "Add medicine, dose times and save the plan.",
          },
          {
            title: "Log a dose",
            description: "When it is time, tap “Log dose”.",
          },
          {
            title: "Pause and resume",
            description: "Pause a plan and resume it later without losing history.",
          },
        ],
        action: { to: "/pillbox", label: "Open pillbox" },
      },
      {
        title: "Cabinet",
        description: "Home medicines, expiry and stock.",
        items: [
          {
            title: "Add a pack",
            description: "Find in catalog or add manually.",
          },
          {
            title: "Watch expiry dates",
            description: "See what expires soon at a glance.",
          },
          {
            title: "Use during tracking",
            description: "Pick a medicine directly in an episode.",
          },
        ],
        action: { to: "/medicine-cabinet", label: "Open cabinet" },
      },
    ],
    analytics: {
      title: "Child history analytics",
      description: "Where to find analytics in a child’s history and what it shows.",
      items: [
        {
          title: "Where to find analytics",
          description:
            "Open a child, then their history. There you get both a summary and a breakdown of each episode.",
        },
        {
          title: "What the summary shows",
          description:
            "It helps you understand how often the child was sick, how the frequency changed and how long the episodes were.",
        },
        {
          title: "What the breakdown shows",
          description:
            "Inside an episode you can see temperature, key events, medicines and a short picture of the record.",
        },
      ],
    },
    install: {
      title: "Install on your phone",
      description: "You can add the app to your home screen directly from the browser.",
      cards: [
        {
          title: "iPhone / iPad",
          steps: [
            "Open the app in Safari.",
            "Tap Share.",
            "Choose Add to Home Screen.",
            "Confirm the install.",
          ],
        },
        {
          title: "Android",
          steps: [
            "Open the app in Chrome.",
            "Open the browser menu.",
            "Choose Install app or Add to Home screen.",
            "Confirm the install.",
          ],
        },
      ],
    },
  },
};

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
    cancel: "Cancel",
    logoutConfirmTitle: "Log out of your account?",
    logoutConfirmDescription:
      "The session on this device will end. You can sign in again at any time.",
    logoutConfirmAction: "Yes, log out",
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
      categoriesDisabledTitle: "Some notification groups are off",
      categoriesDisabledDescription:
        "Push works overall, but one or more reminder categories are disabled in account settings.",
      categoriesDisabledCta: "Review settings",
      openSettings: "Open Settings",
      enable: "Enable notifications",
      enabling: "Enabling…",
      hide: "Hide for now",
    },
    pushErrors: {
      supportMissing: "Push notifications are not available on this device.",
      serverNotReady: "Notifications are not configured on the server yet.",
      permissionTimeout: "The device did not finish the notification permission request.",
      permissionDenied: "The device did not grant notification permission.",
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
        "Sleep, feeding, growth, and weight stay with the same child profile",
        "The family sees what is done and what comes next",
        "Reminders, calendar context, and expiry dates stay under control",
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
        title: "Sleep & feeding",
        description: "Daily routine, feeding, growth, and weight in the same profile.",
      },
      {
        title: "Dose reminders",
        description: "Flexible schedules and reminders for the family.",
      },
      {
        title: "Home medicine cabinet",
        description: "See what is at home, what is running out, and what to replace.",
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
      title: "Use PillPath through the iPhone app",
      description:
        "The main PillPath experience now runs through the iPhone app. The website remains for product discovery, invite links, and legal information.",
      iphoneTitle: "iPhone / iPad",
      androidTitle: "Website and links",
      iphoneSteps: [
        "Install PillPath from the App Store.",
        "Open the app on your iPhone.",
        "Log in or create your account.",
        "Continue using PillPath inside the app.",
      ],
      androidSteps: [
        "If the app is not installed, public links open on the website.",
        "The website explains the link and how to continue in the app.",
        "The full product experience stays inside the iPhone app.",
      ],
      ctaTitle: "The recommended path is website entry followed by app handoff.",
      ctaDescription:
        "That keeps invite links, sign-in, and everyday usage inside one clear iPhone flow.",
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
          description: "The illness story, calendar context, and notes in one timeline.",
        },
        {
          title: "Dose reminders",
          description: "Medicine schedules and reminders for the family.",
        },
        {
          title: "Home Medicine Cabinet",
          description: "Stock, expiry dates, and restock prompts under control.",
        },
        {
          title: "Family Account",
          description: "One shared picture for parents and relatives.",
        },
      ],
      children: {
        title: "Children",
        description:
          "Create a child profile and track illness day by day: symptoms, temperature, notes, doses, calendar context, and key records in one timeline.",
        mobilePoints: [
          "Symptoms, temperature, calendar context, and notes in one timeline",
          "See what is already done and what comes next",
          "A history you can quickly share with a doctor or family",
        ],
        chips: ["Child profile created", "Timeline and calendar by day"],
        cards: [
          {
            title: "Condition",
            lines: ["Symptoms: cough, weakness", "Temperature: 38.1°"],
          },
          {
            title: "History",
            lines: ["Medication plan added", "Note: day 2, feeling better"],
          },
          {
            title: "Calendar",
            lines: ["Checkup and follow-up are planned", "The next step is clear"],
          },
        ],
        footer: "The whole illness story stays in one place for the family.",
      },
      routine: {
        title: "Sleep, feeding, and growth",
        description:
          "Alongside illness tracking and medicines, PillPath can keep the child’s daily rhythm in the same place: sleep, feeding, weight, height, and related records without a separate tracker.",
        mobilePoints: [
          "Sleep and feeding stay in the same child profile",
          "Height and weight become a readable history",
          "No need to split the routine into another app",
        ],
        snapshotTitle: "What you can log day to day",
        snapshotItems: [
          "Sleep sessions and current status",
          "Feedings and daily records",
          "Height, weight, and basic growth changes",
        ],
        insightTitle: "What the family gets",
        insightItems: [
          "One child profile instead of multiple trackers",
          "Daily routine signals next to illness and treatment",
          "A quick path into the child calendar and everyday rhythm",
        ],
        footer: "Routine, development, and tracking remain part of one shared picture.",
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
        description:
          "One parent creates the account and invites relatives into one shared care picture.",
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
      pricing: {
        eyebrow: "Pricing",
        title: "Free to start, Plus for full family coordination",
        description:
          "The website should make it obvious what stays in the free plan and what opens up in Plus. The current local Plus price is shown in the app and in the App Store before purchase.",
        free: {
          name: "Free",
          price: "Included",
          period: "",
          badge: "Base",
          summary:
            "A good starting point to try the workflow and keep one main care flow without a subscription.",
          points: [
            "1 active child",
            "1 working pillbox plan",
            "Core tracking, sleep/feeding logs, and home medicine cabinet",
          ],
        },
        plus: {
          name: "Plus",
          price: "App Store",
          period: "",
          badge: "For families",
          summary:
            "For families who need multiple children, more medication plans, exports, and richer shared workflows.",
          points: [
            "Multiple children and family members",
            "Multiple medication plans and Live Activities",
            "Data export, calendar workflow, and medicine guide",
          ],
          annualNote: "The current local price is shown before purchase.",
          cta: "Choose Plus",
        },
        tableTitle: "What is included",
        rows: [
          { label: "Child profiles", free: "1 active child", plus: "Multiple children" },
          { label: "Sleep, feeding, growth, and weight", free: "Core records", plus: "Shared in the family workflow" },
          { label: "Pillbox", free: "1 working plan", plus: "Multiple family plans" },
          { label: "Family access", free: "Basic flow", plus: "Full coordination for loved ones" },
          { label: "CSV/XLSX export", free: "—", plus: "+" },
          { label: "Live Activities", free: "—", plus: "+" },
          { label: "Medicine guide", free: "—", plus: "+" },
        ],
        footnote:
          "Purchase, local pricing, and subscription management happen inside the iPhone app through the App Store.",
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
            answer: "Symptoms, temperature, notes, doses, calendar context, and related records for your child.",
          },
          {
            question: "Can I log sleep, feeding, height, and weight?",
            answer: "Yes, those records can live inside the child profile next to the main care timeline.",
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
          "PillPath combines child tracking, routine, dose reminders, and home medicine cabinet control.",
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
      loginCardCopy: "Sign in with your email and password to return to the family workspace.",
      registerCardCopy:
        "Create an account with your email. You can add your family display name after sign-in.",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      extraProfileFields: "Additional profile fields",
      extraProfileCopy:
        "Use this section for family role and phone. Email and family display name are already required for registration and recovery.",
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
      passwordPlaceholder: "At least 8 characters",
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
      title: "The main experience now runs through the iPhone app",
      description:
        "The main PillPath experience now runs through the iPhone app. The website stays for product discovery, invite links, and legal information.",
      cards: [
        {
          title: "iPhone / iPad",
          steps: [
            "Install the app from the App Store.",
            "Open it on your iPhone.",
            "Log in or register.",
            "Use PillPath inside the app.",
          ],
        },
        {
          title: "Website and links",
          steps: [
            "If the app is not installed, public links open on the website.",
            "The website explains where the link leads and how to continue in the app.",
            "The full product flow remains inside the iPhone app.",
          ],
        },
        {
          title: "Local development",
          steps: [
            "Build the mobile version through Capacitor.",
            "Verify iOS flows on a real device or simulator.",
            "Use the public website only for landing, invite, and legal flows.",
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
      {
        title: "Family and access",
        description: "Who can see children, tracking, pillbox, and cabinet.",
        items: [
          {
            title: "Set access",
            description:
              "In Family, each member can get separate access to children, pillbox, and cabinet.",
          },
          {
            title: "Choose children",
            description: "Once child access is open, choose all children or only selected ones.",
          },
          {
            title: "Not everyone needs full access",
            description: "For pillbox you can keep view-only or dose logging.",
          },
        ],
        action: { to: "/family", label: "Open family" },
      },
      {
        title: "Live Activity and reminders",
        description: "Fast status on iPhone and push for important actions.",
        items: [
          {
            title: "What can be enabled",
            description:
              "Settings lets you enable sleep, feeding, and illness tracking separately.",
          },
          {
            title: "Where it appears",
            description: "On iPhone it appears on the lock screen and in Dynamic Island.",
          },
          {
            title: "Who receives signals",
            description:
              "Push reminders only go to members with the required access and notifications enabled.",
          },
        ],
        action: { to: "/settings", label: "Open settings" },
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
      title: "",
      description: "",
      cards: [],
    },
  },
};

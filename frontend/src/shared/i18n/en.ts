import type { Translations } from "./types";

export const en: Translations = {
  common: {
    brandName: "PillPath",
    userFallback: "User",
    open: "Open",
    goHome: "Home",
    logout: "Log out",
    languageSwitcherLabel: "Choose language",
    themeDarkLabel: "Dark theme",
    themeLightLabel: "Light theme",
    themeDarkText: "Night",
    themeLightText: "Day",
  },
  layout: {
    familyWorkspace: "Family health workspace",
  },
  clientLayout: {
    nav: {
      observations: "Tracking",
      children: "Children",
      pillbox: "Pillbox",
      cabinet: "Cabinet",
      more: "More",
    },
    pushPrompt: {
      title: "Turn on notifications",
      description: "It is easier to catch reminders for tracking and your home medicine cabinet.",
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
      eyebrow: "Calm family organizer for medicines and care",
      titleLines: ["When a child is sick,", "the family needs one", "clear plan."],
      lead:
        "PillPath helps you track a child’s illness, remember medicine doses, watch expiry dates and keep the family aligned in one account.",
      createAccount: "Try it free",
      loginPrompt: "Already have an account?",
      login: "Log in",
      highlights: [
        "See how the child's condition changes",
        "Reminders arrive on time",
        "Expiry dates do not get lost",
      ],
      themeToggleAriaDark: "Dark theme",
      themeToggleAriaLight: "Light theme",
    },
    cards: [
      {
        title: "Children",
        description: "Track symptoms, temperature, notes and medicine reminders.",
      },
      {
        title: "Pillbox",
        description: "Create medicine schedules and receive reminders.",
      },
      {
        title: "Home medicine cabinet",
        description: "Keep track of expiry dates for medicines at home.",
      },
      {
        title: "Family account",
        description: "Bring parents and relatives together in one care space.",
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
        "Chat is good for sending a quick message, but poor at showing what is already done, what is happening now and what should happen next.",
      oldTitle: "When everything stays in chat",
      newTitle: "When everything lives in PillPath",
      oldWay: [
        "an important note disappears upward too fast",
        "you have to ask again who already did what",
        "the full picture has to be rebuilt manually",
      ],
      newWay: [
        "the latest notes stay close at hand",
        "it is clear what is already done and who logged it",
        "the whole family looks at the same picture",
      ],
    },
    workflow: {
      eyebrow: "Working flow",
      title: "Not just notes, but a clear workflow for the whole family",
      description:
        "PillPath is not for storing isolated notes. It helps the whole family understand the child’s current state and the next steps faster.",
      descriptionSecondary:
        "Alongside notes and tracking, PillPath also keeps the home medicine cabinet close.",
      steps: [
        {
          step: "01",
          title: "Add a child and start tracking",
          description:
            "Create a child profile and open a tracking session whenever you need to log symptoms, medicines and important changes.",
        },
        {
          step: "02",
          title: "Log everything into one story",
          description:
            "Temperature, doses, comments and reminders stay in one timeline instead of getting lost between messages.",
        },
        {
          step: "03",
          title: "The family sees what happens next",
          description:
            "All adults can see the current status and recent actions, so it is easier to understand what is already done and what still needs attention.",
        },
      ],
    },
    install: {
      eyebrow: "Install on your phone",
      title: "Add PillPath to your home screen",
      description:
        "The app already works as a PWA, so it installs from the browser without the App Store or Google Play.",
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
      ctaTitle: "Register first, then install the app on your phone.",
      ctaDescription: "That way the home screen icon opens your family workspace right away.",
      createAccount: "Create account",
      login: "Log in",
      closePreview: "Close",
      previewCloseLabel: "Close enlarged preview",
      previewOpenLabel: "Open enlarged preview",
    },
  },
  auth: {
    page: {
      loginTitle: "Log in",
      registerTitle: "Register",
      loginDescription: "Fast access to child data, the medicine cabinet and shared health records.",
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
    },
    fields: {
      login: "Login",
      loginForEntry: "Login",
      loginPlaceholder: "Email or login",
      loginPlaceholderRegister: "Create a login",
      loginHint: "The login is only used for sign-in. You can set a separate display name for the family.",
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
    },
  },
  more: {
    title: "More",
    subtitle: "Help, family, account and core settings.",
    openLabel: "Open",
    links: [
      {
        to: "/home",
        title: "Help",
        description: "How the app is structured and where to find the key sections.",
      },
      {
        to: "/family",
        title: "Family",
        description: "Family name, members and invitations.",
      },
      {
        to: "/account",
        title: "Account",
        description: "Email, family name, reminders and security.",
      },
    ],
  },
  about: {
    eyebrow: "About",
    subtitle:
      "A family workspace for children, the home medicine cabinet and illness history. It is not a daily working screen, so the product overview lives here separately.",
    features: [
      {
        title: "Family",
        description: "The family sets the account context: parents, children and one shared home medicine cabinet.",
      },
      {
        title: "Children",
        description: "Each child can have illness episodes, temperatures and history tracked separately.",
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
        title: "Children",
        description: "Child profiles, history for each child and a way into current tracking.",
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
        description: "Current child state: temperature, medicines, comments and reminders.",
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
            description:
              "If the episode uses guided mode, the nearest actions and plans stay visible there too.",
          },
        ],
        action: { to: "/illnesses/active", label: "Open tracking" },
      },
      {
        title: "Cabinet",
        description: "Home medicines, packs, expiry dates and opened dates.",
        items: [
          {
            title: "Add a pack",
            description: "First find the medicine in the catalog or enter it manually.",
          },
          {
            title: "Watch expiry dates",
            description: "Cards show what expires soon and what should no longer be used.",
          },
          {
            title: "Use during tracking",
            description: "Medicines from the cabinet can be selected right inside an illness episode.",
          },
        ],
        action: { to: "/medicine-cabinet", label: "Open cabinet" },
      },
    ],
    analytics: {
      title: "How analytics works",
      description:
        "Analytics lives inside a child’s history and helps you understand the big picture and each episode in detail.",
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
      description:
        "PillPath is already configured as a PWA, so you can add the app to your home screen right from the browser.",
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

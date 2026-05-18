import fs from "fs";
import path from "path";

const DEFAULT_BUNDLE_IDENTIFIER = "com.overpotter.pillpath";
const DEFAULT_ASSOCIATED_DOMAINS = [
  "parent-med-production-frontend.up.railway.app",
  "pillpath-production-frontend.up.railway.app",
];
const MOBILE_DIR = __dirname;

type AppEnvProfile = "mobile-dev" | "mobile-stage" | "mobile-prod";

type PublicEnvKey =
  | "API_URL"
  | "APP_SITE_URL"
  | "PRIVACY_POLICY_URL"
  | "TERMS_OF_USE_URL"
  | "SUPPORT_URL"
  | "SUPPORT_EMAIL"
  | "MARKETING_SITE_URL"
  | "APP_STORE_URL"
  | "APP_STORE_ID"
  | "REVENUECAT_IOS_API_KEY"
  | "REVENUECAT_SYNC_BACKEND"
  | "REVENUECAT_ENTITLEMENT_CODE"
  | "REVENUECAT_DEFAULT_PACKAGE_ID"
  | "REVENUECAT_OFFERING_ID";

function readProcessEnv(key: string): string {
  const value = process.env[key];
  return typeof value === "string" ? value.trim() : "";
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const entries: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

function getSelectedAppEnvProfile(): AppEnvProfile {
  const xcodeConfiguration = readProcessEnv("CONFIGURATION").toLowerCase();
  if (xcodeConfiguration === "debug") {
    return "mobile-dev";
  }

  if (xcodeConfiguration === "release") {
    return "mobile-prod";
  }

  const candidate = readProcessEnv("APP_ENV");
  if (
    candidate === "mobile-dev" ||
    candidate === "mobile-stage" ||
    candidate === "mobile-prod"
  ) {
    return candidate;
  }

  return "mobile-dev";
}

function getProfileEnvFilePaths(profile: AppEnvProfile): string[] {
  return [
    path.join(MOBILE_DIR, `.env.${profile}`),
    path.join(MOBILE_DIR, `.env.${profile}.local`),
  ];
}

function applyProfileEnv() {
  const profile = getSelectedAppEnvProfile();

  const externallyDefinedKeys = new Set(
    Object.keys(process.env).filter((key) => readProcessEnv(key) !== ""),
  );
  const mergedEntries: Record<string, string> = {};

  for (const filePath of getProfileEnvFilePaths(profile)) {
    Object.assign(mergedEntries, parseEnvFile(filePath));
  }

  for (const [key, value] of Object.entries(mergedEntries)) {
    if (!externallyDefinedKeys.has(key)) {
      process.env[key] = value;
    }
  }
}

applyProfileEnv();

const selectedAppEnvProfile = getSelectedAppEnvProfile();
console.log("[mobile/app.config] env profile", selectedAppEnvProfile);

function readPublicEnvValue(key: PublicEnvKey): string {
  return readProcessEnv(`EXPO_PUBLIC_${key}`) || readProcessEnv(`VITE_${key}`);
}

function readConfiguredBundleIdentifier(): string {
  return (
    readProcessEnv("IOS_BUNDLE_IDENTIFIER") ||
    readProcessEnv("EXPO_PUBLIC_IOS_BUNDLE_IDENTIFIER") ||
    DEFAULT_BUNDLE_IDENTIFIER
  );
}

function readConfiguredHost(rawUrl: string): string {
  if (!rawUrl) {
    return "";
  }

  try {
    return new URL(rawUrl).hostname || "";
  } catch {
    return "";
  }
}

function buildAssociatedDomains(): string[] {
  const hosts = [
    readConfiguredHost(readPublicEnvValue("APP_SITE_URL")),
    readConfiguredHost(readPublicEnvValue("MARKETING_SITE_URL")),
    ...DEFAULT_ASSOCIATED_DOMAINS,
  ].filter(Boolean);

  return Array.from(new Set(hosts)).flatMap((host) => [
    `applinks:${host}`,
    `webcredentials:${host}`,
  ]);
}

const extraPublicEnv = {
  API_URL: readPublicEnvValue("API_URL"),
  APP_SITE_URL: readPublicEnvValue("APP_SITE_URL"),
  PRIVACY_POLICY_URL: readPublicEnvValue("PRIVACY_POLICY_URL"),
  TERMS_OF_USE_URL: readPublicEnvValue("TERMS_OF_USE_URL"),
  SUPPORT_URL: readPublicEnvValue("SUPPORT_URL"),
  SUPPORT_EMAIL: readPublicEnvValue("SUPPORT_EMAIL"),
  MARKETING_SITE_URL: readPublicEnvValue("MARKETING_SITE_URL"),
  APP_STORE_URL: readPublicEnvValue("APP_STORE_URL"),
  APP_STORE_ID: readPublicEnvValue("APP_STORE_ID"),
  REVENUECAT_IOS_API_KEY: readPublicEnvValue("REVENUECAT_IOS_API_KEY"),
  REVENUECAT_SYNC_BACKEND: readPublicEnvValue("REVENUECAT_SYNC_BACKEND"),
  REVENUECAT_ENTITLEMENT_CODE: readPublicEnvValue("REVENUECAT_ENTITLEMENT_CODE"),
  REVENUECAT_DEFAULT_PACKAGE_ID: readPublicEnvValue("REVENUECAT_DEFAULT_PACKAGE_ID"),
  REVENUECAT_OFFERING_ID: readPublicEnvValue("REVENUECAT_OFFERING_ID"),
};

const config = {
  name: "PillPath",
  slug: "pillpath-ios",
  version: "1.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  scheme: "pillpath",
  plugins: ["./plugins/withLiveActivities", "expo-notifications"],
  splash: {
    backgroundColor: "#EBE4FF",
  },
  ios: {
    buildNumber: "2",
    deploymentTarget: "16.1",
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
      NSLocalNetworkUsageDescription:
        "PillPath uses your local network during development to connect to the Metro bundler.",
    },
    supportsTablet: false,
    bundleIdentifier: readConfiguredBundleIdentifier(),
    associatedDomains: buildAssociatedDomains(),
  },
  extra: {
    appEnvProfile: selectedAppEnvProfile,
    publicEnv: extraPublicEnv,
  },
};

export default config;

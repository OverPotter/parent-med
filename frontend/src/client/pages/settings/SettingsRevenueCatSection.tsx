import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { resetBillingDebugToFree } from "@shared/api/billing";
import type { AppLanguage } from "@shared/i18n";
import {
  getRevenueCatEntitlementCode,
  getRevenueCatIosApiKey,
  isRevenueCatBackendSyncEnabled,
} from "@shared/config/revenueCat";
import {
  configureNativeRevenueCat,
  getNativeRevenueCatCustomerSnapshot,
  getNativeRevenueCatOfferings,
  purchaseNativeRevenueCatPackage,
  restoreNativeRevenueCatPurchases,
  setNativeRevenueCatLogLevel,
  type RevenueCatCustomerSnapshot,
  type RevenueCatOfferingPackage,
} from "@shared/utils/nativeRevenueCat";
import { clearAllOfflineCareOverrides } from "@shared/utils/offlineCareState";
import { syncRevenueCatCustomerSnapshot } from "@shared/utils/revenueCatSync";
import {
  clearRevenueCatSyncSuppressionForAccount,
  isRevenueCatSyncSuppressedForAccount,
  suppressRevenueCatSyncForAccount,
} from "@shared/utils/revenueCatSyncSuppression";
import { invalidateSubscriptionQueries } from "@client/subscription/invalidateSubscriptionQueries";
import { childActionPrimaryClass, childActionSecondaryClass } from "../children/shared";
import { SettingsRow, SettingsSection } from "./ui";

type RevenueCatDebugResult = {
  label: string;
  details: unknown;
};

type RevenueCatDebugActionResult =
  | RevenueCatCustomerSnapshot
  | {
      currentOfferingIdentifier: string | null;
      availablePackages: RevenueCatOfferingPackage[];
    }
  | Record<string, unknown>
  | null
  | void;

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === "string" ? error : "Unknown RevenueCat error";
}

function serializeResult(result: RevenueCatDebugResult | null) {
  if (!result) {
    return "";
  }
  return JSON.stringify(result, null, 2);
}

function getCopy(language: AppLanguage) {
  if (language === "ru") {
    return {
      title: "RevenueCat sandbox",
      hint:
        "Dev-only smoke test без синка в backend: configure, offerings, purchase, restore и snapshot.",
      accountMissing: "Для теста нужен активный аккаунт в приложении.",
      syncDisabled: "Backend sync выключен",
      syncEnabled: "Backend sync включен",
      configure: "Configure",
      offerings: "Offerings",
      buy: "Buy first package",
      restore: "Restore",
      snapshot: "Snapshot",
      resetToFree: "Reset to free",
      forceFreeMode: "Force free mode",
      resumeSync: "Resume RevenueCat sync",
      working: "Выполняем…",
      ready: "Готово",
      packageMissing: "В текущем offering нет пакетов для покупки.",
      noResult: "Результат появится здесь после первого действия.",
      apiKeyPresent: "iOS key: есть",
      apiKeyMissing: "iOS key: нет",
      entitlement: "Entitlement",
      syncSuppressed: "RevenueCat sync для этого аккаунта временно выключен",
      sandboxOnly:
        "Этот блок нужен только для ручной проверки RevenueCat в iOS sandbox до включения backend unlock.",
    };
  }
  return {
    title: "RevenueCat sandbox",
    hint:
      "Dev-only smoke test without backend sync: configure, offerings, purchase, restore, and snapshot.",
    accountMissing: "An active signed-in account is required for this test.",
    syncDisabled: "Backend sync is off",
    syncEnabled: "Backend sync is on",
    configure: "Configure",
    offerings: "Offerings",
    buy: "Buy first package",
    restore: "Restore",
    snapshot: "Snapshot",
    resetToFree: "Reset to free",
    forceFreeMode: "Force free mode",
    resumeSync: "Resume RevenueCat sync",
    working: "Working…",
    ready: "Ready",
    packageMissing: "The current offering has no packages to purchase.",
    noResult: "The result will appear here after the first action.",
    apiKeyPresent: "iOS key: present",
    apiKeyMissing: "iOS key: missing",
    entitlement: "Entitlement",
    syncSuppressed: "RevenueCat sync is temporarily disabled for this account",
    sandboxOnly:
      "This section is only for manual RevenueCat validation in the iOS sandbox before backend unlock is enabled.",
  };
}

export function SettingsRevenueCatSection({
  language,
  accountId,
  currentFamilyId,
}: {
  language: AppLanguage;
  accountId: string | null;
  currentFamilyId: string | null;
}) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<RevenueCatDebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = getCopy(language);
  const apiKey = getRevenueCatIosApiKey();
  const entitlementCode = getRevenueCatEntitlementCode();
  const backendSyncEnabled = isRevenueCatBackendSyncEnabled();
  const syncSuppressed = isRevenueCatSyncSuppressedForAccount(accountId);

  const refreshSubscriptionState = async (snapshot: RevenueCatCustomerSnapshot | null) => {
    if (!snapshot || !backendSyncEnabled) {
      return;
    }

    await syncRevenueCatCustomerSnapshot(snapshot);
    await invalidateSubscriptionQueries(queryClient, {
      accountId,
      currentFamilyId,
      includeCareQueries: true,
    });
  };

  const runAction = async (
    label: string,
    action: () => Promise<RevenueCatDebugActionResult>
  ) => {
    setIsPending(true);
    setError(null);
    try {
      const details = await action();
      setResult({
        label,
        details: details ?? { ok: true },
      });
    } catch (nextError) {
      setError(formatError(nextError));
    } finally {
      setIsPending(false);
    }
  };

  const ensureConfigured = async () => {
    if (!apiKey) {
      throw new Error(copy.apiKeyMissing);
    }
    if (!accountId) {
      throw new Error(copy.accountMissing);
    }
    if (import.meta.env.DEV) {
      await setNativeRevenueCatLogLevel("debug");
    }
    await configureNativeRevenueCat({
      apiKey,
      appUserId: accountId,
      entitlementCode,
    });
  };

  return (
    <SettingsSection title={copy.title} hint={copy.hint}>
      <div className="mx-4 rounded-[22px] border border-dashed border-border/70 bg-card-muted/35 px-4 py-3 text-sm leading-6 text-muted">
        <p className="font-semibold text-foreground">{copy.sandboxOnly}</p>
        <p className="mt-1">
          {apiKey ? copy.apiKeyPresent : copy.apiKeyMissing} · {copy.entitlement}:{" "}
          <span className="font-semibold text-foreground">{entitlementCode}</span> ·{" "}
          {backendSyncEnabled ? copy.syncEnabled : copy.syncDisabled}
        </p>
        {syncSuppressed ? <p className="mt-1 text-amber-700">{copy.syncSuppressed}</p> : null}
      </div>
      <SettingsRow
        separated
        title={copy.title}
        hint={!accountId ? copy.accountMissing : undefined}
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() =>
                void runAction(copy.configure, async () => {
                  await ensureConfigured();
                  return { configured: true, accountId, entitlementCode };
                })
              }
              disabled={isPending || !accountId}
              className={`${childActionSecondaryClass} min-h-[2.6rem] px-4 text-[0.84rem] disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {copy.configure}
            </button>
            <button
              type="button"
              onClick={() =>
                void runAction(copy.offerings, async () => {
                  await ensureConfigured();
                  return getNativeRevenueCatOfferings();
                })
              }
              disabled={isPending || !accountId}
              className={`${childActionSecondaryClass} min-h-[2.6rem] px-4 text-[0.84rem] disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {copy.offerings}
            </button>
            <button
              type="button"
              onClick={() =>
                void runAction(copy.buy, async () => {
                  await ensureConfigured();
                  clearRevenueCatSyncSuppressionForAccount(accountId);
                  const offerings = await getNativeRevenueCatOfferings();
                  const selectedPackage = offerings?.availablePackages?.[0] ?? null;
                  if (!selectedPackage) {
                    throw new Error(copy.packageMissing);
                  }
                  const snapshot = await purchaseNativeRevenueCatPackage({
                    packageIdentifier: selectedPackage.identifier,
                    offeringIdentifier: offerings?.currentOfferingIdentifier,
                    entitlementCode,
                  });
                  await refreshSubscriptionState(snapshot);
                  return snapshot;
                })
              }
              disabled={isPending || !accountId}
              className={`${childActionPrimaryClass} min-h-[2.6rem] px-4 text-[0.84rem] disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {copy.buy}
            </button>
            <button
              type="button"
              onClick={() =>
                void runAction(copy.restore, async () => {
                  await ensureConfigured();
                  clearRevenueCatSyncSuppressionForAccount(accountId);
                  const snapshot = await restoreNativeRevenueCatPurchases(entitlementCode);
                  await refreshSubscriptionState(snapshot);
                  return snapshot;
                })
              }
              disabled={isPending || !accountId}
              className={`${childActionSecondaryClass} min-h-[2.6rem] px-4 text-[0.84rem] disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {copy.restore}
            </button>
            <button
              type="button"
              onClick={() =>
                void runAction(copy.snapshot, async () => {
                  await ensureConfigured();
                  return getNativeRevenueCatCustomerSnapshot(entitlementCode);
                })
              }
              disabled={isPending || !accountId}
              className={`${childActionSecondaryClass} min-h-[2.6rem] px-4 text-[0.84rem] disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {copy.snapshot}
            </button>
            <button
              type="button"
              onClick={() =>
                void runAction(copy.resetToFree, async () => {
                  const response = await resetBillingDebugToFree();
                  await invalidateSubscriptionQueries(queryClient, {
                    accountId,
                    currentFamilyId,
                    includeCareQueries: true,
                  });
                  return response;
                })
              }
              disabled={isPending || !accountId}
              className={`${childActionSecondaryClass} min-h-[2.6rem] px-4 text-[0.84rem] disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {copy.resetToFree}
            </button>
            <button
              type="button"
              onClick={() =>
                void runAction(copy.forceFreeMode, async () => {
                  suppressRevenueCatSyncForAccount(accountId);
                  clearAllOfflineCareOverrides();
                  const response = await resetBillingDebugToFree();
                  await invalidateSubscriptionQueries(queryClient, {
                    accountId,
                    currentFamilyId,
                    includeCareQueries: true,
                  });
                  return { ...response, syncSuppressed: true };
                })
              }
              disabled={isPending || !accountId}
              className={`${childActionSecondaryClass} min-h-[2.6rem] px-4 text-[0.84rem] disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {copy.forceFreeMode}
            </button>
            <button
              type="button"
              onClick={() =>
                void runAction(copy.resumeSync, async () => {
                  clearRevenueCatSyncSuppressionForAccount(accountId);
                  await invalidateSubscriptionQueries(queryClient, {
                    accountId,
                    currentFamilyId,
                    includeCareQueries: true,
                  });
                  return { syncSuppressed: false };
                })
              }
              disabled={isPending || !accountId}
              className={`${childActionSecondaryClass} min-h-[2.6rem] px-4 text-[0.84rem] disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {copy.resumeSync}
            </button>
          </div>
        }
      />
      <div className="mx-4 mt-4 rounded-[22px] bg-slate-950/95 px-4 py-4 text-xs leading-6 text-slate-100 shadow-inner">
        <p className="font-semibold text-white">
          {isPending ? copy.working : copy.ready}
          {result ? ` · ${result.label}` : ""}
        </p>
        {error ? <p className="mt-2 text-rose-300">{error}</p> : null}
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-[0.73rem] leading-6 text-slate-200">
          {serializeResult(result) || copy.noResult}
        </pre>
      </div>
    </SettingsSection>
  );
}

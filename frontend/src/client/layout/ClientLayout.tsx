/**
 * Layout клиентской части: общий Layout с навигацией по разделам.
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { fetchFamilies } from "@shared/api/families";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import { Layout } from "@shared/components/Layout";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import {
  getExistingPushSubscription,
  getPushSupportIssue,
  isPushSupported,
  subscribeToPushNotifications,
  toPushSubscriptionPayload,
  withTimeout,
} from "@shared/utils/pushNotifications";

export function ClientLayout() {
  const { copy } = useI18n();
  const accountId = useAppStore((s) => s.accountId);
  const authToken = useAppStore((s) => s.authToken);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">("checking");
  const [isPushPromptActionsHidden, setIsPushPromptActionsHidden] = useState(false);
  const [isPushPending, setIsPushPending] = useState(false);
  const [pushPromptError, setPushPromptError] = useState<string | null>(null);
  const [pushPromptSuccess, setPushPromptSuccess] = useState<string | null>(null);
  const activeObservationsNavItem = {
    to: "/illnesses/active",
    label: copy.clientLayout.nav.observations,
    mobileLabel: copy.clientLayout.nav.observations,
    exactActivePaths: ["/illnesses/active", "/children/:childId/illness"],
  };
  const childrenNavItem = {
    to: "/children",
    label: copy.clientLayout.nav.children,
    mobileLabel: copy.clientLayout.nav.children,
    exactActivePaths: ["/children", "/children/:childId"],
  };
  const baseDesktopNavLinks = [
    activeObservationsNavItem,
    childrenNavItem,
    {
      to: "/pillbox",
      label: copy.clientLayout.nav.pillbox,
      mobileLabel: copy.clientLayout.nav.pillbox,
      exactActivePaths: ["/pillbox"],
    },
    {
      to: "/medicine-cabinet",
      label: copy.clientLayout.nav.cabinet,
      mobileLabel: copy.clientLayout.nav.cabinet,
    },
  ];
  const baseMobileNavLinks = [...baseDesktopNavLinks];
  const { data: families = [], isSuccess } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: !!accountId,
  });

  const { data: pushConfig } = useQuery({
    queryKey: ["push", "config", accountId],
    queryFn: fetchPushNotificationConfig,
    enabled: Boolean(authToken && accountId),
    staleTime: 5 * 60 * 1000,
  });

  const desktopNavLinks = baseDesktopNavLinks;
  const mobileNavLinks = baseMobileNavLinks;

  useEffect(() => {
    setIsPushPromptActionsHidden(false);
    setPushPromptError(null);
    setPushPromptSuccess(null);
  }, [accountId]);

  useEffect(() => {
    if (!authToken || !accountId || !pushConfig?.enabled || !isPushSupported()) {
      setPushStatus("disabled");
      setPushPromptSuccess(null);
      return;
    }

    let isCancelled = false;

    const checkPush = async () => {
      try {
        if (Notification.permission !== "granted") {
          if (!isCancelled) {
            setPushStatus("disabled");
            setPushPromptSuccess(null);
          }
          return;
        }

        const subscription = await getExistingPushSubscription();
        if (!isCancelled) {
          const nextStatus = subscription ? "enabled" : "disabled";
          setPushStatus(nextStatus);
          if (nextStatus === "disabled") {
            setPushPromptSuccess(null);
          }
        }
      } catch {
        if (!isCancelled) {
          setPushStatus("disabled");
          setPushPromptSuccess(null);
        }
      }
    };

    void checkPush();

    const handlePushSubscriptionChanged = () => {
      void checkPush();
    };

    window.addEventListener("push:subscription-changed", handlePushSubscriptionChanged);

    return () => {
      isCancelled = true;
      window.removeEventListener("push:subscription-changed", handlePushSubscriptionChanged);
    };
  }, [accountId, authToken, pushConfig?.enabled]);

  const shouldShowPushPrompt =
    Boolean(pushConfig?.enabled) && isPushSupported() && pushStatus === "disabled";

  const handleEnablePush = async () => {
    const pushSupportIssue = getPushSupportIssue();
    if (pushSupportIssue) {
      setPushPromptError(copy.clientLayout.pushErrors.supportMissing);
      return;
    }
    if (!pushConfig?.enabled || !pushConfig.vapidPublicKey) {
      setPushPromptError(copy.clientLayout.pushErrors.serverNotReady);
      return;
    }

    setPushPromptError(null);
    setPushPromptSuccess(null);
    setIsPushPending(true);

    try {
      const permission = await withTimeout(
        Notification.requestPermission(),
        8000,
        copy.clientLayout.pushErrors.permissionTimeout
      );
      if (permission !== "granted") {
        setPushPromptError(copy.clientLayout.pushErrors.permissionDenied);
        return;
      }

      const subscription = await withTimeout(
        subscribeToPushNotifications(pushConfig.vapidPublicKey),
        10000,
        copy.clientLayout.pushErrors.subscribeTimeout
      );

      await withTimeout(
        upsertPushSubscription(toPushSubscriptionPayload(subscription)),
        8000,
        copy.clientLayout.pushErrors.acceptTimeout
      );

      setPushStatus("enabled");
      setPushPromptSuccess(copy.clientLayout.pushErrors.enabled);
      window.dispatchEvent(new Event("push:subscription-changed"));
    } catch (error) {
      setPushPromptError(
        error instanceof Error ? error.message : copy.clientLayout.pushErrors.enableFailed
      );
    } finally {
      setIsPushPending(false);
    }
  };

  useEffect(() => {
    if (!isSuccess) {
      return;
    }
    const firstFamily = families[0] ?? null;
    if (!currentFamilyId) {
      if (firstFamily) {
        setCurrentFamily(firstFamily);
      }
      return;
    }
    const family = families.find((item) => item.id === currentFamilyId);
    if (!family) {
      setCurrentFamily(firstFamily);
      return;
    }
    if (family.name !== currentFamilyName) {
      setCurrentFamily(family);
    }
  }, [currentFamilyId, currentFamilyName, families, isSuccess, setCurrentFamily]);

  return (
    <Layout navLinks={desktopNavLinks} mobileNavLinks={mobileNavLinks} showCurrentFamily>
      {shouldShowPushPrompt && (
        <Surface className="soft-panel-muted mb-4 p-4 sm:p-5">
          {isPushPromptActionsHidden ? (
            <button
              type="button"
              onClick={() => setIsPushPromptActionsHidden(false)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-[20px] text-left transition hover:opacity-95"
            >
              <p className="app-card-title text-[0.96rem]">{copy.clientLayout.pushPrompt.title}</p>
              <span className="soft-button-secondary inline-flex min-h-[2.6rem] items-center justify-center px-3.5 text-[0.82rem] tracking-[-0.025em]">
                {copy.common.open}
              </span>
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="app-card-title text-[1rem]">{copy.clientLayout.pushPrompt.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {copy.clientLayout.pushPrompt.description}
                </p>
                {pushPromptError && (
                  <p className="soft-note-danger mt-3 rounded-2xl px-4 py-3 text-sm">
                    {pushPromptError}
                  </p>
                )}
                {pushPromptSuccess && (
                  <p className="soft-note-success mt-3 rounded-2xl px-4 py-3 text-sm">
                    {pushPromptSuccess}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isPushPending}
                  className="soft-button-primary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.03em] sm:min-h-[3rem] sm:px-4 sm:text-[0.88rem]"
                >
                  {isPushPending
                    ? copy.clientLayout.pushPrompt.enabling
                    : copy.clientLayout.pushPrompt.enable}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPushPromptActionsHidden(true)}
                  disabled={isPushPending}
                  className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3rem] sm:px-4 sm:text-[0.88rem]"
                >
                  {copy.clientLayout.pushPrompt.hide}
                </button>
              </div>
            </div>
          )}
        </Surface>
      )}
      <Outlet />
    </Layout>
  );
}

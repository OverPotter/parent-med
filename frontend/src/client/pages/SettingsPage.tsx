import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { Link, useLocation } from "react-router-dom";
import {
  changePassword,
  deleteMyAccount,
  deleteMyFamily,
  refreshSession,
  updateRecoveryCode,
} from "@shared/api/auth";
import { applySessionToClient, broadcastAuthLogout } from "@shared/api/client";
import { fetchFamilies, fetchMyFamilyAccess } from "@shared/api/families";
import {
  deletePushSubscription,
  fetchPushNotificationConfig,
  fetchPushNotificationPreferences,
  sendTestPushNotification,
  updatePushNotificationPreferences,
  upsertPushSubscription,
} from "@shared/api/pushNotifications";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { PageIntro } from "@shared/components/PageIntro";
import { familyAccessQueryOptions } from "@shared/hooks/useFamilyAccessQueryOptions";
import { useI18n } from "@shared/hooks/useI18n";
import { saveNativePasswordCredential } from "@shared/security/nativePasswordAutofill";
import { useAppStore } from "@shared/store/useAppStore";
import { formatDate } from "@shared/utils/date";
import { openExternalUrl } from "@shared/utils/openExternalUrl";
import { withTimeout } from "@shared/utils/pushNotifications";
import {
  getCachedNativePushSubscriptionPayload,
  getNativePushPermissionStatus,
  getNativePushSubscriptionPayload,
  isNativePushOptedOut,
  isNativePushSupported,
  openNativeNotificationSettings,
  setNativePushOptOut,
} from "@shared/utils/nativePushNotifications";
import { showNativeManageSubscriptions } from "@shared/utils/nativeRevenueCat";
import {
  resolveLiveActivityPreferences,
  syncLiveActivityPreferencesMirror,
} from "@shared/utils/liveActivityPreferences";
import { isRecoveryCodeValid, normalizeRecoveryCode } from "@shared/utils/recoveryCode";
import { getRevenueCatIosApiKey } from "@shared/config/revenueCat";
import { TestPaywallDialogContainer } from "@client/subscription/TestPaywallDialogContainer";
import { SubscriptionUpgradeDialog } from "@client/subscription/SubscriptionUpgradeDialog";
import { useSubscriptionUpgradeDialogState } from "@client/subscription/useSubscriptionUpgradeDialogState";
import { useUpgradeDialogOpenState } from "@client/subscription/useUpgradeDialogOpenState";
import { SettingsAppPreferencesSection } from "./settings/SettingsAppPreferencesSection";
import { tSettings } from "./settings/copy";
import { SettingsLiveActivitiesSection } from "./settings/SettingsLiveActivitiesSection";
import { SettingsNotificationsSection } from "./settings/SettingsNotificationsSection";
import { SettingsRevenueCatSection } from "./settings/SettingsRevenueCatSection";
import { SettingsSecuritySection } from "./settings/SettingsSecuritySection";
import { SettingsRow, SettingsSection } from "./settings/ui";
import { stopDisabledLiveActivities } from "@shared/utils/liveActivities";

function getSubscriptionStatusLabel(
  language: "ru" | "en",
  status: "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired"
) {
  switch (status) {
    case "trialing":
      return tSettings(language, "subscriptionStatusTrialing");
    case "active":
      return tSettings(language, "subscriptionStatusActive");
    case "grace":
      return tSettings(language, "subscriptionStatusGrace");
    case "canceled":
      return tSettings(language, "subscriptionStatusCanceled");
    case "expired":
      return tSettings(language, "subscriptionStatusExpired");
    case "inactive":
    default:
      return tSettings(language, "subscriptionStatusInactive");
  }
}

function getInitialPushStatus() {
  if (!isNativePushSupported()) {
    return "checking" as const;
  }
  if (isNativePushOptedOut()) {
    return "disabled" as const;
  }
  return getCachedNativePushSubscriptionPayload() ? ("enabled" as const) : ("disabled" as const);
}

export function SettingsPage() {
  const { language } = useI18n();
  const location = useLocation();
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const accountEmail = useAppStore((s) => s.accountEmail);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountHasRecoveryCode = useAppStore((s) => s.accountHasRecoveryCode);
  const setAccountProfile = useAppStore((s) => s.setAccountProfile);
  const medicationIntervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const setMedicationIntervalUnit = useAppStore((s) => s.setMedicationIntervalUnit);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">(
    getInitialPushStatus
  );
  const [pushError, setPushError] = useState<string | null>(null);
  const [testPushStatus, setTestPushStatus] = useState<string | null>(null);
  const [isPushPending, setIsPushPending] = useState(false);
  const [isDisablePushConfirmOpen, setIsDisablePushConfirmOpen] = useState(false);
  const [isNativePushBlocked, setIsNativePushBlocked] = useState(false);
  const [isNativePushSettingsDialogOpen, setIsNativePushSettingsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isRecoveryCodeDialogOpen, setIsRecoveryCodeDialogOpen] = useState(false);
  const { isUpgradeDialogOpen, setIsUpgradeDialogOpen, openUpgradeDialog } =
    useUpgradeDialogOpenState();
  const [isTestPaywallOpen, setIsTestPaywallOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);
  const [isDeleteFamilyConfirmOpen, setIsDeleteFamilyConfirmOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [recoveryCodeError, setRecoveryCodeError] = useState<string | null>(null);
  const [recoveryCodeSuccess, setRecoveryCodeSuccess] = useState<string | null>(null);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [deleteFamilyError, setDeleteFamilyError] = useState<string | null>(null);
  const manageSubscriptionPendingRef = useRef(false);
  const [selectedReminderMinutes, setSelectedReminderMinutes] = useState("10");
  const [selectedPillboxReminderMinutes, setSelectedPillboxReminderMinutes] = useState("10");
  const [liveActivitySettings, setLiveActivitySettings] = useState(() =>
    resolveLiveActivityPreferences()
  );
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const isDevTestPushVisible = import.meta.env.DEV || import.meta.env.MODE === "mobile-dev";
  const isRevenueCatTestVisible =
    isNativeIos && isDevTestPushVisible && Boolean(getRevenueCatIosApiKey());
  const isPushEnabled = pushStatus === "enabled";

  const { data: pushConfig, isLoading: isPushConfigLoading } = useQuery({
    queryKey: ["push", "config", accountId],
    queryFn: () =>
      withTimeout(
        fetchPushNotificationConfig(),
        5000,
        tSettings(language, "pushConfigCheckFailed")
      ),
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: pushPreferences, isLoading: isPushPreferencesLoading } = useQuery({
    queryKey: ["push", "preferences", "account", accountId],
    queryFn: fetchPushNotificationPreferences,
    staleTime: 5 * 60 * 1000,
  });
  const { data: families = [] } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: Boolean(accountId),
  });
  const { data: familyAccess } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId),
    ...familyAccessQueryOptions,
  });
  const canManageSubscription = familyAccess?.canManageSubscription ?? false;
  const childrenPushEnabled = pushPreferences?.childrenEnabled ?? true;
  const pillboxPushEnabled = pushPreferences?.pillboxEnabled ?? true;
  const cabinetEarlyReminderEnabled =
    (pushPreferences?.cabinetNotify10Days ?? false) ||
    (pushPreferences?.cabinetNotify7Days ?? false) ||
    (pushPreferences?.cabinetNotify3Days ?? false);
  const selectedCabinetReminderDays = pushPreferences?.cabinetNotify10Days
    ? 10
    : pushPreferences?.cabinetNotify7Days
      ? 7
      : pushPreferences?.cabinetNotify3Days
        ? 3
        : null;
  const canUseLiveActivities = familyAccess?.canUseLiveActivities ?? false;
  const effectiveLiveActivitySettings = canUseLiveActivities
    ? liveActivitySettings
    : {
        sleepEnabled: false,
        feedingEnabled: false,
        illnessEnabled: false,
      };
  const family = families.find((item) => item.id === currentFamilyId) ?? families[0] ?? null;
  const isFamilyOwner = Boolean(family?.ownerAccountId && family.ownerAccountId === accountId);
  const subscriptionStatus = familyAccess?.subscriptionStatus ?? family?.subscriptionStatus ?? "inactive";
  const {
    upgradeToPlus,
    restorePurchases,
    isUpgradePending,
    upgradeErrorMessage,
    clearUpgradeError,
    restoreSuccessMessage,
  } = useSubscriptionUpgradeDialogState({
    language,
    accountId,
    currentFamilyId,
    canManageSubscription,
    subscriptionStatus,
  });
  const subscriptionExpiresAt = family?.subscriptionExpiresAt ?? null;
  const subscriptionStatusLabel = getSubscriptionStatusLabel(language, subscriptionStatus);
  const familyDangerActionLabel = tSettings(language, "deleteFamily");
  const familyDangerActionDescription = tSettings(language, "deleteFamilyDescription");
  const liveActivitiesLockedReason = !canUseLiveActivities
    ? tSettings(language, "liveActivitiesLockedReason")
    : null;

  const updatePushPreferencesMutation = useMutation({
    mutationFn: (payload: {
      children_enabled?: boolean;
      before_reminder_minutes?: number;
      pillbox_enabled?: boolean;
      pillbox_before_reminder_minutes?: number;
      cabinet_notify_10_days?: boolean;
      cabinet_notify_7_days?: boolean;
      cabinet_notify_3_days?: boolean;
      live_activity_sleep_enabled?: boolean;
      live_activity_feeding_enabled?: boolean;
      live_activity_illness_enabled?: boolean;
    }) => updatePushNotificationPreferences(payload),
    onMutate: async (payload) => {
      const preferencesQueryKey = ["push", "preferences", "account", accountId];
      await queryClient.cancelQueries({ queryKey: preferencesQueryKey });
      const previousPreferences = queryClient.getQueryData(preferencesQueryKey);
      const previousLiveActivitySettings = liveActivitySettings;
      const nextLiveActivitySettings = {
        sleepEnabled:
          payload.live_activity_sleep_enabled ?? previousLiveActivitySettings.sleepEnabled,
        feedingEnabled:
          payload.live_activity_feeding_enabled ?? previousLiveActivitySettings.feedingEnabled,
        illnessEnabled:
          payload.live_activity_illness_enabled ?? previousLiveActivitySettings.illnessEnabled,
      };

      setLiveActivitySettings(nextLiveActivitySettings);
      syncLiveActivityPreferencesMirror(nextLiveActivitySettings);

      queryClient.setQueryData(
        preferencesQueryKey,
        (current: typeof pushPreferences | undefined) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            childrenEnabled: payload.children_enabled ?? current.childrenEnabled,
            beforeReminderMinutes: payload.before_reminder_minutes ?? current.beforeReminderMinutes,
            pillboxEnabled: payload.pillbox_enabled ?? current.pillboxEnabled,
            pillboxBeforeReminderMinutes:
              payload.pillbox_before_reminder_minutes ?? current.pillboxBeforeReminderMinutes,
            cabinetNotify10Days: payload.cabinet_notify_10_days ?? current.cabinetNotify10Days,
            cabinetNotify7Days: payload.cabinet_notify_7_days ?? current.cabinetNotify7Days,
            cabinetNotify3Days: payload.cabinet_notify_3_days ?? current.cabinetNotify3Days,
            liveActivitySleepEnabled:
              payload.live_activity_sleep_enabled ?? current.liveActivitySleepEnabled,
            liveActivityFeedingEnabled:
              payload.live_activity_feeding_enabled ?? current.liveActivityFeedingEnabled,
            liveActivityIllnessEnabled:
              payload.live_activity_illness_enabled ?? current.liveActivityIllnessEnabled,
          };
        }
      );

      return { previousPreferences, previousLiveActivitySettings };
    },
    onSuccess: (nextPreferences) => {
      setSelectedReminderMinutes(String(nextPreferences.beforeReminderMinutes));
      setSelectedPillboxReminderMinutes(String(nextPreferences.pillboxBeforeReminderMinutes));
      const nextLiveActivitySettings = resolveLiveActivityPreferences(nextPreferences);
      setLiveActivitySettings(nextLiveActivitySettings);
      syncLiveActivityPreferencesMirror(nextLiveActivitySettings);
      queryClient.setQueryData(["push", "preferences", "account", accountId], nextPreferences);
    },
    onError: (error, _payload, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          ["push", "preferences", "account", accountId],
          context.previousPreferences
        );
      }
      if (context?.previousLiveActivitySettings) {
        setLiveActivitySettings(context.previousLiveActivitySettings);
        syncLiveActivityPreferencesMirror(context.previousLiveActivitySettings);
      }
      setPushError(
        error instanceof Error ? error.message : tSettings(language, "reminderSaveFailed")
      );
    },
  });

  const sendTestPushMutation = useMutation({
    mutationFn: sendTestPushNotification,
    onMutate: () => {
      setPushError(null);
      setTestPushStatus(tSettings(language, "testPushSending"));
    },
    onSuccess: (result) => {
      if (result.sent) {
        setTestPushStatus(
          tSettings(language, "testPushSent").replace("{{count}}", String(result.subscriptionCount))
        );
        return;
      }
      setTestPushStatus(tSettings(language, "testPushNoSubscriptions"));
    },
    onError: (error) => {
      setTestPushStatus(null);
      setPushError(
        error instanceof Error ? error.message : tSettings(language, "testPushFailed")
      );
    },
  });

  const updateRecoveryCodeMutation = useMutation({
    mutationFn: (payload: { recovery_code: string }) => updateRecoveryCode(payload),
    onSuccess: () => {
      setAccountProfile({ hasRecoveryCode: true });
      setRecoveryCodeError(null);
      setRecoveryCodeSuccess(tSettings(language, "recoveryCodeUpdated"));
      setRecoveryCode("");
      setIsRecoveryCodeDialogOpen(false);
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      setRecoveryCodeSuccess(null);
      setRecoveryCodeError(
        error.response?.data?.detail ?? tSettings(language, "recoveryCodeTooShort")
      );
    },
  });

  useEffect(() => {
    if (pushPreferences) {
      setSelectedReminderMinutes(String(pushPreferences.beforeReminderMinutes));
      setSelectedPillboxReminderMinutes(String(pushPreferences.pillboxBeforeReminderMinutes));
      const nextLiveActivitySettings = resolveLiveActivityPreferences(pushPreferences);
      setLiveActivitySettings(nextLiveActivitySettings);
      syncLiveActivityPreferencesMirror(nextLiveActivitySettings);
    }
  }, [pushPreferences]);

  useEffect(() => {
    if (!isNativePushSupported()) {
      setPushStatus("disabled");
      setIsNativePushBlocked(false);
      setIsNativePushSettingsDialogOpen(false);
      return;
    }
    setPushStatus("checking");
    let isCancelled = false;
    const loadSubscription = async () => {
      try {
        if (isNativePushSupported()) {
          if (isNativePushOptedOut()) {
            if (!isCancelled) {
              setPushStatus("disabled");
              setIsNativePushBlocked(false);
              setIsNativePushSettingsDialogOpen(false);
            }
            return;
          }
          const cachedPayload = getCachedNativePushSubscriptionPayload();
          if (!isCancelled && cachedPayload) {
            setPushStatus("enabled");
            setIsNativePushBlocked(false);
            setIsNativePushSettingsDialogOpen(false);
          }
          const permission = await getNativePushPermissionStatus();
          if (permission === "denied") {
            if (!isCancelled) {
              setPushStatus("disabled");
              setIsNativePushBlocked(true);
              setIsNativePushSettingsDialogOpen(false);
            }
            return;
          }
          if (cachedPayload) {
            return;
          }
          const payload = await withTimeout(
            getNativePushSubscriptionPayload({ promptIfNeeded: false }),
            5000,
            tSettings(language, "devicePushCheckFailed")
          );
          if (!isCancelled) {
            setPushStatus(payload ? "enabled" : "disabled");
            setIsNativePushBlocked(false);
            setIsNativePushSettingsDialogOpen(false);
          }
          return;
        }

      } catch {
        if (!isCancelled) {
          setPushStatus("disabled");
          setIsNativePushBlocked(false);
          setIsNativePushSettingsDialogOpen(false);
        }
      }
    };
    void loadSubscription();

    const refreshSubscription = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void loadSubscription();
    };

    window.addEventListener("push:subscription-changed", refreshSubscription);
    window.addEventListener("focus", refreshSubscription);
    window.addEventListener("pageshow", refreshSubscription);
    document.addEventListener("visibilitychange", refreshSubscription);

    return () => {
      isCancelled = true;
      window.removeEventListener("push:subscription-changed", refreshSubscription);
      window.removeEventListener("focus", refreshSubscription);
      window.removeEventListener("pageshow", refreshSubscription);
      document.removeEventListener("visibilitychange", refreshSubscription);
    };
  }, [language]);

  useEffect(() => {
    if (location.hash !== "#notifications") {
      return;
    }

    const target = document.getElementById("settings-notifications");
    if (!target) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [location.hash]);

  useEffect(() => {
    if (!passwordSuccess || typeof window === "undefined") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPasswordSuccess(null);
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [passwordSuccess]);

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      changePassword({
        ...payload,
        refresh_token: useAppStore.getState().refreshToken,
      }),
    onSuccess: async (_data, variables) => {
      const currentRefreshToken = useAppStore.getState().refreshToken;
      if (accountEmail) {
        try {
          await saveNativePasswordCredential(accountEmail, variables.new_password);
        } catch {
          // Keep password update successful even if iOS autofill update does not surface a prompt.
        }
      }
      setIsPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setPasswordSuccess(tSettings(language, "passwordUpdated"));
      if (!currentRefreshToken) {
        return;
      }
      void refreshSession(currentRefreshToken)
        .then((nextSession) => {
          applySessionToClient(nextSession);
        })
        .catch(() => {
          // Keep the success flow intact; auth sync will recover on the next protected request.
        });
    },
    onError: (error) => {
      setPasswordSuccess(null);
      setPasswordError(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          (error instanceof Error ? error.message : tSettings(language, "passwordChangeFailed"))
      );
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      queryClient.clear();
      broadcastAuthLogout();
    },
    onError: (error) => {
      setDeleteAccountError(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          (error instanceof Error ? error.message : tSettings(language, "deleteAccountFailed"))
      );
    },
  });

  const deleteFamilyMutation = useMutation({
    mutationFn: deleteMyFamily,
    onSuccess: () => {
      queryClient.clear();
      broadcastAuthLogout();
    },
    onError: (error) => {
      setIsDeleteFamilyConfirmOpen(false);
      setDeleteFamilyError(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          (error instanceof Error ? error.message : tSettings(language, "deleteFamilyFailed"))
      );
    },
  });

  const handleManageSubscription = () => {
    if (manageSubscriptionPendingRef.current) {
      return;
    }
    manageSubscriptionPendingRef.current = true;
    if (isNativeIos) {
      void showNativeManageSubscriptions().finally(() => {
        window.setTimeout(() => {
          manageSubscriptionPendingRef.current = false;
        }, 900);
      });
      return;
    }
    void openExternalUrl("https://apps.apple.com/account/subscriptions").finally(() => {
      manageSubscriptionPendingRef.current = false;
    });
  };

  const resetPasswordDialogState = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handleEnablePush = async () => {
    setTestPushStatus(null);
    if (isNativePushSupported()) {
      setPushError(null);
      setIsPushPending(true);
      try {
        setNativePushOptOut(false);
        const payload = await withTimeout(
          getNativePushSubscriptionPayload({ promptIfNeeded: true }),
          10000,
          tSettings(language, "subscribeTimeout")
        );
        if (!payload) {
          const permission = await getNativePushPermissionStatus();
          if (permission === "denied") {
            setIsNativePushBlocked(true);
            setIsNativePushSettingsDialogOpen(true);
            setPushError(null);
          } else {
            setPushError(tSettings(language, "permissionDenied"));
          }
          return;
        }
        await withTimeout(
          upsertPushSubscription(payload),
          8000,
          tSettings(language, "serverAcceptFailed")
        );
        setPushStatus("enabled");
        setIsNativePushBlocked(false);
        setIsNativePushSettingsDialogOpen(false);
        window.dispatchEvent(new Event("push:subscription-changed"));
      } catch (error) {
        setPushError(
          error instanceof Error ? error.message : tSettings(language, "enablePushFailed")
        );
      } finally {
        setIsPushPending(false);
      }
      return;
    }
  };

  const handleDisablePush = async (): Promise<boolean> => {
    setPushError(null);
    setTestPushStatus(null);
    setIsPushPending(true);
    try {
      if (isNativePushSupported()) {
        const payload =
          (await getNativePushSubscriptionPayload({ promptIfNeeded: false })) ??
          getCachedNativePushSubscriptionPayload();
        if (payload) {
          await deletePushSubscription({ endpoint: payload.endpoint });
        }
        setNativePushOptOut(true);
        setIsNativePushBlocked(false);
        setIsNativePushSettingsDialogOpen(false);
        setPushStatus("disabled");
        window.dispatchEvent(new Event("push:subscription-changed"));
        return true;
      }

      setPushError(tSettings(language, "pushUnsupported"));
      return false;
    } catch {
      setPushError(tSettings(language, "disablePushFailed"));
      return false;
    } finally {
      setIsPushPending(false);
    }
  };

  const isGlobalPushSwitchDisabled =
    isPushPending ||
    isPushConfigLoading ||
    pushStatus === "checking" ||
    (!isPushEnabled && (!pushConfig?.enabled || !isNativePushSupported()));

  const handleGlobalPushSwitchToggle = () => {
    if (isGlobalPushSwitchDisabled) return;
    if (isPushEnabled) {
      setIsDisablePushConfirmOpen(true);
      return;
    }
    void handleEnablePush();
  };

  const handleSendTestPush = () => {
    sendTestPushMutation.mutate();
  };

  const handleReminderMinutesChange = (value: string) => {
    setSelectedReminderMinutes(value);
    setPushError(null);
    updatePushPreferencesMutation.mutate({ before_reminder_minutes: parseInt(value, 10) });
  };

  const handlePillboxReminderMinutesChange = (value: string) => {
    setSelectedPillboxReminderMinutes(value);
    setPushError(null);
    updatePushPreferencesMutation.mutate({ pillbox_before_reminder_minutes: parseInt(value, 10) });
  };

  const handleChildrenEarlyReminderToggle = (enabled: boolean) => {
    setPushError(null);
    updatePushPreferencesMutation.mutate({
      children_enabled: enabled,
      before_reminder_minutes: enabled && selectedReminderMinutes === "0" ? 10 : undefined,
    });
  };

  const handlePillboxEarlyReminderToggle = (enabled: boolean) => {
    setPushError(null);
    updatePushPreferencesMutation.mutate({
      pillbox_enabled: enabled,
      pillbox_before_reminder_minutes:
        enabled && selectedPillboxReminderMinutes === "0" ? 10 : undefined,
    });
  };

  const handleCabinetReminderSelect = (days: 10 | 7 | 3) => {
    setPushError(null);
    updatePushPreferencesMutation.mutate({
      cabinet_notify_10_days: days === 10,
      cabinet_notify_7_days: days === 7,
      cabinet_notify_3_days: days === 3,
    });
  };

  const handleCabinetEarlyReminderToggle = (enabled: boolean) => {
    setPushError(null);
    if (enabled) {
      handleCabinetReminderSelect((selectedCabinetReminderDays ?? 10) as 10 | 7 | 3);
      return;
    }
    updatePushPreferencesMutation.mutate({
      cabinet_notify_10_days: false,
      cabinet_notify_7_days: false,
      cabinet_notify_3_days: false,
    });
  };

  const handleLiveActivitySleepToggle = (enabled: boolean) => {
    if (!canUseLiveActivities) {
      openUpgradeDialog();
      return;
    }
    setPushError(null);
    setLiveActivitySettings((current) => {
      const next = { ...current, sleepEnabled: enabled };
      syncLiveActivityPreferencesMirror(next);
      void stopDisabledLiveActivities(next);
      updatePushPreferencesMutation.mutate({ live_activity_sleep_enabled: enabled });
      return next;
    });
  };

  const handleLiveActivityFeedingToggle = (enabled: boolean) => {
    if (!canUseLiveActivities) {
      openUpgradeDialog();
      return;
    }
    setPushError(null);
    setLiveActivitySettings((current) => {
      const next = { ...current, feedingEnabled: enabled };
      syncLiveActivityPreferencesMirror(next);
      void stopDisabledLiveActivities(next);
      updatePushPreferencesMutation.mutate({ live_activity_feeding_enabled: enabled });
      return next;
    });
  };

  const handleLiveActivityIllnessToggle = (enabled: boolean) => {
    if (!canUseLiveActivities) {
      openUpgradeDialog();
      return;
    }
    setPushError(null);
    setLiveActivitySettings((current) => {
      const next = { ...current, illnessEnabled: enabled };
      syncLiveActivityPreferencesMirror(next);
      void stopDisabledLiveActivities(next);
      updatePushPreferencesMutation.mutate({ live_activity_illness_enabled: enabled });
      return next;
    });
  };

  const handleSubmitPasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordSuccess(null);
      setPasswordError(tSettings(language, "fillAllPasswordFields"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordSuccess(null);
      setPasswordError(tSettings(language, "passwordsMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordSuccess(null);
      setPasswordError(tSettings(language, "passwordTooShort"));
      return;
    }
    setPasswordError(null);
    setPasswordSuccess(null);
    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const handleSubmitRecoveryCode = () => {
    const normalizedRecoveryCode = normalizeRecoveryCode(recoveryCode);
    if (!isRecoveryCodeValid(recoveryCode)) {
      setRecoveryCodeSuccess(null);
      setRecoveryCodeError(tSettings(language, "recoveryCodeTooShort"));
      return;
    }
    setRecoveryCodeError(null);
    setRecoveryCodeSuccess(null);
    updateRecoveryCodeMutation.mutate({
      recovery_code: normalizedRecoveryCode,
    });
  };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={tSettings(language, "title")}
        subtitle={tSettings(language, "subtitle")}
        action={
          <Link
            to="/more"
            className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {tSettings(language, "moreBack")}
          </Link>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />
      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <Link
            to="/more"
            className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {tSettings(language, "moreBack")}
          </Link>
          <h1 className="app-mobile-section-intro__title">{tSettings(language, "title")}</h1>
          <p className="app-mobile-section-intro__hint">{tSettings(language, "mobileHint")}</p>
        </div>
      </div>
      <SettingsAppPreferencesSection
        language={language}
        theme={theme}
        setTheme={setTheme}
        medicationIntervalUnit={medicationIntervalUnit}
        setMedicationIntervalUnit={setMedicationIntervalUnit}
      />
      <SettingsLiveActivitiesSection
        language={language}
        isIos={isNativeIos}
        sleepEnabled={effectiveLiveActivitySettings.sleepEnabled}
        feedingEnabled={effectiveLiveActivitySettings.feedingEnabled}
        illnessEnabled={effectiveLiveActivitySettings.illnessEnabled}
        disabled={!isNativeIos}
        lockedReason={isNativeIos ? liveActivitiesLockedReason : null}
        onLockedPress={
          isNativeIos && liveActivitiesLockedReason ? openUpgradeDialog : undefined
        }
        onSleepToggle={handleLiveActivitySleepToggle}
        onFeedingToggle={handleLiveActivityFeedingToggle}
        onIllnessToggle={handleLiveActivityIllnessToggle}
      />
      {isRevenueCatTestVisible ? (
        <div id="settings-revenuecat">
          <SettingsRevenueCatSection
            language={language}
            accountId={accountId}
            currentFamilyId={currentFamilyId}
            onOpenTestPaywall={() => setIsTestPaywallOpen(true)}
          />
        </div>
      ) : null}
      <div id="settings-notifications">
        <SettingsNotificationsSection
          language={language}
          isPushEnabled={isPushEnabled}
          pushError={pushError}
          showTestPushAction={isDevTestPushVisible}
          testPushStatus={testPushStatus}
          isTestPushPending={sendTestPushMutation.isPending}
          isNativePushBlocked={isNativePushBlocked}
          isPushConfigLoading={isPushConfigLoading}
          pushConfigEnabled={pushConfig?.enabled}
          isGlobalPushSwitchDisabled={isGlobalPushSwitchDisabled}
          onGlobalPushSwitchToggle={handleGlobalPushSwitchToggle}
          onSendTestPush={handleSendTestPush}
          onOpenSystemSettingsDialog={() => setIsNativePushSettingsDialogOpen(true)}
          childrenEarlyReminderEnabled={childrenPushEnabled}
          pillboxEarlyReminderEnabled={pillboxPushEnabled}
          cabinetEarlyReminderEnabled={cabinetEarlyReminderEnabled}
          selectedReminderMinutes={selectedReminderMinutes}
          selectedPillboxReminderMinutes={selectedPillboxReminderMinutes}
          selectedCabinetReminderDays={selectedCabinetReminderDays}
          isPushPreferencesLoading={isPushPreferencesLoading}
          isUpdatePending={updatePushPreferencesMutation.isPending}
          onChildrenToggle={handleChildrenEarlyReminderToggle}
          onPillboxToggle={handlePillboxEarlyReminderToggle}
          onCabinetToggle={handleCabinetEarlyReminderToggle}
          onChildrenMinutesChange={handleReminderMinutesChange}
          onPillboxMinutesChange={handlePillboxReminderMinutesChange}
          onCabinetReminderSelect={handleCabinetReminderSelect}
        />
      </div>
      <SettingsSection
        title={tSettings(language, "subscriptionSection")}
        hint={tSettings(language, "subscriptionSectionHint")}
      >
        <SettingsRow
          title={tSettings(language, "subscriptionStatusLabel")}
          hint={
            subscriptionExpiresAt
              ? `${subscriptionStatusLabel}. ${tSettings(language, "subscriptionActiveUntil")}: ${formatDate(
                  subscriptionExpiresAt
                )}`
              : subscriptionStatusLabel
          }
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-[15.5rem]">
              <button
                type="button"
                onClick={handleManageSubscription}
                className="soft-pill-primary app-profile-action app-profile-action--selected min-h-[2.08rem] w-full px-2.75 text-[0.69rem] tracking-[-0.022em] sm:min-h-[2.16rem] sm:px-3 sm:text-[0.71rem]"
              >
                {tSettings(language, "subscriptionManageAction")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void restorePurchases();
                }}
                disabled={isUpgradePending || !canManageSubscription}
                className="soft-pill app-profile-action min-h-[2.08rem] w-full px-2.75 text-[0.69rem] tracking-[-0.022em] disabled:opacity-50 sm:min-h-[2.16rem] sm:px-3 sm:text-[0.71rem]"
              >
                {tSettings(language, "subscriptionRestorePurchases")}
              </button>
            </div>
          }
        />
        {restoreSuccessMessage ? (
          <div className="soft-note-success mx-4 mt-1 rounded-2xl px-4 py-3 text-sm">
            {restoreSuccessMessage}
          </div>
        ) : null}
      </SettingsSection>
      <SettingsSecuritySection
        language={language}
        hasRecoveryCode={accountHasRecoveryCode}
        isPasswordDialogOpen={isPasswordDialogOpen}
        isRecoveryCodeDialogOpen={isRecoveryCodeDialogOpen}
        onOpenPasswordDialog={() => {
          resetPasswordDialogState();
          setIsPasswordDialogOpen(true);
        }}
        onOpenRecoveryCodeDialog={() => {
          if (accountHasRecoveryCode) {
            return;
          }
          setRecoveryCode("");
          setRecoveryCodeError(null);
          setRecoveryCodeSuccess(null);
          setIsRecoveryCodeDialogOpen(true);
        }}
        onClosePasswordDialog={() => {
          setIsPasswordDialogOpen(false);
          resetPasswordDialogState();
        }}
        onCloseRecoveryCodeDialog={() => {
          setIsRecoveryCodeDialogOpen(false);
          setRecoveryCode("");
          setRecoveryCodeError(null);
          setRecoveryCodeSuccess(null);
        }}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        recoveryCode={recoveryCode}
        onCurrentPasswordChange={(value) => {
          setCurrentPassword(value);
          setPasswordError(null);
          setPasswordSuccess(null);
        }}
        onNewPasswordChange={(value) => {
          setNewPassword(value);
          setPasswordError(null);
          setPasswordSuccess(null);
        }}
        onConfirmPasswordChange={(value) => {
          setConfirmPassword(value);
          setPasswordError(null);
          setPasswordSuccess(null);
        }}
        onRecoveryCodeChange={(value) => {
          setRecoveryCode(value);
          setRecoveryCodeError(null);
          setRecoveryCodeSuccess(null);
        }}
        onSubmitPasswordChange={handleSubmitPasswordChange}
        onSubmitRecoveryCode={handleSubmitRecoveryCode}
        isPasswordPending={changePasswordMutation.isPending}
        isRecoveryCodePending={updateRecoveryCodeMutation.isPending}
        passwordSuccess={passwordSuccess}
        passwordError={passwordError}
        recoveryCodeSuccess={recoveryCodeSuccess}
        recoveryCodeError={recoveryCodeError}
        canDeleteAccount={!isFamilyOwner}
        canDeleteFamily={isFamilyOwner}
        familyDangerActionLabel={familyDangerActionLabel}
        familyDangerActionDescription={familyDangerActionDescription}
        deleteAccountError={deleteAccountError}
        deleteFamilyError={deleteFamilyError}
        onDeleteAccount={() => {
          setDeleteAccountError(null);
          setIsDeleteAccountConfirmOpen(true);
        }}
        onDeleteFamily={() => {
          setDeleteFamilyError(null);
          setIsDeleteFamilyConfirmOpen(true);
        }}
      />
      <ConfirmDialog
        isOpen={isDisablePushConfirmOpen}
        title={tSettings(language, "disableNotifications")}
        description={tSettings(language, "confirmDisableNotifications")}
        confirmLabel={tSettings(language, "confirmDisable")}
        cancelLabel={tSettings(language, "cancel")}
        confirmTone="danger"
        isPending={isPushPending}
        onCancel={() => setIsDisablePushConfirmOpen(false)}
        onConfirm={() => {
          void (async () => {
            const didDisable = await handleDisablePush();
            if (didDisable) {
              setIsDisablePushConfirmOpen(false);
            }
          })();
        }}
      />
      <ConfirmDialog
        isOpen={isNativePushSettingsDialogOpen}
        title={tSettings(language, "nativePermissionBlockedTitle")}
        description={`${tSettings(language, "nativePermissionBlockedDescription")} ${tSettings(
          language,
          "nativePermissionManualHint"
        )}`}
        confirmLabel={tSettings(language, "openSystemSettings")}
        cancelLabel={tSettings(language, "cancel")}
        onCancel={() => setIsNativePushSettingsDialogOpen(false)}
        onConfirm={() => {
          openNativeNotificationSettings();
          setIsNativePushSettingsDialogOpen(false);
        }}
      />
      <ConfirmDialog
        isOpen={isDeleteAccountConfirmOpen}
        title={tSettings(language, "deleteAccountConfirmTitle")}
        description={tSettings(language, "deleteAccountConfirmDescription")}
        confirmLabel={
          deleteAccountMutation.isPending
            ? tSettings(language, "saving")
            : tSettings(language, "deleteAccountConfirmAction")
        }
        cancelLabel={tSettings(language, "cancel")}
        confirmTone="danger"
        isPending={deleteAccountMutation.isPending}
        onCancel={() => setIsDeleteAccountConfirmOpen(false)}
        onConfirm={() => deleteAccountMutation.mutate()}
      />
      <ConfirmDialog
        isOpen={isDeleteFamilyConfirmOpen}
        title={tSettings(language, "deleteFamilyConfirmTitle")}
        description={tSettings(language, "deleteFamilyConfirmDescription")}
        confirmLabel={
          deleteFamilyMutation.isPending
            ? tSettings(language, "saving")
            : tSettings(language, "deleteFamilyConfirmAction")
        }
        cancelLabel={tSettings(language, "cancel")}
        confirmTone="danger"
        isPending={deleteFamilyMutation.isPending}
        onCancel={() => setIsDeleteFamilyConfirmOpen(false)}
        onConfirm={() => deleteFamilyMutation.mutate()}
      />
      <SubscriptionUpgradeDialog
        isOpen={isUpgradeDialogOpen}
        setIsOpen={setIsUpgradeDialogOpen}
        language={language}
        entryPoint="live_activities"
        canManageSubscription={canManageSubscription}
        subscriptionStatus={subscriptionStatus}
        isUpgradePending={isUpgradePending}
        upgradeErrorMessage={upgradeErrorMessage}
        restoreSuccessMessage={restoreSuccessMessage}
        clearUpgradeError={clearUpgradeError}
        upgradeToPlus={upgradeToPlus}
        restorePurchases={restorePurchases}
        onManageSubscription={handleManageSubscription}
      />
      <TestPaywallDialogContainer
        isOpen={isTestPaywallOpen}
        language={language}
        onClose={() => {
          clearUpgradeError();
          setIsTestPaywallOpen(false);
        }}
        onManageSubscription={handleManageSubscription}
        onUpgrade={(preferredPackageIdentifier) => upgradeToPlus(preferredPackageIdentifier)}
        onRestorePurchases={() => restorePurchases()}
        canManageSubscription={canManageSubscription}
        subscriptionStatus={subscriptionStatus}
        isPending={isUpgradePending}
        errorMessage={upgradeErrorMessage}
        successMessage={restoreSuccessMessage}
      />
    </div>
  );
}

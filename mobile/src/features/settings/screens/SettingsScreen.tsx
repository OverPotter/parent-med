import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  changePassword,
  deleteMyAccount,
  deleteMyFamily,
  fetchMyFamilyAccessSummary,
  fetchMyFamilySettingsSummary,
  fetchPushConfig,
  fetchPushPreferences,
  type MobileFamilyAccessSummary,
  type MobileFamilySettingsSummary,
  type MobilePushConfig,
  type MobilePushPreferences,
  updatePushPreferences,
  updateRecoveryCode,
} from "../api/settingsApi";
import {
  buildSettingsScreenContent,
  mapSubscriptionPlanLabel,
  mapSubscriptionStatusLabel,
} from "../model/settingsScreen";
import { resolveSettingsOwnershipPolicy } from "../model/settingsOwnershipPolicy";
import { openSystemSubscriptionManagement } from "../model/settingsSubscriptionActions";
import { settingsScreenAssets } from "../assets";
import {
  ChoiceRow,
  DangerZoneCard,
  ExpandableChoiceRow,
  LiveActivitiesSettingsCard,
  NotificationsSettingsCard,
  SecuritySettingsCard,
  SettingsSection,
  SubscriptionManagementCard,
} from "./SettingsScreenParts";
import { styles } from "./settingsScreenStyles";

type SettingsScreenProps = {
  visible: boolean;
  onBack: () => void;
  onSessionDeleted: () => Promise<void>;
  session: MobileAuthSession | null;
  onUpdatePreferredLanguage: (locale: MobileLocale) => Promise<void>;
};

const defaultPushPreferences: MobilePushPreferences = {
  childrenEnabled: true,
  beforeReminderMinutes: 10,
  pillboxEnabled: true,
  pillboxBeforeReminderMinutes: 10,
  cabinetNotify10Days: false,
  cabinetNotify7Days: true,
  cabinetNotify3Days: false,
  liveActivitySleepEnabled: false,
  liveActivityFeedingEnabled: false,
  liveActivityIllnessEnabled: false,
};

const defaultFamilySummary: MobileFamilySettingsSummary = {
  id: "",
  name: "",
  ownerAccountId: null,
  planCode: "free",
  subscriptionStatus: "inactive",
  subscriptionExpiresAt: null,
  premiumActive: false,
};

const defaultFamilyAccess: MobileFamilyAccessSummary = {
  planCode: "free",
  subscriptionStatus: "inactive",
  premiumActive: false,
  canManageSubscription: false,
  canUseLiveActivities: false,
  currentChildrenCount: 0,
  currentAdultsCount: 0,
  currentPillboxPlanCount: 0,
};

const defaultPushConfig: MobilePushConfig = {
  enabled: true,
};

const settingsModuleIcons = {
  language: settingsScreenAssets.language,
  notifications: settingsScreenAssets.notifications,
  children: require("../../../shared/assets/bottom-tabs/parent_child_transparent.png"),
  pillbox: require("../../../shared/assets/bottom-tabs/pillpath_icon_transparent.png"),
  cabinet: require("../../../shared/assets/bottom-tabs/medical_bag_icon_transparent_FIXED.png"),
} as const;

const settingsModuleAccentColors = {
  master: "#5B7FD7",
  children: "#F47667",
  pillbox: "#8C7AE6",
  cabinet: "#E59A63",
} as const;

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyPasswordForm: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function formatSubscriptionExpiresAt(
  locale: MobileLocale,
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function SettingsScreen({
  visible,
  onBack,
  onSessionDeleted,
  session,
  onUpdatePreferredLanguage,
}: SettingsScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildSettingsScreenContent(locale);
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const manageSubscriptionPendingRef = useRef(false);
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });

  const [pushPreferences, setPushPreferences] =
    useState<MobilePushPreferences>(defaultPushPreferences);
  const [pushConfig, setPushConfig] =
    useState<MobilePushConfig>(defaultPushConfig);
  const [familySummary, setFamilySummary] =
    useState<MobileFamilySettingsSummary>(defaultFamilySummary);
  const [familyAccess, setFamilyAccess] =
    useState<MobileFamilyAccessSummary>(defaultFamilyAccess);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [isSavingPush, setIsSavingPush] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingRecoveryCode, setIsSavingRecoveryCode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [recoveryCodeExpanded, setRecoveryCodeExpanded] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [subscriptionExpanded, setSubscriptionExpanded] = useState(false);
  const [passwordForm, setPasswordForm] =
    useState<PasswordFormState>(emptyPasswordForm);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [hasRecoveryCode, setHasRecoveryCode] = useState(
    Boolean(session?.account.hasRecoveryCode),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const scrollSettingsToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });
  };

  useEffect(() => {
    setHasRecoveryCode(Boolean(session?.account.hasRecoveryCode));
  }, [session?.account.hasRecoveryCode]);

  useEffect(() => {
    if (passwordExpanded) {
      scrollSettingsToBottom();
    }
  }, [passwordExpanded]);

  useEffect(() => {
    if (!visible || !session) {
      return;
    }

    const activeSession = session;
    let cancelled = false;

    async function loadSettings() {
      setIsLoading(true);
      setError(null);

      try {
        const [nextPushPreferences, nextPushConfig, nextFamilySummary, nextFamilyAccess] =
          await Promise.all([
            fetchPushPreferences({ accessToken: activeSession.accessToken }),
            fetchPushConfig({ accessToken: activeSession.accessToken }),
            fetchMyFamilySettingsSummary({ accessToken: activeSession.accessToken }),
            fetchMyFamilyAccessSummary({ accessToken: activeSession.accessToken }),
          ]);

        if (cancelled) {
          return;
        }

        setPushPreferences(nextPushPreferences);
        setPushConfig(nextPushConfig);
        setFamilySummary(nextFamilySummary);
        setFamilyAccess(nextFamilyAccess);
      } catch {
        if (!cancelled) {
          setError(content.saveErrorLabel);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [content.saveErrorLabel, session, visible]);

  const ownershipPolicy = resolveSettingsOwnershipPolicy({
    content,
    session,
    familySummary,
    familyAccess,
  });
  const pushMasterEnabled =
    pushPreferences.childrenEnabled ||
    pushPreferences.pillboxEnabled ||
    pushPreferences.cabinetNotify10Days ||
    pushPreferences.cabinetNotify7Days ||
    pushPreferences.cabinetNotify3Days;

  const selectedCabinetDays = useMemo(() => {
    if (pushPreferences.cabinetNotify10Days) {
      return 10;
    }

    if (pushPreferences.cabinetNotify7Days) {
      return 7;
    }

    return 3;
  }, [
    pushPreferences.cabinetNotify10Days,
    pushPreferences.cabinetNotify3Days,
    pushPreferences.cabinetNotify7Days,
  ]);

  const resetTransientMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleLanguageSelect = async (nextLocale: MobileLocale) => {
    if (isSavingLanguage || nextLocale === session?.account.preferredLanguage) {
      return;
    }

    setIsSavingLanguage(true);
    resetTransientMessages();

    try {
      await onUpdatePreferredLanguage(nextLocale);
      setLanguageExpanded(false);
    } catch {
      setError(content.saveErrorLabel);
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const patchPushPreferences = async (
    patch: Partial<MobilePushPreferences>,
    optimistic?: MobilePushPreferences,
  ) => {
    if (!session || isSavingPush) {
      return;
    }

    const previous = pushPreferences;
    const nextOptimistic = optimistic ?? {
      ...pushPreferences,
      ...patch,
    };

    setPushPreferences(nextOptimistic);
    setIsSavingPush(true);
    resetTransientMessages();

    try {
      const nextPreferences = await updatePushPreferences({
        accessToken: session.accessToken,
        childrenEnabled: patch.childrenEnabled,
        beforeReminderMinutes: patch.beforeReminderMinutes,
        pillboxEnabled: patch.pillboxEnabled,
        pillboxBeforeReminderMinutes: patch.pillboxBeforeReminderMinutes,
        cabinetNotify10Days: patch.cabinetNotify10Days,
        cabinetNotify7Days: patch.cabinetNotify7Days,
        cabinetNotify3Days: patch.cabinetNotify3Days,
        liveActivitySleepEnabled: patch.liveActivitySleepEnabled,
        liveActivityFeedingEnabled: patch.liveActivityFeedingEnabled,
        liveActivityIllnessEnabled: patch.liveActivityIllnessEnabled,
      });

      setPushPreferences(nextPreferences);
    } catch {
      setPushPreferences(previous);
      setError(content.saveErrorLabel);
    } finally {
      setIsSavingPush(false);
    }
  };

  const handleMasterPushToggle = async (enabled: boolean) => {
    const optimistic = {
      ...pushPreferences,
      childrenEnabled: enabled,
      pillboxEnabled: enabled,
      cabinetNotify10Days: false,
      cabinetNotify7Days: enabled,
      cabinetNotify3Days: false,
    };

    await patchPushPreferences(
      {
        childrenEnabled: enabled,
        pillboxEnabled: enabled,
        cabinetNotify10Days: optimistic.cabinetNotify10Days,
        cabinetNotify7Days: optimistic.cabinetNotify7Days,
        cabinetNotify3Days: optimistic.cabinetNotify3Days,
      },
      optimistic,
    );
  };

  const handleCabinetReminderDaysSelect = async (days: 10 | 7 | 3) => {
    await patchPushPreferences({
      cabinetNotify10Days: days === 10,
      cabinetNotify7Days: days === 7,
      cabinetNotify3Days: days === 3,
    });
  };

  const handleSavePassword = async () => {
    if (!session || isSavingPassword) {
      return;
    }

    if (!passwordForm.currentPassword.trim()) {
      setError(content.passwordRequired);
      return;
    }

    if (!passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
      setError(content.passwordRequired);
      return;
    }

    if (passwordForm.newPassword.trim().length < 8) {
      setError(content.passwordTooShort);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(content.passwordsMismatch);
      return;
    }

    setIsSavingPassword(true);
    resetTransientMessages();

    try {
      await changePassword({
        accessToken: session.accessToken,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(emptyPasswordForm);
      setPasswordExpanded(false);
      setSuccess(content.passwordUpdatedLabel);
    } catch {
      setError(content.saveErrorLabel);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveRecoveryCode = async () => {
    if (!session || isSavingRecoveryCode) {
      return;
    }

    if (recoveryCode.trim().length < 8) {
      setError(content.recoveryCodeTooShort);
      return;
    }

    setIsSavingRecoveryCode(true);
    resetTransientMessages();

    try {
      await updateRecoveryCode({
        accessToken: session.accessToken,
        recoveryCode: recoveryCode.trim(),
      });
      setRecoveryCode("");
      setRecoveryCodeExpanded(false);
      setHasRecoveryCode(true);
      setSuccess(content.recoveryCodeUpdatedLabel);
    } catch {
      setError(content.saveErrorLabel);
    } finally {
      setIsSavingRecoveryCode(false);
    }
  };

  const confirmDelete = () => {
    if (!session || isDeleting) {
      return;
    }

    if (ownershipPolicy.deletionBlocked) {
      Alert.alert(
        ownershipPolicy.blockedDeleteTitle,
        ownershipPolicy.blockedDeleteMessage,
        [
          {
            text: content.cancelActionLabel,
            style: "cancel",
          },
        ],
      );
      return;
    }

    Alert.alert(ownershipPolicy.confirmDeleteTitle, ownershipPolicy.confirmDeleteMessage, [
      {
        text: content.cancelActionLabel,
        style: "cancel",
      },
      {
        text: content.confirmDeleteAction,
        style: "destructive",
        onPress: () => {
          void handleDelete();
        },
      },
    ]);
  };

  const handleDelete = async () => {
    if (!session) {
      return;
    }

    setIsDeleting(true);
    resetTransientMessages();

    try {
      if (ownershipPolicy.usesFamilyDeleteEndpoint) {
        await deleteMyFamily({ accessToken: session.accessToken });
      } else {
        await deleteMyAccount({ accessToken: session.accessToken });
      }

      await onSessionDeleted();
    } catch {
      setError(content.saveErrorLabel);
      setIsDeleting(false);
    }
  };

  const subscriptionPlanLabel = mapSubscriptionPlanLabel(content, familyAccess.planCode);
  const subscriptionStatusLabel = mapSubscriptionStatusLabel(
    content,
    familyAccess.subscriptionStatus,
  );
  const subscriptionExpiresAtLabel = formatSubscriptionExpiresAt(
    locale,
    familySummary.subscriptionExpiresAt,
  );
  const familyMembersCount = String(
    familyAccess.currentAdultsCount + familyAccess.currentChildrenCount,
  );
  const handleManageSubscription = async () => {
    if (manageSubscriptionPendingRef.current) {
      return;
    }

    manageSubscriptionPendingRef.current = true;
    try {
      await openSystemSubscriptionManagement();
    } catch {
      setError(content.saveErrorLabel);
    } finally {
      setTimeout(() => {
        manageSubscriptionPendingRef.current = false;
      }, 900);
    }
  };

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.overlayLayer,
        visible ? styles.overlayLayerVisible : styles.overlayLayerHidden,
        { transform: [{ translateX }] },
      ]}
    >
      <ImageBackground
        source={childrenScreenAssets.background}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View
          style={[
            styles.overlay,
            { backgroundColor: surfaceTheme.backgroundOverlaySoftColor },
          ]}
        />
        <View style={styles.root}>
          <View
            style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
            {...panHandlers}
          />
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topBar}>
              <Pressable onPress={onBack} style={styles.backLink}>
                <Text
                  style={[styles.backLinkText, { color: surfaceTheme.textSecondaryColor }]}
                >
                  {"← "}
                  {content.backLabel}
                </Text>
              </Pressable>
            </View>

            <View style={styles.introBlock}>
              <Text style={[styles.title, { color: surfaceTheme.textPrimaryColor }]}>
                {content.title}
              </Text>
              <Text style={[styles.subtitle, { color: surfaceTheme.textSecondaryColor }]}>
                {content.subtitle}
              </Text>
            </View>

            {error ? (
              <Text style={styles.errorNote}>{error}</Text>
            ) : null}
            {success ? (
              <Text style={styles.successNote}>{success}</Text>
            ) : null}
            {isLoading ? (
              <Text style={[styles.loadingNote, { color: surfaceTheme.textMutedColor }]}>
                {content.loadingLabel}
              </Text>
            ) : null}

            <SettingsSection
              title={content.appSectionTitle}
              hint={content.appSectionHint}
              textPrimaryColor={surfaceTheme.textPrimaryColor}
              textSecondaryColor={surfaceTheme.textSecondaryColor}
            >
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: surfaceTheme.cardBackgroundColor,
                    borderColor: surfaceTheme.cardBorderColor,
                  },
                ]}
              >
                <ExpandableChoiceRow
                  icon={
                    <Image
                      source={settingsModuleIcons.language}
                      style={styles.moduleRowIconImage}
                      resizeMode="contain"
                    />
                  }
                  iconStyle={styles.rowLeadPlain}
                  title={content.languageTitle}
                  hint={content.languageHint}
                  choices={content.languageChoices}
                  selectedKey={session?.account.preferredLanguage ?? locale}
                  expanded={languageExpanded}
                  onToggle={() => {
                    setLanguageExpanded((current) => !current);
                    resetTransientMessages();
                  }}
                  onSelect={(value) => {
                    void handleLanguageSelect(value as MobileLocale);
                  }}
                  disabled={isSavingLanguage}
                />
              </View>
            </SettingsSection>

            <SettingsSection
              title={content.notificationsSectionTitle}
              hint={content.notificationsSectionHint}
              textPrimaryColor={surfaceTheme.textPrimaryColor}
              textSecondaryColor={surfaceTheme.textSecondaryColor}
            >
              <NotificationsSettingsCard
                pushConfigEnabled={pushConfig.enabled}
                notificationsUnavailableHint={content.notificationsUnavailableHint}
                pushMasterIcon={settingsModuleIcons.notifications}
                pushMasterTitle={content.pushMasterTitle}
                pushMasterHint={content.pushMasterHint}
                pushMasterEnabled={pushMasterEnabled}
                isSavingPush={isSavingPush}
                onToggleMasterPush={(value) => {
                  void handleMasterPushToggle(value);
                }}
                childrenIcon={settingsModuleIcons.children}
                childrenTitle={content.childrenPushTitle}
                childrenHint={content.childrenPushHint}
                childrenEnabled={pushPreferences.childrenEnabled}
                onToggleChildren={(value) => {
                  void patchPushPreferences({ childrenEnabled: value });
                }}
                leadTimeTitle={content.leadTimeTitle}
                leadTimeHint={content.leadTimeHint}
                reminderChoices={content.reminderChoices}
                beforeReminderMinutes={pushPreferences.beforeReminderMinutes}
                onSelectBeforeReminderMinutes={(value) => {
                  void patchPushPreferences({ beforeReminderMinutes: Number(value) });
                }}
                pillboxIcon={settingsModuleIcons.pillbox}
                pillboxTitle={content.pillboxPushTitle}
                pillboxHint={content.pillboxPushHint}
                pillboxEnabled={pushPreferences.pillboxEnabled}
                onTogglePillbox={(value) => {
                  void patchPushPreferences({ pillboxEnabled: value });
                }}
                pillboxLeadTimeTitle={content.pillboxLeadTimeTitle}
                pillboxLeadTimeHint={content.pillboxLeadTimeHint}
                pillboxBeforeReminderMinutes={pushPreferences.pillboxBeforeReminderMinutes}
                onSelectPillboxBeforeReminderMinutes={(value) => {
                  void patchPushPreferences({
                    pillboxBeforeReminderMinutes: Number(value),
                  });
                }}
                cabinetIcon={settingsModuleIcons.cabinet}
                cabinetTitle={content.cabinetPushTitle}
                cabinetHint={content.cabinetPushHint}
                cabinetEnabled={
                  pushPreferences.cabinetNotify10Days ||
                  pushPreferences.cabinetNotify7Days ||
                  pushPreferences.cabinetNotify3Days
                }
                onToggleCabinet={(value) => {
                  if (!value) {
                    void patchPushPreferences({
                      cabinetNotify10Days: false,
                      cabinetNotify7Days: false,
                      cabinetNotify3Days: false,
                    });
                    return;
                  }

                  void handleCabinetReminderDaysSelect(selectedCabinetDays);
                }}
                cabinetLeadTimeTitle={content.cabinetLeadTimeTitle}
                cabinetLeadTimeHint={content.cabinetLeadTimeHint}
                cabinetReminderChoices={content.cabinetReminderChoices}
                selectedCabinetDays={selectedCabinetDays}
                onSelectCabinetReminderDays={(value) => {
                  void handleCabinetReminderDaysSelect(value as 10 | 7 | 3);
                }}
                childrenAccentColor={settingsModuleAccentColors.children}
                pillboxAccentColor={settingsModuleAccentColors.pillbox}
                cabinetAccentColor={settingsModuleAccentColors.cabinet}
                masterAccentColor={settingsModuleAccentColors.master}
              />
            </SettingsSection>

            <SettingsSection
              title={content.liveActivitiesSectionTitle}
              hint={content.liveActivitiesSectionHint}
              textPrimaryColor={surfaceTheme.textPrimaryColor}
              textSecondaryColor={surfaceTheme.textSecondaryColor}
            >
              <LiveActivitiesSettingsCard
                unavailableHint={content.liveActivitiesUnavailableHint}
                showUnavailableHint={!familyAccess.canUseLiveActivities}
                sleepTitle={content.liveSleepTitle}
                sleepHint={content.liveSleepHint}
                sleepEnabled={pushPreferences.liveActivitySleepEnabled}
                feedingTitle={content.liveFeedingTitle}
                feedingHint={content.liveFeedingHint}
                feedingEnabled={pushPreferences.liveActivityFeedingEnabled}
                illnessTitle={content.liveIllnessTitle}
                illnessHint={content.liveIllnessHint}
                illnessEnabled={pushPreferences.liveActivityIllnessEnabled}
                disabled={isSavingPush}
                onToggleSleep={(value) => {
                  void patchPushPreferences({ liveActivitySleepEnabled: value });
                }}
                onToggleFeeding={(value) => {
                  void patchPushPreferences({ liveActivityFeedingEnabled: value });
                }}
                onToggleIllness={(value) => {
                  void patchPushPreferences({ liveActivityIllnessEnabled: value });
                }}
              />
            </SettingsSection>

            {ownershipPolicy.showSubscriptionManagement ? (
              <SettingsSection
                title={content.subscriptionSectionTitle}
                hint={content.subscriptionOwnerHint}
                textPrimaryColor={surfaceTheme.textPrimaryColor}
                textSecondaryColor={surfaceTheme.textSecondaryColor}
              >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: surfaceTheme.cardBackgroundColor,
                      borderColor: surfaceTheme.cardBorderColor,
                    },
                  ]}
                >
                  <SubscriptionManagementCard
                    title={content.subscriptionManageLabel}
                    statusHint={subscriptionStatusLabel}
                    statusLabel={content.subscriptionStatusLabel}
                    planLabel={content.subscriptionPlanLabel}
                    planValue={subscriptionPlanLabel}
                    membersLabel={content.subscriptionMembersLabel}
                    membersValue={familyMembersCount}
                    accessUntilLabel={content.subscriptionAccessUntilLabel}
                    accessUntilValue={subscriptionExpiresAtLabel ?? "—"}
                    expanded={subscriptionExpanded}
                    onToggle={() => {
                      setSubscriptionExpanded((current) => !current);
                      resetTransientMessages();
                    }}
                    actionLabel={content.subscriptionManageLabel}
                    onManageSubscription={() => {
                      void handleManageSubscription();
                    }}
                  />
                </View>
              </SettingsSection>
            ) : null}

            <SettingsSection
              title={content.securitySectionTitle}
              hint={content.securitySectionHint}
              textPrimaryColor={surfaceTheme.textPrimaryColor}
              textSecondaryColor={surfaceTheme.textSecondaryColor}
            >
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: surfaceTheme.cardBackgroundColor,
                    borderColor: surfaceTheme.cardBorderColor,
                  },
                ]}
              >
                <SecuritySettingsCard
                  passwordTitle={content.passwordTitle}
                  passwordHint={content.passwordHint}
                  passwordExpanded={passwordExpanded}
                  onTogglePassword={() => {
                    setPasswordExpanded((current) => !current);
                    setRecoveryCodeExpanded(false);
                    resetTransientMessages();
                  }}
                  currentPasswordLabel={content.currentPasswordLabel}
                  newPasswordLabel={content.newPasswordLabel}
                  confirmPasswordLabel={content.confirmPasswordLabel}
                  passwordForm={passwordForm}
                  onChangePasswordField={(field, value) => {
                    setPasswordForm((current) => ({
                      ...current,
                      [field]: value,
                    }));
                    resetTransientMessages();
                  }}
                  onPasswordFieldFocus={scrollSettingsToBottom}
                  onSavePassword={() => {
                    void handleSavePassword();
                  }}
                  savePasswordLabel={content.savePasswordLabel}
                  recoveryCodeTitle={content.recoveryCodeTitle}
                  recoveryCodeHint={content.recoveryCodeHint}
                  recoveryCodeConfiguredHint={content.recoveryCodeConfiguredHint}
                  hasRecoveryCode={hasRecoveryCode}
                  recoveryCodeExpanded={recoveryCodeExpanded}
                  onToggleRecoveryCode={() => {
                    if (hasRecoveryCode) {
                      return;
                    }
                    setRecoveryCodeExpanded((current) => !current);
                    setPasswordExpanded(false);
                    resetTransientMessages();
                  }}
                  recoveryCode={recoveryCode}
                  recoveryCodeLabel={content.recoveryCodeLabel}
                  onChangeRecoveryCode={(value) => {
                    setRecoveryCode(value);
                    resetTransientMessages();
                  }}
                  onSaveRecoveryCode={() => {
                    void handleSaveRecoveryCode();
                  }}
                  saveRecoveryCodeLabel={content.saveRecoveryCodeLabel}
                />
              </View>
            </SettingsSection>

            <SettingsSection
              title={content.dangerSectionTitle}
              hint={content.dangerSectionHint}
              textPrimaryColor={surfaceTheme.textPrimaryColor}
              textSecondaryColor={surfaceTheme.textSecondaryColor}
            >
              <DangerZoneCard
                deleteLabel={ownershipPolicy.deleteLabel}
                deleteHint={ownershipPolicy.deleteHint}
                isDeleting={isDeleting}
                onPressDelete={confirmDelete}
              />
            </SettingsSection>
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

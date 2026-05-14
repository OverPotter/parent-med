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
import { mobileTabAssets } from "../../../shared/assets/mobileTabAssets";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  type MobileFamilyAccessSummary,
  type MobileFamilySettingsSummary,
  type MobilePushConfig,
  type MobilePushPreferences,
  updatePushPreferences,
} from "../api/settingsApi";
import {
  executeSettingsDeletion,
  patchSettingsPushPreferences,
  saveMedicationIntervalUnitPreference,
  saveSettingsPreferredLanguage,
  saveSettingsPassword,
  saveSettingsRecoveryCode,
} from "../model/settingsScreenActions";
import {
  buildSettingsScreenContent,
  mapSubscriptionPlanLabel,
  mapSubscriptionStatusLabel,
} from "../model/settingsScreen";
import {
  buildCabinetReminderPatch,
  buildOptimisticMasterPushPreferences,
  getCachedSettingsBundle,
  getPasswordInlineHint,
  loadSettingsBundle,
  patchCachedSettingsBundle,
  validatePasswordForm,
} from "../model/settingsScreenLogic";
import {
  defaultFamilyAccess,
  defaultFamilySummary,
  defaultPushConfig,
  defaultPushPreferences,
  emptyPasswordForm,
  formatSubscriptionExpiresAt,
  getSelectedCabinetDays,
  isPushMasterEnabled,
  resolvePasswordSaveError,
  type PasswordFormState,
} from "../model/settingsScreenHelpers";
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
import type { MedicationIntervalUnit } from "../session/mobileSettingsPreferencesStorage";
import { useStoredMedicationIntervalUnit } from "../session/useStoredMedicationIntervalUnit";

type SettingsScreenProps = {
  visible: boolean;
  onBack: () => void;
  onSessionDeleted: () => Promise<void>;
  session: MobileAuthSession | null;
  onUpdatePreferredLanguage: (locale: MobileLocale) => Promise<void>;
  onPushPreferencesChanged?: (preferences: MobilePushPreferences) => void;
  onFamilyAccessChanged?: (familyAccess: MobileFamilyAccessSummary) => void;
};

const settingsModuleIcons = {
  language: settingsScreenAssets.language,
  notifications: settingsScreenAssets.notifications,
  children: mobileTabAssets.children,
  pillbox: mobileTabAssets.pillbox,
  cabinet: mobileTabAssets.cabinet,
  medicationPlans: settingsScreenAssets.medicationInterval,
} as const;

const settingsModuleAccentColors = {
  children: "#F47667",
  pillbox: "#8C7AE6",
  cabinet: "#E59A63",
} as const;

export function SettingsScreen({
  visible,
  onBack,
  onSessionDeleted,
  session,
  onUpdatePreferredLanguage,
  onPushPreferencesChanged,
  onFamilyAccessChanged,
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

  const [pushPreferences, setPushPreferences] = useState<MobilePushPreferences>(
    defaultPushPreferences,
  );
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
  const [medicationIntervalExpanded, setMedicationIntervalExpanded] =
    useState(false);
  const { medicationIntervalUnit, setMedicationIntervalUnit } =
    useStoredMedicationIntervalUnit();
  const [passwordForm, setPasswordForm] =
    useState<PasswordFormState>(emptyPasswordForm);
  const [passwordSubmitError, setPasswordSubmitError] = useState<string | null>(
    null,
  );
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
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 260);
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
    const cachedBundle = getCachedSettingsBundle(activeSession.accessToken);
    let cancelled = false;

    if (cachedBundle) {
      setPushPreferences(cachedBundle.pushPreferences);
      setPushConfig(cachedBundle.pushConfig);
      setFamilySummary(cachedBundle.familySummary);
      setFamilyAccess(cachedBundle.familyAccess);
      setIsLoading(false);
    }

    async function loadSettings() {
      setIsLoading(!cachedBundle);
      setError(null);

      try {
        const {
          pushPreferences: nextPushPreferences,
          pushConfig: nextPushConfig,
          familySummary: nextFamilySummary,
          familyAccess: nextFamilyAccess,
        } = await loadSettingsBundle(activeSession);

        if (cancelled) {
          return;
        }

        setPushPreferences(nextPushPreferences);
        setPushConfig(nextPushConfig);
        setFamilySummary(nextFamilySummary);
        setFamilyAccess(nextFamilyAccess);
        onPushPreferencesChanged?.(nextPushPreferences);
        onFamilyAccessChanged?.(nextFamilyAccess);
      } catch {
        if (!cancelled && !cachedBundle) {
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
  }, [
    content.saveErrorLabel,
    onFamilyAccessChanged,
    onPushPreferencesChanged,
    session,
    visible,
  ]);

  const ownershipPolicy = resolveSettingsOwnershipPolicy({
    content,
    session,
    familySummary,
    familyAccess,
  });
  const pushMasterEnabled = isPushMasterEnabled(pushPreferences);

  const selectedCabinetDays = useMemo(
    () => getSelectedCabinetDays(pushPreferences),
    [
      pushPreferences.cabinetNotify10Days,
      pushPreferences.cabinetNotify3Days,
      pushPreferences.cabinetNotify7Days,
    ],
  );

  const resetTransientMessages = () => {
    setError(null);
    setSuccess(null);
    setPasswordSubmitError(null);
  };

  const passwordInlineHint = getPasswordInlineHint(
    passwordForm,
    content.passwordsMismatch,
    passwordSubmitError,
  );

  const handleLanguageSelect = async (nextLocale: MobileLocale) => {
    const result = await saveSettingsPreferredLanguage({
      isSavingLanguage,
      nextLocale,
      currentLocale: session?.account.preferredLanguage,
      onUpdatePreferredLanguage,
      saveErrorLabel: content.saveErrorLabel,
    });

    if (result.blocked) {
      return;
    }

    setIsSavingLanguage(true);
    resetTransientMessages();

    if (result.success) {
      setLanguageExpanded(false);
      setIsSavingLanguage(false);
      return;
    }

    setError(result.submitError ?? content.saveErrorLabel);
    setIsSavingLanguage(false);
  };

  const handleMedicationIntervalUnitSelect = async (
    nextUnit: MedicationIntervalUnit,
  ) => {
    const result = await saveMedicationIntervalUnitPreference({
      nextUnit,
      currentUnit: medicationIntervalUnit,
      saveErrorLabel: content.saveErrorLabel,
    });

    if (result.blocked) {
      setMedicationIntervalExpanded(false);
      return;
    }

    setMedicationIntervalUnit(nextUnit);
    setMedicationIntervalExpanded(false);
    resetTransientMessages();

    if (result.submitError) {
      setError(result.submitError);
    }
  };

  const patchPushPreferences = async (
    patch: Partial<MobilePushPreferences>,
    optimistic?: MobilePushPreferences,
  ) => {
    const previous = pushPreferences;
    const nextOptimistic = optimistic ?? {
      ...pushPreferences,
      ...patch,
    };

    const result = await patchSettingsPushPreferences({
      session,
      isSavingPush,
      patch,
      previous,
      optimistic: nextOptimistic,
      saveErrorLabel: content.saveErrorLabel,
    });

    if (result.blocked) {
      return;
    }

    setPushPreferences(nextOptimistic);
    setIsSavingPush(true);
    resetTransientMessages();

    if (result.nextPreferences) {
      setPushPreferences(result.nextPreferences);
      patchCachedSettingsBundle(session?.accessToken ?? null, {
        pushPreferences: result.nextPreferences,
      });
      onPushPreferencesChanged?.(result.nextPreferences);
      setIsSavingPush(false);
      return;
    }

    setPushPreferences(result.revertPreferences ?? previous);
    setError(result.submitError ?? content.saveErrorLabel);
    setIsSavingPush(false);
  };

  const handleMasterPushToggle = async (enabled: boolean) => {
    const optimistic = buildOptimisticMasterPushPreferences(
      pushPreferences,
      enabled,
    );

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
    await patchPushPreferences(buildCabinetReminderPatch(days));
  };

  const handleSavePassword = async () => {
    const result = await saveSettingsPassword({
      session,
      isSavingPassword,
      passwordForm,
      locale,
      content,
    });

    if (result.blocked) {
      return;
    }

    if (result.validationError) {
      setError(result.validationError);
      return;
    }

    setIsSavingPassword(true);
    resetTransientMessages();

    if (result.nextPasswordForm) {
      setPasswordForm(result.nextPasswordForm);
      setPasswordExpanded(false);
      setSuccess(result.successMessage ?? null);
      setIsSavingPassword(false);
      return;
    }

    setPasswordSubmitError(result.submitError ?? content.saveErrorLabel);
    setIsSavingPassword(false);
  };

  const handleSaveRecoveryCode = async () => {
    const result = await saveSettingsRecoveryCode({
      session,
      isSavingRecoveryCode,
      recoveryCode,
      content,
    });

    if (result.blocked) {
      return;
    }

    if (result.validationError) {
      setError(result.validationError);
      return;
    }

    setIsSavingRecoveryCode(true);
    resetTransientMessages();

    if (typeof result.nextRecoveryCode === "string") {
      setRecoveryCode(result.nextRecoveryCode);
      setRecoveryCodeExpanded(false);
      setHasRecoveryCode(Boolean(result.hasRecoveryCode));
      setSuccess(result.successMessage ?? null);
      setIsSavingRecoveryCode(false);
      return;
    }

    setError(result.submitError ?? content.saveErrorLabel);
    setIsSavingRecoveryCode(false);
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

    Alert.alert(
      ownershipPolicy.confirmDeleteTitle,
      ownershipPolicy.confirmDeleteMessage,
      [
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
      ],
    );
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    resetTransientMessages();

    try {
      await executeSettingsDeletion({
        session,
        usesFamilyDeleteEndpoint: ownershipPolicy.usesFamilyDeleteEndpoint,
      });
      await onSessionDeleted();
    } catch {
      setError(content.saveErrorLabel);
      setIsDeleting(false);
    }
  };

  const subscriptionPlanLabel = mapSubscriptionPlanLabel(
    content,
    familyAccess.planCode,
  );
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
                  style={[
                    styles.backLinkText,
                    { color: surfaceTheme.textSecondaryColor },
                  ]}
                >
                  {"← "}
                  {content.backLabel}
                </Text>
              </Pressable>
            </View>

            <View style={styles.introBlock}>
              <Text
                style={[styles.title, { color: surfaceTheme.textPrimaryColor }]}
              >
                {content.title}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: surfaceTheme.textSecondaryColor },
                ]}
              >
                {content.subtitle}
              </Text>
            </View>

            {error ? <Text style={styles.errorNote}>{error}</Text> : null}
            {success ? <Text style={styles.successNote}>{success}</Text> : null}
            {isLoading ? (
              <Text
                style={[
                  styles.loadingNote,
                  { color: surfaceTheme.textMutedColor },
                ]}
              >
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
                <View style={styles.rowDivider} />
                <ExpandableChoiceRow
                  icon={
                    <Image
                      source={settingsModuleIcons.medicationPlans}
                      style={[
                        styles.moduleRowIconImage,
                        styles.moduleRowIconImageLarge,
                      ]}
                      resizeMode="contain"
                    />
                  }
                  iconStyle={[styles.rowLeadPlain, styles.rowLeadPlainLarge]}
                  title={content.medicationPlansTitle}
                  hint={content.medicationPlansHint}
                  choices={content.medicationIntervalChoices}
                  selectedKey={medicationIntervalUnit}
                  expanded={medicationIntervalExpanded}
                  onToggle={() => {
                    setMedicationIntervalExpanded((current) => !current);
                    resetTransientMessages();
                  }}
                  onSelect={(value) => {
                    void handleMedicationIntervalUnitSelect(
                      value as MedicationIntervalUnit,
                    );
                  }}
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
                notificationsUnavailableHint={
                  content.notificationsUnavailableHint
                }
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
                  void patchPushPreferences({
                    beforeReminderMinutes: Number(value),
                  });
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
                pillboxBeforeReminderMinutes={
                  pushPreferences.pillboxBeforeReminderMinutes
                }
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
                  void patchPushPreferences({
                    liveActivitySleepEnabled: value,
                  });
                }}
                onToggleFeeding={(value) => {
                  void patchPushPreferences({
                    liveActivityFeedingEnabled: value,
                  });
                }}
                onToggleIllness={(value) => {
                  void patchPushPreferences({
                    liveActivityIllnessEnabled: value,
                  });
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
                  passwordInlineHint={passwordInlineHint}
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
                  recoveryCodeConfiguredHint={
                    content.recoveryCodeConfiguredHint
                  }
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

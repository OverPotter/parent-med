import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { mobileTabAssets } from "../../../shared/assets/mobileTabAssets";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  buildSettingsScreenContent,
  mapSubscriptionPlanLabel,
  mapSubscriptionStatusLabel,
} from "../model/settingsScreen";
import {
  type MobileFamilyAccessSummary,
  type MobilePushPreferences,
} from "../api/settingsApi";
import type { SettingsBundle } from "../model/settingsScreenLogic";
import { SubscriptionPaywallSheet } from "../../subscription/screens/SubscriptionPaywallSheet";
import { settingsScreenAssets } from "../assets";
import {
  DangerZoneCard,
  ExpandableChoiceRow,
  LiveActivitiesSettingsCard,
  NotificationsSettingsCard,
  SecuritySettingsCard,
  SettingsSection,
  SettingsRevenueCatDebugCard,
  SubscriptionManagementCard,
} from "./SettingsScreenParts";
import { styles } from "./settingsScreenStyles";
import type { MedicationIntervalUnit } from "../session/mobileSettingsPreferencesStorage";
import { useStoredMedicationIntervalUnit } from "../session/useStoredMedicationIntervalUnit";
import { useSettingsScreenController } from "../model/useSettingsScreenController";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";

type SettingsScreenProps = {
  visible: boolean;
  onBack: () => void;
  onSessionDeleted: () => Promise<void>;
  session: MobileAuthSession | null;
  onUpdatePreferredLanguage: (locale: MobileLocale) => Promise<void>;
  onPushPreferencesChanged?: (preferences: MobilePushPreferences) => void;
  onFamilyAccessChanged?: (familyAccess: MobileFamilyAccessSummary) => void;
  onSettingsBundleChanged?: (bundle: SettingsBundle) => void;
  onOpenTermsOfUse?: () => void;
  onOpenPrivacyPolicy?: () => void;
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

function DeleteConfirmSheet({
  cancelLabel,
  confirmLabel,
  isDeleting,
  message,
  onCancel,
  onConfirm,
  title,
  visible,
}: {
  cancelLabel: string;
  confirmLabel: string;
  isDeleting: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <FormBottomSheet
      visible={visible}
      onClose={onCancel}
      sheetStyle={styles.deleteConfirmSheet}
      backdropStyle={styles.deleteConfirmBackdrop}
    >
      {({ panHandlers, requestClose }) => (
        <View>
          <View style={styles.sheetGrabberWrap} {...panHandlers}>
            <View style={styles.sheetGrabber} />
          </View>
          <View style={styles.deleteConfirmHeader}>
            <View style={styles.deleteConfirmIcon}>
              <Feather name="trash-2" size={22} color="#D55C56" />
            </View>
            <View style={styles.deleteConfirmCopy}>
              <Text style={styles.deleteConfirmTitle}>{title}</Text>
              <Text style={styles.deleteConfirmMessage}>{message}</Text>
            </View>
          </View>
          <View style={styles.deleteConfirmActions}>
            <Pressable
              onPress={() => requestClose()}
              disabled={isDeleting}
              style={({ pressed }) => [
                styles.deleteConfirmButton,
                styles.deleteConfirmCancelButton,
                pressed ? styles.deleteConfirmButtonPressed : null,
                isDeleting ? styles.deleteConfirmButtonDisabled : null,
              ]}
            >
              <Text style={styles.deleteConfirmCancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isDeleting}
              style={({ pressed }) => [
                styles.deleteConfirmButton,
                styles.deleteConfirmDeleteButton,
                pressed ? styles.deleteConfirmButtonPressed : null,
                isDeleting ? styles.deleteConfirmButtonDisabled : null,
              ]}
            >
              <Text style={styles.deleteConfirmDeleteText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </FormBottomSheet>
  );
}

export function SettingsScreen({
  visible,
  onBack,
  onSessionDeleted,
  session,
  onUpdatePreferredLanguage,
  onPushPreferencesChanged,
  onFamilyAccessChanged,
  onSettingsBundleChanged,
  onOpenTermsOfUse,
  onOpenPrivacyPolicy,
}: SettingsScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildSettingsScreenContent(locale);
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });
  const { medicationIntervalUnit, setMedicationIntervalUnit } =
    useStoredMedicationIntervalUnit();

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

  const {
    error,
    familyAccess,
    hasRecoveryCode,
    isDeleting,
    isLoading,
    isSavingPush,
    languageExpanded,
    medicationIntervalExpanded,
    notificationsPermissionHint,
    ownershipPolicy,
    passwordExpanded,
    passwordForm,
    passwordInlineHint,
    paywallVisible,
    pushConfig,
    pushMasterEnabled,
    pushPreferences,
    recoveryCode,
    recoveryCodeExpanded,
    selectedCabinetDays,
    subscriptionExpanded,
    subscriptionExpiresAtLabel,
    success,
    liveActivitiesLocked,
    confirmDelete,
    deleteConfirmVisible,
    handleDelete,
    handleCabinetReminderDaysSelect,
    handleLanguageSelect,
    handleManageSubscription,
    handleMasterPushToggle,
    handleMedicationIntervalUnitSelect,
    handleSavePassword,
    handleSaveRecoveryCode,
    handleSendTestPush,
    patchPushPreferences,
    refreshSettingsAfterBilling,
    resetTransientMessages,
    setError,
    setDeleteConfirmVisible,
    setLanguageExpanded,
    setMedicationIntervalExpanded,
    setPasswordExpanded,
    setPasswordForm,
    setPaywallVisible,
    setRecoveryCode,
    setRecoveryCodeExpanded,
    setSubscriptionExpanded,
  } = useSettingsScreenController({
    visible,
    session,
    locale,
    content,
    medicationIntervalUnit,
    setMedicationIntervalUnit,
    onSessionDeleted,
    onUpdatePreferredLanguage,
    onPushPreferencesChanged,
    onFamilyAccessChanged,
    onSettingsBundleChanged,
  });

  useEffect(() => {
    if (passwordExpanded) {
      scrollSettingsToBottom();
    }
  }, [passwordExpanded]);

  const subscriptionPlanLabel = mapSubscriptionPlanLabel(
    content,
    familyAccess.planCode,
  );
  const subscriptionStatusLabel = mapSubscriptionStatusLabel(
    content,
    familyAccess.subscriptionStatus,
  );
  const familyMembersCount = String(
    familyAccess.currentAdultsCount + familyAccess.currentChildrenCount,
  );

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
                  selectedKey={locale}
                  expanded={languageExpanded}
                  onToggle={() => {
                    setLanguageExpanded((current) => !current);
                    resetTransientMessages();
                  }}
                  onSelect={(value) => {
                    void handleLanguageSelect(value as MobileLocale);
                  }}
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
                notificationsPermissionHint={notificationsPermissionHint}
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
                showUnavailableHint={liveActivitiesLocked}
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
                onPressUnavailable={() => setPaywallVisible(true)}
                onToggleSleep={(value) => {
                  if (liveActivitiesLocked) {
                    setPaywallVisible(true);
                    return;
                  }
                  void patchPushPreferences({
                    liveActivitySleepEnabled: value,
                  });
                }}
                onToggleFeeding={(value) => {
                  if (liveActivitiesLocked) {
                    setPaywallVisible(true);
                    return;
                  }
                  void patchPushPreferences({
                    liveActivityFeedingEnabled: value,
                  });
                }}
                onToggleIllness={(value) => {
                  if (liveActivitiesLocked) {
                    setPaywallVisible(true);
                    return;
                  }
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

            {__DEV__ ? (
              <SettingsSection
                title={content.debugSectionTitle}
                hint={content.debugSectionHint}
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
                  <Pressable
                    onPress={() => {
                      void handleSendTestPush();
                    }}
                    style={({ pressed }) => [
                      styles.settingRow,
                      pressed ? styles.rowPressed : null,
                    ]}
                  >
                    <View style={styles.rowCopy}>
                      <Text
                        style={[
                          styles.rowTitle,
                          { color: surfaceTheme.textPrimaryColor },
                        ]}
                      >
                        {content.debugTestPushLabel}
                      </Text>
                      <Text
                        style={[
                          styles.rowHint,
                          { color: surfaceTheme.textSecondaryColor },
                        ]}
                      >
                        {content.debugTestPushHint}
                      </Text>
                    </View>
                  </Pressable>

                  <View style={styles.rowDivider} />

                  <Pressable
                    onPress={() => {
                      setPaywallVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.settingRow,
                      pressed ? styles.rowPressed : null,
                    ]}
                  >
                    <View style={styles.rowCopy}>
                      <Text
                        style={[
                          styles.rowTitle,
                          { color: surfaceTheme.textPrimaryColor },
                        ]}
                      >
                        {content.debugOpenPaywallLabel}
                      </Text>
                      <Text
                        style={[
                          styles.rowHint,
                          { color: surfaceTheme.textSecondaryColor },
                        ]}
                      >
                        {content.debugOpenPaywallHint}
                      </Text>
                    </View>
                  </Pressable>

                </View>

                <SettingsRevenueCatDebugCard
                  session={session}
                  copy={{
                    title: content.debugRevenueCatTitle,
                    hint: content.debugRevenueCatHint,
                    sandboxOnly: content.debugRevenueCatSandboxOnly,
                    openPaywall: content.debugOpenPaywallLabel,
                    configure: content.debugRevenueCatConfigureLabel,
                    offerings: content.debugRevenueCatOfferingsLabel,
                    buyMonthly: content.debugRevenueCatBuyMonthlyLabel,
                    buyAnnual: content.debugRevenueCatBuyAnnualLabel,
                    activateBackendPlus:
                      content.debugRevenueCatActivateBackendPlusLabel,
                    restore: content.debugRevenueCatRestoreLabel,
                    snapshot: content.debugRevenueCatSnapshotLabel,
                    resetToFree: content.debugRevenueCatResetToFreeLabel,
                    working: content.debugRevenueCatWorkingLabel,
                    ready: content.debugRevenueCatReadyLabel,
                    noResult: content.debugRevenueCatNoResultLabel,
                    apiKeyPresent: content.debugRevenueCatApiKeyPresentLabel,
                    apiKeyMissing: content.debugRevenueCatApiKeyMissingLabel,
                    entitlement: content.debugRevenueCatEntitlementLabel,
                    syncEnabled: content.debugRevenueCatSyncEnabledLabel,
                    syncDisabled: content.debugRevenueCatSyncDisabledLabel,
                    accountMissing: content.debugRevenueCatAccountMissingLabel,
                    packageMissing: content.debugRevenueCatPackageMissingLabel,
                  }}
                  textPrimaryColor={surfaceTheme.textPrimaryColor}
                  textSecondaryColor={surfaceTheme.textSecondaryColor}
                  cardBackgroundColor={surfaceTheme.cardBackgroundColor}
                  cardBorderColor={surfaceTheme.cardBorderColor}
                  onOpenPaywall={() => {
                    setPaywallVisible(true);
                  }}
                  onBillingChanged={refreshSettingsAfterBilling}
                />
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
      <SubscriptionPaywallSheet
        visible={visible && paywallVisible}
        session={session}
        onClose={() => setPaywallVisible(false)}
        onPurchased={refreshSettingsAfterBilling}
        onError={(message) => setError(message)}
        onOpenTermsOfUse={onOpenTermsOfUse}
        onOpenPrivacyPolicy={onOpenPrivacyPolicy}
      />
      <DeleteConfirmSheet
        visible={visible && deleteConfirmVisible}
        title={ownershipPolicy.confirmDeleteTitle}
        message={ownershipPolicy.confirmDeleteMessage}
        cancelLabel={content.cancelActionLabel}
        confirmLabel={content.confirmDeleteAction}
        isDeleting={isDeleting}
        onCancel={() => setDeleteConfirmVisible(false)}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </Animated.View>
  );
}

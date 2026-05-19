import { View } from "react-native";
import { AnalyticsBreakdownScreen } from "../features/analytics/screens/AnalyticsBreakdownScreen";
import { AnalyticsScreen } from "../features/analytics/screens/AnalyticsScreen";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import { ChildCreateScreen } from "../features/children/screens/ChildCreateScreen";
import { ChildProfileEditScreen } from "../features/child-profile-edit/screens/ChildProfileEditScreen";
import { ChildProfileRedesignScreen } from "../features/child-profile/screens/ChildProfileRedesignScreen";
import { FamilyScreen } from "../features/family/screens/FamilyScreen";
import { HelpScreen } from "../features/help/screens/HelpScreen";
import {
  getChildAvatarGenderByKey,
  getChildAvatarPresetSources,
  type ChildAvatarPresetKey,
  type ChildCard,
} from "../features/children/model/childrenRedesign";
import { ChildrenRedesignScreen } from "../features/children/screens/ChildrenRedesignScreen";
import { FeedingHistoryScreen } from "../features/feeding/screens/FeedingHistoryScreen";
import { GrowthHistoryScreen } from "../features/growth/screens/GrowthHistoryScreen";
import { illnessAssets } from "../features/illness/assets";
import { IllnessActionPlaceholderScreen } from "../features/illness/screens/IllnessActionPlaceholderScreen";
import { IllnessJournalScreen } from "../features/illness/screens/IllnessJournalScreen";
import { IllnessOnboardingScreen } from "../features/illness/screens/IllnessOnboardingScreen";
import { IllnessReminderListScreen } from "../features/illness/screens/IllnessReminderListScreen";
import type { MobileEpisodeMedicationPlan } from "../features/illness/api/episodeMedicationPlansApi";
import type {
  IllnessQuickActionKind,
  MobileIllnessObservation,
} from "../features/illness/model/illnessObservation";
import type { MobileFamilyMember } from "../features/family/api/familyMembersApi";
import type { JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import { JournalEntryScreen } from "../features/journal/screens/JournalEntryScreen";
import { LegalDocumentScreen } from "../features/legal/screens/LegalDocumentScreen";
import { MoreScreen } from "../features/more/screens/MoreScreen";
import { MedicineCabinetOverviewScreen } from "../features/medicine-cabinet/screens/MedicineCabinetOverviewScreen";
import { ChildOverviewScreen } from "../features/overview/screens/ChildOverviewScreen";
import { PillboxAnalyticsScreen } from "../features/pillbox/screens/PillboxAnalyticsScreen";
import { PillboxHomeScreen } from "../features/pillbox/screens/PillboxHomeScreen";
import { SubscriptionPaywallSheet } from "../features/subscription/screens/SubscriptionPaywallSheet";
import { RootModulePlaceholderScreen } from "../shared/components/RootModulePlaceholderScreen";
import { SettingsScreen } from "../features/settings/screens/SettingsScreen";
import type {
  MobileFamilyAccessSummary,
  MobilePushPreferences,
} from "../features/settings/api/settingsApi";
import type { SettingsBundle } from "../features/settings/model/settingsScreenLogic";
import { SleepHistoryScreen } from "../features/sleep/screens/SleepHistoryScreen";
import { SupportScreen } from "../features/support/screens/SupportScreen";
import { WeightHistoryScreen } from "../features/weight/screens/WeightHistoryScreen";
import { AssetWarmupLayer } from "../shared/components/AssetWarmupLayer";
import type { MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import type { MobileLocale } from "../shared/i18n/mobileI18n";
import type { AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import {
  isChildProfileVisibleScreen,
  shouldRenderMoreTab,
  shouldShowAnalyticsBreakdown,
  type PillPathActiveScreen,
  type ChildProfileDestination,
} from "./pillPathExpoShellModel";

type RootTabContentProps = {
  locale: MobileLocale;
  activeRootTab: MobileBottomTabKey;
  authSession: MobileAuthSession | null;
  familyMembers: MobileFamilyMember[];
  childrenCards: ChildCard[];
  selectedChildId: string;
  activeSleepStartedAtByCardId: Record<string, string | null>;
  activeFeedingStartedAtByCardId: Record<string, string | null>;
  activeObservationByCardId: Record<string, boolean>;
  onOpenChildProfile: (cardId: string) => void;
  onOpenChildCreate: () => void;
  addChildLocked: boolean;
  childrenPaywallVisible: boolean;
  onCloseChildrenPaywall: () => void;
  onChildrenPaywallPurchased: () => Promise<void> | void;
  onOpenLockedChild: () => void;
  onOpenRootJournalEntry: (cardId: string, kind: JournalEntryKind) => void;
  onOpenObservation: (cardId: string) => void;
  onSleepPress: (cardId: string) => void;
  onFeedingPress: (cardId: string) => void;
  onLogout: () => Promise<void>;
  onOpenFamily: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenSupport: () => void;
  onOpenTermsOfUse: () => void;
  onOpenPrivacyPolicy: () => void;
  onUpdateAuthSession: (patch: {
    familyName?: string;
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
  }) => Promise<void>;
  pushNotificationsBannerVisible: boolean;
  pushNotificationsBannerTitle: string;
  pushNotificationsBannerBody: string;
  pushNotificationsBannerActionLabel: string;
  onOpenPushNotificationSettings: () => void;
  onRootTabBarModeChange?: (
    mode: "foreground" | "background" | "hidden",
  ) => void;
  onOpenPillboxAnalytics: () => void;
  addCabinetFromCatalogLocked: boolean;
  cabinetPaywallVisible: boolean;
  onCloseCabinetPaywall: () => void;
  onCabinetPaywallPurchased: () => Promise<void> | void;
  onOpenLockedCabinetCatalog: () => void;
  createPillboxPlanLocked: boolean;
  pillboxPaywallVisible: boolean;
  onClosePillboxPaywall: () => void;
  onPillboxPaywallPurchased: () => Promise<void> | void;
  onOpenLockedPillboxPlan: () => void;
  screenLayerStyle: object;
};

type ChildFlowProps = {
  onOpenChildCreate: () => void;
  onBackChildCreate: () => void;
  onSubmitChildCreate: (payload: {
    name: string;
    birthDate: string | null;
    avatarKey: string | null;
    gender: string | null;
    babyModeEnabled: boolean;
    weightKg: number | null;
    heightCm: number | null;
    allergies: string | null;
    notes: string | null;
  }) => Promise<void>;
  onBackChildProfile: () => void;
  onEditProfile: () => void;
  onOpenAnalytics: () => void;
  onOpenJournalEntry: (kind: ChildProfileDestination) => void;
  onBackEditProfile: () => void;
  onSubmitEditProfile: (payload: {
    name: string;
    birthDate: string | null;
    avatarKey: string | null;
    gender: string | null;
    babyModeEnabled: boolean;
    allergies: string | null;
    notes: string | null;
  }) => void | Promise<void>;
  onDeleteChild: () => void | Promise<void>;
  onBackAnalytics: () => void;
  onOpenEpisode: (episode: AnalyticsEpisodeCard) => void;
  onBackAnalyticsEpisode: () => void;
  onBackJournalEntry: () => void;
  onStartFeedingTimer: () => void;
  onBackFeedingHistory: () => void;
  onBackSleepHistory: () => void;
  onBackWeightHistory: () => void;
  onBackGrowthHistory: () => void;
  onBackOverview: () => void;
};

type IllnessFlowProps = {
  onStartIllnessObservation: (payload: {
    startedAt: string;
    reason: string;
  }) => void | Promise<void>;
  onAddIllnessEntry: (childId: string, kind: IllnessQuickActionKind) => void;
  onSaveAdministrationEntry: (payload: {
    childId: string;
    customMedicineName: string;
    amount: string;
    administeredAt: string;
    reason?: string | null;
  }) => void | Promise<void>;
  onTakeReminderDose: (payload: {
    childId: string;
    plan: MobileEpisodeMedicationPlan;
    administeredAt?: string | null;
  }) => void | Promise<void>;
  onUpdateReminderEntry: (payload: {
    childId: string;
    planId: string;
    customMedicineName: string;
    doseAmount: string;
    minIntervalMinutes: number;
    maxDosesPerDay?: number | null;
    alreadyGiven?: boolean;
    lastGivenAt?: string | null;
    notes?: string | null;
  }) => void | Promise<void>;
  onSaveIllnessNoteEntry: (payload: {
    childId: string;
    text: string;
    createdAt: string;
  }) => void | Promise<void>;
  onSaveReminderEntry: (payload: {
    childId: string;
    customMedicineName: string;
    doseAmount: string;
    minIntervalMinutes: number;
    maxDosesPerDay?: number | null;
    alreadyGiven?: boolean;
    lastGivenAt?: string | null;
    notes?: string | null;
  }) => void | Promise<void>;
  onOpenIllnessReminders: (childId: string) => void;
  onOpenReminderComposer: (childId: string) => void;
  onSaveReminderRecipients: (payload: {
    childId: string;
    memberAccountIds: string[];
  }) => void | Promise<void>;
  onSaveTemperatureEntry: (payload: {
    childId: string;
    valueCelsius: number;
    measuredAt: string;
  }) => void | Promise<void>;
  isIllnessLiveActivityEnabled: (observation: MobileIllnessObservation) => boolean;
  onToggleIllnessLiveActivity: (
    observation: MobileIllnessObservation,
  ) => void | Promise<void>;
  onDeleteIllnessEntry: (payload: {
    childId: string;
    entryId: string;
    kind: "temperature" | "note" | "medicine" | "reminder";
  }) => void | Promise<void>;
  onFinishIllnessObservation: (childId: string) => void | Promise<void>;
  selectedIllnessActionKind: IllnessQuickActionKind;
  onBackIllnessJournal: () => void;
  onBackIllnessReminders: () => void;
  onBackIllnessActionPlaceholder: () => void;
  onBackIllnessOnboarding: () => void;
};

type UtilityFlowProps = {
  onBackFamily: () => void;
  onBackHelp: () => void;
  onOpenChildrenFromFamily: () => void;
  onOpenChildrenFromHelp: () => void;
  onOpenLockedChild: () => void;
  onOpenLockedFamilyInvite: () => void;
  onOpenFamilyFromHelp: () => void;
  onOpenJournalFromHelp: () => void;
  onOpenCabinetFromHelp: () => void;
  onOpenPillboxFromHelp: () => void;
  onOpenSettingsFromHelp: () => void;
  onOpenPillboxFromFamily: () => void;
  onOpenTermsOfUse: () => void;
  onOpenPrivacyPolicy: () => void;
  onRefreshFamilyMembers: () => Promise<void>;
  onUpdateCurrentProfile: (patch: {
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
  }) => Promise<void>;
  onSessionDeleted: () => Promise<void>;
  onUpdatePreferredLanguage: (locale: MobileLocale) => Promise<void>;
  onPushPreferencesChanged: (preferences: MobilePushPreferences) => void;
  onFamilyAccessChanged: (familyAccess: MobileFamilyAccessSummary) => void;
  onSettingsBundleChanged: (bundle: SettingsBundle) => void;
  onBackPrivacyPolicy: () => void;
  onBackSupport: () => void;
  onBackSettings: () => void;
  onBackTermsOfUse: () => void;
  familyPaywallVisible: boolean;
  onCloseFamilyPaywall: () => void;
  onFamilyPaywallPurchased: () => Promise<void> | void;
};

export function RootTabContent({
  activeRootTab,
  authSession,
  familyMembers,
  childrenCards,
  selectedChildId,
  activeSleepStartedAtByCardId,
  activeFeedingStartedAtByCardId,
  activeObservationByCardId,
  onOpenChildCreate,
  addChildLocked,
  childrenPaywallVisible,
  onCloseChildrenPaywall,
  onChildrenPaywallPurchased,
  onOpenLockedChild,
  onOpenChildProfile,
  onOpenRootJournalEntry,
  onOpenObservation,
  onSleepPress,
  onFeedingPress,
  onLogout,
  onOpenFamily,
  onOpenSettings,
  onOpenHelp,
  onOpenSupport,
  onOpenTermsOfUse,
  onOpenPrivacyPolicy,
  onUpdateAuthSession,
  pushNotificationsBannerVisible,
  pushNotificationsBannerTitle,
  pushNotificationsBannerBody,
  pushNotificationsBannerActionLabel,
  onOpenPushNotificationSettings,
  onRootTabBarModeChange,
  onOpenPillboxAnalytics,
  addCabinetFromCatalogLocked,
  cabinetPaywallVisible,
  onCloseCabinetPaywall,
  onCabinetPaywallPurchased,
  onOpenLockedCabinetCatalog,
  createPillboxPlanLocked,
  pillboxPaywallVisible,
  onClosePillboxPaywall,
  onPillboxPaywallPurchased,
  onOpenLockedPillboxPlan,
  screenLayerStyle,
}: RootTabContentProps) {
  const showMoreTab = shouldRenderMoreTab(activeRootTab, authSession);
  const placeholderTabKey =
    activeRootTab === "cabinet" || activeRootTab === "more" ? activeRootTab : null;

  return (
    <>
      <View
        pointerEvents={activeRootTab === "children" ? "auto" : "none"}
        style={[
          screenLayerStyle,
          activeRootTab === "children"
            ? tabLayerStyles.visible
            : tabLayerStyles.hidden,
        ]}
      >
        <ChildrenRedesignScreen
          cards={childrenCards}
          onOpenChildCreate={onOpenChildCreate}
          addChildLocked={addChildLocked}
          onOpenLockedChild={onOpenLockedChild}
          onOpenChildProfile={onOpenChildProfile}
          onOpenJournalEntry={onOpenRootJournalEntry}
          onOpenObservation={onOpenObservation}
          activeSleepStartedAtByCardId={activeSleepStartedAtByCardId}
          activeFeedingStartedAtByCardId={activeFeedingStartedAtByCardId}
          activeObservationByCardId={activeObservationByCardId}
          onSleepPress={onSleepPress}
          onFeedingPress={onFeedingPress}
          pushNotificationsBannerVisible={pushNotificationsBannerVisible}
          pushNotificationsBannerTitle={pushNotificationsBannerTitle}
          pushNotificationsBannerBody={pushNotificationsBannerBody}
          pushNotificationsBannerActionLabel={pushNotificationsBannerActionLabel}
          onOpenPushNotificationSettings={onOpenPushNotificationSettings}
        />
        <SubscriptionPaywallSheet
          visible={activeRootTab === "children" && childrenPaywallVisible}
          session={authSession}
          onClose={onCloseChildrenPaywall}
          onPurchased={onChildrenPaywallPurchased}
          onOpenTermsOfUse={onOpenTermsOfUse}
          onOpenPrivacyPolicy={onOpenPrivacyPolicy}
        />
      </View>
      {authSession ? (
        <View
          pointerEvents={showMoreTab ? "auto" : "none"}
          style={[
            screenLayerStyle,
            showMoreTab ? tabLayerStyles.visible : tabLayerStyles.hidden,
          ]}
        >
          <MoreScreen
            session={authSession}
            onLogout={onLogout}
            onOpenFamily={onOpenFamily}
            onOpenSettings={onOpenSettings}
            onOpenHelp={onOpenHelp}
            onOpenSupport={onOpenSupport}
            onOpenTerms={onOpenTermsOfUse}
            onOpenPrivacy={onOpenPrivacyPolicy}
            onUpdateSession={onUpdateAuthSession}
          />
        </View>
      ) : null}
      <View
        pointerEvents={activeRootTab === "cabinet" && !showMoreTab ? "auto" : "none"}
        style={[
          screenLayerStyle,
          activeRootTab === "cabinet" && !showMoreTab
            ? tabLayerStyles.visible
            : tabLayerStyles.hidden,
        ]}
      >
        <MedicineCabinetOverviewScreen
          authSession={authSession}
          familyMembers={familyMembers}
          addFromCatalogLocked={addCabinetFromCatalogLocked}
          onOpenLockedCatalog={onOpenLockedCabinetCatalog}
          pushNotificationsBannerVisible={pushNotificationsBannerVisible}
          pushNotificationsBannerTitle={pushNotificationsBannerTitle}
          pushNotificationsBannerBody={pushNotificationsBannerBody}
          pushNotificationsBannerActionLabel={pushNotificationsBannerActionLabel}
          onOpenPushNotificationSettings={onOpenPushNotificationSettings}
          onTabBarModeChange={onRootTabBarModeChange}
        />
        <SubscriptionPaywallSheet
          visible={activeRootTab === "cabinet" && cabinetPaywallVisible}
          session={authSession}
          onClose={onCloseCabinetPaywall}
          onPurchased={onCabinetPaywallPurchased}
          onOpenTermsOfUse={onOpenTermsOfUse}
          onOpenPrivacyPolicy={onOpenPrivacyPolicy}
        />
      </View>
      <View
        pointerEvents={activeRootTab === "pillbox" && !showMoreTab ? "auto" : "none"}
        style={[
          screenLayerStyle,
          activeRootTab === "pillbox" && !showMoreTab
            ? tabLayerStyles.visible
            : tabLayerStyles.hidden,
        ]}
      >
        <PillboxHomeScreen
          accessToken={authSession?.accessToken ?? null}
          currentAccountId={authSession?.account.id ?? ""}
          familyMembers={familyMembers}
          onOpenAnalytics={onOpenPillboxAnalytics}
          createPlanLocked={createPillboxPlanLocked}
          onOpenLockedPlan={onOpenLockedPillboxPlan}
          pushNotificationsBannerVisible={pushNotificationsBannerVisible}
          pushNotificationsBannerTitle={pushNotificationsBannerTitle}
          pushNotificationsBannerBody={pushNotificationsBannerBody}
          pushNotificationsBannerActionLabel={pushNotificationsBannerActionLabel}
          onOpenPushNotificationSettings={onOpenPushNotificationSettings}
          onTabBarModeChange={onRootTabBarModeChange}
        />
        <SubscriptionPaywallSheet
          visible={activeRootTab === "pillbox" && pillboxPaywallVisible}
          session={authSession}
          onClose={onClosePillboxPaywall}
          onPurchased={onPillboxPaywallPurchased}
          onOpenTermsOfUse={onOpenTermsOfUse}
          onOpenPrivacyPolicy={onOpenPrivacyPolicy}
        />
      </View>
      <View
        pointerEvents={
          placeholderTabKey === "more" && !showMoreTab ? "auto" : "none"
        }
        style={[
          screenLayerStyle,
          placeholderTabKey === "more" && !showMoreTab
            ? tabLayerStyles.visible
            : tabLayerStyles.hidden,
        ]}
      >
        {placeholderTabKey === "more" ? (
          <RootModulePlaceholderScreen tabKey={placeholderTabKey} />
        ) : null}
      </View>
    </>
  );
}

const tabLayerStyles = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
} as const;

type OverlayScreensProps = {
  locale: MobileLocale;
  activeScreen: PillPathActiveScreen;
  childrenCards: ChildCard[];
  selectedChildId: string;
  selectedEpisode: AnalyticsEpisodeCard | null;
  selectedJournalKind: JournalEntryKind;
  selectedIllnessActionKind: IllnessQuickActionKind;
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  familyMembers: MobileFamilyMember[];
  familyCanSeeInviteCard: boolean;
  familyInviteLocked: boolean;
  familyRoutinesCount: number;
  authSession: MobileAuthSession;
  childFlow: ChildFlowProps;
  illnessFlow: IllnessFlowProps;
  utilityFlow: UtilityFlowProps;
  pillboxFlow: {
    onBackAnalytics: () => void;
  };
};

type SelectedChildOverlayProps = {
  activeScreen: PillPathActiveScreen;
  authSession: OverlayScreensProps["authSession"];
  childFlow: OverlayScreensProps["childFlow"];
  illnessFlow: OverlayScreensProps["illnessFlow"];
  onOpenLockedChild: () => void;
  selectedChild: ChildCard;
  selectedEpisode: AnalyticsEpisodeCard | null;
  selectedJournalKind: JournalEntryKind;
};

function SelectedChildOverlays({
  activeScreen,
  authSession,
  childFlow,
  illnessFlow,
  onOpenLockedChild,
  selectedChild,
  selectedEpisode,
  selectedJournalKind,
}: SelectedChildOverlayProps) {
  const lockedAvatarGender = getChildAvatarGenderByKey(
    selectedChild.child.avatarKey as ChildAvatarPresetKey | null,
  );
  const shouldWarmAvatarPicker =
    activeScreen === "childProfile" || activeScreen === "childProfileEdit";

  return (
    <>
      <AssetWarmupLayer
        active={shouldWarmAvatarPicker}
        assetModules={getChildAvatarPresetSources(lockedAvatarGender)}
      />
      <ChildProfileRedesignScreen
        child={selectedChild}
        visible={isChildProfileVisibleScreen(activeScreen)}
        onBack={childFlow.onBackChildProfile}
        isReadOnlyLocked={selectedChild.isLocked}
        onOpenLockedChild={onOpenLockedChild}
        onEditProfile={selectedChild.isLocked ? onOpenLockedChild : childFlow.onEditProfile}
        onOpenAnalytics={childFlow.onOpenAnalytics}
        onOpenJournalEntry={childFlow.onOpenJournalEntry}
      />
      <ChildProfileEditScreen
        key={`child-profile-edit-${selectedChild.nodeId}`}
        child={selectedChild}
        visible={activeScreen === "childProfileEdit"}
        onBack={childFlow.onBackEditProfile}
        onSave={childFlow.onSubmitEditProfile}
        onDelete={childFlow.onDeleteChild}
      />
      <AnalyticsScreen
        key={`analytics-${selectedChild.nodeId}`}
        child={selectedChild}
        authSession={authSession}
        visible={
          activeScreen === "analytics" || activeScreen === "analyticsBreakdown"
        }
        onBack={childFlow.onBackAnalytics}
        onOpenEpisode={childFlow.onOpenEpisode}
      />
      {selectedEpisode &&
      shouldShowAnalyticsBreakdown(activeScreen, selectedEpisode) ? (
        <AnalyticsBreakdownScreen
          key={`analytics-breakdown-${selectedChild.nodeId}-${selectedEpisode.id}`}
          child={selectedChild}
          authSession={authSession}
          episode={selectedEpisode}
          onBack={childFlow.onBackAnalyticsEpisode}
        />
      ) : null}
      <JournalEntryScreen
        kind={selectedJournalKind}
        visible={activeScreen === "journalEntry"}
        onBack={childFlow.onBackJournalEntry}
        onSwipeBack={childFlow.onBackJournalEntry}
        onStartTimer={childFlow.onStartFeedingTimer}
      />
      <FeedingHistoryScreen
        authSession={authSession}
        child={selectedChild}
        visible={activeScreen === "feedingHistory"}
        onBack={childFlow.onBackFeedingHistory}
      />
      <SleepHistoryScreen
        key={`sleep-history-${selectedChild.nodeId}`}
        authSession={authSession}
        child={selectedChild}
        visible={activeScreen === "sleepHistory"}
        onBack={childFlow.onBackSleepHistory}
      />
      <WeightHistoryScreen
        key={`weight-history-${selectedChild.nodeId}`}
        authSession={authSession}
        child={selectedChild}
        visible={activeScreen === "weightHistory"}
        onBack={childFlow.onBackWeightHistory}
      />
      <GrowthHistoryScreen
        key={`growth-history-${selectedChild.nodeId}`}
        authSession={authSession}
        child={selectedChild}
        visible={activeScreen === "growthHistory"}
        onBack={childFlow.onBackGrowthHistory}
      />
      <ChildOverviewScreen
        key={`overview-${selectedChild.nodeId}`}
        authSession={authSession}
        child={selectedChild}
        visible={activeScreen === "overview"}
        onBack={childFlow.onBackOverview}
      />
      <IllnessOnboardingScreen
        child={selectedChild}
        visible={activeScreen === "illnessOnboarding"}
        onBack={illnessFlow.onBackIllnessOnboarding}
        onStartObservation={illnessFlow.onStartIllnessObservation}
      />
    </>
  );
}

type IllnessOverlayProps = {
  activeScreen: PillPathActiveScreen;
  childrenCards: ChildCard[];
  focusedChildId: string;
  currentAccountId: string;
  selectedIllnessActionKind: IllnessQuickActionKind;
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  familyMembers: MobileFamilyMember[];
  illnessFlow: OverlayScreensProps["illnessFlow"];
};

function IllnessOverlays({
  activeScreen,
  childrenCards,
  focusedChildId,
  currentAccountId,
  selectedIllnessActionKind,
  observationsByChildId,
  familyMembers,
  illnessFlow,
}: IllnessOverlayProps) {
  const focusedChild =
    childrenCards.find((child) => child.nodeId === focusedChildId) ?? null;
  const focusedObservation = focusedChild
    ? (observationsByChildId[focusedChild.nodeId] ?? null)
    : null;
  const shouldWarmIllnessJournalAssets =
    activeScreen === "illnessOnboarding" ||
    activeScreen === "illnessJournal" ||
    activeScreen === "illnessReminders" ||
    activeScreen === "illnessActionPlaceholder";

  return (
    <>
      <AssetWarmupLayer
        active={shouldWarmIllnessJournalAssets}
        assetModules={[
          illnessAssets.journal.quickTemperature,
          illnessAssets.journal.quickMedicine,
          illnessAssets.journal.quickNote,
          illnessAssets.journal.quickReminder,
        ]}
      />
      <IllnessJournalScreen
        children={childrenCards}
        observationsByChildId={observationsByChildId}
        focusedChildId={focusedChildId}
        visible={
          activeScreen === "illnessJournal" ||
          activeScreen === "illnessReminders" ||
          activeScreen === "illnessActionPlaceholder"
        }
        isLiveActivityEnabled={illnessFlow.isIllnessLiveActivityEnabled}
        onAddEntry={illnessFlow.onAddIllnessEntry}
        onOpenReminders={illnessFlow.onOpenIllnessReminders}
        onTakeReminderDose={illnessFlow.onTakeReminderDose}
        onToggleLiveActivity={illnessFlow.onToggleIllnessLiveActivity}
        onFinishObservation={illnessFlow.onFinishIllnessObservation}
        onOpenChildren={illnessFlow.onBackIllnessJournal}
      />
      {focusedChild ? (
        <IllnessReminderListScreen
          child={focusedChild}
          observation={focusedObservation}
          familyMembers={familyMembers}
          currentAccountId={currentAccountId}
          visible={activeScreen === "illnessReminders"}
          backgroundVisible={false}
          onBack={illnessFlow.onBackIllnessReminders}
          onOpenCreateReminder={() =>
            illnessFlow.onOpenReminderComposer(focusedChild.nodeId)
          }
          onUpdateReminder={(payload) =>
            illnessFlow.onUpdateReminderEntry({
              childId: focusedChild.nodeId,
              planId: payload.planId,
              customMedicineName:
                payload.customMedicineName,
              doseAmount: payload.doseAmount,
              minIntervalMinutes: payload.minIntervalMinutes,
              maxDosesPerDay: payload.maxDosesPerDay,
              notes: payload.notes,
            })
          }
          onDeleteReminder={(entryId) =>
            illnessFlow.onDeleteIllnessEntry({
              childId: focusedChild.nodeId,
              entryId,
              kind: "reminder",
            })
          }
          onTakeDose={({ plan, administeredAt }) =>
            illnessFlow.onTakeReminderDose({
              childId: focusedChild.nodeId,
              plan,
              administeredAt,
            })
          }
          onSaveRecipients={(memberAccountIds) =>
            illnessFlow.onSaveReminderRecipients({
              childId: focusedChild.nodeId,
              memberAccountIds,
            })
          }
        />
      ) : null}
      {focusedChild ? (
        <IllnessActionPlaceholderScreen
          key={`illness-action-${focusedChild.nodeId}-${selectedIllnessActionKind}`}
          child={focusedChild}
          kind={selectedIllnessActionKind}
          observation={focusedObservation}
          visible={activeScreen === "illnessActionPlaceholder"}
          onBack={illnessFlow.onBackIllnessActionPlaceholder}
          onSaveAdministration={illnessFlow.onSaveAdministrationEntry}
          onSaveNote={illnessFlow.onSaveIllnessNoteEntry}
          onSaveReminder={illnessFlow.onSaveReminderEntry}
          onUpdateReminder={illnessFlow.onUpdateReminderEntry}
          onSaveTemperature={illnessFlow.onSaveTemperatureEntry}
          onDeleteEntry={illnessFlow.onDeleteIllnessEntry}
          editingReminderPlan={null}
        />
      ) : null}
    </>
  );
}

type UtilityOverlayProps = {
  activeScreen: PillPathActiveScreen;
  authSession: MobileAuthSession;
  childrenCards: ChildCard[];
  familyCanSeeInviteCard: boolean;
  familyInviteLocked: boolean;
  familyMembers: MobileFamilyMember[];
  familyRoutinesCount: number;
  utilityFlow: OverlayScreensProps["utilityFlow"];
};

function UtilityOverlays({
  activeScreen,
  authSession,
  childrenCards,
  familyCanSeeInviteCard,
  familyInviteLocked,
  familyMembers,
  familyRoutinesCount,
  utilityFlow,
}: UtilityOverlayProps) {
  return (
    <>
      <LegalDocumentScreen
        documentKey="privacy"
        visible={activeScreen === "privacyPolicy"}
        onBack={utilityFlow.onBackPrivacyPolicy}
      />
      <FamilyScreen
        visible={activeScreen === "family"}
        onBack={utilityFlow.onBackFamily}
        onOpenChildren={utilityFlow.onOpenChildrenFromFamily}
        onOpenPillbox={utilityFlow.onOpenPillboxFromFamily}
        onRefreshFamilyMembers={utilityFlow.onRefreshFamilyMembers}
        onUpdateCurrentProfile={utilityFlow.onUpdateCurrentProfile}
        showInviteCard={familyCanSeeInviteCard}
        inviteLocked={familyInviteLocked}
        onOpenLockedInvite={utilityFlow.onOpenLockedFamilyInvite}
        familyMembers={familyMembers}
        routinesCount={familyRoutinesCount}
        childrenCards={childrenCards}
        session={authSession}
      />
      <HelpScreen
        visible={activeScreen === "help"}
        onBack={utilityFlow.onBackHelp}
        onOpenChildren={utilityFlow.onOpenChildrenFromHelp}
        onOpenJournal={utilityFlow.onOpenJournalFromHelp}
        onOpenPillbox={utilityFlow.onOpenPillboxFromHelp}
        onOpenCabinet={utilityFlow.onOpenCabinetFromHelp}
        onOpenFamily={utilityFlow.onOpenFamilyFromHelp}
        onOpenSettings={utilityFlow.onOpenSettingsFromHelp}
      />
      <SubscriptionPaywallSheet
        visible={activeScreen === "family" && utilityFlow.familyPaywallVisible}
        session={authSession}
        onClose={utilityFlow.onCloseFamilyPaywall}
        onPurchased={utilityFlow.onFamilyPaywallPurchased}
        onOpenTermsOfUse={utilityFlow.onOpenTermsOfUse}
        onOpenPrivacyPolicy={utilityFlow.onOpenPrivacyPolicy}
      />
      <SupportScreen
        visible={activeScreen === "support"}
        onBack={utilityFlow.onBackSupport}
        session={authSession}
      />
      <SettingsScreen
        visible={activeScreen === "settings"}
        onBack={utilityFlow.onBackSettings}
        onSessionDeleted={utilityFlow.onSessionDeleted}
        session={authSession}
        onUpdatePreferredLanguage={utilityFlow.onUpdatePreferredLanguage}
        onPushPreferencesChanged={utilityFlow.onPushPreferencesChanged}
        onFamilyAccessChanged={utilityFlow.onFamilyAccessChanged}
        onSettingsBundleChanged={utilityFlow.onSettingsBundleChanged}
        onOpenTermsOfUse={utilityFlow.onOpenTermsOfUse}
        onOpenPrivacyPolicy={utilityFlow.onOpenPrivacyPolicy}
      />
      <LegalDocumentScreen
        documentKey="terms"
        visible={activeScreen === "termsOfUse"}
        onBack={utilityFlow.onBackTermsOfUse}
      />
    </>
  );
}

export function OverlayScreens({
  locale,
  activeScreen,
  childrenCards,
  selectedChildId,
  selectedEpisode,
  selectedJournalKind,
  selectedIllnessActionKind,
  observationsByChildId,
  familyMembers,
  familyCanSeeInviteCard,
  familyInviteLocked,
  familyRoutinesCount,
  authSession,
  childFlow,
  illnessFlow,
  utilityFlow,
  pillboxFlow,
}: OverlayScreensProps) {
  const selectedChild =
    childrenCards.find((card) => card.nodeId === selectedChildId) ?? null;

  return (
    <>
      <ChildCreateScreen
        visible={activeScreen === "childCreate"}
        onBack={childFlow.onBackChildCreate}
        onSubmit={childFlow.onSubmitChildCreate}
      />
      {selectedChild ? (
        <SelectedChildOverlays
          activeScreen={activeScreen}
          authSession={authSession}
          childFlow={childFlow}
          illnessFlow={illnessFlow}
          onOpenLockedChild={utilityFlow.onOpenLockedChild}
          selectedChild={selectedChild}
          selectedEpisode={selectedEpisode}
          selectedJournalKind={selectedJournalKind}
        />
      ) : null}
      <IllnessOverlays
        activeScreen={activeScreen}
        childrenCards={childrenCards}
        focusedChildId={selectedChildId}
        currentAccountId={authSession.account.id}
        selectedIllnessActionKind={selectedIllnessActionKind}
        observationsByChildId={observationsByChildId}
        familyMembers={familyMembers}
        illnessFlow={illnessFlow}
      />
      <UtilityOverlays
        activeScreen={activeScreen}
        authSession={authSession}
        childrenCards={childrenCards}
        familyCanSeeInviteCard={familyCanSeeInviteCard}
        familyInviteLocked={familyInviteLocked}
        familyMembers={familyMembers}
        familyRoutinesCount={familyRoutinesCount}
        utilityFlow={utilityFlow}
      />
      <PillboxAnalyticsScreen
        visible={activeScreen === "pillboxAnalytics"}
        accessToken={authSession.accessToken}
        locale={locale}
        onBack={pillboxFlow.onBackAnalytics}
      />
    </>
  );
}

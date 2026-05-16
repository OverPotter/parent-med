import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import type { MobileAuthSession } from "../../auth/api/authApi";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import { MedicineCabinetOverviewContent } from "./MedicineCabinetOverviewContent";
import { MedicineCabinetOverviewOverlays } from "./MedicineCabinetOverviewOverlays";
import { medicineCabinetOverviewStyles as styles } from "./medicineCabinetOverviewScreenStyles";
import {
  type CabinetTabBarMode,
  useMedicineCabinetOverviewController,
} from "./useMedicineCabinetOverviewController";

export function MedicineCabinetOverviewScreen({
  authSession,
  familyMembers,
  onTabBarModeChange,
}: {
  authSession: MobileAuthSession | null;
  familyMembers: MobileFamilyMember[];
  onTabBarModeChange?: (mode: CabinetTabBarMode) => void;
}) {
  const controller = useMedicineCabinetOverviewController({
    authSession,
    familyMembers,
    onTabBarModeChange,
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#FFF7F1", "#FFF3EA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.decorationTop} />
        <View style={styles.decorationMiddle} />
        <MedicineCabinetOverviewContent
          locale={controller.locale}
          searchQuery={controller.searchQuery}
          onChangeSearchQuery={controller.setSearchQuery}
          activeFilter={controller.activeFilter}
          onSelectFilter={controller.setActiveFilter}
          summaryStats={controller.summaryStats}
          filteredItems={controller.filteredItems}
          sectionSubtitle={controller.sectionSubtitle}
          recipientsSummary={controller.recipientsSummary}
          onOpenRecipients={controller.handleOpenRecipients}
          onOpenAddChoice={() => controller.setIsAddChoiceSheetOpen(true)}
          isLoadingMedicines={controller.isLoadingMedicines}
          medicinesError={controller.medicinesError}
          onRetryLoad={() => void controller.loadMedicines({ resetFilter: true })}
          openSwipeCardId={controller.openSwipeCardId}
          onOpenSwipe={controller.setOpenSwipeCardId}
          onCloseSwipe={(id) =>
            controller.setOpenSwipeCardId((current) => (current === id ? null : current))
          }
          expandedMedicineId={controller.expandedMedicineId}
          onToggleExpanded={(id) => {
            controller.setOpenSwipeCardId(null);
            controller.setExpandedMedicineId((current) =>
              current === id ? null : id,
            );
          }}
          onOpenRenew={(item) => {
            controller.setOpenSwipeCardId(null);
            controller.setPendingRenewItem(item);
          }}
          onDeleteItem={(item) => {
            controller.setOpenSwipeCardId(null);
            controller.setPendingDeleteItem(item);
          }}
        />
      </LinearGradient>
      <MedicineCabinetOverviewOverlays
        authSession={authSession}
        activeScreen={controller.activeScreen}
        setActiveScreen={controller.setActiveScreen}
        onCreated={controller.handleCreated}
        onRenewPack={controller.handleRenewPack}
        isRecipientsSheetOpen={controller.isRecipientsSheetOpen}
        setIsRecipientsSheetOpen={controller.setIsRecipientsSheetOpen}
        eligibleFamilyMembers={controller.eligibleFamilyMembers}
        currentAccountId={controller.currentAccountId}
        selectedRecipientIds={controller.selectedRecipientIds}
        isSavingRecipients={controller.isSavingRecipients}
        onToggleRecipient={controller.handleToggleRecipient}
        isAddChoiceSheetOpen={controller.isAddChoiceSheetOpen}
        setIsAddChoiceSheetOpen={controller.setIsAddChoiceSheetOpen}
        onOpenReferenceCreate={() => controller.setActiveScreen("reference-create")}
        onOpenManualCreate={() => controller.setActiveScreen("manual-create")}
        pendingRenewItem={controller.pendingRenewItem}
        setPendingRenewItem={controller.setPendingRenewItem}
        pendingDeleteItem={controller.pendingDeleteItem}
        setPendingDeleteItem={controller.setPendingDeleteItem}
        onConfirmDelete={controller.handleConfirmDelete}
        transientNotice={controller.transientNotice}
      />
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import type { MobileAuthSession } from "../../auth/api/authApi";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import { InstantReminderRecipientsSheet } from "../../illness/screens/ReminderRecipientsSheet";
import type { MedicineCardItem } from "../model/medicineCabinetOverviewModel";
import { MedicineCabinetAddChoiceSheet } from "./MedicineCabinetAddChoiceSheet";
import { MedicineCabinetMedicineDetailsScreen } from "./MedicineCabinetMedicineDetailsScreen";
import { MedicineCabinetManualCreateScreen } from "./MedicineCabinetManualCreateScreen";
import { MedicineCabinetReferenceCreateScreen } from "./MedicineCabinetReferenceCreateScreen";
import { medicineCabinetOverviewStyles as styles } from "./medicineCabinetOverviewScreenStyles";
import type { MedicineCabinetOverviewScreenKey } from "./useMedicineCabinetOverviewController";

export function MedicineCabinetOverviewOverlays({
  authSession,
  activeScreen,
  setActiveScreen,
  onCreated,
  selectedMedicine,
  onRenewPack,
  isRecipientsSheetOpen,
  setIsRecipientsSheetOpen,
  eligibleFamilyMembers,
  currentAccountId,
  selectedRecipientIds,
  isSavingRecipients,
  onToggleRecipient,
  isAddChoiceSheetOpen,
  setIsAddChoiceSheetOpen,
  setPendingAddChoiceTarget,
  pendingDeleteItem,
  setPendingDeleteItem,
  onConfirmDelete,
  transientNotice,
}: {
  authSession: MobileAuthSession | null;
  activeScreen: MedicineCabinetOverviewScreenKey;
  setActiveScreen: (value: MedicineCabinetOverviewScreenKey) => void;
  onCreated: () => void;
  selectedMedicine: MedicineCardItem | null;
  onRenewPack: (payload: { expiryDate: string; openedDate: string | null }) => void;
  isRecipientsSheetOpen: boolean;
  setIsRecipientsSheetOpen: (value: boolean) => void;
  eligibleFamilyMembers: MobileFamilyMember[];
  currentAccountId: string;
  selectedRecipientIds: string[];
  isSavingRecipients: boolean;
  onToggleRecipient: (memberId: string) => void;
  isAddChoiceSheetOpen: boolean;
  setIsAddChoiceSheetOpen: (value: boolean) => void;
  setPendingAddChoiceTarget: (value: "reference-create" | "manual-create" | null) => void;
  pendingDeleteItem: MedicineCardItem | null;
  setPendingDeleteItem: (item: MedicineCardItem | null) => void;
  onConfirmDelete: () => void;
  transientNotice: string | null;
}) {
  return (
    <>
      <InstantReminderRecipientsSheet
        title="Кому приходят push по аптечке"
        subtitle="Эти люди будут получать уведомления о сроках и просроченных лекарствах."
        currentUserLabel="Вы"
        visible={isRecipientsSheetOpen}
        isSaving={isSavingRecipients}
        members={eligibleFamilyMembers}
        currentAccountId={currentAccountId}
        selectedIds={selectedRecipientIds}
        onToggleMember={onToggleRecipient}
        onClose={() => setIsRecipientsSheetOpen(false)}
      />

      {activeScreen === "manual-create" ? (
        <View style={styles.manualCreateOverlay}>
          <MedicineCabinetManualCreateScreen
            authSession={authSession}
            onBack={() => setActiveScreen("overview")}
            onCreated={() => {
              onCreated();
              setActiveScreen("overview");
            }}
          />
        </View>
      ) : null}

      {activeScreen === "reference-create" ? (
        <View style={styles.manualCreateOverlay}>
          <MedicineCabinetReferenceCreateScreen
            authSession={authSession}
            onBack={() => setActiveScreen("overview")}
            onCreated={() => {
              onCreated();
              setActiveScreen("overview");
            }}
          />
        </View>
      ) : null}

      {activeScreen === "details" && selectedMedicine ? (
        <View style={styles.manualCreateOverlay}>
          <MedicineCabinetMedicineDetailsScreen
            item={selectedMedicine}
            onBack={() => setActiveScreen("overview")}
            onRenewPack={onRenewPack}
          />
        </View>
      ) : null}

      <MedicineCabinetAddChoiceSheet
        visible={isAddChoiceSheetOpen}
        onClose={() => {
          setIsAddChoiceSheetOpen(false);
        }}
        onOpenReferenceCreate={() => {
          setPendingAddChoiceTarget("reference-create");
          setIsAddChoiceSheetOpen(false);
        }}
        onOpenManualCreate={() => {
          setPendingAddChoiceTarget("manual-create");
          setIsAddChoiceSheetOpen(false);
        }}
      />

      <FormBottomSheet
        visible={pendingDeleteItem !== null}
        onClose={() => setPendingDeleteItem(null)}
        overlayStyle={styles.sheetOverlay}
        backdropStyle={styles.sheetBackdrop}
        sheetStyle={styles.customValueSheetCard}
      >
        {({ panHandlers, requestClose }) => (
          <>
            <View style={styles.sheetDragZone} {...panHandlers}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Списать препарат?</Text>
              <Text style={styles.sheetSubtitle}>
                {pendingDeleteItem
                  ? `Карточка «${pendingDeleteItem.title}» исчезнет из домашней аптечки.`
                  : "Карточка исчезнет из домашней аптечки."}
              </Text>
            </View>

            <View style={styles.customValueActions}>
              <Pressable
                onPress={() => requestClose()}
                style={({ pressed }) => [
                  styles.customValueCancelButton,
                  pressed ? styles.secondaryButtonPressed : null,
                ]}
              >
                <Text style={styles.customValueCancelText}>Нет</Text>
              </Pressable>

              <Pressable
                onPress={() => requestClose(onConfirmDelete)}
                style={({ pressed }) => [
                  styles.customValueSaveButton,
                  pressed ? styles.primaryButtonPressed : null,
                ]}
              >
                <LinearGradient
                  colors={["#F56565", "#EF4F4F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.customValueSaveGradient}
                />
                <Text style={styles.customValueSaveText}>Да</Text>
              </Pressable>
            </View>
          </>
        )}
      </FormBottomSheet>

      {transientNotice ? (
        <View style={styles.transientNoticeWrap} pointerEvents="none">
          <View style={styles.transientNoticeCard}>
            <View style={styles.transientNoticeIconWrap}>
              <Ionicons name="checkmark" size={14} color="#2F8B5F" />
            </View>
            <Text style={styles.transientNoticeText}>{transientNotice}</Text>
          </View>
        </View>
      ) : null}
    </>
  );
}

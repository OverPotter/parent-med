import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import type { MobileAuthSession } from "../../auth/api/authApi";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import { InstantReminderRecipientsSheet } from "../../illness/screens/ReminderRecipientsSheet";
import type { MedicineCardItem } from "../model/medicineCabinetOverviewModel";
import { MedicineCabinetAddChoiceSheet } from "./MedicineCabinetAddChoiceSheet";
import { MedicineCabinetManualCreateScreen } from "./MedicineCabinetManualCreateScreen";
import { MedicineCabinetRenewPackSheet } from "./MedicineCabinetRenewPackSheet";
import { MedicineCabinetReferenceCreateScreen } from "./MedicineCabinetReferenceCreateScreen";
import { medicineCabinetOverviewStyles as styles } from "./medicineCabinetOverviewScreenStyles";
import type { MedicineCabinetOverviewScreenKey } from "./useMedicineCabinetOverviewController";

export function MedicineCabinetOverviewOverlays({
  authSession,
  activeScreen,
  setActiveScreen,
  onCreated,
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
  onOpenReferenceCreate,
  onOpenManualCreate,
  pendingRenewItem,
  setPendingRenewItem,
  pendingDeleteItem,
  setPendingDeleteItem,
  onConfirmDelete,
  transientNotice,
}: {
  authSession: MobileAuthSession | null;
  activeScreen: MedicineCabinetOverviewScreenKey;
  setActiveScreen: (value: MedicineCabinetOverviewScreenKey) => void;
  onCreated: () => void;
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
  onOpenReferenceCreate: () => void;
  onOpenManualCreate: () => void;
  pendingRenewItem: MedicineCardItem | null;
  setPendingRenewItem: (item: MedicineCardItem | null) => void;
  pendingDeleteItem: MedicineCardItem | null;
  setPendingDeleteItem: (item: MedicineCardItem | null) => void;
  onConfirmDelete: () => void;
  transientNotice: string | null;
}) {
  const { locale } = useMobileI18n();
  return (
    <>
      <InstantReminderRecipientsSheet
        title={
          locale === "ru"
            ? "Кому приходят push по аптечке"
            : locale === "de"
              ? "Wer Pushs zur Hausapotheke erhält"
              : locale === "pl"
                ? "Kto dostaje powiadomienia push o apteczce"
                : "Who gets cabinet push notifications"
        }
        subtitle={
          locale === "ru"
            ? "Эти люди будут получать уведомления о сроках и просроченных лекарствах."
            : locale === "de"
              ? "Diese Personen erhalten Hinweise zu Ablaufdaten und abgelaufenen Medikamenten."
              : locale === "pl"
                ? "Te osoby będą otrzymywać powiadomienia o terminach i przeterminowanych lekach."
                : "These people will receive alerts about upcoming expiries and expired medicines."
        }
        currentUserLabel={
          locale === "ru"
            ? "Вы"
            : locale === "de"
              ? "Du"
              : locale === "pl"
                ? "Ty"
                : "You"
        }
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

      <MedicineCabinetAddChoiceSheet
        visible={isAddChoiceSheetOpen}
        onClose={() => {
          setIsAddChoiceSheetOpen(false);
        }}
        onOpenReferenceCreate={() => {
          setIsAddChoiceSheetOpen(false);
          onOpenReferenceCreate();
        }}
        onOpenManualCreate={() => {
          setIsAddChoiceSheetOpen(false);
          onOpenManualCreate();
        }}
      />

      <MedicineCabinetRenewPackSheet
        item={pendingRenewItem}
        visible={pendingRenewItem !== null}
        onClose={() => setPendingRenewItem(null)}
        onSave={onRenewPack}
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
              <Text style={styles.sheetTitle}>
                {locale === "ru"
                  ? "Списать препарат?"
                  : locale === "de"
                    ? "Medikament entfernen?"
                    : locale === "pl"
                      ? "Usunąć lek?"
                      : "Remove medicine?"}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {pendingDeleteItem
                  ? locale === "ru"
                    ? `Карточка «${pendingDeleteItem.title}» исчезнет из домашней аптечки.`
                    : locale === "de"
                      ? `Die Karte „${pendingDeleteItem.title}“ wird aus der Hausapotheke entfernt.`
                      : locale === "pl"
                        ? `Karta „${pendingDeleteItem.title}” zniknie z domowej apteczki.`
                        : `The card "${pendingDeleteItem.title}" will be removed from the cabinet.`
                  : locale === "ru"
                    ? "Карточка исчезнет из домашней аптечки."
                    : locale === "de"
                      ? "Die Karte wird aus der Hausapotheke entfernt."
                      : locale === "pl"
                        ? "Karta zniknie z domowej apteczki."
                        : "The card will be removed from the cabinet."}
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
                <Text style={styles.customValueCancelText}>
                  {locale === "ru"
                    ? "Нет"
                    : locale === "de"
                      ? "Nein"
                      : locale === "pl"
                        ? "Nie"
                        : "No"}
                </Text>
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
                <Text style={styles.customValueSaveText}>
                  {locale === "ru"
                    ? "Да"
                    : locale === "de"
                      ? "Ja"
                      : locale === "pl"
                        ? "Tak"
                        : "Yes"}
                </Text>
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

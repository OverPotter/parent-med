import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import { ReminderRecipientsSheet } from "../../illness/screens/ReminderRecipientsSheet";
import { resolveIllnessRecipientSelection } from "../../illness/model/illnessRecipients";
import type { PillboxPlanDetail } from "../model/pillboxHomeScreen";
import { resolvePillboxStatusTone } from "../model/pillboxStatus";
import { pillboxPlanDetailsStyles as styles } from "./pillboxPlanDetailsStyles";

export function PillboxPlanDetailsScreen({
  visible,
  plan,
  isUpdating,
  currentAccountId,
  familyMembers,
  onClose,
  onTogglePause,
  onSaveRecipients,
}: {
  visible: boolean;
  plan: PillboxPlanDetail | null;
  isUpdating: boolean;
  currentAccountId: string;
  familyMembers: MobileFamilyMember[];
  onClose: () => void;
  onTogglePause: () => void;
  onSaveRecipients: (recipientIds: string[]) => void;
}) {
  const surfaceTheme = useMobileSurfaceTheme();
  const { width } = useWindowDimensions();
  const [isRecipientsSheetOpen, setIsRecipientsSheetOpen] = useState(false);
  const [draftRecipientIds, setDraftRecipientIds] = useState<string[]>([]);

  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack: onClose,
    shouldCloseOnBack: false,
    shouldTranslateOnSwipe: true,
  });

  const primaryActionLabel = useMemo(() => {
    if (!plan) {
      return "Пауза";
    }
    return plan.status === "paused" ? "Возобновить" : "Поставить на паузу";
  }, [plan]);
  const eligibleRecipientIds = useMemo(
    () =>
      familyMembers.length > 0
        ? familyMembers.map((member) => member.id)
        : (plan?.recipientIds ?? []),
    [familyMembers, plan?.recipientIds],
  );

  useEffect(() => {
    if (!visible || !plan) {
      setIsRecipientsSheetOpen(false);
      setDraftRecipientIds([]);
      return;
    }
    setDraftRecipientIds([...plan.recipientIds]);
  }, [plan, visible]);

  if (!plan) {
    return null;
  }
  const statusTone = resolvePillboxStatusTone(plan.status);

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.overlayLayer,
        visible ? styles.overlayLayerVisible : styles.overlayLayerHidden,
        { transform: [{ translateX }] },
      ]}
    >
      <View style={styles.screenRoot}>
        <ImageBackground
          source={redesignBackgrounds.childrenModule}
          resizeMode="cover"
          style={styles.background}
          imageStyle={styles.backgroundImage}
        >
          <View
            style={[
              styles.overlay,
              { backgroundColor: surfaceTheme.backgroundOverlayColor },
            ]}
          />
        </ImageBackground>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topNav}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.backLink,
                pressed ? styles.backLinkPressed : null,
              ]}
            >
              <Text style={styles.backLinkText}>← Назад</Text>
            </Pressable>
            <View style={styles.topNavSpacer} />
          </View>

          <View style={styles.headerCard}>
            <View style={styles.avatar}>{/* avatar */}
              <Text style={styles.avatarText}>{plan.avatarText}</Text>
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{plan.title}</Text>
              <Text style={styles.subtitle}>{plan.recipientsLabel}</Text>
            </View>
            <View style={statusTone === "paused" ? styles.statusChipPaused : styles.statusChip}>
              <Text style={statusTone === "paused" ? styles.statusChipTextPaused : styles.statusChipText}>
                {plan.statusText}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryCardPeach]}>
              <Text style={styles.summaryLabel}>Лекарства</Text>
              <Text style={styles.summaryValue}>{plan.medicineCountLabel}</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardBlue]}>
              <Text style={styles.summaryLabel}>Ближайший приём</Text>
              <Text style={styles.summaryValue}>{plan.scheduleNote}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setIsRecipientsSheetOpen(true)}
            style={({ pressed }) => [
              styles.sectionCard,
              styles.notificationCard,
              pressed ? styles.backLinkPressed : null,
            ]}
          >
            <View style={styles.notificationCopy}>
              <Text style={styles.sectionTitle}>Уведы</Text>
              <Text style={styles.notificationHint}>{plan.recipientsLabel}</Text>
            </View>
            <Text style={styles.notificationChevron}>›</Text>
          </Pressable>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Лекарства в плане</Text>
            <View style={styles.medicineList}>
              {plan.medicines.map((medicine, index) => (
                <View
                  key={medicine.id}
                  style={[
                    styles.medicineRow,
                    index === plan.medicines.length - 1 ? styles.medicineRowLast : null,
                  ]}
                >
                  <View style={styles.medicineDot} />
                  <View style={styles.medicineCopy}>
                    <Text style={styles.medicineTitle}>{medicine.title}</Text>
                    <Text style={styles.medicineMeta}>{medicine.summary}</Text>
                    <View style={styles.medicineScheduleChip}>
                      <Text style={styles.medicineSchedule}>{medicine.schedule}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomDock}>
          <Pressable
            onPress={onTogglePause}
            disabled={isUpdating}
            style={({ pressed }) => [
              styles.primaryAction,
              pressed ? styles.backLinkPressed : null,
              isUpdating ? styles.primaryActionDisabled : null,
            ]}
          >
            <Text style={styles.primaryActionText}>
              {isUpdating ? "Сохраняем..." : primaryActionLabel}
            </Text>
          </Pressable>
        </View>

        <View
          style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
          {...panHandlers}
        />

        <ReminderRecipientsSheet
          title="Кому придут уведомления"
          subtitle="Если снять всех, по умолчанию останется создатель плана."
          cancelLabel="Отмена"
          saveLabel="Сохранить"
          currentUserLabel="Вы"
          visible={isRecipientsSheetOpen}
          isSaving={isUpdating}
          members={familyMembers}
          currentAccountId={currentAccountId}
          selectedIds={draftRecipientIds}
          onToggleMember={(memberId) =>
            setDraftRecipientIds((current) =>
              resolveIllnessRecipientSelection(
                current.includes(memberId)
                  ? current.filter((id) => id !== memberId)
                  : [...current, memberId],
                eligibleRecipientIds,
                currentAccountId,
              ),
            )
          }
          onClose={() => setIsRecipientsSheetOpen(false)}
          onSave={() => {
            onSaveRecipients(draftRecipientIds);
            setIsRecipientsSheetOpen(false);
          }}
        />
      </View>
    </Animated.View>
  );
}

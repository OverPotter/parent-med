import { Feather } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { getLocalAssetDefaultSource } from "../../../shared/lib/assetSources";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { reminderFieldIcons } from "../assets";
import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";
import { getReminderPlanDisplayTitle } from "../model/illnessReminderPlanTitle";
import { buildMobileReminderPlanAdministrationStats } from "../model/illnessReminderPlanStats";
import { formatReminderIntervalForUnit } from "./reminderIntervalFormatting";
import { getReminderCardStatusText } from "./illnessReminderCardStatus";

type ReminderPlanCardProps = {
  plan: MobileEpisodeMedicationPlan;
  stats: ReturnType<typeof buildMobileReminderPlanAdministrationStats>;
  locale: MobileLocale;
  medicationIntervalUnit: "hours" | "minutes";
  activeLabel: string;
  doseLabel: string;
  intervalLabel: string;
  limitLabel: string;
  notesLabel: string;
  loggedTodayLabel: string;
  ofLabel: string;
  lastDoseLabel: string;
  dailyLimitReachedLabel: string;
  giveAtLabel: string;
  nextDosePrefix: string;
  takeDoseNowLabel: string;
  loggingNowLabel: string;
  canTakeNow: boolean;
  isSubmittingDose: boolean;
  interactive: boolean;
  expanded: boolean;
  onToggleExpanded?: () => void;
  onTakeDose?: () => void;
  onEditDose?: () => void;
  onEditInterval?: () => void;
  onEditLimit?: () => void;
  onEditNotes?: () => void;
};

function formatReminderCardLastDose(dateIso: string, locale: MobileLocale) {
  return new Intl.DateTimeFormat(
    locale === "ru"
      ? "ru-RU"
      : locale === "de"
        ? "de-DE"
        : locale === "pl"
          ? "pl-PL"
          : "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(dateIso));
}

function ReminderPlanCardHeader({
  title,
  activeLabel,
  collapsedStatusLabel,
  expanded,
  interactive,
  onToggleExpanded,
}: {
  title: string;
  activeLabel: string;
  collapsedStatusLabel: string;
  expanded: boolean;
  interactive: boolean;
  onToggleExpanded?: () => void;
}) {
  return (
    <Pressable
      onPress={onToggleExpanded}
      disabled={!onToggleExpanded}
      style={({ pressed }) => [
        styles.planCardHeaderPressable,
        interactive && pressed ? styles.planCardPressed : null,
      ]}
    >
      <View style={styles.planHeaderRow}>
        <View style={styles.planHeaderIconWrap}>
          <Image
            source={reminderFieldIcons.medicine}
            defaultSource={getLocalAssetDefaultSource(reminderFieldIcons.medicine)}
            style={styles.planHeaderIconImage as never}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>
        <View style={styles.planHeaderCopy}>
          <View style={styles.planTitleTopRow}>
            <Text style={styles.planTitle}>{title}</Text>
            <View style={styles.planHeaderTrailing}>
              <View style={styles.planActiveBadge}>
                <Text style={styles.planActiveBadgeText}>{activeLabel}</Text>
              </View>
              <Feather
                name={expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#9A88C7"
              />
            </View>
          </View>
          {!expanded && collapsedStatusLabel ? (
            <Text style={styles.planStatusText}>{collapsedStatusLabel}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function ReminderPlanCard({
  plan,
  stats,
  locale,
  medicationIntervalUnit,
  activeLabel,
  doseLabel,
  intervalLabel,
  limitLabel,
  notesLabel,
  loggedTodayLabel,
  ofLabel,
  lastDoseLabel,
  dailyLimitReachedLabel,
  giveAtLabel,
  nextDosePrefix,
  takeDoseNowLabel,
  loggingNowLabel,
  canTakeNow,
  isSubmittingDose,
  interactive,
  expanded,
  onToggleExpanded,
  onTakeDose,
  onEditDose,
  onEditInterval,
  onEditLimit,
  onEditNotes,
}: ReminderPlanCardProps) {
  const currentNow = new Date();
  const { collapsedLabel, disabledActionLabel } = getReminderCardStatusText(
    stats,
    {
      dailyLimitReached: dailyLimitReachedLabel,
      giveAtLabel,
      nextDosePrefix,
    },
    locale,
    currentNow,
  );

  return (
    <View style={styles.planCard}>
      <ReminderPlanCardHeader
        title={getReminderPlanDisplayTitle(plan, locale)}
        activeLabel={activeLabel}
        collapsedStatusLabel={collapsedLabel}
        expanded={expanded}
        interactive={interactive}
        onToggleExpanded={onToggleExpanded}
      />

      {expanded ? <View style={styles.planDivider} /> : null}

      {expanded ? (
        <View style={styles.planRows}>
          <Pressable
            onPress={interactive ? onEditDose : undefined}
            style={({ pressed }) => [
              styles.planDetailRow,
              interactive && pressed ? styles.planEditableRowPressed : null,
            ]}
          >
            <View style={[styles.planRowLead, styles.planRowLeadPeach]}>
              <Feather name="droplet" size={18} color="#F26F6C" />
            </View>
            <Text style={styles.planRowLabel}>{doseLabel}</Text>
            <Text style={styles.planRowValue}>{plan.doseAmount}</Text>
          </Pressable>
          <View style={styles.planRowDivider} />
          <Pressable
            onPress={interactive ? onEditInterval : undefined}
            style={({ pressed }) => [
              styles.planDetailRow,
              interactive && pressed ? styles.planEditableRowPressed : null,
            ]}
          >
            <View style={[styles.planRowLead, styles.planRowLeadSand]}>
              <Feather name="clock" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.planRowLabel}>{intervalLabel}</Text>
            <Text style={styles.planRowValue}>
              {formatReminderIntervalForUnit(
                plan.minIntervalMinutes,
                medicationIntervalUnit,
                locale,
              )}
            </Text>
          </Pressable>
          <View style={styles.planRowDivider} />
          <View style={styles.planDetailRow}>
            <View style={[styles.planRowLead, styles.planRowLeadMint]}>
              <Feather name="calendar" size={18} color="#22A665" />
            </View>
            <Text style={styles.planRowLabel}>{loggedTodayLabel}</Text>
            <Text style={styles.planRowValue}>
              {plan.maxDosesPerDay
                ? `${stats.todayCount} ${ofLabel} ${plan.maxDosesPerDay}`
                : String(stats.todayCount)}
            </Text>
          </View>
          {plan.maxDosesPerDay ? (
            <>
              <View style={styles.planRowDivider} />
              <Pressable
                onPress={interactive ? onEditLimit : undefined}
                style={({ pressed }) => [
                  styles.planDetailRow,
                  interactive && pressed ? styles.planEditableRowPressed : null,
                ]}
              >
                <View style={[styles.planRowLead, styles.planRowLeadMint]}>
                  <Feather name="shield" size={18} color="#22A665" />
                </View>
                <Text style={styles.planRowLabel}>{limitLabel}</Text>
                <Text style={styles.planRowValue}>
                  {String(plan.maxDosesPerDay)}
                </Text>
              </Pressable>
            </>
          ) : null}
          {stats.lastAdministration ? (
            <>
              <View style={styles.planRowDivider} />
              <View style={styles.planDetailRow}>
                <View style={[styles.planRowLead, styles.planRowLeadLavender]}>
                  <Feather name="check-circle" size={18} color="#8B6AD8" />
                </View>
                <Text style={styles.planRowLabel}>{lastDoseLabel}</Text>
                <Text style={styles.planRowValue}>
                  {formatReminderCardLastDose(
                    stats.lastAdministration.createdAt,
                    locale,
                  )}
                </Text>
              </View>
            </>
          ) : null}
          {plan.notes?.trim() ? (
            <>
              <View style={styles.planRowDivider} />
              <Pressable
                onPress={interactive ? onEditNotes : undefined}
                style={({ pressed }) => [
                  styles.planNoteRow,
                  interactive && pressed ? styles.planEditableRowPressed : null,
                ]}
              >
                <View style={[styles.planRowLead, styles.planRowLeadBlush]}>
                  <Feather name="edit-3" size={18} color="#B66F7E" />
                </View>
                <View style={styles.planNoteCopy}>
                  <Text style={styles.planRowLabel}>{notesLabel}</Text>
                  <Text style={styles.planNoteText} numberOfLines={2}>
                    {plan.notes.trim()}
                  </Text>
                </View>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      {expanded ? (
        <Pressable
          onPress={onTakeDose}
          disabled={!canTakeNow || !onTakeDose}
          style={[
            styles.takeDoseButton,
            canTakeNow
              ? styles.takeDoseButtonActive
              : styles.takeDoseButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.takeDoseButtonText,
              canTakeNow
                ? styles.takeDoseButtonTextActive
                : styles.takeDoseButtonTextDisabled,
            ]}
          >
            {isSubmittingDose
              ? loggingNowLabel
              : canTakeNow
                ? takeDoseNowLabel
                : disabledActionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  planCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#DDD0F4",
    backgroundColor: "#FBF7FF",
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: "#D9C8F3",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  planCardHeaderPressable: {
    borderRadius: 18,
  },
  planCardPressed: {
    backgroundColor: "#F6F0FF",
  },
  planHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planHeaderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  planHeaderIconImage: {
    width: 20,
    height: 20,
    transform: [{ scale: 1.08 }],
  },
  planHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  planTitleTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minWidth: 0,
  },
  planHeaderTrailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  planActiveBadge: {
    minHeight: 28,
    borderRadius: 14,
    backgroundColor: "#E8F8EF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  planActiveBadgeText: {
    color: "#22A665",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  planTitle: {
    color: "#1E2A3A",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "600",
    flex: 1,
    flexShrink: 1,
  },
  planStatusText: {
    marginTop: 2,
    color: "#7A5AC8",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
  planDivider: {
    height: 1,
    backgroundColor: "#EFE7E2",
    marginTop: 14,
    marginBottom: 12,
  },
  planRows: {
    gap: 0,
  },
  planDetailRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planEditableRowPressed: {
    opacity: 0.82,
  },
  planRowDivider: {
    height: 1,
    backgroundColor: "#EFE7E2",
  },
  planRowLead: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  planRowLeadPeach: {
    backgroundColor: "#FFF0ED",
  },
  planRowLeadSand: {
    backgroundColor: "#FFF4E4",
  },
  planRowLeadMint: {
    backgroundColor: "#E8F8EF",
  },
  planRowLeadLavender: {
    backgroundColor: "#F2EDFF",
  },
  planRowLeadBlush: {
    backgroundColor: "#FFF3F6",
  },
  planRowLabel: {
    flex: 1,
    color: "#142033",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400",
  },
  planRowValue: {
    color: "#142033",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "400",
    textAlign: "right",
    maxWidth: "42%",
  },
  planNoteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 2,
    minHeight: 46,
  },
  planNoteCopy: {
    flex: 1,
    gap: 2,
    paddingTop: 6,
  },
  planNoteText: {
    color: "#667085",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
  },
  takeDoseButton: {
    marginTop: 18,
    minHeight: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  takeDoseButtonActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.4,
    borderColor: "#F86F64",
  },
  takeDoseButtonDisabled: {
    borderWidth: 1.4,
    borderColor: "#E8D8D0",
    backgroundColor: "#FFFCF8",
  },
  takeDoseButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500",
  },
  takeDoseButtonTextActive: {
    color: "#F86F64",
  },
  takeDoseButtonTextDisabled: {
    color: "#8A97A8",
  },
});

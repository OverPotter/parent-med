import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import type { MobileAuthSession } from "../../auth/api/authApi";
import { ChildCard } from "../../children/model/childrenRedesign";
import {
  type MobileFeedingRecord,
  deleteMobileFeedingRecord,
  fetchMobileFeedingRecords,
} from "../api/feedingRecordsApi";
import { journalHeroAssets } from "../../../redesign/screens/journal/assets";
import { DateRangePickerSheet } from "../../../shared/components/DateRangePickerSheet";
import { JournalScreenScaffold } from "../../../shared/components/JournalScreenScaffold";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import { type MobileLocale, useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  buildRangeFromAllTime,
  buildRangeFromTrailingDays,
  formatDateRangeLabel,
  getInclusiveDaySpan,
  isDateWithinRange,
  localizeCustomDateRangeLabel,
  localizeCustomDateRangeSubtitle,
  type DateRangeValue,
} from "../../../shared/lib/dateRange";
import {
  buildFeedingMetricsFromApi,
  buildFeedingHistoryScreenContent,
  type FeedingMetric,
  type FeedingTimelineItem,
  filterFeedingRecordsByPeriod,
  mapFeedingTimelineFromApi,
} from "../model/feedingHistoryScreen";
import { styles } from "./feedingHistoryScreenStyles";

const feedingHeroDecor = journalHeroAssets.feeding;

type FeedingHistoryScreenProps = {
  authSession: MobileAuthSession;
  child: ChildCard;
  visible?: boolean;
  onBack?: () => void;
};

const noop = () => {};

export function FeedingHistoryScreen({
  authSession,
  child,
  visible = true,
  onBack = noop,
}: FeedingHistoryScreenProps) {
  const { locale } = useMobileI18n();
  const childDisplayName = resolveFeedingChildDisplayName(child, locale);
  const [activePeriodId, setActivePeriodId] = useState(
    buildFeedingHistoryScreenContent(locale, childDisplayName).periods.find((item) => item.active)?.id ?? "",
  );
  const [records, setRecords] = useState<MobileFeedingRecord[]>([]);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRangeValue | null>(null);
  const [loadErrorVisible, setLoadErrorVisible] = useState(false);
  const [pendingDeleteRecordId, setPendingDeleteRecordId] = useState<string | null>(null);
  const [deleteErrorVisible, setDeleteErrorVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    async function loadTimeline() {
      try {
        const items = await fetchMobileFeedingRecords(authSession, child.child.id);

        if (cancelled) {
          return;
        }

        setRecords(items);
        setLoadErrorVisible(false);
      } catch {
        if (!cancelled) {
          setLoadErrorVisible(true);
        }
      }
    }

    void loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [authSession, child.child.id, visible]);

  const filteredRecords = useMemo(() => {
    if (customRange) {
      return records.filter((item) => isDateWithinRange(item.recordedAt, customRange));
    }

    return filterFeedingRecordsByPeriod(records, activePeriodId);
  }, [activePeriodId, customRange, records]);
  const content = useMemo(
    () => buildFeedingHistoryScreenContent(locale, childDisplayName, activePeriodId),
    [activePeriodId, childDisplayName, locale],
  );
  const timeline = useMemo(
    () => mapFeedingTimelineFromApi(filteredRecords, locale),
    [filteredRecords, locale],
  );
  const metrics = useMemo(
    () =>
      buildFeedingMetricsFromApi(
        filteredRecords,
        locale,
        activePeriodId,
        customRange ? getInclusiveDaySpan(customRange) : undefined,
      ),
    [activePeriodId, customRange, filteredRecords, locale],
  );
  const customRangeLabel = customRange
    ? formatDateRangeLabel(customRange, locale)
    : null;
  const deleteDialogCopy = useMemo(() => buildFeedingDeleteDialogCopy(locale), [locale]);
  const deleteErrorCopy = useMemo(() => buildFeedingDeleteErrorCopy(locale), [locale]);
  const loadErrorCopy = useMemo(() => buildFeedingLoadErrorCopy(locale), [locale]);
  const showDeleteConfirm = visible && pendingDeleteRecordId !== null;
  const showDeleteError = visible && deleteErrorVisible;
  const showLoadError = visible && loadErrorVisible;

  const deleteRecord = async (recordId: string) => {
    try {
      await deleteMobileFeedingRecord(authSession, recordId);
      setRecords((current) => current.filter((entry) => entry.id !== recordId));
      setPendingDeleteRecordId(null);
    } catch {
      setPendingDeleteRecordId(null);
      setDeleteErrorVisible(true);
    }
  };

  return (
    <View style={styles.screenRoot}>
      <JournalScreenScaffold
        visible={visible}
        backLabel={content.backLabel}
        title={content.title}
        subtitle={content.subtitle}
        periods={content.periods}
        activePeriodId={customRange ? "" : activePeriodId}
        onSelectPeriod={(id) => {
          setCustomRange(null);
          setActivePeriodId(id);
        }}
        onBack={onBack}
        activeBackgroundColor="#FFEDE7"
        activeTextColor="#FF6E61"
        headerMarginBottom={14}
        segmentedMarginBottom={12}
        customRangeLabel={localizeCustomDateRangeLabel(locale)}
        customRangeActive={Boolean(customRange)}
        onPressCustomRange={() => setIsCustomRangeOpen(true)}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{content.heroTitle}</Text>
              <Text style={styles.heroSubtitle}>
                {customRange
                  ? localizeCustomDateRangeSubtitle(locale)
                  : content.heroSubtitle}
              </Text>
            </View>
            <View style={styles.heroVisual}>
              <Image
                source={feedingHeroDecor}
                style={styles.heroDecorAsset}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.metricsPanel}>
            {content.metrics.map((metric, index) => {
              const metricValue = metrics.find((item) => item.id === metric.id)?.value ?? metric.value;

              return (
                <View key={metric.id} style={styles.metricColumn}>
                  <MetricColumn metric={{ ...metric, value: metricValue }} />
                  {index < content.metrics.length - 1 ? (
                    <View style={styles.metricDivider} />
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.historyTitle}>{content.historyTitle}</Text>

        <View style={styles.timelineList}>
          {timeline.map((item) => (
            <TimelineRow
              key={item.id}
              item={item}
              onDelete={() => setPendingDeleteRecordId(item.id)}
            />
          ))}
        </View>
      </JournalScreenScaffold>

      {showDeleteConfirm ? (
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.confirmBackdrop}
            onPress={() => setPendingDeleteRecordId(null)}
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{deleteDialogCopy.title}</Text>
            <Text style={styles.confirmDescription}>{deleteDialogCopy.message}</Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setPendingDeleteRecordId(null)}
                style={({ pressed }) => [
                  styles.confirmButtonSecondary,
                  pressed ? styles.confirmButtonPressed : null,
                ]}
              >
                <Text style={styles.confirmButtonSecondaryText}>
                  {deleteDialogCopy.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void deleteRecord(pendingDeleteRecordId);
                }}
                style={({ pressed }) => [
                  styles.confirmButtonPrimary,
                  pressed ? styles.confirmButtonPressed : null,
                ]}
              >
                <Text style={styles.confirmButtonPrimaryText}>
                  {deleteDialogCopy.confirm}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {showDeleteError ? (
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.confirmBackdrop}
            onPress={() => setDeleteErrorVisible(false)}
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{deleteErrorCopy.title}</Text>
            <Text style={styles.confirmDescription}>{deleteErrorCopy.message}</Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setDeleteErrorVisible(false)}
                style={({ pressed }) => [
                  styles.confirmButtonPrimary,
                  pressed ? styles.confirmButtonPressed : null,
                ]}
              >
                <Text style={styles.confirmButtonPrimaryText}>
                  {deleteErrorCopy.confirm}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      {showLoadError ? (
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.confirmBackdrop}
            onPress={() => setLoadErrorVisible(false)}
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{loadErrorCopy.title}</Text>
            <Text style={styles.confirmDescription}>{loadErrorCopy.message}</Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setLoadErrorVisible(false)}
                style={({ pressed }) => [
                  styles.confirmButtonPrimary,
                  pressed ? styles.confirmButtonPressed : null,
                ]}
              >
                <Text style={styles.confirmButtonPrimaryText}>
                  {loadErrorCopy.confirm}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <DateRangePickerSheet
        visible={visible && isCustomRangeOpen}
        locale={locale}
        title={localizeCustomDateRangeLabel(locale)}
        subtitle={localizeRangeSheetSubtitle(locale)}
        initialRange={resolveInitialRange(activePeriodId, customRange, records)}
        onClose={() => setIsCustomRangeOpen(false)}
        onApply={(range) => {
          setCustomRange(range);
          setIsCustomRangeOpen(false);
        }}
      />
    </View>
  );
}

function resolveInitialRange(
  activePeriodId: string,
  customRange: DateRangeValue | null,
  records: MobileFeedingRecord[],
) {
  if (customRange) {
    return customRange;
  }

  if (activePeriodId === "24h") return buildRangeFromTrailingDays(1);
  if (activePeriodId === "7d") return buildRangeFromTrailingDays(7);
  if (activePeriodId === "30d") return buildRangeFromTrailingDays(30);
  return buildRangeFromAllTime(records.map((item) => item.recordedAt));
}

function localizeRangeSheetSubtitle(locale: MobileLocale) {
  if (locale === "ru") return "Выберите диапазон, чтобы посмотреть свои даты.";
  if (locale === "de") return "Wähle einen eigenen Zeitraum für die Anzeige.";
  if (locale === "pl") return "Wybierz własny zakres dat do podglądu.";
  return "Choose a custom date range to review data.";
}

function resolveFeedingChildDisplayName(child: ChildCard, locale: MobileLocale) {
  return (
    child.name?.trim() ||
    child.child.name?.trim() ||
    (locale === "ru"
      ? "ребёнок"
      : locale === "de"
        ? "Kind"
        : locale === "pl"
          ? "dziecko"
          : "child")
  );
}

function buildFeedingDeleteDialogCopy(locale: MobileLocale) {
  if (locale === "ru") {
    return {
      title: "Точно удалить?",
      message: "Запись кормления будет удалена без возможности восстановления.",
      cancel: "Нет",
      confirm: "Да, удалить",
    };
  }

  if (locale === "de") {
    return {
      title: "Wirklich löschen?",
      message: "Der Fütterungseintrag wird ohne Wiederherstellung gelöscht.",
      cancel: "Nein",
      confirm: "Ja, löschen",
    };
  }

  if (locale === "pl") {
    return {
      title: "Na pewno usunąć?",
      message: "Wpis karmienia zostanie usunięty bez możliwości przywrócenia.",
      cancel: "Nie",
      confirm: "Tak, usuń",
    };
  }

  return {
    title: "Are you sure?",
    message: "This feeding record will be deleted permanently.",
    cancel: "No",
    confirm: "Yes, delete",
  };
}

function buildFeedingDeleteErrorCopy(locale: MobileLocale) {
  if (locale === "ru") {
    return {
      title: "Не удалось удалить",
      message: "Попробуй ещё раз.",
      confirm: "Понятно",
    };
  }

  if (locale === "de") {
    return {
      title: "Löschen fehlgeschlagen",
      message: "Bitte versuche es erneut.",
      confirm: "Verstanden",
    };
  }

  if (locale === "pl") {
    return {
      title: "Nie udało się usunąć",
      message: "Spróbuj ponownie.",
      confirm: "Rozumiem",
    };
  }

  return {
    title: "Delete failed",
    message: "Please try again.",
    confirm: "OK",
  };
}

function buildFeedingLoadErrorCopy(locale: MobileLocale) {
  if (locale === "ru") {
    return {
      title: "Не удалось загрузить кормления",
      message: "Проверь соединение и попробуй ещё раз.",
      confirm: "Понятно",
    };
  }

  if (locale === "de") {
    return {
      title: "Fütterungen konnten nicht geladen werden",
      message: "Bitte prüfe die Verbindung und versuche es erneut.",
      confirm: "Verstanden",
    };
  }

  if (locale === "pl") {
    return {
      title: "Nie udało się załadować karmień",
      message: "Sprawdź połączenie i spróbuj ponownie.",
      confirm: "Rozumiem",
    };
  }

  return {
    title: "Failed to load feedings",
    message: "Check your connection and try again.",
    confirm: "OK",
  };
}

function MetricColumn({ metric }: { metric: FeedingMetric }) {
  const iconName = {
    amount: "baby-bottle-outline",
    time: "clock-time-four-outline",
    drop: "water-outline",
  }[metric.icon] as
    | "baby-bottle-outline"
    | "clock-time-four-outline"
    | "water-outline";

  return (
    <View style={styles.metricInner}>
      <View style={styles.metricIconWrap}>
        <MaterialCommunityIcons name={iconName} size={18} color="#FF7668" />
      </View>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <Text style={styles.metricLabel}>{metric.label}</Text>
    </View>
  );
}

function TimelineRow({
  item,
  onDelete,
}: {
  item: FeedingTimelineItem;
  onDelete: () => void;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeftColumn}>
        <View style={styles.timeCard}>
          <Text style={styles.timeValue}>{item.time}</Text>
          <Text style={styles.dayValue}>{item.day}</Text>
        </View>
      </View>

      <View style={styles.timelineCenterColumn}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>

      <SwipeToDeleteRow
        style={styles.timelineSwipeRow}
        onDelete={onDelete}
        deleteColor="#F29C86"
        deletePressedColor="#E88973"
      >
        <View style={styles.entryCard}>
          <View
            style={[
              styles.entryBadge,
              { backgroundColor: item.badgeBackground },
            ]}
          >
            <MaterialCommunityIcons
              name="baby-bottle-outline"
              size={20}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.entryCopy}>
            <Text style={styles.entryTitle}>{item.type}</Text>
            <Text style={styles.entryMeta}>{item.meta}</Text>
          </View>
        </View>
      </SwipeToDeleteRow>
    </View>
  );
}

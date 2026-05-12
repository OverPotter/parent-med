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
import { JournalScreenScaffold } from "../../../shared/components/JournalScreenScaffold";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import { type MobileLocale, useMobileI18n } from "../../../shared/i18n/mobileI18n";
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
      } catch {
        if (!cancelled) {
          setRecords([]);
        }
      }
    }

    void loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [authSession, child.child.id, visible]);

  const filteredRecords = useMemo(
    () => filterFeedingRecordsByPeriod(records, activePeriodId),
    [activePeriodId, records],
  );
  const content = useMemo(
    () => buildFeedingHistoryScreenContent(locale, childDisplayName, activePeriodId),
    [activePeriodId, childDisplayName, locale],
  );
  const timeline = useMemo(
    () => mapFeedingTimelineFromApi(filteredRecords, locale),
    [filteredRecords, locale],
  );
  const metrics = useMemo(
    () => buildFeedingMetricsFromApi(filteredRecords, locale, activePeriodId),
    [activePeriodId, filteredRecords, locale],
  );
  const deleteDialogCopy = useMemo(() => buildFeedingDeleteDialogCopy(locale), [locale]);
  const deleteErrorCopy = useMemo(() => buildFeedingDeleteErrorCopy(locale), [locale]);

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
    <JournalScreenScaffold
      visible={visible}
      backLabel={content.backLabel}
      title={content.title}
      subtitle={content.subtitle}
      periods={content.periods}
      activePeriodId={activePeriodId}
      onSelectPeriod={setActivePeriodId}
      onBack={onBack}
      activeBackgroundColor="#FFEDE7"
      activeTextColor="#FF6E61"
      headerMarginBottom={14}
      segmentedMarginBottom={12}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{content.heroTitle}</Text>
            <Text style={styles.heroSubtitle}>{content.heroSubtitle}</Text>
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

      {pendingDeleteRecordId ? (
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
      {deleteErrorVisible ? (
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
    </JournalScreenScaffold>
  );
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

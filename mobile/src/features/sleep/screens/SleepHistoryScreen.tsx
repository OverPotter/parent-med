import { useEffect, useMemo, useState } from "react";
import { Image, Text, View } from "react-native";
import type { MobileAuthSession } from "../../auth/api/authApi";
import { ChildCard } from "../../children/model/childrenRedesign";
import { journalHeroAssets } from "../../../redesign/screens/journal/assets";
import { DateRangePickerSheet } from "../../../shared/components/DateRangePickerSheet";
import { JournalScreenScaffold } from "../../../shared/components/JournalScreenScaffold";
import {
  type MobileLocale,
  useMobileI18n,
} from "../../../shared/i18n/mobileI18n";
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
  type MobileSleepSession,
  deleteMobileSleepSession,
  fetchMobileSleepSessions,
} from "../api/sleepSessionsApi";
import {
  buildSleepHistoryScreenContent,
  buildSleepMetricsFromApi,
  filterSleepSessionsByPeriod,
  mapSleepTimelineFromApi,
} from "../model/sleepHistoryScreen";
import {
  buildSleepDeleteDialogCopy,
  buildSleepDeleteErrorCopy,
  buildSleepLoadErrorCopy,
  localizeRangeSheetSubtitle,
} from "./sleepHistoryScreenCopy";
import {
  MetricColumn,
  SleepDialogOverlay,
  TimelineRow,
} from "./SleepHistoryScreenParts";
import { styles } from "./sleepHistoryScreenStyles";

const sleepHeroDecor = journalHeroAssets.sleep;

type SleepHistoryScreenProps = {
  authSession: MobileAuthSession;
  child: ChildCard;
  visible?: boolean;
  onBack?: () => void;
};

const noop = () => {};

export function SleepHistoryScreen({
  authSession,
  child,
  visible = true,
  onBack = noop,
}: SleepHistoryScreenProps) {
  const { locale } = useMobileI18n();
  const childDisplayName = resolveSleepChildDisplayName(child, locale);
  const [activePeriodId, setActivePeriodId] = useState(
    buildSleepHistoryScreenContent(locale, childDisplayName).periods.find(
      (item) => item.active,
    )?.id ?? "",
  );
  const [sessions, setSessions] = useState<MobileSleepSession[]>([]);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRangeValue | null>(null);
  const [loadErrorVisible, setLoadErrorVisible] = useState(false);
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(
    null,
  );
  const [deleteErrorVisible, setDeleteErrorVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    async function loadTimeline() {
      try {
        const items = await fetchMobileSleepSessions(authSession, child.child.id);

        if (cancelled) {
          return;
        }

        setSessions(items);
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

  const filteredSessions = useMemo(() => {
    if (customRange) {
      return sessions.filter((item) => isDateWithinRange(item.startedAt, customRange));
    }

    return filterSleepSessionsByPeriod(sessions, activePeriodId);
  }, [activePeriodId, customRange, sessions]);
  const content = useMemo(
    () => buildSleepHistoryScreenContent(locale, childDisplayName, activePeriodId),
    [activePeriodId, childDisplayName, locale],
  );
  const timeline = useMemo(
    () => mapSleepTimelineFromApi(filteredSessions, locale),
    [filteredSessions, locale],
  );
  const metrics = useMemo(
    () =>
      buildSleepMetricsFromApi(
        filteredSessions,
        locale,
        activePeriodId,
        customRange ? getInclusiveDaySpan(customRange) : undefined,
      ),
    [activePeriodId, customRange, filteredSessions, locale],
  );
  const customRangeLabel = customRange
    ? formatDateRangeLabel(customRange, locale)
    : null;
  const deleteDialogCopy = useMemo(
    () => buildSleepDeleteDialogCopy(locale),
    [locale],
  );
  const deleteErrorCopy = useMemo(
    () => buildSleepDeleteErrorCopy(locale),
    [locale],
  );
  const loadErrorCopy = useMemo(() => buildSleepLoadErrorCopy(locale), [locale]);
  const showDeleteConfirm = visible && pendingDeleteSessionId !== null;
  const showDeleteError = visible && deleteErrorVisible;
  const showLoadError = visible && loadErrorVisible;

  const deleteSession = async (sessionId: string) => {
    try {
      await deleteMobileSleepSession(authSession, sessionId);
      setSessions((current) => current.filter((entry) => entry.id !== sessionId));
      setPendingDeleteSessionId(null);
    } catch {
      setPendingDeleteSessionId(null);
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
        activeBackgroundColor="#EFE9FF"
        activeTextColor="#6F67C9"
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
            <View style={styles.heroDecorArea}>
              <Image
                source={sleepHeroDecor}
                style={styles.heroDecorAsset}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.metricsPanel}>
            {content.metrics.map((metric, index) => {
              const metricValue =
                metrics.find((item) => item.id === metric.id)?.value ?? metric.value;
              const metricSuffix =
                metrics.find((item) => item.id === metric.id)?.suffix ?? metric.suffix;

              return (
                <View key={metric.id} style={styles.metricColumn}>
                  <MetricColumn
                    metric={{ ...metric, value: metricValue, suffix: metricSuffix }}
                  />
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
              onDelete={() => setPendingDeleteSessionId(item.id)}
            />
          ))}
        </View>
      </JournalScreenScaffold>

      {showDeleteConfirm ? (
        <SleepDialogOverlay
          copy={deleteDialogCopy}
          onDismiss={() => setPendingDeleteSessionId(null)}
          onConfirm={() => {
            void deleteSession(pendingDeleteSessionId);
          }}
        />
      ) : null}

      {showDeleteError ? (
        <SleepDialogOverlay
          copy={deleteErrorCopy}
          onDismiss={() => setDeleteErrorVisible(false)}
          onConfirm={() => setDeleteErrorVisible(false)}
        />
      ) : null}

      {showLoadError ? (
        <SleepDialogOverlay
          copy={loadErrorCopy}
          onDismiss={() => setLoadErrorVisible(false)}
          onConfirm={() => setLoadErrorVisible(false)}
        />
      ) : null}

      <DateRangePickerSheet
        visible={visible && isCustomRangeOpen}
        locale={locale}
        title={localizeCustomDateRangeLabel(locale)}
        subtitle={localizeRangeSheetSubtitle(locale)}
        initialRange={resolveInitialRange(activePeriodId, customRange, sessions)}
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
  sessions: MobileSleepSession[],
) {
  if (customRange) {
    return customRange;
  }

  if (activePeriodId === "24h") return buildRangeFromTrailingDays(1);
  if (activePeriodId === "7d") return buildRangeFromTrailingDays(7);
  if (activePeriodId === "30d") return buildRangeFromTrailingDays(30);
  return buildRangeFromAllTime(sessions.map((item) => item.startedAt));
}

function resolveSleepChildDisplayName(
  child: ChildCard,
  locale: MobileLocale,
) {
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

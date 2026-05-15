import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import {
  getMobilePillboxHistorySummary,
  listMobilePillboxPlans,
  type MobilePillboxHistorySummary,
  type MobilePillboxPlanSummary,
} from "../api/mobilePillboxPlansApi";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  buildAnalyticsInsight,
  buildPillboxAnalyticsContent,
  resolveAnalyticsPlanLabel,
  type PillboxAnalyticsPeriodId,
} from "../model/pillboxAnalyticsScreen";
import { pillboxAnalyticsScreenStyles as styles } from "./pillboxAnalyticsScreenStyles";

const PERIOD_API_MAP: Record<PillboxAnalyticsPeriodId, "month" | "quarter" | "half_year" | "year" | "all"> = {
  month: "month",
  quarter: "quarter",
  half_year: "half_year",
  year: "year",
  all: "all",
};

const KPI_TONES = {
  adherence: {
    card: "kpiCardBlue",
    label: "kpiLabelBlue",
    value: "kpiValueBlue",
  },
  onTime: {
    card: "kpiCardGreen",
    label: "kpiLabelGreen",
    value: "kpiValueGreen",
  },
  late: {
    card: "kpiCardAmber",
    label: "kpiLabelAmber",
    value: "kpiValueAmber",
  },
  missed: {
    card: "kpiCardRed",
    label: "kpiLabelRed",
    value: "kpiValueRed",
  },
} as const;

export function PillboxAnalyticsScreen({
  visible,
  accessToken,
  locale,
  onBack,
}: {
  visible: boolean;
  accessToken: string | null;
  locale: MobileLocale;
  onBack: () => void;
}) {
  const surfaceTheme = useMobileSurfaceTheme();
  const content = useMemo(() => buildPillboxAnalyticsContent(locale), [locale]);
  const { width } = useWindowDimensions();
  const [plans, setPlans] = useState<MobilePillboxPlanSummary[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<PillboxAnalyticsPeriodId>("half_year");
  const [summary, setSummary] = useState<MobilePillboxHistorySummary | null>(null);
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [plansLoadFailed, setPlansLoadFailed] = useState(false);
  const [summaryLoadFailed, setSummaryLoadFailed] = useState(false);
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible && !isPickerOpen,
    width,
    onBack,
  });
  const requestLanguage = locale === "ru" ? "ru" : "en";

  const loadPlans = () => {
    if (!accessToken) {
      return Promise.resolve();
    }

    setIsPlansLoading(true);
    setPlansLoadFailed(false);
    return listMobilePillboxPlans({ accessToken })
      .then((items) => {
        setPlans(items);
        setSelectedPlanId((current) => {
          if (!current) {
            return items[0]?.id ?? null;
          }

          return items.some((item) => item.id === current)
            ? current
            : (items[0]?.id ?? null);
        });
      })
      .catch(() => {
        setPlans([]);
        setSelectedPlanId(null);
        setPlansLoadFailed(true);
      })
      .finally(() => {
        setIsPlansLoading(false);
      });
  };

  useEffect(() => {
    if (!visible) {
      setIsPickerOpen(false);
      return;
    }

    if (!accessToken) {
      return;
    }

    void loadPlans();
  }, [accessToken, visible]);

  useEffect(() => {
    if (!visible || !accessToken || !selectedPlanId) {
      setSummary(null);
      setSummaryLoadFailed(false);
      return;
    }

    setIsSummaryLoading(true);
    setSummaryLoadFailed(false);
    setSummary(null);
    void getMobilePillboxHistorySummary({
      accessToken,
      planId: selectedPlanId,
      period: PERIOD_API_MAP[selectedPeriodId],
      language: requestLanguage,
    })
      .then((response) => {
        setSummary(response);
      })
      .catch(() => {
        setSummary(null);
        setSummaryLoadFailed(true);
      })
      .finally(() => {
        setIsSummaryLoading(false);
      });
  }, [accessToken, requestLanguage, selectedPeriodId, selectedPlanId, visible]);

  const selectedPlanLabel = resolveAnalyticsPlanLabel(
    plans,
    selectedPlanId,
    locale,
  );

  const timelineMax = Math.max(...(summary?.timeline.map((item) => item.value) ?? [1]), 1);
  const insight = summary ? buildAnalyticsInsight(summary, locale) : null;

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
        source={redesignBackgrounds.childrenModule}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={[styles.overlay, { backgroundColor: surfaceTheme.backgroundOverlayColor }]} />
        <View style={styles.root}>
          <View style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]} {...panHandlers} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <Pressable onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>{"← "}{content.backLabel}</Text>
              </Pressable>
            </View>

            <View style={styles.hero}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{content.planLabel}</Text>
              <Text style={styles.cardSubtitle}>{content.planDescription}</Text>
              <Pressable
                onPress={() => setIsPickerOpen(true)}
                style={({ pressed }) => [
                  styles.planPickerButton,
                  pressed ? { opacity: 0.9, transform: [{ scale: 0.985 }] } : null,
                ]}
              >
                <Text style={styles.planPickerText}>{selectedPlanLabel}</Text>
                <Text style={styles.planPickerChevron}>⌄</Text>
              </Pressable>
            </View>

            <View style={styles.periodTabsWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodTabs}>
                {content.periods.map((item) => {
                  const active = item.id === selectedPeriodId;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedPeriodId(item.id)}
                      style={({ pressed }) => [
                        styles.periodTab,
                        active ? styles.periodTabActive : null,
                        pressed ? { opacity: 0.9, transform: [{ scale: 0.985 }] } : null,
                      ]}
                    >
                      <Text style={[styles.periodTabText, active ? styles.periodTabTextActive : null]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {plansLoadFailed ? (
              <View style={styles.mutedStateCard}>
                <Text style={styles.mutedStateTitle}>{content.plansErrorTitle}</Text>
                <Text style={styles.mutedStateText}>{content.plansErrorDescription}</Text>
                <Pressable
                  onPress={() => {
                    void loadPlans();
                  }}
                  style={({ pressed }) => [
                    styles.planPickerButton,
                    pressed ? { opacity: 0.9, transform: [{ scale: 0.985 }] } : null,
                  ]}
                >
                  <Text style={styles.planPickerText}>{content.retryLabel}</Text>
                </Pressable>
              </View>
            ) : !selectedPlanId ? (
              <View style={styles.mutedStateCard}>
                <Text style={styles.mutedStateTitle}>{content.emptyTitle}</Text>
                <Text style={styles.mutedStateText}>{content.emptyDescription}</Text>
              </View>
            ) : isPlansLoading || isSummaryLoading ? (
              <View style={styles.mutedStateCard}>
                <Text style={styles.mutedStateTitle}>{content.loadingTitle}</Text>
                <Text style={styles.mutedStateText}>{content.loadingDescription}</Text>
              </View>
            ) : summaryLoadFailed ? (
              <View style={styles.mutedStateCard}>
                <Text style={styles.mutedStateTitle}>{content.summaryErrorTitle}</Text>
                <Text style={styles.mutedStateText}>{content.summaryErrorDescription}</Text>
              </View>
            ) : !summary ? (
              <View style={styles.mutedStateCard}>
                <Text style={styles.mutedStateTitle}>{content.noDataTitle}</Text>
                <Text style={styles.mutedStateText}>{content.noDataDescription}</Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryHero}>
                  <View>
                    <Text style={styles.summaryTitle}>{summary.planTitle}</Text>
                  </View>

                  <View style={styles.kpiGrid}>
                    <View style={[styles.kpiCard, styles[KPI_TONES.adherence.card]]}>
                      <Text style={[styles.kpiLabel, styles[KPI_TONES.adherence.label]]}>
                        {content.adherenceLabel}
                      </Text>
                      <Text style={[styles.kpiValue, styles[KPI_TONES.adherence.value]]}>
                        {Math.round(summary.adherenceRate * 100)}%
                      </Text>
                    </View>
                    <View style={[styles.kpiCard, styles[KPI_TONES.onTime.card]]}>
                      <Text style={[styles.kpiLabel, styles[KPI_TONES.onTime.label]]}>
                        {content.onTimeLabel}
                      </Text>
                      <Text style={[styles.kpiValue, styles[KPI_TONES.onTime.value]]}>
                        {Math.round(summary.onTimeRate * 100)}%
                      </Text>
                    </View>
                    <View style={[styles.kpiCard, styles[KPI_TONES.late.card]]}>
                      <Text style={[styles.kpiLabel, styles[KPI_TONES.late.label]]}>
                        {content.lateLabel}
                      </Text>
                      <Text style={[styles.kpiValue, styles[KPI_TONES.late.value]]}>
                        {summary.lateSlots}
                      </Text>
                    </View>
                    <View style={[styles.kpiCard, styles[KPI_TONES.missed.card]]}>
                      <Text style={[styles.kpiLabel, styles[KPI_TONES.missed.label]]}>
                        {content.missedLabel}
                      </Text>
                      <Text style={[styles.kpiValue, styles[KPI_TONES.missed.value]]}>
                        {summary.missedSlots}
                      </Text>
                    </View>
                  </View>

                  {insight ? (
                    <View style={styles.summaryInsight}>
                      <Text style={styles.summaryInsightText}>{insight}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{content.timelineTitle}</Text>
                  <Text style={styles.cardSubtitle}>{content.timelineDescription}</Text>
                  <View style={styles.timelineBars}>
                    {summary.timeline.map((point) => (
                      <View key={point.label} style={styles.timelineItem}>
                        <View style={styles.timelineBarWrap}>
                          <View
                            style={[
                              styles.timelineBar,
                              { height: Math.max((point.value / timelineMax) * 92, 6) },
                            ]}
                          />
                        </View>
                        <Text style={styles.timelineValue}>{point.value}</Text>
                        <Text style={styles.timelineLabel}>{point.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{content.topMissedTitle}</Text>
                  {summary.topMissedMedications.length > 0 ? (
                    <View style={styles.topMissedList}>
                      {summary.topMissedMedications.map((item) => (
                        <View key={`${item.medicationName}-${item.missedSlots}`} style={styles.topMissedRow}>
                          <View style={styles.topMissedCopy}>
                            <Text style={styles.topMissedName}>{item.medicationName}</Text>
                            <Text style={styles.topMissedMeta}>
                              {locale === "ru"
                                ? "Чаще всего выпадает из режима"
                                : locale === "de"
                                  ? "Fällt am häufigsten aus dem Rhythmus"
                                  : locale === "pl"
                                    ? "Najczęściej wypada z rytmu"
                                    : "Most often slips out of routine"}
                            </Text>
                          </View>
                          <View style={styles.topMissedBadge}>
                            <Text style={styles.topMissedBadgeText}>
                              {locale === "ru"
                                ? `${item.missedSlots} проп.`
                                : locale === "de"
                                  ? `${item.missedSlots} verpasst`
                                  : locale === "pl"
                                    ? `${item.missedSlots} pom.`
                                    : `${item.missedSlots} missed`}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.cardSubtitle, { marginTop: 12 }]}>{content.topMissedEmpty}</Text>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>

        <FormBottomSheet
          visible={visible && isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          sheetStyle={styles.pickerSheetCard}
        >
          {({ panHandlers, requestClose }) => (
            <>
              <View {...panHandlers}>
                <Text style={styles.pickerSheetTitle}>
                  {locale === "ru"
                    ? "Выбрать план"
                    : locale === "de"
                      ? "Plan auswählen"
                      : locale === "pl"
                        ? "Wybierz plan"
                        : "Choose plan"}
                </Text>
                <Text style={styles.pickerSheetSubtitle}>
                  {locale === "ru"
                    ? "Переключайтесь между планами, чтобы посмотреть статистику по каждому."
                    : locale === "de"
                      ? "Wechseln Sie zwischen den Plänen, um die Statistik für jeden zu sehen."
                      : locale === "pl"
                        ? "Przełączaj się między planami, aby zobaczyć statystyki każdego z nich."
                        : "Switch between plans to view stats for each one."}
                </Text>
              </View>
              <View style={styles.pickerSheetList}>
                {plans.map((plan) => {
                  const active = plan.id === selectedPlanId;
                  return (
                    <Pressable
                      key={plan.id}
                      onPress={() =>
                        requestClose(() => {
                          setSelectedPlanId(plan.id);
                          setIsPickerOpen(false);
                        })
                      }
                      style={({ pressed }) => [
                        styles.pickerOption,
                        active ? styles.pickerOptionActive : null,
                        pressed ? { opacity: 0.9, transform: [{ scale: 0.985 }] } : null,
                      ]}
                    >
                      <Text style={styles.pickerOptionText}>{plan.title}</Text>
                      {active ? <Text style={styles.pickerOptionCheck}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </FormBottomSheet>
      </ImageBackground>
    </Animated.View>
  );
}

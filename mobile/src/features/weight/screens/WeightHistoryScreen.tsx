import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import type { MobileAuthSession } from "../../auth/api/authApi";
import { ChildCard } from "../../children/model/childrenRedesign";
import { journalHeroAssets } from "../../../redesign/screens/journal/assets";
import { DateRangePickerSheet } from "../../../shared/components/DateRangePickerSheet";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { JournalScreenScaffold } from "../../../shared/components/JournalScreenScaffold";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  buildRangeFromAllTime,
  buildRangeFromTrailingDays,
  formatDateRangeLabel,
  isDateWithinRange,
  localizeCustomDateRangeLabel,
  localizeCustomDateRangeSubtitle,
  type DateRangeValue,
} from "../../../shared/lib/dateRange";
import {
  createMobileWeightEntry,
  deleteMobileWeightEntry,
  fetchMobileWeightEntries,
  type MobileWeightEntry,
} from "../api/weightEntriesApi";
import {
  buildWeightMetricsFromApi,
  buildWeightHistoryScreenContent,
  filterWeightEntriesByPeriod,
  mapWeightTimelineFromApi,
} from "../model/weightHistoryScreen";
import { MetricColumn, TimelineRow } from "./WeightHistoryScreenParts";
import {
  buildWeightDeleteDialogCopy,
  buildWeightDeleteErrorCopy,
  buildWeightMeasurementSheetCopy,
  parseWeightValue,
} from "./weightHistoryScreenCopy";
import { styles } from "./weightHistoryScreenStyles";

const weightHeroDecor = journalHeroAssets.weight;

type WeightHistoryScreenProps = {
  authSession: MobileAuthSession;
  child: ChildCard;
  visible?: boolean;
  onBack?: () => void;
};

const noop = () => {};

export function WeightHistoryScreen({
  authSession,
  child,
  visible = true,
  onBack = noop,
}: WeightHistoryScreenProps) {
  const { locale } = useMobileI18n();
  const childDisplayName =
    child.name?.trim() ||
    child.child.name?.trim() ||
    (locale === "ru"
      ? "ребёнок"
      : locale === "de"
        ? "Kind"
        : locale === "pl"
          ? "dziecko"
          : "child");
  const [activePeriodId, setActivePeriodId] = useState(
    buildWeightHistoryScreenContent(locale, childDisplayName).periods.find(
      (item) => item.active,
    )?.id ?? "",
  );
  const [entries, setEntries] = useState<MobileWeightEntry[]>([]);
  const [measurementSheetVisible, setMeasurementSheetVisible] = useState(false);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRangeValue | null>(null);
  const [measurementValue, setMeasurementValue] = useState("");
  const [measurementError, setMeasurementError] = useState<string | null>(null);
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<string | null>(
    null,
  );
  const [deleteErrorVisible, setDeleteErrorVisible] = useState(false);
  const measurementSheetCopy = buildWeightMeasurementSheetCopy(locale);
  const deleteDialogCopy = buildWeightDeleteDialogCopy(locale);
  const deleteErrorCopy = buildWeightDeleteErrorCopy(locale);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    async function loadTimeline() {
      try {
        const items = await fetchMobileWeightEntries(authSession, child.child.id);

        if (cancelled) {
          return;
        }

        setEntries(items);
      } catch {
        if (!cancelled) {
          setEntries([]);
        }
      }
    }

    void loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [authSession, child.child.id, visible]);

  const filteredEntries = useMemo(() => {
    if (customRange) {
      return entries.filter((item) => isDateWithinRange(item.measuredAt, customRange));
    }

    return filterWeightEntriesByPeriod(entries, activePeriodId);
  }, [activePeriodId, customRange, entries]);
  const content = useMemo(
    () => buildWeightHistoryScreenContent(locale, childDisplayName, activePeriodId),
    [activePeriodId, childDisplayName, locale],
  );
  const timeline = useMemo(
    () => mapWeightTimelineFromApi(filteredEntries, locale),
    [filteredEntries, locale],
  );
  const metrics = useMemo(
    () => buildWeightMetricsFromApi(filteredEntries, locale),
    [filteredEntries, locale],
  );
  const customRangeLabel = customRange
    ? formatDateRangeLabel(customRange, locale)
    : null;
  const showDeleteConfirm = visible && pendingDeleteEntryId !== null;
  const showDeleteError = visible && deleteErrorVisible;

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
        activeBackgroundColor="#E8F8F4"
        activeTextColor="#2C8F85"
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
                source={weightHeroDecor}
                style={styles.heroDecorAsset}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.metricsPanel}>
            <View style={styles.metricsTopRow}>
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
            <Pressable
              onPress={() => {
                setMeasurementError(null);
                setMeasurementSheetVisible(true);
              }}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed ? styles.ctaButtonPressed : null,
              ]}
            >
              <View style={styles.ctaIconWrap}>
                <Ionicons name="add" size={20} color="#2C8F85" />
              </View>
              <Text style={styles.ctaLabel}>{content.ctaLabel}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.historyTitle}>{content.historyTitle}</Text>
        <View style={styles.timelineList}>
          {timeline.map((item) => (
            <TimelineRow
              key={item.id}
              item={item}
              onDelete={() => setPendingDeleteEntryId(item.id)}
            />
          ))}
        </View>
      </JournalScreenScaffold>

      {showDeleteConfirm ? (
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.confirmBackdrop}
            onPress={() => setPendingDeleteEntryId(null)}
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{deleteDialogCopy.title}</Text>
            <Text style={styles.confirmDescription}>{deleteDialogCopy.message}</Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setPendingDeleteEntryId(null)}
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
                  void handleDeleteEntry();
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

      <FormBottomSheet
        visible={visible && measurementSheetVisible}
        onClose={() => {
          setMeasurementSheetVisible(false);
          setMeasurementError(null);
        }}
        overlayStyle={styles.sheetOverlay}
        backdropStyle={styles.sheetBackdrop}
        sheetStyle={styles.measurementSheetCard}
        keyboardAvoiding
        keyboardBehavior="padding"
        keyboardVerticalOffset={0}
      >
        {({ panHandlers, requestClose }) => (
          <>
            <View style={styles.sheetDragZone} {...panHandlers}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{measurementSheetCopy.title}</Text>
              <Text style={styles.sheetSubtitle}>{measurementSheetCopy.subtitle}</Text>
            </View>

            <View style={styles.sheetBody}>
              <View style={styles.sheetField}>
                <Text style={styles.sheetFieldLabel}>
                  {measurementSheetCopy.weightLabel}
                </Text>
                <View style={styles.sheetInputWrap}>
                  <TextInput
                    value={measurementValue}
                    onChangeText={(next) => {
                      setMeasurementValue(next);
                      setMeasurementError(null);
                    }}
                    style={styles.sheetInput}
                    placeholder={measurementSheetCopy.weightPlaceholder}
                    placeholderTextColor="#98A7AB"
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                  <Text style={styles.sheetInputSuffix}>kg</Text>
                </View>
              </View>

              {measurementError ? (
                <Text style={styles.sheetErrorText}>{measurementError}</Text>
              ) : null}

              <View style={styles.sheetActions}>
                <Pressable
                  onPress={() => requestClose()}
                  style={({ pressed }) => [
                    styles.sheetSecondaryButton,
                    pressed ? styles.confirmButtonPressed : null,
                  ]}
                >
                  <Text style={styles.sheetSecondaryButtonText}>
                    {measurementSheetCopy.cancel}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void handleSaveMeasurement();
                  }}
                  style={({ pressed }) => [
                    styles.sheetPrimaryButton,
                    (pressed || isSavingMeasurement)
                      ? styles.confirmButtonPressed
                      : null,
                  ]}
                >
                  <Text style={styles.sheetPrimaryButtonText}>
                    {isSavingMeasurement
                      ? measurementSheetCopy.saving
                      : measurementSheetCopy.save}
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </FormBottomSheet>

      <DateRangePickerSheet
        visible={visible && isCustomRangeOpen}
        locale={locale}
        title={localizeCustomDateRangeLabel(locale)}
        subtitle={measurementSheetCopy.rangeSubtitle}
        initialRange={resolveInitialRange(activePeriodId, customRange, entries)}
        onClose={() => setIsCustomRangeOpen(false)}
        onApply={(range) => {
          setCustomRange(range);
          setIsCustomRangeOpen(false);
        }}
      />
    </View>
  );

  async function handleSaveMeasurement() {
    const parsedValue = parseWeightValue(measurementValue);

    if (parsedValue === null || parsedValue <= 0) {
      setMeasurementError(measurementSheetCopy.invalidWeight);
      return;
    }

    try {
      setIsSavingMeasurement(true);
      const created = await createMobileWeightEntry(authSession, {
        childId: child.child.id,
        valueKg: parsedValue,
      });

      setEntries((current) => [created, ...current]);
      setMeasurementValue("");
      setMeasurementError(null);
      setMeasurementSheetVisible(false);
    } catch {
      setMeasurementError(measurementSheetCopy.saveError);
    } finally {
      setIsSavingMeasurement(false);
    }
  }

  async function handleDeleteEntry() {
    if (!pendingDeleteEntryId) {
      return;
    }

    try {
      await deleteMobileWeightEntry(authSession, pendingDeleteEntryId);
      setEntries((current) =>
        current.filter((entry) => entry.id !== pendingDeleteEntryId),
      );
      setPendingDeleteEntryId(null);
    } catch {
      setPendingDeleteEntryId(null);
      setDeleteErrorVisible(true);
    }
  }
}

function resolveInitialRange(
  activePeriodId: string,
  customRange: DateRangeValue | null,
  entries: MobileWeightEntry[],
) {
  if (customRange) {
    return customRange;
  }

  if (activePeriodId === "24h") return buildRangeFromTrailingDays(1);
  if (activePeriodId === "7d") return buildRangeFromTrailingDays(7);
  if (activePeriodId === "30d") return buildRangeFromTrailingDays(30);
  return buildRangeFromAllTime(entries.map((item) => item.measuredAt));
}

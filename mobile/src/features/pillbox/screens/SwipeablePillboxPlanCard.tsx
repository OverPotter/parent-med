import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Image, PanResponder, Pressable, Text, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobilePillboxPlan } from "../api/mobilePillboxPlansApi";
import { pillboxCoreIcons } from "../assets/core";
import { pillboxMealIcons } from "../assets/meal";
import { pillboxTimeIcons } from "../assets/time";
import type { PillboxPlanCard } from "../model/pillboxHomeScreen";
import {
  localizePillboxCourse,
  localizePillboxFallback,
  localizePillboxMealRule,
  localizePillboxRepeatDays,
} from "../model/pillboxLocalization";
import {
  isPillboxStatusAlert,
  resolvePillboxStatusTone,
} from "../model/pillboxStatus";
import { pillboxHomeScreenStyles as styles } from "./pillboxHomeScreenStyles";

const SWIPE_DELETE_ACTION_WIDTH = 92;

function getDeletePlanA11yLabel(locale: MobileLocale, title: string) {
  if (locale === "ru") {
    return `Удалить план ${title}`;
  }
  if (locale === "de") {
    return `Plan ${title} löschen`;
  }
  if (locale === "pl") {
    return `Usuń plan ${title}`;
  }
  return `Delete plan ${title}`;
}

function getDeletePlanActionLabel(locale: MobileLocale, deleting: boolean) {
  if (deleting) {
    return "...";
  }
  if (locale === "ru") {
    return "Удалить";
  }
  if (locale === "de") {
    return "Löschen";
  }
  if (locale === "pl") {
    return "Usuń";
  }
  return "Delete";
}

function getExpandedPlanText(
  locale: MobileLocale,
  key: "loading" | "loadError" | "saving" | "markIntake" | "recipients",
) {
  if (locale === "ru") {
    return {
      loading: "Загружаем лекарства...",
      loadError: "Не получилось загрузить план.",
      saving: "Сохраняем...",
      markIntake: "Отметить приём",
      recipients: "Получатели",
    }[key];
  }
  if (locale === "de") {
    return {
      loading: "Medikamente werden geladen...",
      loadError: "Der Plan konnte nicht geladen werden.",
      saving: "Wird gespeichert...",
      markIntake: "Einnahme markieren",
      recipients: "Empfänger",
    }[key];
  }
  if (locale === "pl") {
    return {
      loading: "Ładowanie leków...",
      loadError: "Nie udało się załadować planu.",
      saving: "Zapisywanie...",
      markIntake: "Oznacz przyjęcie",
      recipients: "Odbiorcy",
    }[key];
  }
  return {
    loading: "Loading medicines...",
    loadError: "Could not load the plan.",
    saving: "Saving...",
    markIntake: "Mark intake",
    recipients: "Recipients",
  }[key];
}

export function SwipeablePillboxPlanCard({
  locale,
  item,
  isOpen,
  isExpanded,
  isLoadingExpanded,
  expandedPlan,
  deleting,
  updating,
  taking,
  onOpenSwipe,
  onCloseSwipe,
  onToggleExpand,
  onOpenMedicine,
  onOpenRecipients,
  onMarkIntake,
  onDelete,
}: {
  locale: MobileLocale;
  item: PillboxPlanCard;
  isOpen: boolean;
  isExpanded: boolean;
  isLoadingExpanded: boolean;
  expandedPlan: MobilePillboxPlan | null;
  deleting: boolean;
  updating: boolean;
  taking: boolean;
  onOpenSwipe: () => void;
  onCloseSwipe: () => void;
  onToggleExpand: () => void;
  onOpenMedicine: (medicineId: string) => void;
  onOpenRecipients: () => void;
  onMarkIntake: () => void;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeEnabled = !isExpanded;
  const swipeEnabledRef = useRef(swipeEnabled);
  swipeEnabledRef.current = swipeEnabled;

  const animateTo = (value: number, onComplete?: () => void) => {
    Animated.spring(translateX, {
      toValue: value,
      useNativeDriver: true,
      tension: 240,
      friction: 26,
    }).start(({ finished }) => {
      if (finished) {
        onComplete?.();
      }
    });
  };

  useEffect(() => {
    animateTo(isOpen ? -SWIPE_DELETE_ACTION_WIDTH : 0);
  }, [isOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        swipeEnabledRef.current &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        gestureState.dx < -12,
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const nextX = Math.max(
          -SWIPE_DELETE_ACTION_WIDTH,
          Math.min(0, gestureState.dx),
        );
        translateX.setValue(nextX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldOpen =
          gestureState.dx < -48 ||
          gestureState.vx < -0.45 ||
          (isOpen && gestureState.dx < -16);

        if (shouldOpen) {
          animateTo(-SWIPE_DELETE_ACTION_WIDTH, onOpenSwipe);
          return;
        }

        animateTo(0, onCloseSwipe);
      },
      onPanResponderTerminate: () => {
        animateTo(isOpen ? -SWIPE_DELETE_ACTION_WIDTH : 0);
      },
    }),
  ).current;

  const statusTone = resolvePillboxStatusTone(item.status);
  const statusChipStyle =
    statusTone === "attention"
      ? styles.statusChipAttention
      : statusTone === "missed"
        ? styles.statusChipMissed
        : statusTone === "completed"
          ? styles.statusChipCompleted
          : styles.statusChipActive;
  const statusTextStyle =
    statusTone === "attention"
      ? styles.statusTextAttention
      : statusTone === "missed"
        ? styles.statusTextMissed
        : statusTone === "completed"
          ? styles.statusTextCompleted
          : styles.statusTextActive;

  return (
    <View style={styles.swipePlanCardWrap}>
      {!isExpanded ? (
        <View style={styles.swipeDeleteActionWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={getDeletePlanA11yLabel(locale, item.title)}
            onPress={onDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.swipeDeleteAction,
              pressed ? styles.swipeDeleteActionPressed : null,
              deleting ? styles.swipeDeleteActionDisabled : null,
            ]}
          >
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            <Text style={styles.swipeDeleteActionText}>
              {getDeletePlanActionLabel(locale, deleting)}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Animated.View
        style={[styles.swipeCardAnimatedLayer, { transform: [{ translateX }] }]}
        {...(swipeEnabled ? panResponder.panHandlers : {})}
      >
        <Pressable
          onPress={() => {
            if (isOpen) {
              animateTo(0, onCloseSwipe);
              return;
            }
            onToggleExpand();
          }}
          style={({ pressed }) => [
            styles.planCard,
            isExpanded ? styles.planCardExpanded : null,
            pressed ? styles.buttonPressed : null,
          ]}
        >
          <View style={styles.planAvatar}>
            <Text style={styles.planAvatarText}>{item.avatarText}</Text>
          </View>
          <View style={styles.planMain}>
            <View style={styles.planTitleRow}>
              <Text numberOfLines={1} style={styles.planTitle}>
                {item.title}
              </Text>
            </View>
            <View style={styles.planMetaPill}>
              <Text numberOfLines={1} style={styles.planMetaPillText}>
                {item.medicineCount}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.planNextInfo,
                isPillboxStatusAlert(item.status)
                  ? styles.planMetaAttention
                  : null,
              ]}
            >
              {item.nextInfo}
            </Text>
          </View>

          <View style={styles.planRight}>
            <View style={[styles.statusChip, statusChipStyle]}>
              <Text style={[styles.statusChipText, statusTextStyle]}>
                {item.statusText}
              </Text>
            </View>
            <Text style={[styles.chevron, isExpanded ? styles.chevronExpanded : null]}>
              ›
            </Text>
          </View>
        </Pressable>

        {isExpanded ? (
          <View style={styles.planExpandedSection}>
            {isLoadingExpanded ? (
              <Text style={styles.planExpandedLoading}>
                {getExpandedPlanText(locale, "loading")}
              </Text>
            ) : expandedPlan ? (
              <View style={styles.planExpandedMedicineList}>
                {expandedPlan.medications.map((medicine) => (
                  <Pressable
                    key={medicine.id}
                    onPress={() => onOpenMedicine(medicine.id)}
                    style={({ pressed }) => [
                      styles.planExpandedMedicineCard,
                      pressed ? styles.buttonPressed : null,
                    ]}
                  >
                    <View style={styles.planExpandedMedicineTitleRow}>
                      <Image
                        source={pillboxCoreIcons.medicineName}
                        style={styles.planExpandedMetaIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.planExpandedMedicineTitle}>
                        {[
                          medicine.customMedicineName?.trim() ||
                            localizePillboxFallback("untitled", locale),
                          medicine.doseAmount.trim(),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </View>
                    <View style={styles.planExpandedMetaItem}>
                      <Image
                        source={resolveMealIcon(medicine.mealRule)}
                        style={styles.planExpandedMetaIcon}
                        resizeMode="contain"
                      />
                      <Text numberOfLines={1} style={styles.planExpandedMedicineSummary}>
                        {`${localizePillboxMealRule(medicine.mealRule, locale)} · ${localizePillboxRepeatDays(
                          medicine.repeatDays,
                          locale,
                        )}`}
                      </Text>
                    </View>
                    <View style={styles.planExpandedMetaItem}>
                      <Image
                        source={pillboxTimeIcons.chip}
                        style={styles.planExpandedMetaIcon}
                        resizeMode="contain"
                      />
                      <Text
                        numberOfLines={1}
                        style={styles.planExpandedMedicineCourse}
                      >
                        {`${medicine.times.join(", ") || localizePillboxFallback("noTime", locale)} · ${localizePillboxCourse(
                          medicine.courseMode,
                          medicine.courseEndDate,
                          locale,
                        )}`}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.planExpandedLoading}>
                {getExpandedPlanText(locale, "loadError")}
              </Text>
            )}

            <View style={styles.planExpandedActions}>
              {item.canMarkNow ? (
                <Pressable
                  onPress={onMarkIntake}
                  disabled={taking}
                  style={({ pressed }) => [
                    styles.planExpandedPrimaryAction,
                    pressed ? styles.buttonPressed : null,
                    taking ? styles.planExpandedActionDisabled : null,
                  ]}
                >
                  <Text style={styles.planExpandedPrimaryActionText}>
                    {taking
                      ? getExpandedPlanText(locale, "saving")
                      : getExpandedPlanText(locale, "markIntake")}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={onOpenRecipients}
                disabled={updating}
                style={({ pressed }) => [
                  styles.planExpandedSecondaryAction,
                  pressed ? styles.buttonPressed : null,
                  updating ? styles.planExpandedActionDisabled : null,
                ]}
              >
                <Text style={styles.planExpandedSecondaryActionText}>
                  {updating
                    ? getExpandedPlanText(locale, "saving")
                    : getExpandedPlanText(locale, "recipients")}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

function resolveMealIcon(mealRule: "before_meal" | "with_meal" | "after_meal" | "not_matter") {
  if (mealRule === "before_meal") {
    return pillboxMealIcons.beforeFood;
  }
  if (mealRule === "with_meal") {
    return pillboxMealIcons.withFood;
  }
  if (mealRule === "after_meal") {
    return pillboxMealIcons.afterFood;
  }
  return pillboxMealIcons.notMatter;
}

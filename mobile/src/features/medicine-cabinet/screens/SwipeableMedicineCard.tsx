import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Image, PanResponder, Pressable, Text, View } from "react-native";
import type { MedicineCardItem } from "../model/medicineCabinetOverviewModel";
import { resolveMedicineFormIcon } from "../model/medicineCabinetOverviewModel";
import { medicineCabinetOverviewStyles as styles } from "./medicineCabinetOverviewScreenStyles";

const SWIPE_DELETE_ACTION_WIDTH = 92;

export function SwipeableMedicineCard({
  item,
  isOpen,
  expanded,
  onOpenSwipe,
  onCloseSwipe,
  onToggleExpanded,
  onOpenRenew,
  onDelete,
}: {
  item: MedicineCardItem;
  isOpen: boolean;
  expanded: boolean;
  onOpenSwipe: () => void;
  onCloseSwipe: () => void;
  onToggleExpanded: () => void;
  onOpenRenew: () => void;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;

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
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx < -12,
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const nextX = Math.max(-SWIPE_DELETE_ACTION_WIDTH, Math.min(0, gestureState.dx));
        translateX.setValue(nextX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldOpen =
          gestureState.dx < -48 || gestureState.vx < -0.45 || (isOpen && gestureState.dx < -16);

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

  return (
    <View style={styles.swipeCardWrap}>
      <View style={styles.swipeDeleteActionWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Списать ${item.title}`}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.swipeDeleteAction,
            pressed ? styles.swipeDeleteActionPressed : null,
          ]}
        >
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          <Text style={styles.swipeDeleteActionText}>Списать</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[styles.swipeCardAnimatedLayer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Раскрыть карточку препарата ${item.title}`}
          onPress={() => {
            if (isOpen) {
              animateTo(0, onCloseSwipe);
              return;
            }
            onToggleExpanded();
          }}
          style={({ pressed }) => [
            styles.medicineCard,
            expanded ? styles.medicineCardExpanded : null,
            pressed ? styles.medicineCardPressed : null,
          ]}
        >
          <View style={styles.medicineCardRow}>
            <View
              style={[
                styles.medicineArtCircle,
                { backgroundColor: item.artBackgroundColor },
              ]}
            >
              <Image
                source={resolveMedicineFormIcon(item.medicineForm)}
                style={styles.medicineArtImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.medicineInfo}>
              <Text style={styles.medicineTitle}>{item.title}</Text>
              <Text style={styles.medicineSubtitle}>{item.subtitle}</Text>
              <View style={styles.tagRow}>
                {item.tags.map((tag) => (
                  <View
                    key={`${item.id}-${tag.text}`}
                    style={[styles.tag, { backgroundColor: tag.backgroundColor }]}
                  >
                    <Text style={[styles.tagText, { color: tag.textColor }]}>
                      {tag.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.medicineRight}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: item.statusBackgroundColor },
                ]}
              >
                <Text style={[styles.statusText, { color: item.statusTextColor }]}>
                  {item.statusText}
                </Text>
              </View>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#B79A91"
              />
            </View>
          </View>

          {expanded ? (
            <View style={styles.cardExpandedSection}>
              {item.description ? (
                <View style={styles.cardExpandedBlock}>
                  <Text style={styles.cardExpandedLabel}>О препарате</Text>
                  <Text style={styles.cardExpandedText}>{item.description}</Text>
                </View>
              ) : null}

              {item.dosage ? (
                <View style={styles.cardExpandedBlock}>
                  <Text style={styles.cardExpandedLabel}>Как принимать</Text>
                  <Text style={styles.cardExpandedText}>{item.dosage}</Text>
                </View>
              ) : null}

              {item.comment ? (
                <View style={styles.cardExpandedBlock}>
                  <Text style={styles.cardExpandedLabel}>Комментарий</Text>
                  <Text style={styles.cardExpandedText}>{item.comment}</Text>
                </View>
              ) : null}

              {item.expiryLabel || item.afterOpeningLabel || item.openedLabel ? (
                <View style={styles.cardExpandedFactsRow}>
                  {item.expiryLabel ? (
                    <View
                      style={[
                        styles.cardExpandedFactCard,
                        styles.cardExpandedFactCardDanger,
                      ]}
                    >
                      <Text style={styles.cardExpandedFactLabel}>Годен до</Text>
                      <Text style={styles.cardExpandedFactValue}>{item.expiryLabel}</Text>
                    </View>
                  ) : null}
                  {item.openedLabel ? (
                    <View style={styles.cardExpandedFactCard}>
                      <Text style={styles.cardExpandedFactLabel}>Дата вскрытия</Text>
                      <Text style={styles.cardExpandedFactValue}>{item.openedLabel}</Text>
                    </View>
                  ) : null}
                  {item.afterOpeningLabel ? (
                    <View
                      style={[
                        styles.cardExpandedFactCard,
                        styles.cardExpandedFactCardWarning,
                      ]}
                    >
                      <Text style={styles.cardExpandedFactLabel}>После открытия</Text>
                      <Text style={styles.cardExpandedFactValue}>{item.afterOpeningLabel}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Обновить упаковку ${item.title}`}
                onPress={onOpenRenew}
                style={({ pressed }) => [
                  styles.cardExpandedAction,
                  pressed ? styles.cardExpandedActionPressed : null,
                ]}
              >
                <Text style={styles.cardExpandedActionText}>Обновить упаковку</Text>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

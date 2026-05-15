import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, PanResponder, Pressable, Text, View } from "react-native";
import type { PillboxPlanCard } from "../model/pillboxHomeScreen";
import {
  isPillboxStatusAlert,
  resolvePillboxStatusTone,
} from "../model/pillboxStatus";
import { pillboxHomeScreenStyles as styles } from "./pillboxHomeScreenStyles";

const SWIPE_DELETE_ACTION_WIDTH = 92;

export function SwipeablePillboxPlanCard({
  item,
  isOpen,
  deleting,
  onOpenSwipe,
  onCloseSwipe,
  onOpenPlan,
  onDelete,
}: {
  item: PillboxPlanCard;
  isOpen: boolean;
  deleting: boolean;
  onOpenSwipe: () => void;
  onCloseSwipe: () => void;
  onOpenPlan: () => void;
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
      <View style={styles.swipeDeleteActionWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Удалить план ${item.title}`}
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
            {deleting ? "..." : "Удалить"}
          </Text>
        </Pressable>
      </View>

      <Animated.View
        style={[styles.swipeCardAnimatedLayer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={() => {
            if (isOpen) {
              animateTo(0, onCloseSwipe);
              return;
            }
            onOpenPlan();
          }}
          style={({ pressed }) => [
            styles.planCard,
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
                isPillboxStatusAlert(item.status) ? styles.planMetaAttention : null,
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
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

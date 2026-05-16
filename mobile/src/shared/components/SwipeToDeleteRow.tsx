import { Ionicons } from "@expo/vector-icons";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type SwipeToDeleteRowProps = {
  children: ReactNode;
  onDelete: () => void;
  onPress?: () => void;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  deleteColor?: string;
  deletePressedColor?: string;
  deleteLabel?: string | null;
  actionWidth?: number;
  borderRadius?: number;
};

const noop = () => {};

export function SwipeToDeleteRow({
  children,
  onDelete,
  onPress = noop,
  isOpen: isOpenProp,
  onOpenChange,
  deleteColor = "#FF6B5F",
  deletePressedColor = "#F45F54",
  deleteLabel = null,
  actionWidth = 88,
  borderRadius = 22,
}: SwipeToDeleteRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof isOpenProp === "boolean";
  const isOpen = isControlled ? isOpenProp : internalIsOpen;

  const commitOpenState = (nextIsOpen: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(nextIsOpen);
    }

    onOpenChange?.(nextIsOpen);
  };

  useEffect(() => {
    if (!isControlled) {
      return;
    }

    const nextValue = isOpenProp ? -actionWidth : 0;
    translateX.stopAnimation(() => {
      offsetRef.current = nextValue;
      translateX.setValue(nextValue);
    });
  }, [actionWidth, isControlled, isOpenProp, translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 6,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 6,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          translateX.stopAnimation((value) => {
            offsetRef.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          const nextValue = clamp(offsetRef.current + gesture.dx, -actionWidth, 0);
          translateX.setValue(nextValue);
        },
        onPanResponderRelease: (_, gesture) => {
          const nextValue = clamp(offsetRef.current + gesture.dx, -actionWidth, 0);
          const shouldOpen =
            nextValue <= -actionWidth * 0.35 || gesture.vx < -0.35;

          animateRow(translateX, shouldOpen ? -actionWidth : 0, () => {
            offsetRef.current = shouldOpen ? -actionWidth : 0;
            commitOpenState(shouldOpen);
          });
        },
        onPanResponderTerminate: () => {
          animateRow(translateX, isOpen ? -actionWidth : 0, () => {
            offsetRef.current = isOpen ? -actionWidth : 0;
          });
        },
      }),
    [actionWidth, isOpen, translateX],
  );

  const handleCardPress = () => {
    if (isOpen) {
      animateRow(translateX, 0, () => {
        offsetRef.current = 0;
        commitOpenState(false);
      });
      return;
    }

    onPress();
  };

  const handleDelete = () => {
    animateRow(translateX, -actionWidth, () => {
      offsetRef.current = -actionWidth;
      commitOpenState(true);
      onDelete();
    });
  };

  return (
    <View
      style={[
        styles.container,
        { borderRadius, backgroundColor: isOpen ? deleteColor : "transparent" },
      ]}
    >
      <View
        style={[
          styles.deleteActionWrap,
          {
            width: actionWidth,
            backgroundColor: deleteColor,
            borderTopRightRadius: borderRadius,
            borderBottomRightRadius: borderRadius,
          },
        ]}
      >
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteAction,
            {
              backgroundColor: pressed ? deletePressedColor : deleteColor,
              borderTopRightRadius: borderRadius,
              borderBottomRightRadius: borderRadius,
            },
          ]}
        >
          {deleteLabel ? (
            <Text style={styles.deleteLabel}>{deleteLabel}</Text>
          ) : (
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      <Animated.View
        style={[styles.contentWrap, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={handleCardPress} style={styles.pressable}>
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

function animateRow(
  value: Animated.Value,
  toValue: number,
  onComplete?: () => void,
) {
  Animated.spring(value, {
    toValue,
    useNativeDriver: true,
    damping: 22,
    stiffness: 150,
    mass: 1,
  }).start(() => {
    onComplete?.();
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignSelf: "stretch",
    overflow: "hidden",
    position: "relative",
  },
  deleteActionWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
  },
  deleteAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
  },
  contentWrap: {
    width: "100%",
    zIndex: 1,
  },
  pressable: {
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
});

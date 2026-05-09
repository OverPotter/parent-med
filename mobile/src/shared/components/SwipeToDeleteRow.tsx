import { Ionicons } from "@expo/vector-icons";
import { type ReactNode, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type SwipeToDeleteRowProps = {
  children: ReactNode;
  onDelete: () => void;
  onPress?: () => void;
  deleteColor?: string;
  deletePressedColor?: string;
  actionWidth?: number;
  borderRadius?: number;
};

const noop = () => {};

export function SwipeToDeleteRow({
  children,
  onDelete,
  onPress = noop,
  deleteColor = "#FF6B5F",
  deletePressedColor = "#F45F54",
  actionWidth = 88,
  borderRadius = 22,
}: SwipeToDeleteRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);

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
            setIsOpen(shouldOpen);
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
        setIsOpen(false);
      });
      return;
    }

    onPress();
  };

  const handleDelete = () => {
    animateRow(translateX, -actionWidth, () => {
      offsetRef.current = -actionWidth;
      setIsOpen(true);
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
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
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
    flex: 1,
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
  contentWrap: {
    flex: 1,
    width: "100%",
    zIndex: 1,
  },
  pressable: {
    width: "100%",
  },
});

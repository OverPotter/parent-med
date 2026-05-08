import { useEffect, useRef } from "react";
import { Animated, PanResponder } from "react-native";

type UseBottomSheetSwipeDismissArgs = {
  visible: boolean;
  onClose: () => void;
};

export function useBottomSheetSwipeDismiss({
  visible,
  onClose,
}: UseBottomSheetSwipeDismissArgs) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [translateY, visible]);

  const animateSheetBack = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 190,
      friction: 24,
    }).start();
  };

  const animateSheetClose = () => {
    Animated.timing(translateY, {
      toValue: 520,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 14 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.25,
      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 1.05) {
          animateSheetClose();
          return;
        }

        animateSheetBack();
      },
      onPanResponderTerminate: () => {
        animateSheetBack();
      },
    }),
  ).current;

  return {
    panHandlers: panResponder.panHandlers,
    translateY,
  };
}

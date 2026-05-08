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
  const closingRef = useRef(false);
  const handlePanMove = (dragY: number, dampen = 1) => {
    translateY.setValue(Math.max(0, dragY * dampen));
  };

  const handlePanRelease = (
    dragY: number,
    velocityY: number,
    closeDistance: number,
    closeVelocity: number,
  ) => {
    if (dragY > closeDistance || velocityY > closeVelocity) {
      animateSheetClose();
      return;
    }

    animateSheetBack();
  };

  useEffect(() => {
    closingRef.current = false;
    translateY.stopAnimation();
    translateY.setValue(0);
  }, [translateY, visible]);

  const animateSheetBack = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 190,
      friction: 24,
    }).start();
  };

  const animateSheetClose = (afterClose?: () => void) => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;
    Animated.timing(translateY, {
      toValue: 520,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        afterClose?.();
        onClose();
      }
      closingRef.current = false;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        gestureState.dy > 14 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.15,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 14 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.25,
      onPanResponderMove: (_, gestureState) => {
        handlePanMove(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        handlePanRelease(gestureState.dy, gestureState.vy, 120, 1.05);
      },
      onPanResponderTerminate: () => {
        animateSheetBack();
      },
    }),
  ).current;

  const sheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 22 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.35,
      onPanResponderMove: (_, gestureState) => {
        handlePanMove(gestureState.dy, 0.92);
      },
      onPanResponderRelease: (_, gestureState) => {
        handlePanRelease(gestureState.dy, gestureState.vy, 180, 1.45);
      },
      onPanResponderTerminate: () => {
        animateSheetBack();
      },
    }),
  ).current;

  return {
    panHandlers: panResponder.panHandlers,
    sheetPanHandlers: sheetPanResponder.panHandlers,
    translateY,
    requestClose: animateSheetClose,
  };
}

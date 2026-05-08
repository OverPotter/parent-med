import { useEffect, useRef } from "react";
import { Animated, PanResponder } from "react-native";

type UseEdgeSwipeBackArgs = {
  enabled: boolean;
  width: number;
  onBack: () => void;
};

export function useEdgeSwipeBack({
  enabled,
  width,
  onBack,
}: UseEdgeSwipeBackArgs) {
  const translateX = useRef(new Animated.Value(0)).current;
  const enabledRef = useRef(enabled);
  const swipeCaptureWidth = Math.min(72, width * 0.16);

  useEffect(() => {
    enabledRef.current = enabled;
    if (enabled) {
      translateX.setValue(0);
    }
  }, [enabled, translateX]);

  const animateBackToStart = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 220,
      friction: 26,
    }).start();
  };

  const animateBackAndClose = () => {
    Animated.timing(translateX, {
      toValue: width,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onBack();
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!enabledRef.current) {
          return false;
        }

        const startedNearLeftEdge = gestureState.x0 <= swipeCaptureWidth;
        const isHorizontalSwipe =
          gestureState.dx > 18 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.38;

        return startedNearLeftEdge && isHorizontalSwipe;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(Math.max(0, gestureState.dx));
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldGoBack =
          gestureState.dx > Math.max(92, width * 0.18) ||
          gestureState.vx > 0.82;

        if (shouldGoBack) {
          animateBackAndClose();
          return;
        }

        animateBackToStart();
      },
      onPanResponderTerminate: () => {
        animateBackToStart();
      },
    }),
  ).current;

  return {
    panHandlers: panResponder.panHandlers,
    swipeCaptureWidth,
    translateX,
  };
}

import { useEffect, useRef } from "react";
import { Animated, PanResponder } from "react-native";

type UseEdgeSwipeBackArgs = {
  enabled: boolean;
  width: number;
  onBack: () => void;
  shouldCloseOnBack?: boolean;
  shouldTranslateOnSwipe?: boolean;
  captureWidth?: number;
};

const IOS_LIKE_EDGE_CAPTURE_WIDTH = 28;
const SWIPE_BACK_TRIGGER_DISTANCE = 92;
const SWIPE_BACK_TRIGGER_VELOCITY = 0.82;

export function useEdgeSwipeBack({
  enabled,
  width,
  onBack,
  shouldCloseOnBack = true,
  shouldTranslateOnSwipe = true,
  captureWidth,
}: UseEdgeSwipeBackArgs) {
  const translateX = useRef(new Animated.Value(0)).current;
  const enabledRef = useRef(enabled);
  const onBackRef = useRef(onBack);
  const widthRef = useRef(width);
  const shouldCloseOnBackRef = useRef(shouldCloseOnBack);
  const shouldTranslateOnSwipeRef = useRef(shouldTranslateOnSwipe);
  const swipeCaptureWidth =
    captureWidth ?? Math.min(IOS_LIKE_EDGE_CAPTURE_WIDTH, width * 0.1);

  useEffect(() => {
    enabledRef.current = enabled;
    if (enabled) {
      translateX.setValue(0);
    }
  }, [enabled, translateX]);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(() => {
    shouldCloseOnBackRef.current = shouldCloseOnBack;
  }, [shouldCloseOnBack]);

  useEffect(() => {
    shouldTranslateOnSwipeRef.current = shouldTranslateOnSwipe;
    if (!shouldTranslateOnSwipe) {
      translateX.setValue(0);
    }
  }, [shouldTranslateOnSwipe, translateX]);

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
      toValue: widthRef.current,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onBackRef.current();
      }
    });
  };

  const animateBackWithinScreen = (startX: number) => {
    const nextStartX = Math.max(0, Math.min(startX, widthRef.current));
    onBackRef.current();
    translateX.setValue(nextStartX);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 220,
      friction: 26,
    }).start();
  };

  const resetWithoutBack = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 220,
      friction: 26,
    }).start();
  };

  const triggerBackWithoutTranslate = () => {
    onBackRef.current();
    translateX.setValue(0);
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
        if (!shouldTranslateOnSwipeRef.current) {
          return;
        }

        translateX.setValue(Math.max(0, gestureState.dx));
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldGoBack =
          gestureState.dx > Math.max(SWIPE_BACK_TRIGGER_DISTANCE, widthRef.current * 0.18) ||
          gestureState.vx > SWIPE_BACK_TRIGGER_VELOCITY;

        if (shouldGoBack) {
          if (!shouldTranslateOnSwipeRef.current) {
            triggerBackWithoutTranslate();
            return;
          }
          if (shouldCloseOnBackRef.current) {
            animateBackAndClose();
          } else {
            animateBackWithinScreen(gestureState.dx);
          }
          return;
        }

        resetWithoutBack();
      },
      onPanResponderTerminate: () => {
        resetWithoutBack();
      },
    }),
  ).current;

  return {
    panHandlers: panResponder.panHandlers,
    swipeCaptureWidth,
    translateX,
  };
}

import { ReactNode } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useBottomSheetSwipeDismiss } from "../hooks/useBottomSheetSwipeDismiss";

type FormBottomSheetRenderProps = {
  panHandlers: ReturnType<typeof useBottomSheetSwipeDismiss>["panHandlers"];
  requestClose: ReturnType<typeof useBottomSheetSwipeDismiss>["requestClose"];
};

type FormBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  sheetStyle: StyleProp<ViewStyle>;
  overlayStyle?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  keepMountedPreview?: boolean;
  keyboardAvoiding?: boolean;
  keyboardBehavior?: "height" | "position" | "padding";
  keyboardVerticalOffset?: number;
  children: (props: FormBottomSheetRenderProps) => ReactNode;
};

export function FormBottomSheet({
  visible,
  onClose,
  sheetStyle,
  overlayStyle,
  backdropStyle,
  keepMountedPreview = false,
  keyboardAvoiding = false,
  keyboardBehavior,
  keyboardVerticalOffset = 18,
  children,
}: FormBottomSheetProps) {
  const { panHandlers, requestClose, translateY } = useBottomSheetSwipeDismiss({
    visible,
    onClose,
  });

  const sheetNode = (
    <Animated.View style={[sheetStyle, { transform: [{ translateY }] }]}>
      <View style={styles.sheetContent}>
        {children({ panHandlers, requestClose })}
      </View>
    </Animated.View>
  );

  if (!visible) {
    if (!keepMountedPreview) {
      return null;
    }

    return (
      <View pointerEvents="none" style={styles.hiddenPreview}>
        {sheetNode}
      </View>
    );
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={() => requestClose()}
      statusBarTranslucent
    >
      {keyboardAvoiding ? (
        <View style={[styles.overlay, overlayStyle]} pointerEvents="box-none">
          <Pressable
            style={[styles.backdrop, backdropStyle]}
            onPress={() => requestClose()}
          />
          <KeyboardAvoidingView
            style={styles.keyboardRoot}
            behavior={
              Platform.OS === "ios"
                ? (keyboardBehavior ?? "padding")
                : undefined
            }
            keyboardVerticalOffset={keyboardVerticalOffset}
            pointerEvents="box-none"
          >
            <View style={styles.sheetDock} pointerEvents="box-none">
              {sheetNode}
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : (
        <View style={[styles.overlay, overlayStyle]} pointerEvents="auto">
          <Pressable
            style={[styles.backdrop, backdropStyle]}
            onPress={() => requestClose()}
          />
          <View style={styles.sheetDock} pointerEvents="box-none">
            {sheetNode}
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardRoot: {
    flex: 1,
  },
  sheetDock: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetContent: {
    width: "100%",
  },
  hiddenPreview: {
    position: "absolute",
    top: -9999,
    left: -9999,
    width: 420,
    opacity: 0,
  },
});

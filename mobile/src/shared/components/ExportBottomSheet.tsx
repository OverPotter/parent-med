import { ReactNode } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useBottomSheetSwipeDismiss } from "../hooks/useBottomSheetSwipeDismiss";

type ExportBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  sheetStyle: StyleProp<ViewStyle>;
  overlayStyle?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function ExportBottomSheet({
  visible,
  onClose,
  sheetStyle,
  overlayStyle,
  backdropStyle,
  children,
}: ExportBottomSheetProps) {
  const { sheetPanHandlers, requestClose, translateY } =
    useBottomSheetSwipeDismiss({
      visible,
      onClose,
    });

  if (!visible) {
    return null;
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
      <View style={[styles.overlay, overlayStyle]} pointerEvents="auto">
        <Pressable
          style={[styles.backdrop, backdropStyle]}
          onPress={() => requestClose()}
        />
        <Animated.View
          style={[sheetStyle, { transform: [{ translateY }] }]}
          {...sheetPanHandlers}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
});

import type { ReactNode } from "react";
import {
  Modal,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type FullscreenSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  children: (props: { requestClose: () => void }) => ReactNode;
};

export function FullscreenSheetModal({
  visible,
  onClose,
  contentStyle,
  children,
}: FullscreenSheetModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.content, contentStyle]}>
          {children({ requestClose: onClose })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#FFF1F8",
  },
  content: {
    flex: 1,
  },
});

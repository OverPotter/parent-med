import { Pressable, Text, TextInput, View } from "react-native";

type CustomNumberPromptProps = {
  visible: boolean;
  title: string;
  description: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  suffix?: string | null;
  maxLength?: number;
  cancelLabel: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  styles: {
    confirmOverlay: object;
    confirmBackdrop: object;
    confirmCard: object;
    confirmTitle: object;
    confirmDescription: object;
    customIntervalInputWrap: object;
    customIntervalInput: object;
    customIntervalSuffix: object;
    confirmActions: object;
    confirmButtonSecondary: object;
    buttonPressed: object;
    confirmButtonSecondaryText: object;
    confirmButtonPrimary: object;
    confirmButtonPrimaryText: object;
  };
};

export function CustomNumberPrompt({
  visible,
  title,
  description,
  value,
  onChangeText,
  placeholder,
  suffix,
  maxLength,
  cancelLabel,
  confirmLabel,
  onClose,
  onConfirm,
  styles,
}: CustomNumberPromptProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.confirmOverlay}>
      <Pressable style={styles.confirmBackdrop} onPress={onClose} />
      <View style={styles.confirmCard}>
        <Text style={styles.confirmTitle}>{title}</Text>
        <Text style={styles.confirmDescription}>{description}</Text>
        <View style={styles.customIntervalInputWrap}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            style={styles.customIntervalInput}
            placeholder={placeholder}
            placeholderTextColor="#98A7AB"
            keyboardType="number-pad"
            maxLength={maxLength ?? 4}
          />
          {suffix ? (
            <Text style={styles.customIntervalSuffix}>{suffix}</Text>
          ) : null}
        </View>
        <View style={styles.confirmActions}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.confirmButtonSecondary,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.confirmButtonSecondaryText}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.confirmButtonPrimary,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.confirmButtonPrimaryText}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

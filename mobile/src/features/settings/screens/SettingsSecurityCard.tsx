import { Feather } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ExpandableHeaderRow } from "./SettingsSharedParts";
import { styles } from "./settingsScreenStyles";

export function SecuritySettingsCard({
  passwordTitle,
  passwordHint,
  passwordExpanded,
  onTogglePassword,
  currentPasswordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
  passwordForm,
  passwordInlineHint,
  onChangePasswordField,
  onPasswordFieldFocus,
  onSavePassword,
  savePasswordLabel,
  recoveryCodeTitle,
  recoveryCodeHint,
  recoveryCodeConfiguredHint,
  hasRecoveryCode,
  recoveryCodeExpanded,
  onToggleRecoveryCode,
  recoveryCode,
  recoveryCodeLabel,
  onChangeRecoveryCode,
  onSaveRecoveryCode,
  saveRecoveryCodeLabel,
}: {
  passwordTitle: string;
  passwordHint: string;
  passwordExpanded: boolean;
  onTogglePassword: () => void;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  passwordInlineHint: string | null;
  onChangePasswordField: (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string,
  ) => void;
  onPasswordFieldFocus: () => void;
  onSavePassword: () => void;
  savePasswordLabel: string;
  recoveryCodeTitle: string;
  recoveryCodeHint: string;
  recoveryCodeConfiguredHint: string;
  hasRecoveryCode: boolean;
  recoveryCodeExpanded: boolean;
  onToggleRecoveryCode: () => void;
  recoveryCode: string;
  recoveryCodeLabel: string;
  onChangeRecoveryCode: (value: string) => void;
  onSaveRecoveryCode: () => void;
  saveRecoveryCodeLabel: string;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <>
      <ExpandableHeaderRow
        icon={<Feather name="lock" size={22} color="#7B6B65" />}
        iconStyle={styles.rowLeadNeutral}
        title={passwordTitle}
        hint={passwordHint}
        expanded={passwordExpanded}
        onPress={onTogglePassword}
      />
      {passwordExpanded ? (
        <View style={styles.passwordEditorBlock}>
          <View style={styles.passwordFieldsStack}>
            <TextInput
              value={passwordForm.currentPassword}
              onChangeText={(value) => onChangePasswordField("currentPassword", value)}
              onFocus={onPasswordFieldFocus}
              placeholder={currentPasswordLabel}
              placeholderTextColor={surfaceTheme.textMutedColor}
              secureTextEntry
              style={[
                styles.input,
                styles.inputStandalone,
                {
                  color: surfaceTheme.textPrimaryColor,
                  backgroundColor: surfaceTheme.inputBackgroundColor,
                  borderColor: surfaceTheme.inputBorderColor,
                },
              ]}
            />
            <TextInput
              value={passwordForm.newPassword}
              onChangeText={(value) => onChangePasswordField("newPassword", value)}
              onFocus={onPasswordFieldFocus}
              placeholder={newPasswordLabel}
              placeholderTextColor={surfaceTheme.textMutedColor}
              secureTextEntry
              style={[
                styles.input,
                styles.inputStandalone,
                {
                  color: surfaceTheme.textPrimaryColor,
                  backgroundColor: surfaceTheme.inputBackgroundColor,
                  borderColor: surfaceTheme.inputBorderColor,
                },
              ]}
            />
            <TextInput
              value={passwordForm.confirmPassword}
              onChangeText={(value) => onChangePasswordField("confirmPassword", value)}
              onFocus={onPasswordFieldFocus}
              placeholder={confirmPasswordLabel}
              placeholderTextColor={surfaceTheme.textMutedColor}
              secureTextEntry
              style={[
                styles.input,
                styles.inputStandalone,
                {
                  color: surfaceTheme.textPrimaryColor,
                  backgroundColor: surfaceTheme.inputBackgroundColor,
                  borderColor: surfaceTheme.inputBorderColor,
                },
              ]}
            />
          </View>
          {passwordInlineHint ? (
            <Text style={styles.fieldError}>{passwordInlineHint}</Text>
          ) : null}
          <Pressable
            onPress={onSavePassword}
            style={({ pressed }) => [
              styles.primaryAction,
              styles.passwordAction,
              pressed ? styles.primaryActionPressed : null,
            ]}
          >
            <Text style={styles.primaryActionText}>{savePasswordLabel}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.rowDivider} />

      <ExpandableHeaderRow
        icon={<Feather name="shield" size={22} color="#7B6B65" />}
        iconStyle={styles.rowLeadNeutral}
        title={recoveryCodeTitle}
        hint={hasRecoveryCode ? recoveryCodeConfiguredHint : recoveryCodeHint}
        expanded={!hasRecoveryCode && recoveryCodeExpanded}
        onPress={onToggleRecoveryCode}
        locked={hasRecoveryCode}
      />
      {!hasRecoveryCode && recoveryCodeExpanded ? (
        <View style={styles.editorBlock}>
          <TextInput
            value={recoveryCode}
            onChangeText={onChangeRecoveryCode}
            placeholder={recoveryCodeLabel}
            placeholderTextColor={surfaceTheme.textMutedColor}
            autoCapitalize="characters"
            style={[
              styles.input,
              {
                color: surfaceTheme.textPrimaryColor,
                backgroundColor: surfaceTheme.inputBackgroundColor,
                borderColor: surfaceTheme.inputBorderColor,
                borderWidth: 1,
                borderRadius: 20,
              },
            ]}
          />
          <Pressable
            onPress={onSaveRecoveryCode}
            style={({ pressed }) => [
              styles.primaryAction,
              pressed ? styles.primaryActionPressed : null,
            ]}
          >
            <Text style={styles.primaryActionText}>{saveRecoveryCodeLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

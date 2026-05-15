import { useEffect, useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import { updateRecoveryCode } from "../features/settings/api/settingsApi";
import { useMobileSurfaceTheme } from "../shared/theme/mobileSurfaceTheme";
import type { PostAuthOnboardingStep } from "./postAuthOnboardingModel";

const GENERIC_RELATIONSHIP_LABELS = new Set([
  "Участник семьи",
  "Family member",
  "Familienmitglied",
  "Członek rodziny",
]);

function normalizeOnboardingRelationshipLabel(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed || GENERIC_RELATIONSHIP_LABELS.has(trimmed)) {
    return "";
  }

  return trimmed;
}

export function PostAuthOnboardingOverlay({
  session,
  visibleStep,
  onSkipDisplayName,
  onSkipRecoveryCode,
  onSaveDisplayName,
  onRecoveryCodeSaved,
}: {
  session: MobileAuthSession;
  visibleStep: PostAuthOnboardingStep;
  onSkipDisplayName: () => void | Promise<void>;
  onSkipRecoveryCode: () => void | Promise<void>;
  onSaveDisplayName: (patch: {
    displayName: string;
    relationshipLabel: string | null;
    phone: string | null;
  }) => void | Promise<void>;
  onRecoveryCodeSaved: () => void | Promise<void>;
}) {
  const theme = useMobileSurfaceTheme();
  const [displayName, setDisplayName] = useState(session.account.displayName ?? "");
  const [relationshipLabel, setRelationshipLabel] = useState(
    normalizeOnboardingRelationshipLabel(session.account.relationshipLabel),
  );
  const [phone, setPhone] = useState(session.account.phone ?? "");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visibleStep !== "display-name") {
      return;
    }

    setDisplayName(session.account.displayName ?? "");
    setRelationshipLabel(
      normalizeOnboardingRelationshipLabel(session.account.relationshipLabel),
    );
    setPhone(session.account.phone ?? "");
    setError(null);
  }, [
    session.account.displayName,
    session.account.phone,
    session.account.relationshipLabel,
    visibleStep,
  ]);

  useEffect(() => {
    if (visibleStep !== "recovery-code") {
      return;
    }

    setRecoveryCode("");
    setError(null);
  }, [visibleStep]);

  const copy = useMemo(() => {
    const locale = session.account.preferredLanguage;
    if (locale === "ru") {
      return {
        profileStepLabel: "Профиль",
        recoveryStepShortLabel: "Recovery",
        laterLabel: "Позже",
        displayTitle: "Как вас показывать в семье?",
        displayHint:
          "Это имя увидят в семейной ленте, аптечке и отметках о приёмах.",
        displayNameFieldLabel: "Ваше имя",
        displayNameLabel: "Имя в семье",
        relationshipFieldLabel: "Роль",
        relationshipLabel: "Кто вы в семье",
        phoneFieldLabel: "Телефон",
        phoneLabel: "Телефон",
        saveDisplayLabel: "Сохранить",
        displayNameRequired: "Добавьте имя, чтобы продолжить.",
        recoveryTitle: "Добавьте recovery code",
        recoveryHint:
          "Если забудете пароль, этот код поможет быстро вернуть доступ.",
        recoveryCodeFieldLabel: "Recovery code",
        recoveryCodeLabel: "Recovery code",
        saveRecoveryLabel: "Сохранить code",
        recoveryTooShort: "Recovery code должен быть не короче 8 символов.",
        saveError: "Не удалось сохранить. Попробуйте ещё раз.",
      };
    }

    return {
      profileStepLabel: "Profile",
      recoveryStepShortLabel: "Recovery",
      laterLabel: "Later",
      displayTitle: "How should the family see you?",
      displayHint:
        "This name appears in the family timeline, medicine cabinet, and logs.",
      displayNameFieldLabel: "Your name",
      displayNameLabel: "Display name",
      relationshipFieldLabel: "Role",
      relationshipLabel: "Relationship",
      phoneFieldLabel: "Phone",
      phoneLabel: "Phone",
      saveDisplayLabel: "Save",
      displayNameRequired: "Add a display name to continue.",
      recoveryTitle: "Add a recovery code",
      recoveryHint:
        "If you forget your password, this code helps restore access quickly.",
      recoveryCodeFieldLabel: "Recovery code",
      recoveryCodeLabel: "Recovery code",
      saveRecoveryLabel: "Save code",
      recoveryTooShort: "Recovery code must be at least 8 characters.",
      saveError: "Could not save. Please try again.",
    };
  }, [session.account.preferredLanguage]);

  if (!visibleStep) {
    return null;
  }

  const activeStepIndex = visibleStep === "display-name" ? 1 : 2;

  const handleSaveDisplayName = async () => {
    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      setError(copy.displayNameRequired);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSaveDisplayName({
        displayName: trimmedDisplayName,
        relationshipLabel: relationshipLabel.trim() || null,
        phone: phone.trim() || null,
      });
    } catch {
      setError(copy.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRecoveryCode = async () => {
    const trimmedRecoveryCode = recoveryCode.trim();
    if (trimmedRecoveryCode.length < 8) {
      setError(copy.recoveryTooShort);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateRecoveryCode({
        accessToken: session.accessToken,
        recoveryCode: trimmedRecoveryCode,
      });
      await onRecoveryCodeSaved();
    } catch {
      setError(copy.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.backdropTint,
            { backgroundColor: theme.backgroundOverlayColor },
          ]}
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroBlock}>
            <PostAuthStepper
              activeStep={activeStepIndex}
              profileLabel={copy.profileStepLabel}
              recoveryLabel={copy.recoveryStepShortLabel}
            />
            <View style={styles.headerRow}>
              <Text
                style={[styles.title, { color: theme.textPrimaryColor }]}
              >
                {visibleStep === "display-name"
                  ? copy.displayTitle
                  : copy.recoveryTitle}
              </Text>
              <Pressable
                disabled={isSaving}
                onPress={
                  visibleStep === "display-name"
                    ? onSkipDisplayName
                    : onSkipRecoveryCode
                }
                style={({ pressed }) => [
                  styles.headerAction,
                  pressed ? styles.headerActionPressed : null,
                ]}
              >
                <Text
                  style={[styles.headerActionText, { color: theme.textSecondaryColor }]}
                >
                  {copy.laterLabel}
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.hint, { color: theme.textSecondaryColor }]}>
              {visibleStep === "display-name"
                ? copy.displayHint
                : copy.recoveryHint}
            </Text>
          </View>

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.cardBackgroundColor,
                borderColor: theme.cardBorderColor,
              },
            ]}
          >
            {visibleStep === "display-name" ? (
              <View style={styles.formStack}>
                <View style={styles.fieldStack}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondaryColor }]}>
                    {copy.displayNameFieldLabel}
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor: theme.inputBackgroundColor,
                        borderColor: theme.inputBorderColor,
                      },
                    ]}
                  >
                    <View style={[styles.inputIconWrap, styles.inputIconWarm]}>
                      <Feather name="user" size={16} color="#D96F61" />
                    </View>
                    <TextInput
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder={copy.displayNameLabel}
                      placeholderTextColor={theme.textMutedColor}
                      style={[
                        styles.input,
                        {
                          color: theme.textPrimaryColor,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.fieldStack}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondaryColor }]}>
                    {copy.relationshipFieldLabel}
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor: theme.inputBackgroundColor,
                        borderColor: theme.inputBorderColor,
                      },
                    ]}
                  >
                    <View style={[styles.inputIconWrap, styles.inputIconSoft]}>
                      <Feather name="heart" size={16} color="#C8894E" />
                    </View>
                    <TextInput
                      value={relationshipLabel}
                      onChangeText={setRelationshipLabel}
                      placeholder={copy.relationshipLabel}
                      placeholderTextColor={theme.textMutedColor}
                      style={[
                        styles.input,
                        {
                          color: theme.textPrimaryColor,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.fieldStack}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondaryColor }]}>
                    {copy.phoneFieldLabel}
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor: theme.inputBackgroundColor,
                        borderColor: theme.inputBorderColor,
                      },
                    ]}
                  >
                    <View style={[styles.inputIconWrap, styles.inputIconCool]}>
                      <Feather name="phone" size={16} color="#6E8FD6" />
                    </View>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder={copy.phoneLabel}
                      placeholderTextColor={theme.textMutedColor}
                      keyboardType="phone-pad"
                      style={[
                        styles.input,
                        {
                          color: theme.textPrimaryColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.formStack}>
                <View style={styles.fieldStack}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondaryColor }]}>
                    {copy.recoveryCodeFieldLabel}
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor: theme.inputBackgroundColor,
                        borderColor: theme.inputBorderColor,
                      },
                    ]}
                  >
                    <View style={[styles.inputIconWrap, styles.inputIconNeutral]}>
                      <Feather name="shield" size={16} color="#8C7BA8" />
                    </View>
                    <TextInput
                      value={recoveryCode}
                      onChangeText={setRecoveryCode}
                      placeholder={copy.recoveryCodeLabel}
                      placeholderTextColor={theme.textMutedColor}
                      autoCapitalize="characters"
                      style={[
                        styles.input,
                        {
                          color: theme.textPrimaryColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              disabled={isSaving}
              onPress={
                visibleStep === "display-name"
                  ? handleSaveDisplayName
                  : handleSaveRecoveryCode
              }
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.primaryButtonPressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {visibleStep === "display-name"
                  ? copy.saveDisplayLabel
                  : copy.saveRecoveryLabel}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function PostAuthStepper({
  activeStep,
  profileLabel,
  recoveryLabel,
}: {
  activeStep: number;
  profileLabel: string;
  recoveryLabel: string;
}) {
  const items = [
    {
      number: 1,
      label: profileLabel,
      state:
        activeStep === 1
          ? ("active" as const)
          : activeStep > 1
            ? ("completed" as const)
            : ("inactive" as const),
    },
    {
      number: 2,
      label: recoveryLabel,
      state: activeStep === 2 ? ("active" as const) : ("inactive" as const),
    },
  ];

  return (
    <View style={styles.progressRow}>
      {items.map((item, index) => (
        <View key={item.number} style={styles.progressStepWrap}>
          <View
            style={[
              styles.progressStep,
              item.state === "active" ? styles.progressStepActive : null,
            ]}
          >
            <View
              style={[
                styles.progressNumberBadge,
                item.state === "active"
                  ? styles.progressNumberBadgeActive
                  : item.state === "completed"
                    ? styles.progressNumberBadgeCompleted
                    : styles.progressNumberBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.progressNumberText,
                  item.state === "active"
                    ? styles.progressNumberTextActive
                    : item.state === "completed"
                      ? styles.progressNumberTextCompleted
                      : styles.progressNumberTextInactive,
                ]}
              >
                {item.number}
              </Text>
            </View>
            <Text
              style={[
                styles.progressStepLabel,
                item.state === "active"
                  ? styles.progressStepLabelActive
                  : styles.progressStepLabelInactive,
              ]}
            >
              {item.label}
            </Text>
          </View>
          <View
            style={[
              styles.progressConnector,
              index === items.length - 1
                ? styles.progressConnectorPlaceholder
                : null,
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    backgroundColor: "#F8EEE7",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F8EEE7",
    overflow: "hidden",
    borderRadius: 0,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.92,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 72,
    paddingBottom: 34,
    gap: 18,
  },
  heroBlock: {
    gap: 14,
  },
  progressRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  progressStepWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  progressStep: {
    flex: 1,
    minHeight: 34,
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  progressStepActive: {
    backgroundColor: "transparent",
  },
  progressConnector: {
    width: 12,
    height: 1,
    backgroundColor: "#E7D5CC",
    marginHorizontal: 3,
  },
  progressConnectorPlaceholder: {
    opacity: 0,
  },
  progressNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressNumberBadgeActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F26F6C",
  },
  progressNumberBadgeCompleted: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F0D8CC",
  },
  progressNumberBadgeInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E7D5CC",
  },
  progressNumberText: {
    fontSize: 10,
    lineHeight: 10,
    fontWeight: "600",
  },
  progressNumberTextActive: {
    color: "#F26F6C",
  },
  progressNumberTextCompleted: {
    color: "#E85050",
  },
  progressNumberTextInactive: {
    color: "#B8A59C",
  },
  progressStepLabel: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: -0.1,
  },
  progressStepLabelActive: {
    color: "#172033",
  },
  progressStepLabelInactive: {
    color: "#9A8D87",
  },
  sheet: {
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    gap: 16,
    shadowColor: "#C6A79A",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  headerAction: {
    paddingLeft: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  headerActionPressed: {
    opacity: 0.72,
  },
  headerActionText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  formStack: {
    gap: 10,
  },
  fieldStack: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  inputRow: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inputIconWarm: {
    backgroundColor: "#FDE6E1",
  },
  inputIconSoft: {
    backgroundColor: "#FFF1E3",
  },
  inputIconCool: {
    backgroundColor: "#EAF1FF",
  },
  inputIconNeutral: {
    backgroundColor: "#F1EBFA",
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "500",
  },
  errorText: {
    color: "#D95F59",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F26F6C",
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.988 }],
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
  },
});

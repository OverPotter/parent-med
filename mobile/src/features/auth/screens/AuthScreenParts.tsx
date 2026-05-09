import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Animated } from "react-native";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type GestureResponderHandlers,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type {
  AuthFieldConfig,
  AuthFieldId,
  AuthScreenContent,
} from "../model/authScreen";
import type { VerifiedFamilyCode } from "../model/familyCode";
import { styles } from "./authScreenStyles";

type AuthTabKey = "login" | "register";

type PasswordVisibilityState = Record<"password" | "passwordConfirm", boolean>;
type ForgotPasswordVisibilityState = Record<
  "newPassword" | "passwordConfirm",
  boolean
>;

type ForgotPasswordState = {
  email: string;
  recoveryCode: string;
  newPassword: string;
  passwordConfirm: string;
};

type ForgotPasswordFieldId =
  | "email"
  | "recoveryCode"
  | "newPassword"
  | "passwordConfirm";

type ForgotPasswordValidationErrors = Partial<
  Record<ForgotPasswordFieldId, string>
>;

export function AuthTabs({
  tabs,
  activeTab,
  segmentWidth,
  indicatorX,
  tabsPanHandlers,
  onLayout,
  onSelectTab,
}: {
  tabs: AuthScreenContent["tabs"];
  activeTab: AuthTabKey;
  segmentWidth: number;
  indicatorX: Animated.Value;
  tabsPanHandlers: GestureResponderHandlers;
  onLayout: (event: LayoutChangeEvent) => void;
  onSelectTab: (tab: AuthTabKey) => void;
}) {
  return (
    <View style={styles.switchWrap}>
      <View
        style={styles.tabsShell}
        onLayout={onLayout}
        {...tabsPanHandlers}
      >
        {segmentWidth ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tabIndicator,
              {
                width: segmentWidth,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />
        ) : null}
        {tabs.map((tab) => {
          const active = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelectTab(tab.key)}
              style={({ pressed }) => [
                styles.tabButton,
                pressed ? styles.tabButtonPressed : null,
              ]}
            >
              <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AuthInputField({
  field,
  value,
  error,
  fieldStyle,
  passwordVisibility,
  onChangeText,
  onFocus,
  onBlur,
  onTogglePasswordVisibility,
  fieldRef,
  onLayout,
}: {
  field: AuthFieldConfig;
  value: string;
  error?: string;
  fieldStyle: StyleProp<ViewStyle>;
  passwordVisibility: PasswordVisibilityState;
  onChangeText: (next: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onTogglePasswordVisibility: (fieldId: AuthFieldId) => void;
  fieldRef: (node: View | null) => void;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  return (
    <View
      style={styles.fieldBlock}
      ref={fieldRef}
      onLayout={onLayout}
    >
      <View
        style={[
          styles.fieldShell,
          fieldStyle,
          error ? styles.fieldShellError : null,
        ]}
      >
        <MaterialCommunityIcons
          name={field.leftIcon as never}
          size={20}
          color="#9A8F89"
          style={styles.fieldIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={field.placeholder}
          placeholderTextColor="#B4A7A1"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={field.kind === "email" ? "email-address" : "default"}
          secureTextEntry={
            field.kind === "password"
              ? !passwordVisibility[field.id as keyof PasswordVisibilityState]
              : false
          }
          onFocus={onFocus}
          onBlur={onBlur}
          style={styles.input}
        />
        {field.rightIcon ? (
          <Pressable
            onPress={() => onTogglePasswordVisibility(field.id)}
            style={styles.eyeButton}
          >
            <MaterialCommunityIcons
              name={
                passwordVisibility[field.id as keyof PasswordVisibilityState]
                  ? ("eye-off-outline" as never)
                  : ("eye-outline" as never)
              }
              size={20}
              color="#9A8F89"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function FamilyCodeCard({
  content,
  familyCodeOpen,
  familyCodeValue,
  verifiedFamilyCode,
  familyCodeError,
  onToggleOpen,
  onChangeFamilyCode,
  onFocusFamilyCode,
  onBlurFamilyCode,
  onResetVerifiedFamilyCode,
  fieldRef,
  onLayout,
}: {
  content: AuthScreenContent;
  familyCodeOpen: boolean;
  familyCodeValue: string;
  verifiedFamilyCode: VerifiedFamilyCode | null;
  familyCodeError: string | null;
  onToggleOpen: () => void;
  onChangeFamilyCode: (next: string) => void;
  onFocusFamilyCode: () => void;
  onBlurFamilyCode: () => void;
  onResetVerifiedFamilyCode: () => void;
  fieldRef: (node: View | null) => void;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.familyCodeCard}>
      <Pressable
        onPress={onToggleOpen}
        style={({ pressed }) => [
          styles.familyCodeToggle,
          pressed ? styles.familyCodeTogglePressed : null,
        ]}
      >
        <View style={styles.familyCodeToggleCopy}>
          <Text style={styles.familyCodeToggleTitle}>
            {content.familyCodeToggleLabel}
          </Text>
          {familyCodeValue ? (
            <Text style={styles.familyCodeToggleMeta}>{familyCodeValue}</Text>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name={familyCodeOpen ? ("chevron-up" as never) : ("chevron-down" as never)}
          size={18}
          color="#9A8F89"
        />
      </Pressable>

      {familyCodeOpen ? (
        <View
          style={styles.familyCodeBody}
          ref={fieldRef}
          onLayout={onLayout}
        >
          {verifiedFamilyCode ? (
            <View style={styles.familyCodeVerifiedCard}>
              <Text style={styles.familyCodeVerifiedLabel}>
                {content.familyCodeVerifiedLabel}
              </Text>
              <Text style={styles.familyCodeVerifiedName}>
                {verifiedFamilyCode.familyName}
              </Text>
              <Pressable
                onPress={onResetVerifiedFamilyCode}
                style={styles.familyCodeActionButton}
              >
                <Text style={styles.familyCodeActionLabel}>
                  {content.familyCodeChangeLabel}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.fieldShell, styles.fieldSingle]}>
              <MaterialCommunityIcons
                name={"account-group-outline" as never}
                size={20}
                color="#9A8F89"
                style={styles.fieldIcon}
              />
              <TextInput
                value={familyCodeValue}
                onChangeText={onChangeFamilyCode}
                placeholder={content.familyCodePlaceholder}
                placeholderTextColor="#B4A7A1"
                autoCapitalize="characters"
                autoCorrect={false}
                onFocus={onFocusFamilyCode}
                onBlur={onBlurFamilyCode}
                style={styles.input}
              />
            </View>
          )}
          {familyCodeError ? (
            <Text style={styles.fieldError}>{familyCodeError}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function AuthBottomArea({
  showLegal,
  supportLabel,
  termsLabel,
  privacyLabel,
  showVerifyAction,
  verifyLabel,
  isVerifying,
  onVerify,
}: {
  showLegal: boolean;
  supportLabel: string;
  termsLabel: string;
  privacyLabel: string;
  showVerifyAction: boolean;
  verifyLabel: string;
  isVerifying: boolean;
  onVerify: () => void;
}) {
  return (
    <>
      {showLegal ? (
        <View style={styles.bottomLegalWrap}>
          <Pressable style={styles.supportLinkButton}>
            <Text style={styles.supportLinkText}>{supportLabel}</Text>
          </Pressable>
          <View style={styles.legalFooterRow}>
            <Pressable>
              <Text style={styles.legalFooterLink}>{termsLabel}</Text>
            </Pressable>
            <Text style={styles.legalFooterDot}>·</Text>
            <Pressable>
              <Text style={styles.legalFooterLink}>{privacyLabel}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {showVerifyAction ? (
        <View style={styles.bottomSecondaryActionWrap}>
          <Pressable
            onPress={onVerify}
            disabled={isVerifying}
            style={({ pressed }) => [
              styles.bottomSecondaryActionButton,
              isVerifying ? styles.familyCodeActionButtonDisabled : null,
              pressed ? styles.familyCodeActionButtonPressed : null,
            ]}
          >
            <Text style={styles.bottomSecondaryActionLabel}>{verifyLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

export function ForgotPasswordSheetContent({
  content,
  panHandlers,
  forgotPasswordState,
  forgotPasswordVisibility,
  forgotPasswordSubmitted,
  forgotPasswordTouched,
  forgotPasswordErrors,
  forgotPasswordError,
  isForgotPasswordValid,
  isForgotPasswordSubmitting,
  onChangeEmail,
  onChangeRecoveryCode,
  onChangeNewPassword,
  onChangePasswordConfirm,
  onToggleNewPasswordVisibility,
  onTogglePasswordConfirmVisibility,
  onBlurField,
  onSubmit,
}: {
  content: AuthScreenContent;
  panHandlers: GestureResponderHandlers;
  forgotPasswordState: ForgotPasswordState;
  forgotPasswordVisibility: ForgotPasswordVisibilityState;
  forgotPasswordSubmitted: boolean;
  forgotPasswordTouched: Partial<Record<ForgotPasswordFieldId, boolean>>;
  forgotPasswordErrors: ForgotPasswordValidationErrors;
  forgotPasswordError: string | null;
  isForgotPasswordValid: boolean;
  isForgotPasswordSubmitting: boolean;
  onChangeEmail: (next: string) => void;
  onChangeRecoveryCode: (next: string) => void;
  onChangeNewPassword: (next: string) => void;
  onChangePasswordConfirm: (next: string) => void;
  onToggleNewPasswordVisibility: () => void;
  onTogglePasswordConfirmVisibility: () => void;
  onBlurField: (fieldId: ForgotPasswordFieldId) => void;
  onSubmit: () => void;
}) {
  const showFieldError = (fieldId: ForgotPasswordFieldId) =>
    forgotPasswordSubmitted || forgotPasswordTouched[fieldId];

  return (
    <ScrollView
      style={styles.forgotPasswordSheetScroll}
      contentContainerStyle={styles.forgotPasswordSheetScrollContent}
      keyboardShouldPersistTaps="handled"
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.forgotPasswordSheetInner}>
        <View style={styles.sheetDragZone} {...panHandlers}>
          <View style={styles.sheetHandle} />
          <Text style={styles.forgotPasswordSheetTitle}>
            {content.forgotPasswordSheetTitle}
          </Text>
          <Text style={styles.forgotPasswordSheetSubtitle}>
            {content.forgotPasswordSheetDescription}
          </Text>
        </View>

        <View style={styles.forgotPasswordFields}>
          <View style={styles.fieldBlock}>
            <View
              style={[
                styles.forgotPasswordField,
                showFieldError("email") && forgotPasswordErrors.email
                  ? styles.fieldShellError
                  : null,
              ]}
            >
              <MaterialCommunityIcons
                name={"email-outline" as never}
                size={20}
                color="#9A8F89"
                style={styles.fieldIcon}
              />
              <TextInput
                value={forgotPasswordState.email}
                onChangeText={onChangeEmail}
                placeholder={content.loginFields[0]?.placeholder}
                placeholderTextColor="#B4A7A1"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onBlur={() => onBlurField("email")}
                style={styles.input}
              />
            </View>
            {showFieldError("email") && forgotPasswordErrors.email ? (
              <Text style={styles.fieldError}>{forgotPasswordErrors.email}</Text>
            ) : null}
          </View>

          <View style={styles.fieldBlock}>
            <View
              style={[
                styles.forgotPasswordField,
                showFieldError("recoveryCode") && forgotPasswordErrors.recoveryCode
                  ? styles.fieldShellError
                  : null,
              ]}
            >
              <MaterialCommunityIcons
                name={"shield-key-outline" as never}
                size={20}
                color="#9A8F89"
                style={styles.fieldIcon}
              />
              <TextInput
                value={forgotPasswordState.recoveryCode}
                onChangeText={onChangeRecoveryCode}
                placeholder={content.forgotPasswordRecoveryCodePlaceholder}
                placeholderTextColor="#B4A7A1"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={() => onBlurField("recoveryCode")}
                style={styles.input}
              />
            </View>
            {showFieldError("recoveryCode") && forgotPasswordErrors.recoveryCode ? (
              <Text style={styles.fieldError}>
                {forgotPasswordErrors.recoveryCode}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldBlock}>
            <View
              style={[
                styles.forgotPasswordField,
                showFieldError("newPassword") && forgotPasswordErrors.newPassword
                  ? styles.fieldShellError
                  : null,
              ]}
            >
              <MaterialCommunityIcons
                name={"lock-outline" as never}
                size={20}
                color="#9A8F89"
                style={styles.fieldIcon}
              />
              <TextInput
                value={forgotPasswordState.newPassword}
                onChangeText={onChangeNewPassword}
                placeholder={content.forgotPasswordNewPasswordLabel}
                placeholderTextColor="#B4A7A1"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!forgotPasswordVisibility.newPassword}
                onBlur={() => onBlurField("newPassword")}
                style={styles.input}
              />
              <Pressable
                onPress={onToggleNewPasswordVisibility}
                style={styles.eyeButton}
              >
                <MaterialCommunityIcons
                  name={
                    forgotPasswordVisibility.newPassword
                      ? ("eye-off-outline" as never)
                      : ("eye-outline" as never)
                  }
                  size={20}
                  color="#9A8F89"
                />
              </Pressable>
            </View>
            {showFieldError("newPassword") && forgotPasswordErrors.newPassword ? (
              <Text style={styles.fieldError}>
                {forgotPasswordErrors.newPassword}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldBlock}>
            <View
              style={[
                styles.forgotPasswordField,
                showFieldError("passwordConfirm") &&
                forgotPasswordErrors.passwordConfirm
                  ? styles.fieldShellError
                  : null,
              ]}
            >
              <MaterialCommunityIcons
                name={"lock-check-outline" as never}
                size={20}
                color="#9A8F89"
                style={styles.fieldIcon}
              />
              <TextInput
                value={forgotPasswordState.passwordConfirm}
                onChangeText={onChangePasswordConfirm}
                placeholder={content.forgotPasswordConfirmPasswordLabel}
                placeholderTextColor="#B4A7A1"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!forgotPasswordVisibility.passwordConfirm}
                onBlur={() => onBlurField("passwordConfirm")}
                style={styles.input}
              />
              <Pressable
                onPress={onTogglePasswordConfirmVisibility}
                style={styles.eyeButton}
              >
                <MaterialCommunityIcons
                  name={
                    forgotPasswordVisibility.passwordConfirm
                      ? ("eye-off-outline" as never)
                      : ("eye-outline" as never)
                  }
                  size={20}
                  color="#9A8F89"
                />
              </Pressable>
            </View>
            {showFieldError("passwordConfirm") &&
            forgotPasswordErrors.passwordConfirm ? (
              <Text style={styles.fieldError}>
                {forgotPasswordErrors.passwordConfirm}
              </Text>
            ) : null}
          </View>
        </View>

        {forgotPasswordError ? (
          <View style={styles.formErrorSlot}>
            <Text style={styles.fieldError}>{forgotPasswordError}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.forgotPasswordSubmitButton,
            !isForgotPasswordValid || isForgotPasswordSubmitting
              ? styles.primaryButtonDisabled
              : null,
            pressed ? styles.primaryButtonPressed : null,
          ]}
        >
          <LinearGradient
            colors={["#FF8274", "#F87566", "#F2685A"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryButtonGradient}
          />
          <Text style={styles.primaryButtonLabel}>
            {isForgotPasswordSubmitting
              ? content.forgotPasswordSubmittingLabel
              : content.forgotPasswordSheetButtonLabel}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

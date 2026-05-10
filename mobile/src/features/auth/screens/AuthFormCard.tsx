import { LinearGradient } from "expo-linear-gradient";
import { Animated, Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import type { GestureResponderHandlers } from "react-native";
import type { AuthFieldId, AuthScreenContent } from "../model/authScreen";
import type { FieldTouchedState, FormState } from "../model/authScreenHelpers";
import type { VerifiedFamilyCode } from "../model/familyCode";
import { getFieldStyleId } from "../model/authScreenHelpers";
import { AuthInputField, AuthTabs, FamilyCodeCard } from "./AuthScreenParts";
import { styles } from "./authScreenStyles";

type AuthTabKey = "login" | "register";
type PasswordVisibilityState = Record<"password" | "passwordConfirm", boolean>;
type LayoutFieldId = "email" | "password" | "passwordConfirm" | "familyCode";

function resolveFieldStyle(fieldId: AuthFieldId, fieldsLength: number) {
  const styleId = getFieldStyleId(fieldId, fieldsLength);

  if (styleId === "single") {
    return styles.fieldSingle;
  }
  if (styleId === "top") {
    return styles.fieldTop;
  }
  if (styleId === "bottom") {
    return styles.fieldBottom;
  }
  return styles.fieldMiddle;
}

export function AuthFormCard({
  content,
  activeTab,
  segmentWidth,
  indicatorX,
  tabsPanHandlers,
  formState,
  fields,
  errors,
  submitted,
  touchedFields,
  visibleFormError,
  passwordVisibility,
  familyCodeOpen,
  verifiedFamilyCode,
  familyCodeError,
  isRegisterMode,
  isFormValid,
  isSubmitting,
  onTabsLayout,
  onSelectTab,
  onChangeField,
  onFieldFocus,
  onFieldBlur,
  onFamilyCodeBlur,
  onTogglePasswordVisibility,
  onToggleFamilyCodeOpen,
  onResetVerifiedFamilyCode,
  onSubmit,
  onOpenForgotPassword,
  getFieldRef,
  getFieldLayout,
}: {
  content: AuthScreenContent;
  activeTab: AuthTabKey;
  segmentWidth: number;
  indicatorX: Animated.Value;
  tabsPanHandlers: GestureResponderHandlers;
  formState: FormState;
  fields: AuthScreenContent["loginFields"] | AuthScreenContent["registerFields"];
  errors: Partial<Record<AuthFieldId, string>>;
  submitted: boolean;
  touchedFields: FieldTouchedState<AuthFieldId>;
  visibleFormError: string | null;
  passwordVisibility: PasswordVisibilityState;
  familyCodeOpen: boolean;
  verifiedFamilyCode: VerifiedFamilyCode | null;
  familyCodeError: string | null;
  isRegisterMode: boolean;
  isFormValid: boolean;
  isSubmitting: boolean;
  onTabsLayout: (event: LayoutChangeEvent) => void;
  onSelectTab: (tab: AuthTabKey) => void;
  onChangeField: (key: keyof FormState, value: string) => void;
  onFieldFocus: (fieldId: LayoutFieldId) => void;
  onFieldBlur: (fieldId: AuthFieldId) => void;
  onFamilyCodeBlur: () => void;
  onTogglePasswordVisibility: (fieldId: AuthFieldId) => void;
  onToggleFamilyCodeOpen: () => void;
  onResetVerifiedFamilyCode: () => void;
  onSubmit: () => void;
  onOpenForgotPassword: () => void;
  getFieldRef: (fieldId: LayoutFieldId) => (node: View | null) => void;
  getFieldLayout: (fieldId: LayoutFieldId) => (event: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.sheet}>
      <View style={styles.formGroup}>
        <AuthTabs
          tabs={content.tabs}
          activeTab={activeTab}
          segmentWidth={segmentWidth}
          indicatorX={indicatorX}
          tabsPanHandlers={tabsPanHandlers}
          onLayout={onTabsLayout}
          onSelectTab={onSelectTab}
        />

        {fields.map((field) => {
          const value = formState[field.id as keyof FormState];
          const error =
            submitted || touchedFields[field.id] ? errors[field.id] : undefined;

          return (
            <AuthInputField
              key={field.id}
              field={field}
              value={value}
              error={error}
              fieldStyle={resolveFieldStyle(field.id, fields.length)}
              passwordVisibility={passwordVisibility}
              onChangeText={(next) =>
                onChangeField(field.id as keyof FormState, next)
              }
              onFocus={() => onFieldFocus(field.id)}
              onBlur={() => onFieldBlur(field.id)}
              onTogglePasswordVisibility={onTogglePasswordVisibility}
              fieldRef={getFieldRef(field.id)}
              onLayout={getFieldLayout(field.id)}
            />
          );
        })}

        {visibleFormError ? (
          <View style={styles.formErrorSlot}>
            <Text style={styles.fieldError}>{visibleFormError}</Text>
          </View>
        ) : null}

        {isRegisterMode ? (
          <FamilyCodeCard
            content={content}
            familyCodeOpen={familyCodeOpen}
            familyCodeValue={formState.familyCode}
            verifiedFamilyCode={verifiedFamilyCode}
            familyCodeError={familyCodeError}
            onToggleOpen={onToggleFamilyCodeOpen}
            onChangeFamilyCode={(next) => onChangeField("familyCode", next)}
            onFocusFamilyCode={() => onFieldFocus("familyCode")}
            onBlurFamilyCode={onFamilyCodeBlur}
            onResetVerifiedFamilyCode={onResetVerifiedFamilyCode}
            fieldRef={getFieldRef("familyCode")}
            onLayout={getFieldLayout("familyCode")}
          />
        ) : null}

        <Pressable
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            !isFormValid || isSubmitting ? styles.primaryButtonDisabled : null,
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
            {isSubmitting
              ? isRegisterMode
                ? content.registerSubmittingLabel
                : content.loginSubmittingLabel
              : isRegisterMode
                ? content.registerButtonLabel
                : content.loginButtonLabel}
          </Text>
        </Pressable>

        {!isRegisterMode ? (
          <View style={styles.authOptionsRow}>
            <Pressable
              style={styles.forgotPasswordButton}
              onPress={onOpenForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                {content.forgotPasswordLabel}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

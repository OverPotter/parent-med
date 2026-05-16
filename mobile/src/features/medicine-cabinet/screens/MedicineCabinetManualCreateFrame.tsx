import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { ManualCategory } from "../model/manualMedicineFlow";
import {
  Step1BasicSection,
  Step2UsageSection,
  Step3StorageSection,
  StepIndicator,
  type FlowStep,
} from "./MedicineCabinetManualCreateParts";
import { styles } from "./medicineCabinetManualCreateScreenStyles";

type ManualCreateFrameProps = {
  step: FlowStep;
  locale: MobileLocale;
  medicineName: string;
  onChangeMedicineName: (value: string) => void;
  category: ManualCategory | null;
  onSelectCategory: (value: ManualCategory) => void;
  concentration: string;
  onChangeConcentration: (value: string) => void;
  purpose: string;
  onChangePurpose: (value: string) => void;
  howToUse: string;
  onChangeHowToUse: (value: string) => void;
  expiryDateLabel: string;
  onPressExpiryDate: () => void;
  openedDateLabel: string;
  onPressOpenedDate: () => void;
  afterOpeningLabel: string;
  onPressAfterOpeningSelector: () => void;
  storageComment: string;
  onChangeStorageComment: (value: string) => void;
  previewTitle: string;
  previewSubtitleBase: string;
  previewExpiry: string;
  previewOpened: string;
  previewAfterOpening: string;
  canGoNextFromStep1: boolean;
  canSaveStep3: boolean;
  onBackPress: () => void;
  onPrimaryPress: () => void;
  interactive: boolean;
  panHandlers?: object;
  swipeCaptureWidth?: number;
};

export function MedicineCabinetManualCreateFrame({
  step,
  locale,
  medicineName,
  onChangeMedicineName,
  category,
  onSelectCategory,
  concentration,
  onChangeConcentration,
  purpose,
  onChangePurpose,
  howToUse,
  onChangeHowToUse,
  expiryDateLabel,
  onPressExpiryDate,
  openedDateLabel,
  onPressOpenedDate,
  afterOpeningLabel,
  onPressAfterOpeningSelector,
  storageComment,
  onChangeStorageComment,
  previewTitle,
  previewSubtitleBase,
  previewExpiry,
  previewOpened,
  previewAfterOpening,
  canGoNextFromStep1,
  canSaveStep3,
  onBackPress,
  onPrimaryPress,
  interactive,
  panHandlers,
  swipeCaptureWidth,
}: ManualCreateFrameProps) {
  const isRu = locale === "ru";
  return (
    <LinearGradient
      colors={["#FFF7F1", "#FFF3EA"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.frame}
      pointerEvents={interactive ? "auto" : "none"}
    >
      <View style={styles.decorationTop} />
      <View style={styles.decorationBottom} />
      {interactive && swipeCaptureWidth ? (
        <View
          style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
          {...panHandlers}
        />
      ) : null}

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={onBackPress}
              style={({ pressed }) => [
                styles.backLink,
                pressed && interactive ? styles.backLinkPressed : null,
              ]}
            >
              <Text style={styles.backLinkText}>
                {isRu
                  ? "← К аптечке"
                  : locale === "de"
                    ? "← Zur Hausapotheke"
                    : locale === "pl"
                      ? "← Do apteczki"
                      : "← Back to cabinet"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>
              {isRu
                ? "Новый препарат"
                : locale === "de"
                  ? "Neues Medikament"
                  : locale === "pl"
                    ? "Nowy lek"
                    : "New medicine"}
            </Text>
          </View>

          <StepIndicator step={step} />

          {step === 1 ? (
            <Step1BasicSection
              locale={locale}
              medicineName={medicineName}
              onChangeMedicineName={onChangeMedicineName}
              category={category}
              onSelectCategory={onSelectCategory}
              concentration={concentration}
              onChangeConcentration={onChangeConcentration}
            />
          ) : null}

          {step === 2 ? (
            <Step2UsageSection
              locale={locale}
              purpose={purpose}
              onChangePurpose={onChangePurpose}
              howToUse={howToUse}
              onChangeHowToUse={onChangeHowToUse}
              category={category}
              previewTitle={previewTitle}
              previewSubtitleBase={previewSubtitleBase}
            />
          ) : null}

          {step === 3 ? (
            <Step3StorageSection
              locale={locale}
              expiryDateLabel={expiryDateLabel}
              onPressExpiryDate={onPressExpiryDate}
              openedDateLabel={openedDateLabel}
              onPressOpenedDate={onPressOpenedDate}
              afterOpeningLabel={afterOpeningLabel}
              onPressAfterOpeningSelector={onPressAfterOpeningSelector}
              storageComment={storageComment}
              onChangeStorageComment={onChangeStorageComment}
              category={category}
              previewTitle={previewTitle}
              previewSubtitle={[
                previewSubtitleBase,
                previewExpiry,
                previewOpened,
                previewAfterOpening,
              ]
                .filter((part) => part.length > 0)
                .join(" · ")}
            />
          ) : null}

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={onBackPress}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && interactive ? styles.secondaryButtonPressed : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                {step === 1
                  ? isRu
                    ? "Отмена"
                    : locale === "de"
                      ? "Abbrechen"
                      : locale === "pl"
                        ? "Anuluj"
                        : "Cancel"
                  : isRu
                    ? "Назад"
                    : locale === "de"
                      ? "Zurück"
                      : locale === "pl"
                        ? "Wstecz"
                        : "Back"}
              </Text>
            </Pressable>

            <LinearGradient
              colors={
                step === 1 && !canGoNextFromStep1
                  ? ["#F4C3BE", "#F4C3BE"]
                  : ["#F56565", "#EF4F4F"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonGradient}
            >
              <Pressable
                accessibilityRole="button"
                onPress={onPrimaryPress}
                disabled={
                  !interactive ||
                  (step === 1 && !canGoNextFromStep1) ||
                  (step === 3 && !canSaveStep3)
                }
                style={({ pressed }) => [
                  styles.primaryButton,
                  (step === 1 && !canGoNextFromStep1) ||
                  (step === 3 && !canSaveStep3)
                    ? styles.primaryButtonDisabled
                    : null,
                  pressed &&
                  interactive &&
                  !(
                    (step === 1 && !canGoNextFromStep1) ||
                    (step === 3 && !canSaveStep3)
                  )
                    ? styles.primaryButtonPressed
                    : null,
                ]}
              >
                {step === 3 ? (
                  <View style={styles.primaryButtonIconCircle}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                ) : null}
                <Text style={styles.primaryButtonText}>
                  {step === 3
                    ? isRu
                      ? "Сохранить препарат"
                      : locale === "de"
                        ? "Medikament speichern"
                        : locale === "pl"
                          ? "Zapisz lek"
                          : "Save medicine"
                    : isRu
                      ? "Далее"
                      : locale === "de"
                        ? "Weiter"
                        : locale === "pl"
                          ? "Dalej"
                          : "Next"}
                </Text>
              </Pressable>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

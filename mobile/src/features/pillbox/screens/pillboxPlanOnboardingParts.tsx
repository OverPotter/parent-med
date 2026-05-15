import type { ReactNode } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

export function TopNav({
  step,
  onBack,
}: {
  step: "participant" | "list" | "medicine" | "review";
  onBack: () => void;
}) {
  return (
    <View style={styles.topNav}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.backLink,
          pressed ? styles.backLinkPressed : null,
        ]}
      >
        <Text style={styles.backLinkText}>← Назад</Text>
      </Pressable>
      <View style={styles.topNavSpacer} />
    </View>
  );
}

export function Stepper({ activeStep }: { activeStep: number }) {
  return (
    <View style={styles.stepper}>
      {[1, 2, 3, 4].map((step, index) => {
        const completed = step < activeStep;
        const active = step === activeStep;

        return (
          <View key={step} style={styles.stepperItem}>
            <View
              style={[
                styles.stepCircle,
                active ? styles.stepCircleActive : null,
                completed ? styles.stepCircleCompleted : null,
              ]}
            >
              <Text
                style={[
                  styles.stepCircleText,
                  active ? styles.stepCircleTextActive : null,
                  completed ? styles.stepCircleTextCompleted : null,
                ]}
              >
                {completed ? "✓" : step}
              </Text>
            </View>
            {index < 3 ? (
              <View
                style={[
                  styles.stepConnector,
                  step < activeStep ? styles.stepConnectorActive : null,
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function Hero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.heroRow}>
      <View style={styles.headingBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

export function Field({
  label,
  iconSource,
  largeIcon = false,
  children,
}: {
  label: string;
  iconSource?: number;
  largeIcon?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldHeader}>
        {iconSource ? (
          <View
            style={[
              styles.fieldHeaderIconWrap,
              largeIcon ? styles.fieldHeaderIconWrapLarge : null,
            ]}
          >
            <Image
              source={iconSource}
              style={[
                styles.fieldHeaderIconImage,
                largeIcon ? styles.fieldHeaderIconImageLarge : null,
              ]}
              resizeMode="contain"
            />
          </View>
        ) : null}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled ? styles.primaryButtonDisabled : null,
        pressed ? styles.backLinkPressed : null,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function InputField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#A0A8B5"
      style={styles.input}
    />
  );
}

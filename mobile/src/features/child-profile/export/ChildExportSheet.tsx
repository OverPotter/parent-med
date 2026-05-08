import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useBottomSheetSwipeDismiss } from "../../../shared/hooks/useBottomSheetSwipeDismiss";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  buildChildExportContent,
  childExportOptions,
  defaultChildExportKind,
  defaultChildExportPeriod,
  getChildExportDescription,
  type ChildExportKind,
  type ChildExportPeriod,
} from "./childExportSheetModel";
import { styles } from "./childExportSheetStyles";

type ChildExportSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function ChildExportSheet({ visible, onClose }: ChildExportSheetProps) {
  const { locale } = useMobileI18n();
  const content = buildChildExportContent(locale);
  const [selectedKind, setSelectedKind] = useState<ChildExportKind>(
    defaultChildExportKind,
  );
  const [selectedPeriod, setSelectedPeriod] = useState<ChildExportPeriod>(
    defaultChildExportPeriod,
  );
  const { panHandlers, translateY } = useBottomSheetSwipeDismiss({
    visible,
    onClose,
  });

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedKind(defaultChildExportKind);
    setSelectedPeriod(defaultChildExportPeriod);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        {...panHandlers}
      >
        <View style={styles.handle} />

        <Text style={styles.eyebrow}>{content.eyebrow}</Text>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{content.exportWhatLabel}</Text>
          <View style={styles.grid}>
            {childExportOptions.map((option) => {
              const isActive = selectedKind === option.kind;

              return (
                <Pressable
                  key={option.kind}
                  onPress={() => setSelectedKind(option.kind)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isActive ? styles.optionCardActive : null,
                    pressed ? styles.optionCardPressed : null,
                  ]}
                >
                  <View
                    style={[
                      styles.optionIconBadge,
                      getOptionBadgeStyle(option.tint),
                    ]}
                  >
                    <OptionIcon kind={option.kind} />
                  </View>
                  <Text style={styles.optionLabel}>
                    {content.optionLabels[option.kind]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#6E7B8C"
            />
            <Text style={styles.infoText}>
              {getChildExportDescription(selectedKind, locale)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{content.periodLabel}</Text>
          <View style={styles.grid}>
            {content.periodOptions.map((period) => {
              const isActive = selectedPeriod === period.value;

              return (
                <Pressable
                  key={period.value}
                  onPress={() => setSelectedPeriod(period.value)}
                  style={({ pressed }) => [
                    styles.periodCard,
                    isActive ? styles.periodCardActive : null,
                    pressed ? styles.optionCardPressed : null,
                  ]}
                >
                  <View
                    style={[
                      styles.periodIconBadge,
                      isActive ? styles.periodIconBadgeActive : null,
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={isActive ? "#C66C5E" : "#7C858E"}
                    />
                  </View>
                  <Text style={styles.periodLabel}>{period.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <View style={styles.actionButtonShell}>
            <View
              style={[
                styles.actionButton,
                styles.actionButtonSecondary,
                styles.actionButtonDisabled,
              ]}
            >
              <Text style={[styles.actionLabel, styles.actionLabelDisabled]}>
                {content.saveCsv}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtonShell}>
            <View
              style={[
                styles.actionButton,
                styles.actionButtonPrimary,
                styles.actionButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={["#FF7A70", "#F8625E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              />
              <Text
                style={[
                  styles.actionLabel,
                  styles.actionLabelPrimary,
                  styles.actionLabelDisabledPrimary,
                ]}
              >
                {content.saveXlsx}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function getOptionBadgeStyle(tint: "coral" | "green" | "purple") {
  if (tint === "green") {
    return {
      backgroundColor: "#DDF4E9",
      borderWidth: 1,
      borderColor: "#C8E8D8",
    } as const;
  }

  if (tint === "purple") {
    return {
      backgroundColor: "#EFE3FF",
      borderWidth: 1,
      borderColor: "#DECDFB",
    } as const;
  }

  return {
    backgroundColor: "#FFE3E0",
    borderWidth: 1,
    borderColor: "#FFC5BE",
  } as const;
}

function OptionIcon({ kind }: { kind: ChildExportKind }) {
  if (kind === "analytics_summary") {
    return <Feather name="clipboard" size={18} color="#F8766D" />;
  }

  if (kind === "child_illness") {
    return (
      <MaterialCommunityIcons name="heart-plus" size={18} color="#F8766D" />
    );
  }

  if (kind === "child_care") {
    return (
      <MaterialCommunityIcons
        name="baby-bottle-outline"
        size={18}
        color="#58A886"
      />
    );
  }

  return <Feather name="folder" size={18} color="#9A73E8" />;
}

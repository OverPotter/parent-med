import { Feather } from "@expo/vector-icons";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ChildCard } from "../../children/model/childrenRedesign";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { illnessAssets } from "../assets";
import { buildIllnessOnboardingContent, formatIllnessDateLabel } from "../model/illnessOnboarding";
import { styles } from "./illnessOnboardingStyles";

type IllnessOnboardingScreenProps = {
  child: ChildCard;
  visible: boolean;
  onBack: () => void;
  onStartObservation: (payload: { startedAt: string; reason: string }) => void;
};

function getSuggestionVisual(
  suggestionId:
    | "fever"
    | "cough"
    | "runnyNose"
    | "soreThroat"
    | "rash"
    | "nausea",
) {
  switch (suggestionId) {
    case "fever":
      return {
        tint: "#E97C96",
        bg: "#FFF0F5",
        border: "#F1C8D4",
        asset: illnessAssets.onboarding.suggestions.fever,
        imageScale: 0.84,
      };
    case "cough":
      return {
        tint: "#D58C66",
        bg: "#FFF2E8",
        border: "#EDCEBE",
        asset: illnessAssets.onboarding.suggestions.cough,
        imageScale: 1.08,
      };
    case "runnyNose":
      return {
        tint: "#6E9AD8",
        bg: "#EEF5FF",
        border: "#D2E0F4",
        asset: illnessAssets.onboarding.suggestions.runnyNose,
        imageScale: 1,
      };
    case "soreThroat":
      return {
        tint: "#8E79D8",
        bg: "#F4F0FF",
        border: "#DDD3F5",
        asset: illnessAssets.onboarding.suggestions.soreThroat,
        imageScale: 1,
      };
    case "rash":
      return {
        tint: "#B88E3E",
        bg: "#FBF3DE",
        border: "#E6D39D",
        asset: illnessAssets.onboarding.suggestions.rash,
        imageScale: 0.84,
      };
    case "nausea":
      return {
        tint: "#7AA08D",
        bg: "#EEF7F2",
        border: "#CFE3D9",
        asset: illnessAssets.onboarding.suggestions.nausea,
        imageScale: 1,
      };
    default:
      return fallbackSuggestionVisual;
  }
}

const fallbackSuggestionVisual = {
  tint: "#7AA08D",
  bg: "#EEF7F2",
  border: "#CFE3D9",
  asset: null,
  imageScale: 1,
} as const;

function buildDateOptions() {
  return Array.from({ length: 4 }, (_, index) => {
    return buildLocalIllnessDate(index);
  });
}

function buildLocalIllnessDate(dayOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

export function IllnessOnboardingScreen({
  child,
  visible,
  onBack,
  onStartObservation,
}: IllnessOnboardingScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildIllnessOnboardingContent(child.name, locale);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });
  const [reason, setReason] = useState("");
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(buildLocalIllnessDate());
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dateOptions = useMemo(buildDateOptions, [visible]);
  const isDirty = reason.trim().length > 0 || selectedSuggestions.length > 0;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setReason("");
    setSelectedSuggestions([]);
    setSelectedDate(buildLocalIllnessDate());
    setIsDateSheetOpen(false);
    setIsLeaveConfirmOpen(false);
    setIsSubmitting(false);
  }, [visible]);

  const handleBack = () => {
    if (isDirty) {
      setIsLeaveConfirmOpen(true);
      return;
    }
    onBack();
  };

  const handleToggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions((current) => {
      const exists = current.includes(suggestion);
      const nextSuggestions = exists
        ? current.filter((item) => item !== suggestion)
        : [...current, suggestion];

      setReason((currentReason) => {
        const parts = currentReason
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        const nextParts = exists
          ? parts.filter((item) => item !== suggestion)
          : parts.includes(suggestion)
            ? parts
            : [...parts, suggestion];
        return nextParts.join(", ");
      });

      return nextSuggestions;
    });
  };

  const handleSubmit = () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    onStartObservation({
      startedAt: selectedDate,
      reason: reason.trim(),
    });
  };

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.overlayLayer,
        visible ? styles.overlayLayerVisible : styles.overlayLayerHidden,
        { transform: [{ translateX }] },
      ]}
    >
      <View style={styles.root}>
        <ImageBackground
          source={childrenScreenAssets.background}
          resizeMode="cover"
          style={styles.background}
          imageStyle={styles.backgroundImage}
        >
          <View
            style={[
              styles.overlay,
              { backgroundColor: surfaceTheme.backgroundOverlayColor },
            ]}
          />
        </ImageBackground>
        <View style={styles.screen}>
          <View style={styles.contentWrap}>
            <View style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]} {...panHandlers} />
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.topBar}>
                <Pressable onPress={handleBack} style={styles.backLink}>
                  <Text style={styles.backLinkText}>{"← "}{content.backLabel}</Text>
                </Pressable>
              </View>

              <View style={styles.hero}>
                <Text style={styles.title}>{content.title}</Text>
              </View>

              <View style={styles.hintSection}>
                <View style={styles.hintTitleRow}>
                  <Image
                    source={illnessAssets.onboarding.careHint}
                    style={styles.hintIconImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.hintTitle}>{content.hintTitle}</Text>
                </View>
                <Text style={styles.hintBody}>{content.hintBody}</Text>
              </View>

              <View style={styles.formCard}>
                <View style={styles.fieldGroup}>
                  <View style={styles.fieldLabelRow}>
                    <View style={styles.fieldIconWrap}>
                      <Image
                      source={illnessAssets.onboarding.startDate}
                      style={styles.fieldIconImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.fieldLabel}>{content.dateLabel}</Text>
                </View>
                <Pressable style={styles.fieldShell} onPress={() => setIsDateSheetOpen(true)}>
                  <View style={styles.fieldValueRow}>
                    <Feather name="calendar" size={18} color="#7D6A61" />
                    <Text style={styles.fieldValue}>
                      {formatIllnessDateLabel(selectedDate, locale)}
                    </Text>
                  </View>
                  <Feather name="chevron-down" size={18} color="#7D6A61" />
                </Pressable>
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.fieldLabelRow}>
                    <View style={styles.fieldIconWrap}>
                      <Image
                      source={illnessAssets.onboarding.reason}
                      style={styles.fieldIconImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.fieldLabel}>{content.reasonLabel}</Text>
                </View>
                <TextInput
                  value={reason}
                  onChangeText={(next) => setReason(next.slice(0, content.reasonMaxLength))}
                  placeholder={content.reasonPlaceholder}
                  placeholderTextColor="#9AA3AF"
                  style={styles.textArea}
                  multiline
                />
                <Text style={styles.textCounter}>
                  {reason.length}/{content.reasonMaxLength}
                </Text>
                </View>

                <View style={styles.suggestionsCard}>
                  <View style={styles.suggestionsHeader}>
                  <Image
                    source={illnessAssets.onboarding.commonReasons}
                    style={styles.suggestionsIconImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.suggestionsLabel}>{content.suggestionsLabel}</Text>
                </View>
                <View style={styles.suggestionsGrid}>
                  {content.suggestions.map((suggestion) => {
                    const active = selectedSuggestions.includes(suggestion.label);
                    const visual = getSuggestionVisual(suggestion.id);
                    return (
                      <Pressable
                        key={suggestion.id}
                        onPress={() => handleToggleSuggestion(suggestion.label)}
                        style={[
                          styles.suggestionChip,
                          { backgroundColor: visual.bg, borderColor: visual.border },
                            active
                              ? {
                                  backgroundColor: visual.tint,
                                  borderColor: visual.tint,
                                }
                              : null,
                          ]}
                        >
                          {visual.asset ? (
                            <View style={styles.suggestionChipIconWrap}>
                              <Image
                                source={visual.asset}
                                style={[
                                  styles.suggestionChipIconImage,
                                  { transform: [{ scale: visual.imageScale }] },
                                ]}
                                resizeMode="contain"
                              />
                            </View>
                          ) : null}
                        <Text
                          style={[
                            styles.suggestionChipText,
                            active ? styles.suggestionChipTextActive : null,
                          ]}
                        >
                          {suggestion.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.buttonsRow}>
                <Pressable style={styles.secondaryButton} onPress={handleBack}>
                  <Text style={styles.secondaryButtonText}>{content.backLabel}</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.primaryButton,
                    isSubmitting ? styles.primaryButtonDisabled : null,
                  ]}
                  disabled={isSubmitting}
                  onPress={handleSubmit}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSubmitting ? content.submitLoadingLabel : content.submitLabel}
                  </Text>
                </Pressable>
              </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>

      <FormBottomSheet
        visible={isDateSheetOpen}
        onClose={() => setIsDateSheetOpen(false)}
        overlayStyle={styles.sheetOverlay}
        backdropStyle={styles.sheetBackdrop}
        sheetStyle={styles.dateSheetCard}
      >
        {({ panHandlers }) => (
          <>
            <View style={styles.sheetDragZone} {...panHandlers}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{content.dateSheetTitle}</Text>
              <Text style={styles.sheetSubtitle}>{content.dateLabel}</Text>
            </View>

            <View style={styles.dateSheetPreview}>
              <Text style={styles.dateSheetPreviewText}>
                {formatIllnessDateLabel(selectedDate, locale)}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScrollContent}
            >
              {dateOptions.map((dateIso) => {
                const active = dateIso.slice(0, 10) === selectedDate.slice(0, 10);
                return (
                  <Pressable
                    key={dateIso}
                    onPress={() => {
                      setSelectedDate(dateIso);
                      setIsDateSheetOpen(false);
                    }}
                    style={[styles.dateOption, active ? styles.dateOptionActive : null]}
                  >
                    <Text
                      style={[
                        styles.dateOptionText,
                        active ? styles.dateOptionTextActive : null,
                      ]}
                    >
                      {formatIllnessDateLabel(dateIso, locale)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}
      </FormBottomSheet>

      {isLeaveConfirmOpen ? (
        <View style={styles.confirmOverlay}>
          <Pressable style={styles.confirmBackdrop} onPress={() => setIsLeaveConfirmOpen(false)} />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{content.leaveTitle}</Text>
            <Text style={styles.confirmDescription}>{content.leaveDescription}</Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setIsLeaveConfirmOpen(false)}
              >
                <Text style={styles.secondaryButtonText}>{content.stayLabel}</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  setIsLeaveConfirmOpen(false);
                  onBack();
                }}
              >
                <Text style={styles.primaryButtonText}>{content.leaveConfirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

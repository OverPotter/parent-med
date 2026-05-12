import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { AssetWarmupLayer } from "../../../shared/components/AssetWarmupLayer";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import {
  type ChildAvatarGender,
  getChildAvatarGenderByKey,
  getChildAvatarPresets,
  getChildAvatarPresetSources,
  getChildAvatarSourceByKey,
  type ChildAvatarPresetKey,
} from "../model/childrenRedesign";
import { getChildCreateContent } from "../model/childCreateContent";
import {
  BirthDatePickerSheet,
  TextEditorSheet,
} from "../../child-profile-edit/screens/ChildProfileEditParts";
import { parseBirthDate } from "../../child-profile-edit/model/childProfileEditHelpers";
import { ChildAvatarPickerSheet } from "./ChildCreateParts";
import { styles } from "./childCreateStyles";

type ChildCreateScreenProps = {
  visible: boolean;
  onBack: () => void;
  onSubmit: (payload: {
    name: string;
    birthDate: string | null;
    avatarKey: ChildAvatarPresetKey | null;
    gender: ChildAvatarGender | null;
    babyModeEnabled: boolean;
    weightKg: number | null;
    heightCm: number | null;
    allergies: string | null;
    notes: string | null;
  }) => Promise<void> | void;
};

function parsePositiveNumber(value: string) {
  const normalized = Number(value.trim().replace(",", "."));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

export function ChildCreateScreen({
  visible,
  onBack,
  onSubmit,
}: ChildCreateScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const copy = getChildCreateContent(locale);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });
  const scrollRef = useRef<ScrollView | null>(null);
  const [name, setName] = useState("");
  const [birthDateLabel, setBirthDateLabel] = useState("");
  const [birthDateIso, setBirthDateIso] = useState<string | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [selectedAvatarKey, setSelectedAvatarKey] =
    useState<ChildAvatarPresetKey | null>(null);
  const [babyModeEnabled, setBabyModeEnabled] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [avatarPickerGender, setAvatarPickerGender] =
    useState<ChildAvatarGender>("boy");
  const [textEditorField, setTextEditorField] = useState<
    "allergies" | "notes" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarOptions = useMemo(
    () => getChildAvatarPresets(avatarPickerGender),
    [avatarPickerGender],
  );
  const avatarWarmupSources = useMemo(() => getChildAvatarPresetSources(), []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName("");
    setBirthDateLabel("");
    setBirthDateIso(null);
    setWeightKg("");
    setHeightCm("");
    setSelectedAvatarKey(null);
    setBabyModeEnabled(false);
    setAllergies("");
    setNotes("");
    setIsDateSheetOpen(false);
    setIsAvatarPickerOpen(false);
    setAvatarPickerGender("boy");
    setTextEditorField(null);
    setIsSubmitting(false);
  }, [visible]);

  const confirmedGender = getChildAvatarGenderByKey(selectedAvatarKey);
  const selectedAvatarSource = getChildAvatarSourceByKey(selectedAvatarKey);
  const previewName = name.trim() || copy.previewName;
  const previewMetaParts = [
    birthDateLabel.trim() || null,
    weightKg.trim() ? `${weightKg.trim()} kg` : null,
    heightCm.trim() ? `${heightCm.trim()} cm` : null,
  ].filter(Boolean) as string[];
  const previewMeta = previewMetaParts.length
    ? previewMetaParts.join(" • ")
    : copy.previewMeta;
  const canSubmit = name.trim().length > 0 && !isSubmitting;
  const placeholderColor = "#A6AFB8";

  const handleOpenAvatarPicker = () => {
    setAvatarPickerGender(confirmedGender ?? "boy");
    setIsAvatarPickerOpen(true);
  };

  const handleCloseAvatarPicker = () => {
    setAvatarPickerGender(confirmedGender ?? "boy");
    setIsAvatarPickerOpen(false);
  };

  const scrollToLowerInputs = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 280, animated: true });
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

      <View style={styles.root}>
        <View
          style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
          {...panHandlers}
        />
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={16}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable onPress={onBack} style={styles.backLink}>
              <Text style={styles.backLinkText}>
                {"← "}
                {copy.back}
              </Text>
            </Pressable>

            <View style={styles.heroCard}>
              <Pressable
                onPress={handleOpenAvatarPicker}
                style={({ pressed }) => [
                  styles.avatarWrap,
                  pressed ? styles.avatarWrapPressed : null,
                ]}
              >
                {selectedAvatarSource ? (
                  <Image
                    source={selectedAvatarSource}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.avatarPlaceholderWrap}>
                    <Feather name="camera" size={30} color="#D2847A" />
                    <View style={styles.avatarPlaceholderPlus}>
                      <Feather name="plus" size={12} color="#FFFFFF" />
                    </View>
                  </View>
                )}
              </Pressable>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>{previewName}</Text>
                <Text style={styles.heroMeta}>{previewMeta}</Text>
              </View>
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{copy.identity}</Text>
              <View style={styles.cardList}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{copy.nameLabel}</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={copy.namePlaceholder}
                    placeholderTextColor={placeholderColor}
                    style={styles.textInput}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    onFocus={scrollToLowerInputs}
                  />
                </View>
                <View style={styles.fieldDivider} />
                <Pressable
                  onPress={() => setIsDateSheetOpen(true)}
                  style={({ pressed }) => [
                    styles.fieldRow,
                    pressed ? { opacity: 0.9 } : null,
                  ]}
                >
                  <Text style={styles.fieldLabel}>{copy.birthDateLabel}</Text>
                  <View style={styles.dateButton}>
                    <Text
                      style={[
                        styles.dateValue,
                        !birthDateLabel ? styles.placeholderText : null,
                      ]}
                    >
                      {birthDateLabel || copy.birthDatePlaceholder}
                    </Text>
                    <Feather name="chevron-right" size={16} color="#9AA7B3" />
                  </View>
                </Pressable>
                <View style={styles.fieldDivider} />
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{copy.weightLabel}</Text>
                  <TextInput
                    value={weightKg}
                    onChangeText={setWeightKg}
                    placeholder={copy.weightPlaceholder}
                    placeholderTextColor={placeholderColor}
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    autoCorrect={false}
                    onFocus={scrollToLowerInputs}
                  />
                </View>
                <View style={styles.fieldDivider} />
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{copy.heightLabel}</Text>
                  <TextInput
                    value={heightCm}
                    onChangeText={setHeightCm}
                    placeholder={copy.heightPlaceholder}
                    placeholderTextColor={placeholderColor}
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    autoCorrect={false}
                    onFocus={scrollToLowerInputs}
                  />
                </View>
                <View style={styles.fieldDivider} />
                <Pressable
                  onPress={() => setTextEditorField("allergies")}
                  style={({ pressed }) => [
                    styles.fieldRow,
                    pressed ? { opacity: 0.9 } : null,
                  ]}
                >
                  <Text style={styles.fieldLabel}>{copy.allergiesTitle}</Text>
                  <View style={styles.dateButton}>
                    <Text
                      style={[
                        styles.dateValue,
                        !allergies ? styles.placeholderText : null,
                      ]}
                      numberOfLines={1}
                    >
                      {allergies || copy.allergiesPlaceholder}
                    </Text>
                    <Feather name="chevron-right" size={16} color="#9AA7B3" />
                  </View>
                </Pressable>
                <View style={styles.fieldDivider} />
                <Pressable
                  onPress={() => setTextEditorField("notes")}
                  style={({ pressed }) => [
                    styles.fieldRow,
                    pressed ? { opacity: 0.9 } : null,
                  ]}
                >
                  <Text style={styles.fieldLabel}>{copy.notesTitle}</Text>
                  <View style={styles.dateButton}>
                    <Text
                      style={[
                        styles.dateValue,
                        !notes ? styles.placeholderText : null,
                      ]}
                      numberOfLines={1}
                    >
                      {notes || copy.notesPlaceholder}
                    </Text>
                    <Feather name="chevron-right" size={16} color="#9AA7B3" />
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{copy.babyModeTitle}</Text>
              <View style={styles.cardList}>
                <View style={styles.switchRow}>
                  <View style={styles.switchTextWrap}>
                    <Text style={styles.fieldLabel}>{copy.babyModeTitle}</Text>
                    <Text style={styles.rowDescription}>
                      {copy.babyModeDescription}
                    </Text>
                  </View>
                  <Switch
                    value={babyModeEnabled}
                    onValueChange={setBabyModeEnabled}
                    trackColor={{ false: "#E7DDD7", true: "#46C06F" }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#E7DDD7"
                  />
                </View>
              </View>
            </View>

            <Pressable
              disabled={!canSubmit}
              onPress={async () => {
                if (!canSubmit) {
                  return;
                }

                setIsSubmitting(true);

                try {
                  await onSubmit({
                    name: name.trim(),
                    birthDate: birthDateIso,
                    avatarKey: selectedAvatarKey,
                    gender: confirmedGender,
                    babyModeEnabled,
                    weightKg: parsePositiveNumber(weightKg),
                    heightCm: parsePositiveNumber(heightCm),
                    allergies: allergies.trim() || null,
                    notes: notes.trim() || null,
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                !canSubmit ? styles.primaryButtonDisabled : null,
                canSubmit && pressed ? styles.primaryButtonPressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>{copy.save}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
        <AssetWarmupLayer active={visible} assetModules={avatarWarmupSources} />
      </View>

      <BirthDatePickerSheet
        visible={isDateSheetOpen}
        locale={locale}
        initialValue={birthDateLabel}
        onClose={() => setIsDateSheetOpen(false)}
        onApply={(value) => {
          const parsed = parseBirthDate(value, locale);
          const yyyy = String(parsed.year);
          const mm = String(parsed.monthIndex + 1).padStart(2, "0");
          const dd = String(parsed.day).padStart(2, "0");
          setBirthDateLabel(value);
          setBirthDateIso(`${yyyy}-${mm}-${dd}`);
          setIsDateSheetOpen(false);
        }}
      />
      <ChildAvatarPickerSheet
        visible={isAvatarPickerOpen}
        title={copy.avatarTitle}
        boyLabel={copy.genderBoy}
        girlLabel={copy.genderGirl}
        gender={avatarPickerGender}
        onChangeGender={setAvatarPickerGender}
        options={avatarOptions}
        selectedAvatarKey={selectedAvatarKey}
        onClose={handleCloseAvatarPicker}
        onSelect={(key) => {
          if (selectedAvatarKey === key) {
            setSelectedAvatarKey(null);
            handleCloseAvatarPicker();
            return;
          }

          setSelectedAvatarKey(key);
          handleCloseAvatarPicker();
        }}
      />
      <TextEditorSheet
        visible={textEditorField !== null}
        locale={locale}
        title={
          textEditorField === "allergies"
            ? copy.allergiesTitle
            : copy.notesTitle
        }
        initialValue={textEditorField === "allergies" ? allergies : notes}
        onClose={() => setTextEditorField(null)}
        onApply={(value) => {
          if (textEditorField === "allergies") {
            setAllergies(value);
          } else if (textEditorField === "notes") {
            setNotes(value);
          }
          setTextEditorField(null);
        }}
      />
    </Animated.View>
  );
}

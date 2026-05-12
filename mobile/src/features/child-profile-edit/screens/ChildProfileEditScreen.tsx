import { useEffect, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { AssetWarmupLayer } from "../../../shared/components/AssetWarmupLayer";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ChildCard } from "../../children/model/childrenRedesign";
import {
  type ChildAvatarGender,
  getChildAvatarGenderByKey,
  getChildAvatarPresets,
  getChildAvatarPresetSources,
  getChildAvatarSourceByKey,
  type ChildAvatarPresetKey,
} from "../../children/model/childrenRedesign";
import { buildChildProfileEditContent } from "../model/childProfileEdit";
import { formatBirthDateFromIso } from "../model/childProfileEditHelpers";
import {
  AvatarPickerSheet,
  BirthDatePickerSheet,
  ChildProfileEditActions,
  ChildProfileEditHeroCard,
  ChildProfileHealthSection,
  ChildProfileMainSection,
  ChildProfileTogglesSection,
  TextEditorSheet,
} from "./ChildProfileEditParts";
import { styles } from "./childProfileEditStyles";

type ChildProfileEditScreenProps = {
  child: ChildCard;
  visible: boolean;
  onBack: () => void;
  onSave?: (payload: {
    name: string;
    birthDate: string | null;
    avatarKey: ChildAvatarPresetKey | null;
    gender: string | null;
    babyModeEnabled: boolean;
    allergies: string | null;
    notes: string | null;
  }) => void | Promise<void>;
  onDelete?: (() => void | Promise<void>) | null;
};

export function ChildProfileEditScreen({
  child,
  visible,
  onBack,
  onSave,
  onDelete,
}: ChildProfileEditScreenProps) {
  const { locale, copy } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildChildProfileEditContent(child, locale, copy);
  const defaultBirthDate = content.sections.main.rows[1]?.value ?? "";
  const defaultAllergies = child.child.allergies ?? "";
  const defaultNotes = child.child.notes ?? "";
  const [selectedAvatarKey, setSelectedAvatarKey] =
    useState<ChildAvatarPresetKey | null>(
      (child.child.avatarKey as ChildAvatarPresetKey | null) ?? null,
    );
  const selectedAvatarGender = getChildAvatarGenderByKey(selectedAvatarKey);
  const avatarGenderFromProfile = getChildAvatarGenderByKey(
    child.child.avatarKey as ChildAvatarPresetKey | null,
  );
  const [avatarPickerGender, setAvatarPickerGender] =
    useState<ChildAvatarGender>(avatarGenderFromProfile ?? "boy");
  const [editableName, setEditableName] = useState(content.childName);
  const [editableBirthDate, setEditableBirthDate] = useState(
    child.child.birthDate,
  );
  const [editableAllergies, setEditableAllergies] = useState(defaultAllergies);
  const [editableNotes, setEditableNotes] = useState(defaultNotes);
  const [editingField, setEditingField] = useState<"childName" | null>(null);
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [textEditorField, setTextEditorField] = useState<
    "allergies" | "notes" | null
  >(null);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled:
      visible &&
      !isAvatarSheetOpen &&
      !isDateSheetOpen &&
      textEditorField === null,
    width,
    onBack,
  });
  const [babyModeEnabled, setBabyModeEnabled] = useState(
    content.sections.settings.rows[0]?.enabled ?? true,
  );
  const defaultBabyModeEnabled =
    content.sections.settings.rows[0]?.enabled ?? true;

  useEffect(() => {
    setSelectedAvatarKey(
      (child.child.avatarKey as ChildAvatarPresetKey | null) ?? null,
    );
    setAvatarPickerGender(
      getChildAvatarGenderByKey(
        child.child.avatarKey as ChildAvatarPresetKey | null,
      ) ?? "boy",
    );
    setEditableName(content.childName);
    setEditableBirthDate(child.child.birthDate);
    setEditableAllergies(defaultAllergies);
    setEditableNotes(defaultNotes);
    setEditingField(null);
    setTextEditorField(null);
    setBabyModeEnabled(defaultBabyModeEnabled);
  }, [
    content.childName,
    child.child.avatarKey,
    child.child.allergies,
    child.child.birthDate,
    child.child.notes,
    defaultBabyModeEnabled,
    defaultAllergies,
    defaultNotes,
    visible,
  ]);

  const hasLockedAvatarGender = avatarGenderFromProfile !== null;
  const avatarOptions = getChildAvatarPresets(
    hasLockedAvatarGender ? avatarGenderFromProfile : avatarPickerGender,
  );
  const avatarWarmupSources = getChildAvatarPresetSources(
    hasLockedAvatarGender ? avatarGenderFromProfile : null,
  );
  const heroAvatarSource =
    getChildAvatarSourceByKey(selectedAvatarKey) ?? child.avatarSource;
  const editableBirthDateLabel =
    formatBirthDateFromIso(editableBirthDate, locale) || defaultBirthDate;

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
            { backgroundColor: surfaceTheme.backgroundOverlaySoftColor },
          ]}
        />
        <View style={styles.root}>
          <View
            style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
            {...panHandlers}
          />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Pressable onPress={onBack} style={styles.backLink}>
              <Text style={styles.backLinkText}>
                {"← "}
                {content.backLabel}
              </Text>
            </Pressable>

            <View style={styles.titleWrap}>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>

            <ChildProfileEditHeroCard
              avatarSource={heroAvatarSource}
              childName={editableName}
              childMeta={content.childMeta.replace(
                defaultBirthDate,
                editableBirthDateLabel,
              )}
              changePhotoLabel={content.changePhotoLabel}
              onPressChangePhoto={() => {
                if (!hasLockedAvatarGender) {
                  setAvatarPickerGender(selectedAvatarGender ?? "boy");
                }
                setIsAvatarSheetOpen(true);
              }}
            />

            <ChildProfileMainSection
              content={content}
              editableName={editableName}
              editableBirthDate={editableBirthDateLabel}
              editingField={editingField}
              onStartEditingName={() => setEditingField("childName")}
              onChangeName={setEditableName}
              onFinishEditingName={() => setEditingField(null)}
              onOpenBirthDate={() => setIsDateSheetOpen(true)}
            />

            <ChildProfileHealthSection
              content={content}
              editableAllergies={editableAllergies}
              editableNotes={editableNotes}
              onOpenTextEditor={setTextEditorField}
            />

            <ChildProfileTogglesSection
              content={content}
              babyModeEnabled={babyModeEnabled}
              onToggleBabyMode={setBabyModeEnabled}
            />

            <ChildProfileEditActions
              saveLabel={content.actions.save}
              deleteLabel={content.actions.delete}
              onPressSave={() =>
                onSave?.({
                  name: editableName.trim(),
                  birthDate: editableBirthDate,
                  avatarKey: selectedAvatarKey,
                  gender:
                    selectedAvatarKey != null
                      ? getChildAvatarGenderByKey(selectedAvatarKey)
                      : child.child.gender,
                  babyModeEnabled,
                  allergies: editableAllergies.trim() || null,
                  notes: editableNotes.trim() || null,
                })
              }
              onPressDelete={onDelete ?? null}
            />
          </ScrollView>
        </View>
      </ImageBackground>
      <AvatarPickerSheet
        visible={isAvatarSheetOpen}
        locale={locale}
        onClose={() => setIsAvatarSheetOpen(false)}
        options={avatarOptions}
        gender={avatarPickerGender}
        showGenderSwitch={!hasLockedAvatarGender}
        onChangeGender={setAvatarPickerGender}
        selectedAvatarKey={selectedAvatarKey}
        onSelect={(avatarKey) => {
          setSelectedAvatarKey(avatarKey);
          setIsAvatarSheetOpen(false);
        }}
      />
      <AssetWarmupLayer active={visible} assetModules={avatarWarmupSources} />
      <BirthDatePickerSheet
        visible={isDateSheetOpen}
        locale={locale}
        initialValue={editableBirthDateLabel}
        onClose={() => setIsDateSheetOpen(false)}
        onApply={(value) => {
          setEditableBirthDate(value);
          setIsDateSheetOpen(false);
        }}
      />
      <TextEditorSheet
        visible={textEditorField !== null}
        locale={locale}
        title={
          textEditorField === "allergies"
            ? (content.sections.health.rows[0]?.label ?? "")
            : (content.sections.health.rows[1]?.label ?? "")
        }
        initialValue={
          textEditorField === "allergies" ? editableAllergies : editableNotes
        }
        onClose={() => setTextEditorField(null)}
        onApply={(value) => {
          if (textEditorField === "allergies") {
            setEditableAllergies(value);
          } else if (textEditorField === "notes") {
            setEditableNotes(value);
          }
          setTextEditorField(null);
        }}
      />
    </Animated.View>
  );
}

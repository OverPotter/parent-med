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
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ChildCard } from "../../children/model/childrenRedesign";
import { buildChildProfileEditContent } from "../model/childProfileEdit";
import { avatarOptions } from "../model/childProfileEditHelpers";
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
};

export function ChildProfileEditScreen({
  child,
  visible,
  onBack,
}: ChildProfileEditScreenProps) {
  const { locale, copy } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildChildProfileEditContent(child, locale, copy);
  const defaultBirthDate = content.sections.main.rows[1]?.value ?? "";
  const defaultAllergies = content.sections.health.rows[0]?.description ?? "";
  const defaultNotes = content.sections.health.rows[1]?.description ?? "";
  const [selectedAvatarSource, setSelectedAvatarSource] = useState(
    content.avatarSource,
  );
  const [editableName, setEditableName] = useState(content.childName);
  const [editableBirthDate, setEditableBirthDate] = useState(defaultBirthDate);
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
  const [liveActivityEnabled, setLiveActivityEnabled] = useState(
    content.sections.settings.rows[1]?.enabled ?? true,
  );

  useEffect(() => {
    setSelectedAvatarSource(content.avatarSource);
    setEditableName(content.childName);
    setEditableBirthDate(defaultBirthDate);
    setEditableAllergies(defaultAllergies);
    setEditableNotes(defaultNotes);
    setEditingField(null);
    setTextEditorField(null);
  }, [
    content.avatarSource,
    content.childName,
    defaultAllergies,
    defaultNotes,
    defaultBirthDate,
    visible,
  ]);

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
              avatarSource={selectedAvatarSource}
              childName={editableName}
              childMeta={content.childMeta.replace(defaultBirthDate, editableBirthDate)}
              changePhotoLabel={content.changePhotoLabel}
              onPressChangePhoto={() => setIsAvatarSheetOpen(true)}
            />

            <ChildProfileMainSection
              content={content}
              editableName={editableName}
              editableBirthDate={editableBirthDate}
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
              liveActivityEnabled={liveActivityEnabled}
              onToggleBabyMode={setBabyModeEnabled}
              onToggleLiveActivity={setLiveActivityEnabled}
            />

            <ChildProfileEditActions
              saveLabel={content.actions.save}
              deleteLabel={content.actions.delete}
            />
          </ScrollView>
        </View>
      </ImageBackground>
      <AvatarPickerSheet
        visible={isAvatarSheetOpen}
        locale={locale}
        onClose={() => setIsAvatarSheetOpen(false)}
        selectedAvatarSource={selectedAvatarSource}
        onSelect={(avatarSource) => {
          setSelectedAvatarSource(avatarSource);
          setIsAvatarSheetOpen(false);
        }}
      />
      <BirthDatePickerSheet
        visible={isDateSheetOpen}
        locale={locale}
        initialValue={editableBirthDate}
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

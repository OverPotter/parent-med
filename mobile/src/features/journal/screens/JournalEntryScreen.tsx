import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ChildCard } from "../../children/model/childrenRedesign";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  buildJournalEntryScreenContent,
  JournalEntryKind,
} from "../model/journalEntryScreen";
import { styles } from "./journalEntryScreenStyles";

type JournalEntryScreenProps = {
  child: ChildCard;
  kind: JournalEntryKind;
  visible?: boolean;
  onBack?: () => void;
};

const noop = () => {};

export function JournalEntryScreen({
  child,
  kind,
  visible = true,
  onBack = noop,
}: JournalEntryScreenProps) {
  const { locale } = useMobileI18n();
  const content = buildJournalEntryScreenContent(kind, child.name, locale);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });

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
        source={redesignBackgrounds.childrenModule}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay} />
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
            <View style={styles.topBar}>
              <Pressable onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>{"← "}{content.backLabel}</Text>
              </Pressable>
            </View>

            <View style={styles.headerBlock}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>

            <View style={styles.childCard}>
              <View style={styles.childAvatarWrap}>
                <Image
                  source={child.avatarSource}
                  style={styles.childAvatar}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.childCopy}>
                <Text style={styles.childName}>{content.childName}</Text>
                <Text style={styles.childDate}>{content.dateLabel}</Text>
              </View>
              {content.iconSource ? (
                <Image
                  source={content.iconSource}
                  style={styles.headerArt}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.headerIconFallback}>
                  <MaterialCommunityIcons
                    name="scale-bathroom"
                    size={24}
                    color="#6AA58E"
                  />
                </View>
              )}
            </View>

            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipText}>{content.summaryChip}</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>{content.sectionTitle}</Text>
              <View style={styles.rowsList}>
                {content.rows.map((row, index) => (
                  <View key={row.id}>
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>{row.label}</Text>
                      <View style={styles.rowValueWrap}>
                        <Text style={styles.rowValue}>{row.value}</Text>
                        <Feather name="chevron-right" size={14} color="#A4AEB9" />
                      </View>
                    </View>
                    {row.helper ? (
                      <Text style={styles.rowHelper}>{row.helper}</Text>
                    ) : null}
                    {index < content.rows.length - 1 ? (
                      <View style={styles.rowDivider} />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>{content.notesTitle}</Text>
              <Text style={styles.notesBody}>{content.notesBody}</Text>
            </View>

            <Pressable style={({ pressed }) => [
              styles.saveButton,
              pressed ? styles.saveButtonPressed : null,
            ]}>
              <Text style={styles.saveButtonText}>{content.primaryActionLabel}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

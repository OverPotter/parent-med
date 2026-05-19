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
import {
  buildHelpScreenContent,
  type HelpScreenSection,
} from "../model/helpScreen";
import { styles } from "./helpScreenStyles";

type HelpScreenProps = {
  visible: boolean;
  onBack: () => void;
  onOpenChildren: () => void;
  onOpenJournal: () => void;
  onOpenPillbox: () => void;
  onOpenCabinet: () => void;
  onOpenFamily: () => void;
  onOpenSettings: () => void;
};

type HelpSectionCardProps = {
  section: HelpScreenSection;
  onPress: () => void;
  textPrimaryColor: string;
  textSecondaryColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  cardMutedBackgroundColor: string;
};

export function HelpScreen({
  visible,
  onBack,
  onOpenChildren,
  onOpenJournal,
  onOpenPillbox,
  onOpenCabinet,
  onOpenFamily,
  onOpenSettings,
}: HelpScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildHelpScreenContent(locale);
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
            <View style={styles.topBar}>
              <Pressable onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>
                  {"← "}
                  {content.backLabel}
                </Text>
              </Pressable>
            </View>

            <View style={styles.introBlock}>
              <Text style={[styles.title, { color: surfaceTheme.textPrimaryColor }]}>
                {content.title}
              </Text>
              <Text
                style={[styles.subtitle, { color: surfaceTheme.textSecondaryColor }]}
              >
                {content.subtitle}
              </Text>
            </View>

            {content.sections.map((section) => (
              <HelpSectionCard
                key={section.id}
                section={section}
                onPress={resolveSectionPressHandler(section.id, {
                  onOpenCabinet,
                  onOpenChildren,
                  onOpenFamily,
                  onOpenJournal,
                  onOpenPillbox,
                  onOpenSettings,
                })}
                textPrimaryColor={surfaceTheme.textPrimaryColor}
                textSecondaryColor={surfaceTheme.textSecondaryColor}
                cardBackgroundColor={surfaceTheme.cardBackgroundColor}
                cardBorderColor={surfaceTheme.cardBorderColor}
                cardMutedBackgroundColor={surfaceTheme.cardMutedBackgroundColor}
              />
            ))}
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

function HelpSectionCard({
  section,
  onPress,
  textPrimaryColor,
  textSecondaryColor,
  cardBackgroundColor,
  cardBorderColor,
  cardMutedBackgroundColor,
}: HelpSectionCardProps) {
  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: cardBorderColor,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderCopy}>
          <Text style={[styles.sectionTitle, { color: textPrimaryColor }]}>
            {section.title}
          </Text>
          <Text
            style={[styles.sectionDescription, { color: textSecondaryColor }]}
          >
            {section.description}
          </Text>
        </View>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.sectionActionButton,
            {
              backgroundColor: cardMutedBackgroundColor,
              borderColor: cardBorderColor,
            },
            pressed ? styles.sectionActionButtonPressed : null,
          ]}
        >
          <Text style={[styles.sectionActionButtonText, { color: textPrimaryColor }]}>
            {section.actionLabel}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionCaseExample, { color: textSecondaryColor }]}>
        {section.caseExample}
      </Text>
    </View>
  );
}

function resolveSectionPressHandler(
  sectionId: HelpScreenSection["id"],
  handlers: {
    onOpenChildren: () => void;
    onOpenJournal: () => void;
    onOpenPillbox: () => void;
    onOpenCabinet: () => void;
    onOpenFamily: () => void;
    onOpenSettings: () => void;
  },
) {
  switch (sectionId) {
    case "children":
      return handlers.onOpenChildren;
    case "journal":
      return handlers.onOpenJournal;
    case "pillbox":
      return handlers.onOpenPillbox;
    case "cabinet":
      return handlers.onOpenCabinet;
    case "family":
      return handlers.onOpenFamily;
    case "settings":
      return handlers.onOpenSettings;
  }
}

import { useMemo } from "react";
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

  const actionHandlers = useMemo(
    () => ({
      cabinet: onOpenCabinet,
      children: onOpenChildren,
      family: onOpenFamily,
      journal: onOpenJournal,
      pillbox: onOpenPillbox,
      settings: onOpenSettings,
    }),
    [
      onOpenCabinet,
      onOpenChildren,
      onOpenFamily,
      onOpenJournal,
      onOpenPillbox,
      onOpenSettings,
    ],
  );

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

            {content.sections.map((section) => {
              const actionHandler = section.actionTarget
                ? actionHandlers[section.actionTarget]
                : null;

              return (
                <View
                  key={section.id}
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: surfaceTheme.cardBackgroundColor,
                      borderColor: surfaceTheme.cardBorderColor,
                    },
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderCopy}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: surfaceTheme.textPrimaryColor },
                        ]}
                      >
                        {section.title}
                      </Text>
                      <Text
                        style={[
                          styles.sectionDescription,
                          { color: surfaceTheme.textSecondaryColor },
                        ]}
                      >
                        {section.description}
                      </Text>
                    </View>
                    {section.actionLabel && actionHandler ? (
                      <Pressable
                        onPress={actionHandler}
                        style={({ pressed }) => [
                          styles.sectionActionButton,
                          {
                            backgroundColor: surfaceTheme.cardMutedBackgroundColor,
                            borderColor: surfaceTheme.cardBorderColor,
                          },
                          pressed ? styles.sectionActionButtonPressed : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sectionActionButtonText,
                            { color: surfaceTheme.textPrimaryColor },
                          ]}
                        >
                          {section.actionLabel}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={styles.itemsWrap}>
                    {section.items.map((item) => (
                      <HelpScreenItem
                        key={`${section.id}-${item.title}`}
                        item={item}
                        textPrimaryColor={surfaceTheme.textPrimaryColor}
                        textSecondaryColor={surfaceTheme.textSecondaryColor}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

function HelpScreenItem({
  item,
  textPrimaryColor,
  textSecondaryColor,
}: {
  item: HelpScreenSection["items"][number];
  textPrimaryColor: string;
  textSecondaryColor: string;
}) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemBullet} />
      <View style={styles.itemCopy}>
        <Text style={[styles.itemTitle, { color: textPrimaryColor }]}>
          {item.title}
        </Text>
        <Text style={[styles.itemDescription, { color: textSecondaryColor }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );
}

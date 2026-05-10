import { useWindowDimensions, Animated, ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { buildLegalDocumentContent, type LegalDocumentKey } from "../model/legalDocuments";
import { styles } from "./legalDocumentScreenStyles";

type LegalDocumentScreenProps = {
  documentKey: LegalDocumentKey;
  visible: boolean;
  onBack: () => void;
};

export function LegalDocumentScreen({
  documentKey,
  visible,
  onBack,
}: LegalDocumentScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildLegalDocumentContent(locale, documentKey);
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
                  {locale === "ru" ? "← Назад" : locale === "pl" ? "← Wstecz" : "← Back"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.introBlock}>
              <Text style={[styles.title, { color: surfaceTheme.textPrimaryColor }]}>
                {content.title}
              </Text>
              <Text style={[styles.subtitle, { color: surfaceTheme.textSecondaryColor }]}>
                {content.subtitle}
              </Text>
              <Text style={[styles.updatedAt, { color: surfaceTheme.textMutedColor }]}>
                {content.updatedAtLabel}
              </Text>
            </View>

            {content.sections.map((section) => (
              <View key={section.title} style={styles.sectionBlock}>
                <Text style={[styles.sectionTitle, { color: surfaceTheme.textPrimaryColor }]}>
                  {section.title}
                </Text>
                {section.paragraphs?.map((paragraph) => (
                  <Text
                    key={paragraph}
                    style={[styles.paragraph, { color: surfaceTheme.textSecondaryColor }]}
                  >
                    {paragraph}
                  </Text>
                ))}
                {section.bullets?.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text
                      style={[styles.bulletText, { color: surfaceTheme.textSecondaryColor }]}
                    >
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

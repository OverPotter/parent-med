import { Feather } from "@expo/vector-icons";
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
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { AnalyticsEpisodeCard } from "../model/analyticsScreen";
import { buildAnalyticsBreakdownContent } from "../model/analyticsBreakdownScreen";
import { styles } from "./analyticsBreakdownScreenStyles";

type AnalyticsBreakdownScreenProps = {
  episode: AnalyticsEpisodeCard;
  onBack?: () => void;
};

const noop = () => {};

export function AnalyticsBreakdownScreen({
  episode,
  onBack = noop,
}: AnalyticsBreakdownScreenProps) {
  const { locale } = useMobileI18n();
  const content = buildAnalyticsBreakdownContent(episode, locale);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: true,
    width,
    onBack,
  });

  return (
    <Animated.View
      style={[styles.overlayLayer, { transform: [{ translateX }] }]}
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

            <View style={styles.selectorCard}>
              <View style={styles.selectorAvatarWrap}>
                <Image
                  source={childrenScreenAssets.avatars.boyBlackHair}
                  style={styles.selectorAvatar}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.selectorCopy}>
                <Text style={styles.selectorName}>{content.childName}</Text>
                <Text style={styles.selectorDate}>{content.childDate}</Text>
              </View>
              <Feather name="chevron-down" size={20} color="#6F7C8C" />
            </View>

            <View style={styles.episodeChip}>
              <Text style={styles.episodeChipText}>{content.episodeChipLabel}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{content.summaryTitle}</Text>
              <View style={styles.summaryLines}>
                {content.summaryLines.map((line) => (
                  <Text key={line} style={styles.summaryLine}>
                    {line}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.infoCardsRow}>
              {content.infoCards.map((card) => (
                <View key={card.id} style={styles.infoCard}>
                  <Text style={styles.infoLabel}>{card.label}</Text>
                  <Text style={styles.infoValue}>{card.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>{content.progressTitle}</Text>
              <View style={styles.progressRow}>
                {content.progressItems.map((item, index) => (
                  <View key={item.id} style={styles.progressColumn}>
                    <Text style={styles.progressValue}>{item.value}</Text>
                    <Text style={styles.progressLabel}>{item.label}</Text>
                    {index < content.progressItems.length - 1 ? (
                      <View style={styles.progressDivider} />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.temperatureSection}>
              <Text style={styles.temperatureTitle}>{content.temperatureTitle}</Text>
              <View style={styles.temperatureCard}>
                <View style={styles.temperatureCopy}>
                  <Text style={styles.temperatureText}>
                    {content.temperatureEmptyState}
                  </Text>
                </View>
                <View style={styles.temperatureArtWrap}>
                  <View style={styles.temperatureArtGlow} />
                  <Image
                    source={redesignSharedIcons.illnessBadge}
                    style={styles.temperatureArt}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

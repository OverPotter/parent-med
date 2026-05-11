import { Ionicons } from "@expo/vector-icons";
import { Animated, Image, ImageBackground, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileAuthSession } from "../../auth/api/authApi";
import type { ChildCard } from "../../children/model/childrenRedesign";
import { illnessAssets } from "../../illness/assets";
import { AnalyticsEpisodeCard } from "../model/analyticsScreen";
import { buildAnalyticsBreakdownContent } from "../model/analyticsBreakdownScreen";
import { styles } from "./analyticsBreakdownScreenStyles";
import { useAnalyticsBreakdownState } from "./useAnalyticsBreakdownState";

type AnalyticsBreakdownScreenProps = {
  child: ChildCard;
  authSession: Pick<MobileAuthSession, "accessToken">;
  episode: AnalyticsEpisodeCard;
  onBack?: () => void;
};

const noop = () => {};

export function AnalyticsBreakdownScreen({
  child,
  authSession,
  episode,
  onBack = noop,
}: AnalyticsBreakdownScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const { insights } = useAnalyticsBreakdownState({
    authSession,
    episodeId: episode.id,
  });
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: true,
    width,
    onBack,
  });
  const content = buildAnalyticsBreakdownContent(episode, locale, {
    child,
    insights,
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
        <View
          style={[
            styles.overlay,
            { backgroundColor: surfaceTheme.backgroundOverlayColor },
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
                <Text style={styles.backLinkText}>{"← "}{content.backLabel}</Text>
              </Pressable>
            </View>

            <View style={styles.headerBlock}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.selectorCardCompact}>
                <View style={styles.selectorAvatarWrap}>
                  <Image
                    source={child.avatarSource}
                    style={styles.selectorAvatar}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.selectorCopy}>
                  <View style={styles.selectorTopRow}>
                    <Text style={styles.selectorName}>{content.childName}</Text>
                    <View style={styles.episodeChip}>
                      <Text style={styles.episodeChipText}>
                        {content.episodeChipLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.selectorDate}>{content.childDate}</Text>
                </View>
              </View>
              <View style={styles.summaryTipsWrap}>
                {content.summaryTips.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.progressTip,
                      styles.summaryTip,
                      {
                        backgroundColor: item.accent.background,
                        borderColor: item.accent.border,
                      },
                    ]}
                  >
                    <View style={styles.progressTipContent}>
                      <View
                        style={[
                          styles.progressTipIconWrap,
                          { backgroundColor: item.accent.iconBackground },
                        ]}
                      >
                        <ProgressIcon
                          icon={item.icon}
                          color={item.accent.iconColor}
                        />
                      </View>
                      <Text style={styles.progressTipText}>{item.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.summaryLines}>
                {content.summaryLines.map((line) => (
                  <Text key={line} style={styles.summaryLine}>
                    {line}
                  </Text>
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

function ProgressIcon({
  icon,
  color,
}: {
  icon: "duration" | "medicine" | "temperature" | "mode";
  color: string;
}) {
  if (icon === "duration") {
    return <Ionicons name="time-outline" size={16} color={color} />;
  }

  if (icon === "medicine") {
    return (
      <Image
        source={illnessAssets.journal.quickMedicine}
        style={styles.progressTipMedicineAssetIcon}
        resizeMode="contain"
      />
    );
  }

  if (icon === "temperature") {
    return <Ionicons name="thermometer-outline" size={16} color={color} />;
  }

  return <Ionicons name="notifications-outline" size={20} color={color} />;
}

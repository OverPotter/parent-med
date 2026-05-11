import { Animated, Image, ImageBackground, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { ChildCard } from "../../children/model/childrenRedesign";
import type { IllnessQuickActionKind } from "../model/illnessObservation";

type IllnessActionPlaceholderScreenProps = {
  child: ChildCard;
  kind: IllnessQuickActionKind;
  visible: boolean;
  onBack: () => void;
};

const copyByKind = {
  temperature: {
    ru: {
      title: "Температура",
      subtitle: "Здесь будет отдельный экран добавления температуры.",
      body: "Пока это заглушка, но действие уже открывает отдельный экран, а не создаёт запись сразу.",
    },
    en: {
      title: "Temperature",
      subtitle: "A dedicated temperature screen will live here.",
      body: "This is a placeholder for now, but the action already opens a separate screen instead of creating an entry instantly.",
    },
  },
  medicine: {
    ru: {
      title: "Приём",
      subtitle: "Здесь будет отдельный экран добавления приёма.",
      body: "Пока это заглушка, но действие уже открывает отдельный экран, а не создаёт запись сразу.",
    },
    en: {
      title: "Dose",
      subtitle: "A dedicated medicine screen will live here.",
      body: "This is a placeholder for now, but the action already opens a separate screen instead of creating an entry instantly.",
    },
  },
  note: {
    ru: {
      title: "Заметка",
      subtitle: "Здесь будет отдельный экран заметки.",
      body: "Пока это заглушка, но действие уже открывает отдельный экран, а не создаёт запись сразу.",
    },
    en: {
      title: "Note",
      subtitle: "A dedicated note screen will live here.",
      body: "This is a placeholder for now, but the action already opens a separate screen instead of creating an entry instantly.",
    },
  },
  reminder: {
    ru: {
      title: "Напоминание",
      subtitle: "Здесь будет отдельный экран напоминания.",
      body: "Пока это заглушка, но действие уже открывает отдельный экран, а не создаёт запись сразу.",
    },
    en: {
      title: "Reminder",
      subtitle: "A dedicated reminder screen will live here.",
      body: "This is a placeholder for now, but the action already opens a separate screen instead of creating an entry instantly.",
    },
  },
} as const;

export function IllnessActionPlaceholderScreen({
  child,
  kind,
  visible,
  onBack,
}: IllnessActionPlaceholderScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const copy = locale === "ru" ? copyByKind[kind].ru : copyByKind[kind].en;
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
        <View
          style={[
            styles.backgroundOverlay,
            { backgroundColor: surfaceTheme.backgroundOverlayColor },
          ]}
        />
      </ImageBackground>

      <View style={styles.screen}>
        <View style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]} {...panHandlers} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={onBack} style={styles.backLink}>
            <Text style={styles.backLinkText}>
              {locale === "ru" ? "← Назад к журналу" : "← Back to journal"}
            </Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>
              {copy.title} · {child.name}
            </Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.copy}>
              <Text style={styles.cardTitle}>{copy.title}</Text>
              <Text style={styles.cardBody}>{copy.body}</Text>
            </View>
            <View style={styles.avatarWrap}>
              <Image source={child.avatarSource} style={styles.avatar} resizeMode="contain" />
            </View>
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = {
  overlayLayer: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 32,
  },
  overlayLayerHidden: { opacity: 0 },
  overlayLayerVisible: { opacity: 1 },
  swipeBackEdge: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
  },
  background: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  backgroundImage: {
    width: "100%" as const,
    height: "100%" as const,
  },
  backgroundOverlay: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255,248,241,0.58)",
  },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 18,
  },
  backLink: { alignSelf: "flex-start", paddingVertical: 4 },
  backLinkText: { color: "#3E4B5C", fontSize: 16, lineHeight: 20, fontWeight: "600" as const },
  header: { gap: 8, paddingHorizontal: 2 },
  title: {
    color: "#252B35",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800" as const,
    letterSpacing: -1.2,
  },
  subtitle: {
    maxWidth: 300,
    color: "#6F7178",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "500" as const,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#EFDDD2",
    backgroundColor: "#FFF8F1",
    padding: 20,
    flexDirection: "row" as const,
    gap: 14,
    alignItems: "center" as const,
  },
  copy: { flex: 1, gap: 10 },
  cardTitle: {
    color: "#252B35",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700" as const,
  },
  cardBody: {
    color: "#5F636B",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500" as const,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#F7E6DB",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
    flexShrink: 0,
  },
  avatar: {
    width: 78,
    height: 78,
  },
};

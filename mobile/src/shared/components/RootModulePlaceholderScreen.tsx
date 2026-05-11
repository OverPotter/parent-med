import { ImageBackground, Text, View } from "react-native";
import { childrenScreenAssets } from "../../redesign/screens/children/manifest";
import { useMobileI18n } from "../i18n/mobileI18n";
import { MobileBottomTabKey } from "./MobileBottomTabBar";

type RootModulePlaceholderScreenProps = {
  tabKey: Exclude<MobileBottomTabKey, "children">;
};

const placeholderCopy = {
  pillbox: {
    ru: {
      title: "Таблетки",
      subtitle: "Пока здесь будет спокойная заглушка.",
      body: "Вкладка уже переключается, а сам модуль пока оставили как чистую заглушку на нашем фоне.",
    },
    de: {
      title: "Tabletten",
      subtitle: "Hier bleibt vorerst ein ruhiger Platzhalter.",
      body: "Der Tab funktioniert bereits, das Modul selbst bleibt aber vorerst ein sauberer Platzhalter auf unserem gemeinsamen Hintergrund.",
    },
    pl: {
      title: "Tabletki",
      subtitle: "Na razie zostaje tu spokojny placeholder.",
      body: "Zakładka już działa, a sam moduł zostaje na razie czystym placeholderem na naszym wspólnym tle.",
    },
    en: {
      title: "Pillbox",
      subtitle: "A calm placeholder lives here for now.",
      body: "The tab now switches correctly, while the module itself stays a clean placeholder on our shared background.",
    },
  },
  cabinet: {
    ru: {
      title: "Аптечка",
      subtitle: "Пока собираем экран в общем визуальном языке.",
      body: "Вкладка уже переключается, а сам модуль пока оставили как чистую заглушку на нашем фоне.",
    },
    de: {
      title: "Medikamentenschrank",
      subtitle: "Dieser Bildschirm wird gerade in der gemeinsamen Designsprache aufgebaut.",
      body: "Der Tab funktioniert bereits, das Modul selbst bleibt aber vorerst ein sauberer Platzhalter auf unserem gemeinsamen Hintergrund.",
    },
    pl: {
      title: "Apteczka",
      subtitle: "Ten ekran budujemy teraz we wspólnym języku wizualnym.",
      body: "Zakładka już działa, a sam moduł zostaje na razie czystym placeholderem na naszym wspólnym tle.",
    },
    en: {
      title: "Cabinet",
      subtitle: "This screen will be rebuilt in the shared visual language.",
      body: "The tab now switches correctly, while the module itself stays a clean placeholder on our shared background.",
    },
  },
  more: {
    ru: {
      title: "Ещё",
      subtitle: "Скоро сюда добавим остальные разделы.",
      body: "Вкладка уже переключается, а сам модуль пока оставили как чистую заглушку на нашем фоне.",
    },
    de: {
      title: "Mehr",
      subtitle: "Weitere Bereiche kommen bald hierher.",
      body: "Der Tab funktioniert bereits, das Modul selbst bleibt aber vorerst ein sauberer Platzhalter auf unserem gemeinsamen Hintergrund.",
    },
    pl: {
      title: "Więcej",
      subtitle: "Wkrótce dodamy tu pozostałe sekcje.",
      body: "Zakładka już działa, a sam moduł zostaje na razie czystym placeholderem na naszym wspólnym tle.",
    },
    en: {
      title: "More",
      subtitle: "Additional sections will appear here soon.",
      body: "The tab now switches correctly, while the module itself stays a clean placeholder on our shared background.",
    },
  },
} as const;

export function RootModulePlaceholderScreen({
  tabKey,
}: RootModulePlaceholderScreenProps) {
  const { locale } = useMobileI18n();
  const copy = placeholderCopy[tabKey];
  const activeCopy =
    locale === "ru" ? copy.ru : locale === "de" ? copy.de : locale === "pl" ? copy.pl : copy.en;
  const title = activeCopy.title;
  const subtitle = activeCopy.subtitle;

  return (
    <View style={styles.root}>
      <ImageBackground
        source={childrenScreenAssets.background}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay} />
      </ImageBackground>

      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardBody}>{activeCopy.body}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = {
  root: {
    flex: 1,
    backgroundColor: "#FBF3EC",
  },
  background: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: "100%" as const,
    height: "100%" as const,
  },
  overlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,248,241,0.52)",
  },
  screen: {
    flex: 1,
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  header: {
    gap: 8,
    paddingHorizontal: 2,
    marginBottom: 18,
  },
  title: {
    color: "#252B35",
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "800" as const,
    letterSpacing: -1.6,
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
    shadowColor: "#CFAE9F",
    shadowOpacity: 0.08,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    gap: 10,
  },
  cardTitle: {
    color: "#252B35",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  cardBody: {
    color: "#5F636B",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500" as const,
  },
};

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { medicineCabinetOverviewStyles as styles } from "./medicineCabinetOverviewScreenStyles";

type CabinetFilterKey = "all" | "attention" | "expired" | "refill";

type CabinetTag = {
  text: string;
  backgroundColor: string;
  textColor: string;
};

type MedicineCardItem = {
  id: string;
  title: string;
  subtitle: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBackgroundColor: string;
  iconContainerColor: string;
  tags: CabinetTag[];
  statusText: string;
  statusBackgroundColor: string;
  statusTextColor: string;
  cabinetStatus: "ok" | "attention" | "expired" | "refill";
  needsRefill: boolean;
};

type SummaryStat = {
  key: CabinetFilterKey;
  value: string;
  label: string;
  backgroundColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
};

const summaryStats: SummaryStat[] = [
  {
    key: "all",
    value: "12",
    label: "препаратов",
    backgroundColor: "#F1EBFF",
    iconBackgroundColor: "#E4D9FF",
    iconColor: "#8B6FE8",
    iconName: "bottle-tonic-plus-outline",
  },
  {
    key: "attention",
    value: "2",
    label: "проверить\nсейчас",
    backgroundColor: "#FFF3E6",
    iconBackgroundColor: "#FFE0BD",
    iconColor: "#F59E42",
    iconName: "clock-time-four-outline",
  },
  {
    key: "refill",
    value: "1",
    label: "нужно\nпополнить",
    backgroundColor: "#EEF9F3",
    iconBackgroundColor: "#D8F4E6",
    iconColor: "#46B982",
    iconName: "cart-variant",
  },
];

const medicineItems: MedicineCardItem[] = [
  {
    id: "nurofen_syrup",
    title: "Нурофен сироп",
    subtitle: "Открыт 3 дня назад",
    iconName: "bottle-tonic-plus-outline",
    iconColor: "#7652DF",
    iconBackgroundColor: "#FFFFFF",
    iconContainerColor: "#F1EBFF",
    tags: [
      { text: "Внутрь", backgroundColor: "#EEE7FF", textColor: "#8B6FE8" },
      { text: "Для Димы", backgroundColor: "#DBEEFF", textColor: "#4A90D9" },
    ],
    statusText: "До 08.2026",
    statusBackgroundColor: "#E7F7EF",
    statusTextColor: "#1F8A5B",
    cabinetStatus: "ok",
    needsRefill: false,
  },
  {
    id: "aquamaris",
    title: "Аквамарис",
    subtitle: "Осталось мало",
    iconName: "spray-bottle",
    iconColor: "#4A90D9",
    iconBackgroundColor: "#FFFFFF",
    iconContainerColor: "#E8F5FF",
    tags: [
      { text: "Нос", backgroundColor: "#EEE7FF", textColor: "#8B6FE8" },
      { text: "Для детей", backgroundColor: "#E7F7EF", textColor: "#4F9B75" },
    ],
    statusText: "Пополнить",
    statusBackgroundColor: "#FFF0D9",
    statusTextColor: "#D77A16",
    cabinetStatus: "refill",
    needsRefill: true,
  },
  {
    id: "miramistin",
    title: "Мирамистин",
    subtitle: "Подходит для семьи",
    iconName: "medical-bag",
    iconColor: "#46B982",
    iconBackgroundColor: "#FFFFFF",
    iconContainerColor: "#FFF1E8",
    tags: [
      { text: "Горло", backgroundColor: "#EEE7FF", textColor: "#8B6FE8" },
      { text: "Кожа", backgroundColor: "#FFE1E1", textColor: "#E85D5D" },
    ],
    statusText: "Истекает\nчерез 9 дней",
    statusBackgroundColor: "#FFE1E1",
    statusTextColor: "#E85D5D",
    cabinetStatus: "attention",
    needsRefill: false,
  },
  {
    id: "paracetamol",
    title: "Парацетамол",
    subtitle: "Срок вышел в прошлом месяце",
    iconName: "pill",
    iconColor: "#46B982",
    iconBackgroundColor: "#FFFFFF",
    iconContainerColor: "#EAF7F0",
    tags: [
      { text: "Таблетки", backgroundColor: "#EEE7FF", textColor: "#8B6FE8" },
      { text: "Домашний запас", backgroundColor: "#DBEEFF", textColor: "#4A90D9" },
    ],
    statusText: "Просрочен",
    statusBackgroundColor: "#FFE1E1",
    statusTextColor: "#E85D5D",
    cabinetStatus: "expired",
    needsRefill: false,
  },
];

const filterChips: Array<{
  key: CabinetFilterKey;
  label: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
  { key: "all", label: "Все" },
  { key: "attention", label: "Проверить", iconName: "timer-sand" },
  { key: "expired", label: "Просрочено", iconName: "alert-circle-outline" },
];

export function MedicineCabinetOverviewScreen() {
  const { locale } = useMobileI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CabinetFilterKey>("all");
  const isRu = locale === "ru";

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return medicineItems.filter((item) => {
      const filterMatch =
        activeFilter === "all"
          ? true
          : activeFilter === "attention"
            ? item.cabinetStatus === "attention"
            : activeFilter === "expired"
              ? item.cabinetStatus === "expired"
              : item.cabinetStatus === "refill";

      if (!filterMatch) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        item.title,
        item.subtitle,
        ...item.tags.map((tag) => tag.text),
        item.statusText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeFilter, searchQuery]);

  const sectionSubtitle = filteredItems.length
    ? `${filteredItems.length} ${
        isRu ? (filteredItems.length === 1 ? "карточка" : "карточки") : "items"
      }`
    : isRu
      ? "Подберите другой фильтр или добавьте первый препарат"
      : "Try a different filter or add your first medicine";

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#FFF7F1", "#FFF3EA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.decorationTop} />
        <View style={styles.decorationMiddle} />

        <View style={styles.screen}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.titleGroup}>
                  <Text style={styles.title}>Аптечка</Text>
                  <Text style={styles.subtitle}>
                    Домашние лекарства, сроки и статус.
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Настройки уведомлений аптечки"
                  style={styles.notificationsPill}
                >
                  <Text style={styles.notificationsLabel}>Уведомления</Text>
                </Pressable>
              </View>

              <LinearGradient
                colors={["#F56565", "#EF4F4F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryCta}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Добавить препарат в аптечку"
                  style={({ pressed }) => [
                    {
                      minHeight: 58,
                      width: "100%",
                      borderRadius: 29,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    },
                    pressed ? styles.primaryCtaPressed : null,
                  ]}
                >
                  <View style={styles.primaryCtaIconCircle}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.primaryCtaLabel}>Добавить препарат</Text>
                </Pressable>
              </LinearGradient>

              <View style={styles.infoLine}>
                <Text style={styles.infoLineText}>
                  Получатели уведомлений:{" "}
                  <Text style={styles.infoLineTextStrong}>Артём</Text>
                </Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              {summaryStats.map((stat) => (
                <Pressable
                  key={stat.key}
                  accessibilityRole="button"
                  accessibilityLabel={stat.label.replace("\n", " ")}
                  onPress={() => setActiveFilter(stat.key)}
                  style={[
                    styles.statTile,
                    { backgroundColor: stat.backgroundColor },
                    activeFilter === stat.key ? styles.statTileActive : null,
                  ]}
                >
                  <View
                    style={[
                      styles.statIconCircle,
                      { backgroundColor: stat.iconBackgroundColor },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={stat.iconName}
                      size={22}
                      color={stat.iconColor}
                    />
                  </View>
                  <Text style={styles.statNumber}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={22} color="#A78E86" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Поиск по препаратам"
                placeholderTextColor="#A0A8B5"
                style={styles.searchInput}
                accessibilityLabel={isRu ? "Поиск по препаратам" : "Search medicines"}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRowContent}
            >
              {filterChips.map((chip) => {
                const isActive = chip.key === activeFilter;

                return (
                  <Pressable
                    key={chip.key}
                    accessibilityRole="button"
                    accessibilityLabel={chip.label}
                    onPress={() => setActiveFilter(chip.key)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive
                          ? "#FFF0E8"
                          : "rgba(255,255,255,0.62)",
                        borderColor: isActive ? "#F0B8AC" : "#F0D8CC",
                      },
                    ]}
                  >
                    {chip.iconName ? (
                      <MaterialCommunityIcons
                        name={chip.iconName}
                        size={15}
                        color={isActive ? "#F56565" : "#5F6B7A"}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isActive ? "#F56565" : "#5F6B7A" },
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Под рукой сейчас</Text>
              <Text style={styles.sectionSubtitle}>{sectionSubtitle}</Text>
            </View>

            {filteredItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons
                    name="medical-bag"
                    size={40}
                    color="#F56565"
                  />
                </View>
                <Text style={styles.emptyTitle}>В аптечке пока пусто</Text>
                <Text style={styles.emptyDescription}>
                  Добавьте первый препарат, чтобы отслеживать сроки, остатки и правила
                  хранения.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Добавить препарат в аптечку"
                  style={styles.emptyButton}
                >
                  <Text style={styles.emptyButtonText}>Добавить препарат</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.list}>
                {filteredItems.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Открыть карточку препарата ${item.title}`}
                    style={({ pressed }) => [
                      styles.medicineCard,
                      pressed ? styles.medicineCardPressed : null,
                    ]}
                  >
                    <View style={styles.medicineCardRow}>
                      <View
                        style={[
                          styles.medicineArtCircle,
                          { backgroundColor: item.iconContainerColor },
                        ]}
                      >
                        <View
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 23,
                            backgroundColor: item.iconBackgroundColor,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MaterialCommunityIcons
                            name={item.iconName}
                            size={28}
                            color={item.iconColor}
                          />
                        </View>
                      </View>

                      <View style={styles.medicineInfo}>
                        <Text style={styles.medicineTitle}>{item.title}</Text>
                        <Text style={styles.medicineSubtitle}>{item.subtitle}</Text>
                        <View style={styles.tagRow}>
                          {item.tags.map((tag) => (
                            <View
                              key={`${item.id}-${tag.text}`}
                              style={[styles.tag, { backgroundColor: tag.backgroundColor }]}
                            >
                              <Text style={[styles.tagText, { color: tag.textColor }]}>
                                {tag.text}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <View style={styles.medicineRight}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: item.statusBackgroundColor },
                          ]}
                        >
                          <Text
                            style={[styles.statusText, { color: item.statusTextColor }]}
                          >
                            {item.statusText}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="#B79A91"
                        />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
}

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { CabinetFilterKey, MedicineCardItem, SummaryStat } from "../model/medicineCabinetOverviewModel";
import { SwipeableMedicineCard } from "./SwipeableMedicineCard";
import { medicineCabinetOverviewStyles as styles } from "./medicineCabinetOverviewScreenStyles";

export function MedicineCabinetOverviewContent({
  isRu,
  searchQuery,
  onChangeSearchQuery,
  activeFilter,
  onSelectFilter,
  summaryStats,
  filteredItems,
  sectionSubtitle,
  recipientsSummary,
  onOpenRecipients,
  onOpenAddChoice,
  isLoadingMedicines,
  medicinesError,
  onRetryLoad,
  openSwipeCardId,
  onOpenSwipe,
  onCloseSwipe,
  expandedMedicineId,
  onToggleExpanded,
  onOpenRenew,
  onDeleteItem,
}: {
  isRu: boolean;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  activeFilter: CabinetFilterKey;
  onSelectFilter: (value: CabinetFilterKey) => void;
  summaryStats: SummaryStat[];
  filteredItems: MedicineCardItem[];
  sectionSubtitle: string;
  recipientsSummary: string;
  onOpenRecipients: () => void;
  onOpenAddChoice: () => void;
  isLoadingMedicines: boolean;
  medicinesError: string | null;
  onRetryLoad: () => void;
  openSwipeCardId: string | null;
  onOpenSwipe: (id: string) => void;
  onCloseSwipe: (id: string) => void;
  expandedMedicineId: string | null;
  onToggleExpanded: (id: string) => void;
  onOpenRenew: (item: MedicineCardItem) => void;
  onDeleteItem: (item: MedicineCardItem) => void;
}) {
  return (
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
              <Text style={styles.subtitle}>Что есть дома и что пора проверить.</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Настройки уведомлений аптечки"
              onPress={onOpenRecipients}
              style={styles.notificationsPill}
            >
              <Text style={styles.notificationsLabel}>Уведомления</Text>
            </Pressable>
          </View>

          <View style={styles.infoLine}>
            <Text style={styles.infoLineText}>
              Уведомления получают:{" "}
              <Text style={styles.infoLineTextStrong}>{recipientsSummary}</Text>
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Добавить препарат в аптечку"
            onPress={onOpenAddChoice}
            style={({ pressed }) => [
              styles.primaryCta,
              pressed ? styles.primaryCtaPressed : null,
            ]}
          >
            <View style={styles.primaryCtaIconCircle}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.primaryCtaLabel}>Добавить препарат</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          {summaryStats.map((stat) => (
            <Pressable
              key={stat.key}
              accessibilityRole="button"
              accessibilityLabel={stat.title}
              onPress={() => onSelectFilter(stat.key)}
              style={({ pressed }) => [
                styles.statTile,
                {
                  backgroundColor:
                    activeFilter === stat.key
                      ? stat.activeBackgroundColor
                      : stat.backgroundColor,
                  borderColor:
                    activeFilter === stat.key
                      ? stat.activeBorderColor
                      : "transparent",
                },
                activeFilter === stat.key ? styles.statTileActive : null,
                pressed ? styles.statTilePressed : null,
              ]}
            >
              <View style={styles.statHeaderRow}>
                <View style={styles.statCopy}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </View>
                <Image source={stat.iconSource} style={styles.statIconImage} />
              </View>
              <Text style={styles.statHint}>{stat.hint}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={22} color="#A78E86" />
          <TextInput
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
            placeholder="Поиск по препаратам"
            placeholderTextColor="#A0A8B5"
            style={styles.searchInput}
            accessibilityLabel={isRu ? "Поиск по препаратам" : "Search medicines"}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeFilter === "all"
              ? "Все препараты дома"
              : activeFilter === "attention"
                ? "Стоит проверить"
                : activeFilter === "expired"
                  ? "Просроченные препараты"
                  : "Можно использовать"}
          </Text>
          <Text style={styles.sectionSubtitle}>{sectionSubtitle}</Text>
        </View>

        {isLoadingMedicines ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Загружаем аптечку…</Text>
            <Text style={styles.emptyDescription}>
              {isRu
                ? "Подтягиваем препараты и сроки годности."
                : "Loading medicines and expiry dates."}
            </Text>
          </View>
        ) : medicinesError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Не загрузилось</Text>
            <Text style={styles.emptyDescription}>{medicinesError}</Text>
            <Pressable accessibilityRole="button" onPress={onRetryLoad} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Повторить</Text>
            </Pressable>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="medical-bag" size={40} color="#F56565" />
            </View>
            <Text style={styles.emptyTitle}>В аптечке пока пусто</Text>
            <Text style={styles.emptyDescription}>
              Добавьте первый препарат, чтобы отслеживать сроки, остатки и правила
              хранения.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Добавить препарат в аптечку"
              onPress={onOpenAddChoice}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Добавить препарат</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredItems.map((item) => (
              <SwipeableMedicineCard
                key={item.id}
                item={item}
                isOpen={openSwipeCardId === item.id}
                expanded={expandedMedicineId === item.id}
                onOpenSwipe={() => onOpenSwipe(item.id)}
                onCloseSwipe={() => onCloseSwipe(item.id)}
                onToggleExpanded={() => onToggleExpanded(item.id)}
                onOpenRenew={() => onOpenRenew(item)}
                onDelete={() => onDeleteItem(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

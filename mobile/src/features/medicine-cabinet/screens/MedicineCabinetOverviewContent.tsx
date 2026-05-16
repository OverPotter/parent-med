import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  getCabinetFilterSectionTitle,
  type CabinetFilterKey,
  type MedicineCardItem,
  type SummaryStat,
} from "../model/medicineCabinetOverviewModel";
import { SwipeableMedicineCard } from "./SwipeableMedicineCard";
import { medicineCabinetOverviewStyles as styles } from "./medicineCabinetOverviewScreenStyles";

export function MedicineCabinetOverviewContent({
  locale,
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
  locale: MobileLocale;
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
  const isRu = locale === "ru";
  const title = isRu
    ? "Аптечка"
    : locale === "de"
      ? "Hausapotheke"
      : locale === "pl"
        ? "Apteczka"
        : "Cabinet";
  const subtitle = isRu
    ? "Что есть дома и что пора проверить."
    : locale === "de"
      ? "Was zu Hause ist und was geprüft werden sollte."
      : locale === "pl"
        ? "Co jest w domu i co warto sprawdzić."
        : "What you have at home and what should be checked.";
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
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isRu
                  ? "Настройки уведомлений аптечки"
                  : locale === "de"
                    ? "Benachrichtigungseinstellungen der Hausapotheke"
                    : locale === "pl"
                      ? "Ustawienia powiadomień apteczki"
                      : "Cabinet notification settings"
              }
              onPress={onOpenRecipients}
              style={styles.notificationsPill}
            >
              <Text style={styles.notificationsLabel}>
                {isRu
                  ? "Уведомления"
                  : locale === "de"
                    ? "Hinweise"
                    : locale === "pl"
                      ? "Powiadomienia"
                      : "Alerts"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.infoLine}>
            <Text style={styles.infoLineText}>
              {isRu
                ? "Уведомления получают: "
                : locale === "de"
                  ? "Benachrichtigungen erhalten: "
                  : locale === "pl"
                    ? "Powiadomienia otrzymują: "
                    : "Notifications go to: "}
              <Text style={styles.infoLineTextStrong}>{recipientsSummary}</Text>
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isRu
                ? "Добавить препарат в аптечку"
                : locale === "de"
                  ? "Medikament zur Hausapotheke hinzufügen"
                  : locale === "pl"
                    ? "Dodaj lek do apteczki"
                    : "Add medicine to cabinet"
            }
            onPress={onOpenAddChoice}
            style={({ pressed }) => [
              styles.primaryCta,
              pressed ? styles.primaryCtaPressed : null,
            ]}
            >
              <View style={styles.primaryCtaIconCircle}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </View>
            <Text style={styles.primaryCtaLabel}>
              {isRu
                ? "Добавить препарат"
                : locale === "de"
                  ? "Medikament hinzufügen"
                  : locale === "pl"
                    ? "Dodaj lek"
                    : "Add medicine"}
            </Text>
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
            placeholder={
              isRu
                ? "Поиск по препаратам"
                : locale === "de"
                  ? "Medikamente durchsuchen"
                  : locale === "pl"
                    ? "Szukaj leków"
                    : "Search medicines"
            }
            placeholderTextColor="#A0A8B5"
            style={styles.searchInput}
            accessibilityLabel={
              isRu
                ? "Поиск по препаратам"
                : locale === "de"
                  ? "Medikamente durchsuchen"
                  : locale === "pl"
                    ? "Szukaj leków"
                    : "Search medicines"
            }
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {getCabinetFilterSectionTitle(locale, activeFilter)}
          </Text>
          <Text style={styles.sectionSubtitle}>{sectionSubtitle}</Text>
        </View>

        {isLoadingMedicines ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {isRu
                ? "Загружаем аптечку…"
                : locale === "de"
                  ? "Hausapotheke wird geladen…"
                  : locale === "pl"
                    ? "Ładowanie apteczki…"
                    : "Loading cabinet…"}
            </Text>
            <Text style={styles.emptyDescription}>
              {isRu
                ? "Подтягиваем препараты и сроки годности."
                : locale === "de"
                  ? "Medikamente und Ablaufdaten werden geladen."
                  : locale === "pl"
                    ? "Pobieramy leki i daty ważności."
                : "Loading medicines and expiry dates."}
            </Text>
          </View>
        ) : medicinesError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {isRu
                ? "Не загрузилось"
                : locale === "de"
                  ? "Nicht geladen"
                  : locale === "pl"
                    ? "Nie udało się załadować"
                    : "Couldn't load"}
            </Text>
            <Text style={styles.emptyDescription}>{medicinesError}</Text>
            <Pressable accessibilityRole="button" onPress={onRetryLoad} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>
                {isRu
                  ? "Повторить"
                  : locale === "de"
                    ? "Erneut versuchen"
                    : locale === "pl"
                      ? "Spróbuj ponownie"
                      : "Retry"}
              </Text>
            </Pressable>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="medical-bag" size={40} color="#F56565" />
            </View>
            <Text style={styles.emptyTitle}>
              {isRu
                ? "В аптечке пока пусто"
                : locale === "de"
                  ? "Die Hausapotheke ist noch leer"
                  : locale === "pl"
                    ? "Apteczka jest jeszcze pusta"
                    : "Your cabinet is empty for now"}
            </Text>
            <Text style={styles.emptyDescription}>
              {isRu
                ? "Добавьте первый препарат, чтобы отслеживать сроки, остатки и правила хранения."
                : locale === "de"
                  ? "Fügen Sie das erste Medikament hinzu, um Ablaufdaten, Restbestände und Lagerhinweise zu verfolgen."
                  : locale === "pl"
                    ? "Dodaj pierwszy lek, aby śledzić terminy, zapasy i zasady przechowywania."
                    : "Add your first medicine to track expiries, remaining stock, and storage guidance."}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isRu
                  ? "Добавить препарат в аптечку"
                  : locale === "de"
                    ? "Medikament zur Hausapotheke hinzufügen"
                    : locale === "pl"
                      ? "Dodaj lek do apteczki"
                      : "Add medicine to cabinet"
              }
              onPress={onOpenAddChoice}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>
                {isRu
                  ? "Добавить препарат"
                  : locale === "de"
                    ? "Medikament hinzufügen"
                    : locale === "pl"
                      ? "Dodaj lek"
                      : "Add medicine"}
              </Text>
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

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { MobileMedicineCatalogItem } from "../api/mobileMedicineCatalogApi";
import { resolveMedicineFormIcon } from "../model/medicineCabinetOverviewModel";
import {
  getReferenceCategories,
  type ReferenceCategoryKey,
  type ReferenceCreateStep,
} from "../model/referenceMedicineCreateFlow";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { ReferenceCatalogEmptyState } from "./ReferenceCatalogEmptyState";
import { ReferenceCatalogResultCard } from "./ReferenceCatalogResultCard";
import { styles } from "./medicineCabinetReferenceCreateScreenStyles";

export function MedicineCabinetReferenceCreateFrame({
  step,
  locale,
  searchQuery,
  onChangeSearchQuery,
  activeCategory,
  onSelectCategory,
  visibleItems,
  selectedItem,
  onSelectItem,
  showEmptyState,
  emptyStateTitle,
  expiryDateLabel,
  onPressExpiryDate,
  openedDateLabel,
  onPressOpenedDate,
  openedShelfLabel,
  onPressShelfSelector,
  comment,
  onChangeComment,
  isSaving,
  canSubmitStorage,
  onBackPress,
  onPrimaryPress,
}: {
  step: ReferenceCreateStep;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  activeCategory: ReferenceCategoryKey;
  onSelectCategory: (value: ReferenceCategoryKey) => void;
  locale: MobileLocale;
  visibleItems: MobileMedicineCatalogItem[];
  selectedItem: MobileMedicineCatalogItem | null;
  onSelectItem: (item: MobileMedicineCatalogItem | null) => void;
  showEmptyState: boolean;
  emptyStateTitle: string;
  expiryDateLabel: string;
  onPressExpiryDate: () => void;
  openedDateLabel: string;
  onPressOpenedDate: () => void;
  openedShelfLabel: string;
  onPressShelfSelector: () => void;
  comment: string;
  onChangeComment: (value: string) => void;
  isSaving: boolean;
  canSubmitStorage: boolean;
  onBackPress: () => void;
  onPrimaryPress: () => void;
}) {
  const categories = getReferenceCategories(locale);
  const isRu = locale === "ru";
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#FFF7F1", "#FFF3EA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            automaticallyAdjustKeyboardInsets
          >
            <View style={styles.topBar}>
              <Pressable onPress={onBackPress} style={styles.backLink}>
                <Text style={styles.backLinkText}>
                  {isRu
                    ? "← Назад"
                    : locale === "de"
                      ? "← Zurück"
                      : locale === "pl"
                        ? "← Wstecz"
                        : "← Back"}
                </Text>
              </Pressable>
            </View>

            {step === "search" ? (
              <>
                <View style={styles.hero}>
                  <View style={styles.heroCopy}>
                    <Text style={styles.heroTitle}>
                      {isRu
                        ? "Из справочника"
                        : locale === "de"
                          ? "Aus dem Katalog"
                          : locale === "pl"
                            ? "Z katalogu"
                            : "From catalog"}
                    </Text>
                    <Text style={styles.heroSubtitle}>
                      {isRu
                        ? "Быстрее и безопаснее: форма, подсказка по применению и срок после вскрытия, если он задан, подтянутся из базы."
                        : locale === "de"
                          ? "Schneller und sicherer: Form, Anwendungshinweise und Haltbarkeit nach dem Öffnen werden aus der Datenbank übernommen."
                          : locale === "pl"
                            ? "Szybciej i bezpieczniej: postać, wskazówka stosowania i termin po otwarciu, jeśli jest znany, uzupełnią się z bazy."
                            : "Faster and safer: form, usage hint, and after-opening shelf life, when available, will come from the catalog."}
                    </Text>
                  </View>
                </View>

                <View style={styles.searchCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderIconWrap}>
                      <Ionicons name="search" size={20} color="#8B6FE8" />
                    </View>
                    <Text style={styles.cardHeaderTitle}>
                      {isRu
                        ? "Поиск по справочнику"
                        : locale === "de"
                          ? "Im Katalog suchen"
                          : locale === "pl"
                            ? "Szukaj w katalogu"
                            : "Search catalog"}
                    </Text>
                  </View>

                  <View style={styles.searchInputWrap}>
                    <Ionicons name="search" size={20} color="#8A94A6" />
                    <TextInput
                      value={searchQuery}
                      onChangeText={onChangeSearchQuery}
                      placeholder={
                        isRu
                          ? "Название препарата"
                          : locale === "de"
                            ? "Medikamentenname"
                            : locale === "pl"
                              ? "Nazwa leku"
                              : "Medicine name"
                      }
                      placeholderTextColor="#A0A8B5"
                      style={styles.searchInput}
                    />
                  </View>

                  <View style={styles.categoryRow}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryScrollContent}
                    >
                      {categories.map((category) => {
                        const isActive = activeCategory === category.key;
                        return (
                          <Pressable
                            key={category.key}
                            onPress={() => onSelectCategory(category.key)}
                            style={[
                              styles.categoryChip,
                              {
                                backgroundColor: isActive
                                  ? category.activeBackgroundColor
                                  : category.backgroundColor,
                                borderColor: category.borderColor,
                              },
                            ]}
                          >
                            {category.imageSource ? (
                              <Image
                                source={category.imageSource}
                                style={styles.categoryChipIcon}
                                resizeMode="contain"
                              />
                            ) : null}
                            <Text
                              style={[
                                styles.categoryChipText,
                                {
                                  color: isActive
                                    ? category.activeTextColor
                                    : category.textColor,
                                },
                              ]}
                            >
                              {category.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <Text style={styles.helperText}>
                    {isRu
                      ? "Можно искать по названию или выбрать категорию и пролистать список."
                      : locale === "de"
                        ? "Sie können nach Namen suchen oder eine Kategorie wählen und die Liste durchsuchen."
                        : locale === "pl"
                          ? "Możesz szukać po nazwie albo wybrać kategorię i przejrzeć listę."
                          : "Search by name or choose a category and browse the list."}
                  </Text>
                </View>

                {showEmptyState ? (
                  <ReferenceCatalogEmptyState
                    iconName={searchQuery.trim().length > 0 ? "document-text-outline" : "bulb-outline"}
                    iconColor={searchQuery.trim().length > 0 ? "#8B6FE8" : "#F59E42"}
                    title={emptyStateTitle}
                  />
                ) : null}

                {visibleItems.length > 0 ? (
                  <View style={styles.resultList}>
                    {visibleItems.map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      return (
                        <ReferenceCatalogResultCard
                          key={item.id}
                          item={item}
                          isSelected={isSelected}
                          onToggle={() => onSelectItem(isSelected ? null : item)}
                          onContinue={onPrimaryPress}
                        />
                      );
                    })}
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.hero}>
                  <View style={styles.heroCopy}>
                    <Text style={styles.heroTitle}>
                      {isRu
                        ? "Почти готово"
                        : locale === "de"
                          ? "Fast fertig"
                          : locale === "pl"
                            ? "Prawie gotowe"
                            : "Almost done"}
                    </Text>
                    <Text style={styles.heroSubtitle}>
                      {isRu
                        ? "Проверим сроки и упаковку перед добавлением в домашнюю аптечку."
                        : locale === "de"
                          ? "Prüfen wir Ablaufdaten und Packung, bevor wir sie zur Hausapotheke hinzufügen."
                          : locale === "pl"
                            ? "Sprawdźmy terminy i opakowanie przed dodaniem do domowej apteczki."
                            : "Let's check the dates and pack before adding it to the cabinet."}
                    </Text>
                  </View>
                  <View style={[styles.heroArt, styles.heroArtSuccess]}>
                    <Ionicons name="medical-outline" size={38} color="#46B982" />
                  </View>
                </View>

                {selectedItem ? (
                  <View style={styles.selectedCard}>
                    <View style={styles.selectedHeader}>
                      <View style={[styles.resultArt, { backgroundColor: "#F1EBFF" }]}>
                        <Image
                          source={resolveMedicineFormIcon(selectedItem.form)}
                          style={styles.resultArtImage}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.selectedCopy}>
                        <Text style={styles.selectedTitle}>{selectedItem.name}</Text>
                        <Text style={styles.selectedSubtitle}>
                          {[selectedItem.form, selectedItem.concentration]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      </View>
                    </View>
                    {selectedItem.description ? (
                      <Text style={styles.selectedHint}>{selectedItem.description}</Text>
                    ) : null}
                    {selectedItem.dosage ? (
                      <Text style={styles.selectedHint}>
                        {isRu
                          ? `Как применять: ${selectedItem.dosage}`
                          : locale === "de"
                            ? `Anwendung: ${selectedItem.dosage}`
                            : locale === "pl"
                              ? `Jak stosować: ${selectedItem.dosage}`
                              : `How to use: ${selectedItem.dosage}`}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.selectedCard}>
                  <View style={styles.inlineFieldRow}>
                    <View style={styles.inlineFieldLabelWrap}>
                      <Text style={styles.fieldLabel}>
                        {isRu ? "Срок годности" : locale === "de" ? "Ablaufdatum" : locale === "pl" ? "Termin ważności" : "Expiry date"}
                      </Text>
                    </View>
                    <Pressable onPress={onPressExpiryDate} style={styles.inlineDateField}>
                      <Text
                        style={[
                          styles.dateText,
                          !expiryDateLabel ? styles.datePlaceholderText : null,
                        ]}
                      >
                        {expiryDateLabel || (isRu ? "Выберите дату" : locale === "de" ? "Datum wählen" : locale === "pl" ? "Wybierz datę" : "Choose a date")}
                      </Text>
                      <Ionicons name="calendar-outline" size={18} color="#8A94A6" />
                    </Pressable>
                  </View>

                  <View style={styles.inlineFieldRow}>
                    <View style={styles.inlineFieldLabelWrap}>
                      <Text style={styles.fieldLabel}>
                        {isRu ? "Дата вскрытия" : locale === "de" ? "Öffnungsdatum" : locale === "pl" ? "Data otwarcia" : "Opened on"}
                      </Text>
                    </View>
                    <Pressable onPress={onPressOpenedDate} style={styles.inlineDateField}>
                      <Text
                        style={[
                          styles.dateText,
                          !openedDateLabel ? styles.datePlaceholderText : null,
                        ]}
                      >
                        {openedDateLabel || (isRu ? "Выберите дату" : locale === "de" ? "Datum wählen" : locale === "pl" ? "Wybierz datę" : "Choose a date")}
                      </Text>
                      <Ionicons name="calendar-outline" size={18} color="#8A94A6" />
                    </Pressable>
                  </View>

                  <View style={styles.inlineFieldRow}>
                    <View style={styles.inlineFieldLabelWrap}>
                      <Text style={styles.fieldLabel}>
                        {isRu ? "Сколько хранится\nпосле вскрытия" : locale === "de" ? "Wie lange nach\ndem Öffnen haltbar" : locale === "pl" ? "Jak długo po\notwarciu" : "How long after\nopening"}
                      </Text>
                    </View>
                    <Pressable onPress={onPressShelfSelector} style={styles.inlineDateField}>
                      <Text
                        style={[
                          styles.dateText,
                          !openedShelfLabel ? styles.datePlaceholderText : null,
                        ]}
                      >
                        {openedShelfLabel || (isRu ? "Выберите срок" : locale === "de" ? "Frist wählen" : locale === "pl" ? "Wybierz okres" : "Choose a period")}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color="#8A94A6" />
                    </Pressable>
                  </View>

                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      {isRu ? "Комментарий" : locale === "de" ? "Kommentar" : locale === "pl" ? "Komentarz" : "Comment"}
                    </Text>
                    <View style={styles.textareaWrap}>
                      <TextInput
                        value={comment}
                        onChangeText={onChangeComment}
                        placeholder={
                          isRu ? "Например: хранить в холодильнике" : locale === "de" ? "Zum Beispiel: im Kühlschrank aufbewahren" : locale === "pl" ? "Na przykład: przechowywać w lodówce" : "For example: keep refrigerated"
                        }
                        placeholderTextColor="#A0A8B5"
                        multiline
                        textAlignVertical="top"
                        style={styles.textarea}
                      />
                    </View>
                  </View>
                </View>
              </>
            )}

            {step === "storage" ? (
              <View style={styles.footer}>
                <LinearGradient
                  colors={["#F56565", "#EF4F4F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonWrap}
                >
                  <Pressable
                    onPress={onPrimaryPress}
                    disabled={isSaving || !canSubmitStorage}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      isSaving || !canSubmitStorage ? styles.primaryButtonDisabled : null,
                      pressed ? styles.primaryButtonPressed : null,
                    ]}
                  >
                    <View style={styles.primaryIconCircle}>
                      <Ionicons name="add" size={18} color="#F56565" />
                    </View>
                    <Text style={styles.primaryButtonText}>
                      {isRu
                        ? "Добавить в аптечку"
                        : locale === "de"
                          ? "Zur Hausapotheke hinzufügen"
                          : locale === "pl"
                            ? "Dodaj do apteczki"
                            : "Add to cabinet"}
                    </Text>
                  </Pressable>
                </LinearGradient>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

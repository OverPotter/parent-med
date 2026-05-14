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
  referenceCategories,
  type ReferenceCategoryKey,
  type ReferenceCreateStep,
} from "../model/referenceMedicineCreateFlow";
import { ReferenceCatalogEmptyState } from "./ReferenceCatalogEmptyState";
import { ReferenceCatalogResultCard } from "./ReferenceCatalogResultCard";
import { styles } from "./medicineCabinetReferenceCreateScreenStyles";

export function MedicineCabinetReferenceCreateFrame({
  step,
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
                <Text style={styles.backLinkText}>← Назад</Text>
              </Pressable>
            </View>

            {step === "search" ? (
              <>
                <View style={styles.hero}>
                  <View style={styles.heroCopy}>
                    <Text style={styles.heroTitle}>Из справочника</Text>
                    <Text style={styles.heroSubtitle}>
                      Быстрее и безопаснее: форма, подсказка по применению и срок после
                      вскрытия, если он задан, подтянутся из базы.
                    </Text>
                  </View>
                </View>

                <View style={styles.searchCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderIconWrap}>
                      <Ionicons name="search" size={20} color="#8B6FE8" />
                    </View>
                    <Text style={styles.cardHeaderTitle}>Поиск по справочнику</Text>
                  </View>

                  <View style={styles.searchInputWrap}>
                    <Ionicons name="search" size={20} color="#8A94A6" />
                    <TextInput
                      value={searchQuery}
                      onChangeText={onChangeSearchQuery}
                      placeholder="Название препарата"
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
                      {referenceCategories.map((category) => {
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
                    Можно искать по названию или выбрать категорию и пролистать список.
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
                    <Text style={styles.heroTitle}>Почти готово</Text>
                    <Text style={styles.heroSubtitle}>
                      Проверим сроки и упаковку перед добавлением в домашнюю аптечку.
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
                        Как применять: {selectedItem.dosage}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.selectedCard}>
                  <View style={styles.inlineFieldRow}>
                    <View style={styles.inlineFieldLabelWrap}>
                      <Text style={styles.fieldLabel}>Срок годности</Text>
                    </View>
                    <Pressable onPress={onPressExpiryDate} style={styles.inlineDateField}>
                      <Text
                        style={[
                          styles.dateText,
                          !expiryDateLabel ? styles.datePlaceholderText : null,
                        ]}
                      >
                        {expiryDateLabel || "Выберите дату"}
                      </Text>
                      <Ionicons name="calendar-outline" size={18} color="#8A94A6" />
                    </Pressable>
                  </View>

                  <View style={styles.inlineFieldRow}>
                    <View style={styles.inlineFieldLabelWrap}>
                      <Text style={styles.fieldLabel}>Дата вскрытия</Text>
                    </View>
                    <Pressable onPress={onPressOpenedDate} style={styles.inlineDateField}>
                      <Text
                        style={[
                          styles.dateText,
                          !openedDateLabel ? styles.datePlaceholderText : null,
                        ]}
                      >
                        {openedDateLabel || "Выберите дату"}
                      </Text>
                      <Ionicons name="calendar-outline" size={18} color="#8A94A6" />
                    </Pressable>
                  </View>

                  <View style={styles.inlineFieldRow}>
                    <View style={styles.inlineFieldLabelWrap}>
                      <Text style={styles.fieldLabel}>Сколько хранится{`\n`}после вскрытия</Text>
                    </View>
                    <Pressable onPress={onPressShelfSelector} style={styles.inlineDateField}>
                      <Text
                        style={[
                          styles.dateText,
                          !openedShelfLabel ? styles.datePlaceholderText : null,
                        ]}
                      >
                        {openedShelfLabel || "Выберите срок"}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color="#8A94A6" />
                    </Pressable>
                  </View>

                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>Комментарий</Text>
                    <View style={styles.textareaWrap}>
                      <TextInput
                        value={comment}
                        onChangeText={onChangeComment}
                        placeholder="Например: хранить в холодильнике"
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
                    <Text style={styles.primaryButtonText}>Добавить в аптечку</Text>
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

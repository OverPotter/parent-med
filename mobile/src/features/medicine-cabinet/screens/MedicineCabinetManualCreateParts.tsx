import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import {
  getManualCategoryPreviewImageSource,
  manualCategoryOptions,
  type ManualCategory,
} from "../model/manualMedicineFlow";
import { styles } from "./medicineCabinetManualCreateScreenStyles";

export type FlowStep = 1 | 2 | 3;

export function StepIndicator({
  step,
}: {
  step: FlowStep;
}) {
  const items: Array<{
    number: FlowStep;
    label: string;
    state: "active" | "completed" | "inactive";
  }> = [
    {
      number: 1,
      label: "Основное",
      state: step === 1 ? "active" : step > 1 ? "completed" : "inactive",
    },
    {
      number: 2,
      label: "Примен.",
      state: step === 2 ? "active" : step > 2 ? "completed" : "inactive",
    },
    {
      number: 3,
      label: "Хранение",
      state: step === 3 ? "active" : "inactive",
    },
  ];

  return (
    <View style={styles.progressRow}>
      {items.map((item, index) => (
        <View key={item.number} style={styles.progressStepWrap}>
          <View
            style={[
              styles.progressStep,
              item.state === "active" ? styles.progressStepActive : null,
            ]}
          >
            <View
              style={[
                styles.progressNumberBadge,
                item.state === "active"
                  ? styles.progressNumberBadgeActive
                  : item.state === "completed"
                    ? styles.progressNumberBadgeCompleted
                    : styles.progressNumberBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.progressNumberText,
                  item.state === "active"
                    ? styles.progressNumberTextActive
                    : item.state === "completed"
                      ? styles.progressNumberTextCompleted
                      : styles.progressNumberTextInactive,
                ]}
              >
                {item.number}
              </Text>
            </View>
            <Text
              style={[
                styles.progressStepLabel,
                item.state === "active"
                  ? styles.progressStepLabelActive
                  : styles.progressStepLabelInactive,
              ]}
            >
              {item.label}
            </Text>
          </View>
          <View
            style={[
              styles.progressConnector,
              index === items.length - 1 ? styles.progressConnectorPlaceholder : null,
            ]}
          />
        </View>
      ))}
    </View>
  );
}

function SectionHeader({
  title,
  iconName,
  iconColor = "#F56565",
  iconBackgroundColor = "#FFEAE3",
}: {
  title: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackgroundColor?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      {iconName ? (
        <View
          style={[
            styles.sectionHeaderIconWrap,
            { backgroundColor: iconBackgroundColor },
          ]}
        >
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>
      ) : (
        <View style={styles.sectionAccent} />
      )}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function Step1BasicSection({
  isRu,
  medicineName,
  onChangeMedicineName,
  category,
  onSelectCategory,
  concentration,
  onChangeConcentration,
}: {
  isRu: boolean;
  medicineName: string;
  onChangeMedicineName: (value: string) => void;
  category: ManualCategory | null;
  onSelectCategory: (value: ManualCategory) => void;
  concentration: string;
  onChangeConcentration: (value: string) => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <SectionHeader title="Основное" iconName="medkit-outline" />

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelStandalone}>
          <Text style={styles.fieldLabel}>Название препарата</Text>
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            value={medicineName}
            onChangeText={onChangeMedicineName}
            placeholder="Например: Нурофен сироп"
            placeholderTextColor="#A0A8B5"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelStandalone}>
          <Text style={styles.fieldLabel}>Категория препарата</Text>
        </View>
        <View style={styles.categoryGrid}>
          {manualCategoryOptions.map((option) => {
            const isActive = category === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onSelectCategory(option.value)}
                style={({ pressed }) => [
                  styles.categoryCard,
                  { backgroundColor: option.cardBackgroundColor },
                  isActive
                    ? [
                        styles.categoryCardActive,
                        {
                          backgroundColor: option.cardActiveBackgroundColor,
                          borderColor: option.activeBorderColor,
                        },
                      ]
                    : null,
                  pressed ? styles.categoryCardPressed : null,
                ]}
              >
                <View
                  style={[
                    styles.categoryCardIconWrap,
                    { backgroundColor: option.iconBackgroundColor },
                  ]}
                >
                  {option.imageSource ? (
                    <Image
                      source={option.imageSource}
                      style={[
                        styles.categoryCardIconImage,
                        option.value === "skin"
                          ? styles.categoryCardIconImageSkin
                          : null,
                      ]}
                      resizeMode="contain"
                    />
                  ) : option.icon ? (
                    <Ionicons
                      name={option.icon}
                      size={16}
                      color={option.iconColor}
                    />
                  ) : null}
                </View>
                <Text style={styles.categoryCardLabel}>
                  {isRu ? option.labelRu : option.labelEn}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelStandalone}>
          <Text style={styles.fieldLabel}>Концентрация</Text>
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            value={concentration}
            onChangeText={onChangeConcentration}
            placeholder="Что написано на упаковке, если важно"
            placeholderTextColor="#A0A8B5"
            style={styles.input}
          />
        </View>
      </View>
    </View>
  );
}

export function Step2UsageSection({
  purpose,
  onChangePurpose,
  howToUse,
  onChangeHowToUse,
  category,
  previewTitle,
  previewSubtitleBase,
}: {
  purpose: string;
  onChangePurpose: (value: string) => void;
  howToUse: string;
  onChangeHowToUse: (value: string) => void;
  category: ManualCategory | null;
  previewTitle: string;
  previewSubtitleBase: string;
}) {
  return (
    <>
      <View style={styles.sectionCardUsage}>
        <SectionHeader
          title="Применение"
          iconName="reader-outline"
          iconColor="#8B6FE8"
          iconBackgroundColor="#F1EBFF"
        />

        <View style={styles.fieldBlock}>
          <View style={styles.fieldLabelStandalone}>
            <Text style={styles.fieldLabel}>Для чего препарат</Text>
          </View>
          <View style={styles.textareaWrap}>
            <TextInput
              value={purpose}
              onChangeText={onChangePurpose}
              placeholder="Например: при температуре, боли или воспалении"
              placeholderTextColor="#A0A8B5"
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <View style={styles.fieldLabelStandalone}>
            <Text style={styles.fieldLabel}>Как применять</Text>
          </View>
          <View style={styles.textareaWrap}>
            <TextInput
              value={howToUse}
              onChangeText={onChangeHowToUse}
              placeholder="Например: по 5 мл 3 раза в день после еды"
              placeholderTextColor="#A0A8B5"
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
          </View>
        </View>
      </View>

      <PreviewCardCompact
        category={category}
        title={previewTitle}
        subtitle={previewSubtitleBase}
      />
    </>
  );
}

export function Step3StorageSection({
  expiryDateLabel,
  onPressExpiryDate,
  openedDateLabel,
  onPressOpenedDate,
  afterOpeningLabel,
  onPressAfterOpeningSelector,
  storageComment,
  onChangeStorageComment,
  category,
  previewTitle,
  previewSubtitle,
}: {
  expiryDateLabel: string;
  onPressExpiryDate: () => void;
  openedDateLabel: string;
  onPressOpenedDate: () => void;
  afterOpeningLabel: string;
  onPressAfterOpeningSelector: () => void;
  storageComment: string;
  onChangeStorageComment: (value: string) => void;
  category: ManualCategory | null;
  previewTitle: string;
  previewSubtitle: string;
}) {
  return (
    <>
      <View style={styles.sectionCardStorage}>
        <SectionHeader
          title="Упаковка и хранение"
          iconName="archive-outline"
          iconColor="#46B982"
          iconBackgroundColor="#E7F7EF"
        />

        <View style={styles.inlineFieldRow}>
          <View style={styles.inlineFieldLabelWrap}>
            <View style={styles.fieldLabelRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color="#46B982"
                style={styles.fieldLabelIcon}
              />
              <Text style={styles.fieldLabel}>Срок годности</Text>
            </View>
          </View>
          <Pressable onPress={onPressExpiryDate} style={styles.inlineDateField}>
            <Text
              style={[
                styles.dateInput,
                !expiryDateLabel ? styles.datePlaceholderText : null,
              ]}
              numberOfLines={1}
            >
              {expiryDateLabel || "Выберите дату"}
            </Text>
            <Ionicons name="calendar-outline" size={18} color="#8A94A6" />
          </Pressable>
        </View>

        <View style={styles.inlineFieldRow}>
          <View style={styles.inlineFieldLabelWrap}>
            <View style={styles.fieldLabelRow}>
              <Ionicons
                name="calendar-clear-outline"
                size={14}
                color="#46B982"
                style={styles.fieldLabelIcon}
              />
              <Text style={styles.fieldLabel}>Дата вскрытия</Text>
            </View>
          </View>
          <Pressable onPress={onPressOpenedDate} style={styles.inlineDateField}>
            <Text
              style={[
                styles.dateInput,
                !openedDateLabel ? styles.datePlaceholderText : null,
              ]}
              numberOfLines={1}
            >
              {openedDateLabel || "Выберите дату"}
            </Text>
            <Ionicons name="calendar-outline" size={18} color="#8A94A6" />
          </Pressable>
        </View>

        <View style={styles.fieldBlock}>
          <View style={styles.inlineFieldRow}>
            <View style={styles.inlineFieldLabelWrap}>
              <View style={styles.fieldLabelRow}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color="#46B982"
                  style={styles.fieldLabelIcon}
                />
                <Text style={styles.fieldLabel}>Сколько хранится{"\n"}после вскрытия</Text>
              </View>
            </View>
            <Pressable onPress={onPressAfterOpeningSelector} style={styles.inlineDateField}>
              <Text
                style={[
                  styles.dateInput,
                  !afterOpeningLabel ? styles.datePlaceholderText : null,
                ]}
                numberOfLines={1}
              >
                {afterOpeningLabel || "Выберите срок"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#8A94A6" />
            </Pressable>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <View style={styles.fieldLabelRow}>
            <Ionicons
              name="create-outline"
              size={14}
              color="#46B982"
              style={styles.fieldLabelIcon}
            />
            <Text style={styles.fieldLabel}>Комментарий</Text>
          </View>
          <View style={styles.textareaWrap}>
            <TextInput
              value={storageComment}
              onChangeText={onChangeStorageComment}
              placeholder="Например: хранить в холодильнике"
              placeholderTextColor="#A0A8B5"
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
          </View>
        </View>
      </View>

      <PreviewCardFinal
        category={category}
        title={previewTitle}
        subtitle={previewSubtitle}
      />
    </>
  );
}

function PreviewCardCompact({
  category,
  title,
  subtitle,
}: {
  category: ManualCategory | null;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.previewCardCompact}>
      <View style={styles.previewMediaCircleCompact}>
        <Image
          source={getManualCategoryPreviewImageSource(category)}
          style={styles.previewImageCompact}
          resizeMode="contain"
        />
      </View>
      <View style={styles.previewCopy}>
        <Text style={styles.previewTitle}>{title}</Text>
        <Text style={styles.previewSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function PreviewCardFinal({
  category,
  title,
  subtitle,
}: {
  category: ManualCategory | null;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.previewCardFinal}>
      <View style={styles.previewMediaCircleFinal}>
        <Image
          source={getManualCategoryPreviewImageSource(category)}
          style={styles.previewImageFinal}
          resizeMode="contain"
        />
      </View>
      <View style={styles.previewCopy}>
        <Text style={styles.previewTitle}>{title}</Text>
        <Text style={styles.previewSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

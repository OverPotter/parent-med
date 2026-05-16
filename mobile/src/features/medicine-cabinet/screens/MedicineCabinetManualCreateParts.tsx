import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
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
  locale,
  medicineName,
  onChangeMedicineName,
  category,
  onSelectCategory,
  concentration,
  onChangeConcentration,
}: {
  locale: MobileLocale;
  medicineName: string;
  onChangeMedicineName: (value: string) => void;
  category: ManualCategory | null;
  onSelectCategory: (value: ManualCategory) => void;
  concentration: string;
  onChangeConcentration: (value: string) => void;
}) {
  const isRu = locale === "ru";
  return (
    <View style={styles.sectionCard}>
      <SectionHeader
        title={
          isRu
            ? "Основное"
            : locale === "de"
              ? "Grundlagen"
              : locale === "pl"
                ? "Podstawy"
                : "Basics"
        }
        iconName="medkit-outline"
      />

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelStandalone}>
          <Text style={styles.fieldLabel}>
            {isRu
              ? "Название препарата"
              : locale === "de"
                ? "Medikamentenname"
                : locale === "pl"
                  ? "Nazwa leku"
                  : "Medicine name"}
          </Text>
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            value={medicineName}
            onChangeText={onChangeMedicineName}
            placeholder={
              isRu
                ? "Например: Нурофен сироп"
                : locale === "de"
                  ? "Zum Beispiel: Nurofen Sirup"
                  : locale === "pl"
                    ? "Na przykład: syrop Nurofen"
                    : "For example: Nurofen syrup"
            }
            placeholderTextColor="#A0A8B5"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelStandalone}>
          <Text style={styles.fieldLabel}>
            {isRu
              ? "Категория препарата"
              : locale === "de"
                ? "Medikamentenkategorie"
                : locale === "pl"
                  ? "Kategoria leku"
                  : "Medicine category"}
          </Text>
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
                  {locale === "ru"
                    ? option.labelRu
                    : locale === "de"
                      ? option.value === "oral"
                        ? "Oral"
                        : option.value === "nose"
                          ? "Nase"
                          : option.value === "throat"
                            ? "Hals"
                            : option.value === "eyes"
                              ? "Augen"
                              : option.value === "ears"
                                ? "Ohren"
                                : option.value === "skin"
                                  ? "Haut"
                                  : option.value === "inhalation"
                                    ? "Inhalation"
                                    : "Andere"
                      : locale === "pl"
                        ? option.value === "oral"
                          ? "Doustnie"
                          : option.value === "nose"
                            ? "Nos"
                            : option.value === "throat"
                              ? "Gardło"
                              : option.value === "eyes"
                                ? "Oczy"
                                : option.value === "ears"
                                  ? "Uszy"
                                  : option.value === "skin"
                                    ? "Skóra"
                                    : option.value === "inhalation"
                                      ? "Inhalacja"
                                      : "Inne"
                        : option.labelEn}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelStandalone}>
          <Text style={styles.fieldLabel}>
            {isRu
              ? "Концентрация"
              : locale === "de"
                ? "Konzentration"
                : locale === "pl"
                  ? "Stężenie"
                  : "Concentration"}
          </Text>
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            value={concentration}
            onChangeText={onChangeConcentration}
            placeholder={
              isRu
                ? "Что написано на упаковке, если важно"
                : locale === "de"
                  ? "Was auf der Packung steht, falls wichtig"
                  : locale === "pl"
                    ? "Co jest napisane na opakowaniu, jeśli to ważne"
                    : "What is written on the package, if relevant"
            }
            placeholderTextColor="#A0A8B5"
            style={styles.input}
          />
        </View>
      </View>
    </View>
  );
}

export function Step2UsageSection({
  locale,
  purpose,
  onChangePurpose,
  howToUse,
  onChangeHowToUse,
  category,
  previewTitle,
  previewSubtitleBase,
}: {
  locale: MobileLocale;
  purpose: string;
  onChangePurpose: (value: string) => void;
  howToUse: string;
  onChangeHowToUse: (value: string) => void;
  category: ManualCategory | null;
  previewTitle: string;
  previewSubtitleBase: string;
}) {
  const isRu = locale === "ru";
  return (
    <>
      <View style={styles.sectionCardUsage}>
        <SectionHeader
          title={
            isRu
              ? "Применение"
              : locale === "de"
                ? "Anwendung"
                : locale === "pl"
                  ? "Stosowanie"
                  : "Usage"
          }
          iconName="reader-outline"
          iconColor="#8B6FE8"
          iconBackgroundColor="#F1EBFF"
        />

        <View style={styles.fieldBlock}>
          <View style={styles.fieldLabelStandalone}>
            <Text style={styles.fieldLabel}>
              {isRu
                ? "Для чего препарат"
                : locale === "de"
                  ? "Wofür ist das Medikament"
                  : locale === "pl"
                    ? "Na co jest ten lek"
                    : "What is the medicine for"}
            </Text>
          </View>
          <View style={styles.textareaWrap}>
            <TextInput
              value={purpose}
              onChangeText={onChangePurpose}
              placeholder={
                isRu
                  ? "Например: при температуре, боли или воспалении"
                  : locale === "de"
                    ? "Zum Beispiel: bei Fieber, Schmerzen oder Entzündung"
                    : locale === "pl"
                      ? "Na przykład: na gorączkę, ból lub stan zapalny"
                      : "For example: for fever, pain, or inflammation"
              }
              placeholderTextColor="#A0A8B5"
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <View style={styles.fieldLabelStandalone}>
            <Text style={styles.fieldLabel}>
              {isRu
                ? "Как применять"
                : locale === "de"
                  ? "Wie anwenden"
                  : locale === "pl"
                    ? "Jak stosować"
                    : "How to use"}
            </Text>
          </View>
          <View style={styles.textareaWrap}>
            <TextInput
              value={howToUse}
              onChangeText={onChangeHowToUse}
              placeholder={
                isRu
                  ? "Например: по 5 мл 3 раза в день после еды"
                  : locale === "de"
                    ? "Zum Beispiel: 5 ml dreimal täglich nach dem Essen"
                    : locale === "pl"
                      ? "Na przykład: 5 ml 3 razy dziennie po jedzeniu"
                      : "For example: 5 ml three times a day after meals"
              }
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
  locale,
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
  locale: MobileLocale;
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
  const isRu = locale === "ru";
  return (
    <>
      <View style={styles.sectionCardStorage}>
        <SectionHeader
          title={
            isRu
              ? "Упаковка и хранение"
              : locale === "de"
                ? "Packung und Lagerung"
                : locale === "pl"
                  ? "Opakowanie i przechowywanie"
                  : "Pack and storage"
          }
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
              <Text style={styles.fieldLabel}>
                {isRu
                  ? "Срок годности"
                  : locale === "de"
                    ? "Ablaufdatum"
                    : locale === "pl"
                      ? "Termin ważności"
                      : "Expiry date"}
              </Text>
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
              {expiryDateLabel ||
                (isRu
                  ? "Выберите дату"
                  : locale === "de"
                    ? "Datum wählen"
                    : locale === "pl"
                      ? "Wybierz datę"
                      : "Choose a date")}
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
              <Text style={styles.fieldLabel}>
                {isRu
                  ? "Дата вскрытия"
                  : locale === "de"
                    ? "Öffnungsdatum"
                    : locale === "pl"
                      ? "Data otwarcia"
                      : "Opened on"}
              </Text>
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
              {openedDateLabel ||
                (isRu
                  ? "Выберите дату"
                  : locale === "de"
                    ? "Datum wählen"
                    : locale === "pl"
                      ? "Wybierz datę"
                      : "Choose a date")}
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
                <Text style={styles.fieldLabel}>
                  {isRu
                    ? "Сколько хранится\nпосле вскрытия"
                    : locale === "de"
                      ? "Wie lange nach\ndem Öffnen haltbar"
                      : locale === "pl"
                        ? "Jak długo po\notwarciu"
                        : "How long after\nopening"}
                </Text>
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
                {afterOpeningLabel ||
                  (isRu
                    ? "Выберите срок"
                    : locale === "de"
                      ? "Frist wählen"
                      : locale === "pl"
                        ? "Wybierz okres"
                        : "Choose a period")}
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
            <Text style={styles.fieldLabel}>
              {isRu
                ? "Комментарий"
                : locale === "de"
                  ? "Kommentar"
                  : locale === "pl"
                    ? "Komentarz"
                    : "Comment"}
            </Text>
          </View>
          <View style={styles.textareaWrap}>
            <TextInput
              value={storageComment}
              onChangeText={onChangeStorageComment}
              placeholder={
                isRu
                  ? "Например: хранить в холодильнике"
                  : locale === "de"
                    ? "Zum Beispiel: im Kühlschrank aufbewahren"
                    : locale === "pl"
                      ? "Na przykład: przechowywać w lodówce"
                      : "For example: keep refrigerated"
              }
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

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { BackdatedDateTimePickerSheet } from "../../../shared/components/BackdatedDateTimePickerSheet";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { useBackdatedDateTimePicker } from "../../../shared/hooks/useBackdatedDateTimePicker";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { formatBackdatedDate } from "../../../shared/lib/backdatedDateTime";
import type { MedicineCardItem } from "../model/medicineCabinetOverviewModel";
import { resolveMedicineFormIcon } from "../model/medicineCabinetOverviewModel";
import { formatIsoDate, parseIsoDate } from "../model/manualMedicineCreateFlow";
import { medicineCabinetOverviewStyles as styles } from "./medicineCabinetOverviewScreenStyles";

export function MedicineCabinetMedicineDetailsScreen({
  item,
  onBack,
  onRenewPack,
}: {
  item: MedicineCardItem;
  onBack: () => void;
  onRenewPack: (payload: {
    expiryDate: string;
    openedDate: string | null;
  }) => void;
}) {
  const { width } = useWindowDimensions();
  const [isRenewPackSheetOpen, setIsRenewPackSheetOpen] = useState(false);
  const metaLine = [item.medicineForm, item.concentration].filter(Boolean).join(" · ");
  const primaryTag = item.tags[0]?.text ?? "";
  const secondaryTags = item.tags.slice(1);
  const quickFacts = [
    item.expiryLabel
      ? { label: "Годен до", value: item.expiryLabel, tone: "danger" as const }
      : null,
    item.afterOpeningLabel
      ? {
          label: "После открытия",
          value: item.afterOpeningLabel,
          tone: "warning" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    tone: "danger" | "warning";
  }>;
  const expiryPicker = useBackdatedDateTimePicker(new Date());
  const openedPicker = useBackdatedDateTimePicker(new Date());
  const [renewExpiryDate, setRenewExpiryDate] = useState("");
  const [renewOpenedDate, setRenewOpenedDate] = useState("");
  const expiryDateLabel = renewExpiryDate
    ? formatBackdatedDate(parseIsoDate(renewExpiryDate, new Date()), "ru")
    : "";
  const openedDateLabel = renewOpenedDate
    ? formatBackdatedDate(parseIsoDate(renewOpenedDate, new Date()), "ru")
    : "";
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: true,
    width,
    onBack,
  });

  useEffect(() => {
    setRenewExpiryDate(item.raw.expiryDate ?? "");
    setRenewOpenedDate(item.raw.openedAt ? item.raw.openedAt.slice(0, 10) : "");
  }, [item.id, item.raw.expiryDate, item.raw.openedAt]);

  const handleOpenRenewExpiryDatePicker = () => {
    expiryPicker.reset(parseIsoDate(renewExpiryDate, new Date()));
    setIsRenewPackSheetOpen(false);
    setTimeout(() => {
      expiryPicker.openPicker("date");
    }, 220);
  };

  const handleOpenRenewOpenedDatePicker = () => {
    openedPicker.reset(parseIsoDate(renewOpenedDate, new Date()));
    setIsRenewPackSheetOpen(false);
    setTimeout(() => {
      openedPicker.openPicker("date");
    }, 220);
  };

  const handleConfirmRenewExpiryDatePicker = () => {
    const next = new Date(expiryPicker.selectedDate);
    next.setFullYear(
      expiryPicker.pickerYear,
      expiryPicker.pickerMonthIndex,
      expiryPicker.pickerDay,
    );
    expiryPicker.setSelectedDate(next);
    setRenewExpiryDate(formatIsoDate(next));
    expiryPicker.confirmPicker();
    setIsRenewPackSheetOpen(true);
  };

  const handleConfirmRenewOpenedDatePicker = () => {
    const next = new Date(openedPicker.selectedDate);
    next.setFullYear(
      openedPicker.pickerYear,
      openedPicker.pickerMonthIndex,
      openedPicker.pickerDay,
    );
    openedPicker.setSelectedDate(next);
    setRenewOpenedDate(formatIsoDate(next));
    openedPicker.confirmPicker();
    setIsRenewPackSheetOpen(true);
  };

  const handleSaveRenewPack = () => {
    if (!renewExpiryDate) {
      return;
    }

    onRenewPack({
      expiryDate: renewExpiryDate,
      openedDate: renewOpenedDate || null,
    });
    setIsRenewPackSheetOpen(false);
  };

  return (
    <View style={styles.detailsScreenRoot}>
      <Animated.View style={[styles.detailsAnimatedLayer, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={["#FFF7F1", "#FFF3EA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View
            style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
            {...panHandlers}
          />
          <View style={styles.decorationTop} />
          <View style={styles.decorationMiddle} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.detailsTopBar}>
            <Pressable onPress={onBack} style={styles.detailsBackLink}>
              <Text style={styles.detailsBackLinkText}>← К аптечке</Text>
            </Pressable>
          </View>

          <View style={styles.detailsHeroCard}>
            <View style={styles.detailsHeroRow}>
              <View
                style={[
                  styles.detailsHeroArtWrap,
                  { backgroundColor: item.artBackgroundColor },
                ]}
              >
                <Image
                  source={resolveMedicineFormIcon(item.medicineForm)}
                  style={styles.detailsHeroArt}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.detailsHeroMainColumn}>
                <View style={styles.detailsHeroTitleRow}>
                  <Text style={styles.detailsHeroTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
                <View style={styles.detailsHeroTipsRow}>
                  <View
                    style={[
                      styles.detailsStatusBadge,
                      styles.detailsHeroStatusBadge,
                      { backgroundColor: item.statusBackgroundColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailsStatusText,
                        { color: item.statusTextColor },
                      ]}
                    >
                      {item.statusText}
                    </Text>
                  </View>
                  {primaryTag ? (
                    <View
                      style={[
                        styles.tag,
                        styles.detailsPrimaryTag,
                        styles.detailsPrimaryTagGreen,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          styles.detailsPrimaryTagText,
                          styles.detailsPrimaryTagTextGreen,
                        ]}
                      >
                        {primaryTag}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {metaLine ? (
                  <Text style={styles.detailsHeroSubtitle} numberOfLines={1}>
                    {metaLine}
                  </Text>
                ) : null}
                <Text style={styles.detailsHeroMicrocopy} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </View>
            </View>

            {secondaryTags.length > 0 ? (
              <View style={styles.detailsTagsBlock}>
                <View style={styles.detailsSecondaryTagsRow}>
                  {secondaryTags.map((tag) => (
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
            ) : null}

            {quickFacts.length > 0 ? (
              <View style={styles.detailsFactGrid}>
                {quickFacts.map((fact) => (
                  <View
                    key={fact.label}
                    style={[
                      styles.detailsFactCard,
                      fact.tone === "danger"
                        ? styles.detailsFactCardDanger
                        : styles.detailsFactCardWarning,
                    ]}
                  >
                    <Text style={styles.detailsFactLabel}>{fact.label}</Text>
                    <Text style={styles.detailsFactValue} numberOfLines={2}>
                      {fact.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.detailsSectionCard}>
            {item.description ? (
              <View style={styles.detailsInlineBlock}>
                <View style={styles.detailsInlineHeader}>
                  <View
                    style={[
                      styles.detailsInlineIconWrap,
                      { backgroundColor: "#F1EBFF" },
                    ]}
                  >
                    <Ionicons name="clipboard-outline" size={14} color="#8B6FE8" />
                  </View>
                  <Text style={styles.detailsInlineTitle}>О препарате</Text>
                </View>
                <Text style={styles.detailsBodyText}>{item.description}</Text>
              </View>
            ) : null}

            {item.dosage ? (
              <View style={styles.detailsInlineBlock}>
                <View style={styles.detailsInlineHeader}>
                  <View
                    style={[
                      styles.detailsInlineIconWrap,
                      { backgroundColor: "#EEF5FF" },
                    ]}
                  >
                    <Ionicons name="reader-outline" size={14} color="#4A90D9" />
                  </View>
                  <Text style={styles.detailsInlineTitle}>Как принимать</Text>
                </View>
                <Text style={styles.detailsBodyText}>{item.dosage}</Text>
              </View>
            ) : null}
            {item.comment ? (
              <View style={styles.detailsInlineBlock}>
                <View style={styles.detailsInlineHeader}>
                  <View
                    style={[
                      styles.detailsInlineIconWrap,
                      { backgroundColor: "#FFF0E8" },
                    ]}
                  >
                    <Ionicons name="document-text-outline" size={14} color="#F56565" />
                  </View>
                  <Text style={styles.detailsInlineTitle}>Комментарий</Text>
                </View>
                <Text style={styles.detailsBodyText}>{item.comment}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.detailsActionsRow}>
            <View style={styles.detailsPrimaryActionWrap}>
              <Pressable
                style={styles.detailsSecondaryAction}
                onPress={() => setIsRenewPackSheetOpen(true)}
              >
                <Text style={styles.detailsSecondaryActionText}>Обновить упаковку</Text>
              </Pressable>
            </View>
          </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      <FormBottomSheet
        visible={isRenewPackSheetOpen}
        onClose={() => setIsRenewPackSheetOpen(false)}
        overlayStyle={styles.sheetOverlay}
        backdropStyle={styles.sheetBackdrop}
        sheetStyle={styles.customValueSheetCard}
      >
        {({ panHandlers: sheetPanHandlers, requestClose }) => (
          <>
            <View style={styles.sheetDragZone} {...sheetPanHandlers}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Новая упаковка</Text>
              <Text style={styles.sheetSubtitle}>
                Укажите новые даты для этой упаковки.
              </Text>
            </View>

            <View style={styles.detailsSheetFields}>
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Срок годности</Text>
                <Pressable onPress={handleOpenRenewExpiryDatePicker} style={styles.dateRow}>
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

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Дата вскрытия</Text>
                <Pressable onPress={handleOpenRenewOpenedDatePicker} style={styles.dateRow}>
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
            </View>

            <View style={styles.customValueActions}>
              <Pressable
                onPress={() => requestClose()}
                style={({ pressed }) => [
                  styles.customValueCancelButton,
                  pressed ? styles.secondaryButtonPressed : null,
                ]}
              >
                <Text style={styles.customValueCancelText}>Отмена</Text>
              </Pressable>

              <Pressable
                onPress={() => requestClose(handleSaveRenewPack)}
                style={({ pressed }) => [
                  styles.customValueSaveButton,
                  pressed ? styles.primaryButtonPressed : null,
                ]}
              >
                <LinearGradient
                  colors={["#F56565", "#EF4F4F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.customValueSaveGradient}
                />
                <Text style={styles.customValueSaveText}>Сохранить</Text>
              </Pressable>
            </View>
          </>
        )}
      </FormBottomSheet>

      {expiryPicker.activePickerField ? (
        <BackdatedDateTimePickerSheet
          visible
          locale="ru"
          pastYears={3}
          futureYears={12}
          activePickerField={expiryPicker.activePickerField}
          pickerDay={expiryPicker.pickerDay}
          pickerMonthIndex={expiryPicker.pickerMonthIndex}
          pickerYear={expiryPicker.pickerYear}
          pickerHour={expiryPicker.pickerHour}
          pickerMinute={expiryPicker.pickerMinute}
          setPickerDay={expiryPicker.setPickerDay}
          setPickerMonthIndex={expiryPicker.setPickerMonthIndex}
          setPickerYear={expiryPicker.setPickerYear}
          setPickerHour={expiryPicker.setPickerHour}
          setPickerMinute={expiryPicker.setPickerMinute}
          onClose={() => {
            expiryPicker.closePicker();
            setIsRenewPackSheetOpen(true);
          }}
          onConfirm={handleConfirmRenewExpiryDatePicker}
        />
      ) : null}

      {openedPicker.activePickerField ? (
        <BackdatedDateTimePickerSheet
          visible
          locale="ru"
          activePickerField={openedPicker.activePickerField}
          pickerDay={openedPicker.pickerDay}
          pickerMonthIndex={openedPicker.pickerMonthIndex}
          pickerYear={openedPicker.pickerYear}
          pickerHour={openedPicker.pickerHour}
          pickerMinute={openedPicker.pickerMinute}
          setPickerDay={openedPicker.setPickerDay}
          setPickerMonthIndex={openedPicker.setPickerMonthIndex}
          setPickerYear={openedPicker.setPickerYear}
          setPickerHour={openedPicker.setPickerHour}
          setPickerMinute={openedPicker.setPickerMinute}
          onClose={() => {
            openedPicker.closePicker();
            setIsRenewPackSheetOpen(true);
          }}
          onConfirm={handleConfirmRenewOpenedDatePicker}
        />
      ) : null}
    </View>
  );
}

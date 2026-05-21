import { View } from "react-native";
import { Animated, useWindowDimensions } from "react-native";
import { BackdatedDateTimePickerSheet } from "../../../shared/components/BackdatedDateTimePickerSheet";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import type { MobileAuthSession } from "../../auth/api/authApi";
import { MedicineCabinetAfterOpeningSheets } from "./MedicineCabinetAfterOpeningSheets";
import { MedicineCabinetReferenceCreateFrame } from "./MedicineCabinetReferenceCreateFrame";
import { styles } from "./medicineCabinetReferenceCreateScreenStyles";
import { useMedicineCabinetReferenceCreateFlow } from "./useMedicineCabinetReferenceCreateFlow";

export function MedicineCabinetReferenceCreateScreen({
  authSession,
  onBack,
  onCreated,
}: {
  authSession: MobileAuthSession | null;
  onBack: () => void;
  onCreated: () => void;
}) {
  const flow = useMedicineCabinetReferenceCreateFlow({
    authSession,
    onBack,
    onCreated,
  });
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: true,
    width,
    onBack: flow.handleBackPress,
    shouldCloseOnBack: flow.step === "search",
  });

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.animatedLayer, { transform: [{ translateX }] }]}
      >
        <View
          style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
          {...panHandlers}
        />
        <MedicineCabinetReferenceCreateFrame
          step={flow.step}
          locale={flow.uiLocale}
          searchQuery={flow.searchQuery}
          onChangeSearchQuery={flow.setSearchQuery}
          activeCategory={flow.activeCategory}
          onSelectCategory={flow.setActiveCategory}
          visibleItems={flow.visibleItems}
          selectedItem={flow.selectedItem}
          onSelectItem={flow.setSelectedItem}
          showEmptyState={flow.showEmptyState}
          emptyStateTitle={flow.emptyStateTitle}
          expiryDateLabel={flow.expiryDateLabel}
          onPressExpiryDate={flow.handleOpenExpiryDatePicker}
          openedDateLabel={flow.openedDateLabel}
          onPressOpenedDate={flow.handleOpenOpenedDatePicker}
          openedShelfLabel={flow.openedShelfLabel}
          onPressShelfSelector={() => flow.setIsShelfSheetOpen(true)}
          comment={flow.comment}
          onChangeComment={flow.setComment}
          isSaving={flow.isSaving}
          canSubmitStorage={flow.canSubmitStorage}
          onBackPress={flow.handleBackPress}
          onPrimaryPress={flow.handlePrimaryPress}
        />
      </Animated.View>

      {flow.expiryPicker.activePickerField ? (
        <BackdatedDateTimePickerSheet
          visible
          locale={flow.uiLocale}
          pastYears={3}
          futureYears={12}
          activePickerField={flow.expiryPicker.activePickerField}
          pickerDay={flow.expiryPicker.pickerDay}
          pickerMonthIndex={flow.expiryPicker.pickerMonthIndex}
          pickerYear={flow.expiryPicker.pickerYear}
          pickerHour={flow.expiryPicker.pickerHour}
          pickerMinute={flow.expiryPicker.pickerMinute}
          setPickerDay={flow.expiryPicker.setPickerDay}
          setPickerMonthIndex={flow.expiryPicker.setPickerMonthIndex}
          setPickerYear={flow.expiryPicker.setPickerYear}
          setPickerHour={flow.expiryPicker.setPickerHour}
          setPickerMinute={flow.expiryPicker.setPickerMinute}
          onClose={flow.expiryPicker.closePicker}
          onConfirm={flow.handleConfirmExpiryDatePicker}
        />
      ) : null}

      {flow.openedPicker.activePickerField ? (
        <BackdatedDateTimePickerSheet
          visible
          locale={flow.uiLocale}
          activePickerField={flow.openedPicker.activePickerField}
          pickerDay={flow.openedPicker.pickerDay}
          pickerMonthIndex={flow.openedPicker.pickerMonthIndex}
          pickerYear={flow.openedPicker.pickerYear}
          pickerHour={flow.openedPicker.pickerHour}
          pickerMinute={flow.openedPicker.pickerMinute}
          setPickerDay={flow.openedPicker.setPickerDay}
          setPickerMonthIndex={flow.openedPicker.setPickerMonthIndex}
          setPickerYear={flow.openedPicker.setPickerYear}
          setPickerHour={flow.openedPicker.setPickerHour}
          setPickerMinute={flow.openedPicker.setPickerMinute}
          onClose={flow.openedPicker.closePicker}
          onConfirm={flow.handleConfirmOpenedDatePicker}
        />
      ) : null}

      <MedicineCabinetAfterOpeningSheets
        locale={flow.uiLocale}
        isOptionSheetOpen={flow.isShelfSheetOpen}
        isCustomSheetOpen={flow.isCustomShelfSheetOpen}
        mode={flow.openedShelfMode}
        customValue={flow.customShelfValue}
        onChangeCustomValue={flow.setCustomShelfValue}
        onCloseOptionSheet={() => flow.setIsShelfSheetOpen(false)}
        onCloseCustomSheet={() => flow.setIsCustomShelfSheetOpen(false)}
        onSelectOption={flow.handleSelectShelfOption}
        onPressCustom={flow.handleOpenCustomShelf}
        onSaveCustom={flow.handleSaveCustomShelfValue}
        styles={styles}
      />
    </View>
  );
}

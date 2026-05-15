import { LinearGradient } from "expo-linear-gradient";
import { Animated, Text, TextInput, View } from "react-native";
import { Pressable } from "react-native";
import { BackdatedDateTimePickerSheet } from "../../../shared/components/BackdatedDateTimePickerSheet";
import type { MobileAuthSession } from "../../auth/api/authApi";
import { MedicineCabinetAfterOpeningSheets } from "./MedicineCabinetAfterOpeningSheets";
import { MedicineCabinetManualCreateFrame } from "./MedicineCabinetManualCreateFrame";
import { styles } from "./medicineCabinetManualCreateScreenStyles";
import { useManualMedicineCreateFlow } from "./useManualMedicineCreateFlow";

export function MedicineCabinetManualCreateScreen({
  authSession,
  onBack,
  onCreated,
}: {
  authSession: MobileAuthSession | null;
  onBack: () => void;
  onCreated: () => void;
}) {
  const flow = useManualMedicineCreateFlow({
    authSession,
    onBack,
    onCreated,
  });

  return (
    <View style={styles.root}>
      <View style={styles.gradient}>
        {flow.previousStep ? (
          <View style={styles.backgroundStepLayer}>
            <MedicineCabinetManualCreateFrame
              step={flow.previousStep}
              isRu={flow.isRu}
              medicineName={flow.medicineName}
              onChangeMedicineName={flow.setMedicineName}
              category={flow.category}
              onSelectCategory={flow.setCategory}
              concentration={flow.concentration}
              onChangeConcentration={flow.setConcentration}
              purpose={flow.purpose}
              onChangePurpose={flow.setPurpose}
              howToUse={flow.howToUse}
              onChangeHowToUse={flow.setHowToUse}
              expiryDateLabel={flow.expiryDateLabel}
              onPressExpiryDate={flow.handleOpenExpiryDatePicker}
              openedDateLabel={flow.openedDateLabel}
              onPressOpenedDate={flow.handleOpenOpenedDatePicker}
              afterOpeningLabel={flow.previewState.afterOpeningLabel}
              onPressAfterOpeningSelector={() => flow.setIsAfterOpeningSheetOpen(true)}
              storageComment={flow.storageComment}
              onChangeStorageComment={flow.setStorageComment}
              previewTitle={flow.previewState.previewTitle}
              previewSubtitleBase={flow.previewState.previewSubtitleBase}
              previewExpiry={flow.previewState.previewExpiry}
              previewOpened={flow.previewState.previewOpened}
              previewAfterOpening={flow.previewState.previewAfterOpening}
              canGoNextFromStep1={flow.canGoNextFromStep1}
              canSaveStep3={flow.canSaveStep3}
              onBackPress={flow.handleBackNavigation}
              onPrimaryPress={flow.handlePrimaryAction}
              interactive={false}
            />
          </View>
        ) : null}

        <Animated.View
          style={[
            styles.foregroundStepLayer,
            { transform: [{ translateX: flow.translateX }] },
          ]}
        >
          <MedicineCabinetManualCreateFrame
            step={flow.step}
            isRu={flow.isRu}
            medicineName={flow.medicineName}
            onChangeMedicineName={flow.setMedicineName}
            category={flow.category}
            onSelectCategory={flow.setCategory}
            concentration={flow.concentration}
            onChangeConcentration={flow.setConcentration}
            purpose={flow.purpose}
            onChangePurpose={flow.setPurpose}
            howToUse={flow.howToUse}
            onChangeHowToUse={flow.setHowToUse}
            expiryDateLabel={flow.expiryDateLabel}
            onPressExpiryDate={flow.handleOpenExpiryDatePicker}
            openedDateLabel={flow.openedDateLabel}
            onPressOpenedDate={flow.handleOpenOpenedDatePicker}
            afterOpeningLabel={flow.previewState.afterOpeningLabel}
            onPressAfterOpeningSelector={() => flow.setIsAfterOpeningSheetOpen(true)}
            storageComment={flow.storageComment}
            onChangeStorageComment={flow.setStorageComment}
            previewTitle={flow.previewState.previewTitle}
            previewSubtitleBase={flow.previewState.previewSubtitleBase}
            previewExpiry={flow.previewState.previewExpiry}
            previewOpened={flow.previewState.previewOpened}
            previewAfterOpening={flow.previewState.previewAfterOpening}
            canGoNextFromStep1={flow.canGoNextFromStep1}
            canSaveStep3={flow.canSaveStep3}
            onBackPress={flow.handleBackNavigation}
            onPrimaryPress={flow.handlePrimaryAction}
            interactive
            panHandlers={flow.panHandlers}
            swipeCaptureWidth={flow.swipeCaptureWidth}
          />
        </Animated.View>
      </View>

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
        isOptionSheetOpen={flow.isAfterOpeningSheetOpen}
        isCustomSheetOpen={flow.isAfterOpeningCustomSheetOpen}
        mode={flow.afterOpeningMode}
        customValue={flow.afterOpeningCustomValue}
        onChangeCustomValue={flow.setAfterOpeningCustomValue}
        onCloseOptionSheet={() => flow.setIsAfterOpeningSheetOpen(false)}
        onCloseCustomSheet={() => flow.setIsAfterOpeningCustomSheetOpen(false)}
        onSelectOption={flow.handleSelectAfterOpeningOption}
        onPressCustom={flow.handleAfterOpeningCustomPress}
        onSaveCustom={flow.handleSaveAfterOpeningCustomValue}
        styles={styles}
      />
    </View>
  );
}

import { Image, Pressable, Text, View } from "react-native";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import {
  type ChildAvatarGender,
  type ChildAvatarPresetKey,
  getChildAvatarSourceByKey,
} from "../model/childrenRedesign";
import { styles } from "./childCreateStyles";

export function ChildAvatarPickerSheet({
  visible,
  title,
  boyLabel,
  girlLabel,
  gender,
  onChangeGender,
  options,
  selectedAvatarKey,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  boyLabel: string;
  girlLabel: string;
  gender: ChildAvatarGender | null;
  onChangeGender: (value: ChildAvatarGender) => void;
  options: Array<{
    key: ChildAvatarPresetKey;
    gender: ChildAvatarGender;
    source: ReturnType<typeof getChildAvatarSourceByKey>;
  }>;
  selectedAvatarKey: ChildAvatarPresetKey | null;
  onClose: () => void;
  onSelect: (key: ChildAvatarPresetKey) => void;
}) {
  return (
    <FormBottomSheet
      visible={visible}
      onClose={onClose}
      overlayStyle={styles.sheetOverlay}
      backdropStyle={styles.sheetBackdrop}
      sheetStyle={styles.avatarSheetCard}
    >
      {({ panHandlers, requestClose }) => (
        <>
          <View style={styles.sheetDragZone} {...panHandlers}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{title}</Text>
          </View>

          <View style={styles.sheetGenderSwitch}>
            <Pressable
              onPress={() => onChangeGender("boy")}
              style={({ pressed }) => [
                styles.genderSwitchOption,
                styles.genderSwitchOptionBoy,
                gender === "boy" ? styles.genderSwitchOptionBoyActive : null,
                pressed ? styles.genderChipPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.genderSwitchText,
                  gender === "boy" ? styles.genderSwitchTextActive : null,
                ]}
              >
                {boyLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onChangeGender("girl")}
              style={({ pressed }) => [
                styles.genderSwitchOption,
                styles.genderSwitchOptionGirl,
                gender === "girl" ? styles.genderSwitchOptionGirlActive : null,
                pressed ? styles.genderChipPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.genderSwitchText,
                  gender === "girl" ? styles.genderSwitchTextActive : null,
                ]}
              >
                {girlLabel}
              </Text>
            </Pressable>
          </View>

          <View style={styles.avatarSheetGrid}>
            {options.map((avatar) => (
              <Pressable
                key={avatar.key}
                onPress={() => requestClose(() => onSelect(avatar.key))}
                style={({ pressed }) => [
                  styles.avatarOption,
                  selectedAvatarKey === avatar.key ? styles.avatarOptionSelected : null,
                  pressed ? styles.avatarOptionPressed : null,
                ]}
              >
                {avatar.source ? (
                  <Image
                    source={avatar.source}
                    style={styles.avatarOptionImage}
                    resizeMode="contain"
                  />
                ) : null}
              </Pressable>
            ))}
          </View>
        </>
      )}
    </FormBottomSheet>
  );
}

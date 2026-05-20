import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  Pressable,
  Switch,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { styles } from "./settingsScreenStyles";

const APPLE_SWITCH_GREEN = "#34C759";

export function SettingsSection({
  title,
  hint,
  textPrimaryColor,
  textSecondaryColor,
  children,
}: {
  title: string;
  hint: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textPrimaryColor }]}>{title}</Text>
        <Text style={[styles.sectionHint, { color: textSecondaryColor }]}>{hint}</Text>
      </View>
      {children}
    </View>
  );
}

export function ToggleRow({
  icon,
  iconStyle,
  title,
  hint,
  value,
  disabled,
  onPress,
  onValueChange,
}: {
  icon: ReactNode;
  iconStyle: StyleProp<ViewStyle> | null;
  title: string;
  hint: string;
  value: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onValueChange: (value: boolean) => void;
}) {
  const surfaceTheme = useMobileSurfaceTheme();
  const content = (
    <>
      <View style={[styles.rowLead, iconStyle]}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: surfaceTheme.textPrimaryColor }]}>
          {title}
        </Text>
        <Text style={[styles.rowHint, { color: surfaceTheme.textSecondaryColor }]}>
          {hint}
        </Text>
      </View>
      <View style={styles.switchWrap}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: "#E9DED7", true: APPLE_SWITCH_GREEN }}
          thumbColor="#FFFFFF"
        />
      </View>
    </>
  );

  if (!onPress) {
    return <View style={styles.settingRow}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={!disabled}
      style={({ pressed }) => [
        styles.settingRow,
        disabled ? styles.rowDisabled : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function ChoiceRow({
  icon,
  iconStyle,
  title,
  hint,
  choices,
  selectedKey,
  accentColor = "#F18169",
  onSelect,
  disabled,
  compact = false,
}: {
  icon: ReactNode | null;
  iconStyle: StyleProp<ViewStyle> | null;
  title: string;
  hint: string;
  choices: Array<{ key: string | number; label: string }>;
  selectedKey: string | number;
  accentColor?: string;
  onSelect: (key: string | number) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <View style={[styles.settingRow, compact ? styles.settingRowCompact : null]}>
      {icon ? <View style={[styles.rowLead, iconStyle]}>{icon}</View> : null}
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: surfaceTheme.textPrimaryColor }]}>
          {title}
        </Text>
        <Text style={[styles.rowHint, { color: surfaceTheme.textSecondaryColor }]}>
          {hint}
        </Text>
        <View style={styles.chipRow}>
          {choices.map((choice) => {
            const isActive = selectedKey === choice.key;

            return (
              <Pressable
                key={String(choice.key)}
                onPress={() => onSelect(choice.key)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    borderColor: `${accentColor}2E`,
                    backgroundColor: "#FFF8F2",
                  },
                  isActive
                    ? [
                        styles.chipActive,
                        {
                          borderColor: `${accentColor}99`,
                          backgroundColor: `${accentColor}26`,
                        },
                      ]
                    : null,
                  pressed ? styles.chipPressed : null,
                  disabled ? styles.chipDisabled : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: surfaceTheme.textMutedColor },
                    isActive ? [styles.chipTextActive, { color: accentColor }] : null,
                  ]}
                >
                  {choice.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function ExpandableChoiceRow({
  icon,
  iconStyle,
  title,
  hint,
  choices,
  selectedKey,
  expanded,
  onToggle,
  onSelect,
  disabled,
}: {
  icon: ReactNode;
  iconStyle: StyleProp<ViewStyle> | null;
  title: string;
  hint: string;
  choices: Array<{ key: string | number; label: string }>;
  selectedKey: string | number;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (key: string | number) => void;
  disabled?: boolean;
}) {
  const surfaceTheme = useMobileSurfaceTheme();
  const selectedChoice =
    choices.find((choice) => choice.key === selectedKey) ?? choices[0];

  return (
    <>
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        style={({ pressed }) => [
          styles.settingRow,
          pressed ? styles.rowPressed : null,
          disabled ? styles.rowDisabled : null,
        ]}
      >
        <View style={[styles.rowLead, iconStyle]}>{icon}</View>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: surfaceTheme.textPrimaryColor }]}>
            {title}
          </Text>
          <Text style={[styles.rowHint, { color: surfaceTheme.textSecondaryColor }]}>
            {hint}
          </Text>
        </View>
        <View style={styles.dropdownValueWrap}>
          <Text
            style={[styles.dropdownValueText, { color: surfaceTheme.textSecondaryColor }]}
          >
            {selectedChoice?.label ?? ""}
          </Text>
          {disabled ? null : (
            <Feather
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={surfaceTheme.textMutedColor}
            />
          )}
        </View>
      </Pressable>

      {expanded && !disabled ? (
        <View
          style={[
            styles.dropdownList,
            {
              borderColor: surfaceTheme.inputBorderColor,
              backgroundColor: surfaceTheme.inputBackgroundColor,
            },
          ]}
        >
          {choices.map((choice, index) => {
            const active = choice.key === selectedKey;

            return (
              <Pressable
                key={String(choice.key)}
                onPress={() => onSelect(choice.key)}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  active ? [styles.dropdownItemActive, { backgroundColor: "#FDF0EA" }] : null,
                  pressed ? styles.dropdownItemPressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    { color: surfaceTheme.textPrimaryColor },
                    active ? styles.dropdownItemTextActive : null,
                  ]}
                >
                  {choice.label}
                </Text>
                {active ? (
                  <Feather name="check" size={16} color={surfaceTheme.textPrimaryColor} />
                ) : null}
                {index < choices.length - 1 ? (
                  <View
                    style={[
                      styles.dropdownDivider,
                      { backgroundColor: surfaceTheme.dividerColor },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

export function ExpandableHeaderRow({
  icon,
  iconStyle,
  title,
  hint,
  expanded,
  onPress,
  locked = false,
}: {
  icon: ReactNode;
  iconStyle: StyleProp<ViewStyle> | null;
  title: string;
  hint: string;
  expanded: boolean;
  onPress: () => void;
  locked?: boolean;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed ? styles.rowPressed : null]}
    >
      <View style={[styles.rowLead, iconStyle]}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: surfaceTheme.textPrimaryColor }]}>
          {title}
        </Text>
        <Text style={[styles.rowHint, { color: surfaceTheme.textSecondaryColor }]}>
          {hint}
        </Text>
      </View>
      {locked ? (
        <View style={styles.lockedStatusWrap}>
          <Feather name="check" size={16} color="#4E8B60" />
        </View>
      ) : (
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={surfaceTheme.textMutedColor}
        />
      )}
    </Pressable>
  );
}

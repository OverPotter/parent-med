import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ExpandableHeaderRow } from "./SettingsSharedParts";
import { styles } from "./settingsScreenStyles";

export function SubscriptionManagementCard({
  title,
  statusHint,
  statusLabel,
  planLabel,
  planValue,
  membersLabel,
  membersValue,
  accessUntilLabel,
  accessUntilValue,
  expanded,
  onToggle,
  actionLabel,
  onManageSubscription,
}: {
  title: string;
  statusHint: string;
  statusLabel: string;
  planLabel: string;
  planValue: string;
  membersLabel: string;
  membersValue: string;
  accessUntilLabel: string;
  accessUntilValue: string;
  expanded: boolean;
  onToggle: () => void;
  actionLabel: string;
  onManageSubscription: () => void;
}) {
  useMobileSurfaceTheme();

  return (
    <>
      <ExpandableHeaderRow
        icon={<Feather name="star" size={22} color="#E0846D" />}
        iconStyle={styles.rowLeadNeutral}
        title={title}
        hint={statusHint}
        expanded={expanded}
        onPress={onToggle}
      />
      {expanded ? (
        <>
          <View style={styles.subscriptionSummaryBlock}>
            <View style={styles.subscriptionSummaryGrid}>
              <View style={styles.subscriptionSummaryGridDividerVertical} />
              <View style={styles.subscriptionSummaryGridDividerHorizontal} />
              <View style={styles.subscriptionSummaryCell}>
                <View style={styles.subscriptionSummaryHead}>
                  <View style={styles.subscriptionSummaryIcon}>
                    <Feather name="activity" size={15} color="#E0846D" />
                  </View>
                  <Text style={styles.subscriptionSummaryLabel}>{statusLabel}</Text>
                </View>
                <Text style={styles.subscriptionSummaryValue}>{statusHint}</Text>
              </View>
              <View
                style={[
                  styles.subscriptionSummaryCell,
                  styles.subscriptionSummaryCellRight,
                ]}
              >
                <View style={styles.subscriptionSummaryHead}>
                  <View style={styles.subscriptionSummaryIcon}>
                    <Feather name="star" size={15} color="#6D8FE8" />
                  </View>
                  <Text style={styles.subscriptionSummaryLabel}>{planLabel}</Text>
                </View>
                <Text style={styles.subscriptionSummaryValue}>{planValue}</Text>
              </View>
              <View
                style={[
                  styles.subscriptionSummaryCell,
                  styles.subscriptionSummaryCellBottom,
                ]}
              >
                <View style={styles.subscriptionSummaryHead}>
                  <View style={styles.subscriptionSummaryIcon}>
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={16}
                      color="#5FA77A"
                    />
                  </View>
                  <Text style={styles.subscriptionSummaryLabel}>{membersLabel}</Text>
                </View>
                <Text style={styles.subscriptionSummaryValue}>{membersValue}</Text>
              </View>
              <View
                style={[
                  styles.subscriptionSummaryCell,
                  styles.subscriptionSummaryCellRight,
                  styles.subscriptionSummaryCellBottom,
                ]}
              >
                <View style={styles.subscriptionSummaryHead}>
                  <View style={styles.subscriptionSummaryIcon}>
                    <Feather name="calendar" size={15} color="#D68A3D" />
                  </View>
                  <Text style={styles.subscriptionSummaryLabel}>{accessUntilLabel}</Text>
                </View>
                <Text style={styles.subscriptionSummaryValue}>{accessUntilValue}</Text>
              </View>
            </View>
          </View>
          <View style={styles.subscriptionActionWrap}>
            <Pressable
              onPress={onManageSubscription}
              style={({ pressed }) => [
                styles.primaryAction,
                pressed ? styles.primaryActionPressed : null,
              ]}
            >
              <Text style={styles.primaryActionText}>{actionLabel}</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </>
  );
}

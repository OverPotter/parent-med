import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { RevenueCatPaywallPlanKey } from "../model/useRevenueCatPaywallController";
import type {
  SubscriptionPaywallCopy,
  SubscriptionPaywallFeature,
} from "../model/subscriptionPaywallCopy";
import type { PlanCardViewModel } from "../model/subscriptionPaywallViewModel";
import { styles } from "./subscriptionPaywallStyles";

type ComparisonColumnProps = {
  title: string;
  badge: string;
  titleStyle: object;
  cardStyle: object;
  items: SubscriptionPaywallFeature[];
  footer?: string;
  isPlus?: boolean;
};

export function ComparisonColumn({
  title,
  badge,
  titleStyle,
  cardStyle,
  items,
  footer,
  isPlus = false,
}: ComparisonColumnProps) {
  return (
    <View style={[styles.comparisonCard, cardStyle]}>
      <View style={styles.comparisonBody}>
        <View style={styles.comparisonHeadingRow}>
          <Text style={[styles.comparisonTitle, titleStyle]}>{title}</Text>
          <Text
            style={[
              styles.comparisonBadgeText,
              isPlus ? styles.comparisonBadgeTextPlus : styles.comparisonBadgeTextFree,
            ]}
          >
            {badge}
          </Text>
        </View>
        <View style={styles.comparisonItems}>
          {items.map((item) => {
            return (
              <View key={item.label} style={styles.comparisonItemRow}>
                <View
                  style={[
                    styles.comparisonIconWrap,
                    isPlus ? styles.comparisonIconWrapPlus : styles.comparisonIconWrapFree,
                  ]}
                >
                  <Feather
                    name={item.icon}
                    size={13}
                    color={isPlus ? "#D94D8E" : "#4677DA"}
                  />
                </View>
                <Text style={styles.comparisonItem}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
      {footer ? (
        <Text style={isPlus ? styles.plusFooter : styles.freeForever}>{footer}</Text>
      ) : null}
    </View>
  );
}

type PlanCardProps = {
  planKey: RevenueCatPaywallPlanKey;
  plan: PlanCardViewModel;
  isSelected: boolean;
  onPress: (planKey: RevenueCatPaywallPlanKey) => void;
};

export function PlanCard({
  planKey,
  plan,
  isSelected,
  onPress,
}: PlanCardProps) {
  return (
    <Pressable
      onPress={() => onPress(planKey)}
      style={[styles.planCard, isSelected ? styles.planCardSelected : null]}
    >
      {plan.badge ? (
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{plan.badge}</Text>
        </View>
      ) : null}
      <View style={styles.planTitleWrap}>
        <Text style={styles.planTitle}>{plan.title}</Text>
      </View>
      <Text style={styles.planPrice}>{plan.price ?? "—"}</Text>
      <Text style={styles.planDescription}>{plan.description}</Text>
      <View style={[styles.planCheck, isSelected ? styles.planCheckSelected : null]}>
        <Text
          style={[
            styles.planCheckText,
            isSelected ? styles.planCheckTextSelected : null,
          ]}
        >
          ✓
        </Text>
      </View>
    </Pressable>
  );
}

type FooterLinksProps = {
  copy: SubscriptionPaywallCopy;
  isSubmitting: boolean;
  canOpenTerms: boolean;
  canOpenPrivacy: boolean;
  onRestore: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
};

export function FooterLinks({
  copy,
  isSubmitting,
  canOpenTerms,
  canOpenPrivacy,
  onRestore,
  onTerms,
  onPrivacy,
}: FooterLinksProps) {
  return (
    <View style={styles.footerLinks}>
      <Pressable onPress={onRestore} disabled={isSubmitting}>
        <Text style={styles.footerLink}>{copy.restore}</Text>
      </Pressable>
      <Text style={styles.footerSeparator}>|</Text>
      <Pressable onPress={onTerms} disabled={!canOpenTerms}>
        <Text style={[styles.footerLink, !canOpenTerms ? styles.footerLinkDisabled : null]}>
          {copy.terms}
        </Text>
      </Pressable>
      <Text style={styles.footerSeparator}>|</Text>
      <Pressable onPress={onPrivacy} disabled={!canOpenPrivacy}>
        <Text style={[styles.footerLink, !canOpenPrivacy ? styles.footerLinkDisabled : null]}>
          {copy.privacy}
        </Text>
      </Pressable>
    </View>
  );
}

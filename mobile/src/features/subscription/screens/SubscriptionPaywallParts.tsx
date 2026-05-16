import { Pressable, Text, View } from "react-native";
import type { RevenueCatPaywallPlanKey } from "../model/useRevenueCatPaywallController";
import type { SubscriptionPaywallCopy } from "../model/subscriptionPaywallCopy";
import type { PlanCardViewModel } from "../model/subscriptionPaywallViewModel";
import { styles } from "./subscriptionPaywallStyles";

type ComparisonColumnProps = {
  title: string;
  titleStyle: object;
  cardStyle: object;
  items: string[];
  footer?: string;
  isPlus?: boolean;
};

export function ComparisonColumn({
  title,
  titleStyle,
  cardStyle,
  items,
  footer,
  isPlus = false,
}: ComparisonColumnProps) {
  return (
    <View style={[styles.comparisonCard, cardStyle]}>
      {isPlus ? (
        <View style={styles.plusHeadingRow}>
          <Text style={[styles.comparisonTitle, titleStyle]}>{title}</Text>
          <View style={styles.plusMiniPill}>
            <Text style={styles.plusMiniPillText}>Plus</Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.comparisonTitle, titleStyle]}>{title}</Text>
      )}
      {items.map((item, index) => (
        <Text
          key={item}
          style={isPlus && index === 0 ? styles.plusLeadItem : styles.comparisonItem}
        >
          {isPlus && index === 0 ? item : `• ${item}`}
        </Text>
      ))}
      {footer ? <Text style={styles.freeForever}>{footer}</Text> : null}
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
  onRestore: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
};

export function FooterLinks({
  copy,
  isSubmitting,
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
      <Pressable onPress={onTerms}>
        <Text style={styles.footerLink}>{copy.terms}</Text>
      </Pressable>
      <Text style={styles.footerSeparator}>|</Text>
      <Pressable onPress={onPrivacy}>
        <Text style={styles.footerLink}>{copy.privacy}</Text>
      </Pressable>
    </View>
  );
}

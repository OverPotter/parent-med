import type { RevenueCatPaywallPlanKey } from "./useRevenueCatPaywallController";
import type { RevenueCatPlanTrialDetails } from "./revenueCatPaywallOffering";
import type { SubscriptionPaywallCopy } from "./subscriptionPaywallCopy";
import { formatIntroDuration } from "./subscriptionPaywallCopy";

export type PlanCardViewModel = {
  title: string;
  price: string | null;
  badge: string | null;
  description: string;
};

type BuildSubscriptionPaywallViewModelArgs = {
  locale: string;
  copy: SubscriptionPaywallCopy;
  priceByPlan: Record<RevenueCatPaywallPlanKey, string | null>;
  trialDetailsByPlan: Record<RevenueCatPaywallPlanKey, RevenueCatPlanTrialDetails>;
  selectedPlan: RevenueCatPaywallPlanKey;
};

export function buildSubscriptionPaywallViewModel({
  locale,
  copy,
  priceByPlan,
  trialDetailsByPlan,
  selectedPlan,
}: BuildSubscriptionPaywallViewModelArgs) {
  const plans: Record<RevenueCatPaywallPlanKey, PlanCardViewModel> = {
    annual: {
      title: copy.annualTitle,
      price: priceByPlan.annual,
      badge: copy.annualBadge,
      description: copy.annualDescription,
    },
    monthly: {
      title: copy.monthlyTitle,
      price: priceByPlan.monthly,
      badge: null,
      description: copy.monthlyDescription,
    },
  };

  const selectedTrialDetails = trialDetailsByPlan[selectedPlan];
  const selectedPlanPrice = plans[selectedPlan].price ?? "—";
  const selectedPlanDuration =
    selectedTrialDetails.introPrice && selectedTrialDetails.hasFreeTrial
      ? formatIntroDuration(
          locale,
          selectedTrialDetails.introPrice.periodUnit,
          selectedTrialDetails.introPrice.periodNumberOfUnits,
        )
      : null;
  const selectedPlanCta =
    selectedPlanDuration && selectedTrialDetails.hasFreeTrial
      ? copy.ctaTrial
      : copy.ctaSubscribe;
  const selectedPlanLegal =
    selectedPlanDuration && selectedTrialDetails.hasFreeTrial
      ? copy.legalTrial
          .replace("{duration}", selectedPlanDuration)
          .replace("{price}", selectedPlanPrice)
      : copy.legalNoTrial.replace("{price}", selectedPlanPrice);

  return {
    plans,
    selectedPlanCta,
    selectedPlanLegal,
  };
}

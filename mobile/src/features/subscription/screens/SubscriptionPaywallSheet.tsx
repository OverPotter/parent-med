import { useMemo } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { MobileAuthSession } from "../../auth/api/authApi";
import { FullscreenSheetModal } from "../../../shared/components/FullscreenSheetModal";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  useRevenueCatPaywallController,
} from "../model/useRevenueCatPaywallController";
import { buildSubscriptionPaywallCopy } from "../model/subscriptionPaywallCopy";
import { buildSubscriptionPaywallViewModel } from "../model/subscriptionPaywallViewModel";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { ComparisonColumn, FooterLinks, PlanCard } from "./SubscriptionPaywallParts";
import { styles } from "./subscriptionPaywallStyles";

type SubscriptionPaywallSheetProps = {
  visible: boolean;
  session: MobileAuthSession | null;
  onClose: () => void;
  onPurchased?: () => Promise<void> | void;
  onError?: (message: string) => void;
  onOpenTermsOfUse?: () => void;
  onOpenPrivacyPolicy?: () => void;
};

export function SubscriptionPaywallSheet({
  visible,
  session,
  onClose,
  onPurchased,
  onError,
  onOpenTermsOfUse,
  onOpenPrivacyPolicy,
}: SubscriptionPaywallSheetProps) {
  const { locale } = useMobileI18n();
  const copy = useMemo(() => buildSubscriptionPaywallCopy(locale), [locale]);
  const {
    selectedPlan,
    setSelectedPlan,
    isLoading,
    isSubmitting,
    inlineMessage,
    priceByPlan,
    trialDetailsByPlan,
    canPurchase,
    handlePurchase,
    handleRestore,
  } = useRevenueCatPaywallController({
    visible,
    session,
    restoreSuccessMessage: copy.restoreSuccess,
    restoreInactiveMessage: copy.restoreInactive,
    onClose,
    onPurchased,
    onError,
  });

  const { plans, selectedPlanCta, selectedPlanLegal } = useMemo(
    () =>
      buildSubscriptionPaywallViewModel({
        locale,
        copy,
        priceByPlan,
        trialDetailsByPlan,
        selectedPlan,
      }),
    [copy, locale, priceByPlan, selectedPlan, trialDetailsByPlan],
  );

  const handleOpenTerms = () => {
    if (!onOpenTermsOfUse) {
      return;
    }
    onClose();
    onOpenTermsOfUse();
  };

  const handleOpenPrivacy = () => {
    if (!onOpenPrivacyPolicy) {
      return;
    }
    onClose();
    onOpenPrivacyPolicy();
  };

  return (
    <FullscreenSheetModal visible={visible} onClose={onClose} contentStyle={styles.screen}>
      {({ requestClose }) => (
        <ImageBackground
          source={childrenScreenAssets.background}
          resizeMode="cover"
          style={styles.screenInner}
          imageStyle={styles.screenBackgroundImage}
        >
          <View style={styles.screenOverlay} />

          <View style={styles.topBar}>
            <View />
            <Pressable
              onPress={requestClose}
              disabled={isSubmitting}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                isSubmitting ? styles.disabled : null,
                pressed ? styles.closeButtonPressed : null,
              ]}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.scrollInner}>
              <View style={styles.topSection}>
                <View style={styles.heroCard}>
                  <Text style={styles.title}>{copy.title}</Text>
                  <Text style={styles.subtitle}>{copy.subtitle}</Text>
                </View>

                <View style={styles.comparisonGrid}>
                  <ComparisonColumn
                    title={copy.freeTitle}
                    badge={copy.freeBadge}
                    titleStyle={styles.freeTitle}
                    cardStyle={styles.freeCard}
                    items={copy.freeItems}
                    footer={copy.freeForever}
                  />
                  <ComparisonColumn
                    title={copy.plusTitle}
                    badge={copy.plusBadge}
                    titleStyle={styles.plusTitle}
                    cardStyle={styles.plusCard}
                    items={copy.plusItems}
                    footer={copy.plusMore}
                    isPlus
                  />
                </View>
              </View>

              <View style={styles.bottomSection}>
                {isLoading ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator color="#F45BA6" />
                    <Text style={styles.loadingText}>{copy.loading}</Text>
                  </View>
                ) : null}

                <View style={styles.planGrid}>
                  {(["annual", "monthly"] as const).map((planKey) => (
                    <PlanCard
                      key={planKey}
                      planKey={planKey}
                      plan={plans[planKey]}
                      isSelected={selectedPlan === planKey}
                      onPress={setSelectedPlan}
                    />
                  ))}
                </View>

                <Pressable
                  onPress={() => {
                    void handlePurchase();
                  }}
                  disabled={!canPurchase}
                  style={({ pressed }) => [
                    styles.primaryAction,
                    pressed ? styles.primaryActionPressed : null,
                    !canPurchase ? styles.disabled : null,
                  ]}
                >
                  <Text style={styles.primaryActionText}>{selectedPlanCta}</Text>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.secondaryAction,
                    pressed ? styles.primaryActionPressed : null,
                    isSubmitting ? styles.disabled : null,
                  ]}
                >
                  <Text style={styles.secondaryActionText}>{copy.continueFree}</Text>
                </Pressable>

                <Text style={styles.legalNote}>{selectedPlanLegal}</Text>

                {inlineMessage ? <Text style={styles.inlineMessage}>{inlineMessage}</Text> : null}

                <FooterLinks
                  copy={copy}
                  isSubmitting={isSubmitting}
                  canOpenTerms={Boolean(onOpenTermsOfUse)}
                  canOpenPrivacy={Boolean(onOpenPrivacyPolicy)}
                  onRestore={() => {
                    void handleRestore();
                  }}
                  onTerms={handleOpenTerms}
                  onPrivacy={handleOpenPrivacy}
                />
              </View>
            </View>
          </ScrollView>
        </ImageBackground>
      )}
    </FullscreenSheetModal>
  );
}

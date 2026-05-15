import { useMemo, useState } from "react";
import {
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { buildPillboxHomeScreenContent } from "../model/pillboxHomeScreen";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import { pillboxHomeScreenStyles as styles } from "./pillboxHomeScreenStyles";
import { PillboxPlanOnboardingFlow } from "./PillboxPlanOnboardingFlow";

const noop = () => {};

export function PillboxHomeScreen({
  onOpenCreatePlan = noop,
  onOpenAnalytics = noop,
  onOpenPlan = noop,
  onMarkIntake = noop,
  familyMembers = [],
}: {
  onOpenCreatePlan?: () => void;
  onOpenAnalytics?: () => void;
  onOpenPlan?: (planId: string) => void;
  onMarkIntake?: (intakeId: string) => void;
  familyMembers?: MobileFamilyMember[];
}) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = useMemo(() => buildPillboxHomeScreenContent(locale), [locale]);
  const { width } = useWindowDimensions();
  const [activeIntakePage, setActiveIntakePage] = useState(0);
  const [isPlanFlowVisible, setIsPlanFlowVisible] = useState(false);
  const carouselPageWidth = width - 44;

  const handleCarouselScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextPage = Math.round(
      event.nativeEvent.contentOffset.x / Math.max(event.nativeEvent.layoutMeasurement.width, 1),
    );
    setActiveIntakePage(nextPage);
  };

  return (
    <View style={[styles.root, { backgroundColor: surfaceTheme.appBackgroundColor }]}>
      <ImageBackground
        source={redesignBackgrounds.childrenModule}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View
          style={[
            styles.overlay,
            { backgroundColor: surfaceTheme.backgroundOverlayColor },
          ]}
        />
      </ImageBackground>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable
            onPress={() => {
              onOpenCreatePlan();
              setIsPlanFlowVisible(true);
            }}
            style={({ pressed }) => [
              styles.quickActionButton,
              styles.quickActionPrimary,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.quickActionPlus}>+</Text>
            <Text style={styles.quickActionPrimaryText}>{content.createPlanLabel}</Text>
          </Pressable>
          <Pressable
            onPress={onOpenAnalytics}
            style={({ pressed }) => [
              styles.quickActionButton,
              styles.quickActionSecondary,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.quickActionSecondaryText}>{content.analyticsLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{content.activePlansTitle}</Text>
          <View style={styles.sectionCounter}>
            <Text style={styles.sectionCounterText}>{content.plansCounter}</Text>
          </View>
        </View>

        {content.todayIntakes.length > 0 ? (
          <View style={styles.carouselWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              onScroll={handleCarouselScroll}
              scrollEventThrottle={16}
            >
              {content.todayIntakes.map((item) => (
                <View
                  key={item.id}
                  style={[styles.carouselPage, { width: carouselPageWidth }]}
                >
                  <View style={styles.intakeCard}>
                    <View style={styles.intakeCardTop}>
                      <Text style={styles.intakeLabel}>{content.nextIntakeLabel}</Text>
                      <Text style={styles.intakeTime}>{item.time}</Text>
                      <View style={styles.intakeDateRow}>
                        <Text style={styles.intakeDate}>{item.relativeDate}</Text>
                        <View style={styles.countdownChip}>
                          <Text style={styles.countdownChipText}>{item.countdown}</Text>
                        </View>
                      </View>
                      <Text style={styles.intakePlanTitle}>{item.planTitle}</Text>
                      <Text style={styles.intakeMedicine}>{item.medicineSummary}</Text>
                    </View>

                    <Pressable
                      onPress={() => onMarkIntake(item.id)}
                      style={({ pressed }) => [
                        styles.intakeActionButton,
                        pressed ? styles.buttonPressed : null,
                      ]}
                    >
                      <Text style={styles.intakeActionText}>
                        {content.nextIntakeAction}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>

            {content.todayIntakes.length > 1 ? (
              <View style={styles.dotsRow}>
                {content.todayIntakes.map((item, index) => (
                  <View
                    key={item.id}
                    style={[styles.dot, index === activeIntakePage ? styles.dotActive : null]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{content.emptyTodayTitle}</Text>
            <Text style={styles.emptyDescription}>
              {content.emptyTodayDescription}
            </Text>
            <Pressable
              onPress={onOpenCreatePlan}
              style={({ pressed }) => [
                styles.quickActionButton,
                styles.quickActionPrimary,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.quickActionPrimaryText}>{content.createPlanLabel}</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.statsRow}>
          {content.summaryStats.map((item) => (
            <View key={item.id} style={styles.statCard}>
              <Text style={styles.statNumber}>{item.number}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {content.plans.length > 0 ? (
          <View style={styles.plansList}>
            {content.plans.map((plan) => {
              const statusChipStyle =
                plan.status === "attention"
                  ? styles.statusChipAttention
                  : plan.status === "missed"
                    ? styles.statusChipMissed
                    : plan.status === "completed"
                      ? styles.statusChipCompleted
                      : styles.statusChipActive;
              const statusTextStyle =
                plan.status === "attention"
                  ? styles.statusTextAttention
                  : plan.status === "missed"
                    ? styles.statusTextMissed
                    : plan.status === "completed"
                      ? styles.statusTextCompleted
                      : styles.statusTextActive;

              return (
                <Pressable
                  key={plan.id}
                  onPress={() => onOpenPlan(plan.id)}
                  style={({ pressed }) => [
                    styles.planCard,
                    pressed ? styles.buttonPressed : null,
                  ]}
                >
                  <View style={styles.planAvatar}>
                    <Text style={styles.planAvatarText}>{plan.avatarText}</Text>
                  </View>
                  <View style={styles.planMain}>
                    <Text numberOfLines={1} style={styles.planTitle}>
                      {plan.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.planMeta}>
                      {plan.medicineCount}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.planMeta,
                        plan.status === "attention" || plan.status === "missed"
                          ? styles.planMetaAttention
                          : null,
                      ]}
                    >
                      {plan.nextInfo}
                    </Text>
                  </View>
                  <View style={styles.planRight}>
                    <View style={[styles.statusChip, statusChipStyle]}>
                      <Text style={[styles.statusChipText, statusTextStyle]}>
                        {plan.statusText}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyCard, { marginTop: 22 }]}>
            <Text style={styles.emptyTitle}>{content.emptyPlansTitle}</Text>
            <Text style={styles.emptyDescription}>
              {content.emptyPlansDescription}
            </Text>
            <Pressable
              onPress={onOpenCreatePlan}
              style={({ pressed }) => [
                styles.quickActionButton,
                styles.quickActionPrimary,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.quickActionPrimaryText}>{content.createPlanLabel}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <PillboxPlanOnboardingFlow
        visible={isPlanFlowVisible}
        familyMembers={familyMembers}
        onClose={() => setIsPlanFlowVisible(false)}
        onPlanSaved={() => setIsPlanFlowVisible(false)}
      />
    </View>
  );
}

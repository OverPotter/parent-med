import {
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { pillboxTimeIcons } from "../assets/time";
import { buildPillboxHomeScreenContent } from "../model/pillboxHomeScreen";
import { pillboxHomeScreenStyles as styles } from "./pillboxHomeScreenStyles";
import { PillboxPlanDetailsScreen } from "./PillboxPlanDetailsScreen";
import { PillboxPlanOnboardingFlow } from "./PillboxPlanOnboardingFlow";
import { SwipeablePillboxPlanCard } from "./SwipeablePillboxPlanCard";
import { usePillboxHomeController } from "./usePillboxHomeController";

const noop = () => {};

export function PillboxHomeScreen({
  accessToken,
  currentAccountId,
  onOpenCreatePlan = noop,
  onOpenAnalytics = noop,
  onOpenPlan = noop,
  onMarkIntake = noop,
  familyMembers = [],
  onTabBarModeChange,
}: {
  accessToken: string | null;
  currentAccountId: string;
  onOpenCreatePlan?: () => void;
  onOpenAnalytics?: () => void;
  onOpenPlan?: (planId: string) => void;
  onMarkIntake?: (intakeId: string) => void;
  familyMembers?: MobileFamilyMember[];
  onTabBarModeChange?: (mode: "foreground" | "background" | "hidden") => void;
}) {
  const { locale } = useMobileI18n();
  const pillboxLocale = locale === "ru" ? "ru" : "en";
  const surfaceTheme = useMobileSurfaceTheme();
  const content = useMemo(() => buildPillboxHomeScreenContent(locale), [locale]);
  const { width } = useWindowDimensions();
  const [activeIntakePage, setActiveIntakePage] = useState(0);
  const carouselPageWidth = width - 44;
  const {
    displayedPlans,
    todayIntakes,
    summaryStats,
    isPlanFlowVisible,
    setIsPlanFlowVisible,
    selectedPlan,
    setSelectedPlan,
    openSwipePlanId,
    setOpenSwipePlanId,
    deletingPlanId,
    updatingPlanId,
    isLoadingPlans,
    plansError,
    handleDeletePlan,
    handleOpenPlan,
    handleTogglePlanPause,
    handleSavePlanRecipients,
    handleMarkIntake,
    handlePlanSaved,
    reloadPlans,
    setIsLoadingPlans,
  } = usePillboxHomeController({
    accessToken,
    currentAccountId,
    familyMembers,
    locale: pillboxLocale,
    onMarkIntake,
    onTabBarModeChange,
  });

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
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextBlock}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>
            <Pressable
              onPress={onOpenAnalytics}
              style={({ pressed }) => [
                styles.headerGhostAction,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Image
                source={pillboxTimeIcons.modeCourse}
                style={styles.headerGhostActionIcon}
                resizeMode="contain"
              />
              <Text style={styles.headerGhostActionText}>{content.analyticsLabel}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable
            onPress={() => {
              onOpenCreatePlan();
              setIsPlanFlowVisible(true);
            }}
            style={({ pressed }) => [
              styles.createPlanCta,
              pressed ? styles.createPlanCtaPressed : null,
            ]}
          >
            <View style={styles.createPlanIconCircle}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.createPlanLabel}>{content.createPlanLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            {summaryStats.map((item, index) => (
              <View key={item.id} style={styles.statColumn}>
                <View style={styles.statInner}>
                  <Text style={styles.statNumber}>{item.number}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
                {index < summaryStats.length - 1 ? <View style={styles.statDivider} /> : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {locale === "ru" ? "Ближайший приём" : "Next intake"}
          </Text>
        </View>

        {todayIntakes.length > 0 ? (
          <View style={styles.carouselWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              onScroll={handleCarouselScroll}
              scrollEventThrottle={16}
            >
              {todayIntakes.map((item) => (
                <View
                  key={item.id}
                  style={[styles.carouselPage, { width: carouselPageWidth }]}
                >
                  <View style={styles.intakeCard}>
                    <View style={styles.intakeCardTopRow}>
                      <View style={styles.intakeLabelPill}>
                        <Text style={styles.intakeLabel}>{content.nextIntakeLabel}</Text>
                      </View>
                      <View style={styles.countdownChip}>
                        <Text style={styles.countdownChipText}>{item.countdown}</Text>
                      </View>
                    </View>

                    <View style={styles.intakeHeroRow}>
                      <View style={styles.intakeTimeBlock}>
                        <Text style={styles.intakeTime}>{item.time}</Text>
                        <Text style={styles.intakeDate}>{item.relativeDate}</Text>
                      </View>

                      <View style={styles.intakeBody}>
                        <Text style={styles.intakePlanTitle}>{item.planTitle}</Text>
                        <Text style={styles.intakeMedicine}>{item.medicineSummary}</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() =>
                        handleMarkIntake(item.id, item.medicationId, item.scheduledFor ?? null)
                      }
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

            {todayIntakes.length > 1 ? (
              <View style={styles.dotsRow}>
                {todayIntakes.map((item, index) => (
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
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{content.activePlansTitle}</Text>
          <View style={styles.sectionCounterInline}>
            <Text style={styles.sectionCounterInlineText}>{displayedPlans.length}</Text>
          </View>
        </View>

        {isLoadingPlans && displayedPlans.length === 0 ? (
          <View style={[styles.emptyCard, { marginTop: 22 }]}>
            <Text style={styles.emptyTitle}>
              {locale === "ru" ? "Загружаем планы…" : "Loading plans..."}
            </Text>
            <Text style={styles.emptyDescription}>
              {locale === "ru"
                ? "Подтягиваем ближайшие приёмы и активные планы."
                : "Loading next intakes and active plans."}
            </Text>
          </View>
        ) : plansError && displayedPlans.length === 0 ? (
          <View style={[styles.emptyCard, { marginTop: 22 }]}>
            <Text style={styles.emptyTitle}>
              {locale === "ru" ? "Не загрузилось" : "Could not load"}
            </Text>
            <Text style={styles.emptyDescription}>{plansError}</Text>
            <Pressable
              onPress={() => {
                setIsLoadingPlans(true);
                void reloadPlans().finally(() => setIsLoadingPlans(false));
              }}
              style={({ pressed }) => [
                styles.emptyRetryButton,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.emptyRetryButtonText}>
                {locale === "ru" ? "Повторить" : "Retry"}
              </Text>
            </Pressable>
          </View>
        ) : displayedPlans.length > 0 ? (
          <View style={styles.plansList}>
            {displayedPlans.map((plan) => (
              <SwipeablePillboxPlanCard
                key={plan.id}
                item={plan}
                isOpen={openSwipePlanId === plan.id}
                deleting={deletingPlanId === plan.id}
                onOpenSwipe={() => setOpenSwipePlanId(plan.id)}
                onCloseSwipe={() =>
                  setOpenSwipePlanId((current) => (current === plan.id ? null : current))
                }
                onOpenPlan={() => {
                  onOpenPlan(plan.id);
                  handleOpenPlan(plan.id);
                }}
                onDelete={() => handleDeletePlan(plan.id)}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCard, { marginTop: 22 }]}>
            <Text style={styles.emptyTitle}>{content.emptyPlansTitle}</Text>
            <Text style={styles.emptyDescription}>
              {content.emptyPlansDescription}
            </Text>
            <Pressable
              onPress={() => {
                onOpenCreatePlan();
                setIsPlanFlowVisible(true);
              }}
              style={({ pressed }) => [
                styles.createPlanCta,
                pressed ? styles.createPlanCtaPressed : null,
              ]}
            >
              <View style={styles.createPlanIconCircle}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.createPlanLabel}>{content.createPlanLabel}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <PillboxPlanOnboardingFlow
        visible={isPlanFlowVisible}
        accessToken={accessToken}
        currentAccountId={currentAccountId}
        familyMembers={familyMembers}
        onClose={() => setIsPlanFlowVisible(false)}
        onPlanSaved={() => handlePlanSaved()}
      />

      <PillboxPlanDetailsScreen
        visible={selectedPlan !== null}
        plan={selectedPlan}
        isUpdating={selectedPlan !== null && updatingPlanId === selectedPlan.id}
        currentAccountId={currentAccountId}
        familyMembers={familyMembers}
        onClose={() => setSelectedPlan(null)}
        onTogglePause={handleTogglePlanPause}
        onSaveRecipients={handleSavePlanRecipients}
      />
    </View>
  );
}

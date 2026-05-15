import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import {
  buildParticipantOptions,
  createEmptyMedicineDraft,
  createInitialPlanDraft,
  formatMedicineSummary,
  resolvePlanParticipantTitle,
  type PillboxDraftMedicine,
} from "../model/pillboxPlanOnboarding";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

type FlowStep = "participant" | "list" | "medicine" | "review";

export function PillboxPlanOnboardingFlow({
  visible,
  familyMembers,
  onClose,
  onPlanSaved,
}: {
  visible: boolean;
  familyMembers: MobileFamilyMember[];
  onClose: () => void;
  onPlanSaved: () => void;
}) {
  const participants = useMemo(
    () => buildParticipantOptions(familyMembers),
    [familyMembers],
  );
  const [step, setStep] = useState<FlowStep>("participant");
  const [draft, setDraft] = useState(() => createInitialPlanDraft());
  const [medicineDraft, setMedicineDraft] = useState<PillboxDraftMedicine | null>(null);
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStep("participant");
      setDraft(createInitialPlanDraft());
      setMedicineDraft(null);
      setShowDiscardAlert(false);
    }
  }, [visible]);

  const currentStepIndex =
    step === "participant" ? 1 : step === "list" ? 2 : step === "medicine" ? 3 : 4;
  const participantTitle = resolvePlanParticipantTitle(draft.participantId, participants);
  const canGoNextFromParticipant = Boolean(draft.participantId);
  const canGoNextFromList = draft.medicines.length > 0;
  const canSaveMedicine = Boolean(
    medicineDraft?.name.trim() && medicineDraft?.dose.trim(),
  );

  const handleRequestClose = () => {
    if (step === "participant") {
      setShowDiscardAlert(true);
      return;
    }
    if (step === "list") {
      setStep("participant");
      return;
    }
    if (step === "medicine") {
      setStep("list");
      return;
    }
    setStep("list");
  };

  const handleSaveMedicine = () => {
    if (!medicineDraft || !canSaveMedicine) {
      return;
    }
    setDraft((current) => ({
      ...current,
      medicines: [...current.medicines, medicineDraft],
    }));
    setMedicineDraft(null);
    setStep("list");
  };

  const handleCompletePlan = () => {
    onPlanSaved();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleRequestClose}
    >
      <View style={styles.modalRoot}>
        <ImageBackground
          source={redesignBackgrounds.childrenModule}
          resizeMode="cover"
          style={styles.background}
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.overlay} />
        </ImageBackground>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TopNav
            step={step}
            onBack={handleRequestClose}
            onClose={() => setShowDiscardAlert(true)}
          />

          {step !== "medicine" ? <Stepper activeStep={currentStepIndex} /> : null}

          {step === "participant" ? (
            <>
              <Hero
                title="Для кого этот план?"
                subtitle="Выберите участника, для которого мы составим план приёма."
                icon="account-group-outline"
              />
              <View style={styles.sectionWrap}>
                <View style={styles.participantListCard}>
                  {participants.map((item, index) => {
                    const selected = draft.participantId === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() =>
                          setDraft((current) => ({ ...current, participantId: item.id }))
                        }
                        style={({ pressed }) => [
                          styles.participantRow,
                          index === participants.length - 1 ? styles.participantRowLast : null,
                          selected ? styles.participantRowSelected : null,
                          pressed ? styles.topNavButtonPressed : null,
                        ]}
                      >
                        <View style={styles.participantAvatar}>
                          <Text style={styles.participantAvatarText}>{item.avatarText}</Text>
                        </View>
                        <View style={styles.participantCopy}>
                          <Text style={styles.participantTitle}>{item.title}</Text>
                          {item.subtitle ? (
                            <Text style={styles.participantSubtitle}>{item.subtitle}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.chevronText}>›</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

          {step === "list" ? (
            <>
              <Hero
                title="Что будем принимать?"
                subtitle="Добавьте все лекарства и витамины, которые нужно принимать."
                icon="pill"
              />
              <View style={styles.sectionWrap}>
                <Pressable
                  onPress={() => {
                    setMedicineDraft(createEmptyMedicineDraft());
                    setStep("medicine");
                  }}
                  style={({ pressed }) => [
                    styles.addMedicineCard,
                    pressed ? styles.topNavButtonPressed : null,
                  ]}
                >
                  <View style={styles.addMedicinePlusWrap}>
                    <Text style={styles.addMedicinePlusText}>+</Text>
                  </View>
                  <Text style={styles.addMedicineLabel}>Добавить лекарство</Text>
                </Pressable>

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                  В плане ({draft.medicines.length})
                </Text>

                <View style={styles.medicineList}>
                  {draft.medicines.map((medicine, index) => (
                    <View key={medicine.id} style={styles.medicineRow}>
                      <View
                        style={[
                          styles.medicineIconWrap,
                          { backgroundColor: index % 2 === 0 ? "#FFF0E8" : "#FFF0D9" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={index % 2 === 0 ? "bottle-tonic-plus-outline" : "pill"}
                          size={22}
                          color={index % 2 === 0 ? "#D97B65" : "#C68A2E"}
                        />
                      </View>
                      <View style={styles.medicineCopy}>
                        <Text style={styles.medicineTitle}>{medicine.name}</Text>
                        <Text style={styles.medicineSubtitle}>
                          {formatMedicineSummary(medicine)}
                        </Text>
                      </View>
                      <Text style={styles.chevronText}>›</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : null}

          {step === "medicine" && medicineDraft ? (
            <>
              <Hero
                title="Добавить лекарство"
                subtitle="Настройте дозу, время, дни и связь с едой."
                icon="bottle-tonic-plus-outline"
              />
              <View style={styles.formCard}>
                <Field label="Название препарата">
                  <TextInput
                    value={medicineDraft.name}
                    onChangeText={(value) =>
                      setMedicineDraft((current) =>
                        current ? { ...current, name: value } : current,
                      )
                    }
                    placeholder="Например: Нурофен сироп"
                    placeholderTextColor="#A0A8B5"
                    style={styles.input}
                  />
                </Field>
                <Field label="Дозировка">
                  <TextInput
                    value={medicineDraft.dose}
                    onChangeText={(value) =>
                      setMedicineDraft((current) =>
                        current ? { ...current, dose: value } : current,
                      )
                    }
                    placeholder="Например: 2 мл"
                    placeholderTextColor="#A0A8B5"
                    style={styles.input}
                  />
                </Field>
                <Field label="Когда принимать">
                  <View style={styles.daypartsGrid}>
                    {[
                      { id: "morning", title: "Утро", icon: "weather-sunset-up" },
                      { id: "day", title: "День", icon: "white-balance-sunny" },
                      { id: "evening", title: "Вечер", icon: "weather-sunset-down" },
                      { id: "night", title: "Ночь", icon: "moon-waxing-crescent" },
                    ].map((item) => {
                      const active = medicineDraft.dayparts.includes(item.id as never);
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() =>
                            setMedicineDraft((current) => {
                              if (!current) return current;
                              const exists = current.dayparts.includes(item.id as never);
                              return {
                                ...current,
                                dayparts: exists
                                  ? current.dayparts.filter((part) => part !== item.id)
                                  : [...current.dayparts, item.id as never],
                              };
                            })
                          }
                          style={[
                            styles.daypartCard,
                            active ? styles.daypartCardActive : null,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={item.icon as never}
                            size={18}
                            color={active ? "#F56565" : "#8A94A6"}
                          />
                          <Text
                            style={[
                              styles.daypartTitle,
                              active ? styles.daypartTitleActive : null,
                            ]}
                          >
                            {item.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>
                <Field label="Точное время">
                  <View style={styles.timeChipsWrap}>
                    {medicineDraft.times.map((time) => (
                      <View key={time} style={styles.timeChip}>
                        <Text style={styles.timeChipText}>{time}</Text>
                      </View>
                    ))}
                    <View style={[styles.timeChip, styles.addTimeChip]}>
                      <Text style={[styles.timeChipText, styles.addTimeChipText]}>
                        + Добавить время
                      </Text>
                    </View>
                  </View>
                </Field>
                <Field label="Режим приёма">
                  <View style={styles.segmentedRow}>
                    {[
                      { id: "continuous", title: "Постоянно" },
                      { id: "course", title: "Курсом" },
                    ].map((item) => {
                      const active = medicineDraft.intakeMode === item.id;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() =>
                            setMedicineDraft((current) =>
                              current ? { ...current, intakeMode: item.id as never } : current,
                            )
                          }
                          style={[
                            styles.segmentedItem,
                            styles.segmentedItemWide,
                            active ? styles.segmentedItemActive : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.segmentedText,
                              active ? styles.segmentedTextActive : null,
                            ]}
                          >
                            {item.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>
                <Field label="Связь с едой">
                  <View style={styles.segmentedRow}>
                    {[
                      ["before_food", "До еды"],
                      ["with_food", "Во время"],
                      ["after_food", "После еды"],
                      ["not_matter", "Независимо"],
                    ].map(([id, label]) => {
                      const active = medicineDraft.mealRelation === id;
                      return (
                        <Pressable
                          key={id}
                          onPress={() =>
                            setMedicineDraft((current) =>
                              current ? { ...current, mealRelation: id as never } : current,
                            )
                          }
                          style={[
                            styles.segmentedItem,
                            active ? styles.segmentedItemActive : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.segmentedText,
                              active ? styles.segmentedTextActive : null,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>
                <Field label="Дни недели">
                  <View style={styles.weekdaysRow}>
                    {medicineDraft.weekdays.map((day) => (
                      <View key={day} style={styles.weekdayChip}>
                        <Text style={styles.weekdayText}>{day}</Text>
                      </View>
                    ))}
                  </View>
                </Field>
              </View>
            </>
          ) : null}

          {step === "review" ? (
            <>
              <Hero
                title="Проверьте план"
                subtitle="Убедитесь, что всё верно. Вы сможете изменить план в любое время."
                icon="clipboard-check-outline"
              />
              <View style={[styles.summaryCard, { marginTop: 24 }]}>
                <View style={styles.summaryRow}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantAvatarText}>
                      {participantTitle.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.participantCopy}>
                    <Text style={styles.summaryLabel}>Для кого</Text>
                    <Text style={styles.summaryTitle}>{participantTitle}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.summaryListCard}>
                <Text style={styles.sectionTitle}>
                  Лекарства в плане ({draft.medicines.length})
                </Text>
                {draft.medicines.map((medicine, index) => (
                  <View key={medicine.id} style={styles.medicineRow}>
                    <View
                      style={[
                        styles.medicineIconWrap,
                        { backgroundColor: index % 2 === 0 ? "#FFF0E8" : "#FFF0D9" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={index % 2 === 0 ? "bottle-tonic-plus-outline" : "pill"}
                        size={22}
                        color={index % 2 === 0 ? "#D97B65" : "#C68A2E"}
                      />
                    </View>
                    <View style={styles.medicineCopy}>
                      <Text style={styles.medicineTitle}>{medicine.name}</Text>
                      <Text style={styles.medicineSubtitle}>{medicine.dose}</Text>
                      <Text style={styles.medicineSubtitle}>
                        {medicine.times.length > 1
                          ? `${medicine.times.length} раза в день: ${medicine.times.join(", ")}`
                          : medicine.times[0]}
                      </Text>
                      <Text style={styles.medicineSubtitle}>
                        {medicine.mealRelation === "after_food"
                          ? "После еды"
                          : medicine.mealRelation === "before_food"
                            ? "До еды"
                            : medicine.mealRelation === "with_food"
                              ? "Во время еды"
                              : "Независимо от еды"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={[styles.summaryCard, { marginTop: 14 }]}>
                <Text style={styles.summaryLabel}>Уведомления будут приходить</Text>
                <Text style={[styles.summaryTitle, { marginTop: 4 }]}>{participantTitle}</Text>
              </View>
              <View style={styles.privacyNote}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={16}
                  color="#8A94A6"
                />
                <Text style={styles.privacyText}>
                  План сохраняется только у вас и не передаётся третьим лицам.
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={styles.bottomActionDock}>
          {step === "participant" ? (
            <PrimaryButton
              label={canGoNextFromParticipant ? "Далее" : "Выберите участника"}
              disabled={!canGoNextFromParticipant}
              onPress={() => setStep("list")}
            />
          ) : null}
          {step === "list" ? (
            <PrimaryButton
              label={
                canGoNextFromList ? "Далее" : "Добавьте хотя бы одно лекарство"
              }
              disabled={!canGoNextFromList}
              onPress={() => setStep("review")}
            />
          ) : null}
          {step === "medicine" ? (
            <PrimaryButton
              label="Сохранить лекарство"
              disabled={!canSaveMedicine}
              onPress={handleSaveMedicine}
            />
          ) : null}
          {step === "review" ? (
            <>
              <PrimaryButton label="Сохранить план" onPress={handleCompletePlan} />
              <Pressable
                onPress={() => setStep("list")}
                style={({ pressed }) => [
                  styles.secondaryTextButton,
                  pressed ? styles.topNavButtonPressed : null,
                ]}
              >
                <Text style={styles.secondaryTextButtonText}>Назад</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        {showDiscardAlert ? (
          <View style={styles.overlayScrim}>
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>Не сохранять план?</Text>
              <Text style={styles.alertText}>
                Введённые данные будут потеряны.
              </Text>
              <View style={styles.alertActions}>
                <Pressable
                  onPress={() => setShowDiscardAlert(false)}
                  style={({ pressed }) => [
                    styles.alertAction,
                    pressed ? styles.topNavButtonPressed : null,
                  ]}
                >
                  <Text style={styles.alertActionText}>Продолжить</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowDiscardAlert(false);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.alertAction,
                    styles.alertActionDanger,
                    pressed ? styles.topNavButtonPressed : null,
                  ]}
                >
                  <Text style={[styles.alertActionText, styles.alertActionTextDanger]}>
                    Не сохранять
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function TopNav({
  step,
  onBack,
  onClose,
}: {
  step: FlowStep;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.topNav}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.topNavButton, pressed ? styles.topNavButtonPressed : null]}>
        <Text style={styles.topNavButtonText}>←</Text>
      </Pressable>
      {step === "participant" ? (
        <Pressable onPress={onClose} style={({ pressed }) => [styles.topNavButton, pressed ? styles.topNavButtonPressed : null]}>
          <Text style={styles.topNavButtonText}>×</Text>
        </Pressable>
      ) : (
        <View style={styles.topNavSpacer} />
      )}
    </View>
  );
}

function Stepper({ activeStep }: { activeStep: number }) {
  return (
    <View style={styles.stepper}>
      {[1, 2, 3, 4].map((step, index) => {
        const completed = step < activeStep;
        const active = step === activeStep;
        return (
          <View key={step} style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={[
                styles.stepCircle,
                active ? styles.stepCircleActive : null,
                completed ? styles.stepCircleCompleted : null,
              ]}
            >
              <Text
                style={[
                  styles.stepCircleText,
                  active ? styles.stepCircleTextActive : null,
                  completed ? styles.stepCircleTextCompleted : null,
                ]}
              >
                {completed ? "✓" : step}
              </Text>
            </View>
            {index < 3 ? (
              <View
                style={[
                  styles.stepConnector,
                  step < activeStep ? styles.stepConnectorActive : null,
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function Hero({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <View style={styles.heroRow}>
      <View style={styles.headingBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.heroIconWrap}>
        <MaterialCommunityIcons name={icon} size={40} color="#F07B6F" />
      </View>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function PrimaryButton({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled ? styles.primaryButtonDisabled : null,
        pressed ? styles.topNavButtonPressed : null,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

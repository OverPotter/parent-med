import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { formatBackdatedTime } from "../../../shared/lib/backdatedDateTime";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import { resolveIllnessRecipientSelection } from "../../illness/model/illnessRecipients";
import {
  createMobilePillboxPlan,
  type MobilePillboxPlan,
} from "../api/mobilePillboxPlansApi";
import {
  buildNotificationRecipientSummary,
  buildPillboxCreatePlanPayload,
  buildPillboxRecipientSheetMembers,
  buildParticipantOptions,
  createEmptyMedicineDraft,
  createInitialPlanDraft,
  resolvePlanParticipantTitle,
  type PillboxDraftMedicine,
  type PillboxWeekdayId,
} from "../model/pillboxPlanOnboarding";

export type PillboxPlanFlowStep = "participant" | "list" | "medicine" | "review";

export function usePillboxPlanOnboardingController({
  visible,
  accessToken,
  currentAccountId,
  familyMembers,
  locale,
  onClose,
  onPlanSaved,
}: {
  visible: boolean;
  accessToken: string | null;
  currentAccountId: string;
  familyMembers: MobileFamilyMember[];
  locale: MobileLocale;
  onClose: () => void;
  onPlanSaved: (payload: { plan: MobilePillboxPlan; participantId: string }) => void;
}) {
  const participants = useMemo(
    () => buildParticipantOptions(familyMembers, { currentAccountId, locale }),
    [currentAccountId, familyMembers, locale],
  );
  const [step, setStep] = useState<PillboxPlanFlowStep>("participant");
  const [draft, setDraft] = useState(() => createInitialPlanDraft());
  const [medicineDraft, setMedicineDraft] = useState<PillboxDraftMedicine | null>(null);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);
  const [activePickerField, setActivePickerField] = useState<"time" | null>(null);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [isCourseSheetOpen, setIsCourseSheetOpen] = useState(false);
  const [isCustomCourseSheetOpen, setIsCustomCourseSheetOpen] = useState(false);
  const [isRecipientSheetOpen, setIsRecipientSheetOpen] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [customCourseDays, setCustomCourseDays] = useState("");
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(30);

  useEffect(() => {
    if (!visible) {
      setStep("participant");
      setDraft(createInitialPlanDraft());
      setMedicineDraft(null);
      setEditingMedicineId(null);
      setShowDiscardAlert(false);
      setActivePickerField(null);
      setEditingTimeIndex(null);
      setIsCourseSheetOpen(false);
      setIsCustomCourseSheetOpen(false);
      setIsRecipientSheetOpen(false);
      setIsSavingPlan(false);
      setCustomCourseDays("");
      setPickerHour(8);
      setPickerMinute(30);
    }
  }, [visible]);

  const currentStepIndex =
    step === "participant" ? 1 : step === "review" ? 3 : 2;
  const participantTitle = resolvePlanParticipantTitle(draft.participantId, participants, locale);
  const recipientSheetMembers = useMemo(
    () =>
      buildPillboxRecipientSheetMembers(familyMembers, participants, {
        currentAccountId,
        locale,
      }),
    [currentAccountId, familyMembers, locale, participants],
  );
  const eligibleRecipientIds = useMemo(
    () => recipientSheetMembers.map((member) => member.id),
    [recipientSheetMembers],
  );
  const resolvedRecipientIds = useMemo(
    () =>
      resolveIllnessRecipientSelection(
        draft.notificationRecipientIds,
        eligibleRecipientIds,
        currentAccountId,
      ),
    [currentAccountId, draft.notificationRecipientIds, eligibleRecipientIds],
  );
  const notificationRecipientTitle = useMemo(
    () =>
      buildNotificationRecipientSummary({
        recipientIds: resolvedRecipientIds,
        members: recipientSheetMembers,
      }),
    [recipientSheetMembers, resolvedRecipientIds],
  );
  const currentCourseDurationDays = medicineDraft?.courseDurationDays ?? null;
  const canGoNextFromParticipant = Boolean(draft.participantId);
  const canGoNextFromList = draft.medicines.length > 0;
  const canSaveMedicine = Boolean(
    medicineDraft?.name.trim() &&
      medicineDraft?.dose.trim() &&
      medicineDraft.times.length > 0 &&
      (medicineDraft.intakeMode !== "course" || medicineDraft.courseDurationDays),
  );

  const handleSelectParticipant = (participantId: string) => {
    setDraft((current) => ({
      ...current,
      participantId,
      notificationRecipientIds: resolveIllnessRecipientSelection(
        [participantId],
        eligibleRecipientIds,
        currentAccountId,
      ),
    }));
  };

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
      setEditingMedicineId(null);
      setStep("list");
      return;
    }
    setStep("list");
  };

  const handleOpenMedicineEditor = (medicine?: PillboxDraftMedicine) => {
    if (medicine) {
      setEditingMedicineId(medicine.id);
      setMedicineDraft({
        ...medicine,
        times: [...medicine.times],
        weekdays: [...medicine.weekdays],
      });
    } else {
      setEditingMedicineId(null);
      setMedicineDraft(createEmptyMedicineDraft());
    }
    setStep("medicine");
  };

  const handleSaveMedicine = () => {
    if (!medicineDraft || !canSaveMedicine) {
      return;
    }
    setDraft((current) => ({
      ...current,
      medicines: editingMedicineId
        ? current.medicines.map((item) =>
            item.id === editingMedicineId ? medicineDraft : item,
          )
        : [...current.medicines, medicineDraft],
    }));
    setMedicineDraft(null);
    setEditingMedicineId(null);
    setStep("list");
  };

  const handleRemoveMedicine = (medicineId: string) => {
    setDraft((current) => ({
      ...current,
      medicines: current.medicines.filter((item) => item.id !== medicineId),
    }));
  };

  const handleCompletePlan = () => {
    if (!draft.participantId || draft.medicines.length === 0 || isSavingPlan) {
      return;
    }

    const planPayload = buildPillboxCreatePlanPayload({
      draft,
      participantTitle,
      recipientIds: resolvedRecipientIds,
      locale,
    });

    setIsSavingPlan(true);
    void createMobilePillboxPlan({
      accessToken,
      plan: planPayload,
    })
      .then((plan) => {
        onPlanSaved({ plan, participantId: draft.participantId as string });
        onClose();
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : locale === "de"
              ? "Der Plan konnte nicht gespeichert werden."
              : locale === "pl"
                ? "Nie udało się zapisać planu."
                : locale === "ru"
                  ? "Не удалось сохранить план."
                  : "Could not save the plan.";
        Alert.alert(
          locale === "de"
            ? "Speichern nicht möglich"
            : locale === "pl"
              ? "Nie można zapisać"
              : locale === "ru"
                ? "Не удалось сохранить"
                : "Could not save",
          message,
        );
      })
      .finally(() => {
        setIsSavingPlan(false);
      });
  };

  const handleOpenTimePicker = (time?: string, index?: number) => {
    if (time) {
      const [rawHour = "8", rawMinute = "30"] = time.split(":");
      setPickerHour(Number.parseInt(rawHour, 10) || 8);
      setPickerMinute(Number.parseInt(rawMinute, 10) || 30);
    } else {
      setPickerHour(8);
      setPickerMinute(30);
    }
    setEditingTimeIndex(index ?? null);
    setActivePickerField("time");
  };

  const handleConfirmTime = () => {
    const now = new Date();
    const nextTime = formatBackdatedTime(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        pickerHour,
        pickerMinute,
      ),
    );
    setMedicineDraft((current) => {
      if (!current) {
        return current;
      }
      const nextTimes =
        editingTimeIndex === null
          ? [...current.times, nextTime]
          : current.times.map((time, index) =>
              index === editingTimeIndex ? nextTime : time,
            );
      return {
        ...current,
        times: sortTimes(nextTimes),
      };
    });
    setEditingTimeIndex(null);
    setActivePickerField(null);
  };

  const handleRemoveTime = (timeToRemove: string) => {
    setMedicineDraft((current) =>
      current
        ? {
            ...current,
            times: current.times.filter((time) => time !== timeToRemove),
          }
        : current,
    );
  };

  const handleSelectCourseOption = (value: number | null) => {
    if (value === null) {
      return;
    }
    setMedicineDraft((current) =>
      current
        ? {
            ...current,
            intakeMode: "course",
            courseDurationDays: value,
          }
        : current,
    );
    setIsCourseSheetOpen(false);
  };

  const handleSaveCustomCourseDays = () => {
    const normalized = customCourseDays.trim().replace(/[^\d]/g, "").replace(/^0+/, "");
    if (!normalized) {
      return false;
    }
    setMedicineDraft((current) =>
      current
        ? {
            ...current,
            courseDurationDays: Number(normalized),
          }
        : current,
    );
    return true;
  };

  const handleToggleWeekday = (day: PillboxWeekdayId) => {
    setMedicineDraft((current) => {
      if (!current) {
        return current;
      }
      const isActive = current.weekdays.includes(day);
      return {
        ...current,
        weekdays: isActive
          ? current.weekdays.filter((item) => item !== day)
          : [...current.weekdays, day],
      };
    });
  };

  const handleSelectContinuousMode = () => {
    setMedicineDraft((current) =>
      current
        ? {
            ...current,
            intakeMode: "continuous",
            courseDurationDays: null,
          }
        : current,
    );
  };

  const handleSelectCourseMode = () => {
    setMedicineDraft((current) =>
      current ? { ...current, intakeMode: "course" } : current,
    );
    setIsCourseSheetOpen(true);
  };

  const handleSelectMealRelation = (
    mealRelation: PillboxDraftMedicine["mealRelation"],
  ) => {
    setMedicineDraft((current) =>
      current ? { ...current, mealRelation } : current,
    );
  };

  const handleOpenRecipients = () => {
    setIsRecipientSheetOpen(true);
  };

  const handleToggleRecipient = (memberId: string) => {
    setDraft((current) => ({
      ...current,
      notificationRecipientIds: resolveIllnessRecipientSelection(
        current.notificationRecipientIds.includes(memberId)
          ? current.notificationRecipientIds.filter((id) => id !== memberId)
          : [...current.notificationRecipientIds, memberId],
        eligibleRecipientIds,
        currentAccountId,
      ),
    }));
  };

  return {
    step,
    setStep,
    draft,
    medicineDraft,
    setMedicineDraft,
    showDiscardAlert,
    setShowDiscardAlert,
    activePickerField,
    setActivePickerField,
    editingTimeIndex,
    setEditingTimeIndex,
    isCourseSheetOpen,
    setIsCourseSheetOpen,
    isCustomCourseSheetOpen,
    setIsCustomCourseSheetOpen,
    isRecipientSheetOpen,
    setIsRecipientSheetOpen,
    isSavingPlan,
    customCourseDays,
    setCustomCourseDays,
    pickerHour,
    setPickerHour,
    pickerMinute,
    setPickerMinute,
    participants,
    currentStepIndex,
    participantTitle,
    recipientSheetMembers,
    eligibleRecipientIds,
    resolvedRecipientIds,
    notificationRecipientTitle,
    currentCourseDurationDays,
    canGoNextFromParticipant,
    canGoNextFromList,
    canSaveMedicine,
    handleSelectParticipant,
    handleRequestClose,
    handleOpenMedicineEditor,
    handleSaveMedicine,
    handleRemoveMedicine,
    handleCompletePlan,
    handleOpenTimePicker,
    handleConfirmTime,
    handleRemoveTime,
    handleSelectCourseOption,
    handleSaveCustomCourseDays,
    handleToggleWeekday,
    handleSelectContinuousMode,
    handleSelectCourseMode,
    handleSelectMealRelation,
    handleOpenRecipients,
    handleToggleRecipient,
  };
}

function sortTimes(times: string[]) {
  return Array.from(new Set(times)).sort((left, right) => {
    const [leftHour = "0", leftMinute = "0"] = left.split(":");
    const [rightHour = "0", rightMinute = "0"] = right.split(":");
    return (
      Number.parseInt(leftHour, 10) * 60 +
      Number.parseInt(leftMinute, 10) -
      (Number.parseInt(rightHour, 10) * 60 + Number.parseInt(rightMinute, 10))
    );
  });
}

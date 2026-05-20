import { useEffect, useMemo, useState } from "react";
import { useBackdatedDateTimePicker } from "../../../shared/hooks/useBackdatedDateTimePicker";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";
import type { MobileIllnessObservation } from "../model/illnessObservation";
import {
  getEligibleIllnessRecipients,
  resolveIllnessRecipientSelection,
} from "../model/illnessRecipients";
import {
  buildMobileReminderPlanAdministrationStats,
  shouldRequestMobileReminderDoseTimeConfirmation,
  sortMobileReminderPlansByPriority,
} from "../model/illnessReminderPlanStats";
import type { ReminderScreenCopy } from "./illnessReminderScreenCopy";
import { formatReminderElapsedSince } from "./illnessReminderScreenCopy";

export type EditableReminderField = "dose" | "interval" | "limit" | "notes" | null;

export function useIllnessReminderListController({
  childId,
  observation,
  familyMembers,
  currentAccountId,
  locale,
  copy,
  onTakeDose,
  onSaveRecipients,
  onUpdateReminder,
}: {
  childId: string;
  observation: MobileIllnessObservation | null;
  familyMembers: MobileFamilyMember[];
  currentAccountId: string;
  locale: MobileLocale;
  copy: ReminderScreenCopy;
  onTakeDose: (payload: {
    plan: MobileEpisodeMedicationPlan;
    administeredAt?: string | null;
  }) => void | Promise<void>;
  onSaveRecipients: (memberAccountIds: string[]) => void | Promise<void>;
  onUpdateReminder: (payload: {
    planId: string;
    customMedicineName: string;
    doseAmount: string;
    minIntervalMinutes: number;
    maxDosesPerDay?: number | null;
    notes?: string | null;
  }) => void | Promise<void>;
}) {
  const [recipientSheetVisible, setRecipientSheetVisible] = useState(false);
  const [draftRecipientIds, setDraftRecipientIds] = useState<string[]>([]);
  const [isSavingRecipients, setIsSavingRecipients] = useState(false);
  const [expandedPlanIds, setExpandedPlanIds] = useState<string[]>([]);
  const [isSubmittingDose, setIsSubmittingDose] = useState(false);
  const [pendingDeletePlanId, setPendingDeletePlanId] = useState<string | null>(null);
  const [pendingDosePlan, setPendingDosePlan] =
    useState<MobileEpisodeMedicationPlan | null>(null);
  const [pendingDoseHint, setPendingDoseHint] = useState("");
  const [pendingDoseError, setPendingDoseError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<MobileEpisodeMedicationPlan | null>(null);
  const [editingField, setEditingField] = useState<EditableReminderField>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [activeNumberSheet, setActiveNumberSheet] = useState<"interval" | "limit" | null>(null);
  const [customValueVisible, setCustomValueVisible] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const {
    selectedDate: pendingDoseDate,
    activePickerField: activeDosePickerField,
    pickerDay: pendingDosePickerDay,
    pickerMonthIndex: pendingDosePickerMonthIndex,
    pickerYear: pendingDosePickerYear,
    pickerHour: pendingDosePickerHour,
    pickerMinute: pendingDosePickerMinute,
    setPickerDay: setPendingDosePickerDay,
    setPickerMonthIndex: setPendingDosePickerMonthIndex,
    setPickerYear: setPendingDosePickerYear,
    setPickerHour: setPendingDosePickerHour,
    setPickerMinute: setPendingDosePickerMinute,
    reset: resetPendingDosePicker,
    openPicker: openPendingDosePicker,
    closePicker: closePendingDosePicker,
    confirmPicker: confirmPendingDosePicker,
  } = useBackdatedDateTimePicker(new Date());

  const eligibleFamilyMembers = useMemo(
    () => getEligibleIllnessRecipients(familyMembers, childId),
    [childId, familyMembers],
  );
  const eligibleRecipientIds = useMemo(
    () => eligibleFamilyMembers.map((member) => member.id),
    [eligibleFamilyMembers],
  );
  const resolvedRecipientIds = useMemo(
    () =>
      resolveIllnessRecipientSelection(
        observation?.notificationRecipientAccountIds,
        eligibleRecipientIds,
        currentAccountId,
      ),
    [
      currentAccountId,
      eligibleRecipientIds,
      observation?.notificationRecipientAccountIds,
    ],
  );

  useEffect(() => {
    if (!recipientSheetVisible) {
      setDraftRecipientIds(resolvedRecipientIds);
    }
  }, [recipientSheetVisible, resolvedRecipientIds]);

  const recipientSummary = useMemo(() => {
    const labels = eligibleFamilyMembers
      .filter((member) => resolvedRecipientIds.includes(member.id))
      .map((member) => member.displayName);

    if (labels.length === 0) {
      return copy.recipientsEmpty;
    }

    return `${copy.recipientsSummaryPrefix} ${labels.join(", ")}`;
  }, [
    copy.recipientsEmpty,
    copy.recipientsSummaryPrefix,
    eligibleFamilyMembers,
    resolvedRecipientIds,
  ]);

  const now = new Date();
  const plans = useMemo(
    () =>
      sortMobileReminderPlansByPriority(
        observation?.medicationPlans ?? [],
        observation?.entries ?? [],
        now,
      ),
    [now, observation?.entries, observation?.medicationPlans],
  );

  const handleToggleRecipient = (memberId: string) => {
    const candidateIds = draftRecipientIds.includes(memberId)
      ? draftRecipientIds.filter((id) => id !== memberId)
      : [...draftRecipientIds, memberId];

    setDraftRecipientIds(
      resolveIllnessRecipientSelection(
        candidateIds,
        eligibleRecipientIds,
        currentAccountId,
      ),
    );
  };

  const handleSaveRecipients = async () => {
    if (isSavingRecipients) {
      return;
    }
    setIsSavingRecipients(true);
    try {
      await onSaveRecipients(
        resolveIllnessRecipientSelection(
          draftRecipientIds,
          eligibleRecipientIds,
          currentAccountId,
        ),
      );
      setRecipientSheetVisible(false);
    } finally {
      setIsSavingRecipients(false);
    }
  };

  const handleTakeDose = async (
    plan: MobileEpisodeMedicationPlan,
    administeredAt?: string | null,
  ) => {
    if (isSubmittingDose) {
      return;
    }
    setIsSubmittingDose(true);
    try {
      await onTakeDose({ plan, administeredAt });
      setPendingDosePlan(null);
      setPendingDoseHint("");
      setPendingDoseError(null);
    } finally {
      setIsSubmittingDose(false);
    }
  };

  const handlePressTakeDose = (plan: MobileEpisodeMedicationPlan) => {
    if (!observation) {
      return;
    }

    const currentNow = new Date();
    const stats = buildMobileReminderPlanAdministrationStats(
      plan,
      observation.entries,
      currentNow,
    );

    if (stats.isBlocked) {
      return;
    }

    if (shouldRequestMobileReminderDoseTimeConfirmation(stats.nextAllowedAt, currentNow)) {
      setPendingDosePlan(plan);
      setPendingDoseError(null);
      setPendingDoseHint(
        `${copy.confirmDosePastPrefix} ${formatReminderElapsedSince(
          stats.nextAllowedAt ?? currentNow,
          currentNow,
          locale,
        )}. ${copy.confirmDosePastSuffix}`,
      );
      resetPendingDosePicker(currentNow);
      return;
    }

    void handleTakeDose(plan, null);
  };

  const handleSubmitPendingDose = () => {
    if (!pendingDosePlan) {
      return;
    }

    if (pendingDoseDate.getTime() > Date.now()) {
      setPendingDoseError(copy.futureDoseError);
      return;
    }

    void handleTakeDose(pendingDosePlan, pendingDoseDate.toISOString());
  };

  const handleSavePlanPatch = async (
    plan: MobileEpisodeMedicationPlan,
    patch: {
      doseAmount?: string;
      minIntervalMinutes?: number;
      maxDosesPerDay?: number | null;
      notes?: string | null;
    },
  ) => {
    if (isSavingEdit) {
      return;
    }
    setIsSavingEdit(true);
    try {
      await onUpdateReminder({
        planId: plan.id,
        customMedicineName: plan.customMedicineName?.trim() || "",
        doseAmount: patch.doseAmount ?? plan.doseAmount,
        minIntervalMinutes: patch.minIntervalMinutes ?? plan.minIntervalMinutes,
        maxDosesPerDay:
          patch.maxDosesPerDay === undefined ? plan.maxDosesPerDay : patch.maxDosesPerDay,
        notes: patch.notes === undefined ? plan.notes : patch.notes,
      });
      setEditingPlan(null);
      setEditingField(null);
      setFieldValue("");
      setActiveNumberSheet(null);
      setCustomValueVisible(false);
      setCustomValue("");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return {
    recipientSheetVisible,
    setRecipientSheetVisible,
    draftRecipientIds,
    isSavingRecipients,
    expandedPlanIds,
    setExpandedPlanIds,
    isSubmittingDose,
    pendingDeletePlanId,
    setPendingDeletePlanId,
    pendingDosePlan,
    setPendingDosePlan,
    pendingDoseHint,
    setPendingDoseHint,
    pendingDoseError,
    setPendingDoseError,
    editingPlan,
    setEditingPlan,
    editingField,
    setEditingField,
    fieldValue,
    setFieldValue,
    activeNumberSheet,
    setActiveNumberSheet,
    customValueVisible,
    setCustomValueVisible,
    customValue,
    setCustomValue,
    isSavingEdit,
    pendingDoseDate,
    activeDosePickerField,
    pendingDosePickerDay,
    pendingDosePickerMonthIndex,
    pendingDosePickerYear,
    pendingDosePickerHour,
    pendingDosePickerMinute,
    setPendingDosePickerDay,
    setPendingDosePickerMonthIndex,
    setPendingDosePickerYear,
    setPendingDosePickerHour,
    setPendingDosePickerMinute,
    openPendingDosePicker,
    closePendingDosePicker,
    confirmPendingDosePicker,
    eligibleFamilyMembers,
    resolvedRecipientIds,
    recipientSummary,
    plans,
    handleToggleRecipient,
    handleSaveRecipients,
    handlePressTakeDose,
    handleSubmitPendingDose,
    handleSavePlanPatch,
  };
}

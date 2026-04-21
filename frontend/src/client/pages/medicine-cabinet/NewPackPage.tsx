import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateHouseholdMedicine } from "@shared/api/householdMedicines";
import { DateField } from "@shared/components/DateField";
import type { AppLanguage } from "@shared/i18n";
import { useAppStore } from "@shared/store/useAppStore";
import type { HouseholdMedicine } from "@shared/types/api";
import { tCabinet } from "./copy";
import { MedicineCabinetHeader } from "./MedicineCabinetHeader";
import { cabinetCompactInputClass, cabinetCompactTextareaClass, cabinetPanelClass } from "./styles";
import { hasUnknownOpenedShelfLife, isExpiredDate, toOpenedShelfDaysOrNull } from "./utils";

export function NewPackPage({
  language,
  medicine,
  onClose,
}: {
  language: AppLanguage;
  medicine: HouseholdMedicine;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const [expiryDate, setExpiryDate] = useState(medicine.expiryDate);
  const [openedAt, setOpenedAt] = useState(medicine.openedAt?.slice(0, 10) ?? "");
  const [openedShelfDays, setOpenedShelfDays] = useState(
    medicine.openedShelfDays ? String(medicine.openedShelfDays) : ""
  );
  const [comment, setComment] = useState(medicine.comment ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const isExpired = isExpiredDate(expiryDate);
  const hasUnknownAfterOpening = hasUnknownOpenedShelfLife(openedAt, openedShelfDays);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateHouseholdMedicine(medicine.id, {
        expiry_date: expiryDate,
        opened_at: openedAt || null,
        opened_shelf_days: toOpenedShelfDaysOrNull(openedShelfDays),
        comment: comment.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-medicines", accountId] });
      setFormError(null);
      onClose();
    },
  });

  const handleSave = () => {
    const parsedOpenedShelfDays = toOpenedShelfDaysOrNull(openedShelfDays);
    if (openedShelfDays.trim() && parsedOpenedShelfDays === null) {
      setFormError(tCabinet(language, "openedShelfDaysError"));
      return;
    }
    setFormError(null);
    updateMutation.mutate();
  };

  return (
    <div
      className="child-profile-shell space-y-3 text-foreground"
      style={{
        paddingBottom: "max(0.75rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom)))",
        scrollPaddingBottom:
          "calc(7.5rem + var(--app-keyboard-height, 0px) + var(--app-safe-bottom-runtime, env(safe-area-inset-bottom)))",
      }}
    >
      <MedicineCabinetHeader
        backLabel={`← ${tCabinet(language, "back")}`}
        onBack={onClose}
        title={tCabinet(language, "newPack")}
        hint={medicine.medicineName}
      />
      <div
        className={`${cabinetPanelClass} mx-auto grid w-full max-w-2xl gap-3 px-3.5 py-3 pt-4 sm:grid-cols-2`}
      >
        <p className="text-xs leading-5 text-muted sm:col-span-2">
          {tCabinet(language, "newPackHint")}
        </p>
        <label className="block space-y-1.5">
          <span className="soft-field-label">{tCabinet(language, "expiryDate")}</span>
          <DateField
            value={expiryDate}
            onChange={setExpiryDate}
            className="cabinet-compact-date-field"
            language={language}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="soft-field-label">{tCabinet(language, "openedAt")}</span>
          <DateField
            value={openedAt}
            onChange={setOpenedAt}
            className="cabinet-compact-date-field"
            language={language}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="soft-field-label">{tCabinet(language, "openedShelfDays")}</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="3650"
            value={openedShelfDays}
            onChange={(event) => {
              setOpenedShelfDays(event.target.value);
              setFormError(null);
            }}
            className={cabinetCompactInputClass}
            placeholder={tCabinet(language, "openedShelfDaysUnknown")}
          />
        </label>
        {isExpired ? (
          <p className="soft-note-warning rounded-2xl px-4 py-3 text-sm sm:col-span-2">
            {tCabinet(language, "expiredCardWarning")}
          </p>
        ) : null}
        {hasUnknownAfterOpening ? (
          <p className="soft-note-info rounded-2xl px-4 py-3 text-sm sm:col-span-2">
            {tCabinet(language, "openedCardWarning")}
          </p>
        ) : null}
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="soft-field-label">{tCabinet(language, "comment")}</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className={cabinetCompactTextareaClass}
            placeholder={tCabinet(language, "commentPlaceholder")}
          />
        </label>
        {formError ? (
          <div className="sm:col-span-2">
            <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">{formError}</p>
          </div>
        ) : null}
      </div>
      <div className="mx-auto w-full max-w-2xl">
        <div className="app-form-action-bar pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="soft-pill-primary app-profile-action app-profile-action--selected inline-flex min-h-[2.65rem] w-full items-center justify-center px-3.5 text-[0.82rem] tracking-[-0.025em] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[2.75rem] sm:text-[0.84rem]"
          >
            {tCabinet(language, "save")}
          </button>
        </div>
      </div>
    </div>
  );
}

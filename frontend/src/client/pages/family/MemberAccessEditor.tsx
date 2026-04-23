import { useState } from "react";
import { ChoiceSheetField } from "@shared/components/ChoiceSheetField";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import type { AppLanguage } from "@shared/i18n";
import type { Child, FamilyAccessPolicy } from "@shared/types/api";
import { appBtnJournalSecondaryClass } from "../child-illness/shared";
import {
  cabinetAccessRoleLabel,
  childrenAccessRoleLabel,
  pillboxAccessRoleLabel,
  tFamily,
} from "./copy";

export function MemberAccessEditor({
  language,
  familyChildren,
  accessPolicy,
  isPending,
  onChange,
  onSave,
}: {
  language: AppLanguage;
  familyChildren: Child[];
  accessPolicy: FamilyAccessPolicy;
  isPending: boolean;
  onChange: (next: FamilyAccessPolicy) => void;
  onSave: () => void;
}) {
  const [isChildrenSheetOpen, setIsChildrenSheetOpen] = useState(false);
  const hasChildAccess = accessPolicy.allChildren || accessPolicy.childIds.length > 0;
  const effectiveChildrenAccess = hasChildAccess ? accessPolicy.childrenAccess : "none";
  const selectedChildNames = familyChildren
    .filter((child) => accessPolicy.childIds.includes(child.id))
    .map((child) => child.name)
    .join(", ");
  const hasAnyFamilyAccess =
    hasChildAccess ||
    accessPolicy.pillboxAccess !== "none" ||
    accessPolicy.cabinetAccess !== "none";
  const pillboxOptions =
    accessPolicy.childrenAccess === "edit"
      ? [
          { value: "none", label: tFamily(language, "hidden") },
          { value: "view", label: pillboxAccessRoleLabel("view", language) },
          { value: "act", label: pillboxAccessRoleLabel("act", language) },
          { value: "edit", label: pillboxAccessRoleLabel("edit", language) },
        ]
      : [
          { value: "none", label: tFamily(language, "hidden") },
          { value: "view", label: pillboxAccessRoleLabel("view", language) },
          { value: "act", label: pillboxAccessRoleLabel("act", language) },
        ];

  return (
    <div className="soft-panel overflow-hidden rounded-[26px] border border-border/60 shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
      <div className="space-y-5 px-4 py-4 sm:px-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-4">
            <AccessSelect
              language={language}
              label={tFamily(language, "childrenAccess")}
              dialogHint={
                language === "ru"
                  ? "Нет доступа — дети и журнал скрыты. Только смотреть — без записей. Может записывать уход — температуру, кормление, сон и факты по болезни. Полный доступ — может ещё и менять сам сценарий."
                  : "No access hides children and the journal. View only means no records. Can log care covers temperature, feeding, sleep, and illness facts. Full access can also manage the workflow."
              }
              value={effectiveChildrenAccess}
              options={[
                { value: "none", label: tFamily(language, "hidden") },
                { value: "view", label: childrenAccessRoleLabel("view", language) },
                { value: "act", label: childrenAccessRoleLabel("act", language) },
                { value: "edit", label: childrenAccessRoleLabel("edit", language) },
              ]}
              onChange={(value) => {
                if (value === "none") {
                  onChange({
                    ...accessPolicy,
                    allChildren: false,
                    childIds: [],
                    pillboxAccess:
                      accessPolicy.pillboxAccess === "edit" ? "act" : accessPolicy.pillboxAccess,
                  });
                  return;
                }

                onChange({
                  ...accessPolicy,
                  allChildren: hasChildAccess ? accessPolicy.allChildren : true,
                  childIds: hasChildAccess ? accessPolicy.childIds : [],
                  childrenAccess: value as "view" | "act" | "edit",
                  pillboxAccess:
                    value !== "edit" && accessPolicy.pillboxAccess === "edit"
                      ? "act"
                      : accessPolicy.pillboxAccess,
                });
              }}
            />
            {effectiveChildrenAccess !== "none" ? (
              <label className="grid gap-1.5 text-sm">
                <span className="soft-field-label">{tFamily(language, "childrenScope")}</span>
                <button
                  type="button"
                  onClick={() => setIsChildrenSheetOpen(true)}
                  className="soft-input flex min-h-[2.82rem] w-full items-center justify-between gap-3 px-4 text-left text-[0.92rem] tracking-[-0.02em] sm:min-h-[2.92rem]"
                >
                  <span className="min-w-0">
                    {accessPolicy.allChildren
                      ? tFamily(language, "childrenScopeAll")
                      : selectedChildNames || tFamily(language, "selectedChildrenEmpty")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 shrink-0 items-center rounded-full bg-surface px-3 text-[0.76rem] font-semibold text-muted"
                  >
                    {tFamily(language, "selectedChildrenAction")}
                  </span>
                </button>
              </label>
            ) : null}
          </div>
          <AccessSelect
            language={language}
            label={tFamily(language, "pillboxAccess")}
            dialogHint={
              language === "ru"
                ? accessPolicy.childrenAccess === "edit"
                  ? "Только смотреть — видит план. Может отмечать приём — подтверждает, что лекарство дали. Полный доступ — меняет план и участников."
                  : "Если к детям нет полного доступа, в приёмах можно оставить только просмотр или отметку приёма."
                : accessPolicy.childrenAccess === "edit"
                  ? "View only can monitor the plan. Can mark doses confirms the medicine was given. Full access can edit the plan itself."
                  : "Without full child access, pillbox can only stay in view or mark-dose mode."
            }
            value={accessPolicy.pillboxAccess}
            options={pillboxOptions}
            onChange={(value) =>
              onChange({
                ...accessPolicy,
                pillboxAccess: value as "none" | "view" | "act" | "edit",
              })
            }
          />
          <AccessSelect
            language={language}
            label={tFamily(language, "cabinetAccess")}
            dialogHint={
              language === "ru"
                ? "Только смотреть — видит аптечку и сроки. Полный доступ — добавляет, редактирует и удаляет лекарства."
                : "View only can see the cabinet and dates. Full access can add, change, and remove medicines."
            }
            value={accessPolicy.cabinetAccess}
            options={[
              { value: "none", label: tFamily(language, "hidden") },
              { value: "view", label: cabinetAccessRoleLabel("view", language) },
              { value: "edit", label: cabinetAccessRoleLabel("edit", language) },
            ]}
            onChange={(value) =>
              onChange({
                ...accessPolicy,
                cabinetAccess: value as "none" | "view" | "edit",
                cabinetPushEnabled:
                  value === "none" ? false : accessPolicy.cabinetPushEnabled,
              })
            }
          />
        </div>

        <div className="space-y-4 border-t border-border/55 pt-4">
          {accessPolicy.cabinetAccess !== "none" ? (
            <ToggleRow
              label={language === "ru" ? "Уведомления по аптечке" : "Cabinet reminders"}
              hint={
                language === "ru"
                  ? "Если включено, push по срокам и просрочке будут приходить этому участнику."
                  : "When enabled, this member receives cabinet push reminders about expiry and overdue packs."
              }
              checked={accessPolicy.cabinetPushEnabled}
              onChange={(checked) => onChange({ ...accessPolicy, cabinetPushEnabled: checked })}
            />
          ) : null}

          {!hasAnyFamilyAccess ? (
            <p className="soft-note-danger">
              <span className="font-semibold">{tFamily(language, "noFamilyAccessTitle")}. </span>
              {tFamily(language, "noFamilyAccessDescription")}
            </p>
          ) : null}

          {effectiveChildrenAccess !== "edit" && accessPolicy.pillboxAccess === "act" ? (
            <p className="text-xs leading-5 text-muted">
              {language === "ru"
                ? "Участник сможет отметить, что лекарство дали, но не сможет менять сам план."
                : "This actor can log doses, but cannot create or edit plans."}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border/60 px-4 py-4 sm:px-5">
        <button
          type="button"
          disabled={isPending}
          onClick={onSave}
          className={`${appBtnJournalSecondaryClass} min-h-[2.5rem] w-full justify-center px-3 text-[0.82rem] disabled:opacity-50 sm:w-auto`}
        >
          {tFamily(language, "saveAccess")}
        </button>
      </div>

      <OverlayDialog
        isOpen={isChildrenSheetOpen}
        onClose={() => setIsChildrenSheetOpen(false)}
        placement="bottom"
        zIndexClassName="z-[890]"
        backdropAriaLabel={tFamily(language, "selectedChildren")}
        containerClassName="flex items-end"
        backdropClassName="bg-[rgba(15,23,42,0.32)]"
      >
        <div
          data-ios-disable-back-swipe="true"
          className="relative z-[1] w-full rounded-t-[30px] bg-background px-4 pb-[max(1.25rem,var(--app-safe-bottom-runtime,env(safe-area-inset-bottom)))] pt-4 shadow-[0_-24px_64px_rgba(15,23,42,0.24)] sm:mx-auto sm:max-w-xl"
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_16%,transparent)]" />
          <div className="space-y-1.5">
            <h2 className="app-card-title text-[1.08rem] sm:text-[1.15rem]">
              {tFamily(language, "childrenScope")}
            </h2>
            <p className="text-sm leading-5 text-muted">
              {language === "ru"
                ? "Сразу выберите всех детей или только тех, кого увидит участник."
                : "Choose all children or only the children this member can see."}
            </p>
          </div>

          {familyChildren.length === 0 ? (
            <p className="soft-note-warning mt-4">{tFamily(language, "noChildrenForAccess")}</p>
          ) : (
            <div className="soft-choice-list mt-4">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...accessPolicy,
                    allChildren: true,
                    childIds: [],
                  })
                }
                className={["soft-choice-row", accessPolicy.allChildren ? "soft-choice-row-active" : ""].join(" ")}
              >
                <span className="min-w-0 text-left text-sm font-semibold tracking-[-0.02em] text-foreground">
                  {tFamily(language, "childrenScopeAll")}
                </span>
                <span className="soft-choice-check">{accessPolicy.allChildren ? "✓" : null}</span>
              </button>
              {familyChildren.map((child) => {
                const selected = !accessPolicy.allChildren && accessPolicy.childIds.includes(child.id);
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() =>
                      {
                        const nextChildIds = selected
                          ? accessPolicy.childIds.filter((id) => id !== child.id)
                          : [
                              ...accessPolicy.childIds.filter((id) => id !== child.id),
                              child.id,
                            ];

                        onChange({
                          ...accessPolicy,
                          allChildren: false,
                          childIds: nextChildIds,
                        });
                      }
                    }
                    className={["soft-choice-row", selected ? "soft-choice-row-active" : ""].join(" ")}
                  >
                    <span className="min-w-0 text-left text-sm font-semibold tracking-[-0.02em] text-foreground">
                      {child.name}
                    </span>
                    <span className="soft-choice-check">{selected ? "✓" : null}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </OverlayDialog>
    </div>
  );
}

function AccessSelect({
  language,
  label,
  dialogHint,
  value,
  options,
  onChange,
}: {
  language: AppLanguage;
  label: string;
  dialogHint?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="soft-field-label">{label}</span>
      <ChoiceSheetField
        value={value}
        options={options}
        onChange={onChange}
        dialogTitle={label}
        dialogHint={dialogHint}
        dialogAriaLabel={
          language === "ru" ? `Выбрать: ${label.toLowerCase()}` : `Choose ${label.toLowerCase()}`
        }
      />
    </label>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "settings-preference-row w-full rounded-[20px] px-4 py-4 text-left",
        checked
          ? "border border-[color:color-mix(in_srgb,var(--color-primary)_26%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_8%,white_92%)]"
          : "border border-border/55 bg-[color:color-mix(in_srgb,var(--color-background)_88%,white_12%)]",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
      aria-pressed={checked}
    >
      <span className="block min-w-0">
        <span className="flex items-center justify-between gap-3">
          <span className="block min-w-0 text-sm font-semibold tracking-[-0.02em] text-foreground">
            {label}
          </span>
          <span
            className={[
              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200",
              checked
                ? "bg-[color:color-mix(in_srgb,var(--color-primary)_72%,white_28%)]"
                : "bg-[color:color-mix(in_srgb,var(--color-foreground)_16%,transparent)]",
            ].join(" ")}
            aria-hidden="true"
          >
            <span
              className={[
                "absolute left-1 h-5 w-5 rounded-full bg-white shadow-[0_3px_10px_rgba(15,23,42,0.22)] transition-transform duration-200",
                checked ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </span>
        </span>
        {hint ? <span className="mt-1 block text-sm leading-6 text-muted">{hint}</span> : null}
      </span>
    </button>
  );
}

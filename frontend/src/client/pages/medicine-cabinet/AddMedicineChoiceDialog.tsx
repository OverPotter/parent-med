import type { AppLanguage } from "@shared/i18n";
import { tCabinet } from "./copy";
import { MedicineCabinetHeader } from "./MedicineCabinetHeader";
import { cabinetAddPageClass, cabinetChoiceActionClass, cabinetPanelClass } from "./styles";

export function AddMedicineChoiceDialog({
  language,
  onClose,
  onCatalog,
  onManual,
}: {
  language: AppLanguage;
  onClose: () => void;
  onCatalog: () => void;
  onManual: () => void;
}) {
  return (
    <div className={`${cabinetAddPageClass} flex-col overflow-hidden py-2 sm:py-6`}>
      <MedicineCabinetHeader
        backLabel={`← ${tCabinet(language, "back")}`}
        onBack={onClose}
        title={tCabinet(language, "addChoiceTitle")}
        hint={tCabinet(language, "addChoiceSubtitle")}
        actionLabel={tCabinet(language, "close")}
        onAction={onClose}
      />
      <div className="flex flex-1 items-start justify-center py-4 sm:py-6">
        <div
          className={`${cabinetPanelClass} w-full max-w-[27rem] p-3.5 shadow-[0_24px_72px_color-mix(in_srgb,var(--color-shadow)_34%,transparent)] sm:p-4.5`}
        >
          <div className="grid gap-2">
            <button
              type="button"
              onClick={onCatalog}
              className={`${cabinetChoiceActionClass} border-[color:color-mix(in_srgb,var(--color-primary)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface)_92%)]`}
            >
              <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_76%,var(--color-foreground)_24%)]" />
              <span className="grid min-w-0 gap-0.5">
                <span className="text-[0.92rem] font-extrabold tracking-[-0.03em] text-foreground">
                  {tCabinet(language, "addFromCatalog")}
                </span>
                <span className="whitespace-normal text-[0.76rem] font-semibold leading-5 text-muted">
                  {tCabinet(language, "addFromCatalogHint")}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={onManual}
              className={`${cabinetChoiceActionClass} border-[color:color-mix(in_srgb,var(--color-border)_54%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_70%,var(--color-background)_30%)]`}
            >
              <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_62%,var(--color-foreground)_20%)]" />
              <span className="grid min-w-0 gap-0.5">
                <span className="text-[0.92rem] font-extrabold tracking-[-0.03em] text-foreground">
                  {tCabinet(language, "addOwnMedicine")}
                </span>
                <span className="whitespace-normal text-[0.76rem] font-semibold leading-5 text-muted">
                  {tCabinet(language, "addOwnMedicineHint")}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

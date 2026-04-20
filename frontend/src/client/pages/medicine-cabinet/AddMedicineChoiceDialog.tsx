import type { AppLanguage } from "@shared/i18n";
import { ChoiceSheetList } from "@shared/components/ChoiceSheetField";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import { tCabinet } from "./copy";
import { cabinetPanelClass } from "./styles";

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
    <OverlayDialog
      isOpen
      onClose={onClose}
      placement="bottom"
      zIndexClassName="z-[890]"
      backdropAriaLabel={language === "ru" ? "Закрыть выбор добавления" : "Close add options"}
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
            {tCabinet(language, "addChoiceTitle")}
          </h2>
          <p className="text-sm leading-5 text-muted">{tCabinet(language, "addChoiceSubtitle")}</p>
        </div>
        <div
          className={`${cabinetPanelClass} mt-4 w-full p-3.5 shadow-[0_24px_72px_color-mix(in_srgb,var(--color-shadow)_34%,transparent)] sm:p-4.5`}
        >
          <ChoiceSheetList
            options={[
              {
                value: "catalog",
                label: tCabinet(language, "addFromCatalog"),
                hint: tCabinet(language, "addFromCatalogHint"),
              },
              {
                value: "manual",
                label: tCabinet(language, "addOwnMedicine"),
                hint: tCabinet(language, "addOwnMedicineHint"),
              },
            ]}
            onSelect={(nextValue) => {
              if (nextValue === "catalog") {
                onCatalog();
                return;
              }
              onManual();
            }}
            renderTrailing={(_, __) => (language === "ru" ? "Открыть" : "Open")}
          />
        </div>
      </div>
    </OverlayDialog>
  );
}

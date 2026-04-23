import type { AppLanguage } from "@shared/i18n";
import type { HouseholdMedicine } from "@shared/types/api";
import { tCabinet } from "./copy";
import { MedicineItemCard } from "./MedicineItemCard";
import { cabinetListClass } from "./styles";

export function MedicineSection({
  language,
  title,
  hint,
  count,
  medicines,
  compact,
  canEdit = true,
  isOffline = false,
  onNetworkRequired,
  expandedMedicineId,
  isDeleting,
  deletingMedicineId,
  onDelete,
  onExpandChange,
}: {
  language: AppLanguage;
  title: string;
  hint?: string;
  count: number;
  medicines: HouseholdMedicine[];
  compact: boolean;
  canEdit?: boolean;
  isOffline?: boolean;
  onNetworkRequired?: () => void;
  expandedMedicineId: string | null;
  isDeleting: boolean;
  deletingMedicineId: string | null;
  onDelete: (id: string) => void;
  onExpandChange: (value: string | null) => void;
}) {
  return (
    <section className="mt-5 space-y-2.5">
      <div className="px-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-[0.92rem] font-semibold tracking-[-0.025em] text-foreground">
              {title}
            </h2>
            <span className="text-[0.76rem] font-medium text-muted">
              {tCabinet(language, "sectionCount", { count })}
            </span>
          </div>
          {hint ? <p className="mt-0.5 text-[0.76rem] leading-5 text-muted">{hint}</p> : null}
        </div>
      </div>
      <ul className={cabinetListClass}>
        {medicines.map((medicine) => (
          <MedicineItemCard
            key={medicine.id}
            language={language}
            medicine={medicine}
            onDelete={onDelete}
            isDeleting={isDeleting && deletingMedicineId === medicine.id}
            compact={compact}
            canEdit={canEdit}
            isOffline={isOffline}
            onNetworkRequired={onNetworkRequired}
            isExpanded={expandedMedicineId === medicine.id}
            onExpandChange={(isExpanded) => {
              onExpandChange(isExpanded ? medicine.id : null);
            }}
          />
        ))}
      </ul>
    </section>
  );
}

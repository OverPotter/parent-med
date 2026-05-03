import type { AdministrationEvent } from "@shared/types/api";

type AdministrationEventDraft = {
  episodeId: string;
  householdMedicineId?: string | null;
  customMedicineName?: string | null;
  administeredAt: string;
  administeredByAccountId?: string | null;
  administeredByNameSnapshot?: string | null;
  amount: string;
  unit?: string | null;
  reason?: string | null;
};

export function buildOptimisticAdministrationEvent(
  draft: AdministrationEventDraft
): AdministrationEvent {
  return {
    id: `optimistic-${draft.episodeId}-${draft.administeredAt}-${draft.householdMedicineId ?? draft.customMedicineName ?? "manual"}`,
    episodeId: draft.episodeId,
    householdMedicineId: draft.householdMedicineId ?? null,
    customMedicineName: draft.customMedicineName?.trim() || null,
    administeredAt: draft.administeredAt,
    administeredByAccountId: draft.administeredByAccountId ?? null,
    administeredByNameSnapshot: draft.administeredByNameSnapshot?.trim() || null,
    amount: draft.amount,
    unit: draft.unit ?? null,
    reason: draft.reason ?? null,
  };
}

export function upsertAdministrationEvent(
  current: AdministrationEvent[] | undefined,
  nextEvent: AdministrationEvent,
  optimisticEventId?: string | null
): AdministrationEvent[] {
  const items = current ?? [];
  const nextItems = items.filter(
    (item) =>
      item.id !== nextEvent.id && (!optimisticEventId || item.id !== optimisticEventId)
  );
  nextItems.push(nextEvent);
  return nextItems.sort((left, right) => right.administeredAt.localeCompare(left.administeredAt));
}

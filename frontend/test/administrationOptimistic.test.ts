import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOptimisticAdministrationEvent,
  upsertAdministrationEvent,
} from "../src/client/pages/child-illness/administrationOptimistic.js";

test("buildOptimisticAdministrationEvent normalizes optional fields", () => {
  const event = buildOptimisticAdministrationEvent({
    episodeId: "episode-1",
    customMedicineName: "  Уголь  ",
    administeredAt: "2026-05-03T10:00:00.000Z",
    amount: "2 таб",
    administeredByNameSnapshot: "  Мама ",
  });

  assert.equal(event.episodeId, "episode-1");
  assert.equal(event.customMedicineName, "Уголь");
  assert.equal(event.administeredByNameSnapshot, "Мама");
  assert.equal(event.householdMedicineId, null);
});

test("upsertAdministrationEvent replaces optimistic item with server item and keeps sort order", () => {
  const optimisticEvent = buildOptimisticAdministrationEvent({
    episodeId: "episode-1",
    householdMedicineId: "med-1",
    administeredAt: "2026-05-03T10:00:00.000Z",
    amount: "5 мл",
  });
  const olderEvent = {
    ...optimisticEvent,
    id: "older",
    administeredAt: "2026-05-03T09:00:00.000Z",
  };
  const serverEvent = {
    ...optimisticEvent,
    id: "server-1",
  };

  const result = upsertAdministrationEvent([olderEvent, optimisticEvent], serverEvent, optimisticEvent.id);

  assert.deepEqual(
    result.map((item) => item.id),
    ["server-1", "older"]
  );
});

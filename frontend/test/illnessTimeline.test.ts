import test from "node:test";
import assert from "node:assert/strict";

import { buildEpisodeTimeline } from "../src/client/pages/child-illness/timelineHelpers.js";

test("buildEpisodeTimeline uses 'Вы' for current actor without stored name", () => {
  const items = buildEpisodeTimeline(
    [
      {
        id: "temp-1",
        episodeId: "episode-1",
        valueCelsius: 38.2,
        measuredAt: "2026-04-24T10:00:00.000Z",
        method: null,
        comment: null,
        createdByAccountId: "account-1",
        createdByNameSnapshot: null,
      },
    ],
    [],
    [],
    [],
    "ru",
    {
      accountId: "account-1",
    }
  );

  assert.equal(items[0]?.actorName, "Вы");
});

test("buildEpisodeTimeline uses 'Вы' for current actor with generic fallback snapshot", () => {
  const items = buildEpisodeTimeline(
    [],
    [
      {
        id: "admin-1",
        episodeId: "episode-1",
        householdMedicineId: null,
        customMedicineName: "Ибупрофен",
        amount: "5 мл",
        unit: null,
        administeredAt: "2026-04-25T10:00:00.000Z",
        administeredByAccountId: "account-1",
        administeredByNameSnapshot: "Участник семьи",
        reason: null,
      },
    ],
    [],
    [],
    "ru",
    {
      accountId: "account-1",
    }
  );

  assert.equal(items[0]?.actorName, "Вы");
});

test("buildEpisodeTimeline uses 'Участник семьи' for another actor without stored name", () => {
  const items = buildEpisodeTimeline(
    [
      {
        id: "temp-2",
        episodeId: "episode-1",
        valueCelsius: 37.4,
        measuredAt: "2026-04-24T11:00:00.000Z",
        method: null,
        comment: null,
        createdByAccountId: "account-2",
        createdByNameSnapshot: null,
      },
    ],
    [],
    [],
    [],
    "ru",
    {
      accountId: "account-1",
    }
  );

  assert.equal(items[0]?.actorName, "Участник семьи");
});

test("buildEpisodeTimeline uses 'Family member' for another actor with generic fallback snapshot", () => {
  const items = buildEpisodeTimeline(
    [],
    [],
    [
      {
        id: "comment-1",
        createdAt: "2026-04-25T10:00:00.000Z",
        text: "Watching the child",
        createdByAccountId: "account-2",
        createdByNameSnapshot: "Family member",
      },
    ],
    [],
    "en",
    {
      accountId: "account-1",
    }
  );

  assert.equal(items[0]?.actorName, "Family member");
});

test("buildEpisodeTimeline prefers family relationship label over generic fallbacks", () => {
  const items = buildEpisodeTimeline(
    [],
    [
      {
        id: "admin-2",
        episodeId: "episode-1",
        householdMedicineId: null,
        customMedicineName: "Ibuprofen",
        amount: "5 ml",
        unit: null,
        administeredAt: "2026-04-25T12:00:00.000Z",
        administeredByAccountId: "account-2",
        administeredByNameSnapshot: "Family member",
        reason: null,
      },
      {
        id: "admin-3",
        episodeId: "episode-1",
        householdMedicineId: null,
        customMedicineName: "Ibuprofen",
        amount: "5 ml",
        unit: null,
        administeredAt: "2026-04-25T11:00:00.000Z",
        administeredByAccountId: "account-1",
        administeredByNameSnapshot: null,
        reason: null,
      },
    ],
    [],
    [],
    "ru",
    {
      accountId: "account-1",
    },
    [
      { id: "account-1", relationshipLabel: "мама" },
      { id: "account-2", relationshipLabel: "няня" },
    ]
  );

  assert.equal(items[0]?.actorName, "няня");
  assert.equal(items[1]?.actorName, "мама");
});

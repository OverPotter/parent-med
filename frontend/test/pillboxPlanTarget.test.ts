import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPillboxPlanTargetLabel,
  buildPillboxPlanTargetTitle,
} from "../src/client/pages/pillbox/planTarget.js";

test("buildPillboxPlanTargetLabel combines role and name without duplicating title copy", () => {
  assert.equal(
    buildPillboxPlanTargetLabel({
      id: "member-1",
      relationshipLabel: "мама",
      displayName: "Анна",
    }),
    "Анна"
  );
});

test("buildPillboxPlanTargetTitle combines role and name for Russian copy", () => {
  assert.equal(
    buildPillboxPlanTargetTitle(
      {
        id: "member-1",
        relationshipLabel: "мама",
        displayName: "Анна",
      },
      "ru"
    ),
    "Для мамы Анны"
  );
});

test("buildPillboxPlanTargetTitle falls back to display name when role is missing", () => {
  assert.equal(
    buildPillboxPlanTargetTitle(
      {
        id: "member-2",
        displayName: "Inna",
      },
      "en"
    ),
    "For Inna"
  );
});

test("buildPillboxPlanTargetTitle falls back to relationship label when name is missing", () => {
  assert.equal(
    buildPillboxPlanTargetTitle(
      {
        id: "member-3",
        relationshipLabel: "мама",
      },
      "ru"
    ),
    "Для мамы"
  );
});

test("buildPillboxPlanTargetTitle inflects a Russian display name with a simple consonant ending", () => {
  assert.equal(
    buildPillboxPlanTargetTitle(
      {
        id: "member-4",
        displayName: "Артем",
      },
      "ru"
    ),
    "Для Артема"
  );
});

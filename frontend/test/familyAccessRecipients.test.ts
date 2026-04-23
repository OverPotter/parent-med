import assert from "node:assert/strict";
import test from "node:test";
import {
  getEligibleCabinetRecipients,
  getEligibleIllnessRecipients,
  getEligiblePillboxRecipients,
} from "../src/shared/familyAccess/recipients.js";

const childId = "child-1";

function member(
  id: string,
  overrides: Partial<{
    allChildren: boolean;
    childIds: string[];
    childrenAccess: "view" | "act" | "edit";
    cabinetAccess: "none" | "view" | "edit";
    pillboxAccess: "none" | "view" | "act" | "edit";
    cabinetPushEnabled: boolean;
  }> = {}
) {
  return {
    id,
    familyRole: "member",
    accessPolicy: {
      allChildren: false,
      childIds: [],
      childrenAccess: "view" as const,
      cabinetAccess: "none" as const,
      pillboxAccess: "none" as const,
      cabinetPushEnabled: false,
      ...overrides,
    },
  };
}

test("getEligibleIllnessRecipients keeps only members who can see the current child", () => {
  const recipients = getEligibleIllnessRecipients(
    [
      member("all", { allChildren: true }),
      member("child", { childIds: [childId] }),
      member("other", { childIds: ["child-2"] }),
    ],
    childId
  );

  assert.deepEqual(
    recipients.map((item) => item.id),
    ["all", "child"]
  );
});

test("getEligiblePillboxRecipients excludes members with hidden pillbox access", () => {
  const recipients = getEligiblePillboxRecipients([
    member("view", { pillboxAccess: "view" }),
    member("act", { pillboxAccess: "act" }),
    member("edit", { pillboxAccess: "edit" }),
    member("none", { pillboxAccess: "none" }),
  ]);

  assert.deepEqual(
    recipients.map((item) => item.id),
    ["view", "act", "edit"]
  );
});

test("getEligibleCabinetRecipients excludes members with hidden cabinet access", () => {
  const recipients = getEligibleCabinetRecipients([
    member("view", { cabinetAccess: "view" }),
    member("edit", { cabinetAccess: "edit" }),
    member("none", { cabinetAccess: "none" }),
  ]);

  assert.deepEqual(
    recipients.map((item) => item.id),
    ["view", "edit"]
  );
});

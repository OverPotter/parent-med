import test from "node:test";
import assert from "node:assert/strict";
import {
  buildScopedLiveActivityPreferences,
  hasLiveActivityAccess,
} from "../src/shared/utils/liveActivityAccess.js";

test("hasLiveActivityAccess hides Live features for free families", () => {
  assert.equal(hasLiveActivityAccess(null), false);
  assert.equal(hasLiveActivityAccess({ canUseLiveActivities: false }), false);
  assert.equal(hasLiveActivityAccess({ canUseLiveActivities: true }), true);
});

test("buildScopedLiveActivityPreferences only disables the requested kind", () => {
  assert.deepEqual(buildScopedLiveActivityPreferences("sleep", false), {
    sleepEnabled: false,
    feedingEnabled: true,
    illnessEnabled: true,
  });
  assert.deepEqual(buildScopedLiveActivityPreferences("feeding", false), {
    sleepEnabled: true,
    feedingEnabled: false,
    illnessEnabled: true,
  });
  assert.deepEqual(buildScopedLiveActivityPreferences("illness", false), {
    sleepEnabled: true,
    feedingEnabled: true,
    illnessEnabled: false,
  });
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  hasCategoryPushIssue,
  resolvePushPromptState,
} from "../src/client/layout/clientLayout/pushPromptState.js";

test("hasCategoryPushIssue stays false when every category is enabled", () => {
  assert.equal(
    hasCategoryPushIssue({
      childrenEnabled: true,
      pillboxEnabled: true,
      cabinetNotify10Days: true,
      cabinetNotify7Days: false,
      cabinetNotify3Days: false,
    }),
    false
  );
});

test("hasCategoryPushIssue becomes true when any account-level group is off", () => {
  assert.equal(
    hasCategoryPushIssue({
      childrenEnabled: false,
      pillboxEnabled: true,
      cabinetNotify10Days: true,
      cabinetNotify7Days: true,
      cabinetNotify3Days: true,
    }),
    true
  );
  assert.equal(
    hasCategoryPushIssue({
      childrenEnabled: true,
      pillboxEnabled: true,
      cabinetNotify10Days: false,
      cabinetNotify7Days: false,
      cabinetNotify3Days: false,
    }),
    true
  );
});

test("resolvePushPromptState prioritizes red bell for native/system blockers", () => {
  assert.deepEqual(
    resolvePushPromptState({
      isPushPromptReady: true,
      pushStatus: "disabled",
      nativePushIssue: "system",
      shouldShowWebPushPrompt: false,
      hasCategoryPushIssue: true,
    }),
    {
      shouldShowCategoryPrompt: false,
      shouldShowNotificationPrompt: true,
      isNotificationBellActive: true,
      notificationBellVariant: "danger",
    }
  );
});

test("resolvePushPromptState shows yellow bell only for category-level opt-outs", () => {
  assert.deepEqual(
    resolvePushPromptState({
      isPushPromptReady: true,
      pushStatus: "enabled",
      nativePushIssue: null,
      shouldShowWebPushPrompt: false,
      hasCategoryPushIssue: true,
    }),
    {
      shouldShowCategoryPrompt: true,
      shouldShowNotificationPrompt: true,
      isNotificationBellActive: true,
      notificationBellVariant: "warning",
    }
  );
});

test("resolvePushPromptState stays quiet when push is enabled and categories are enabled", () => {
  assert.deepEqual(
    resolvePushPromptState({
      isPushPromptReady: true,
      pushStatus: "enabled",
      nativePushIssue: null,
      shouldShowWebPushPrompt: false,
      hasCategoryPushIssue: false,
    }),
    {
      shouldShowCategoryPrompt: false,
      shouldShowNotificationPrompt: false,
      isNotificationBellActive: false,
      notificationBellVariant: "warning",
    }
  );
});

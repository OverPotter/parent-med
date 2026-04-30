import assert from "node:assert/strict";
import test from "node:test";
import {
  isSettingsFreeSubscriptionState,
  resolveSettingsDeleteAction,
  shouldBlockSettingsDeletion,
} from "../src/client/pages/settings/deleteFlow.js";

test("resolveSettingsDeleteAction maps family owner to family deletion", () => {
  assert.equal(resolveSettingsDeleteAction(true), "delete_family");
});

test("resolveSettingsDeleteAction maps regular member to account deletion", () => {
  assert.equal(resolveSettingsDeleteAction(false), "delete_account");
});

test("shouldBlockSettingsDeletion blocks only subscription manager with active-like status", () => {
  assert.equal(shouldBlockSettingsDeletion(true, "active"), true);
  assert.equal(shouldBlockSettingsDeletion(true, "canceled"), true);
  assert.equal(shouldBlockSettingsDeletion(true, "inactive"), false);
  assert.equal(shouldBlockSettingsDeletion(false, "active"), false);
});

test("isSettingsFreeSubscriptionState matches free-like statuses", () => {
  assert.equal(isSettingsFreeSubscriptionState("inactive"), true);
  assert.equal(isSettingsFreeSubscriptionState("expired"), true);
  assert.equal(isSettingsFreeSubscriptionState("active"), false);
});

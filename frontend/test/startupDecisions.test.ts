import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveClientStartRoute,
  shouldShowClientBootSplash,
} from "../src/client/startup/startupDecisions.js";

test("resolveClientStartRoute routes to family when no family exists", () => {
  assert.equal(
    resolveClientStartRoute({
      hasFamily: false,
      hasActiveEpisode: false,
      canSeeChildren: false,
      canSeePillbox: false,
      canSeeCabinet: false,
    }),
    "/family"
  );
});

test("resolveClientStartRoute routes to active illness when an active episode exists", () => {
  assert.equal(
    resolveClientStartRoute({
      hasFamily: true,
      hasActiveEpisode: true,
      canSeeChildren: true,
      canSeePillbox: true,
      canSeeCabinet: true,
    }),
    "/illnesses/active"
  );
});

test("resolveClientStartRoute routes to children when children are available and no active episode", () => {
  assert.equal(
    resolveClientStartRoute({
      hasFamily: true,
      hasActiveEpisode: false,
      canSeeChildren: true,
      canSeePillbox: true,
      canSeeCabinet: true,
    }),
    "/children"
  );
});

test("resolveClientStartRoute routes to pillbox when children are hidden but pillbox is available", () => {
  assert.equal(
    resolveClientStartRoute({
      hasFamily: true,
      hasActiveEpisode: false,
      canSeeChildren: false,
      canSeePillbox: true,
      canSeeCabinet: true,
    }),
    "/pillbox"
  );
});

test("resolveClientStartRoute routes to cabinet when only cabinet is available", () => {
  assert.equal(
    resolveClientStartRoute({
      hasFamily: true,
      hasActiveEpisode: false,
      canSeeChildren: false,
      canSeePillbox: false,
      canSeeCabinet: true,
    }),
    "/medicine-cabinet"
  );
});

test("shouldShowClientBootSplash blocks while families bootstrap is unresolved", () => {
  assert.equal(
    shouldShowClientBootSplash({
      authToken: "token",
      accountId: "account",
      currentFamilyId: null,
      familiesCount: 0,
      isFamiliesLoading: true,
      isFamiliesSuccess: false,
      isDeferredBootReady: true,
      isDeferredShellWorkReady: true,
      isFirstNativeLaunch: false,
    }),
    true
  );
});

test("shouldShowClientBootSplash blocks while resolving current family from loaded families", () => {
  assert.equal(
    shouldShowClientBootSplash({
      authToken: "token",
      accountId: "account",
      currentFamilyId: null,
      familiesCount: 1,
      isFamiliesLoading: false,
      isFamiliesSuccess: true,
      isDeferredBootReady: true,
      isDeferredShellWorkReady: true,
      isFirstNativeLaunch: false,
    }),
    true
  );
});

test("shouldShowClientBootSplash does not wait on warm data after boot is ready", () => {
  assert.equal(
    shouldShowClientBootSplash({
      authToken: "token",
      accountId: "account",
      currentFamilyId: "family",
      familiesCount: 1,
      isFamiliesLoading: false,
      isFamiliesSuccess: true,
      isDeferredBootReady: true,
      isDeferredShellWorkReady: true,
      isFirstNativeLaunch: false,
    }),
    false
  );
});

test("shouldShowClientBootSplash keeps first native launch blocked until shell work is ready", () => {
  assert.equal(
    shouldShowClientBootSplash({
      authToken: "token",
      accountId: "account",
      currentFamilyId: "family",
      familiesCount: 1,
      isFamiliesLoading: false,
      isFamiliesSuccess: true,
      isDeferredBootReady: true,
      isDeferredShellWorkReady: false,
      isFirstNativeLaunch: true,
    }),
    true
  );
});

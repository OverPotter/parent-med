import test from "node:test";
import assert from "node:assert/strict";
import { resolveClientStartRoute, shouldShowClientBootSplash, } from "../src/client/startup/startupDecisions.js";
test("resolveClientStartRoute routes to family when no family exists", () => {
    assert.equal(resolveClientStartRoute({
        hasFamily: false,
        hasChildren: false,
        hasActiveEpisode: false,
    }), "/family");
});
test("resolveClientStartRoute routes to children when family exists but no children", () => {
    assert.equal(resolveClientStartRoute({
        hasFamily: true,
        hasChildren: false,
        hasActiveEpisode: false,
    }), "/children");
});
test("resolveClientStartRoute routes to active illness when an active episode exists", () => {
    assert.equal(resolveClientStartRoute({
        hasFamily: true,
        hasChildren: true,
        hasActiveEpisode: true,
    }), "/illnesses/active");
});
test("resolveClientStartRoute routes to children when family exists and no active episode", () => {
    assert.equal(resolveClientStartRoute({
        hasFamily: true,
        hasChildren: true,
        hasActiveEpisode: false,
    }), "/children");
});
test("shouldShowClientBootSplash blocks while families bootstrap is unresolved", () => {
    assert.equal(shouldShowClientBootSplash({
        authToken: "token",
        accountId: "account",
        currentFamilyId: null,
        familiesCount: 0,
        isFamiliesLoading: true,
        isFamiliesSuccess: false,
        isDeferredBootReady: true,
        isDeferredShellWorkReady: true,
        isFirstNativeLaunch: false,
    }), true);
});
test("shouldShowClientBootSplash blocks while resolving current family from loaded families", () => {
    assert.equal(shouldShowClientBootSplash({
        authToken: "token",
        accountId: "account",
        currentFamilyId: null,
        familiesCount: 1,
        isFamiliesLoading: false,
        isFamiliesSuccess: true,
        isDeferredBootReady: true,
        isDeferredShellWorkReady: true,
        isFirstNativeLaunch: false,
    }), true);
});
test("shouldShowClientBootSplash does not wait on warm data after boot is ready", () => {
    assert.equal(shouldShowClientBootSplash({
        authToken: "token",
        accountId: "account",
        currentFamilyId: "family",
        familiesCount: 1,
        isFamiliesLoading: false,
        isFamiliesSuccess: true,
        isDeferredBootReady: true,
        isDeferredShellWorkReady: true,
        isFirstNativeLaunch: false,
    }), false);
});
test("shouldShowClientBootSplash keeps first native launch blocked until shell work is ready", () => {
    assert.equal(shouldShowClientBootSplash({
        authToken: "token",
        accountId: "account",
        currentFamilyId: "family",
        familiesCount: 1,
        isFamiliesLoading: false,
        isFamiliesSuccess: true,
        isDeferredBootReady: true,
        isDeferredShellWorkReady: false,
        isFirstNativeLaunch: true,
    }), true);
});

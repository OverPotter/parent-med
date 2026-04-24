import test from "node:test";
import assert from "node:assert/strict";

import { resolveConcurrentSecureTokenRead } from "../src/shared/security/authTokenStorageHelpers.js";

test("concurrent secure token read keeps newer cached session", () => {
  const result = resolveConcurrentSecureTokenRead({
    startedVersion: 1,
    currentVersion: 2,
    currentCache: {
      accessToken: "fresh-access",
      refreshToken: "fresh-refresh",
    },
    readTokens: {
      accessToken: null,
      refreshToken: null,
    },
  });

  assert.deepEqual(result, {
    accessToken: "fresh-access",
    refreshToken: "fresh-refresh",
  });
});

test("secure token read uses read result when no newer session appeared", () => {
  const result = resolveConcurrentSecureTokenRead({
    startedVersion: 3,
    currentVersion: 3,
    currentCache: null,
    readTokens: {
      accessToken: "boot-access",
      refreshToken: "boot-refresh",
    },
  });

  assert.deepEqual(result, {
    accessToken: "boot-access",
    refreshToken: "boot-refresh",
  });
});

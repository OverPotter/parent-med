import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveAuthSessionFailureAction,
  shouldClearSessionForAuthError,
} from "../src/shared/api/authSessionErrors.js";

function makeAxiosError(status?: number) {
  return {
    name: "AxiosError",
    message: status ? `Request failed with status code ${status}` : "Network Error",
    toJSON: () => ({}),
    config: {},
    response:
      status === undefined
        ? undefined
        : {
            status,
            statusText: "",
            headers: {},
            config: {},
            data: {},
          },
  };
}

test("clears session only for 401 auth errors", () => {
  assert.equal(shouldClearSessionForAuthError(makeAxiosError(401)), true);
  assert.equal(shouldClearSessionForAuthError(makeAxiosError(500)), false);
  assert.equal(shouldClearSessionForAuthError(makeAxiosError()), false);
  assert.equal(shouldClearSessionForAuthError(new Error("offline")), false);
});

test("resolveAuthSessionFailureAction retains saved session on network failure", () => {
  assert.equal(
    resolveAuthSessionFailureAction({
      error: makeAxiosError(),
      hasLocalSession: true,
    }),
    "retain"
  );
});

test("resolveAuthSessionFailureAction clears only invalid saved sessions", () => {
  assert.equal(
    resolveAuthSessionFailureAction({
      error: makeAxiosError(401),
      hasLocalSession: true,
    }),
    "clear"
  );
  assert.equal(
    resolveAuthSessionFailureAction({
      error: makeAxiosError(500),
      hasLocalSession: true,
    }),
    "retain"
  );
  assert.equal(
    resolveAuthSessionFailureAction({
      error: makeAxiosError(),
      hasLocalSession: false,
    }),
    "ignore"
  );
});

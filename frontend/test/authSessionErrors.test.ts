import test from "node:test";
import assert from "node:assert/strict";
import { shouldClearSessionForAuthError } from "../src/shared/api/authSessionErrors.js";

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

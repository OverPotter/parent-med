import test from "node:test";
import assert from "node:assert/strict";

import { resolveRequestBearerToken } from "../src/shared/api/client.js";
import { COOKIE_SESSION_MARKER } from "../src/shared/security/authSession.js";

test("prefers the latest token from the store over stale in-memory bearer token", () => {
  assert.equal(
    resolveRequestBearerToken({
      storeToken: "fresh-token",
      inMemoryToken: "stale-token",
    }),
    "fresh-token"
  );
});

test("ignores cookie session marker and does not fall back to stale in-memory bearer token", () => {
  assert.equal(
    resolveRequestBearerToken({
      storeToken: COOKIE_SESSION_MARKER,
      inMemoryToken: "stale-token",
    }),
    null
  );
});

test("falls back to in-memory bearer token only when store has no usable token", () => {
  assert.equal(
    resolveRequestBearerToken({
      storeToken: null,
      inMemoryToken: "memory-token",
    }),
    "memory-token"
  );
});

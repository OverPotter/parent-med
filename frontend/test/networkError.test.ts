import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError } from "axios";
import { hasNetworkUnavailableError, isNetworkUnavailableError } from "../src/shared/api/network.js";

test("detects browser offline mode as a network-unavailable state", () => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { onLine: false } satisfies Partial<Navigator>,
  });

  assert.equal(isNetworkUnavailableError(null), true);
});

test("detects axios errors without response as a network-unavailable state", () => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { onLine: true } satisfies Partial<Navigator>,
  });

  const error = new AxiosError("Network Error", "ERR_NETWORK");

  assert.equal(isNetworkUnavailableError(error), true);
  assert.equal(hasNetworkUnavailableError([null, error]), true);
});

test("does not treat regular API responses as offline", () => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { onLine: true } satisfies Partial<Navigator>,
  });

  const error = new AxiosError("Forbidden", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 403,
    statusText: "Forbidden",
    headers: {},
    config: {} as never,
    data: {},
  });

  assert.equal(isNetworkUnavailableError(error), false);
});

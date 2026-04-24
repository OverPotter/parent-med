import test from "node:test";
import assert from "node:assert/strict";

import {
  hasMatchingVapidKey,
  vapidKeyToUint8Array,
} from "../src/shared/utils/pushNotifications.js";

if (typeof window === "undefined") {
  (globalThis as any).window = {
    atob: (value: string) => Buffer.from(value, "base64").toString("binary"),
  };
}

test("hasMatchingVapidKey returns true for the same VAPID public key", () => {
  const key = "BADrN1eEQgUPtjehgE5nYL35bEpMvCLLppnZLoFFxFQilqAsDSehTJUmQxCBi37HeyUWxxlmo-lTBUAU0eLTfmM";

  assert.equal(hasMatchingVapidKey(vapidKeyToUint8Array(key).buffer, key), true);
});

test("hasMatchingVapidKey returns false for another VAPID public key", () => {
  const currentKey =
    "BADrN1eEQgUPtjehgE5nYL35bEpMvCLLppnZLoFFxFQilqAsDSehTJUmQxCBi37HeyUWxxlmo-lTBUAU0eLTfmM";
  const nextKey =
    "BDM5uD5w3IM4E4r6kC7Yz1JfLQqQ2m0DBn3WqJ9b7Xq7N1d8TNh2S8d0mS0Xl3pQ1s5N7iA0o3q7yKq9QvU2rI";

  assert.equal(hasMatchingVapidKey(vapidKeyToUint8Array(currentKey).buffer, nextKey), false);
  assert.equal(hasMatchingVapidKey(null, currentKey), false);
});

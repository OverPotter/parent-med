import test from "node:test";
import assert from "node:assert/strict";
import {
  clearIllnessStartHint,
  resolveIllnessStartedAt,
  setIllnessStartHint,
  shouldKeepIllnessTimerHint,
} from "../src/shared/utils/illnessStartHints.js";

type StorageMock = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function createStorageMock(): StorageMock {
  const state = new Map<string, string>();
  return {
    getItem(key) {
      return state.has(key) ? state.get(key)! : null;
    },
    setItem(key, value) {
      state.set(key, value);
    },
    removeItem(key) {
      state.delete(key);
    },
  };
}

test("resolveIllnessStartedAt prefers local hint for active date-only episode", () => {
  const host = globalThis as typeof globalThis & {
    window?: { localStorage?: StorageMock };
  };
  const previousWindow = host.window;
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: createStorageMock() },
    configurable: true,
  });

  try {
    setIllnessStartHint({
      childId: "child-1",
      episodeId: "episode-1",
      startedAt: "2026-04-23T11:42:00.000Z",
    });

    assert.equal(
      resolveIllnessStartedAt("child-1", "episode-1", "2026-04-23"),
      "2026-04-23T11:42:00.000Z"
    );
    assert.equal(resolveIllnessStartedAt("child-1", "episode-2", "2026-04-23"), "2026-04-23");

    clearIllnessStartHint("child-1");
    assert.equal(resolveIllnessStartedAt("child-1", "episode-1", "2026-04-23"), "2026-04-23");
  } finally {
    Object.defineProperty(globalThis, "window", {
      value: previousWindow,
      configurable: true,
    });
  }
});

test("shouldKeepIllnessTimerHint stores exact timer only for episodes started today", () => {
  const now = new Date(2026, 3, 23, 20, 15, 0, 0);

  assert.equal(shouldKeepIllnessTimerHint("2026-04-23", now), true);
  assert.equal(shouldKeepIllnessTimerHint("2026-04-22", now), false);
});

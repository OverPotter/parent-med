import assert from "node:assert/strict";
import test from "node:test";
import {
  clearAllOfflineCareOverrides,
  getOfflineCareActions,
  getOfflineFeedingOverride,
  getOfflineIllnessOverride,
  getOfflineSleepOverride,
  queueOfflineFeedingStart,
  queueOfflineFeedingStop,
  queueOfflineIllnessStart,
  queueOfflineIllnessStop,
  queueOfflineSleepStart,
  queueOfflineSleepStop,
} from "../src/shared/utils/offlineCareState.js";
import { getCurrentDeviceTimestampIso } from "../src/shared/utils/date.js";

class MemoryStorage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

function installWindow() {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: storage },
    configurable: true,
    writable: true,
  });
  return storage;
}

test.beforeEach(() => {
  installWindow();
});

test("offline sleep start/stop stores active override and queue actions", () => {
  const started = queueOfflineSleepStart({
    childId: "child-sleep",
    currentAccountId: "acc-1",
  });

  assert.equal(getOfflineSleepOverride("child-sleep").hasOverride, true);
  assert.equal(getOfflineSleepOverride("child-sleep").value?.status, "active");
  assert.equal(getOfflineCareActions().length, 1);

  const stopped = queueOfflineSleepStop({
    childId: "child-sleep",
    sessionId: started.id,
  });

  assert.equal(stopped?.status, "completed");
  assert.equal(getOfflineSleepOverride("child-sleep").hasOverride, true);
  assert.equal(getOfflineSleepOverride("child-sleep").value, null);
  assert.equal(getOfflineCareActions().length, 2);
});

test("offline feeding start/stop stores payload and clears active override", () => {
  const started = queueOfflineFeedingStart({
    childId: "child-feeding",
    currentAccountId: "acc-2",
    payload: {
      feeding_type: "formula",
      formula_volume_ml: 120,
      note: "Night feeding",
    },
  });

  assert.equal(started.status, "active");
  assert.equal(getOfflineFeedingOverride("child-feeding").value?.formulaVolumeMl, 120);
  assert.equal(getOfflineCareActions()[0]?.kind, "feeding");

  const stopped = queueOfflineFeedingStop({
    childId: "child-feeding",
    recordId: started.id,
    payload: { note: "Done" },
  });

  assert.equal(stopped?.status, "completed");
  assert.equal(getOfflineFeedingOverride("child-feeding").value, null);
  assert.equal(getOfflineCareActions().length, 2);
  assert.equal(
    getOfflineCareActions()[1]?.createdAt,
    getCurrentDeviceTimestampIso(new Date(getOfflineCareActions()[1]!.createdAt))
  );
});

test("offline illness start/stop stores active episode locally", () => {
  const started = queueOfflineIllnessStart({
    childId: "child-illness",
    currentAccountId: "acc-3",
    payload: {
      started_at: "2026-04-23T10:00:00.000Z",
      title: "Fever",
      medication_mode: "guided",
      note: "Observed after nap",
      member_account_ids: ["acc-3"],
      temperatures: [{ value_celsius: 38.2 }],
      administrations: [],
      comments: [{ text: "Started suddenly" }],
      medication_plans: [],
    },
  });

  assert.equal(started.status, "active");
  assert.equal(getOfflineIllnessOverride("child-illness").value?.title, "Fever");
  assert.equal(getOfflineCareActions()[0]?.kind, "illness");

  const stopped = queueOfflineIllnessStop({
    childId: "child-illness",
    episodeId: started.id,
  });

  assert.equal(stopped?.status, "closed");
  assert.equal(getOfflineIllnessOverride("child-illness").value, null);
  assert.equal(getOfflineCareActions().length, 2);
  assert.equal(
    getOfflineCareActions()[1]?.createdAt,
    getCurrentDeviceTimestampIso(new Date(getOfflineCareActions()[1]!.createdAt))
  );
});

test("clearAllOfflineCareOverrides resets active sleep, feeding, and illness projections", () => {
  queueOfflineSleepStart({
    childId: "child-sleep",
    currentAccountId: "acc-1",
  });
  queueOfflineFeedingStart({
    childId: "child-feeding",
    currentAccountId: "acc-2",
    payload: {
      feeding_type: "formula",
      formula_volume_ml: 90,
    },
  });
  queueOfflineIllnessStart({
    childId: "child-illness",
    currentAccountId: "acc-3",
    payload: {
      started_at: "2026-04-23T10:00:00.000Z",
      medication_mode: "guided",
      temperatures: [],
      administrations: [],
      comments: [],
      medication_plans: [],
    },
  });

  clearAllOfflineCareOverrides();

  assert.equal(getOfflineSleepOverride("child-sleep").hasOverride, false);
  assert.equal(getOfflineFeedingOverride("child-feeding").hasOverride, false);
  assert.equal(getOfflineIllnessOverride("child-illness").hasOverride, false);
});

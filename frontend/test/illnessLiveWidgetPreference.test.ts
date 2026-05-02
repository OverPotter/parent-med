import test from "node:test";
import assert from "node:assert/strict";
import {
  isIllnessLiveWidgetEnabled,
  setIllnessLiveWidgetEnabled,
  subscribeIllnessLiveWidgetPreferences,
} from "../src/shared/utils/illnessLiveWidgetPreference.js";

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

function installWindowMock() {
  const eventTarget = new EventTarget();
  const windowMock = Object.assign(eventTarget, {
    localStorage: createStorageMock(),
  });
  const host = globalThis as typeof globalThis & {
    window?: typeof windowMock;
  };
  const previousWindow = host.window;
  Object.defineProperty(globalThis, "window", {
    value: windowMock,
    configurable: true,
  });

  return () => {
    Object.defineProperty(globalThis, "window", {
      value: previousWindow,
      configurable: true,
    });
  };
}

test("illness live widget defaults to enabled for creator and disabled for other members", () => {
  const restoreWindow = installWindowMock();

  try {
    const episode = {
      id: "episode-1",
      createdByAccountId: "account-1",
    };

    assert.equal(isIllnessLiveWidgetEnabled(episode, "account-1"), true);
    assert.equal(isIllnessLiveWidgetEnabled(episode, "account-2"), false);
  } finally {
    restoreWindow();
  }
});

test("illness live widget uses explicit stored preference over creator default", () => {
  const restoreWindow = installWindowMock();

  try {
    setIllnessLiveWidgetEnabled({
      episodeId: "episode-1",
      accountId: "account-1",
      enabled: false,
    });

    assert.equal(
      isIllnessLiveWidgetEnabled(
        {
          id: "episode-1",
          createdByAccountId: "account-1",
        },
        "account-1"
      ),
      false
    );
  } finally {
    restoreWindow();
  }
});

test("illness live widget subscribers are notified when local preference changes", async () => {
  const restoreWindow = installWindowMock();

  try {
    await new Promise<void>((resolve) => {
      const unsubscribe = subscribeIllnessLiveWidgetPreferences(() => {
        unsubscribe();
        resolve();
      });

      setIllnessLiveWidgetEnabled({
        episodeId: "episode-1",
        accountId: "account-1",
        enabled: true,
      });
    });
  } finally {
    restoreWindow();
  }
});

test("illness live widget preference is scoped to account and episode", () => {
  const restoreWindow = installWindowMock();

  try {
    setIllnessLiveWidgetEnabled({
      episodeId: "episode-1",
      accountId: "account-2",
      enabled: true,
    });

    assert.equal(
      isIllnessLiveWidgetEnabled(
        {
          id: "episode-1",
          createdByAccountId: "account-1",
        },
        "account-2"
      ),
      true
    );
    assert.equal(
      isIllnessLiveWidgetEnabled(
        {
          id: "episode-1",
          createdByAccountId: "account-1",
        },
        "account-3"
      ),
      false
    );
    assert.equal(
      isIllnessLiveWidgetEnabled(
        {
          id: "episode-2",
          createdByAccountId: "account-1",
        },
        "account-2"
      ),
      false
    );
  } finally {
    restoreWindow();
  }
});

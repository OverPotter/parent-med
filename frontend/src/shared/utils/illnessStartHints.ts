import { getLocalIsoDate } from "./date.js";

const STORAGE_KEY = "pillpath-illness-start-hints-v1";

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

type IllnessStartHint = {
  childId: string;
  episodeId: string;
  startedAt: string;
};

type IllnessStartHintMap = Record<string, IllnessStartHint>;

function hasWindow(): boolean {
  const host = globalThis as typeof globalThis & { window?: { localStorage?: StorageLike } };
  return typeof host.window !== "undefined";
}

function readHints(): IllnessStartHintMap {
  if (!hasWindow()) {
    return {};
  }

  try {
    const host = globalThis as typeof globalThis & { window?: { localStorage?: StorageLike } };
    const raw = host.window?.localStorage?.getItem(STORAGE_KEY) ?? null;
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as IllnessStartHintMap | null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeHints(value: IllnessStartHintMap): void {
  if (!hasWindow()) {
    return;
  }

  const host = globalThis as typeof globalThis & { window?: { localStorage?: StorageLike } };
  host.window?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function getIllnessStartHint(childId: string): IllnessStartHint | null {
  return readHints()[childId] ?? null;
}

export function setIllnessStartHint(input: IllnessStartHint): void {
  const next = readHints();
  next[input.childId] = input;
  writeHints(next);
}

export function clearIllnessStartHint(childId: string): void {
  const next = readHints();
  delete next[childId];
  writeHints(next);
}

export function shouldKeepIllnessTimerHint(startedAt: string, now = new Date()): boolean {
  return startedAt.trim() === getLocalIsoDate(now);
}

export function resolveIllnessStartedAt(
  childId: string,
  episodeId: string,
  startedAt: string | null | undefined
): string | null {
  const rawStartedAt = (startedAt ?? "").trim();
  if (!rawStartedAt) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawStartedAt)) {
    return rawStartedAt;
  }

  const hint = getIllnessStartHint(childId);
  if (!hint || hint.episodeId !== episodeId) {
    return rawStartedAt;
  }

  return hint.startedAt;
}

import { Asset } from "expo-asset";
import { illnessAssets } from "../features/illness/assets";
import { childrenScreenAssets } from "../redesign/screens/children/manifest";
import { redesignBackgrounds } from "../redesign/shared/backgrounds";
import { redesignSharedIcons } from "../redesign/shared/icons";

function collectModules(value: unknown, bucket: number[]) {
  if (typeof value === "number") {
    bucket.push(value);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const nested of Object.values(value)) {
    collectModules(nested, bucket);
  }
}

function getMobileUiAssetModules() {
  const modules: number[] = [];
  collectModules(childrenScreenAssets, modules);
  collectModules(redesignSharedIcons, modules);
  collectModules(redesignBackgrounds, modules);
  collectModules(illnessAssets, modules);
  return Array.from(new Set(modules));
}

export async function preloadMobileUiAssets() {
  const modules = getMobileUiAssetModules();
  if (modules.length === 0) {
    return;
  }

  await Asset.loadAsync(modules);
}

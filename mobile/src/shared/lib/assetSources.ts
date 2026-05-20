import type { ImageSourcePropType } from "react-native";

export function getLocalAssetDefaultSource(
  source: ImageSourcePropType | null | undefined,
) {
  return typeof source === "number" ? source : undefined;
}

export function dedupeAssetModules(
  sources: Array<ImageSourcePropType | null | undefined>,
) {
  const seen = new Set<string>();
  const uniqueSources: ImageSourcePropType[] = [];

  sources.forEach((source) => {
    if (!source) {
      return;
    }

    const key =
      typeof source === "number" ? `module:${source}` : JSON.stringify(source);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    uniqueSources.push(source);
  });

  return uniqueSources;
}

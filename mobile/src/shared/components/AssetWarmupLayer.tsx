import { useMemo } from "react";
import { useEffect } from "react";
import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";
import { dedupeAssetModules } from "../lib/assetSources";

type AssetWarmupLayerProps = {
  active: boolean;
  assetModules: Array<ImageSourcePropType | null | undefined>;
};

export function AssetWarmupLayer({
  active,
  assetModules,
}: AssetWarmupLayerProps) {
  const uniqueAssetModules = useMemo(
    () => dedupeAssetModules(assetModules),
    [assetModules],
  );

  useEffect(() => {
    if (!active || uniqueAssetModules.length === 0) {
      return;
    }

    const localModuleIds = uniqueAssetModules.filter(
      (source): source is number => typeof source === "number",
    );

    if (localModuleIds.length === 0) {
      return;
    }

    Promise.all(
      localModuleIds.map(async (moduleId) => {
        const resolved = Image.resolveAssetSource(moduleId);

        if (resolved?.uri) {
          await Image.prefetch(resolved.uri).catch(() => false);
        }
      }),
    ).catch(() => {});
  }, [active, uniqueAssetModules]);

  if (!active || uniqueAssetModules.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.layer}>
      <View style={styles.cacheStrip}>
        {uniqueAssetModules.map((moduleSource, index) => (
          <Image
            key={`${String(moduleSource)}-${index}`}
            source={moduleSource}
            style={styles.image}
            resizeMode="contain"
            fadeDuration={0}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    overflow: "hidden",
  },
  cacheStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 2000,
    minHeight: 2000,
  },
  image: {
    width: 96,
    height: 96,
  },
});

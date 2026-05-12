import { useMemo } from "react";
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
    height: 112,
    opacity: 0.01,
    overflow: "hidden",
    zIndex: -1,
  },
  cacheStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 1120,
    height: 112,
  },
  image: {
    width: 96,
    height: 96,
  },
});

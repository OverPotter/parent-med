import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  buildSmoothCurveSegments,
  type MiniChartPoint,
} from "../lib/miniChartCurve";

type MiniTrendChartProps = {
  points: MiniChartPoint[];
  topLabel: string;
  bottomLabel: string;
  gridColor: string;
  axisLabelColor: string;
  curveColor: string;
  curveShadowColor: string;
};

export function MiniTrendChart({
  points,
  topLabel,
  bottomLabel,
  gridColor,
  axisLabelColor,
  curveColor,
  curveShadowColor,
}: MiniTrendChartProps) {
  const { sampledPoints, sampledSegments } = useMemo(() => {
    const width = 96;
    const height = 74;
    const scaled = points.map((point) => ({
      id: point.id,
      x: point.x * width,
      y: point.y * height,
    }));

    return buildSmoothCurveSegments(scaled, 12);
  }, [points]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.gridLineTop, { borderColor: gridColor }]} />
      <View style={[styles.gridLineBottom, { borderColor: gridColor }]} />
      <View style={styles.axisTopLabel}>
        <Text style={[styles.axisLabel, { color: axisLabelColor }]}>{topLabel}</Text>
      </View>
      <View style={styles.axisBottomLabel}>
        <Text style={[styles.axisLabel, { color: axisLabelColor }]}>{bottomLabel}</Text>
      </View>
      <View style={styles.canvas}>
        {sampledSegments.map((segment) => (
          <View
            key={`shadow-${segment.id}`}
            style={[
              styles.curveShadowSegment,
              {
                width: segment.length + 6,
                left: segment.x - 3,
                top: segment.y + 4,
                backgroundColor: curveShadowColor,
                transform: [{ rotate: `${segment.angle}rad` }],
              },
            ]}
          />
        ))}
        {sampledSegments.map((segment) => (
          <View
            key={segment.id}
            style={[
              styles.curveSegment,
              {
                width: segment.length,
                left: segment.x,
                top: segment.y,
                backgroundColor: curveColor,
                transform: [{ rotate: `${segment.angle}rad` }],
              },
            ]}
          />
        ))}
        {sampledPoints.map((point) => (
          <View
            key={point.id}
            style={[
              styles.point,
              {
                left: point.x,
                top: point.y,
                backgroundColor: curveColor,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 132,
    height: 88,
    position: "relative",
    marginTop: 4,
  },
  canvas: {
    position: "absolute",
    left: 0,
    right: 22,
    top: 0,
    bottom: 0,
  },
  gridLineTop: {
    position: "absolute",
    left: 0,
    right: 24,
    top: 20,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  gridLineBottom: {
    position: "absolute",
    left: 0,
    right: 24,
    bottom: 8,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  axisTopLabel: {
    position: "absolute",
    right: 0,
    top: 8,
  },
  axisBottomLabel: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  axisLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "500",
  },
  curveShadowSegment: {
    position: "absolute",
    height: 6,
    borderRadius: 999,
    opacity: 0.45,
  },
  curveSegment: {
    position: "absolute",
    height: 6,
    borderRadius: 999,
  },
  point: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    marginLeft: -5,
    marginTop: -5,
  },
});

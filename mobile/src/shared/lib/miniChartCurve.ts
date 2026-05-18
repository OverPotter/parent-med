export type MiniChartPoint = {
  id: string;
  x: number;
  y: number;
};

export type MiniChartSegment = {
  id: string;
  x: number;
  y: number;
  length: number;
  angle: number;
};

export function buildSmoothCurveSegments(
  points: MiniChartPoint[],
  stepsPerSegment: number,
) {
  const sampledPoints = points;
  const smoothedPoints = buildSmoothSamples(points, stepsPerSegment);
  const sampledSegments = buildSegments(smoothedPoints);

  return {
    sampledPoints,
    sampledSegments,
  };
}

function buildSmoothSamples(points: MiniChartPoint[], stepsPerSegment: number) {
  if (points.length < 2) {
    return points;
  }

  const samples: MiniChartPoint[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)] ?? p2;

    for (let step = 0; step < stepsPerSegment; step += 1) {
      const t = step / stepsPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        0.5 *
        ((2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 *
        ((2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

      samples.push({
        id: `${p1.id}-${step}`,
        x,
        y,
      });
    }
  }

  samples.push(points[points.length - 1]);
  return samples;
}

function buildSegments(points: MiniChartPoint[]) {
  const segments: MiniChartSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 1) {
      continue;
    }

    segments.push({
      id: `segment-${index}`,
      x: start.x,
      y: start.y,
      length,
      angle: Math.atan2(dy, dx),
    });
  }

  return segments;
}

type MetricName =
  | "apiRequest"
  | "cacheHit"
  | "cacheMiss"
  | "cacheStaleHit"
  | "deduplicatedRequest"
  | "prefetchStarted"
  | "prefetchCompleted"
  | "prefetchFailed";

interface TimingSummary {
  count: number;
  totalMs: number;
  maxMs: number;
}

interface DriveMetricsSnapshot {
  counters: Record<MetricName, number>;
  timings: Record<string, TimingSummary>;
}

const enabled =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_DRIVE_PERF_DEBUG === "1";

const counters: Record<MetricName, number> = {
  apiRequest: 0,
  cacheHit: 0,
  cacheMiss: 0,
  cacheStaleHit: 0,
  deduplicatedRequest: 0,
  prefetchStarted: 0,
  prefetchCompleted: 0,
  prefetchFailed: 0,
};
const timings = new Map<string, TimingSummary>();

export function incrementDriveMetric(name: MetricName): void {
  if (!enabled) return;
  counters[name] += 1;
}

function recordDriveTiming(name: string, durationMs: number): void {
  if (!enabled) return;
  const current = timings.get(name) ?? { count: 0, totalMs: 0, maxMs: 0 };
  timings.set(name, {
    count: current.count + 1,
    totalMs: current.totalMs + durationMs,
    maxMs: Math.max(current.maxMs, durationMs),
  });
}

export async function measureDriveTiming<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const started = performance.now();
  try {
    return await fn();
  } finally {
    recordDriveTiming(name, performance.now() - started);
  }
}

function getDriveMetrics(): DriveMetricsSnapshot {
  return {
    counters: { ...counters },
    timings: Object.fromEntries(timings),
  };
}

if (typeof window !== "undefined" && enabled) {
  (
    window as unknown as {
      __nextNotePadDriveMetrics?: () => DriveMetricsSnapshot;
    }
  ).__nextNotePadDriveMetrics = getDriveMetrics;
}

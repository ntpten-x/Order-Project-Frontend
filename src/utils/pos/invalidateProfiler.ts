type InvalidateCounts = Record<string, number>;

export interface InvalidateMetricsSnapshot {
  requestedTotal: number;
  executedTotal: number;
  requestedByKey: InvalidateCounts;
  executedByKey: InvalidateCounts;
}

declare global {
  interface Window {
    __POS_PERF_DISABLE_INVALIDATE_DEBOUNCE__?: boolean;
    __POS_PERF_INVALIDATE_METRICS__?: InvalidateMetricsSnapshot;
  }
}

function createEmptySnapshot(): InvalidateMetricsSnapshot {
  return {
    requestedTotal: 0,
    executedTotal: 0,
    requestedByKey: {},
    executedByKey: {},
  };
}

function ensureSnapshot(): InvalidateMetricsSnapshot | null {
  if (typeof window === "undefined") return null;
  if (!window.__POS_PERF_INVALIDATE_METRICS__) {
    window.__POS_PERF_INVALIDATE_METRICS__ = createEmptySnapshot();
  }
  return window.__POS_PERF_INVALIDATE_METRICS__;
}

function normalizeKey(queryKey: readonly unknown[]): string {
  const first = queryKey[0];
  if (typeof first === "string") return first;
  return JSON.stringify(queryKey);
}

function bumpCount(store: InvalidateCounts, key: string) {
  store[key] = (store[key] ?? 0) + 1;
}

export function shouldDisableInvalidateDebounce(): boolean {
  if (typeof window === "undefined") return false;
  return window.__POS_PERF_DISABLE_INVALIDATE_DEBOUNCE__ === true;
}

export function trackInvalidateRequested(queryKey: readonly unknown[]) {
  const snapshot = ensureSnapshot();
  if (!snapshot) return;
  const normalizedKey = normalizeKey(queryKey);
  snapshot.requestedTotal += 1;
  bumpCount(snapshot.requestedByKey, normalizedKey);
}

export function trackInvalidateExecuted(queryKey: readonly unknown[]) {
  const snapshot = ensureSnapshot();
  if (!snapshot) return;
  const normalizedKey = normalizeKey(queryKey);
  snapshot.executedTotal += 1;
  bumpCount(snapshot.executedByKey, normalizedKey);
}

export function resetInvalidateMetrics() {
  if (typeof window === "undefined") return;
  window.__POS_PERF_INVALIDATE_METRICS__ = createEmptySnapshot();
}

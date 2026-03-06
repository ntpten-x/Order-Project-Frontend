#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const reportPath =
  process.env.PERF_REPORT_PATH ||
  path.resolve(projectRoot, "test-results", "perf-pos-main", "pos-main-before-after.json");

const burstApiMax = Number(process.env.PERF_THRESHOLD_BURST_API_MAX || 27);
const burstInvalidateExecutedMax = Number(
  process.env.PERF_THRESHOLD_BURST_INVALIDATE_EXECUTED_MAX || 72
);
const burstSocketEventsMinFromEnv = process.env.PERF_THRESHOLD_BURST_SOCKET_EVENTS_MIN;
const reconnectApiRequestsMax = Number(process.env.PERF_THRESHOLD_RECONNECT_API_MAX || 60);

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function formatCheck(ok, label, actual, expected) {
  const status = ok ? "PASS" : "FAIL";
  return `[${status}] ${label}: actual=${actual} expected=${expected}`;
}

async function main() {
  const raw = await fs.readFile(reportPath, "utf8");
  const report = JSON.parse(raw);
  const after = report?.after || {};

  const burstApiRequests = toNumber(after.burstApiRequests);
  const burstInvalidateExecuted = toNumber(after.burstInvalidateExecuted);
  const burstSocketEventsTotal = toNumber(after.burstSocketEventsTotal);
  const burstMutationRequests = toNumber(after.burstMutationRequests);
  const reconnectApiRequests = toNumber(after.reconnectApiRequests);
  const burstSocketEventsMin = Number(
    burstSocketEventsMinFromEnv ||
      Math.max(20, Math.floor(burstMutationRequests * 0.8))
  );

  const checks = [
    {
      ok: burstApiRequests <= burstApiMax,
      label: "burstApiRequests",
      actual: burstApiRequests,
      expected: `<= ${burstApiMax}`,
    },
    {
      ok: burstInvalidateExecuted <= burstInvalidateExecutedMax,
      label: "burstInvalidateExecuted",
      actual: burstInvalidateExecuted,
      expected: `<= ${burstInvalidateExecutedMax}`,
    },
    {
      ok: burstSocketEventsTotal >= burstSocketEventsMin,
      label: "burstSocketEventsTotal",
      actual: burstSocketEventsTotal,
      expected: `>= ${burstSocketEventsMin}`,
    },
    {
      ok: reconnectApiRequests <= reconnectApiRequestsMax,
      label: "reconnectApiRequests",
      actual: reconnectApiRequests,
      expected: `<= ${reconnectApiRequestsMax}`,
    },
  ];

  console.log(`[perf-baseline] report: ${reportPath}`);
  console.log(`[perf-baseline] compareMode: ${report?.compareMode || "unknown"}`);
  checks.forEach((check) => {
    console.log(formatCheck(check.ok, check.label, check.actual, check.expected));
  });

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    const summary = failed.map((item) => item.label).join(", ");
    throw new Error(`baseline threshold failed: ${summary}`);
  }

  console.log("[perf-baseline] all thresholds passed");
}

main().catch((error) => {
  console.error(`[perf-baseline] failed: ${error.message}`);
  process.exit(1);
});

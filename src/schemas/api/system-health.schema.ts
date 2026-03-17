import { z } from "zod";

const HealthLevelSchema = z.enum(["ok", "warn", "error"]);

export const HealthCheckItemSchema = z.object({
    key: z.string(),
    title: z.string(),
    level: HealthLevelSchema,
    summary: z.string(),
    checkedAt: z.string(),
    latencyMs: z.number().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
});

export const IndexCheckItemSchema = z.object({
    table: z.string(),
    columns: z.array(z.string()),
    matched: z.boolean(),
    reason: z.string(),
});

export const SlowEndpointItemSchema = z.object({
    method: z.string(),
    path: z.string(),
    requestCount: z.number(),
    averageResponseMs: z.number(),
    p95ResponseMs: z.number(),
    p99ResponseMs: z.number(),
    maxResponseMs: z.number(),
    errorRatePercent: z.number(),
});

const PerformanceTrafficSegmentSchema = z.object({
    level: HealthLevelSchema,
    summary: z.string(),
    averageResponseMs: z.number(),
    p95ResponseMs: z.number(),
    p99ResponseMs: z.number(),
    sampleSize: z.number(),
    topSlowEndpoints: z.array(SlowEndpointItemSchema),
});

const PerformanceTrafficSnapshotSchema = z.object({
    averageResponseMs: z.number(),
    p95ResponseMs: z.number(),
    p99ResponseMs: z.number(),
    sampleSize: z.number(),
    topSlowEndpoints: z.array(SlowEndpointItemSchema),
});

export const SystemHealthReportSchema = z.object({
    overallLevel: HealthLevelSchema,
    checkedAt: z.string(),
    uptimeSeconds: z.number(),
    environment: z.object({
        nodeEnv: z.string(),
        hostname: z.string(),
        pid: z.number(),
    }),
    readiness: z.array(HealthCheckItemSchema),
    security: z.array(HealthCheckItemSchema),
    jobs: z.array(HealthCheckItemSchema),
    performance: z.object({
        level: HealthLevelSchema,
        summary: z.string(),
        averageResponseMs: z.number(),
        p95ResponseMs: z.number(),
        p99ResponseMs: z.number(),
        sampleSize: z.number(),
        topSlowEndpoints: z.array(SlowEndpointItemSchema),
        indexChecks: z.array(IndexCheckItemSchema),
        adminAuth: PerformanceTrafficSegmentSchema,
        allTraffic: PerformanceTrafficSnapshotSchema,
        classification: z.object({
            userFacingIncludePaths: z.array(z.string()),
            adminAuthIncludePaths: z.array(z.string()),
            excludedPaths: z.array(z.string()),
        }),
    }),
    integration: z.object({
        frontendProxyPrefix: z.string(),
        allowedFrontendOrigins: z.array(z.string()),
        corsCredentialsEnabled: z.boolean(),
        backendApiPrefix: z.string(),
        healthEndpoint: z.string(),
        allowedProxyPaths: z.array(z.string()),
        authMode: z.string(),
    }),
    warnings: z.array(z.string()),
});

export type HealthLevel = "ok" | "warn" | "error";

export interface HealthCheckItem {
    key: string;
    title: string;
    level: HealthLevel;
    summary: string;
    checkedAt: string;
    latencyMs?: number;
    details?: Record<string, unknown>;
}

export interface IndexCheckItem {
    table: string;
    columns: string[];
    matched: boolean;
    reason: string;
}

export interface SlowEndpointItem {
    method: string;
    path: string;
    requestCount: number;
    averageResponseMs: number;
    p95ResponseMs: number;
    p99ResponseMs: number;
    maxResponseMs: number;
    errorRatePercent: number;
}

export interface SystemHealthReport {
    overallLevel: HealthLevel;
    checkedAt: string;
    uptimeSeconds: number;
    environment: {
        nodeEnv: string;
        hostname: string;
        pid: number;
    };
    readiness: HealthCheckItem[];
    security: HealthCheckItem[];
    jobs: HealthCheckItem[];
    performance: {
        level: HealthLevel;
        summary: string;
        averageResponseMs: number;
        p95ResponseMs: number;
        p99ResponseMs: number;
        sampleSize: number;
        topSlowEndpoints: SlowEndpointItem[];
        indexChecks: IndexCheckItem[];
    };
    integration: {
        frontendProxyPrefix: string;
        allowedFrontendOrigins: string[];
        corsCredentialsEnabled: boolean;
        backendApiPrefix?: string;
        healthEndpoint?: string;
        allowedProxyPaths?: string[];
        authMode?: string;
    };
    warnings: string[];
}

"use client";

export type SocketTransport = "websocket" | "polling";

function sanitizeSocketBaseUrl(raw?: string): string {
    const value = raw?.trim();
    if (!value) return "";

    try {
        const parsed = typeof window !== "undefined" ? new URL(value, window.location.origin) : new URL(value);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        return value.replace(/\/+$/, "");
    }
}

function sanitizeSocketPath(raw?: string): string {
    const fallback = "/socket.io";
    const value = (raw || fallback).trim();
    if (!value) return fallback;

    const normalized = value.replace(/\\/g, "/");

    if (/^[a-zA-Z]:\//.test(normalized)) {
        return normalized.includes("/socket.io") ? "/socket.io" : fallback;
    }

    if (normalized.includes("://")) {
        try {
            const parsed = new URL(normalized);
            return sanitizeSocketPath(parsed.pathname);
        } catch {
            return fallback;
        }
    }

    const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return withLeadingSlash || fallback;
}

export function resolveSocketTransports(): SocketTransport[] {
    const raw = (process.env.NEXT_PUBLIC_SOCKET_TRANSPORTS || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    const transports = raw.filter(
        (item): item is SocketTransport => item === "websocket" || item === "polling"
    );

    if (transports.length === 0) {
        return ["websocket", "polling"];
    }

    return Array.from(new Set(transports));
}

function enforceSecureSocketUrl(rawUrl: string): string {
    if (typeof window === "undefined") return rawUrl;
    if (window.location.protocol !== "https:") return rawUrl;

    try {
        const parsed = new URL(rawUrl, window.location.origin);
        if (parsed.protocol === "http:") {
            parsed.protocol = "https:";
            return `${parsed.protocol}//${parsed.host}`;
        }
    } catch {
        return rawUrl;
    }

    return rawUrl;
}

function inferLocalBackendOrigin(): string {
    if (typeof window === "undefined") return "";

    const { protocol, hostname, port } = window.location;
    const host = hostname.toLowerCase();
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (!isLocalHost) return "";

    if (port === "8001") {
        return `${protocol}//${hostname}:8002`;
    }

    if (port === "3001") {
        return `${protocol}//${hostname}:3000`;
    }

    return "";
}

export function resolveSocketConfig(): { url: string; path: string } {
    const explicitSocketUrl = sanitizeSocketBaseUrl(process.env.NEXT_PUBLIC_SOCKET_URL);
    const backendApiUrl = sanitizeSocketBaseUrl(process.env.NEXT_PUBLIC_BACKEND_API);
    const publicApiUrl = sanitizeSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const socketPath = sanitizeSocketPath(process.env.NEXT_PUBLIC_SOCKET_PATH);

    let url = explicitSocketUrl || backendApiUrl || publicApiUrl || "";

    if (typeof window !== "undefined") {
        const currentProto = window.location.protocol;
        const isSecure = currentProto === "https:";

        const isIp = (value: string) => /^(https?:\/\/)?(\d{1,3}\.){3}\d{1,3}(:\d+)?/.test(value);
        const isLocal = (value: string) =>
            value.includes("localhost") || value.includes("127.0.0.1") || value.includes(".local");

        if (isSecure && url && isIp(url) && !isLocal(url)) {
            console.warn("[Socket] HTTPS detected but SOCKET_URL is an IP. Falling back to current origin to avoid SSL mismatch.");
            url = window.location.origin;
        }

        if (!url) {
            url = inferLocalBackendOrigin() || window.location.origin;
        }
    }

    if (!url) {
        url = "http://localhost:4000";
    }

    return {
        url: enforceSecureSocketUrl(url),
        path: socketPath,
    };
}

const HTTP_URL_PREFIX = /^https?:\/\//i;
const BLOB_URL_PREFIX = /^blob:/i;
const RELATIVE_URL_PREFIX = /^(\/|\.\/|\.\.\/)/;
const RAW_BASE64_PAYLOAD_PREFIX = /^[A-Za-z0-9+/_=\-\s]+$/;
const DATA_IMAGE_PREFIX = /^data:image\/[a-zA-Z0-9.+-]+/i;
const BASE64_BODY_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

function decodePercentEncoded(value: string): string {
    if (!/%[0-9A-Fa-f]{2}/.test(value)) return value;
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function normalizeBase64Payload(payload: string): string {
    const decoded = decodePercentEncoded(payload);
    let normalized = decoded
        .replace(/^base64,/i, "")
        .replace(/\s+/g, "")
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    // Keep only base64-safe chars to avoid invalid data URI payloads.
    normalized = normalized.replace(/[^A-Za-z0-9+/=]/g, "");
    if (!normalized) return "";

    // Remove all existing padding and re-create canonical padding.
    normalized = normalized.replace(/=+/g, "");
    if (!normalized) return "";

    const mod = normalized.length % 4;
    if (mod === 1) return "";
    if (mod > 0) {
        normalized += "=".repeat(4 - mod);
    }

    if (!BASE64_BODY_PATTERN.test(normalized)) return "";

    return normalized;
}

function normalizeDataImageSource(source: string): string {
    let normalized = decodePercentEncoded(source.trim()).replace(/^\uFEFF/, "");

    // Handle malformed data URL without comma after ";base64"
    if (!normalized.includes(",") && /;base64/i.test(normalized)) {
        normalized = normalized.replace(/;base64\s*/i, ";base64,");
    }

    // Handle malformed data URL with missing ";base64" but payload appended after mime type.
    if (!normalized.includes(",") && DATA_IMAGE_PREFIX.test(normalized)) {
        normalized = normalized.replace(
            /^(data:image\/[a-zA-Z0-9.+-]+)(.*)$/i,
            (_m, prefix: string, rest: string) => `${prefix};base64,${rest.replace(/^;*/, "")}`
        );
    }

    const commaIndex = normalized.indexOf(",");
    if (commaIndex <= 0) return normalized;

    const metadata = normalized.slice(0, commaIndex).replace(/\s+/g, "");
    const payload = normalizeBase64Payload(normalized.slice(commaIndex + 1));
    if (!payload) return "";

    const normalizedMetadata = /;base64$/i.test(metadata) ? metadata : `${metadata};base64`;
    return `${normalizedMetadata},${payload}`;
}

function looksLikeRawBase64Payload(value: string): boolean {
    if (value.length < 64) return false;
    return RAW_BASE64_PAYLOAD_PREFIX.test(value);
}

function toDataPngSourceFromRawBase64(value: string): string {
    const payload = normalizeBase64Payload(value);
    if (!payload) return "";
    return `data:image/png;base64,${payload}`;
}

function normalizeGoogleDriveImageSource(source: string): string {
    // Support common Google Drive share URLs by converting them to direct "uc" URLs.
    // Example target:
    // https://drive.google.com/uc?export=view&id=FILE_ID
    //
    // Note: Some Drive files may still require a confirm token for large files; in that case
    // we still keep the original URL (the UI can fall back to <img> without Next optimization).
    try {
        const url = new URL(source);
        const host = url.hostname.toLowerCase();
        if (host !== "drive.google.com") return source;

        // Extract file id from query or pathname variants.
        let id = url.searchParams.get("id") || "";
        if (!id) {
            const m = url.pathname.match(/^\/file\/d\/([^/]+)/i);
            if (m?.[1]) id = m[1];
        }
        if (!id) return source;

        // If already a /uc link, preserve existing query params (e.g. confirm=...).
        if (url.pathname.toLowerCase() === "/uc") {
            // Prefer export=view for <img> usage; export=download is often served as attachment/octet-stream.
            const exportParam = (url.searchParams.get("export") || "").toLowerCase();
            if (!exportParam || exportParam === "download") url.searchParams.set("export", "view");
            if (!url.searchParams.get("id")) url.searchParams.set("id", id);
            return url.toString();
        }

        // Convert other Drive link shapes to /uc.
        const next = new URL("https://drive.google.com/uc");
        next.searchParams.set("export", "view");
        next.searchParams.set("id", id);
        return next.toString();
    } catch {
        return source;
    }
}

export function normalizeImageSource(source?: string | null): string {
    const value = String(source ?? "")
        .replace(/^\uFEFF/, "")
        .trim()
        .replace(/^['"]|['"]$/g, "");
    if (!value) return "";

    if (DATA_IMAGE_PREFIX.test(value)) {
        return normalizeDataImageSource(value);
    }

    // Support raw base64 payload from API/logo field by converting to a PNG data URL.
    if (looksLikeRawBase64Payload(value)) {
        return toDataPngSourceFromRawBase64(value);
    }

    if (HTTP_URL_PREFIX.test(value)) {
        return normalizeGoogleDriveImageSource(value);
    }

    return value;
}

export function isGoogleDriveImageSource(source?: string | null): boolean {
    const value = normalizeImageSource(source);
    if (!HTTP_URL_PREFIX.test(value)) return false;
    try {
        const url = new URL(value);
        return url.hostname.toLowerCase() === "drive.google.com";
    } catch {
        return false;
    }
}

export function isSupportedImageSource(source?: string | null): boolean {
    const value = normalizeImageSource(source);
    if (!value) return false;

    if (DATA_IMAGE_PREFIX.test(value)) {
        const commaIndex = value.indexOf(",");
        if (commaIndex <= 0) return false;
        const metadata = value.slice(0, commaIndex);
        const payload = value.slice(commaIndex + 1);
        if (!/;base64$/i.test(metadata)) return false;
        if (!payload || payload.length < 8) return false;
        return BASE64_BODY_PATTERN.test(payload) && payload.length % 4 === 0;
    }

    return (
        HTTP_URL_PREFIX.test(value) ||
        BLOB_URL_PREFIX.test(value) ||
        RELATIVE_URL_PREFIX.test(value)
    );
}

export function isInlineImageSource(source?: string | null): boolean {
    const value = normalizeImageSource(source);
    return DATA_IMAGE_PREFIX.test(value) || BLOB_URL_PREFIX.test(value);
}

export function resolveImageSource(source?: string | null, fallback?: string): string | null {
    const value = normalizeImageSource(source);
    if (isSupportedImageSource(value)) return value;
    const fallbackValue = normalizeImageSource(fallback);
    return isSupportedImageSource(fallbackValue) ? fallbackValue : null;
}

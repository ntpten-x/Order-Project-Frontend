const DATA_IMAGE_PREFIX = /^data:image\/[a-zA-Z0-9.+-]+(?:;[a-zA-Z0-9!#$&^_.+-]+=[^;,]+)*(?:;base64)?,/i;
const HTTP_URL_PREFIX = /^https?:\/\//i;
const BLOB_URL_PREFIX = /^blob:/i;
const RELATIVE_URL_PREFIX = /^(\/|\.\/|\.\.\/)/;

function normalizeDataImageSource(source: string): string {
    const commaIndex = source.indexOf(",");
    if (commaIndex <= 0) return source;

    const metadata = source.slice(0, commaIndex).replace(/\s+/g, "");
    const payload = source.slice(commaIndex + 1).replace(/\s+/g, "");
    return `${metadata},${payload}`;
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
    const value = String(source ?? "").trim();
    if (!value) return "";

    if (/^data:image\//i.test(value)) {
        return normalizeDataImageSource(value);
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
        return value.slice(commaIndex + 1).length > 0;
    }

    return (
        HTTP_URL_PREFIX.test(value) ||
        BLOB_URL_PREFIX.test(value) ||
        RELATIVE_URL_PREFIX.test(value)
    );
}

export function isInlineImageSource(source?: string | null): boolean {
    const value = normalizeImageSource(source);
    return /^data:image\//i.test(value) || BLOB_URL_PREFIX.test(value);
}

export function resolveImageSource(source?: string | null, fallback?: string): string | null {
    const value = normalizeImageSource(source);
    if (isSupportedImageSource(value)) return value;
    const fallbackValue = normalizeImageSource(fallback);
    return isSupportedImageSource(fallbackValue) ? fallbackValue : null;
}

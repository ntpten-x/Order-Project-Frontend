const DATA_IMAGE_PREFIX = /^data:image\/[a-zA-Z0-9.+-]+;base64,/i;
const HTTP_URL_PREFIX = /^https?:\/\//i;
const BLOB_URL_PREFIX = /^blob:/i;
const RELATIVE_URL_PREFIX = /^(\/|\.\/|\.\.\/)/;

export function normalizeImageSource(source?: string | null): string {
    return String(source ?? "").trim();
}

export function isSupportedImageSource(source?: string | null): boolean {
    const value = normalizeImageSource(source);
    if (!value) return false;
    return (
        DATA_IMAGE_PREFIX.test(value) ||
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


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

export function normalizeImageSource(source?: string | null): string {
    const value = String(source ?? "").trim();
    if (!value) return "";

    if (/^data:image\//i.test(value)) {
        return normalizeDataImageSource(value);
    }

    return value;
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

type HeaderLike = HeadersInit | undefined;

const resolveUrl = (url: string): URL | null => {
    try {
        const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
        return new URL(url, base);
    } catch {
        return null;
    }
};

export const LOADING_DELAY_MS = 150;

export const isApiRequest = (url: string): boolean => {
    const parsed = resolveUrl(url);
    if (!parsed) return false;
    return parsed.pathname.startsWith("/api");
};

export const isCsrfEndpoint = (url: string): boolean => {
    const parsed = resolveUrl(url);
    if (!parsed) return false;
    return parsed.pathname === "/api/csrf";
};

export const hasSkipLoadingHeader = (headers: HeaderLike): boolean => {
    if (!headers) return false;
    const hdrs = new Headers(headers);
    return hdrs.has("x-skip-loading") || hdrs.has("x-no-loading");
};

export const isMutatingMethod = (method: string): boolean => {
    return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
};

export const shouldTrackRequest = (url: string, init?: RequestInit): boolean => {
    if (!isApiRequest(url)) return false;
    if (isCsrfEndpoint(url)) return false;
    if (hasSkipLoadingHeader(init?.headers)) return false;
    return true;
};

export const shouldAttachCsrf = (url: string, method: string, init?: RequestInit): boolean => {
    if (!isApiRequest(url)) return false;
    if (isCsrfEndpoint(url)) return false;
    // Attach CSRF token for ALL cookie-based requests (including GET for token generation)
    // This ensures CSRF protection works properly
    const hdrs = new Headers(init?.headers);
    if (hdrs.has("X-CSRF-Token")) return false;
    // For mutating methods, always attach CSRF token
    if (isMutatingMethod(method)) return true;
    // For GET requests, also attach if it's a cookie-based request (for token generation)
    // This helps ensure CSRF token is available for subsequent requests
    return true;
};

import { authService } from "../../services/auth.service";

const CSRF_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedToken: string | null = null;
let cachedAt = 0;
let inflight: Promise<string> | null = null;

export async function getCsrfTokenCached(forceRefresh = false): Promise<string> {
    const now = Date.now();
    if (!forceRefresh && cachedToken && now - cachedAt < CSRF_CACHE_TTL_MS) {
        return cachedToken;
    }

    if (!inflight) {
        inflight = authService.getCsrfToken()
            .then((token) => {
                cachedToken = token || "";
                cachedAt = Date.now();
                return cachedToken;
            })
            .finally(() => {
                inflight = null;
            });
    }

    return inflight;
}

export function clearCsrfTokenCache() {
    cachedToken = null;
    cachedAt = 0;
    inflight = null;
}

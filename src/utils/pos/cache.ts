type CacheEntry<T> = {
    ts: number;
    data: T;
};

const isBrowser = () => typeof window !== "undefined";

export const readCache = <T>(key: string, ttlMs: number): T | null => {
    if (!isBrowser()) return null;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        if (!parsed?.ts) return null;
        if (Date.now() - parsed.ts > ttlMs) return null;
        return parsed.data ?? null;
    } catch {
        return null;
    }
};

export const writeCache = <T>(key: string, data: T) => {
    if (!isBrowser()) return;
    try {
        const payload: CacheEntry<T> = { ts: Date.now(), data };
        window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
        // ignore write failures
    }
};

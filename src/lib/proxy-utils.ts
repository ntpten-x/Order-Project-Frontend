export function getProxyUrl(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', url: string) {
    return {
        GET: `${PROXY_CONFIGS.API_BASE_URL}${url}`,
        POST: `${PROXY_CONFIGS.API_BASE_URL}${url}`,
        PUT: `${PROXY_CONFIGS.API_BASE_URL}${url}`,
        DELETE: `${PROXY_CONFIGS.API_BASE_URL}${url}`,
        PATCH: `${PROXY_CONFIGS.API_BASE_URL}${url}`,
    }[method];
}

export const PROXY_CONFIGS = {
    get API_BASE_URL() {
        if (typeof window !== "undefined") {
            // Client-side: call Next.js Proxy
            return "/api";
        }
        // Server-side: call Backend directly
        // Backend default port is 4000
        return (
            process.env.BACKEND_API_INTERNAL ||
            process.env.NEXT_PUBLIC_BACKEND_API ||
            "http://localhost:3000"
        );
    }
}

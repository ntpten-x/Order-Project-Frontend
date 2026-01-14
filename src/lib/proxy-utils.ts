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
    API_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4000",
}
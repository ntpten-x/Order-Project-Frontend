import axios from "axios";

const api = axios.create({
    baseURL: typeof window !== "undefined"
        ? "/api"
        : (process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4000"),
    withCredentials: true, // Necessary for Cookies
    headers: {
        "Content-Type": "application/json",
    },
});

let csrfToken: string | null = null;

// Function to fetch CSRF token
const getCsrfToken = async () => {
    try {
        // Use Next.js proxy to ensure cookies are scoped to frontend domain
        const response = await fetch("/api/csrf", { credentials: "include" });
        if (!response.ok) throw new Error("CSRF fetch failed");
        const data = await response.json();
        csrfToken = data.csrfToken;
        return csrfToken;
    } catch (error) {
        console.error("Failed to fetch CSRF token", error);
        return null;
    }
};

// Request interceptor to add CSRF token
api.interceptors.request.use(async (config) => {
    // Add CSRF token for ALL requests that use cookie authentication
    // This includes both mutating (POST, PUT, DELETE, PATCH) and non-mutating (GET) requests
    // GET requests need token for CSRF token generation, mutating requests need it for protection
    
    // Check if this is a cookie-based request (not Bearer token only)
    const hasAuthHeader = config.headers?.Authorization;
    const isCookieAuth = !hasAuthHeader || config.withCredentials !== false;
    
    if (isCookieAuth) {
        // Always ensure we have a CSRF token for cookie-based requests
        if (!csrfToken) {
            const token = await getCsrfToken();
            if (token) {
                csrfToken = token;
            }
        }
        if (csrfToken) {
            config.headers = config.headers || {};
            config.headers["X-CSRF-Token"] = csrfToken;
        }
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor to retry if CSRF invalid
api.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    
    // Handle CSRF token errors (403 Forbidden)
    if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || '';
        const isCsrfError = errorMessage.toLowerCase().includes('csrf') || 
                           errorMessage.toLowerCase().includes('token required');
        
        if (isCsrfError && !originalRequest._retry) {
            originalRequest._retry = true;
            // Refresh CSRF token
            csrfToken = null;
            const token = await getCsrfToken();
            if (token) {
                csrfToken = token;
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers["X-CSRF-Token"] = csrfToken;
                // Retry the request with new token
                return api(originalRequest);
            }
        }
    }
    
    return Promise.reject(error);
});

export default api;

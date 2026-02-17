import axios from "axios";
import { getBackendErrorMessage } from "../utils/api/backendResponse";

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
let branchRecoveryInFlight = false;

const BRANCH_CONTEXT_ERROR_PATTERNS = [
    "invalid branch context",
    "selected branch is invalid",
    "assigned branch is invalid",
];

function isBranchContextError(messageText: string): boolean {
    const normalized = messageText.toLowerCase();
    return BRANCH_CONTEXT_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}

async function recoverBranchContextIfNeeded(messageText: string): Promise<void> {
    if (typeof window === "undefined" || branchRecoveryInFlight) return;
    if (!isBranchContextError(messageText)) return;

    branchRecoveryInFlight = true;
    try {
        await fetch("/api/auth/active-branch", {
            method: "DELETE",
            credentials: "include",
            cache: "no-store",
        }).catch(() => undefined);
        window.dispatchEvent(new CustomEvent("active-branch-changed", { detail: { activeBranchId: null } }));
        if (!window.location.pathname.startsWith("/branch")) {
            window.location.assign("/branch");
        }
    } finally {
        window.setTimeout(() => {
            branchRecoveryInFlight = false;
        }, 1500);
    }
}

const logDevError = (msg: string, err: unknown) => {
    if (process.env.NODE_ENV !== "production") {
        console.error(msg, err);
    }
};

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
        logDevError("Failed to fetch CSRF token", error);
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
    const backendMessage = getBackendErrorMessage(error.response?.data, "");
    if (backendMessage) {
        void recoverBranchContextIfNeeded(backendMessage);
    }
    
    // Handle CSRF token errors (403 Forbidden)
    if (error.response?.status === 403) {
        const isCsrfError = backendMessage.toLowerCase().includes('csrf') || 
                           backendMessage.toLowerCase().includes('token required');
        
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

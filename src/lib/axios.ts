import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3000",
    withCredentials: true, // Necessary for Cookies
    headers: {
        "Content-Type": "application/json",
    },
});

let csrfToken: string | null = null;

// Function to fetch CSRF token
const getCsrfToken = async () => {
    try {
        const response = await api.get("/csrf-token");
        csrfToken = response.data.csrfToken;
        return csrfToken;
    } catch (error) {
        console.error("Failed to fetch CSRF token", error);
        return null;
    }
};

// Request interceptor to add CSRF token
api.interceptors.request.use(async (config) => {
    // Only add token for mutating requests
    if (["post", "put", "delete", "patch"].includes(config.method?.toLowerCase() || "")) {
        if (!csrfToken) {
            await getCsrfToken();
        }
        if (csrfToken) {
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
    if (error.response?.status === 403 && error.response?.data?.message === "invalid csrf token" && !originalRequest._retry) {
        originalRequest._retry = true;
        await getCsrfToken(); // Refresh token
        if (csrfToken) {
            originalRequest.headers["X-CSRF-Token"] = csrfToken;
        }
        return api(originalRequest);
    }
    return Promise.reject(error);
});

export default api;

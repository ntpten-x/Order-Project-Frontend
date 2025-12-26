import axios from "axios";
import { PROXY_CONFIGS } from "../lib/proxy-utils";
import { LoginCredentials, LoginResponse, User } from "../types/api/auth";

const API_URL = PROXY_CONFIGS.API_BASE_URL;

// Create axios instance with credentials enabled
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for cookies
    headers: {
        "Content-Type": "application/json",
    },
});

export const authService = {
    login: async (credentials: LoginCredentials): Promise<User> => {
        try {
            const response = await api.post<LoginResponse>("/auth/login", credentials);
            return response.data.user;
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            throw new Error(error.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ");
        }
    },

    logout: async (): Promise<void> => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout failed", error);
        }
    },

    getMe: async (): Promise<User> => {
        try {
            const response = await api.get<User>("/auth/me");
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

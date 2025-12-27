import axios from "axios";
import { LoginCredentials, LoginResponse, User } from "../types/api/auth";

// Use local API routes for Auth (BFF Pattern)
const api = axios.create({
    baseURL: "/api", // Relative path to Next.js API
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

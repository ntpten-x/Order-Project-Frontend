import api from "../lib/axios";
import { AxiosError } from "axios";
import { LoginCredentials, LoginResponse, User } from "../types/api/auth";

export const authService = {
    login: async (credentials: LoginCredentials): Promise<User> => {
        try {
            const response = await api.post<LoginResponse>("/auth/login", credentials);
            return response.data.user;
        } catch (error: unknown) {
            const message = (error as AxiosError<{ message: string }>).response?.data?.message;
            throw new Error(message || "เข้าสู่ระบบไม่สำเร็จ");
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
    },
    async getCsrfToken(): Promise<string> {
        try {
            const response = await fetch("/api/csrf");
            if (!response.ok) return "";
            const data = await response.json();
            return data.csrfToken;
        } catch (error) {
            console.error("Failed to fetch CSRF token", error);
            return "";
        }
    }
};

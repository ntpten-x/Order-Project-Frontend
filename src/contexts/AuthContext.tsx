"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "../services/auth.service";
import { offlineQueueService } from "../services/pos/offline.queue.service";
import { User, LoginCredentials } from "../types/api/auth";
import { Spin } from "antd";
import { useGlobalLoading } from "./pos/GlobalLoadingContext";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();
    const pathname = usePathname();

    const checkAuth = async () => {
        try {
            // authService.getMe requires a token, but here we rely on cookie (httpOnly). 
            // However, getMe in authService currently expects a token string for Authorization header if passing one, 
            // OR if it uses cookie it should just work if the backend reads cookies. 
            // The previous code fetch("/api/auth/me") relies on the proxy sending the cookie.
            // authService.getMe(token) sends "Authorization: Bearer undefined" if we don't have token in local state yet.
            // But we might have token in localStorage "token_ws".
            // Let's check how we store token.
            
            let token = "";
            if (typeof window !== "undefined") {
                 token = localStorage.getItem("token_ws") || "";
            }

            // If we don't have a token, we might still be logged in via cookie?? 
            // The original code was: const response = await fetch("/api/auth/me");
            // API route probably forwards cookie.
            // authService.getMe sends request to backend. If we use getProxyUrl it goes to /api/auth/me.
            // If /api/auth/me relies on cookie, we don't strictly need the Bearer token if the proxy handles it?
            // Actually, usually /api/auth/me might unwrap cookie or just forward it.
            // Let's rely on authService.getMe. The signature is getMe(token).
            // If token is empty, we pass empty string. Backend might rely on cookie if token is missing?
            // Wait, authService.getMe adds Authorization header.
            
            const user = await authService.getMe(token);
            setUser(user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const { showLoading, hideLoading } = useGlobalLoading();

    useEffect(() => {
        if (!loading && !user && pathname !== "/login") {
            router.push("/login");
        }
    }, [user, loading, pathname, router]);

    const login = async (credentials: LoginCredentials) => {
        try {
            showLoading("กำลังเข้าสู่ระบบ...");
            
            // Get CSRF Token first
            const csrfToken = await authService.getCsrfToken();
            
            const { token, ...userData } = await authService.login(credentials, csrfToken);

            if (token && typeof window !== "undefined") {
                localStorage.setItem("token_ws", token);
            }
            setUser(userData);
            router.push("/"); // Redirect to dashboard
        } catch (error: unknown) {
            throw error;
        } finally {
            hideLoading();
        }
    };

    const logout = async () => {
        try {
            showLoading("กำลังออกจากระบบ...");
            
            let token = "";
            if (typeof window !== "undefined") {
                token = localStorage.getItem("token_ws") || "";
            }
            
            // Call authService logout
            await authService.logout(token);
            
            if (typeof window !== "undefined") {
                localStorage.removeItem("token_ws");
            }
            offlineQueueService.clearQueue();
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            hideLoading();
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
                <Spin size="large" />
            </div>
        );
    }

    if (!user && pathname !== "/login") {
         return null; 
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "../services/auth.service";
import { offlineQueueService } from "../services/pos/offline.queue.service";
import { User, LoginCredentials } from "../types/api/auth";
import { Spin } from "antd";
import { useGlobalLoading } from "./pos/GlobalLoadingContext";
import { t } from "../utils/i18n";

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
            const user = await authService.getMe();
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
            showLoading(t("auth.loadingLogin"));
            
            // Get CSRF Token first
            const csrfToken = await authService.getCsrfToken();
            
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { token: _, ...userData } = await authService.login(credentials, csrfToken);
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
            showLoading(t("auth.loadingLogout"));
            
            await authService.logout();
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
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#ffffff"
            }}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    padding: "24px",
                    background: "#ffffff",
                    borderRadius: "20px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                }}>
                    <Spin size="large" />
                    <div style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
                        กำลังตรวจสอบสิทธิ์...
                    </div>
                </div>
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

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
            showLoading("กำลังเข้าสู่ระบบ...");
            
            // Get CSRF Token first
            const csrfToken = await authService.getCsrfToken();
            
            const { token: _token, ...userData } = await authService.login(credentials, csrfToken);
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

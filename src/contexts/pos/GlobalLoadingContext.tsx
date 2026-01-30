"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Spin } from "antd";

interface GlobalLoadingContextType {
    showLoading: (message?: string, key?: string) => void;
    hideLoading: (key?: string) => void;
    resetLoading: () => void;
    isLoading: boolean;
    loadingMessage?: string;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const GlobalLoadingProvider = ({ children }: { children: ReactNode }) => {
    const [loadingKeys, setLoadingKeys] = useState<Record<string, number>>({});
    const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

    const showLoading = useCallback((message?: string, key: string = "default") => {
        setLoadingKeys((prev) => ({
            ...prev,
            [key]: (prev[key] || 0) + 1,
        }));
        if (message) {
            setLoadingMessage(message);
        }
    }, []);

    const hideLoading = useCallback((key: string = "default") => {
        setLoadingKeys((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            next[key] -= 1;
            if (next[key] <= 0) {
                delete next[key];
            }
            return next;
        });
    }, []);

    const resetLoading = useCallback(() => {
        setLoadingKeys({});
        setLoadingMessage(undefined);
    }, []);

    const isLoading = Object.keys(loadingKeys).length > 0;

    return (
        <GlobalLoadingContext.Provider value={{ showLoading, hideLoading, resetLoading, isLoading, loadingMessage }}>
            {children}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <Spin size="large" />
                        {loadingMessage && (
                            <div style={{ fontSize: 13, color: "#5f6368" }}>{loadingMessage}</div>
                        )}
                    </div>
                </div>
            )}
        </GlobalLoadingContext.Provider>
    );
};

export function useGlobalLoading(): GlobalLoadingContextType {
    const context = useContext(GlobalLoadingContext);
    if (!context) {
        throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
    }
    return context;
}

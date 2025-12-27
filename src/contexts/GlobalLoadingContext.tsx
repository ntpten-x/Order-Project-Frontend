"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Spin } from "antd";

interface GlobalLoadingContextType {
    showLoading: (message?: string) => void;
    hideLoading: () => void;
    isLoading: boolean;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const GlobalLoadingProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);

    const showLoading = useCallback(() => {
        setIsLoading(true);
    }, []);

    const hideLoading = useCallback(() => {
        setIsLoading(false);
    }, []);

    return (
        <GlobalLoadingContext.Provider value={{ showLoading, hideLoading, isLoading }}>
            {children}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
                    <Spin size="large" />
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

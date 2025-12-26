"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

interface GlobalLoadingContextType {
    showLoading: (message?: string) => void;
    hideLoading: () => void;
    isLoading: boolean;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const GlobalLoadingProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string>("กำลังดำเนินการ...");

    const showLoading = (msg?: string) => {
        if (msg) setMessage(msg);
        else setMessage("กำลังดำเนินการ...");
        setIsLoading(true);
    };

    const hideLoading = () => {
        setIsLoading(false);
    };

    return (
        <GlobalLoadingContext.Provider value={{ showLoading, hideLoading, isLoading }}>
            {children}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white/90 dark:bg-zinc-800/90 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[200px] border border-white/20">
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#FCD34D' }} spin />} />
                        <span className="text-gray-700 dark:text-gray-200 font-medium text-lg animate-pulse">
                            {message}
                        </span>
                    </div>
                </div>
            )}
        </GlobalLoadingContext.Provider>
    );
};

export const useGlobalLoading = (): GlobalLoadingContextType => {
    const context = useContext(GlobalLoadingContext);
    if (!context) {
        throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
    }
    return context;
};

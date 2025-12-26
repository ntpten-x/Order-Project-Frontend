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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
                    <Spin size="large" />
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

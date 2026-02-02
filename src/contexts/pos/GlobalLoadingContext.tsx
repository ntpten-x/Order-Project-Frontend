"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";
import { Spin } from "antd";

interface GlobalLoadingState {
    isLoading: boolean;
    loadingMessage?: string;
}

interface GlobalLoadingActions {
    showLoading: (message?: string, key?: string) => void;
    hideLoading: (key?: string) => void;
    resetLoading: () => void;
}

type GlobalLoadingContextType = GlobalLoadingState & GlobalLoadingActions;

const GlobalLoadingStateContext = createContext<GlobalLoadingState | undefined>(undefined);
const GlobalLoadingDispatchContext = createContext<GlobalLoadingActions | undefined>(undefined);

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

    const stateValue = useMemo(() => ({
        isLoading,
        loadingMessage
    }), [isLoading, loadingMessage]);

    const dispatchValue = useMemo(() => ({
        showLoading,
        hideLoading,
        resetLoading
    }), [showLoading, hideLoading, resetLoading]);

    return (
        <GlobalLoadingDispatchContext.Provider value={dispatchValue}>
            <GlobalLoadingStateContext.Provider value={stateValue}>
                {children}
                {isLoading && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/10 backdrop-blur-md transition-all duration-300">
                        <div style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            alignItems: "center", 
                            gap: 16, 
                            background: "rgba(255, 255, 255, 0.8)", 
                            padding: "32px 48px", 
                            borderRadius: 24, 
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 255, 255, 0.4)"
                        }}>
                            <Spin size="large" />
                            {loadingMessage && (
                                <div style={{ 
                                    fontSize: 16, 
                                    color: "#475569", 
                                    fontWeight: 500,
                                    letterSpacing: "0.02em" 
                                }}>
                                    {loadingMessage}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </GlobalLoadingStateContext.Provider>
        </GlobalLoadingDispatchContext.Provider>
    );
};

export function useGlobalLoading(): GlobalLoadingContextType {
    const state = useContext(GlobalLoadingStateContext);
    const dispatch = useContext(GlobalLoadingDispatchContext);
    
    if (!state || !dispatch) {
        throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
    }
    
    // Merge for backward compatibility
    return useMemo(() => ({
        ...state,
        ...dispatch
    }), [state, dispatch]);
}

export function useGlobalLoadingDispatch(): GlobalLoadingActions {
    const dispatch = useContext(GlobalLoadingDispatchContext);
    if (!dispatch) {
        throw new Error("useGlobalLoadingDispatch must be used within a GlobalLoadingProvider");
    }
    return dispatch;
}

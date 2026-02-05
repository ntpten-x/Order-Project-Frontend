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
                    <div
                        role="status"
                        aria-live="polite"
                        className="global-loading-overlay"
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 13000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(255, 255, 255, 0.6)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            transition: "opacity 0.25s ease",
                        }}
                    >
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 16,
                            background: "rgba(255, 255, 255, 0.92)",
                            padding: "28px 40px",
                            borderRadius: 20,
                            boxShadow: "0 10px 32px rgba(15, 23, 42, 0.14)",
                            border: "1px solid rgba(148, 163, 184, 0.35)",
                            minWidth: 240
                        }}>
                            <Spin size="large" />
                            {loadingMessage && (
                                <div style={{
                                    fontSize: 16,
                                    color: "#334155",
                                    fontWeight: 600,
                                    letterSpacing: "0.01em",
                                    textAlign: "center"
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

"use client";

import React, { createContext, useCallback, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { message } from "antd";

import { useAuth } from "./AuthContext";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

const SOCKET_STATUS_MESSAGE_KEY = "socket-status";

function sanitizeSocketBaseUrl(raw?: string): string {
    const value = raw?.trim();
    if (!value) return "";

    try {
        const parsed = typeof window !== "undefined" ? new URL(value, window.location.origin) : new URL(value);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        return value.replace(/\/+$/, "");
    }
}

function resolveSocketConfig(): { url: string; path: string } {
    const explicitSocketUrl = sanitizeSocketBaseUrl(process.env.NEXT_PUBLIC_SOCKET_URL);
    const backendApiUrl = sanitizeSocketBaseUrl(process.env.NEXT_PUBLIC_BACKEND_API);
    const socketPath = (process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io").trim() || "/socket.io";

    let url = explicitSocketUrl || backendApiUrl || "";
    if (!url && typeof window !== "undefined") {
        url = window.location.origin;
    }
    if (!url) {
        url = "http://localhost:4000";
    }

    return { url, path: socketPath };
}

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const reconnectNoticeShown = useRef(false);
    const hadSuccessfulConnection = useRef(false);
    const disconnectWarnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { user } = useAuth();
    const userId = user?.id ?? null;
    const userBranchId = user?.branch?.id || user?.branch_id || null;

    const clearDisconnectWarnTimer = useCallback(() => {
        if (!disconnectWarnTimer.current) return;
        clearTimeout(disconnectWarnTimer.current);
        disconnectWarnTimer.current = null;
    }, []);

    const disconnectSocket = useCallback(() => {
        clearDisconnectWarnTimer();
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        reconnectNoticeShown.current = false;
        hadSuccessfulConnection.current = false;
        message.destroy(SOCKET_STATUS_MESSAGE_KEY);

        setSocket(null);
        setIsConnected(false);
    }, [clearDisconnectWarnTimer]);

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent).detail as { activeBranchId?: string | null } | undefined;
            if (detail && typeof detail.activeBranchId === "string") {
                setActiveBranchId(detail.activeBranchId);
            } else {
                setActiveBranchId(null);
            }
        };

        window.addEventListener("active-branch-changed", handler as EventListener);
        return () => {
            window.removeEventListener("active-branch-changed", handler as EventListener);
        };
    }, []);

    useEffect(() => {
        if (!userId) {
            disconnectSocket();
            return;
        }

        const { url: socketUrl, path: socketPath } = resolveSocketConfig();
        const branchId = activeBranchId || userBranchId;
        const socketDebug = process.env.NEXT_PUBLIC_SOCKET_DEBUG === "true";

        if (socketDebug) {
            console.info("[Socket] connect init", {
                socketUrl,
                socketPath,
                userId,
                branchId,
            });
        }

        const socketInstance = io(socketUrl, {
            path: socketPath,
            transports: ["websocket", "polling"],
            withCredentials: true,
            timeout: 10000,
            auth: {
                userId,
                branchId,
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 800,
            reconnectionDelayMax: 8000,
        });

        socketRef.current = socketInstance;

        socketInstance.on("connect", () => {
            clearDisconnectWarnTimer();
            hadSuccessfulConnection.current = true;
            setIsConnected(true);

            if (reconnectNoticeShown.current) {
                message.success({
                    content: "เชื่อมต่อเรียลไทม์กลับมาแล้ว",
                    key: SOCKET_STATUS_MESSAGE_KEY,
                    duration: 1.5,
                });
                reconnectNoticeShown.current = false;
            }

            if (socketDebug) {
                console.info("[Socket] connected", {
                    socketId: socketInstance.id,
                    transport: socketInstance.io.engine.transport.name,
                });
            }
        });

        socketInstance.on("disconnect", (reason) => {
            setIsConnected(false);

            if (reason === "io client disconnect" || !hadSuccessfulConnection.current) {
                return;
            }

            // Wait briefly before warning to avoid false alarms during quick reconnects.
            clearDisconnectWarnTimer();
            disconnectWarnTimer.current = setTimeout(() => {
                if (socketInstance.connected || reconnectNoticeShown.current) return;

                reconnectNoticeShown.current = true;
                message.warning({
                    content: "การเชื่อมต่อเรียลไทม์หลุด กำลังพยายามเชื่อมต่อใหม่...",
                    key: SOCKET_STATUS_MESSAGE_KEY,
                    duration: 2,
                });
            }, 1200);
        });

        socketInstance.on("connect_error", (error) => {
            console.error("[Socket] connect_error", {
                message: error.message,
                socketUrl,
                socketPath,
                userId,
                branchId,
            });
        });

        socketInstance.io.on("reconnect_attempt", () => {
            setIsConnected(false);
        });

        socketInstance.io.on("reconnect_failed", () => {
            clearDisconnectWarnTimer();
            if (!hadSuccessfulConnection.current) return;

            message.error({
                content: "เชื่อมต่อเรียลไทม์ไม่สำเร็จ กรุณารีเฟรชหน้า",
                key: SOCKET_STATUS_MESSAGE_KEY,
                duration: 3,
            });
        });

        setSocket(socketInstance);

        return () => {
            clearDisconnectWarnTimer();
            if (socketRef.current === socketInstance) {
                socketRef.current = null;
            }
            socketInstance.disconnect();
        };
    }, [activeBranchId, clearDisconnectWarnTimer, disconnectSocket, userBranchId, userId]);

    useEffect(() => {
        if (!userId) {
            setActiveBranchId(null);
            return;
        }

        fetch("/api/auth/active-branch", { credentials: "include", cache: "no-store" })
            .then((res) => res.json().catch(() => null))
            .then((data: { active_branch_id?: string | null } | null) => {
                setActiveBranchId(typeof data?.active_branch_id === "string" ? data.active_branch_id : null);
            })
            .catch(() => setActiveBranchId(null));
    }, [userId]);

    return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};

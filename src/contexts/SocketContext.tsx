"use client";

import React, { createContext, useCallback, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { message } from "antd";

import { useAuth } from "./AuthContext";
import { resolveSocketConfig, resolveSocketTransports } from "../utils/socket/config";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

const SOCKET_STATUS_MESSAGE_KEY = "socket-status";

function updateSocketPerfState(patch: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    const perfWindow = window as Window & { __POS_PERF_SOCKET_STATE__?: Record<string, unknown> };
    perfWindow.__POS_PERF_SOCKET_STATE__ = {
        ...(perfWindow.__POS_PERF_SOCKET_STATE__ || {}),
        ...patch,
    };
}

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
    const [socketToken, setSocketToken] = useState<string | null>(null);
    const [tokenFetching, setTokenFetching] = useState(true);

    const socketRef = useRef<Socket | null>(null);
    const reconnectNoticeShown = useRef(false);
    const hadSuccessfulConnection = useRef(false);
    const disconnectWarnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { user } = useAuth();
    const userId = user?.id ?? null;
    const userBranchId = user?.branch?.id || user?.branch_id || null;
    const effectiveBranchId = activeBranchId ?? userBranchId;

    useEffect(() => {
        if (!userId) {
            setSocketToken(null);
            setTokenFetching(false);
            return;
        }

        let isMounted = true;
        setTokenFetching(true);
        fetch("/api/auth/socket-token")
            .then(res => res.json())
            .then(data => {
                if (isMounted) {
                    console.info("[Socket] Token fetch result:", { hasToken: !!data.token });
                    if (data.token) setSocketToken(data.token);
                    else setSocketToken(null);
                }
            })
            .catch(err => {
                console.error("[Socket] Failed to fetch socket token", err);
                if (isMounted) setSocketToken(null);
            })
            .finally(() => {
                if (isMounted) setTokenFetching(false);
            });

        return () => {
            isMounted = false;
        };
    }, [userId]);

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
        updateSocketPerfState({
            connected: false,
            lastDisconnectReason: "disconnectSocket",
            lastDisconnectAt: Date.now(),
        });

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
        if (!userId || tokenFetching) {
            disconnectSocket();
            return;
        }

        const { url: socketUrl, path: socketPath } = resolveSocketConfig();
        const socketDebug = process.env.NEXT_PUBLIC_SOCKET_DEBUG === "true";
        const socketTransports = resolveSocketTransports();
        updateSocketPerfState({
            branchId: effectiveBranchId,
            socketUrl,
            socketPath,
            socketTransports,
            connected: false,
            hasToken: !!socketToken,
            userId,
        });

        if (socketDebug) {
            console.info("[Socket] connect init", {
                socketUrl,
                socketPath,
                userId,
                branchId: effectiveBranchId,
                socketTransports,
                hasToken: !!socketToken,
                tokenFetching,
                socketTokenLength: socketToken?.length || 0
            });
        }

        const socketInstance = io(socketUrl, {
            path: socketPath,
            transports: socketTransports,
            withCredentials: true,
            timeout: 10000,
            auth: {
                userId,
                branchId: effectiveBranchId,
                token: socketToken, // Explicitly pass the token
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
            updateSocketPerfState({
                connected: true,
                socketId: socketInstance.id,
                transport: socketInstance.io.engine.transport.name,
                lastConnectAt: Date.now(),
            });

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
            updateSocketPerfState({
                connected: false,
                lastDisconnectReason: reason,
                lastDisconnectAt: Date.now(),
            });

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
            const perfWindow = window as Window & { __POS_PERF_SOCKET_STATE__?: Record<string, unknown> };
            const currentErrorCount = Number(perfWindow.__POS_PERF_SOCKET_STATE__?.connectErrorCount || 0);
            updateSocketPerfState({
                connected: false,
                connectErrorCount: currentErrorCount + 1,
                lastConnectError: error.message,
                lastConnectErrorAt: Date.now(),
            });
            console.error("[Socket] connect_error", {
                message: error.message,
                socketUrl,
                socketPath,
                userId,
                branchId: effectiveBranchId,
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
            updateSocketPerfState({
                connected: false,
                lastDisconnectReason: "cleanup",
                lastDisconnectAt: Date.now(),
            });
            socketInstance.disconnect();
        };
    }, [effectiveBranchId, clearDisconnectWarnTimer, disconnectSocket, userId, socketToken, tokenFetching]);

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

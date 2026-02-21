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

function sanitizeSocketPath(raw?: string): string {
    const fallback = "/socket.io";
    const value = (raw || fallback).trim();
    if (!value) return fallback;

    const normalized = value.replace(/\\/g, "/");

    // Guard against Git Bash / MSYS path conversion on Windows
    // e.g. "C:/Program Files/Git/socket.io"
    if (/^[a-zA-Z]:\//.test(normalized)) {
        return normalized.includes("/socket.io") ? "/socket.io" : fallback;
    }

    if (normalized.includes("://")) {
        try {
            const parsed = new URL(normalized);
            return sanitizeSocketPath(parsed.pathname);
        } catch {
            return fallback;
        }
    }

    const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return withLeadingSlash || fallback;
}

function enforceSecureSocketUrl(rawUrl: string): string {
    if (typeof window === "undefined") return rawUrl;
    if (window.location.protocol !== "https:") return rawUrl;

    try {
        const parsed = new URL(rawUrl, window.location.origin);
        if (parsed.protocol === "http:") {
            parsed.protocol = "https:";
            return `${parsed.protocol}//${parsed.host}`;
        }
    } catch {
        return rawUrl;
    }

    return rawUrl;
}

function inferLocalBackendOrigin(): string {
    if (typeof window === "undefined") return "";

    const { protocol, hostname, port } = window.location;
    const host = hostname.toLowerCase();
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (!isLocalHost) return "";

    // Docker local stack in this project usually runs frontend:8001 and backend:8002.
    if (port === "8001") {
        return `${protocol}//${hostname}:8002`;
    }

    // Local container runtime default in this repo can run frontend:3001 and backend:3000.
    if (port === "3001") {
        return `${protocol}//${hostname}:3000`;
    }

    return "";
}

function resolveSocketConfig(): { url: string; path: string } {
    const explicitSocketUrl = sanitizeSocketBaseUrl(process.env.NEXT_PUBLIC_SOCKET_URL);
    const backendApiUrl = sanitizeSocketBaseUrl(process.env.NEXT_PUBLIC_BACKEND_API);
    const publicApiUrl = sanitizeSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const socketPath = sanitizeSocketPath(process.env.NEXT_PUBLIC_SOCKET_PATH);

    let url = explicitSocketUrl || backendApiUrl || publicApiUrl || "";

    if (typeof window !== "undefined") {
        const currentProto = window.location.protocol;
        const currentHost = window.location.hostname;
        const isSecure = currentProto === "https:";
        
        const isIp = (u: string) => /^(https?:\/\/)?(\d{1,3}\.){3}\d{1,3}(:\d+)?/.test(u);
        const isLocal = (u: string) => u.includes("localhost") || u.includes("127.0.0.1") || u.includes(".local");

        if (isSecure && url && isIp(url) && !isLocal(url)) {
            // Production HTTPS context: connecting to an IP directly usually fails SSL verification.
            // Fallback to origin hoping the reverse proxy/loadbalancer handles /socket.io
            console.warn("[Socket] HTTPS detected but SOCKET_URL is an IP. Falling back to current origin to avoid SSL mismatch.");
            url = window.location.origin;
        }

        if (!url) {
            url = inferLocalBackendOrigin() || window.location.origin;
        }
    }

    if (!url) {
        url = "http://localhost:4000";
    }

    return {
        url: enforceSecureSocketUrl(url),
        path: socketPath,
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
        const branchId = activeBranchId || userBranchId;
        const socketDebug = process.env.NEXT_PUBLIC_SOCKET_DEBUG === "true";

        if (socketDebug) {
            console.info("[Socket] connect init", {
                socketUrl,
                socketPath,
                userId,
                branchId,
                hasToken: !!socketToken,
                tokenFetching,
                socketTokenLength: socketToken?.length || 0
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
    }, [activeBranchId, clearDisconnectWarnTimer, disconnectSocket, userBranchId, userId, socketToken, tokenFetching]);

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

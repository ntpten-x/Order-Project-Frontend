"use client";

import React, { createContext, useCallback, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { message } from "antd";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

import { useAuth } from "./AuthContext";

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectNoticeShown = useRef(false);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const userBranchId = user?.branch?.id || user?.branch_id || null;

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    reconnectNoticeShown.current = false;
    setSocket(null);
    setIsConnected(false);
  }, []);

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

    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3000";
    const branchId = activeBranchId || userBranchId;
    const socketInstance = io(socketUrl, {
      transports: ["websocket"],
      withCredentials: true,
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
      setIsConnected(true);
      if (reconnectNoticeShown.current) {
        message.success({
          content: "Realtime connection restored",
          key: "socket-status",
          duration: 1.5,
        });
        reconnectNoticeShown.current = false;
      }
    });

    socketInstance.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason !== "io client disconnect" && !reconnectNoticeShown.current) {
        reconnectNoticeShown.current = true;
        message.warning({
          content: "Realtime disconnected, reconnecting...",
          key: "socket-status",
          duration: 2,
        });
      }
    });

    socketInstance.io.on("reconnect_attempt", () => {
      setIsConnected(false);
    });

    socketInstance.io.on("reconnect_failed", () => {
      message.error({
        content: "Realtime reconnection failed",
        key: "socket-status",
        duration: 2,
      });
    });

    setSocket(socketInstance);

    return () => {
      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }
      socketInstance.disconnect();
    };
  }, [activeBranchId, disconnectSocket, userBranchId, userId]);

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

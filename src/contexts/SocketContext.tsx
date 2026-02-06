"use client";

import React, { createContext, useEffect, useRef, useState, ReactNode } from "react";
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
  const reconnectNoticeShown = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
        return;
    }

    // connect to backend
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4000";
    const branchId = user.branch?.id || user.branch_id || null;
    const socketInstance = io(socketUrl, {
        transports: ["websocket"],
        withCredentials: true, // Important: Send cookies for auth
        auth: {
            userId: user.id,
            branchId,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 800,
        reconnectionDelayMax: 8000,
    });

    socketInstance.on("connect", () => {
      console.log("Socket Connected:", socketInstance.id);
      setIsConnected(true);
      reconnectNoticeShown.current = false;
      message.success({ content: "เชื่อมต่อเรียลไทม์แล้ว", key: "socket-status", duration: 1.5 });
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket Disconnected");
      setIsConnected(false);
      if (!reconnectNoticeShown.current) {
        reconnectNoticeShown.current = true;
        message.warning({ content: "การเชื่อมต่อเรียลไทม์หลุด กำลังพยายามเชื่อมต่อใหม่...", key: "socket-status", duration: 2 });
      }
    });

    socketInstance.io.on("reconnect_attempt", (attempt) => {
      console.log("Socket reconnect attempt", attempt);
      setIsConnected(false);
    });

    socketInstance.io.on("reconnect_failed", () => {
      console.log("Socket reconnect failed");
      message.error({ content: "เชื่อมต่อเรียลไทม์ไม่สำเร็จ", key: "socket-status", duration: 2 });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

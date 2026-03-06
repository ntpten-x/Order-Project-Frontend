"use client";

import React from "react";
import { io, Socket } from "socket.io-client";

import { ORDER_REALTIME_EVENTS } from "../utils/pos/orderRealtimeEvents";
import { resolveSocketConfig, resolveSocketTransports } from "../utils/socket/config";

type UsePublicTableOrderRealtimeOptions = {
    publicTableToken: string;
    enabled?: boolean;
    onOrderChanged: () => void | Promise<void>;
    debounceMs?: number;
};

export function usePublicTableOrderRealtime({
    publicTableToken,
    enabled = true,
    onOrderChanged,
    debounceMs = 250,
}: UsePublicTableOrderRealtimeOptions): void {
    const refreshRef = React.useRef(onOrderChanged);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasConnectedOnceRef = React.useRef(false);

    React.useEffect(() => {
        refreshRef.current = onOrderChanged;
    }, [onOrderChanged]);

    React.useEffect(() => {
        if (!enabled || !publicTableToken) {
            hasConnectedOnceRef.current = false;
            return;
        }

        const { url, path } = resolveSocketConfig();
        const transports = resolveSocketTransports();
        const socket: Socket = io(url, {
            path,
            transports,
            withCredentials: true,
            timeout: 10000,
            auth: {
                publicTableToken,
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 800,
            reconnectionDelayMax: 8000,
        });

        const scheduleRefresh = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                void refreshRef.current();
            }, debounceMs);
        };

        const handleConnect = () => {
            if (!hasConnectedOnceRef.current) {
                hasConnectedOnceRef.current = true;
                return;
            }

            scheduleRefresh();
        };

        socket.on("connect", handleConnect);
        ORDER_REALTIME_EVENTS.forEach((event) => socket.on(event, scheduleRefresh));

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            socket.off("connect", handleConnect);
            ORDER_REALTIME_EVENTS.forEach((event) => socket.off(event, scheduleRefresh));
            socket.disconnect();
        };
    }, [debounceMs, enabled, publicTableToken]);
}

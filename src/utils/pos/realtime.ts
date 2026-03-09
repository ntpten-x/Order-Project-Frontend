import { useEffect } from "react";
import type { Socket } from "socket.io-client";

type RealtimeEntityPayload =
    | {
          id?: string;
          order_id?: string;
          data?: {
              id?: string;
              order_id?: string;
          };
      }
    | string
    | null
    | undefined;

export const matchesRealtimeEntityPayload = (
    payload: RealtimeEntityPayload,
    targetId?: string,
): boolean => {
    if (!targetId) return false;
    if (typeof payload === "string") {
        return payload === targetId;
    }
    if (!payload || typeof payload !== "object") {
        return false;
    }

    return (
        payload.id === targetId ||
        payload.order_id === targetId ||
        payload.data?.id === targetId ||
        payload.data?.order_id === targetId
    );
};

type RefreshOptions = {
    socket: Socket | null;
    events?: string[];
    onRefresh: () => void;
    intervalMs?: number;
    enabled?: boolean;
    debounceMs?: number;
    shouldRefresh?: (payload: unknown) => boolean;
};

export function useRealtimeRefresh({
    socket,
    events = [],
    onRefresh,
    intervalMs,
    enabled = true,
    debounceMs,
    shouldRefresh,
}: RefreshOptions) {
    useEffect(() => {
        if (!enabled || !socket || events.length === 0) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const handler = (payload: unknown) => {
            if (shouldRefresh && !shouldRefresh(payload)) {
                return;
            }
            if (!debounceMs || debounceMs <= 0) {
                onRefresh();
                return;
            }
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                debounceTimer = null;
                onRefresh();
            }, debounceMs);
        };
        events.forEach((event) => socket.on(event, handler));

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            events.forEach((event) => socket.off(event, handler));
        };
    }, [enabled, socket, events, onRefresh, debounceMs, shouldRefresh]);

    useEffect(() => {
        if (!enabled || !intervalMs) return;
        const timer = setInterval(onRefresh, intervalMs);
        return () => clearInterval(timer);
    }, [enabled, intervalMs, onRefresh]);
}

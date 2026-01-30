import { useEffect } from "react";
import type { Socket } from "socket.io-client";

type ListEvents = {
    create: string;
    update: string;
    delete: string;
};

type DeletePayload = { id?: string } | string | { data?: { id?: string } };

const resolveDeleteId = (payload: DeletePayload): string | undefined => {
    if (typeof payload === "string") return payload;
    if (payload && typeof payload === "object") {
        if ("id" in payload && payload.id) return payload.id;
        if ("data" in payload && payload.data?.id) return payload.data.id;
    }
    return undefined;
};

export function useRealtimeList<T>(
    socket: Socket | null,
    events: ListEvents,
    setItems: React.Dispatch<React.SetStateAction<T[]>>,
    getId: (item: T) => string = (item: T) => (item as { id: string }).id,
    shouldInclude: (item: T) => boolean = () => true
) {
    useEffect(() => {
        if (!socket) return;

        const handleCreate = (newItem: T) => {
            if (!shouldInclude(newItem)) return;
            const newId = getId(newItem);
            setItems((prev) => (prev.some((item) => getId(item) === newId) ? prev : [...prev, newItem]));
        };

        const handleUpdate = (updatedItem: T) => {
            const updatedId = getId(updatedItem);
            setItems((prev) => {
                if (!shouldInclude(updatedItem)) {
                    return prev.filter((item) => getId(item) !== updatedId);
                }
                const found = prev.some((item) => getId(item) === updatedId);
                if (!found) return [...prev, updatedItem];
                return prev.map((item) => (getId(item) === updatedId ? updatedItem : item));
            });
        };

        const handleDelete = (payload: DeletePayload) => {
            const id = resolveDeleteId(payload);
            if (!id) return;
            setItems((prev) => prev.filter((item) => getId(item) !== id));
        };

        socket.on(events.create, handleCreate);
        socket.on(events.update, handleUpdate);
        socket.on(events.delete, handleDelete);

        return () => {
            socket.off(events.create, handleCreate);
            socket.off(events.update, handleUpdate);
            socket.off(events.delete, handleDelete);
        };
    }, [socket, events.create, events.update, events.delete, getId, setItems, shouldInclude]);
}

type RefreshOptions = {
    socket: Socket | null;
    events?: string[];
    onRefresh: () => void;
    intervalMs?: number;
    enabled?: boolean;
    debounceMs?: number;
};

export function useRealtimeRefresh({
    socket,
    events = [],
    onRefresh,
    intervalMs,
    enabled = true,
    debounceMs,
}: RefreshOptions) {
    useEffect(() => {
        if (!enabled || !socket || events.length === 0) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const handler = () => {
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
    }, [enabled, socket, events, onRefresh, debounceMs]);

    useEffect(() => {
        if (!enabled || !intervalMs) return;
        const timer = setInterval(onRefresh, intervalMs);
        return () => clearInterval(timer);
    }, [enabled, intervalMs, onRefresh]);
}

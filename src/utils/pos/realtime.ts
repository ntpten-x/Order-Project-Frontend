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
    getId: (item: T) => string = (item: T) => (item as { id: string }).id
) {
    useEffect(() => {
        if (!socket) return;

        const handleCreate = (newItem: T) => {
            setItems((prev) => [...prev, newItem]);
        };

        const handleUpdate = (updatedItem: T) => {
            const updatedId = getId(updatedItem);
            setItems((prev) =>
                prev.map((item) => (getId(item) === updatedId ? updatedItem : item))
            );
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
    }, [socket, events.create, events.update, events.delete, getId, setItems]);
}

type RefreshOptions = {
    socket: Socket | null;
    events?: string[];
    onRefresh: () => void;
    intervalMs?: number;
    enabled?: boolean;
};

export function useRealtimeRefresh({
    socket,
    events = [],
    onRefresh,
    intervalMs,
    enabled = true,
}: RefreshOptions) {
    useEffect(() => {
        if (!enabled || !socket || events.length === 0) return;

        const handler = () => onRefresh();
        events.forEach((event) => socket.on(event, handler));

        return () => {
            events.forEach((event) => socket.off(event, handler));
        };
    }, [enabled, socket, events, onRefresh]);

    useEffect(() => {
        if (!enabled || !intervalMs) return;
        const timer = setInterval(onRefresh, intervalMs);
        return () => clearInterval(timer);
    }, [enabled, intervalMs, onRefresh]);
}

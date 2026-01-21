import useSWR from "swr";
import { useContext, useEffect } from "react";
import { SocketContext } from "@/contexts/SocketContext";
import { Tables } from "../../types/api/pos/tables";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTables() {
    const { socket } = useContext(SocketContext);

    const { data, error, isLoading, mutate } = useSWR<Tables[]>(
        `/api/pos/tables`, // Use local API route
        fetcher,
        {
            revalidateOnFocus: true,
            dedupingInterval: 2000,
            revalidateOnReconnect: true
        }
    );

    useEffect(() => {
        if (!socket) return;

        const handleTableUpdate = () => {
            mutate();
        };

        // Listen for table events
        socket.on("tables:create", handleTableUpdate);
        socket.on("tables:update", handleTableUpdate);
        socket.on("tables:delete", handleTableUpdate);

        // Also listen for order events as they affect table status (active_order_status)
        socket.on("orders:create", handleTableUpdate);
        socket.on("orders:update", handleTableUpdate);
        socket.on("orders:delete", handleTableUpdate);

        return () => {
            socket.off("tables:create", handleTableUpdate);
            socket.off("tables:update", handleTableUpdate);
            socket.off("tables:delete", handleTableUpdate);
            socket.off("orders:create", handleTableUpdate);
            socket.off("orders:update", handleTableUpdate);
            socket.off("orders:delete", handleTableUpdate);
        };
    }, [socket, mutate]);

    return {
        tables: data || [],
        isLoading,
        isError: error,
        mutate,
    };
}

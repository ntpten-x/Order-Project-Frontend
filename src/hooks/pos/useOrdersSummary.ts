import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import { SocketContext } from "../../contexts/SocketContext";
import { ordersService } from "../../services/pos/orders.service";
import { SalesOrderSummary } from "../../types/api/pos/salesOrder";

interface OrdersSummaryResponse {
    data: SalesOrderSummary[];
    total: number;
    page: number;
    last_page?: number;
}

interface UseOrdersSummaryParams {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    query?: string;
}

export function useOrdersSummary({ page = 1, limit = 50, status, type, query }: UseOrdersSummaryParams) {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const queryKey = ["ordersSummary", page, limit, status || "all", type || "all", query || ""];

    const { data, error, isLoading, isFetching, refetch } = useQuery<OrdersSummaryResponse>({
        queryKey,
        queryFn: async () => {
            return await ordersService.getAllSummary(undefined, page, limit, status, type, query);
        },
        placeholderData: keepPreviousData,
        staleTime: 3000,
    });

    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["ordersSummary"] });
        };

        socket.on("orders:create", handleOrderUpdate);
        socket.on("orders:update", handleOrderUpdate);
        socket.on("orders:delete", handleOrderUpdate);
        socket.on("payments:create", handleOrderUpdate);
        socket.on("payments:update", handleOrderUpdate);

        return () => {
            socket.off("orders:create", handleOrderUpdate);
            socket.off("orders:update", handleOrderUpdate);
            socket.off("orders:delete", handleOrderUpdate);
            socket.off("payments:create", handleOrderUpdate);
            socket.off("payments:update", handleOrderUpdate);
        };
    }, [socket, queryClient]);

    return {
        orders: data?.data || [],
        total: data?.total || 0,
        currentPage: data?.page || page,
        lastPage: data?.last_page || 1,
        isLoading,
        isFetching,
        isError: error,
        refetch,
    };
}

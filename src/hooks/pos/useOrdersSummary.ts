import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useContext } from "react";
import { ordersService } from "../../services/pos/orders.service";
import { SalesOrderSummary } from "../../types/api/pos/salesOrder";
import { SocketContext } from "../../contexts/SocketContext";

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
    const { isConnected } = useContext(SocketContext);
    const queryKey = ["ordersSummary", page, limit, status || "all", type || "all", query || ""];

    const { data, error, isLoading, isFetching, refetch } = useQuery<OrdersSummaryResponse>({
        queryKey,
        queryFn: async () => {
            return await ordersService.getAllSummary(undefined, page, limit, status, type, query);
        },
        placeholderData: keepPreviousData,
        // Socket events invalidate this query globally; keep fallback stale window for disconnected clients.
        staleTime: isConnected ? 45_000 : 7_500,
        refetchOnWindowFocus: false,
        refetchInterval: isConnected ? false : 15_000,
        refetchIntervalInBackground: false,
    });

    // Socket logic moved to global useOrderSocketEvents hook
    // to prevent code duplication and multiple listeners
    // The query cache 'ordersSummary' is invalidated centrally there.

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

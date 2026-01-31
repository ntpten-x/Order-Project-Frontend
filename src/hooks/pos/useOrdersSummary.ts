import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
    const queryKey = ["ordersSummary", page, limit, status || "all", type || "all", query || ""];

    const { data, error, isLoading, isFetching, refetch } = useQuery<OrdersSummaryResponse>({
        queryKey,
        queryFn: async () => {
            return await ordersService.getAllSummary(undefined, page, limit, status, type, query);
        },
        placeholderData: keepPreviousData,
        staleTime: 3000,
    });

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

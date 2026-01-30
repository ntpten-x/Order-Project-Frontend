import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ordersService } from "@/services/pos/orders.service";
import { SalesOrderSummary } from "@/types/api/pos/salesOrder";

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
}

export function useOrdersSummary({ page = 1, limit = 50, status, type }: UseOrdersSummaryParams) {
    const queryKey = ["ordersSummary", page, limit, status || "all", type || "all"];

    const { data, error, isLoading, isFetching, refetch } = useQuery<OrdersSummaryResponse>({
        queryKey,
        queryFn: async () => {
            return await ordersService.getAllSummary(undefined, page, limit, status, type);
        },
        placeholderData: keepPreviousData,
        staleTime: 3000,
    });

    return {
        orders: data?.data || [],
        total: data?.total || 0,
        currentPage: data?.page || page,
        lastPage: data?.last_page || 1,
        isLoading: isLoading || isFetching,
        isError: error,
        refetch,
    };
}

import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { SocketContext } from '../../contexts/SocketContext';
import { SalesOrder } from '../../types/api/pos/salesOrder';
import { ordersService } from '../../services/pos/orders.service';

interface OrdersResponse {
    data: SalesOrder[];
    total: number;
    page: number;
    last_page: number;
}

interface UseOrdersParams {
    page?: number;
    limit?: number;
    status?: string;
}

type DeletePayload = { id?: string } | string | { data?: { id?: string } };

const resolveDeleteId = (payload: DeletePayload): string | undefined => {
    if (typeof payload === "string") return payload;
    if (payload && typeof payload === "object") {
        if ("id" in payload && payload.id) return payload.id;
        if ("data" in payload && payload.data?.id) return payload.data.id;
    }
    return undefined;
};

const parseStatusFilter = (statusKey: unknown): string[] | "all" => {
    const raw = typeof statusKey === "string" ? statusKey : "all";
    if (!raw || raw === "all") return "all";
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : "all";
};

export function useOrders({ page = 1, limit = 50, status }: UseOrdersParams) {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();

    // Construct query string for key
    const queryKey = ['orders', page, limit, status || 'all'];

    const { data, error, isLoading, refetch } = useQuery<OrdersResponse>({
        queryKey,
        queryFn: async () => {
            return await ordersService.getAll(undefined, page, limit, status);
        },
        placeholderData: keepPreviousData,
        staleTime: 2000,
    });

    useEffect(() => {
        if (!socket) return;

        const patchAll = (fn: (existing: OrdersResponse, key: unknown[]) => OrdersResponse) => {
            const queries = queryClient.getQueriesData<OrdersResponse>({ queryKey: ["orders"] });
            for (const [key, existing] of queries) {
                if (!existing) continue;
                const next = fn(existing, key as unknown[]);
                if (next !== existing) {
                    queryClient.setQueryData<OrdersResponse>(key, next);
                }
            }
        };

        const toOrderForInsert = (payload: unknown): SalesOrder | null => {
            if (!payload || typeof payload !== "object") return null;
            const p = payload as Partial<SalesOrder> & Record<string, unknown>;

            if (typeof p.id !== "string" || !p.id) return null;
            if (typeof p.order_no !== "string" || !p.order_no) return null;
            if (!p.status || !p.order_type || !p.create_date) return null;

            const totalAmount = Number((p as Record<string, unknown>).total_amount ?? 0);
            return {
                ...(p as SalesOrder),
                total_amount: Number.isFinite(totalAmount) ? totalAmount : 0,
            };
        };

        const mergeOrder = (existing: SalesOrder, patch: Partial<SalesOrder> & Record<string, unknown>): SalesOrder => {
            const next: SalesOrder = { ...existing, ...(patch as Partial<SalesOrder>) };
            if (patch.total_amount !== undefined) {
                const totalAmount = Number((patch as Record<string, unknown>).total_amount);
                next.total_amount = Number.isFinite(totalAmount) ? totalAmount : existing.total_amount;
            }
            return next;
        };

        // Listen for order events
        const handleCreate = (payload: unknown) => {
            const created = toOrderForInsert(payload);
            if (!created) return;

            patchAll((existing, key) => {
                const keyPage = Number(key[1] ?? 1);
                const keyLimit = Number(key[2] ?? 50);
                const statusKey = key[3] ?? "all";
                const statuses = parseStatusFilter(statusKey);
                const allow = statuses === "all" || statuses.includes(created.status);

                if (!allow) return existing;
                if (keyPage !== 1) return existing;
                if (existing.data.some((o) => o.id === created.id)) return existing;

                const nextData = [created, ...existing.data].slice(0, keyLimit);
                return { ...existing, data: nextData, total: (existing.total || 0) + 1 };
            });
        };

        const handleUpdate = (payload: unknown) => {
            if (!payload || typeof payload !== "object") return;
            const patch = payload as Partial<SalesOrder> & Record<string, unknown>;
            if (typeof patch.id !== "string") return;
            const id = patch.id;

            patchAll((existing, key) => {
                const keyPage = Number(key[1] ?? 1);
                const keyLimit = Number(key[2] ?? 50);
                const statusKey = key[3] ?? "all";
                const statuses = parseStatusFilter(statusKey);

                const idx = existing.data.findIndex((o) => o.id === id);
                const nextStatus = patch.status ?? existing.data[idx]?.status;
                const allow = statuses === "all" || (typeof nextStatus === "string" && statuses.includes(nextStatus));

                if (idx !== -1) {
                    if (!allow) {
                        const nextData = existing.data.filter((o) => o.id !== id);
                        return { ...existing, data: nextData, total: Math.max((existing.total || 0) - 1, 0) };
                    }
                    const nextData = existing.data.slice();
                    nextData[idx] = mergeOrder(existing.data[idx], patch);
                    return { ...existing, data: nextData };
                }

                // If not present, only consider inserting on page 1
                if (keyPage !== 1) return existing;
                if (!allow) return existing;

                const created = toOrderForInsert(patch);
                if (!created) return existing;

                const nextData = [created, ...existing.data].slice(0, keyLimit);
                return { ...existing, data: nextData, total: (existing.total || 0) + 1 };
            });
        };

        const handleDelete = (payload: DeletePayload) => {
            const id = resolveDeleteId(payload);
            if (!id) return;

            const queries = queryClient.getQueriesData<OrdersResponse>({ queryKey: ["orders"] });
            for (const [key, existing] of queries) {
                if (!existing) continue;
                if (!existing.data.some((o) => o.id === id)) continue;

                queryClient.setQueryData<OrdersResponse>(key, {
                    ...existing,
                    data: existing.data.filter((o) => o.id !== id),
                    total: Math.max((existing.total || 0) - 1, 0),
                });

                queryClient.invalidateQueries({ queryKey: key as unknown[], exact: true });
            }
        };

        socket.on("orders:create", handleCreate);
        socket.on("orders:update", handleUpdate);
        socket.on("orders:delete", handleDelete);

        return () => {
            socket.off("orders:create", handleCreate);
            socket.off("orders:update", handleUpdate);
            socket.off("orders:delete", handleDelete);
        };
    }, [socket, queryClient]);

    return {
        orders: data?.data || [],
        total: data?.total || 0,
        currentPage: data?.page || 1,
        lastPage: data?.last_page || 1,
        isLoading,
        isError: error,
        mutate: refetch,
    };
}

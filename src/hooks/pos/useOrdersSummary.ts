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

const matchesFilters = (
    filters: { statusKey: unknown; typeKey: unknown },
    order: { status: string; order_type: string }
): boolean => {
    const statuses = parseStatusFilter(filters.statusKey);
    if (statuses !== "all" && !statuses.includes(order.status)) return false;

    const type = typeof filters.typeKey === "string" ? filters.typeKey : "all";
    if (type && type !== "all" && order.order_type !== type) return false;

    return true;
};

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

        const patchAll = (fn: (existing: OrdersSummaryResponse, key: unknown[]) => OrdersSummaryResponse) => {
            const queries = queryClient.getQueriesData<OrdersSummaryResponse>({ queryKey: ["ordersSummary"] });
            for (const [key, existing] of queries) {
                if (!existing) continue;
                const next = fn(existing, key as unknown[]);
                if (next !== existing) {
                    queryClient.setQueryData<OrdersSummaryResponse>(key, next);
                }
            }
        };

        const toSummaryForInsert = (payload: unknown): SalesOrderSummary | null => {
            if (!payload || typeof payload !== "object") return null;
            const p = payload as Partial<SalesOrderSummary> & Record<string, unknown>;

            if (typeof p.id !== "string" || !p.id) return null;
            if (typeof p.order_no !== "string" || !p.order_no) return null;
            if (!p.order_type || !p.status || !p.create_date) return null;

            const totalAmount = Number((p as Record<string, unknown>).total_amount ?? 0);

            return {
                id: p.id,
                order_no: p.order_no,
                order_type: p.order_type,
                status: p.status,
                create_date: p.create_date,
                total_amount: Number.isFinite(totalAmount) ? totalAmount : 0,
                delivery_code: p.delivery_code ?? null,
                table_id: p.table_id ?? null,
                delivery_id: p.delivery_id ?? null,
                table: p.table ?? null,
                delivery: p.delivery ?? null,
                items_summary: p.items_summary ?? {},
                items_count: p.items_count ?? 0,
                payment_method: p.payment_method ?? null,
            };
        };

        const mergeSummary = (existing: SalesOrderSummary, patch: Partial<SalesOrderSummary> & Record<string, unknown>): SalesOrderSummary => {
            const next: SalesOrderSummary = { ...existing, ...(patch as Partial<SalesOrderSummary>) };
            if (patch.total_amount !== undefined) {
                const totalAmount = Number((patch as Record<string, unknown>).total_amount);
                next.total_amount = Number.isFinite(totalAmount) ? totalAmount : existing.total_amount;
            }
            return next;
        };

        const handleCreate = (payload: unknown) => {
            const created = toSummaryForInsert(payload);
            if (!created) return;

            patchAll((existing, key) => {
                const keyPage = Number(key[1] ?? 1);
                const keyLimit = Number(key[2] ?? 50);
                const statusKey = key[3] ?? "all";
                const typeKey = key[4] ?? "all";
                const q = typeof key[5] === "string" ? key[5] : "";

                if (keyPage !== 1) return existing;
                if (q.trim()) return existing;
                if (!matchesFilters({ statusKey, typeKey }, created)) return existing;
                if (existing.data.some((o) => o.id === created.id)) return existing;

                const nextData = [created, ...existing.data].slice(0, keyLimit);
                return { ...existing, data: nextData, total: (existing.total || 0) + 1 };
            });
        };

        const handleUpdate = (payload: unknown) => {
            if (!payload || typeof payload !== "object") return;
            const patch = payload as Partial<SalesOrderSummary> & Record<string, unknown>;
            if (typeof patch.id !== "string") return;
            const id = patch.id;

            patchAll((existing, key) => {
                const keyPage = Number(key[1] ?? 1);
                const keyLimit = Number(key[2] ?? 50);
                const statusKey = key[3] ?? "all";
                const typeKey = key[4] ?? "all";
                const q = typeof key[5] === "string" ? key[5] : "";

                const idx = existing.data.findIndex((o) => o.id === id);
                const nextStatus = patch.status ?? existing.data[idx]?.status;
                const nextType = patch.order_type ?? existing.data[idx]?.order_type;
                const matches =
                    typeof nextStatus === "string" &&
                    typeof nextType === "string" &&
                    matchesFilters({ statusKey, typeKey }, { status: nextStatus, order_type: nextType });

                if (idx !== -1) {
                    if (!matches) {
                        const nextData = existing.data.filter((o) => o.id !== id);
                        return { ...existing, data: nextData, total: Math.max((existing.total || 0) - 1, 0) };
                    }

                    const nextData = existing.data.slice();
                    nextData[idx] = mergeSummary(existing.data[idx], patch);
                    return { ...existing, data: nextData };
                }

                // If not present, only consider inserting on page 1 without search query
                if (keyPage !== 1) return existing;
                if (q.trim()) return existing;
                if (!patch.status || !patch.order_type) return existing;
                if (!matches) return existing;

                const created = toSummaryForInsert(patch);
                if (!created) return existing;

                const nextData = [created, ...existing.data].slice(0, keyLimit);
                return { ...existing, data: nextData, total: (existing.total || 0) + 1 };
            });
        };

        const handleDelete = (payload: DeletePayload) => {
            const id = resolveDeleteId(payload);
            if (!id) return;

            const queries = queryClient.getQueriesData<OrdersSummaryResponse>({ queryKey: ["ordersSummary"] });
            for (const [key, existing] of queries) {
                if (!existing) continue;
                if (!existing.data.some((o) => o.id === id)) continue;

                queryClient.setQueryData<OrdersSummaryResponse>(key, {
                    ...existing,
                    data: existing.data.filter((o) => o.id !== id),
                    total: Math.max((existing.total || 0) - 1, 0),
                });

                // Ensure totals/pages stay correct when removing from cached lists
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
        currentPage: data?.page || page,
        lastPage: data?.last_page || 1,
        isLoading,
        isFetching,
        isError: error,
        refetch,
    };
}

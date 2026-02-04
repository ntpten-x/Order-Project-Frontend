type BackendErrorPayload = {
    success: false;
    error?: {
        code?: string;
        message?: string;
        details?: unknown;
    };
};

type BackendSuccessPayload<T> = {
    success: true;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        [key: string]: unknown;
    };
};

type BackendPayload<T> = BackendSuccessPayload<T> | BackendErrorPayload | T;

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object";
}

export function unwrapBackendData<T>(payload: BackendPayload<T>): T {
    if (payload && typeof payload === "object" && "success" in payload) {
        const record = payload as BackendSuccessPayload<T> | BackendErrorPayload;
        if (record.success === true && "data" in record) return (record as BackendSuccessPayload<T>).data;
    }
    return payload as T;
}

export function getBackendErrorMessage(payload: unknown, fallback: string = "Request failed"): string {
    if (typeof payload === "string") return payload;
    if (!isRecord(payload)) return fallback;

    // Standardized backend error: { success:false, error:{ message } }
    if (payload.success === false) {
        const error = payload.error;
        if (isRecord(error) && typeof error.message === "string" && error.message.trim()) {
            return error.message;
        }
    }

    // Some routes may return { error: "..." } or { error:{ message:"..." } }
    if ("error" in payload) {
        const error = payload.error;
        if (typeof error === "string" && error.trim()) return error;
        if (isRecord(error) && typeof error.message === "string" && error.message.trim()) {
            return error.message;
        }
    }

    // Fallback legacy: { message:"..." }
    if (typeof payload.message === "string" && payload.message.trim()) return payload.message;

    return fallback;
}

export function normalizeBackendPaginated<T>(payload: unknown): {
    data: T[];
    total: number;
    page: number;
    last_page: number;
} {
    if (payload && typeof payload === "object" && "success" in payload) {
        const record = payload as BackendSuccessPayload<T[]>;
        if (record.success === true && Array.isArray(record.data)) {
            const total = typeof record.meta?.total === "number" ? record.meta.total : record.data.length;
            const page = typeof record.meta?.page === "number" ? record.meta.page : 1;
            const limit = typeof record.meta?.limit === "number" ? record.meta.limit : 50;
            const totalPages =
                typeof record.meta?.totalPages === "number"
                    ? record.meta.totalPages
                    : Math.max(Math.ceil(total / Math.max(limit, 1)), 1);

            return {
                data: record.data,
                total,
                page,
                last_page: totalPages,
            };
        }
    }

    return payload as { data: T[]; total: number; page: number; last_page: number };
}

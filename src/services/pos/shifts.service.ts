import { Shift, ShiftClosePreview, ShiftHistoryQuery, ShiftHistoryResponse } from "../../types/api/pos/shifts";
import { getCsrfTokenCached } from "../../utils/pos/csrf";
import { throwBackendHttpError, unwrapBackendData } from "../../utils/api/backendResponse";

const parsePayload = async (response: Response): Promise<unknown> => {
    return response.json().catch(() => ({}));
};

export const shiftsService = {
    getCurrentShift: async (): Promise<Shift | null> => {
        const response = await fetch("/api/pos/shifts/current", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Failed to fetch current shift");
        }

        return unwrapBackendData(await parsePayload(response)) as Shift;
    },

    openShift: async (startAmount: number): Promise<Shift> => {
        const csrfToken = await getCsrfTokenCached();

        const response = await fetch("/api/pos/shifts/open", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({ start_amount: startAmount }),
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Failed to open shift");
        }

        return unwrapBackendData(await parsePayload(response)) as Shift;
    },

    previewCloseShift: async (endAmount: number): Promise<ShiftClosePreview> => {
        const csrfToken = await getCsrfTokenCached();

        const response = await fetch("/api/pos/shifts/close/preview", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({ end_amount: endAmount }),
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Failed to preview close shift");
        }

        return unwrapBackendData(await parsePayload(response)) as ShiftClosePreview;
    },

    closeShift: async (endAmount: number): Promise<Shift> => {
        const csrfToken = await getCsrfTokenCached();

        const response = await fetch("/api/pos/shifts/close", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({ end_amount: endAmount }),
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Failed to close shift");
        }

        return unwrapBackendData(await parsePayload(response)) as Shift;
    },

    getCurrentSummary: async (): Promise<unknown> => {
        const response = await fetch("/api/pos/shifts/current/summary", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Failed to fetch shift summary");
        }

        return unwrapBackendData(await parsePayload(response));
    },

    getSummary: async (id: string): Promise<unknown> => {
        const response = await fetch(`/api/pos/shifts/summary/${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Failed to fetch shift summary");
        }

        return unwrapBackendData(await parsePayload(response));
    },

    getHistory: async (params: ShiftHistoryQuery = {}): Promise<ShiftHistoryResponse> => {
        const query = new URLSearchParams();

        if (params.page) query.set("page", String(params.page));
        if (params.limit) query.set("limit", String(params.limit));
        if (params.q) query.set("q", params.q);
        if (params.status) query.set("status", params.status);
        if (params.sort_created) query.set("sort_created", params.sort_created);
        if (params.date_from) query.set("date_from", params.date_from);
        if (params.date_to) query.set("date_to", params.date_to);

        const suffix = query.toString();
        const response = await fetch(`/api/pos/shifts/history${suffix ? `?${suffix}` : ""}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await parsePayload(response);
            throwBackendHttpError(response, errorData, "Failed to fetch shift history");
        }

        return unwrapBackendData(await parsePayload(response)) as ShiftHistoryResponse;
    },
};

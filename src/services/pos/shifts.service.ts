import { Shift } from "../../types/api/pos/shifts";
import { getCsrfTokenCached } from "@/utils/pos/csrf";

export const shiftsService = {
    getCurrentShift: async (): Promise<Shift | null> => {
        const response = await fetch("/api/pos/shifts/current", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error("Failed to fetch current shift");
        }

        return response.json();
    },

    openShift: async (startAmount: number): Promise<Shift> => {
        const csrfToken = await getCsrfTokenCached();

        const response = await fetch("/api/pos/shifts/open", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
            },
            credentials: "include",
            body: JSON.stringify({ start_amount: startAmount })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Failed to open shift");
        }

        return response.json();
    },

    closeShift: async (endAmount: number): Promise<Shift> => {
        const csrfToken = await getCsrfTokenCached();

        const response = await fetch("/api/pos/shifts/close", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
            },
            credentials: "include",
            body: JSON.stringify({ end_amount: endAmount })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Failed to close shift");
        }

        return response.json();
    },

    getCurrentSummary: async (): Promise<unknown> => {
        const response = await fetch("/api/pos/shifts/current/summary", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Failed to fetch shift summary");
        }

        return response.json();
    },

    getSummary: async (id: string): Promise<unknown> => {
        const response = await fetch(`/api/pos/shifts/summary/${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Failed to fetch shift summary");
        }

        return response.json();
    }
};

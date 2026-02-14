import { DashboardOverview, SalesSummary, TopItem } from "../../types/api/pos/dashboard";
import { API_ROUTES, API_PREFIX } from "../../config/api";
import { unwrapBackendData } from "../../utils/api/backendResponse";

export const dashboardService = {
    getSalesSummary: async (startDate: string, endDate: string): Promise<SalesSummary[]> => {
        const response = await fetch(`${API_PREFIX}${API_ROUTES.POS.DASHBOARD.SALES}?startDate=${startDate}&endDate=${endDate}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch sales summary");
        }

        return unwrapBackendData(await response.json()) as SalesSummary[];
    },

    getTopSellingItems: async (limit: number = 10): Promise<TopItem[]> => {
        const response = await fetch(`${API_PREFIX}${API_ROUTES.POS.DASHBOARD.TOP_ITEMS}?limit=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch top selling items");
        }

        return unwrapBackendData(await response.json()) as TopItem[];
    },

    getOverview: async (
        startDate: string,
        endDate: string,
        topLimit: number = 7,
        recentLimit: number = 8
    ): Promise<DashboardOverview> => {
        const queryParams = new URLSearchParams({
            startDate,
            endDate,
            topLimit: String(topLimit),
            recentLimit: String(recentLimit),
        });

        const response = await fetch(`${API_PREFIX}${API_ROUTES.POS.DASHBOARD.OVERVIEW}?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch dashboard overview");
        }

        return unwrapBackendData(await response.json()) as DashboardOverview;
    }
};

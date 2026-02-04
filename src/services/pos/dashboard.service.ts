import { SalesSummary, TopItem } from "../../types/api/pos/dashboard";
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
    }
};

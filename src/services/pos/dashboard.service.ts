import { SalesSummary, TopItem } from "../../types/api/pos/dashboard";

export const dashboardService = {
    getSalesSummary: async (startDate: string, endDate: string): Promise<SalesSummary[]> => {
        const response = await fetch(`/api/pos/dashboard/sales?startDate=${startDate}&endDate=${endDate}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch sales summary");
        }

        return response.json();
    },

    getTopSellingItems: async (limit: number = 10): Promise<TopItem[]> => {
        const response = await fetch(`/api/pos/dashboard/top-items?limit=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch top selling items");
        }

        return response.json();
    }
};

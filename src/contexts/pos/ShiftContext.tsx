
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { shiftsService } from "../../services/pos/shifts.service";
import { Shift } from "../../types/api/pos/shifts";
import { authService } from "../../services/auth.service";
import { message } from "antd";

interface ShiftContextType {
    currentShift: Shift | null;
    loading: boolean;
    openShift: (startAmount: number) => Promise<void>;
    closeShift: (endAmount: number) => Promise<void>;
    refreshShift: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const refreshShift = async () => {
        if (!user) return;
        try {
            const shift = await shiftsService.getCurrentShift(user.id);
            setCurrentShift(shift);
        } catch (error) {
            console.error("Error fetching shift:", error);
            // Don't show error message here to avoid spamming if user just logged in
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshShift();
    }, [user]);

    const openShift = async (startAmount: number) => {
        if (!user) return;
        try {
            const csrfToken = await authService.getCsrfToken();
            const newShift = await shiftsService.openShift(user.id, startAmount, undefined, csrfToken);
            setCurrentShift(newShift);
            message.success("เปิดกะเรียบร้อยแล้ว");
        } catch (error: any) {
            message.error(error.message || "เปิดกะไม่สำเร็จ");
            throw error;
        }
    };

    const closeShift = async (endAmount: number) => {
        if (!user) return;
        try {
            const csrfToken = await authService.getCsrfToken();
            const closedShift = await shiftsService.closeShift(user.id, endAmount, undefined, csrfToken);
            setCurrentShift(null); // Clear current shift or update to closed status?
            // If closed, we likely want to force user to open new shift or leave POS.
            // Setting null triggers OpenShiftModal again.
            message.success("ปิดกะเรียบร้อยแล้ว");
        } catch (error: any) {
            message.error(error.message || "ปิดกะไม่สำเร็จ");
            throw error;
        }
    };

    return (
        <ShiftContext.Provider value={{ currentShift, loading, openShift, closeShift, refreshShift }}>
            {children}
        </ShiftContext.Provider>
    );
};

export const useShift = (): ShiftContextType => {
    const context = useContext(ShiftContext);
    if (!context) {
        throw new Error("useShift must be used within a ShiftProvider");
    }
    return context;
};

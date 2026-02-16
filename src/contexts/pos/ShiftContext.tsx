"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { message } from "antd";

import { useAuth } from "../AuthContext";
import { shiftsService } from "../../services/pos/shifts.service";
import { Shift } from "../../types/api/pos/shifts";

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

    const refreshShift = useCallback(async () => {
        if (!user) return;
        try {
            const shift = await shiftsService.getCurrentShift();
            setCurrentShift(shift);
        } catch (error) {
            console.error("Error fetching shift:", error);
            // Avoid noisy toast after login if branch/session is still initializing.
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshShift();
    }, [refreshShift]);

    const openShift = async (startAmount: number) => {
        if (!user) return;
        try {
            const newShift = await shiftsService.openShift(startAmount);
            setCurrentShift(newShift);
            message.success("เปิดกะเรียบร้อยแล้ว");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "เปิดกะไม่สำเร็จ");
            throw error;
        }
    };

    const closeShift = async (endAmount: number) => {
        if (!user) return;
        try {
            await shiftsService.closeShift(endAmount);
            setCurrentShift(null);
            message.success("ปิดกะเรียบร้อยแล้ว");
        } catch (error) {
            // Let caller decide how to present rich errors (e.g. pending orders by channel).
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

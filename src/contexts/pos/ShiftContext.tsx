"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { message } from "antd";

import { useAuth } from "../AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { shiftsService } from "../../services/pos/shifts.service";
import { Shift } from "../../types/api/pos/shifts";
import { removeCache, writeCache, readCache } from "../../utils/pos/cache";
import { useRealtimeRefresh } from "../../utils/pos/realtime";
import { RealtimeEvents } from "../../utils/realtimeEvents";

type RefreshShiftOptions = {
    silent?: boolean;
};

interface ShiftContextType {
    currentShift: Shift | null;
    loading: boolean;
    openShift: (startAmount: number) => Promise<Shift>;
    closeShift: (endAmount: number) => Promise<Shift>;
    refreshShift: (options?: RefreshShiftOptions) => Promise<Shift | null>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);
const SHIFT_CACHE_TTL_MS = 60_000;

function getShiftCacheKey(branchId?: string) {
    return `pos:shift:current:${branchId || "default"}`;
}

export const ShiftProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const branchId = user?.branch_id || user?.branch?.id;
    const cacheKey = useMemo(() => getShiftCacheKey(branchId), [branchId]);
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const persistShift = useCallback(
        (shift: Shift | null) => {
            if (shift) {
                writeCache(cacheKey, shift);
                return;
            }
            removeCache(cacheKey);
        },
        [cacheKey],
    );

    const refreshShift = useCallback(
        async (options?: RefreshShiftOptions) => {
            const silent = options?.silent ?? false;

            if (!user || !branchId) {
                setCurrentShift(null);
                setLoading(false);
                persistShift(null);
                return null;
            }

            if (!silent) {
                setLoading(true);
            }

            try {
                const shift = await shiftsService.getCurrentShift();
                setCurrentShift(shift);
                persistShift(shift);
                return shift;
            } catch (error) {
                console.error("Error fetching current shift:", error);
                setCurrentShift(null);
                persistShift(null);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [branchId, persistShift, user],
    );

    useEffect(() => {
        if (!user || !branchId) {
            setCurrentShift(null);
            setLoading(false);
            persistShift(null);
            return;
        }

        const cachedShift = readCache<Shift>(cacheKey, SHIFT_CACHE_TTL_MS);
        if (cachedShift) {
            setCurrentShift(cachedShift);
            setLoading(false);
            void refreshShift({ silent: true });
            return;
        }

        void refreshShift();
    }, [branchId, cacheKey, persistShift, refreshShift, user]);

    useRealtimeRefresh({
        socket,
        events: [RealtimeEvents.shifts.update],
        enabled: Boolean(user && branchId),
        debounceMs: 500,
        onRefresh: () => {
            void refreshShift({ silent: true });
        },
    });

    const openShift = useCallback(
        async (startAmount: number) => {
            if (!user) {
                throw new Error("User not authenticated");
            }

            try {
                const newShift = await shiftsService.openShift(startAmount);
                setCurrentShift(newShift);
                persistShift(newShift);
                message.success("เปิดกะเรียบร้อยแล้ว");
                return newShift;
            } catch (error) {
                message.error(error instanceof Error ? error.message : "เปิดกะไม่สำเร็จ");
                throw error;
            }
        },
        [persistShift, user],
    );

    const closeShift = useCallback(
        async (endAmount: number): Promise<Shift> => {
            if (!user) {
                throw new Error("User not authenticated");
            }

            const closedShift = await shiftsService.closeShift(endAmount);
            setCurrentShift(null);
            persistShift(null);
            message.success("ปิดกะเรียบร้อยแล้ว");
            return closedShift;
        },
        [persistShift, user],
    );

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

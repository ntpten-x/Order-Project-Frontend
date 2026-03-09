"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect } from "react";

import { SocketContext } from "../../contexts/SocketContext";
import { shopProfileService, ShopProfile } from "../../services/pos/shopProfile.service";
import { RealtimeEvents } from "../../utils/realtimeEvents";

export function useShopProfile(enabled = true) {
    const { socket, isConnected } = useContext(SocketContext);
    const queryClient = useQueryClient();

    const query = useQuery<ShopProfile>({
        queryKey: ["shopProfile"],
        queryFn: () => shopProfileService.getProfile(),
        enabled,
        staleTime: isConnected ? 5 * 60_000 : 30_000,
        refetchInterval: isConnected ? false : 60_000,
        refetchIntervalInBackground: false,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            void queryClient.invalidateQueries({ queryKey: ["shopProfile"] });
        };

        socket.on(RealtimeEvents.shopProfile.update, handleUpdate);
        return () => {
            socket.off(RealtimeEvents.shopProfile.update, handleUpdate);
        };
    }, [queryClient, socket]);

    return {
        profile: query.data ?? null,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        refetch: query.refetch,
    };
}

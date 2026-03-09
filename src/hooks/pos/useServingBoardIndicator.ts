"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useSocket } from "../useSocket";
import { servingBoardService } from "../../services/pos/servingBoard.service";
import type { ServingBoardGroup } from "../../types/api/pos/servingBoard";
import { ORDER_REALTIME_EVENTS } from "../../utils/pos/orderRealtimeEvents";
import { useRealtimeRefresh } from "../../utils/pos/realtime";
import { RealtimeEvents } from "../../utils/realtimeEvents";

export const SERVING_BOARD_QUERY_KEY = ["serving-board"] as const;

type UseServingBoardIndicatorOptions = {
  enabled?: boolean;
  liveUpdates?: boolean;
};

export function countServingBoardPendingItems(groups: ServingBoardGroup[]) {
  return groups.reduce(
    (sum, group) => sum + Math.max(0, Number(group.pending_count) || 0),
    0,
  );
}

export function countServingBoardTotalItems(groups: ServingBoardGroup[]) {
  return groups.reduce(
    (sum, group) => sum + Math.max(0, Number(group.total_items) || 0),
    0,
  );
}

export function useServingBoardIndicator(
  options: UseServingBoardIndicatorOptions = {},
) {
  const { enabled = true, liveUpdates = true } = options;
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  const { data = [], isLoading, isFetching, error } = useQuery<
    ServingBoardGroup[]
  >({
    queryKey: SERVING_BOARD_QUERY_KEY,
    queryFn: () => servingBoardService.getBoard(),
    enabled,
    staleTime: isConnected ? 45_000 : 7_500,
    refetchInterval: enabled && !isConnected ? 15_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  const refreshServingBoard = useCallback(() => {
    if (!enabled) return;
    void queryClient.invalidateQueries({ queryKey: SERVING_BOARD_QUERY_KEY });
  }, [enabled, queryClient]);

  useRealtimeRefresh({
    socket,
    events: [...ORDER_REALTIME_EVENTS, RealtimeEvents.servingBoard.update],
    onRefresh: refreshServingBoard,
    debounceMs: 500,
    enabled: enabled && liveUpdates,
  });

  const pendingItems = useMemo(() => {
    if (!enabled) return 0;
    return countServingBoardPendingItems(data);
  }, [data, enabled]);

  const totalItems = useMemo(() => {
    if (!enabled) return 0;
    return countServingBoardTotalItems(data);
  }, [data, enabled]);

  return {
    hasItems: totalItems > 0,
    hasPendingItems: pendingItems > 0,
    pendingItems,
    totalItems,
    isLoading: enabled ? isLoading : false,
    isFetching: enabled ? isFetching : false,
    error: enabled ? error : null,
  };
}

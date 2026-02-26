import { useQuery } from "@tanstack/react-query";
import { useContext } from 'react';
import { SocketContext } from "../../contexts/SocketContext";
import { Tables } from "../../types/api/pos/tables";
import { tablesService } from "../../services/pos/tables.service";

export function useTables() {
    // Note: isConnected is optionally used for staleTime/refetchInterval logic if needed, 
    // but the warning specifically mentions 'socket' and 'queryClient'.
    // However, looking at the code, we actually use isConnected below. 
    // Let's keep only what's necessary.
    const { isConnected } = useContext(SocketContext);

    const { data, error, isLoading, refetch } = useQuery<Tables[]>({
        queryKey: ['tables'],
        queryFn: async () => {
            const result = await tablesService.getAll();
            return result.data;
        },
        // Table changes are pushed by socket events; keep short fallback only when socket is unavailable.
        staleTime: isConnected ? 45_000 : 7_500,
        refetchInterval: isConnected ? false : 15_000,
        refetchIntervalInBackground: false,
        refetchOnReconnect: true
    });

    // Socket listeners simplified: useOrderSocketEvents handles global invalidation for 'tables'
    // and 'orders' keys. No need to duplicate listeners here.

    return {
        tables: data || [],
        isLoading,
        isError: error,
        mutate: refetch, // Mapping refetch to mutate
    };
}

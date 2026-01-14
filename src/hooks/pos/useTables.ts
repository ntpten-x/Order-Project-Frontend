import useSWR from "swr";
import { tablesService } from "../../services/pos/tables.service";
import { Tables } from "../../types/api/pos/tables";

export function useTables() {
    const { data, error, isLoading, mutate } = useSWR<Tables[]>(
        `/pos/tables`,
        () => tablesService.getAll(),
        {
            revalidateOnFocus: true,
            dedupingInterval: 5000,
        }
    );

    return {
        tables: data || [],
        isLoading,
        isError: error,
        mutate,
    };
}

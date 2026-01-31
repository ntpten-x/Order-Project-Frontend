import { useQuery } from '@tanstack/react-query';
import { discountsService } from '../../services/pos/discounts.service';
import { Discounts } from '../../types/api/pos/discounts';
import { readCache, writeCache } from '../../utils/pos/cache';

const DISCOUNT_CACHE_KEY = "pos:discounts";
const DISCOUNT_CACHE_TTL = 5 * 60 * 1000;

export function useDiscounts() {
    const { data, error, isLoading, refetch } = useQuery<Discounts[]>({
        queryKey: ['discounts'],
        queryFn: async () => {
            const list = await discountsService.getAll();
            if (list?.length) {
                writeCache(DISCOUNT_CACHE_KEY, list);
            }
            return list;
        },
        initialData: () => readCache<Discounts[]>(DISCOUNT_CACHE_KEY, DISCOUNT_CACHE_TTL) || undefined,
        staleTime: 5000,
    });

    return {
        discounts: data || [],
        isLoading,
        isError: error,
        mutate: refetch,
    };
}

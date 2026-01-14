import useSWR from 'swr';
import { discountsService } from '../../services/pos/discounts.service';
import { Discounts } from '../../types/api/pos/discounts';

export function useDiscounts() {
    const { data, error, isLoading, mutate } = useSWR<Discounts[]>(
        `/pos/discounts`,
        () => discountsService.getAll(),
        {
            revalidateOnFocus: true,
            dedupingInterval: 5000,
        }
    );

    return {
        discounts: data || [],
        isLoading,
        isError: error,
        mutate,
    };
}

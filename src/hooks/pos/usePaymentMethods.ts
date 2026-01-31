import { useQuery } from '@tanstack/react-query';
import { paymentMethodService } from '../../services/pos/paymentMethod.service';
import { PaymentMethod } from '../../types/api/pos/paymentMethod';
import { readCache, writeCache } from '../../utils/pos/cache';

const PAYMENT_METHOD_CACHE_KEY = "pos:payment-methods";
const PAYMENT_METHOD_CACHE_TTL = 5 * 60 * 1000;

export function usePaymentMethods() {
    const { data, error, isLoading, refetch } = useQuery<PaymentMethod[]>({
        queryKey: ['paymentMethods'],
        queryFn: async () => {
            const result = await paymentMethodService.getAll();
            const list = result.data || [];
            if (list.length) {
                writeCache(PAYMENT_METHOD_CACHE_KEY, list);
            }
            return list;
        },
        initialData: () => readCache<PaymentMethod[]>(PAYMENT_METHOD_CACHE_KEY, PAYMENT_METHOD_CACHE_TTL) || undefined,
        staleTime: 5000,
    });

    return {
        paymentMethods: data || [],
        isLoading,
        isError: error,
        mutate: refetch,
    };
}

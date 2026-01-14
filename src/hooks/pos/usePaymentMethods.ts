import useSWR from 'swr';
import { paymentMethodService } from '../../services/pos/paymentMethod.service';
import { PaymentMethod } from '../../types/api/pos/paymentMethod';

export function usePaymentMethods() {
    const { data, error, isLoading, mutate } = useSWR<PaymentMethod[]>(
        `/pos/paymentMethod`,
        () => paymentMethodService.getAll(),
        {
            revalidateOnFocus: true,
            dedupingInterval: 5000,
        }
    );

    return {
        paymentMethods: data || [],
        isLoading,
        isError: error,
        mutate,
    };
}

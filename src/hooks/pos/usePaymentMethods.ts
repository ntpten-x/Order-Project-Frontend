import { useQuery } from '@tanstack/react-query';
import { paymentMethodService } from '../../services/pos/paymentMethod.service';
import { PaymentMethod } from '../../types/api/pos/paymentMethod';

export function usePaymentMethods() {
    const { data, error, isLoading, refetch } = useQuery<PaymentMethod[]>({
        queryKey: ['paymentMethods'],
        queryFn: () => paymentMethodService.getAll(),
        staleTime: 5000,
    });

    return {
        paymentMethods: data || [],
        isLoading,
        isError: error,
        mutate: refetch,
    };
}

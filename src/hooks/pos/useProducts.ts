import useSWR from 'swr';
import { productsService } from '../../services/pos/products.service';
import { Products } from '../../types/api/pos/products';

export function useProducts(page: number = 1, limit: number = 20, categoryId?: string) {
    const { data, error, isLoading, mutate } = useSWR<{ data: Products[], total: number, page: number, last_page: number }>(
        `/pos/products?page=${page}&limit=${limit}&category_id=${categoryId || ''}`,
        () => {
            const params = new URLSearchParams();
            if (categoryId) params.append("category_id", categoryId);
            return productsService.findAll(page, limit, undefined, params);
        },
        {
            refreshInterval: 3000, // Poll every 3 seconds
            revalidateOnFocus: true,
            dedupingInterval: 2000,
            keepPreviousData: true, // Keep data while fetching new page
        }
    );

    return {
        products: data?.data || [],
        total: data?.total || 0,
        currentPage: data?.page || 1,
        lastPage: data?.last_page || 1,
        isLoading,
        isError: error,
        mutate,
    };
}

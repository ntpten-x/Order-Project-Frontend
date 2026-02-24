'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { type CreatedSort } from '../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT, parseCreatedSort } from '../../lib/list-sort';

export type ListStateOptions<F extends Record<string, any>> = {
    defaultPageSize?: number;
    defaultFilters?: F;
    debounceMs?: number;
};

export function useListState<F extends Record<string, any>>(options: ListStateOptions<F> = {}) {
    const {
        defaultPageSize = 12,
        defaultFilters = {} as F,
        debounceMs = 300,
    } = options;

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isUrlReadyRef = useRef(false);

    // Basic States
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [filters, setFilters] = useState<F>(defaultFilters);

    const debouncedSearch = useDebouncedValue(searchText, debounceMs);

    // Sync from URL on mount
    useEffect(() => {
        if (isUrlReadyRef.current) return;

        const p = parseInt(searchParams.get('page') || '1', 10);
        const l = parseInt(searchParams.get('limit') || String(defaultPageSize), 10);
        const q = searchParams.get('q') || '';
        const s = searchParams.get('sort_created');

        setPage(Math.max(1, p));
        setPageSize(Math.max(1, l));
        setSearchText(q);
        setCreatedSort(parseCreatedSort(s));

        // Sync custom filters from URL
        const nextFilters = { ...defaultFilters };
        Object.keys(defaultFilters).forEach((key) => {
            const val = searchParams.get(key);
            if (val !== null) {
                (nextFilters as any)[key] = val;
            }
        });
        setFilters(nextFilters);

        isUrlReadyRef.current = true;
    }, [searchParams, defaultFilters, defaultPageSize]);

    // Sync to URL
    useEffect(() => {
        if (!isUrlReadyRef.current) return;

        const params = new URLSearchParams();
        if (page > 1) params.set('page', String(page));
        if (pageSize !== defaultPageSize) params.set('limit', String(pageSize));
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
        if (createdSort !== DEFAULT_CREATED_SORT) params.set('sort_created', createdSort);

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== 'all' && value !== undefined && value !== null && value !== '') {
                params.set(key, String(value));
            }
        });

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [router, pathname, page, pageSize, debouncedSearch, createdSort, filters, defaultPageSize]);

    // Reset page on filter/search change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filters, createdSort]);

    const updateFilter = useCallback((key: keyof F, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const getQueryParams = useCallback(() => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(pageSize));
        params.set('sort_created', createdSort);
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== 'all' && value !== undefined && value !== null && value !== '') {
                params.set(key, String(value));
            }
        });

        return params;
    }, [page, pageSize, createdSort, debouncedSearch, filters]);

    return {
        // State
        page,
        pageSize,
        total,
        searchText,
        debouncedSearch,
        createdSort,
        filters,

        // Setters
        setPage,
        setPageSize,
        setTotal,
        setSearchText,
        setCreatedSort,
        setFilters,
        updateFilter,

        // Helpers
        getQueryParams,
        searchParams,
        isUrlReady: isUrlReadyRef.current,
    };
}

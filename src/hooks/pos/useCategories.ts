"use client";

import { useQuery } from "@tanstack/react-query";
import { categoryService } from "../../services/pos/category.service";
import { Category } from "../../types/api/pos/category";
import { readCache, writeCache } from "../../utils/pos/cache";

const CATEGORY_CACHE_KEY = "pos:categories";
const CATEGORY_CACHE_TTL = 5 * 60 * 1000;

export function useCategories() {
    return useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const data = await categoryService.findAll();
            if (data?.length) {
                writeCache(CATEGORY_CACHE_KEY, data);
            }
            return data;
        },
        initialData: () => readCache<Category[]>(CATEGORY_CACHE_KEY, CATEGORY_CACHE_TTL) || undefined,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });
}

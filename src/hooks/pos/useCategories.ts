"use client";

import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/pos/category.service";
import { Category } from "@/types/api/pos/category";

export function useCategories() {
    return useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: () => categoryService.findAll(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });
}

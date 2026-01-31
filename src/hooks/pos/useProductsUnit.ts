"use client";

import { useQuery } from "@tanstack/react-query";
import { productsUnitService } from "../../services/pos/productsUnit.service";
import { ProductsUnit } from "../../types/api/pos/productsUnit";
import { readCache, writeCache } from "../../utils/pos/cache";

const PRODUCTS_UNIT_CACHE_KEY = "pos:products-units";
const PRODUCTS_UNIT_CACHE_TTL = 5 * 60 * 1000;

export function useProductsUnit() {
    return useQuery<ProductsUnit[]>({
        queryKey: ["products-units"],
        queryFn: async () => {
            const data = await productsUnitService.findAll();
            if (data?.length) {
                writeCache(PRODUCTS_UNIT_CACHE_KEY, data);
            }
            return data;
        },
        initialData: () => readCache<ProductsUnit[]>(PRODUCTS_UNIT_CACHE_KEY, PRODUCTS_UNIT_CACHE_TTL) || undefined,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });
}

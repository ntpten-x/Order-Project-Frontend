"use client";

import { useQuery } from "@tanstack/react-query";
import { productsUnitService } from "@/services/pos/productsUnit.service";
import { ProductsUnit } from "@/types/api/pos/productsUnit";

export function useProductsUnit() {
    return useQuery<ProductsUnit[]>({
        queryKey: ["products-units"],
        queryFn: () => productsUnitService.findAll(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });
}

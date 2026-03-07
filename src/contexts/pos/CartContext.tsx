"use client";

import React from "react";
import { useCartStore } from "../../store/useCartStore";

export type { CartDetail, CartItem, OrderMode } from "../../store/useCartStore";

export function CartProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

// Legacy compatibility wrapper. Prefer selector-based useCartStore(...) in new code.
export const useCart = () => useCartStore();

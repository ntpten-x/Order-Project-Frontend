"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "../AuthContext";
import { Ingredients } from "../../types/api/stock/ingredients";

interface CartItem {
  ingredient: Ingredients;
  quantity: number;
  note?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (ingredient: Ingredients) => void;
  removeFromCart: (ingredientId: string) => void;
  updateQuantity: (ingredientId: string, quantity: number) => void;
  updateItemNote: (ingredientId: string, note: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function isCartItemArray(value: unknown): value is CartItem[] {
  return Array.isArray(value);
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncBranchContext = async () => {
      try {
        const response = await fetch("/api/auth/active-branch", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        setActiveBranchId(typeof payload?.active_branch_id === "string" ? payload.active_branch_id : null);
      } catch {
        setActiveBranchId(null);
      }
    };

    const handleBranchChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ activeBranchId?: string | null }>).detail;
      if (typeof detail?.activeBranchId === "string") {
        setActiveBranchId(detail.activeBranchId);
        return;
      }
      setActiveBranchId(null);
    };

    void syncBranchContext();
    window.addEventListener("active-branch-changed", handleBranchChanged);
    return () => {
      window.removeEventListener("active-branch-changed", handleBranchChanged);
    };
  }, []);

  const storageKey = useMemo(() => {
    const branchKey = activeBranchId || user?.branch?.id || user?.branch_id || "no-branch";
    const userKey = user?.id || "anonymous";
    return `stock_cart:${userKey}:${branchKey}`;
  }, [activeBranchId, user?.branch?.id, user?.branch_id, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const rawCart = window.localStorage.getItem(storageKey);
      if (!rawCart) {
        setItems([]);
        return;
      }

      const parsedCart = JSON.parse(rawCart);
      setItems(isCartItemArray(parsedCart) ? parsedCart : []);
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (items.length === 0) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addToCart = useCallback((ingredient: Ingredients) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.ingredient.id === ingredient.id);
      if (existing) {
        return prev.map((item) =>
          item.ingredient.id === ingredient.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ingredient, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((ingredientId: string) => {
    setItems((prev) => prev.filter((item) => item.ingredient.id !== ingredientId));
  }, []);

  const updateQuantity = useCallback(
    (ingredientId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(ingredientId);
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.ingredient.id === ingredientId ? { ...item, quantity } : item
        )
      );
    },
    [removeFromCart]
  );

  const updateItemNote = useCallback((ingredientId: string, note: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.ingredient.id === ingredientId ? { ...item, note } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateItemNote,
      clearCart,
      itemCount,
    }),
    [addToCart, clearCart, itemCount, items, removeFromCart, updateItemNote, updateQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

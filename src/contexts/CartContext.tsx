"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Ingredients } from "@/types/api/ingredients";

interface CartItem {
  ingredient: Ingredients;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (ingredient: Ingredients) => void;
  removeFromCart: (ingredientId: string) => void;
  updateQuantity: (ingredientId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("shopping_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from local storage", error);
      }
    }
  }, []);

  // Save to local storage whenever items change
  useEffect(() => {
    localStorage.setItem("shopping_cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (ingredient: Ingredients) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.ingredient.id === ingredient.id);
      if (existing) {
        return prev.map((i) =>
          i.ingredient.id === ingredient.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ingredient, quantity: 1 }];
    });
  };

  const removeFromCart = (ingredientId: string) => {
    setItems((prev) => prev.filter((i) => i.ingredient.id !== ingredientId));
  };

  const updateQuantity = (ingredientId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(ingredientId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.ingredient.id === ingredientId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

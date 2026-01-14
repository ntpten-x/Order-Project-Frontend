"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Products } from "../../types/api/pos/products";
import { Discounts } from "../../types/api/pos/discounts";
import { PaymentMethod } from "../../types/api/pos/paymentMethod";

export interface CartItem {
    product: Products;
    quantity: number;
    notes?: string;
    discount?: number;
}

export type OrderMode = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Products, quantity?: number, notes?: string) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    updateItemNote: (productId: string, notes: string) => void;
    clearCart: () => void;
    
    // Order Metadata
    orderMode: OrderMode;
    setOrderMode: (mode: OrderMode) => void;
    referenceId: string | null;
    setReferenceId: (id: string | null) => void;
    referenceCode: string | null;
    setReferenceCode: (code: string | null) => void;
    
    // Checkout State
    selectedDiscount: Discounts | null;
    setSelectedDiscount: (discount: Discounts | null) => void;
    selectedPaymentMethod: PaymentMethod | null;
    setSelectedPaymentMethod: (method: PaymentMethod | null) => void;
    
    // Calculations
    getTotalItems: () => number;
    getSubtotal: () => number; // Raw total before discounts
    getDiscountAmount: () => number; // Calculated discount amount
    getFinalPrice: () => number; // Final price to pay
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    
    // Order State
    const [orderMode, setOrderMode] = useState<OrderMode>('DINE_IN');
    const [referenceId, setReferenceId] = useState<string | null>(null);
    const [referenceCode, setReferenceCode] = useState<string | null>(null);
    const [selectedDiscount, setSelectedDiscount] = useState<Discounts | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

    const addToCart = (product: Products, quantity: number = 1, notes?: string) => {
        setCartItems((prevItems) => {
            // Check if item with same ID AND same notes exists
            // Ideally, we might want to separate by notes, but for now let's keep it simple by product ID
            const existingItem = prevItems.find((item) => item.product.id === product.id);
            if (existingItem) {
                return prevItems.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
                        : item
                );
            }
            return [...prevItems, { product, quantity, notes }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const updateItemNote = (productId: string, notes: string) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.product.id === productId ? { ...item, notes } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setSelectedDiscount(null);
        setSelectedPaymentMethod(null);
        setReferenceId(null);
        setReferenceCode(null);
    };

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    const getSubtotal = () => {
        return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
    };

    const getDiscountAmount = () => {
        const subtotal = getSubtotal();
        if (!selectedDiscount) return 0;
        
        if (selectedDiscount.discount_type === 'Percentage') {
             // Calculate percentage discount
             return (subtotal * selectedDiscount.discount_amount) / 100;
        } else {
             // Fixed amount discount
             // Ensure discount doesn't exceed subtotal (optional policy)
             return Math.min(selectedDiscount.discount_amount, subtotal);
        }
    };

    const getFinalPrice = () => {
        const subtotal = getSubtotal();
        const discount = getDiscountAmount();
        return Math.max(0, subtotal - discount);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                updateItemNote, // Add this
                clearCart,
                
                orderMode,
                setOrderMode,
                referenceId,
                setReferenceId,
                referenceCode,
                setReferenceCode,
                
                selectedDiscount,
                setSelectedDiscount,
                selectedPaymentMethod,
                setSelectedPaymentMethod,
                
                getTotalItems,
                getSubtotal,
                getDiscountAmount,
                getFinalPrice,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

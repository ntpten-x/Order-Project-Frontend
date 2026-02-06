"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Products } from "../../types/api/pos/products";
import { Discounts } from "../../types/api/pos/discounts";
import { PaymentMethod } from "../../types/api/pos/paymentMethod";

export interface CartDetail {
    detail_name: string;
    extra_price: number;
}

export interface CartItem {
    cart_item_id: string;
    product: Products;
    quantity: number;
    notes?: string;
    discount?: number;
    details?: CartDetail[];
}

export type OrderMode = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Products, quantity?: number, notes?: string) => string;
    removeFromCart: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    updateItemNote: (cartItemId: string, notes: string) => void;
    clearCart: () => void;
    
    // Detail/Topping Management
    addDetailToItem: (cartItemId: string, detail: CartDetail) => void;
    removeDetailFromItem: (cartItemId: string, detailIndex: number) => void;
    updateItemDetails: (cartItemId: string, details: CartDetail[]) => void;
    
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
    // Initialize state with empty values (hydration safe)
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    
    // Order State
    const [orderMode, setOrderMode] = useState<OrderMode>('DINE_IN');
    const [referenceId, setReferenceId] = useState<string | null>(null);
    const [referenceCode, setReferenceCode] = useState<string | null>(null);
    const [selectedDiscount, setSelectedDiscount] = useState<Discounts | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

    const [isInitialized, setIsInitialized] = useState(false);

    // Load from LocalStorage on mount
    React.useEffect(() => {
        const savedCart = localStorage.getItem('pos_cart_items');
        const savedMode = localStorage.getItem('pos_order_mode');
        const savedRefId = localStorage.getItem('pos_ref_id');
        const savedRefCode = localStorage.getItem('pos_ref_code');
        const savedDiscount = localStorage.getItem('pos_discount');
        const savedPayment = localStorage.getItem('pos_payment');

        if (savedCart) {
            try {
                const parsedCart: CartItem[] = JSON.parse(savedCart);
                // Ensure all items have a unique ID (handling legacy items)
                const validatedCart = parsedCart.map((item, index) => ({
                    ...item,
                    cart_item_id: item.cart_item_id || `item-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
                }));
                setCartItems(validatedCart);
            } catch (e) {
                console.error("Failed to parse cart:", e);
                setCartItems([]);
            }
        }
        if (savedMode) setOrderMode(savedMode as OrderMode);
        if (savedRefId) setReferenceId(savedRefId);
        if (savedRefCode) setReferenceCode(savedRefCode);
        if (savedDiscount) setSelectedDiscount(JSON.parse(savedDiscount));
        if (savedPayment) setSelectedPaymentMethod(JSON.parse(savedPayment));
        
        setIsInitialized(true);
    }, []);

    // Save to LocalStorage on changes
    React.useEffect(() => {
        if (!isInitialized) return; // Don't overwrite with empty initial state
        localStorage.setItem('pos_cart_items', JSON.stringify(cartItems));
        localStorage.setItem('pos_order_mode', orderMode);
        if (referenceId) localStorage.setItem('pos_ref_id', referenceId); else localStorage.removeItem('pos_ref_id');
        if (referenceCode) localStorage.setItem('pos_ref_code', referenceCode); else localStorage.removeItem('pos_ref_code');
        if (selectedDiscount) localStorage.setItem('pos_discount', JSON.stringify(selectedDiscount)); else localStorage.removeItem('pos_discount');
        if (selectedPaymentMethod) localStorage.setItem('pos_payment', JSON.stringify(selectedPaymentMethod)); else localStorage.removeItem('pos_payment');
    }, [cartItems, orderMode, referenceId, referenceCode, selectedDiscount, selectedPaymentMethod, isInitialized]);

    const addToCart = (product: Products, quantity: number = 1, notes?: string) => {
        const cartItemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        setCartItems((prevItems) => {
            // Create new entry for every addition to ensure customization isolation
            const newItem: CartItem = {
                cart_item_id: cartItemId,
                product,
                quantity,
                notes,
                details: []
            };
            return [...prevItems, newItem];
        });
        return cartItemId;
    };

    const removeFromCart = (cartItemId: string) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.cart_item_id !== cartItemId));
    };

    const updateQuantity = (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(cartItemId);
            return;
        }
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.cart_item_id === cartItemId ? { ...item, quantity } : item
            )
        );
    };

    const updateItemNote = (cartItemId: string, notes: string) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.cart_item_id === cartItemId ? { ...item, notes } : item
            )
        );
    };

    const addDetailToItem = (cartItemId: string, detail: CartDetail) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.cart_item_id === cartItemId 
                    ? { ...item, details: [...(item.details || []), detail] }
                    : item
            )
        );
    };

    const removeDetailFromItem = (cartItemId: string, detailIndex: number) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.cart_item_id === cartItemId
                    ? { ...item, details: (item.details || []).filter((_, idx) => idx !== detailIndex) }
                    : item
            )
        );
    };

    const updateItemDetails = (cartItemId: string, details: CartDetail[]) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.cart_item_id === cartItemId
                    ? { ...item, details }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setSelectedDiscount(null);
        setSelectedPaymentMethod(null);
        setReferenceId(null);
        setReferenceCode(null);
        // LocalStorage will be updated by the effect
    };

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    const getSubtotal = () => {
        return cartItems.reduce((total, item) => {
            const productBasePrice =
                orderMode === 'DELIVERY'
                    ? Number(item.product.price_delivery ?? item.product.price)
                    : Number(item.product.price);
            const detailsPrice = (item.details || []).reduce((sum, d) => sum + Number(d.extra_price), 0);
            return total + (productBasePrice + detailsPrice) * item.quantity;
        }, 0);
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
                updateItemNote,
                clearCart,
                
                addDetailToItem,
                removeDetailFromItem,
                updateItemDetails,
                
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

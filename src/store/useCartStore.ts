"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Products } from "../types/api/pos/products";
import { Discounts } from "../types/api/pos/discounts";
import { PaymentMethod } from "../types/api/pos/paymentMethod";

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

export type OrderMode = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

type PersistedCartState = {
    cartItems: CartItem[];
    orderMode: OrderMode;
    referenceId: string | null;
    referenceCode: string | null;
    selectedDiscount: Discounts | null;
    selectedPaymentMethod: PaymentMethod | null;
};

type CartStoreState = PersistedCartState & {
    addToCart: (product: Products, quantity?: number, notes?: string) => string;
    removeFromCart: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    updateItemNote: (cartItemId: string, notes: string) => void;
    clearCart: () => void;
    addDetailToItem: (cartItemId: string, detail: CartDetail) => void;
    removeDetailFromItem: (cartItemId: string, detailIndex: number) => void;
    updateItemDetails: (cartItemId: string, details: CartDetail[]) => void;
    setOrderMode: (mode: OrderMode) => void;
    setReferenceId: (id: string | null) => void;
    setReferenceCode: (code: string | null) => void;
    setSelectedDiscount: (discount: Discounts | null) => void;
    setSelectedPaymentMethod: (method: PaymentMethod | null) => void;
    getTotalItems: () => number;
    getSubtotal: () => number;
    getDiscountAmount: () => number;
    getFinalPrice: () => number;
};

const CART_STORAGE_KEY = "pos-cart-store";

const createCartItemId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeCartItems = (cartItems?: CartItem[]) =>
    (cartItems ?? []).map((item, index) => ({
        ...item,
        cart_item_id: item.cart_item_id || `item-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`,
        details: item.details ?? [],
    }));

const getItemBasePrice = (item: CartItem, orderMode: OrderMode) =>
    orderMode === "DELIVERY"
        ? Number(item.product.price_delivery ?? item.product.price)
        : Number(item.product.price);

const calculateSubtotal = (cartItems: CartItem[], orderMode: OrderMode) =>
    cartItems.reduce((total, item) => {
        const detailsPrice = (item.details || []).reduce((sum, detail) => sum + Number(detail.extra_price), 0);
        return total + (getItemBasePrice(item, orderMode) + detailsPrice) * item.quantity;
    }, 0);

const calculateDiscountAmount = (subtotal: number, selectedDiscount: Discounts | null) => {
    if (!selectedDiscount) return 0;

    if (selectedDiscount.discount_type === "Percentage") {
        return (subtotal * selectedDiscount.discount_amount) / 100;
    }

    return Math.min(selectedDiscount.discount_amount, subtotal);
};

const calculateFinalPrice = (subtotal: number, discountAmount: number) => Math.max(0, subtotal - discountAmount);

const safeParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;

    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

const readLegacyCartState = (): PersistedCartState | null => {
    if (typeof window === "undefined") return null;

    const savedCart = window.localStorage.getItem("pos_cart_items");
    const savedMode = window.localStorage.getItem("pos_order_mode");
    const savedRefId = window.localStorage.getItem("pos_ref_id");
    const savedRefCode = window.localStorage.getItem("pos_ref_code");
    const savedDiscount = window.localStorage.getItem("pos_discount");
    const savedPayment = window.localStorage.getItem("pos_payment");

    if (!savedCart && !savedMode && !savedRefId && !savedRefCode && !savedDiscount && !savedPayment) {
        return null;
    }

    return {
        cartItems: normalizeCartItems(safeParse<CartItem[]>(savedCart, [])),
        orderMode: (savedMode as OrderMode) || initialState.orderMode,
        referenceId: savedRefId,
        referenceCode: savedRefCode,
        selectedDiscount: safeParse<Discounts | null>(savedDiscount, null),
        selectedPaymentMethod: safeParse<PaymentMethod | null>(savedPayment, null),
    };
};

const initialState: PersistedCartState = {
    cartItems: [],
    orderMode: "DINE_IN",
    referenceId: null,
    referenceCode: null,
    selectedDiscount: null,
    selectedPaymentMethod: null,
};

export const useCartStore = create<CartStoreState>()(
    persist(
        (set, get) => ({
            ...initialState,

            addToCart: (product, quantity = 1, notes) => {
                const cartItemId = createCartItemId();

                set((state) => ({
                    cartItems: [
                        ...state.cartItems,
                        {
                            cart_item_id: cartItemId,
                            product,
                            quantity,
                            notes,
                            details: [],
                        },
                    ],
                }));

                return cartItemId;
            },

            removeFromCart: (cartItemId) =>
                set((state) => ({
                    cartItems: state.cartItems.filter((item) => item.cart_item_id !== cartItemId),
                })),

            updateQuantity: (cartItemId, quantity) => {
                if (quantity <= 0) {
                    get().removeFromCart(cartItemId);
                    return;
                }

                set((state) => ({
                    cartItems: state.cartItems.map((item) =>
                        item.cart_item_id === cartItemId ? { ...item, quantity } : item
                    ),
                }));
            },

            updateItemNote: (cartItemId, notes) =>
                set((state) => ({
                    cartItems: state.cartItems.map((item) =>
                        item.cart_item_id === cartItemId ? { ...item, notes } : item
                    ),
                })),

            clearCart: () =>
                set({
                    cartItems: [],
                    selectedDiscount: null,
                    selectedPaymentMethod: null,
                    referenceId: null,
                    referenceCode: null,
                }),

            addDetailToItem: (cartItemId, detail) =>
                set((state) => ({
                    cartItems: state.cartItems.map((item) =>
                        item.cart_item_id === cartItemId
                            ? { ...item, details: [...(item.details || []), detail] }
                            : item
                    ),
                })),

            removeDetailFromItem: (cartItemId, detailIndex) =>
                set((state) => ({
                    cartItems: state.cartItems.map((item) =>
                        item.cart_item_id === cartItemId
                            ? { ...item, details: (item.details || []).filter((_, index) => index !== detailIndex) }
                            : item
                    ),
                })),

            updateItemDetails: (cartItemId, details) =>
                set((state) => ({
                    cartItems: state.cartItems.map((item) =>
                        item.cart_item_id === cartItemId ? { ...item, details } : item
                    ),
                })),

            setOrderMode: (orderMode) => set({ orderMode }),
            setReferenceId: (referenceId) => set({ referenceId }),
            setReferenceCode: (referenceCode) => set({ referenceCode }),
            setSelectedDiscount: (selectedDiscount) => set({ selectedDiscount }),
            setSelectedPaymentMethod: (selectedPaymentMethod) => set({ selectedPaymentMethod }),

            // These getters use get() so event handlers can read the latest cart snapshot
            // without subscribing the whole component to every cart update.
            getTotalItems: () => get().cartItems.reduce((total, item) => total + item.quantity, 0),
            getSubtotal: () => calculateSubtotal(get().cartItems, get().orderMode),
            getDiscountAmount: () => {
                const subtotal = get().getSubtotal();
                return calculateDiscountAmount(subtotal, get().selectedDiscount);
            },
            getFinalPrice: () => {
                const subtotal = get().getSubtotal();
                const discountAmount = get().getDiscountAmount();
                return calculateFinalPrice(subtotal, discountAmount);
            },
        }),
        {
            name: CART_STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                cartItems: state.cartItems,
                orderMode: state.orderMode,
                referenceId: state.referenceId,
                referenceCode: state.referenceCode,
                selectedDiscount: state.selectedDiscount,
                selectedPaymentMethod: state.selectedPaymentMethod,
            }),
            merge: (persistedState, currentState) => {
                const persisted = (persistedState as Partial<PersistedCartState> | undefined) ?? {};
                const legacyState =
                    persisted.cartItems ||
                    persisted.orderMode ||
                    persisted.referenceId ||
                    persisted.referenceCode ||
                    persisted.selectedDiscount ||
                    persisted.selectedPaymentMethod
                        ? null
                        : readLegacyCartState();
                const source = legacyState ?? persisted;

                return {
                    ...currentState,
                    ...source,
                    cartItems: normalizeCartItems(source.cartItems),
                };
            },
        }
    )
);

export const selectCartSummary = (state: CartStoreState) => {
    const totalItems = state.cartItems.reduce((total, item) => total + item.quantity, 0);
    const subtotal = calculateSubtotal(state.cartItems, state.orderMode);
    const discountAmount = calculateDiscountAmount(subtotal, state.selectedDiscount);

    return {
        totalItems,
        subtotal,
        discountAmount,
        finalPrice: calculateFinalPrice(subtotal, discountAmount),
    };
};

export const makeSelectCartItem = (cartItemId: string) => (state: CartStoreState) =>
    state.cartItems.find((item) => item.cart_item_id === cartItemId) ?? null;

"use client";

import React from 'react';
import { CartProvider } from '../../../contexts/pos/CartContext';

export default function POSLayout({ children }: { children: React.ReactNode }) {
    return (
        <CartProvider>
            {children}
        </CartProvider>
    );
}

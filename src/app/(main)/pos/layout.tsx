"use client";

import React from 'react';
import { CartProvider } from '../../../contexts/pos/CartContext';
import POSBottomNavigation from '../../../components/pos/POSBottomNavigation';

export default function POSLayout({ children }: { children: React.ReactNode }) {
    return (
        <CartProvider>
            {children}
            <POSBottomNavigation />
        </CartProvider>
    );
}

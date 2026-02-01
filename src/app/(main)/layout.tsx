"use client";

import React from "react";

import { CartProvider } from "../../contexts/stock/CartContext";
import { usePOSPrefetching } from "../../hooks/pos/usePrefetching";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prefetch POS data when user is in main layout (likely to navigate to POS)
  usePOSPrefetching();

  return (
    <CartProvider>
      <div className="min-h-screen pb-24 relative"> 
        {/* pb-24 to prevent content from being hidden behind the fixed bottom nav */}
        {children}
      </div>
    </CartProvider>
  );
}

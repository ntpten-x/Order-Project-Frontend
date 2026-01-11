import React from "react";
import StockBottomNavigation from "../../../components/stock/StockBottomNavigation";

import { CartProvider } from "../../../contexts/stock/CartContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen pb-24 relative"> 
        {/* pb-24 to prevent content from being hidden behind the fixed bottom nav */}
        {children}
        <StockBottomNavigation />
      </div>
    </CartProvider>
  );
}

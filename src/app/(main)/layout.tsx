import React from "react";
import BottomNavigation from "@/components/BottomNavigation";

import { CartProvider } from "@/contexts/CartContext";

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
        <BottomNavigation />
      </div>
    </CartProvider>
  );
}

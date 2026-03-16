"use client";

import type { ReactNode } from "react";
import StockBottomNavigation from "../../../components/stock/StockBottomNavigation";
import { CartProvider } from "../../../contexts/stock/CartContext";

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CartProvider>
      <div style={{ minHeight: "100%", background: "transparent" }}>
        <div style={{ background: "transparent" }}>{children}</div>
        <StockBottomNavigation />
      </div>
    </CartProvider>
  );
}

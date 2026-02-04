"use client";

import React from "react";
import { Layout } from "antd";
import StockBottomNavigation from "../../../components/stock/StockBottomNavigation";

import { CartProvider } from "../../../contexts/stock/CartContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Layout style={{ minHeight: "100%", background: "transparent" }}>
        <Layout.Content style={{ background: "transparent" }}>
          {children}
        </Layout.Content>
        <StockBottomNavigation />
      </Layout>
    </CartProvider>
  );
}

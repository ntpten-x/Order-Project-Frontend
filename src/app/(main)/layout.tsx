"use client";

import React from "react";
import { Layout } from "antd";

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
      <Layout style={{ minHeight: "100%", background: "transparent" }}>
        <Layout.Content style={{ background: "transparent" }}>
          {children}
        </Layout.Content>
      </Layout>
    </CartProvider>
  );
}

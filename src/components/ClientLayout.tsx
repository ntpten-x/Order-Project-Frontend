"use client";

import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { Grid, theme } from "antd";
import { useGlobalLoading } from "../contexts/pos/GlobalLoadingContext";
import { useNetworkInterceptors } from "../hooks/useNetworkInterceptors";
import { FLOATING_BOTTOM_NAV_CLEARANCE_PX } from "./navigation/constants";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { resetLoading } = useGlobalLoading();
  useNetworkInterceptors();
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();

  useEffect(() => {
    resetLoading();
  }, [pathname, resetLoading]);

  // ถ้าอยู่หน้า login ไม่ต้องใส่ padding-top
  const isLoginPage = pathname === "/login";
  const hasBottomNav =
    pathname.startsWith("/pos") ||
    pathname.startsWith("/stock") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/branch");
  const isMobile = !screens.md;
  const headerHeight = isLoginPage ? 0 : isMobile ? 56 : 64;
  const bottomNavOffset = isLoginPage
    ? 0
    : hasBottomNav
      ? FLOATING_BOTTOM_NAV_CLEARANCE_PX
      : 0;

  return (
    <main 
      style={{ 
        paddingTop: headerHeight,
        paddingBottom: bottomNavOffset
          ? `calc(${bottomNavOffset}px + env(safe-area-inset-bottom))`
          : 0,
        minHeight: "100vh",
        background: isLoginPage ? token.colorBgContainer : token.colorBgLayout,
        transition: "all 0.3s ease"
      }}
    >
      {children}
    </main>
  );
};

export default ClientLayout;

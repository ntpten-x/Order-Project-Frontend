"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
    FileTextOutlined, 
    HomeOutlined, 
    UserOutlined,
    AppstoreOutlined
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { useEffectivePermissions } from "../hooks/useEffectivePermissions";
import { canViewMenu } from "../lib/rbac/menu-visibility";
import { ordersService } from "../services/stock/orders.service";
import { useState, useEffect } from "react";
import FloatingBottomNav from "./navigation/FloatingBottomNav";
import { LegacyRealtimeEvents, RealtimeEvents } from "../utils/realtimeEvents";

const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { can, canAny, rows } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const [pendingCount, setPendingCount] = useState(0);
  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket } = useSocket();
  const canSeeMenu = React.useCallback(
    (menuKey: string) => canViewMenu(menuKey, { rows, can, canAny }),
    [rows, can, canAny]
  );
  const canViewOrdersMenu = canSeeMenu("menu.main.orders");

  const checkPendingOrders = React.useCallback(async () => {
    try {
        const searchParams = new URLSearchParams();
        searchParams.append("status", "pending");
        searchParams.append("t", Date.now().toString());

        const response = await ordersService.getAllOrders(undefined, searchParams);
        setPendingCount(response.total);
    } catch {
        // Silent fail
    }
  }, []);

  useEffect(() => {
    if (user && canViewOrdersMenu) checkPendingOrders();
  }, [user, canViewOrdersMenu, checkPendingOrders]);

  useEffect(() => {
      if (!socket || !canViewOrdersMenu) return;
      const scheduleRefresh = () => {
          if (refreshTimerRef.current) {
              clearTimeout(refreshTimerRef.current);
          }
          refreshTimerRef.current = setTimeout(() => {
              refreshTimerRef.current = null;
              void checkPendingOrders();
          }, 500);
      };
      const handleLegacyUpdate = (payload: { action?: string }) => {
          if (payload?.action === 'create' || payload?.action === 'update_status') {
              scheduleRefresh();
          }
      };
      socket.on(RealtimeEvents.stockOrders.create, scheduleRefresh);
      socket.on(RealtimeEvents.stockOrders.status, scheduleRefresh);
      socket.on(RealtimeEvents.stockOrders.delete, scheduleRefresh);
      socket.on(LegacyRealtimeEvents.stockOrdersUpdated, handleLegacyUpdate);
      const onFocus = () => checkPendingOrders();
      window.addEventListener('focus', onFocus);
      return () => { 
          socket.off(RealtimeEvents.stockOrders.create, scheduleRefresh);
          socket.off(RealtimeEvents.stockOrders.status, scheduleRefresh);
          socket.off(RealtimeEvents.stockOrders.delete, scheduleRefresh);
          socket.off(LegacyRealtimeEvents.stockOrdersUpdated, handleLegacyUpdate);
          window.removeEventListener('focus', onFocus);
          if (refreshTimerRef.current) {
              clearTimeout(refreshTimerRef.current);
              refreshTimerRef.current = null;
          }
      };
  }, [socket, canViewOrdersMenu, checkPendingOrders]);

  const menuItems = [
    {
      key: 'home',
      visibilityKey: "menu.main.home",
      label: 'Home',
      icon: <HomeOutlined />,
      path: '/',
    },
    {
        key: 'stock-home',
        visibilityKey: "menu.main.stock",
        label: 'Stock',
        icon: <AppstoreOutlined />,
        path: '/stock',
    },
    {
      key: 'items',
      visibilityKey: "menu.main.orders",
      label: 'Orders',
      icon: <FileTextOutlined />,
      path: '/stock/items',
    },
    {
      key: 'manage',
      visibilityKey: "menu.main.users",
      label: 'Users',
      icon: <UserOutlined />,
      path: '/users', 
    },
  ].filter((item) => canSeeMenu(item.visibilityKey));



  return (
    <FloatingBottomNav
      maxWidth={560}
      items={menuItems.map((item) => {
        const isActive =
          item.path === "/"
            ? pathname === "/"
            : pathname === item.path || pathname.startsWith(item.path + "/");

        return {
          key: item.key,
          label: item.label,
          icon: item.icon,
          onClick: () => router.push(item.path),
          active: isActive,
          badgeDot: item.key === "items" && canViewOrdersMenu && pendingCount > 0,
          ariaLabel: item.label,
        };
      })}
    />
  );
};

export default BottomNavigation;

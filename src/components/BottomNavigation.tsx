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
import { ordersService } from "../services/stock/orders.service";
import { useState, useEffect } from "react";
import FloatingBottomNav from "./navigation/FloatingBottomNav";
import { LegacyRealtimeEvents, RealtimeEvents } from "../utils/realtimeEvents";

const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const { socket } = useSocket();

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
    if (user) checkPendingOrders();
  }, [user, checkPendingOrders]);

  useEffect(() => {
      if (!socket) return;
      const scheduleRefresh = () => setTimeout(checkPendingOrders, 500);
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
      };
  }, [socket, checkPendingOrders]);

  const menuItems = [
    {
      key: 'home',
      label: 'Home',
      icon: <HomeOutlined />,
      path: '/',
    },
    {
        key: 'stock-home',
        label: 'Stock',
        icon: <AppstoreOutlined />,
        path: '/stock',
    },
    {
      key: 'items',
      label: 'Orders',
      icon: <FileTextOutlined />,
      path: '/stock/items',
    },
    ...((user?.role === 'Admin' || user?.role === 'Manager') ? [{
      key: 'manage',
      label: 'Users',
      icon: <UserOutlined />,
      path: '/users', 
    }] : []),
  ];



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
          badgeDot: item.key === "items" && pendingCount > 0,
          ariaLabel: item.label,
        };
      })}
    />
  );
};

export default BottomNavigation;

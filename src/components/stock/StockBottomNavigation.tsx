"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Drawer, List } from "antd";
import {
  EllipsisOutlined,
  FileTextOutlined,
  HistoryOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

import { useAuth } from "../../contexts/AuthContext";
import { useEffectivePermissions } from "../../hooks/useEffectivePermissions";
import { useSocket } from "../../hooks/useSocket";
import { canViewMenu } from "../../lib/rbac/menu-visibility";
import { ordersService } from "../../services/stock/orders.service";
import FloatingBottomNav from "../navigation/FloatingBottomNav";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../utils/realtimeEvents";

const StockBottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { can, canAny, rows } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const [pendingCount, setPendingCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket } = useSocket();

  const canSeeMenu = React.useCallback(
    (menuKey: string) => canViewMenu(menuKey, { rows, can, canAny }),
    [rows, can, canAny]
  );
  const canViewOrdersMenu = canSeeMenu("menu.stock.orders");

  const checkPendingOrders = useCallback(async () => {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append("status", "pending");
      searchParams.append("t", Date.now().toString());

      const response = await ordersService.getAllOrders(undefined, searchParams);
      setPendingCount(response.total);
    } catch {
      // ignore
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
      if (payload?.action === "create" || payload?.action === "update_status") {
        scheduleRefresh();
      }
    };

    socket.on(RealtimeEvents.stockOrders.create, scheduleRefresh);
    socket.on(RealtimeEvents.stockOrders.status, scheduleRefresh);
    socket.on(RealtimeEvents.stockOrders.delete, scheduleRefresh);
    socket.on(LegacyRealtimeEvents.stockOrdersUpdated, handleLegacyUpdate);
    const onFocus = () => checkPendingOrders();
    window.addEventListener("focus", onFocus);

    return () => {
      socket.off(RealtimeEvents.stockOrders.create, scheduleRefresh);
      socket.off(RealtimeEvents.stockOrders.status, scheduleRefresh);
      socket.off(RealtimeEvents.stockOrders.delete, scheduleRefresh);
      socket.off(LegacyRealtimeEvents.stockOrdersUpdated, handleLegacyUpdate);
      window.removeEventListener("focus", onFocus);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [socket, canViewOrdersMenu, checkPendingOrders]);

  const menuItems = [
    { key: "home", visibilityKey: "menu.stock.home", label: "หน้าแรก", icon: <HomeOutlined />, path: "/" },
    { key: "shopping", visibilityKey: "menu.stock.buying", label: "สั่งซื้อ", icon: <ShoppingOutlined />, path: "/stock" },
    {
      key: "orders",
      visibilityKey: "menu.stock.orders",
      label: "รายการ",
      icon: <FileTextOutlined />,
      path: "/stock/items",
    },
    { key: "history", visibilityKey: "menu.stock.history", label: "ประวัติ", icon: <HistoryOutlined />, path: "/stock/history" },
    {
      key: "ingredients",
      visibilityKey: "menu.stock.ingredients",
      label: "วัตถุดิบ",
      icon: <UnorderedListOutlined />,
      path: "/stock/ingredients",
    },
    {
      key: "ingredientsUnit",
      visibilityKey: "menu.stock.ingredientsUnit",
      label: "หน่วย",
      icon: <InfoCircleOutlined />,
      path: "/stock/ingredientsUnit",
    },
  ].filter((item) => canSeeMenu(item.visibilityKey));

  const isActivePath = (itemPath: string) => {
    if (itemPath === "/") return pathname === "/";
    return pathname === itemPath || pathname.startsWith(itemPath + "/");
  };

  const primaryItems = menuItems.slice(0, 4);
  const secondaryItems = menuItems.slice(4);
  const isSecondaryActive = secondaryItems.some((item) => isActivePath(item.path));

  return (
    <>
      <FloatingBottomNav
        maxWidth={560}
        items={[
          ...primaryItems.map((item) => ({
            key: item.key,
            label: item.label,
            icon: item.icon,
            onClick: () => router.push(item.path),
            active: isActivePath(item.path),
            badgeDot: item.key === "orders" && canViewOrdersMenu && pendingCount > 0,
          })),
          ...(secondaryItems.length
            ? [
                {
                  key: "more",
                  label: "เพิ่มเติม",
                  icon: <EllipsisOutlined />,
                  onClick: () => setMoreOpen(true),
                  active: isSecondaryActive,
                },
              ]
            : []),
        ]}
      />

      <Drawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        placement="bottom"
        height="auto"
        title="เมนูเพิ่มเติม"
        zIndex={2000}
      >
        <div style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
          <List
            dataSource={secondaryItems}
            renderItem={(item) => (
              <List.Item style={{ paddingInline: 0 }}>
                <Button
                  type="text"
                  block
                  icon={item.icon}
                  style={{ height: 48, justifyContent: "flex-start" }}
                  onClick={() => {
                    router.push(item.path);
                    setMoreOpen(false);
                  }}
                >
                  {item.label}
                </Button>
              </List.Item>
            )}
          />
        </div>
      </Drawer>
    </>
  );
};

export default StockBottomNavigation;

"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppstoreOutlined,
  CarOutlined,
  CreditCardOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  FireOutlined,
  HomeOutlined,
  PoweroffOutlined,
  TableOutlined,
  TagsOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  ShopOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Badge, Button, Drawer, List } from "antd";

import { useAuth } from "../../contexts/AuthContext";
import { useShift } from "../../contexts/pos/ShiftContext";
import { useEffectivePermissions } from "../../hooks/useEffectivePermissions";
import FloatingBottomNav from "../navigation/FloatingBottomNav";
import CloseShiftModal from "./shifts/CloseShiftModal";

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
};

const POSBottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { currentShift } = useShift();
  const { can, canAny } = useEffectivePermissions({ enabled: Boolean(user?.id) });

  const [moreOpen, setMoreOpen] = useState(false);
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);

  const primaryItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      { key: "home", label: "หน้าแรก", icon: <HomeOutlined />, path: "/" },
      { key: "pos", label: "ขาย", icon: <ShopOutlined />, path: "/pos" },
    ];

    if (can("orders.page", "view")) {
      items.push(
        {
          key: "orders",
          label: "ออเดอร์",
          icon: <FileTextOutlined />,
          path: "/pos/orders",
        },
        {
          key: "kitchen",
          label: "ครัว",
          icon: <FireOutlined />,
          path: "/pos/kitchen",
        }
      );
    }

    return items;
  }, [can]);

  const secondaryItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [];

    if (
      canAny([
        { resourceKey: "shifts.page", action: "view" },
        { resourceKey: "shifts.page", action: "create" },
        { resourceKey: "shifts.page", action: "update" },
      ])
    ) {
      items.push(
        {
          key: "shift",
          label: "กะการทำงาน",
          icon: <ClockCircleOutlined />,
          path: "/pos/shift",
        },
        {
          key: "shiftHistory",
          label: "ประวัติกะ",
          icon: <HistoryOutlined />,
          path: "/pos/shiftHistory",
        }
      );
    }

    if (can("reports.sales.page", "view")) {
      items.push({ key: "dashboard", label: "สรุป", icon: <AppstoreOutlined />, path: "/pos/dashboard" });
    }
    if (can("tables.page", "view")) {
      items.push({ key: "tables", label: "โต๊ะ", icon: <TableOutlined />, path: "/pos/tables" });
    }
    if (can("delivery.page", "view")) {
      items.push({ key: "delivery", label: "เดลิเวอรี่", icon: <CarOutlined />, path: "/pos/delivery" });
    }
    if (can("category.page", "view")) {
      items.push({ key: "category", label: "หมวดหมู่", icon: <AppstoreOutlined />, path: "/pos/category" });
    }
    if (can("products.page", "view")) {
      items.push(
        { key: "products", label: "สินค้า", icon: <ShopOutlined />, path: "/pos/products" },
        { key: "productsUnit", label: "หน่วยสินค้า", icon: <AppstoreOutlined />, path: "/pos/productsUnit" }
      );
    }
    if (can("discounts.page", "view")) {
      items.push({ key: "discounts", label: "ส่วนลด", icon: <TagsOutlined />, path: "/pos/discounts" });
    }
    if (can("payment_method.page", "view")) {
      items.push({ key: "payment", label: "ชำระเงิน", icon: <CreditCardOutlined />, path: "/pos/paymentMethod" });
    }

    if (
      canAny([
        { resourceKey: "payment_accounts.page", action: "view" },
        { resourceKey: "shop_profile.page", action: "view" },
        { resourceKey: "shop_profile.page", action: "update" },
      ])
    ) {
      items.push({
        key: "settings",
        label: "ตั้งค่า",
        icon: <SettingOutlined />,
        path: "/pos/settings",
      });
    }

    return items;
  }, [can, canAny]);

  const isActivePath = (itemPath: string) => {
    if (itemPath === "/") return pathname === "/";
    if (itemPath === "/pos") {
      return pathname === "/pos" || pathname.startsWith("/pos/channels");
    }

    return pathname === itemPath || pathname.startsWith(itemPath + "/");
  };

  const isSecondaryActive = secondaryItems.some((item) => isActivePath(item.path));

  const handleNavigate = (path: string) => {
    router.push(path);
    setMoreOpen(false);
  };

  return (
    <>
      <FloatingBottomNav
        maxWidth={520}
        items={[
          ...primaryItems.map((item) => ({
            key: item.key,
            label: item.label,
            icon: item.icon,
            onClick: () => handleNavigate(item.path),
            active: isActivePath(item.path),
          })),
          {
            key: "more",
            label: "เพิ่มเติม",
            icon: <EllipsisOutlined />,
            onClick: () => setMoreOpen(true),
            active: moreOpen || isSecondaryActive,
          },
        ]}
      />

      <Drawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        placement="bottom"
        title="เมนูเพิ่มเติม"
        zIndex={2000}
      >
        <div style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
          {secondaryItems.length > 0 && (
            <List
              dataSource={secondaryItems}
              renderItem={(item) => (
                <List.Item style={{ paddingInline: 0 }}>
                  <Button
                    type="text"
                    block
                    icon={item.icon}
                    style={{ height: 48, justifyContent: "flex-start" }}
                    onClick={() => handleNavigate(item.path)}
                  >
                    {item.label}
                  </Button>
                </List.Item>
              )}
            />
          )}

          {currentShift && (
            <Button
              danger
              block
              icon={
                <Badge dot status="processing" color="#ef4444">
                  <PoweroffOutlined />
                </Badge>
              }
              style={{ height: 48, marginTop: 8 }}
              onClick={() => {
                setCloseShiftModalOpen(true);
                setMoreOpen(false);
              }}
            >
              ปิดกะ
            </Button>
          )}
        </div>
      </Drawer>

      <CloseShiftModal
        open={closeShiftModalOpen}
        onCancel={() => setCloseShiftModalOpen(false)}
      />
    </>
  );
};

export default POSBottomNavigation;


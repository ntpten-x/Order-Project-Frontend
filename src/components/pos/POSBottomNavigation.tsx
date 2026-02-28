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
  QrcodeOutlined,
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
import { canViewMenu } from "../../lib/rbac/menu-visibility";
import FloatingBottomNav from "../navigation/FloatingBottomNav";
import CloseShiftModal from "./shifts/CloseShiftModal";

type MenuItem = {
  key: string;
  visibilityKey: string;
  label: string;
  icon: React.ReactNode;
  path: string;
};

const POSBottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { currentShift } = useShift();
  const { can, canAny, rows } = useEffectivePermissions({ enabled: Boolean(user?.id) });

  const [moreOpen, setMoreOpen] = useState(false);
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);

  const canSeeMenu = React.useCallback(
    (menuKey: string) => canViewMenu(menuKey, { rows, can, canAny }),
    [rows, can, canAny]
  );

  const primaryItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      { key: "home", visibilityKey: "menu.pos.home", label: "หน้าแรก", icon: <HomeOutlined />, path: "/" },
      { key: "pos", visibilityKey: "menu.pos.sell", label: "ขาย", icon: <ShopOutlined />, path: "/pos" },
      {
        key: "orders",
        visibilityKey: "menu.pos.orders",
        label: "ออเดอร์",
        icon: <FileTextOutlined />,
        path: "/pos/orders",
      },
      {
        key: "kitchen",
        visibilityKey: "menu.pos.kitchen",
        label: "ครัว",
        icon: <FireOutlined />,
        path: "/pos/kitchen",
      },
    ];

    return items.filter((item) => canSeeMenu(item.visibilityKey));
  }, [canSeeMenu]);

  const secondaryItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      {
        key: "tableQr",
        visibilityKey: "menu.pos.tables",
        label: "QR Code โต๊ะ",
        icon: <QrcodeOutlined />,
        path: "/pos/qr-code",
      },
      {
        key: "dashboard",
        visibilityKey: "menu.pos.dashboard",
        label: "สรุป",
        icon: <AppstoreOutlined />,
        path: "/pos/dashboard",
      },
      {
        key: "shift",
        visibilityKey: "menu.pos.shift",
        label: "กะการทำงาน",
        icon: <ClockCircleOutlined />,
        path: "/pos/shift",
      },
      {
        key: "shiftHistory",
        visibilityKey: "menu.pos.shiftHistory",
        label: "ประวัติกะ",
        icon: <HistoryOutlined />,
        path: "/pos/shiftHistory",
      },
      {
        key: "tables",
        visibilityKey: "menu.pos.tables",
        label: "โต๊ะ",
        icon: <TableOutlined />,
        path: "/pos/tables",
      },
      {
        key: "delivery",
        visibilityKey: "menu.pos.delivery",
        label: "เดลิเวอรี่",
        icon: <CarOutlined />,
        path: "/pos/delivery",
      },
      {
        key: "products",
        visibilityKey: "menu.pos.products",
        label: "สินค้า",
        icon: <ShopOutlined />,
        path: "/pos/products",
      },
      {
        key: "category",
        visibilityKey: "menu.pos.category",
        label: "หมวดหมู่",
        icon: <AppstoreOutlined />,
        path: "/pos/category",
      },
      {
        key: "productsUnit",
        visibilityKey: "menu.pos.productsUnit",
        label: "หน่วยสินค้า",
        icon: <AppstoreOutlined />,
        path: "/pos/productsUnit",
      },
      {
        key: "discounts",
        visibilityKey: "menu.pos.discounts",
        label: "ส่วนลด",
        icon: <TagsOutlined />,
        path: "/pos/discounts",
      },
      {
        key: "payment",
        visibilityKey: "menu.pos.payment",
        label: "วิธีการชำระเงิน",
        icon: <CreditCardOutlined />,
        path: "/pos/paymentMethod",
      },
      {
        key: "settings",
        visibilityKey: "menu.pos.settings",
        label: "ตั้งค่าบัญชี",
        icon: <SettingOutlined />,
        path: "/pos/settings",
      },
    ];

    return items.filter((item) => canSeeMenu(item.visibilityKey));
  }, [canSeeMenu]);

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

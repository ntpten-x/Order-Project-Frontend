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
  SettingOutlined,
  ShopOutlined,
  TableOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { Badge, Button, Drawer, List } from "antd";

import { useAuth } from "../../contexts/AuthContext";
import { useShift } from "../../contexts/pos/ShiftContext";
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

  const [moreOpen, setMoreOpen] = useState(false);
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);

  const primaryItems: MenuItem[] = useMemo(
    () => [
      { key: "home", label: "หน้าแรก", icon: <HomeOutlined />, path: "/" },
      { key: "pos", label: "ขาย", icon: <ShopOutlined />, path: "/pos" },
      {
        key: "orders",
        label: "ออเดอร์",
        icon: <FileTextOutlined />,
        path: "/pos/orders",
      },
      {
        key: "dashboard",
        label: "สรุป",
        icon: <AppstoreOutlined />,
        path: "/pos/dashboard",
      },
    ],
    [],
  );

  const secondaryItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      { key: "kitchen", label: "ครัว", icon: <FireOutlined />, path: "/pos/kitchen" },
      { key: "tables", label: "โต๊ะ", icon: <TableOutlined />, path: "/pos/tables" },
      { key: "delivery", label: "เดลิเวอรี่", icon: <CarOutlined />, path: "/pos/delivery" },
    ];

    if (user?.role === "Admin" || user?.role === "Manager") {
      items.push(
        {
          key: "category",
          label: "หมวดหมู่",
          icon: <AppstoreOutlined />,
          path: "/pos/category",
        },
        {
          key: "products",
          label: "สินค้า",
          icon: <ShopOutlined />,
          path: "/pos/products",
        },
        {
          key: "productsUnit",
          label: "หน่วยสินค้า",
          icon: <AppstoreOutlined />,
          path: "/pos/productsUnit",
        },
        {
          key: "discounts",
          label: "ส่วนลด",
          icon: <TagsOutlined />,
          path: "/pos/discounts",
        },
        {
          key: "payment",
          label: "ชำระเงิน",
          icon: <CreditCardOutlined />,
          path: "/pos/paymentMethod",
        },
        {
          key: "settings",
          label: "ตั้งค่า",
          icon: <SettingOutlined />,
          path: "/pos/settings",
        },
      );
    }

    return items;
  }, [user?.role]);

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
                  onClick={() => handleNavigate(item.path)}
                >
                  {item.label}
                </Button>
              </List.Item>
            )}
          />

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

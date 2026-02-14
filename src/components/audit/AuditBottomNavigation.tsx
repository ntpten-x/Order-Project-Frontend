"use client";

import React from "react";
import { HomeOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "../../contexts/AuthContext";
import { useEffectivePermissions } from "../../hooks/useEffectivePermissions";
import { canViewMenu } from "../../lib/rbac/menu-visibility";
import FloatingBottomNav from "../navigation/FloatingBottomNav";

const AuditBottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { can, canAny, rows } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const canSeeMenu = React.useCallback(
    (menuKey: string) => canViewMenu(menuKey, { rows, can, canAny }),
    [rows, can, canAny]
  );

  const menuItems = [
    {
      key: "home",
      visibilityKey: "menu.module.audit",
      label: "หน้าแรก",
      icon: <HomeOutlined />,
      path: "/",
    },
  ].filter((item) => canSeeMenu(item.visibilityKey));

  return (
    <FloatingBottomNav
      maxWidth={260}
      items={menuItems.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onClick: () => router.push(item.path),
        active: pathname === item.path,
      }))}
    />
  );
};

export default AuditBottomNavigation;

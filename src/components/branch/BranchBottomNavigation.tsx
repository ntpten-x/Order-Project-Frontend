"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { HomeOutlined } from "@ant-design/icons";

import FloatingBottomNav from "../navigation/FloatingBottomNav";

const BranchBottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: "home",
      label: "หน้าแรก",
      icon: <HomeOutlined />,
      path: "/",
    },
  ];

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

export default BranchBottomNavigation;

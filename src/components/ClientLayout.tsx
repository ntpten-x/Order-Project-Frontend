"use client";

import { usePathname } from "next/navigation";
import React from "react";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  // ถ้าอยู่หน้า login ไม่ต้องใส่ padding-top
  const isLoginPage = pathname === "/login";

  return (
    <main style={{ paddingTop: isLoginPage ? "0" : "64px" }}>
      {children}
    </main>
  );
};

export default ClientLayout;

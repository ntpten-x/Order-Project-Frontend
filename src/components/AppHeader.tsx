"use client";

import React from "react";
import { Layout, Avatar, Popover, Button, Typography } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { usePathname } from "next/navigation";

const { Header } = Layout;
const { Text, Title } = Typography;

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // ซ่อน header ถ้ายังไม่ได้ login หรืออยู่หน้า login
  if (!user || pathname === "/login") {
    return null;
  }

  const userPopoverContent = (
    <div style={{ minWidth: "200px" }}>
      <div className="flex flex-col items-center p-4 border-b mb-2">
        <Avatar size={64} icon={<UserOutlined />} className="mb-2 bg-blue-500" />
        <Text strong className="text-lg">
          {user?.username || "Guest"}
        </Text>
        <Text type="secondary">{user?.display_name || "No Role"}</Text>
      </div>
      <Button
        type="text"
        danger
        icon={<LogoutOutlined />}
        block
        onClick={logout}
        className="text-left hover:bg-red-50"
      >
        ออกจากระบบ
      </Button>
    </div>
  );

  return (
    <Header
      className="flex items-center justify-between px-6 bg-white border-b border-gray-100 shadow-sm fixed top-0 w-full z-50"
      style={{ height: "64px", paddingInline: "24px", background: "#fff" }}
    >
      {/* Left Side: Logo & App Name */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">O</span>
        </div>
        <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
          Order App
        </Title>
      </div>

      {/* Right Side: User Profile */}
      <div>
        {user && (
          <Popover
            content={userPopoverContent}
            trigger="click"
            placement="bottomRight"
            arrow={false}
          >
            <div className="flex items-center gap-3 cursor-pointer p-2 rounded-full hover:bg-gray-50 transition-colors">
              <div className="hidden md:flex flex-col items-end leading-tight">
                <Text strong className="text-sm">
                  {user.username}
                </Text>
                <Text type="secondary" className="text-xs">
                  {user.display_name}
                </Text>
              </div>
              <Avatar
                size="large"
                icon={<UserOutlined />}
                className="bg-blue-500 shadow-sm border-2 border-white cursor-pointer hover:scale-105 transition-transform"
              />
            </div>
          </Popover>
        )}
      </div>
    </Header>
  );
};

export default AppHeader;

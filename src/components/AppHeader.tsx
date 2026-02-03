"use client";

import React, { useState, useEffect, useRef } from "react";
import { Layout, Avatar, Typography, Space, Button, theme, Grid } from "antd";
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined, 
  ShoppingOutlined, 
  DownOutlined
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { usePathname } from "next/navigation";

const { Header } = Layout;
const { Text } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { token } = useToken();
  const screens = useBreakpoint(); // xs, sm, md, lg, xl, xxl
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync state if pathname changes
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  // ซ่อน header บนหน้า login
  if (!user || pathname === "/login") {
    return null;
  }

  const isMobile = !screens.md; // Mobile if screen is smaller than md (768px)

  return (
    <Header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
        height: isMobile ? '56px' : '64px', // Reduced height for mobile
        padding: isMobile ? '0 16px' : '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.95)', // Glass effect light bg
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Left: Brand / Logo */}
      <Space size={12} align="center">
        <div
          style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${token.colorPrimary}40`,
            cursor: 'pointer',
          }}
        >
          <ShoppingOutlined style={{ fontSize: isMobile ? '18px' : '20px', color: '#fff' }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <Text
            strong
            style={{
              fontSize: isMobile ? '16px' : '18px',
              color: token.colorTextHeading,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            POS System
          </Text>
           {/* Hide subtitle on very small screens to save space */}
          {!isMobile && (
            <Text style={{ fontSize: '11px', fontWeight: 500, color: token.colorTextDescription }}>
              Management
            </Text>
          )}
        </div>
      </Space>

      {/* Right: User Profile */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '10px',
            cursor: 'pointer',
            padding: '4px',
            paddingRight: isMobile ? '4px' : '10px',
            borderRadius: '24px',
            background: dropdownOpen ? token.colorFillTertiary : 'transparent',
            transition: 'all 0.2s ease',
          }}
          className="user-profile-trigger"
        >
          <Avatar
            size={isMobile ? 32 : 36}
            icon={<UserOutlined />}
            style={{
              background: token.colorBgContainer,
              color: token.colorPrimary,
              border: `1px solid ${token.colorBorder}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            }}
          />
          
          {/* Hide Name on Mobile */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text strong style={{ fontSize: '14px', color: token.colorText }}>
                {user?.name || "Member"}
              </Text>
              <DownOutlined style={{ 
                fontSize: '10px', 
                color: token.colorTextDescription, 
                marginLeft: 8,
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }} />
            </div>
          )}
          
          {/* Mobile: Simple Indicator if needed, or just Avatar act as trigger */}
        </div>

        {/* Custom Dropdown Menu */}
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: isMobile ? -8 : 0, // Adjust alignment for mobile padding
              width: 260,
              background: '#ffffff',
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
              padding: '8px',
              zIndex: 1100,
              animation: 'slideUp 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            {/* Header info inside dropdown */}
            <div style={{ 
              padding: '16px', 
              background: token.colorBgLayout, 
              borderRadius: token.borderRadius,
              marginBottom: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar 
                  size={44} 
                  icon={<UserOutlined />} 
                  style={{ 
                    background: '#fff', 
                    color: token.colorPrimary, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <Text strong style={{ color: token.colorTextHeading, fontSize: '15px' }}>
                    {user?.name || "Member"}
                  </Text>
                  <Text style={{ color: token.colorTextSecondary, fontSize: '12px' }}>
                    @{user?.username || "username"}
                  </Text>
                  <div style={{ 
                    marginTop: 4, 
                    display: 'inline-flex',
                    padding: '2px 8px', 
                    background: token.colorPrimaryBg, 
                    color: token.colorPrimary,
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    width: 'fit-content'
                  }}>
                    {user?.role || "Staff"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Button 
                type="text" 
                icon={<SettingOutlined />} 
                style={{ 
                  textAlign: 'left', 
                  height: 44, 
                  justifyContent: 'flex-start',
                  fontSize: '14px',
                  color: token.colorText
                }}
                block
              >
                การตั้งค่าระบบ
              </Button>
              <div style={{ height: '1px', background: token.colorBorderSecondary, margin: '4px 0' }} />
              <Button 
                type="text" 
                danger 
                icon={<LogoutOutlined />} 
                style={{ 
                  textAlign: 'left', 
                  height: 44, 
                  justifyContent: 'flex-start',
                  fontSize: '14px',
                  fontWeight: 500
                }}
                onClick={logout}
                block
              >
                ออกจากระบบ
              </Button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .user-profile-trigger:hover {
          background: ${token.colorFillTertiary} !important;
        }
      `}</style>
    </Header>
  );
};

export default AppHeader;

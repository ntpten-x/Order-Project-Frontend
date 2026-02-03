"use client";

import React, { useState, useEffect, useRef } from "react";
import { Layout, Avatar, Typography, Space, Button } from "antd";
import { UserOutlined, LogoutOutlined, SettingOutlined, ShoppingOutlined, DownOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { usePathname } from "next/navigation";

const { Header } = Layout;
const { Text } = Typography;

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
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

  return (
    <Header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
        height: '64px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0f172a', // Slate 900
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Space size={16} align="center">
        <div
          style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          className="scale-hover"
        >
          <ShoppingOutlined style={{ fontSize: '20px', color: '#fff' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <Text
            strong
            style={{
              fontSize: '18px',
              color: '#f8fafc', // Light text
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            POS System
          </Text>
          <Text style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>
            Management
          </Text>
        </div>
      </Space>

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '6px 12px 6px 6px',
            borderRadius: '30px',
            background: dropdownOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
            border: dropdownOpen ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s ease',
          }}
          className="user-profile-trigger"
        >
          <Avatar
            size={36}
            icon={<UserOutlined />}
            style={{
              background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
              color: '#fff',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 4 }}>
            <Text strong style={{ fontSize: '14px', color: '#f8fafc' }}>
              {user?.name || "ไม่ระบุชื่อ"}
            </Text>
          </div>
          <DownOutlined style={{ 
            fontSize: '10px', 
            color: '#94a3b8', 
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            marginLeft: 4
          }} />
        </div>

        {/* Custom Dropdown Menu */}
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              right: 0,
              width: 260,
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
              padding: '8px',
              zIndex: 1100,
              animation: 'slideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
              border: '1px solid #f1f5f9'
            }}
            className="header-dropdown-menu"
          >
            {/* Header info inside dropdown - Enhanced */}
            <div style={{ 
              padding: '16px 14px', 
              background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)', 
              borderRadius: '16px',
              marginBottom: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar 
                  size={48} 
                  icon={<UserOutlined />} 
                  style={{ 
                    background: '#fff', 
                    color: '#10b981', 
                    border: '3px solid #fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <Text strong style={{ color: '#1e293b', fontSize: '16px', lineHeight: 1.2 }}>
                    {user?.name || "ไม่ระบุชื่อ"}
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: '12px', marginTop: 2 }}>
                    @{user?.username}
                  </Text>
                  <div style={{ 
                    marginTop: 6, 
                    padding: '2px 8px', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    color: '#059669',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    width: 'fit-content',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em'
                  }}>
                    {user?.role || "Staff"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Button 
                type="text" 
                icon={<SettingOutlined style={{ color: '#64748b' }} />} 
                style={{ 
                  textAlign: 'left', 
                  height: 48, 
                  borderRadius: '12px', 
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center'
                }}
                className="menu-button-hover"
                block
              >
                การตั้งค่าระบบ
              </Button>
              <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 8px' }} />
              <Button 
                type="text" 
                danger 
                icon={<LogoutOutlined />} 
                style={{ 
                  textAlign: 'left', 
                  height: 48, 
                  borderRadius: '12px', 
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center'
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
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .user-profile-trigger:hover {
          background: rgba(255, 255, 255, 0.15) !important;
        }
        .menu-button-hover:hover {
          background: #f1f5f9 !important;
        }
      `}</style>
    </Header>
  );
};

export default AppHeader;

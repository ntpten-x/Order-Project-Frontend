"use client";

import { Layout, Avatar, Dropdown, Typography, Badge, Space, Popover, Button } from "antd";
import type { MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, ShoppingOutlined, DownOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { usePathname } from "next/navigation";

const { Header } = Layout;
const { Text } = Typography;

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // ซ่อน header บนหน้า login
  if (!user || pathname === "/login") {
    return null;
  }



  return (
    <Header
      style={{
        position: 'fixed',
        top: 0,
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
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

      {user && (
        <Popover 
          content={
            <div style={{ width: 240 }}>
              {/* Profile Header */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #f1f5f9' }}>
                <Space align="center" size={12}>
                  <Avatar
                    size={48}
                    icon={<UserOutlined />}
                    style={{
                      background: '#fff',
                      color: '#10b981',
                      border: '2px solid #e2e8f0',
                    }}
                  />
                  <div>
                    <Text strong style={{ fontSize: '15px', display: 'block', color: '#1e293b' }}>
                      {user?.name || user?.username || "Guest"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {user?.role || "Staff"}
                    </Text>
                  </div>
                </Space>
              </div>

              {/* Menu Actions */}
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Button 
                  type="text" 
                  icon={<SettingOutlined />} 
                  style={{ textAlign: 'left', height: 40, borderRadius: 8, color: '#64748b' }}
                  block
                >
                  การตั้งค่า
                </Button>
                
                <Button 
                  type="text" 
                  danger 
                  icon={<LogoutOutlined />} 
                  style={{ textAlign: 'left', height: 40, borderRadius: 8 }}
                  onClick={logout}
                  block
                >
                  ออกจากระบบ
                </Button>
              </div>
            </div>
          } 
          trigger="click"
          placement="bottomRight"
          overlayInnerStyle={{ padding: 0, borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '6px 8px 6px 6px',
              borderRadius: '30px',
              background: 'rgba(255, 255, 255, 0.1)', // Glassy dark
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Avatar
              size={32}
              icon={<UserOutlined />}
              style={{
                background: '#334155',
                color: '#fff',
                border: 'none',
              }}
            />
            <Text strong style={{ fontSize: '14px', color: '#e2e8f0', paddingRight: 4 }}>
               {user?.name || user?.username}
            </Text>
            <DownOutlined style={{ fontSize: '10px', color: '#94a3b8' }} />
          </div>
        </Popover>
      )}
    </Header>
  );
};

export default AppHeader;

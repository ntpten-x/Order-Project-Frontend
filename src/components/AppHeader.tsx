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
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Space size={12} align="center">
        <div
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
          }}
        >
          <ShoppingOutlined style={{ fontSize: '20px', color: '#fff' }} />
        </div>
        <Text
          strong
          className="app-title"
          style={{
            fontSize: '20px',
            color: '#fff',
            margin: 0,
            fontWeight: 700,
            letterSpacing: '0.5px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          POS App
        </Text>
      </Space>

      {user && (
        <Popover 
          content={
            <div style={{ width: 260 }}>
              {/* Profile Header */}
              <div style={{ padding: '12px 0 16px', borderBottom: '1px solid #f0f0f0', marginBottom: 8 }}>
                <Space align="center" size={16} style={{ padding: '0 8px' }}>
                  <Avatar
                    size={56}
                    icon={<UserOutlined />}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    }}
                  />
                  <div>
                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '2px' }}>
                      {user?.name || user?.username || "Guest"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {user?.name ? user.username : user?.display_name || "ไม่ได้กำหนดสิทธิ์"}
                    </Text>
                  </div>
                </Space>
              </div>

              {/* Menu Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Button 
                  type="text" 
                  icon={<SettingOutlined />} 
                  style={{ textAlign: 'left', height: 44, fontSize: '15px' }}
                  block
                >
                  การตั้งค่า
                </Button>
                
                <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
                
                <Button 
                  type="text" 
                  danger 
                  icon={<LogoutOutlined />} 
                  style={{ textAlign: 'left', height: 44, fontSize: '15px' }}
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
          overlayStyle={{ zIndex: 99999 }}
          getPopupContainer={() => document.body}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              maxWidth: '180px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            <Badge
              dot
              status="success"
              offset={[-5, 38]}
              styles={{
                indicator: {
                  width: '12px',
                  height: '12px',
                  boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              <Avatar
                size={36}
                icon={<UserOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
              />
            </Badge>
            <DownOutlined
              style={{
                fontSize: '10px',
                color: '#fff',
                transition: 'transform 0.3s ease',
              }}
            />
          </div>
        </Popover>
      )}
    </Header>
  );
};

export default AppHeader;

"use client";

import React, { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  HomeOutlined, 
  ShopOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import { Badge } from "antd";
import { useAuth } from "../../contexts/AuthContext";
import { useShift } from "../../contexts/pos/ShiftContext";
import dynamic from "next/dynamic";

const CloseShiftModal = dynamic(() => import("./shifts/CloseShiftModal"), {
  ssr: false,
});

/**
 * POS Bottom Navigation
 * Modern floating navigation bar - clean, minimal, mobile-first
 * Shows 5 core items for quick access, plus close shift when active
 */
const POSBottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { currentShift } = useShift();
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);

  // Core navigation items - limited to 5 for clean UX
  const menuItems = useMemo(() => {
    const baseItems = [
      {
        key: 'home',
        label: 'หน้าแรก',
        icon: HomeOutlined,
        path: '/',
      },
      {
        key: 'pos',
        label: 'ขาย',
        icon: ShopOutlined,
        path: '/pos',
      },
      {
        key: 'orders',
        label: 'ออเดอร์',
        icon: FileTextOutlined,
        path: '/pos/orders',
      },
    ];

    // Admin-only items
    if (user?.role === 'Admin') {
      baseItems.push(
        {
          key: 'dashboard',
          label: 'สรุป',
          icon: AppstoreOutlined,
          path: '/pos/dashboard',
        },
        {
          key: 'settings',
          label: 'ตั้งค่า',
          icon: SettingOutlined,
          path: '/pos/settings',
        }
      );
    }

    return baseItems;
  }, [user?.role]);

  // Check if a path is active
  const isActivePath = (itemPath: string) => {
    if (itemPath === '/') return pathname === '/';
    if (itemPath === '/pos') return pathname === '/pos' || pathname.startsWith('/pos/channels');
    return pathname === itemPath || pathname.startsWith(itemPath + '/');
  };

  // Style constants
  const colors = {
    active: '#6366F1',      // Primary indigo
    inactive: '#94A3B8',    // Slate-400
    bg: 'rgba(15, 23, 42, 0.95)', // Slate-900 with transparency
    border: 'rgba(255, 255, 255, 0.08)',
  };

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: 400,
    zIndex: 1000,
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    padding: '8px 12px',
    backgroundColor: colors.bg,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 12,
    transition: 'all 0.2s ease',
    position: 'relative',
  };

  return (
    <>
      <div style={navStyle}>
        <div style={containerStyle}>
          {menuItems.map((item) => {
            const isActive = isActivePath(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.path)}
                style={{
                  ...buttonStyle,
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: 22,
                    color: isActive ? colors.active : colors.inactive,
                    transition: 'all 0.2s ease',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  <Icon />
                </div>
                
                {/* Label */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? colors.active : colors.inactive,
                    marginTop: 2,
                    transition: 'all 0.2s ease',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      width: 4,
                      height: 4,
                      backgroundColor: colors.active,
                      borderRadius: '50%',
                    }}
                  />
                )}
              </button>
            );
          })}

          {/* Close Shift Button - Only shown when shift is active */}
          {currentShift && (
            <button
              onClick={() => setCloseShiftModalOpen(true)}
              style={{
                ...buttonStyle,
                flex: 'none',
                width: 56,
              }}
            >
              <Badge dot status="processing" offset={[-2, 2]}>
                <div
                  style={{
                    fontSize: 22,
                    color: '#EF4444',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <PoweroffOutlined />
                </div>
              </Badge>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: '#EF4444',
                  marginTop: 2,
                }}
              >
                ปิดกะ
              </span>
            </button>
          )}
        </div>
      </div>

      <CloseShiftModal 
        open={closeShiftModalOpen} 
        onCancel={() => setCloseShiftModalOpen(false)} 
      />
    </>
  );
};

export default POSBottomNavigation;

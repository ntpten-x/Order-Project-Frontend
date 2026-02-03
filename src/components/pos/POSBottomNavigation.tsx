"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  HomeOutlined, 
  ShopOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  PoweroffOutlined,
  EllipsisOutlined,
  FireOutlined,
  CreditCardOutlined,
  TagsOutlined,
  TableOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { Badge } from "antd";
import { useAuth } from "../../contexts/AuthContext";
import { useShift } from "../../contexts/pos/ShiftContext";


import CloseShiftModal from "./shifts/CloseShiftModal";

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  path: string;
}

/**
 * POS Bottom Navigation
 * Modern floating navigation bar - 5 fixed buttons with "More" dropdown
 * Handles navigation and shifts.
 */
const POSBottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { currentShift } = useShift();
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreContainerRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreContainerRef.current && !moreContainerRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary navigation items (always shown in bar)
  const primaryItems: MenuItem[] = useMemo(() => [
    { key: 'home', label: 'หน้าแรก', icon: HomeOutlined, path: '/' },
    { key: 'pos', label: 'ขาย', icon: ShopOutlined, path: '/pos' },
    { key: 'orders', label: 'ออเดอร์', icon: FileTextOutlined, path: '/pos/orders' },
    { key: 'dashboard', label: 'สรุป', icon: AppstoreOutlined, path: '/pos/dashboard' },
  ], []);

  // Secondary items (shown in "More" dropdown)
  const secondaryItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      { key: 'kitchen', label: 'ครัว', icon: FireOutlined, path: '/pos/kitchen' },
      { key: 'tables', label: 'โต๊ะ', icon: TableOutlined, path: '/pos/tables' },
      { key: 'delivery', label: 'เดลิเวอรี่', icon: CarOutlined, path: '/pos/delivery' },
    ];
    
    // Admin & Manager Access
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      items.push(
        { key: 'category', label: 'หมวดหมู่', icon: AppstoreOutlined, path: '/pos/category' },
        { key: 'products', label: 'สินค้า', icon: ShopOutlined, path: '/pos/products' },
        { key: 'productsUnit', label: 'หน่วยสินค้า', icon: AppstoreOutlined, path: '/pos/productsUnit' },
        { key: 'discounts', label: 'ส่วนลด', icon: TagsOutlined, path: '/pos/discounts' },
        { key: 'payment', label: 'ชำระเงิน', icon: CreditCardOutlined, path: '/pos/paymentMethod' },
        { key: 'settings', label: 'ตั้งค่า', icon: SettingOutlined, path: '/pos/settings' },
      );
    }
    
    return items;
  }, [user?.role]);

  // Check if a path is active
  const isActivePath = (itemPath: string) => {
    if (itemPath === '/') return pathname === '/';
    if (itemPath === '/pos') return pathname === '/pos' || pathname.startsWith('/pos/channels');
    return pathname === itemPath || pathname.startsWith(itemPath + '/');
  };

  // Check if any secondary item is active
  const isSecondaryActive = secondaryItems.some(item => isActivePath(item.path));

  const handleNavigation = (path: string) => {
    router.push(path);
    setMoreMenuOpen(false);
  };

  return (
    <>
      <div className="fixed z-[1000] bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-20px)] max-w-[420px]">
        <div 
          className="flex justify-between items-center h-[80px] px-3 bg-[#0f172a]/95 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 rounded-[32px]"
          style={{ transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)' }}
        >
          {/* Primary Navigation Items */}
          {primaryItems.map((item) => {
            const isActive = isActivePath(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.path)}
                className="flex flex-col items-center justify-center flex-1 h-full bg-transparent border-none cursor-pointer relative group"
              >
                <div
                  className={`
                    flex items-center justify-center w-[48px] h-[48px] rounded-[16px] mb-1
                    transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
                    ${isActive ? 'bg-emerald-500/20 -translate-y-1 scale-105' : 'bg-transparent'}
                    group-active:scale-90
                  `}
                >
                  <Icon style={{
                    fontSize: 24,
                    color: isActive ? '#34d399' : '#94a3b8',
                    filter: isActive ? 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.4))' : 'none',
                    transition: 'all 0.3s ease',
                  }} />
                </div>
                <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-[#34d399]' : 'text-[#94a3b8] opacity-60'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Button with Dropdown */}
          <div ref={moreContainerRef} className="relative flex-1 h-full flex items-center justify-center">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="flex flex-col items-center justify-center h-full bg-transparent border-none cursor-pointer relative group"
            >
              <div
                className={`
                  flex items-center justify-center w-[48px] h-[48px] rounded-[16px] mb-1
                  transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
                  ${moreMenuOpen || isSecondaryActive ? 'bg-amber-500/20 -translate-y-1 scale-105' : 'bg-transparent'}
                  group-active:scale-90
                `}
              >
                <EllipsisOutlined style={{
                  fontSize: 24,
                  color: moreMenuOpen || isSecondaryActive ? '#fbbf24' : '#94a3b8',
                  filter: moreMenuOpen || isSecondaryActive ? 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.4))' : 'none',
                  transition: 'all 0.3s ease',
                }} />
              </div>
              <span className={`text-[10px] font-bold transition-all duration-300 ${moreMenuOpen || isSecondaryActive ? 'text-[#fbbf24]' : 'text-[#94a3b8] opacity-60'}`}>
                เพิ่มเติม
              </span>
            </button>

            {/* Dropdown Menu */}
            {moreMenuOpen && (
              <div 
                className="absolute bottom-full mb-3 right-0 w-[180px] bg-[#0f172a]/90 backdrop-blur-xl rounded-[20px] border border-white/15 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                {secondaryItems.map((item, index) => {
                  const isActive = isActivePath(item.path);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavigation(item.path)}
                      className={`
                        flex items-center gap-3 w-full px-4 py-3 border-none cursor-pointer transition-all duration-200
                        ${isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-transparent text-slate-300 hover:bg-white/5'}
                        ${index !== secondaryItems.length - 1 ? 'border-b border-white/5' : ''}
                      `}
                    >
                      <Icon style={{ fontSize: 18, color: isActive ? '#34d399' : '#94a3b8' }} />
                      <span className="text-[13px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
                
                {/* Close Shift in dropdown if active */}
                {currentShift && (
                  <button
                    onClick={() => { setCloseShiftModalOpen(true); setMoreMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 border-t border-white/10 bg-red-500/10 hover:bg-red-500/20 transition-all"
                  >
                    <Badge dot status="processing" color="#ef4444">
                      <PoweroffOutlined style={{ fontSize: 18, color: '#ef4444' }} />
                    </Badge>
                    <span className="text-[13px] font-bold text-red-400">ปิดกะ</span>
                  </button>
                )}
              </div>
            )}
          </div>
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

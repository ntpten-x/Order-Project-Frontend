'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserOutlined, ShoppingCartOutlined, FileTextOutlined, HistoryOutlined, HomeOutlined, InfoCircleOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from "@/hooks/useSocket";
import { useState, useEffect } from 'react';
import { OrderStatus } from '@/types/api/orders';

const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth(); // Get user from AuthContext
  const [pendingCount, setPendingCount] = useState(0);
  const { socket } = useSocket();

  const checkPendingOrders = async () => {
    try {
        const res = await fetch('/api/orders', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            // Count all pending orders
            const count = data.filter((o: any) => o.status === OrderStatus.PENDING).length;
            setPendingCount(count);
        }
    } catch (e) {
        // Silent fail
    }
  };

  useEffect(() => {
    if (user) {
        checkPendingOrders();
    }
  }, [user]);

  useEffect(() => {
      if (!socket) return;
      socket.on('orders_updated', checkPendingOrders);
      return () => { socket.off('orders_updated', checkPendingOrders); };
  }, [socket]);

  // const [activeTab, setActiveTab] = useState('');

  /*
  useEffect(() => {
    if (pathname.includes('/users')) {
      setActiveTab('users');
    } else if (pathname === '/') {
      setActiveTab('orders'); // Assuming '/' is Orders or similar default
    } else {
      setActiveTab('');
    }
  }, [pathname]);
  */

  const menuItems = [
        {
      key: 'home',
      label: 'หน้าแรก',
      icon: <HomeOutlined className="text-2xl" />,
      path: '/',
    },
    // {
    //   key: 'buying',
    //   label: 'สั่งซื้อ',
    //   icon: <ShoppingCartOutlined className="text-2xl" />,
    //   path: '/buying',
    // },
    {
      key: 'items',
      label: 'รายการ',
      icon: <FileTextOutlined className="text-2xl" />,
      path: '/items',
    },
    {
      key: 'history',
      label: 'ประวัติ',
      icon: <HistoryOutlined className="text-2xl" />,
      path: '/history',
    },
    ...(user?.role === 'Admin' ? [{
      key: 'ingredients',
      label: 'วัตถุดิบ',
      icon: <UnorderedListOutlined className="text-2xl" />,
      path: '/ingredients', 
    }, {
      key: 'ingredientsUnit',
      label: 'หน่วย',
      icon: <InfoCircleOutlined className="text-2xl" />,
      path: '/ingredientsUnit', 
    }, {
      key: 'manage',
      label: 'ผู้ใช้งาน',
      icon: <UserOutlined className="text-2xl" />,
      path: '/users', 
    }] : []),

  ];

  // Custom Colors - Dark Theme
  const activeColor = '#FCD34D'; // Bright gold/yellow for dark background
  const inactiveColor = '#D1D5DB'; // Gray-300 for better visibility on dark

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <div 
        className="flex justify-around items-center h-[72px] px-6 py-2 bg-[#171717]/95 backdrop-blur-xl shadow-2xl border border-white/10 rounded-full"
        style={{ boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}
      >
        {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.key === 'manage' && pathname.includes('/users'));
            
            return (
                <button
                  key={item.key}
                  onClick={() => {
                      router.push(item.path);
                  }}
                  className="relative flex flex-col items-center justify-center w-full h-full group"
                >
                  <div className="relative flex items-center justify-center">
                    {isActive && (
                      <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full" />
                    )}
                    <div 
                        className={`text-2xl transition-all duration-300 ease-out transform ${isActive ? '-translate-y-1 scale-110' : 'group-hover:scale-105'}`}
                        style={{ color: isActive ? activeColor : inactiveColor }}
                    >
                        {item.icon}
                        {item.key === 'items' && pendingCount > 0 && (
                            <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-3 h-3 bg-red-500 rounded-full border-2 border-[#171717]" />
                        )}
                    </div>
                  </div>
                  
                  <span 
                      className={`text-[11px] font-medium tracking-wide mt-1 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-1'}`}
                      style={{ color: isActive ? activeColor : inactiveColor }}
                  >
                      {item.label}
                  </span>

                   {/* Active Indicator Dot */}
                   {isActive && (
                    <div 
                      className="absolute -bottom-2 w-1.5 h-1.5 rounded-full transition-all duration-300"
                      style={{ backgroundColor: activeColor }}
                    />
                   )}
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;

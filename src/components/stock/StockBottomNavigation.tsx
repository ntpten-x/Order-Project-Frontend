"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
    FileTextOutlined, 
    HistoryOutlined, 
    HomeOutlined, 
    InfoCircleOutlined, 
    UnorderedListOutlined,
    ShoppingOutlined
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { useState, useEffect } from "react";

const StockBottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const { socket } = useSocket();

  const checkPendingOrders = React.useCallback(async () => {
    try {
        const res = await fetch(`/api/stock/orders?status=pending&t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            setPendingCount(data.length);
        }
    } catch {
        // Silent fail
    }
  }, []);

  useEffect(() => {
    if (user) checkPendingOrders();
  }, [user, checkPendingOrders]);

  useEffect(() => {
      if (!socket) return;
      const handleUpdate = (payload: { action: string }) => {
          if (payload?.action === 'create' || payload?.action === 'update_status') {
              setTimeout(checkPendingOrders, 500);
          }
      };
      socket.on('orders_updated', handleUpdate);
      const onFocus = () => checkPendingOrders();
      window.addEventListener('focus', onFocus);
      return () => { 
          socket.off('orders_updated', handleUpdate);
          window.removeEventListener('focus', onFocus);
      };
  }, [socket, checkPendingOrders]);

  const menuItems = [
    {
      key: 'home',
      label: 'Home',
      icon: <HomeOutlined className="text-2xl" />,
      path: '/',
    },
    {
      key: 'shopping',
      label: 'สั่งซื้อ',
      icon: <ShoppingOutlined className="text-2xl" />,
      path: '/stock',
    },
    {
      key: 'orders',
      label: 'รายการ',
      icon: <FileTextOutlined className="text-2xl" />,
      path: '/stock/items',
    },
    {
      key: 'history',
      label: 'ประวัติ',
      icon: <HistoryOutlined className="text-2xl" />,
      path: '/stock/history',
    },
    ...(user?.role === 'Admin' ? [{
      key: 'ingredients',
      label: 'วัตถุดิบ',
      icon: <UnorderedListOutlined className="text-2xl" />,
      path: '/stock/ingredients', 
    }, {
      key: 'ingredientsUnit',
      label: 'หน่วย',
      icon: <InfoCircleOutlined className="text-2xl" />,
      path: '/stock/ingredientsUnit', 
    }] : []),
  ];

  const activeColor = '#FCD34D'; // Bright gold/yellow for dark background
  const inactiveColor = '#D1D5DB'; // Gray-300 for better visibility on dark

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <div 
        className="flex justify-around items-center h-[72px] px-6 py-2 bg-[#171717]/95 backdrop-blur-xl shadow-2xl border border-white/10 rounded-full"
        style={{ boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}
      >
        {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            
            return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.path)}
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
                        {item.key === 'orders' && pendingCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#171717] z-10 animate-pulse" />
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

export default StockBottomNavigation;

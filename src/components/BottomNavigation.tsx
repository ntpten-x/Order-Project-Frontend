"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
    FileTextOutlined, 
    HomeOutlined, 
    UserOutlined,
    AppstoreOutlined
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { ordersService } from "../services/stock/orders.service";
import { useState, useEffect } from "react";

const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const { socket } = useSocket();

  const checkPendingOrders = React.useCallback(async () => {
    try {
        const searchParams = new URLSearchParams();
        searchParams.append("status", "pending");
        searchParams.append("t", Date.now().toString());

        const response = await ordersService.getAllOrders(undefined, searchParams);
        setPendingCount(response.total);
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
        key: 'stock-home',
        label: 'Stock',
        icon: <AppstoreOutlined className="text-2xl" />,
        path: '/stock',
    },
    {
      key: 'items',
      label: 'Orders',
      icon: <FileTextOutlined className="text-2xl" />,
      path: '/stock/items',
    },
    ...(user?.role === 'Admin' ? [{
      key: 'manage',
      label: 'Users',
      icon: <UserOutlined className="text-2xl" />,
      path: '/users', 
    }] : []),
  ];



  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto md:min-w-[320px] md:max-w-md z-50">
      <div 
        className="flex justify-around items-center h-[72px] px-2 py-2 bg-[#0f172a]/85 backdrop-blur-xl shadow-2xl border border-slate-700/50 rounded-[24px]"
        style={{ boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.4)' }}
      >
        {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.key === 'manage' && pathname.includes('/users'));
            const activeColor = '#34d399'; // Emerald 400 (Brighter for dark bg)
            const inactiveColor = '#94a3b8'; // Slate 400
            
            return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.path)}
                  className="relative flex flex-col items-center justify-center flex-1 h-full group"
                >
                  <div className={`
                    absolute top-1
                    flex items-center justify-center 
                    w-12 h-12 rounded-2xl 
                    transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
                    ${isActive ? 'bg-emerald-500/20 translate-y-[-4px]' : 'bg-transparent'}
                  `}>
                    <div 
                        className="text-2xl transition-all duration-300"
                        style={{ 
                          color: isActive ? activeColor : inactiveColor,
                          transform: isActive ? 'scale(1.1)' : 'scale(1)',
                          filter: isActive ? 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.4))' : 'none'
                        }}
                    >
                        {item.icon}
                        {item.key === 'items' && pendingCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a] z-10 animate-pulse" />
                        )}
                    </div>
                  </div>
                  
                  <span 
                      className={`
                        text-[10px] font-medium tracking-wide 
                        absolute bottom-1.5
                        transition-all duration-300
                      `}
                      style={{ 
                        color: isActive ? activeColor : inactiveColor,
                        opacity: isActive ? 1 : 0.6,
                        transform: isActive ? 'translateY(0)' : 'translateY(2px)'
                      }}
                  >
                      {item.label}
                  </span>
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;

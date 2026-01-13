"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
    HomeOutlined, 
    ShopOutlined,
    AppstoreOutlined,
    TagsOutlined,
    UnorderedListOutlined,
    TableOutlined,
    CarOutlined,
    CalculatorOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const POSBottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    {
      key: 'home',
      label: 'Home',
      icon: <HomeOutlined className="text-2xl" />,
      path: '/',
    },
    {
      key: 'pos',
      label: 'ขายสินค้า',
      icon: <ShopOutlined className="text-2xl" />,
      path: '/pos',
    },
    ...(user?.role === 'Admin' ? [
      {
        key: 'products',
        label: 'สินค้า',
        icon: <AppstoreOutlined className="text-2xl" />,
        path: '/pos/products', 
      },
      {
        key: 'category',
        label: 'หมวดหมู่',
        icon: <TagsOutlined className="text-2xl" />,
        path: '/pos/category', 
      },
      {
        key: 'unit',
        label: 'หน่วย',
        icon: <UnorderedListOutlined className="text-2xl" />,
        path: '/pos/productsUnit', 
      },
      {
        key: 'tables',
        label: 'โต๊ะ',
        icon: <TableOutlined className="text-2xl" />,
        path: '/pos/tables', 
      },
      {
        key: 'delivery',
        label: 'บริการส่ง',
        icon: <CarOutlined className="text-2xl" />,
        path: '/pos/delivery', 
      },
      {
        key: 'discounts',
        label: 'ส่วนลด',
        icon: <CalculatorOutlined className="text-2xl" />,
        path: '/pos/discounts', 
      }
    ] : []),
  ];

  const activeColor = '#60A5FA'; // Blue for POS theme
  const inactiveColor = '#D1D5DB'; // Gray-300 for better visibility on dark

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <div 
        className="flex justify-around items-center h-[72px] px-6 py-2 bg-[#171717]/95 backdrop-blur-xl shadow-2xl border border-white/10 rounded-full"
        style={{ boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}
      >
        {menuItems.map((item) => {
            const isActive = pathname === item.path || 
                (item.path !== '/' && pathname.startsWith(item.path + '/')) ||
                (item.path === '/pos' && pathname === '/pos');
            
            return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.path)}
                  className="relative flex flex-col items-center justify-center w-full h-full group"
                >
                  <div className="relative flex items-center justify-center">
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full" />
                    )}
                    <div 
                        className={`text-2xl transition-all duration-300 ease-out transform ${isActive ? '-translate-y-1 scale-110' : 'group-hover:scale-105'}`}
                        style={{ color: isActive ? activeColor : inactiveColor }}
                    >
                        {item.icon}
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

export default POSBottomNavigation;

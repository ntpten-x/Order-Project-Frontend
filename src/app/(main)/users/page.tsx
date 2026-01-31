'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, Typography, message, Modal } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { User } from "../../../types/api/users";
import { useRouter } from 'next/navigation';
import { 
    UserPageStyles, 
    pageStyles, 
    PageHeader, 
    StatsCard, 
    UserCard 
} from './style';
import { useSocket } from "../../../hooks/useSocket";
import { useAsyncAction } from "../../../hooks/useAsyncAction";
import { useGlobalLoading } from "../../../contexts/pos/GlobalLoadingContext";

const { Title, Text } = Typography;

import { useAuth } from "../../../contexts/AuthContext";

import { Spin } from 'antd';

import { authService } from "../../../services/auth.service";
import { userService } from "../../../services/users.service";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const { socket } = useSocket();
  const { execute } = useAsyncAction();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { user, loading: authLoading } = useAuth();
  const [csrfToken, setCsrfToken] = useState<string>("");

  useEffect(() => {
    const fetchCsrf = async () => {
        const token = await authService.getCsrfToken();
        setCsrfToken(token);
    };
    fetchCsrf();
  }, []);

  // Protect Route
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'Admin') {
        const timer = setTimeout(() => {
            message.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
            router.push('/');
        }, 1000); 
        return () => clearTimeout(timer);
      }
    }
  }, [user, authLoading, router]);

  const fetchUsers = useCallback(async () => {
    execute(async () => {
      const data = await userService.getAllUsers();
      setUsers(data);
    }, 'กำลังโหลดข้อมูลผู้ใช้...');
  }, [execute]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === 'Admin') {
      fetchUsers();
    }
  }, [authLoading, user, fetchUsers]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('users:create', (newUser: User) => {
      setUsers((prevUsers) => [...prevUsers, newUser]);
      message.success(`ผู้ใช้ใหม่ ${newUser.username} ถูกเพิ่มแล้ว`);
    });
    socket.on('users:update', (updatedUser: User) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );
    });
    socket.on('users:delete', ({ id }: { id: string }) => {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
    });
    socket.on('users:update-status', ({ id, is_active }: { id: string, is_active: boolean }) => {
        setUsers((prevUsers) =>
            prevUsers.map((user) => (user.id === id ? { ...user, is_active } : user))
        );
    });

    return () => {
      socket.off('users:create');
      socket.off('users:update');
      socket.off('users:delete');
      socket.off('users:update-status');
    };
  }, [socket]);
  
  const handleAdd = () => {
    showLoading();
    router.push('/users/manage/add');
    setTimeout(() => hideLoading(), 1000);
  };

  const handleEdit = (user: User) => {
    router.push(`/users/manage/edit/${user.id}`);
  };

  const handleDelete = (user: User) => {
    Modal.confirm({
        title: 'ยืนยันการลบผู้ใช้',
        content: `คุณต้องการลบผู้ใช้ "${user.name || user.username}" หรือไม่?`,
        okText: 'ลบ',
        okType: 'danger',
        cancelText: 'ยกเลิก',
        centered: true,
        onOk: async () => {
            await execute(async () => {
                await userService.deleteUser(user.id, undefined, csrfToken);
                message.success(`ลบผู้ใช้ "${user.name || user.username}" สำเร็จ`);
            }, "กำลังลบผู้ใช้งาน...");
        },
    });
  };
  if (authLoading || !user || user.role !== 'Admin') {
    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#f5f5f5'
        }}>
            <Spin size="large" />
        </div>
    );
  }

  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.roles?.roles_name === 'Admin').length;

  return (
    <div style={pageStyles.container}>
      <UserPageStyles />
      
      {/* Header */}
      <PageHeader 
        onRefresh={fetchUsers}
        onAdd={handleAdd}
      />
      
      {/* Stats */}
      <StatsCard 
        totalUsers={users.length}
        activeUsers={activeUsers}
        onlineUsers={adminUsers}
      />

      {/* Main Content */}
      <div style={pageStyles.listContainer}>
          {users.length > 0 ? (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, justifyContent: 'center' }}>
                {users.map((user, index) => (
                    <div key={user.id} style={{ animation: `fadeInUp 0.6s ease-out forwards`, animationDelay: `${index * 50}ms`, opacity: 0 }}>
                        <UserCard 
                            user={user} 
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </div>
                ))}
             </div>
          ) : (
            <div style={{ 
                background: 'white', 
                borderRadius: 20, 
                padding: '60px 20px', 
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <TeamOutlined style={{ fontSize: 64, color: '#e5e7eb', marginBottom: 16 }} />
                 <Title level={3} style={{ color: '#374151', margin: 0 }}>ยังไม่มีผู้ใช้งาน</Title>
                 <Text type="secondary">เริ่มต้นด้วยการเพิ่มผู้ใช้งานคนแรก</Text>
                 <div style={{ marginTop: 24 }}>
                    <Button type="primary" onClick={handleAdd}>เพิ่มผู้ใช้</Button>
                 </div>
            </div>
          )}
      </div>
    </div>
  );
}

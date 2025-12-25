'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Card, Typography, message, Modal } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { User } from '@/types/api/users';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserPageStyle from './style';
import { useSocket } from '@/hooks/useSocket';

const { Title, Text } = Typography;

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/getAll');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      message.error(error.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new user creation
    socket.on('users:create', (newUser: User) => {
      setUsers((prevUsers) => [...prevUsers, newUser]);
      message.success(`ผู้ใช้ใหม่ ${newUser.username} ถูกเพิ่มแล้ว`);
    });

    // Listen for user updates
    socket.on('users:update', (updatedUser: User) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );
    });

    // Listen for user deletion
    socket.on('users:delete', ({ id }: { id: string }) => {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
    });

    return () => {
      socket.off('users:create');
      socket.off('users:update');
      socket.off('users:delete');
    };
  }, [socket]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 250,
      sorter: (a: User, b: User) => a.id.localeCompare(b.id),
      render: (text: string) => <Text copyable={{ text }}>{text.substring(0, 8)}...</Text>
    },
    {
      title: 'ชื่อผู้ใช้',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <Space>
          <UserOutlined className="text-blue-500" />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'สิทธิ์',
      dataIndex: 'roles',
      key: 'roles',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (role: any) => (
        <Space direction="vertical" size={0}>
          <Tag color={role?.roles_name === 'Admin' ? 'gold' : 'blue'} className="mr-0">
             {role?.roles_name || 'N/A'}
          </Tag>
          <Text type="secondary" className="text-xs ml-1">
            {role?.display_name}
          </Text>
        </Space>
      ),
    },
    {
      title: 'วันที่สร้าง',
      dataIndex: 'create_date',
      key: 'create_date',
      render: (date: string) => date ? new Date(date).toLocaleString('th-TH') : '-',
    },
    {
      title: 'วันที่เข้าสู่ระบบล่าสุด',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      render: (date: string) => date ? new Date(date).toLocaleString('th-TH') : '-',
    },
    {
      title: 'สถานะ',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
        </Tag>
      ),
    },
    {
      title: 'ใช้งาน',
      dataIndex: 'is_use',
      key: 'is_use',
      render: (isUse: boolean) => (
        <Tag color={isUse ? 'processing' : 'default'}>
          {isUse ? 'ใช้งาน' : 'ไม่ใช้งาน'}
        </Tag>
      ),
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined className="text-blue-500" />} 
            onClick={() => router.push(`/users/manage/edit/${record.id}`)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => {
              Modal.confirm({
                title: 'ยืนยันที่การลบผู้ใช้',
                content: `คุณต้องการลบผู้ใช้ ${record.username} หรือไม่?`,
                onOk: async () => {
                  try {
                    const response = await fetch(`/api/users/delete/${record.id}`, {
                      method: 'DELETE',
                    });
                    if (!response.ok) {
                      throw new Error('Failed to delete user');
                    }
                    message.success(`ลบผู้ใช้ ${record.username} สำเร็จ`);
                  } catch (error) {
                    message.error('ไม่สามารถลบผู้ใช้ได้');
                    console.error(error);
                  }
                },
              });
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/" className="text-blue-500 hover:text-blue-600 mb-2 inline-block">← Back to Home</Link>
            <Title level={2} style={{ margin: 0 }}>จัดการผู้ใช้</Title>
          </div>
          
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchUsers}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              className="bg-blue-600 hover:bg-blue-700 transition-all rounded-lg"
              onClick={() => router.push('/users/manage/add')}
            >
              เพิ่มผู้ใช้
            </Button>
          </Space>
        </div>

        <Card 
          variant="borderless" 
          className="shadow-sm rounded-2xl overflow-hidden"
          styles={{ body: { padding: 0 } }}
        >
          <Table 
            dataSource={users} 
            columns={columns} 
            rowKey="id"
            loading={loading}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              className: "px-6 py-4" 
            }}
            className="custom-table"
          />
        </Card>
      </div>

      <UserPageStyle />
    </div>
  );
}

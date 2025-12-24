'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Card, Typography, message, Modal } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { User } from '@/types/api/users';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserPageStyle from './style';

const { Title, Text } = Typography;

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/getAll');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a: User, b: User) => a.id - b.id,
    },
    {
      title: 'Username',
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
      title: 'Password',
      key: 'password',
      render: () => (
        <Text>******</Text>
      ),
    },
    {
      title: 'Role',
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
      title: 'Actions',
      key: 'actions',
      width: 150,
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
                onOk: () => message.success(`ลบผู้ใช้ ${record.username} สำเร็จ`),
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

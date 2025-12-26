'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Card, Typography, message, Modal, Image } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, ExperimentOutlined } from '@ant-design/icons';
import { Ingredients } from '@/types/api/ingredients';
import { useRouter } from 'next/navigation';
import IngredientsPageStyle from './style';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useSocket } from '@/hooks/useSocket';

const { Title, Text } = Typography;

export default function IngredientsPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredients[]>([]);
  const { execute } = useAsyncAction();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { socket } = useSocket();

  const fetchIngredients = async () => {
    execute(async () => {
      const response = await fetch('/api/ingredients/getAll');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลวัตถุดิบได้');
      }
      const data = await response.json();
      setIngredients(data);
    }, 'กำลังโหลดข้อมูลวัตถุดิบ...');
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('ingredients:create', (newItem: Ingredients) => {
      setIngredients((prev) => [...prev, newItem]);
    });

    socket.on('ingredients:update', (updatedItem: Ingredients) => {
      setIngredients((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
    });

    socket.on('ingredients:delete', ({ id }: { id: string }) => {
      setIngredients((prev) => prev.filter((item) => item.id !== id));
    });

    // Also listen to unit updates to refresh if a unit name changes? 
    // Maybe unnecessary for now, but good to keep in mind.

    return () => {
      socket.off('ingredients:create');
      socket.off('ingredients:update');
      socket.off('ingredients:delete');
    };
  }, [socket]);

  const columns = [
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   key: 'id',
    //   width: 100,
    //   render: (text: string) => <Text copyable={{ text }}>{text.substring(0, 8)}...</Text>
    // },
    {
      title: 'รูปภาพ',
      dataIndex: 'img_url',
      key: 'img_url',
      width: 100,
      render: (url: string) => (
        url ? <Image src={url} alt="ingredient" width={50} height={50} style={{ objectFit: 'cover', borderRadius: '8px' }} fallback="https://placehold.co/50x50?text=No+Image" /> : '-'
      ),
    },
    {
      title: 'ชื่อวัตถุดิบ (EN)',
      dataIndex: 'ingredient_name',
      key: 'ingredient_name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'ชื่อที่แสดง (TH)',
      dataIndex: 'display_name',
      key: 'display_name',
    },
    {
        title: 'หน่วย',
        dataIndex: ['unit', 'unit_name'], // Access nested property
        key: 'unit',
        render: (_: any, record: Ingredients) => record.unit ? `${record.unit.display_name} (${record.unit.unit_name})` : '-',
    },
    {
        title: 'วันที่สร้าง',
        dataIndex: 'create_date',
        key: 'create_date',
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
      title: 'การจัดการ',
      key: 'actions',
      width: 150,
      render: (_: any, record: Ingredients) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined className="text-blue-500" />} 
            onClick={() => router.push(`/ingredients/manage/edit/${record.id}`)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => {
              Modal.confirm({
                title: 'ยืนยันการลบวัตถุดิบ',
                content: `คุณต้องการลบวัตถุดิบ ${record.ingredient_name} หรือไม่?`,
                onOk: async () => {
                  await execute(async () => {
                      const response = await fetch(`/api/ingredients/delete/${record.id}`, {
                          method: 'DELETE',
                      });
                      if (!response.ok) {
                          throw new Error('ไม่สามารถลบวัตถุดิบได้');
                      }
                      message.success(`ลบวัตถุดิบ ${record.ingredient_name} สำเร็จ`);
                      // Socket should handle update, but force refresh just in case if socket fails or delay
                      // fetchIngredients(); 
                  }, "กำลังลบวัตถุดิบ...");
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white border border-gray-100 shadow-sm rounded-xl hidden md:flex items-center justify-center">
              <ExperimentOutlined className="text-2xl text-blue-600" />
            </div>
            <div className="flex flex-col">
              <Title level={2} style={{ margin: 0 }} className="!text-2xl font-bold">จัดการวัตถุดิบ</Title>
            </div>
          </div>
          
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchIngredients}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              className="bg-blue-600 hover:bg-blue-700 transition-all rounded-lg"
              onClick={() => {
                showLoading();
                router.push('/ingredients/manage/add');
                setTimeout(() => hideLoading(), 1000);
              }}
            >
              เพิ่มวัตถุดิบ
            </Button>
          </Space>
        </div>

        <Card 
          variant="borderless" 
          className="shadow-sm rounded-2xl overflow-hidden"
          styles={{ body: { padding: 0 } }}
        >
          <Table 
            dataSource={ingredients} 
            columns={columns} 
            rowKey="id"
            scroll={{ x: 1200 }}  
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              className: "px-6 py-4" 
            }}
            className="custom-table"
          />
        </Card>
      </div>

      <IngredientsPageStyle />
    </div>
  );
}

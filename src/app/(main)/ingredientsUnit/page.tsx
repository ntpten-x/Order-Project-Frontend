'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Space, Button, Card, Typography, message, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, ExperimentOutlined } from '@ant-design/icons';
import { IngredientsUnit } from "../../../types/api/ingredientsUnit";
import { useRouter } from 'next/navigation';
import IngredientsUnitPageStyle from './style';
import { useGlobalLoading } from "../../../contexts/GlobalLoadingContext";
import { useAsyncAction } from "../../../hooks/useAsyncAction";
import { useSocket } from "../../../hooks/useSocket";

import { useAuth } from "../../../contexts/AuthContext";
import { Spin } from 'antd';

const { Title, Text } = Typography;

export default function IngredientsUnitPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ingredientsUnits, setIngredientsUnits] = useState<IngredientsUnit[]>([]);
  const { execute } = useAsyncAction();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { socket } = useSocket();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const fetchIngredientsUnits = useCallback(async () => {
    execute(async () => {
      const response = await fetch('/api/ingredientsUnit/getAll');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลหน่วยวัตถุดิบได้');
      }
      const data = await response.json();
      setIngredientsUnits(data);
    }, 'กำลังโหลดข้อมูลหน่วยวัตถุดิบ...');
  }, [execute]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'Admin') {
          // message.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้'); // Optional: show message before redirect?
          // Let's emulate the Users page behavior
          setIsAuthorized(false);
          setTimeout(() => {
             router.replace('/');
          }, 1000); 
      } else {
          setIsAuthorized(true);
          fetchIngredientsUnits();
      }
    }
  }, [user, authLoading, router, fetchIngredientsUnits]);





  useEffect(() => {
    fetchIngredientsUnits();
  }, [fetchIngredientsUnits]);

  useEffect(() => {
    if (!socket) return;

    socket.on('ingredientsUnit:create', (newItem: IngredientsUnit) => {
      setIngredientsUnits((prev) => [...prev, newItem]);
      message.success(`เพิ่มหน่วยวัตถุดิบ ${newItem.unit_name} แล้ว`);
    });

    socket.on('ingredientsUnit:update', (updatedItem: IngredientsUnit) => {
      setIngredientsUnits((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
    });

    socket.on('ingredientsUnit:delete', ({ id }: { id: string }) => {
      setIngredientsUnits((prev) => prev.filter((item) => item.id !== id));
    });

    return () => {
      socket.off('ingredientsUnit:create');
      socket.off('ingredientsUnit:update');
      socket.off('ingredientsUnit:delete');
    };
  }, [socket]);

  if (authLoading || isAuthorized === null) {
      return (
          <div className="flex h-screen justify-center items-center bg-gray-50 flex-col gap-4">
              <Spin size="large" />
              <Typography.Text type="secondary">กำลังตรวจสอบสิทธิ์การใช้งาน...</Typography.Text>
          </div>
      );
  }

  if (isAuthorized === false) {
       return (
          <div className="flex h-screen justify-center items-center bg-gray-50 flex-col gap-4">
              <Spin size="large" />
              <Typography.Text type="danger">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับหน้าแรก...</Typography.Text>
          </div>
      );
  }

  const columns = [
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   key: 'id',
    //   width: 250,
    //   render: (text: string) => <Text copyable={{ text }}>{text.substring(0, 8)}...</Text>
    // },
    {
      title: 'ชื่อหน่วย *ภาษาอังกฤษ',
      dataIndex: 'unit_name',
      key: 'unit_name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'ชื่อที่แสดง (ภาษาไทย)',
      dataIndex: 'display_name',
      key: 'display_name',
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
      render: (_: unknown, record: IngredientsUnit) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined className="text-blue-500" />} 
            onClick={() => router.push(`/ingredientsUnit/manage/edit/${record.id}`)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => {
              Modal.confirm({
                title: 'ยืนยันการลบหน่วยวัตถุดิบ',
                content: `คุณต้องการลบหน่วยวัตถุดิบ ${record.unit_name} หรือไม่?`,
                onOk: async () => {
                  await execute(async () => {
                      const response = await fetch(`/api/ingredientsUnit/delete/${record.id}`, {
                          method: 'DELETE',
                      });
                      if (!response.ok) {
                          throw new Error('ไม่สามารถลบหน่วยวัตถุดิบได้');
                      }
                      message.success(`ลบหน่วยวัตถุดิบ ${record.unit_name} สำเร็จ`);
                      fetchIngredientsUnits(); // Refresh list
                  }, "กำลังลบหน่วยวัตถุดิบ...");
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
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white border border-gray-100 shadow-sm rounded-xl hidden md:flex items-center justify-center">
              <ExperimentOutlined className="text-2xl text-blue-600" />
            </div>
            <div className="flex flex-col">
              <Title level={2} style={{ margin: 0 }} className="!text-2xl font-bold">จัดการหน่วยวัตถุดิบ</Title>
            </div>
          </div>
          
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchIngredientsUnits}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              className="bg-blue-600 hover:bg-blue-700 transition-all rounded-lg"
              onClick={() => {
                showLoading();
                router.push('/ingredientsUnit/manage/add');
                setTimeout(() => hideLoading(), 1000);
              }}
            >
              เพิ่มหน่วยวัตถุดิบ
            </Button>
          </Space>
        </div>

        <Card 
          variant="borderless" 
          className="shadow-sm rounded-2xl overflow-hidden"
          styles={{ body: { padding: 0 } }}
        >
          <Table 
            dataSource={ingredientsUnits} 
            columns={columns} 
            rowKey="id"
            scroll={{ x: 1000 }}  
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              className: "px-6 py-4" 
            }}
            className="custom-table"
          />
        </Card>
      </div>

      <IngredientsUnitPageStyle />
    </div>
  );
}

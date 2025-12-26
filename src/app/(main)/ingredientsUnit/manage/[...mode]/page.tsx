'use client';

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Spin, Popconfirm, Switch } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import IngredientsUnitManageStyle from './style';

const { Title } = Typography;

export default function IngredientsUnitManagePage({ params }: { params: { mode: string[] } }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mode = params.mode[0];
  const id = params.mode[1] || null;
  const isEdit = mode === 'edit' && !!id;

  useEffect(() => {
    if (isEdit) {
      fetchIngredientsUnit();
    }
  }, [isEdit, id]);

  const fetchIngredientsUnit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ingredientsUnit/getById/${id}`);
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหน่วยวัตถุดิบได้');
      const data = await response.json();
      form.setFieldsValue({
        unit_name: data.unit_name,
        display_name: data.display_name,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถดึงข้อมูลหน่วยวัตถุดิบได้');
      router.push('/ingredientsUnit');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        const response = await fetch(`/api/ingredientsUnit/update/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตหน่วยวัตถุดิบได้');
        }
        
        message.success('อัปเดตหน่วยวัตถุดิบสำเร็จ');
      } else {
        const response = await fetch(`/api/ingredientsUnit/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างหน่วยวัตถุดิบได้');
        }
        
        message.success('สร้างหน่วยวัตถุดิบสำเร็จ');
      }
      router.push('/ingredientsUnit');
    } catch (error: any) {
      console.error(error);
      message.error(error.message || (isEdit ? 'ไม่สามารถอัปเดตหน่วยวัตถุดิบได้' : 'ไม่สามารถสร้างหน่วยวัตถุดิบได้'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/ingredientsUnit/delete/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('ไม่สามารถลบหน่วยวัตถุดิบได้');
      message.success('ลบหน่วยวัตถุดิบสำเร็จ');
      router.push('/ingredientsUnit');
    } catch (error) {
        console.error(error);
        message.error('ไม่สามารถลบหน่วยวัตถุดิบได้');
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/ingredientsUnit')}
            className="mb-2 pl-0 hover:bg-transparent hover:text-blue-600"
          >
            กลับไปหน้าหน่วยวัตถุดิบ
          </Button>
          <div className="flex justify-between items-center">
            <Title level={2} style={{ margin: 0 }}>
                {isEdit ? 'แก้ไขหน่วยวัตถุดิบ' : 'เพิ่มหน่วยวัตถุดิบ'}
            </Title>
            {isEdit && (
                <Popconfirm
                    title="ลบหน่วยวัตถุดิบ"
                    description="คุณต้องการลบหน่วยวัตถุดิบหรือไม่?"
                    onConfirm={handleDelete}
                    okText="ใช่"
                    cancelText="ไม่"
                    okButtonProps={{ danger: true }}
                >
                    <Button danger icon={<DeleteOutlined />}>ลบหน่วยวัตถุดิบ</Button>
                </Popconfirm>
            )}
          </div>
        </div>

        <Card className="shadow-sm rounded-2xl border-gray-100">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spin size="large" />
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark="optional"
              autoComplete="off"
              initialValues={{ is_active: true }} 
            >
              <Form.Item
                name="unit_name"
                label="ชื่อหน่วย *ภาษาอังกฤษ"
                rules={[
                  { required: true, message: 'กรุณากรอกชื่อหน่วย' },
                  { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรุณากรอกภาษาอังกฤษเท่านั้น' }
                ]}
              >
                <Input size="large" placeholder="เช่น kg, g, l" />
              </Form.Item>

              <Form.Item
                name="display_name"
                label="ชื่อที่แสดง (ภาษาไทย)"
                rules={[
                  { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                  { pattern: /^[ก-๙\s]*$/, message: 'กรุณากรอกภาษาไทยเท่านั้น' }
                ]}
              >
                <Input size="large" placeholder="เช่น กิโลกรัม, กรัม, ลิตร" />
              </Form.Item>

              <Form.Item
                name="is_active"
                label="สถานะ (Active)"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-6">
                <Button size="large" onClick={() => router.push('/ingredientsUnit')}>
                  ยกเลิก
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  loading={submitting}
                  icon={<SaveOutlined />}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isEdit ? 'อัปเดต' : 'บันทึก'}
                </Button>
              </div>
            </Form>
          )}
        </Card>
      </div>
      <IngredientsUnitManageStyle />
    </div>
  );
}

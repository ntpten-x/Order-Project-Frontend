'use client';

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Spin, Popconfirm, Switch, Select } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import IngredientsManageStyle from './style';
import { IngredientsUnit } from '@/types/api/ingredientsUnit';

const { Title } = Typography;
const { TextArea } = Input;

export default function IngredientsManagePage({ params }: { params: { mode: string[] } }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [units, setUnits] = useState<IngredientsUnit[]>([]);

  const mode = params.mode[0];
  const id = params.mode[1] || null;
  const isEdit = mode === 'edit' && !!id;

  useEffect(() => {
    fetchUnits();
    if (isEdit) {
      fetchIngredient();
    }
  }, [isEdit, id]);

  const fetchUnits = async () => {
    try {
        const response = await fetch('/api/ingredientsUnit/getAll');
        if (response.ok) {
            const data = await response.json();
            setUnits(data.filter((u: IngredientsUnit) => u.is_active)); // Only show active units
        }
    } catch (error) {
        console.error("Failed to fetch units", error);
    }
  }

  const fetchIngredient = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ingredients/getById/${id}`);
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลวัตถุดิบได้');
      const data = await response.json();
      form.setFieldsValue({
        ingredient_name: data.ingredient_name,
        display_name: data.display_name,
        description: data.description,
        img_url: data.img_url,
        unit_id: data.unit_id,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถดึงข้อมูลวัตถุดิบได้');
      router.push('/ingredients');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        const response = await fetch(`/api/ingredients/update/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตวัตถุดิบได้');
        }
        
        message.success('อัปเดตวัตถุดิบสำเร็จ');
      } else {
        const response = await fetch(`/api/ingredients/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างวัตถุดิบได้');
        }
        
        message.success('สร้างวัตถุดิบสำเร็จ');
      }
      router.push('/ingredients');
    } catch (error: any) {
      console.error(error);
      message.error(error.message || (isEdit ? 'ไม่สามารถอัปเดตวัตถุดิบได้' : 'ไม่สามารถสร้างวัตถุดิบได้'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/ingredients/delete/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('ไม่สามารถลบวัตถุดิบได้');
      message.success('ลบวัตถุดิบสำเร็จ');
      router.push('/ingredients');
    } catch (error) {
        console.error(error);
        message.error('ไม่สามารถลบวัตถุดิบได้');
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/ingredients')}
            className="mb-2 pl-0 hover:bg-transparent hover:text-blue-600"
          >
            กลับไปหน้าจัดการวัตถุดิบ
          </Button>
          <div className="flex justify-between items-center">
            <Title level={2} style={{ margin: 0 }}>
                {isEdit ? 'แก้ไขวัตถุดิบ' : 'เพิ่มวัตถุดิบ'}
            </Title>
            {isEdit && (
                <Popconfirm
                    title="ลบวัตถุดิบ"
                    description="คุณต้องการลบวัตถุดิบหรือไม่?"
                    onConfirm={handleDelete}
                    okText="ใช่"
                    cancelText="ไม่"
                    okButtonProps={{ danger: true }}
                >
                    <Button danger icon={<DeleteOutlined />}>ลบวัตถุดิบ</Button>
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
                name="ingredient_name"
                label="ชื่อวัตถุดิบ *ภาษาอังกฤษ"
                rules={[
                  { required: true, message: 'กรุณากรอกชื่อวัตถุดิบ' },
                  { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรุณากรอกภาษาอังกฤษเท่านั้น' }
                ]}
              >
                <Input size="large" placeholder="เช่น Sugar, Salt, Flour" />
              </Form.Item>

              <Form.Item
                name="display_name"
                label="ชื่อที่แสดง (ภาษาไทย)"
                rules={[
                  { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                  //{ pattern: /^[ก-๙\s]*$/, message: 'กรุณากรอกภาษาไทยเท่านั้น' } // บางทีชื่อไทยอาจมีตัวเลขหรืออังกฤษปนได้บ้าง แต่วัตถุดิบควรไทยล้วนๆ หรือเปล่า? เอาตาม IngredientsUnit
                  // IngredientsUnit ใช้ pattern: /^[ก-๙\s]*$/
                ]}
              >
                <Input size="large" placeholder="เช่น น้ำตาล, เกลือ, แป้ง" />
              </Form.Item>

              <Form.Item
                name="unit_id"
                label="หน่วยวัตถุดิบ"
                rules={[{ required: true, message: 'กรุณาเลือกหน่วยวัตถุดิบ' }]}
              >
                <Select size="large" placeholder="เลือกหน่วย">
                    {units.map((unit) => (
                        <Select.Option key={unit.id} value={unit.id}>
                            {unit.display_name} ({unit.unit_name})
                        </Select.Option>
                    ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="img_url"
                label="รูปภาพ URL"
              >
                <Input size="large" placeholder="https://example.com/image.jpg" />
              </Form.Item>

              <Form.Item
                name="description"
                label="รายละเอียด"
              >
                <TextArea rows={4} placeholder="รายละเอียดเพิ่มเติม..." />
              </Form.Item>

              <Form.Item
                name="is_active"
                label="สถานะ (Active)"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-6">
                <Button size="large" onClick={() => router.push('/ingredients')}>
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
      <IngredientsManageStyle />
    </div>
  );
}

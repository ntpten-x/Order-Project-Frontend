'use client';

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Select, message, Typography, Space, Spin, Popconfirm } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import UserManageStyle from './style';
import { Role } from '@/types/api/roles';

const { Title } = Typography;
const { Option } = Select;

export default function UserManagePage({ params }: { params: { mode: string[] } }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const mode = params.mode[0];
  const userId = params.mode[1] ? Number(params.mode[1]) : null;
  const isEdit = mode === 'edit' && !!userId;

  useEffect(() => {
    fetchRoles();
    if (isEdit) {
      fetchUser();
    }
  }, [isEdit, userId]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles/getAll');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch roles');
    }
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/getById/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user details');
      const user = await response.json();
      form.setFieldsValue({
        username: user.username,
        roles_id: user.roles?.id
      });
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch user details');
      router.push('/users');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        // Use __KEEP_PASSWORD__ if password is not provided/changed
        const passwordToSend = values.password || '__KEEP_PASSWORD__';
        const response = await fetch(`/api/users/update/${values.username}/${passwordToSend}/${values.roles_id}/${userId}`, {
          method: 'PUT'
        });
        
        if (!response.ok) throw new Error('Failed to update user');
        
        message.success('User updated successfully');
      } else {
        const response = await fetch(`/api/users/add/${values.username}/${values.password}/${values.roles_id}`, {
          method: 'POST'
        });

        if (!response.ok) throw new Error('Failed to create user');
        
        message.success('User created successfully');
      }
      router.push('/users');
    } catch (error) {
      console.error(error);
      message.error(isEdit ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/users/delete/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete user');
      message.success('User deleted successfully');
      router.push('/users');
    } catch (error) {
        console.error(error);
        message.error('Failed to delete user');
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/users')}
            className="mb-2 pl-0 hover:bg-transparent hover:text-blue-600"
          >
            กลับไปหน้าผู้ใช้
          </Button>
          <div className="flex justify-between items-center">
            <Title level={2} style={{ margin: 0 }}>
                {isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}
            </Title>
            {isEdit && (
                <Popconfirm
                    title="ลบผู้ใช้"
                    description="คุณต้องการลบผู้ใช้หรือไม่?"
                    onConfirm={handleDelete}
                    okText="ใช่"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                >
                    <Button danger icon={<DeleteOutlined />}>ลบผู้ใช้</Button>
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
            >
              <Form.Item
                name="username"
                label="ชื่อผู้ใช้"
                rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]}
              >
                <Input size="large" placeholder="กรุณากรอกชื่อผู้ใช้" autoComplete="off" />
              </Form.Item>

              <Form.Item
                name="password"
                label={isEdit ? "รหัสผ่านใหม่ (ปล่อยว่างเพื่อไม่เปลี่ยนรหัสผ่าน)" : "รหัสผ่าน"}
                rules={[{ required: !isEdit, message: 'กรุณากรอกรหัสผ่าน' }]}
              >
                <Input.Password size="large" placeholder="กรุณากรอกรหัสผ่าน" autoComplete="new-password" />
              </Form.Item>

              <Form.Item
                name="roles_id"
                label="บทบาท"
                rules={[{ required: true, message: 'กรุณาเลือกบทบาท' }]}
              >
                <Select size="large" placeholder="เลือกบทบาท">
                  {roles.map((role) => (
                    <Option key={role.id} value={role.id}>
                      {role.display_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-6">
                <Button size="large" onClick={() => router.push('/users')}>
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
                  {isEdit ? 'อัปเดตผู้ใช้' : 'สร้างผู้ใช้'}
                </Button>
              </div>
            </Form>
          )}
        </Card>
      </div>
      <UserManageStyle />
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, Button, Card, Select, message, Typography, Spin, Popconfirm, Switch } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import UserManageStyle from './style';
import { Role } from '@/types/api/roles';

const { Title } = Typography;
const { Option } = Select;


import { authService } from "../../../../../services/auth.service";
import { userService } from "../../../../../services/users.service";
import { branchService } from "../../../../../services/branch.service";
import { Branch } from '@/types/api/branch';

export default function UserManagePage({ params }: { params: { mode: string[] } }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [csrfToken, setCsrfToken] = useState<string>("");

  const mode = params.mode[0];
  const userId = params.mode[1] || null;
  const isEdit = mode === 'edit' && !!userId;

  useEffect(() => {
    const fetchCsrf = async () => {
        const token = await authService.getCsrfToken();
        setCsrfToken(token);
    };
    fetchCsrf();
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/roles/getAll');
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลบทบาทได้');
      const data: Role[] = await response.json();
      const filteredRoles = data.filter(role => !['Admin', 'Manager', 'Employee'].includes(role.display_name));
      setRoles(filteredRoles.length > 0 ? filteredRoles : data);
    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถดึงข้อมูลบทบาทได้');
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const data = await branchService.getAll();
      setBranches(data);
    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถดึงข้อมูลสาขาได้');
    }
  }, []);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const user = await userService.getUserById(userId);
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        roles_id: user.roles?.id || user.roles_id,
        branch_id: user.branch?.id || user.branch_id,
        is_active: user.is_active,
        is_use: user.is_use
      });

    } catch (error) {
      console.error(error);
      message.error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      router.push('/users');
    } finally {
      setLoading(false);
    }
  }, [userId, form, router]);

  useEffect(() => {
    fetchRoles();
    fetchBranches();
    if (isEdit) {
      fetchUser();
    }
  }, [isEdit, userId, fetchRoles, fetchBranches, fetchUser]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit && userId) {
        // Edit Mode
        const payload = { ...values };
        if (!payload.password) delete payload.password;

        await userService.updateUser(userId, payload, undefined, csrfToken);
        message.success('อัปเดตผู้ใช้สำเร็จ');
      } else {
        // Create mode
        await userService.createUser(values, undefined, csrfToken);
        message.success('สร้างผู้ใช้สำเร็จ');
      }
      router.push('/users');
    } catch (error: unknown) {
      console.error(error);
      message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตผู้ใช้ได้' : 'ไม่สามารถสร้างผู้ใช้ได้'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    try {
      await userService.deleteUser(userId, undefined, csrfToken);
      message.success('ลบผู้ใช้สำเร็จ');
      router.push('/users');
    } catch (error) {
        console.error(error);
        message.error('ไม่สามารถลบผู้ใช้ได้');
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
                rules={[
                  { required: true, message: 'กรุณากรอกชื่อผู้ใช้' },
                  { pattern: /^[a-zA-Z0-9\-_@.]*$/, message: 'กรุณากรอกภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษ (- _ @ .)' }
                ]}
              >
                <Input size="large" placeholder="กรุณากรอกชื่อผู้ใช้" autoComplete="off" />
              </Form.Item>

              <Form.Item
                name="name"
                label="ชื่อ-นามสกุล / ชื่อเล่น"
                rules={[{ required: true, message: 'กรุณากรอกชื่อ-นามสกุล หรือ ชื่อเล่น' }]}
              >
                <Input size="large" placeholder="ระบุชื่อ (เช่น สมชาย หรือ น้องบี)" autoComplete="off" />
              </Form.Item>

              <Form.Item
                name="password"
                label={isEdit ? "รหัสผ่านใหม่ (ปล่อยว่างเพื่อไม่เปลี่ยนรหัสผ่าน)" : "รหัสผ่าน"}
                rules={[
                  { required: !isEdit, message: 'กรุณากรอกรหัสผ่าน' },
                  { pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/, message: 'กรุณากรอกภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษเท่านั้น' }
                ]}
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

              <Form.Item
                name="branch_id"
                label="สาขา"
                rules={[{ required: true, message: 'กรุณาเลือกสาขา' }]}
              >
                <Select size="large" placeholder="เลือกสาขา" allowClear>
                  {branches.map((branch) => (
                    <Option key={branch.id} value={branch.id}>
                      {branch.branch_name} ({branch.branch_code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>



              {isEdit && (
                <div className="flex gap-8 mb-4">
                  <Form.Item
                    name="is_active"
                    label="สถานะ (Active)"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="is_use"
                    label="การใช้งาน (In Use)"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </div>
              )}

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

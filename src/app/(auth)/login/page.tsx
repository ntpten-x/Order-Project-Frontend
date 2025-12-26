"use client";

import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setLoading(true);
        try {
            await login({ username: values.username, password: values.password });
            message.success('เข้าสู่ระบบสำเร็จ');
            router.push('/groups'); // Default redirect, usually auth guard handles this but good to have explicit
        } catch (error) {
             console.error(error);
             message.error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-lg rounded-2xl border-0">
                <div className="text-center mb-8">
                    <Title level={2} className="!mb-2 text-primary">
                        ยินดีต้อนรับ
                    </Title>
                    <Text type="secondary">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</Text>
                </div>

                <Form
                    name="login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: "กรุณากรอกชื่อผู้ใช้!" },
                            { pattern: /^[a-zA-Z0-9\-_@.]*$/, message: 'กรุณากรอกภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษ (- _ @ .)' }
                        ]}
                    >
                        <Input 
                            prefix={<UserOutlined className="text-gray-400" />} 
                            placeholder="ชื่อผู้ใช้" 
                            className="rounded-lg"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: "กรุณากรอกรหัสผ่าน!" },
                            { pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/, message: 'กรุณากรอกภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษเท่านั้น' }
                        ]}
                    >
                        <Input.Password 
                            prefix={<LockOutlined className="text-gray-400" />} 
                            placeholder="รหัสผ่าน" 
                            className="rounded-lg"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading} 
                            block
                            className="h-12 text-lg font-medium rounded-lg bg-blue-600 hover:bg-blue-500"
                        >
                            เข้าสู่ระบบ
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}

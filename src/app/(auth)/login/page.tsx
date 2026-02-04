"use client";

import React, { useState } from "react";
import { Form, notification } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../../../contexts/AuthContext";
import { LoginCredentials } from "../../../types/api/auth";
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";
import {
    LoginContainer,
    StyledCard,
    LoginTitle,
    FormContainer,
    FormItemWrapper,
    StyledInput,
    StyledPasswordInput,
    GradientButton,
} from "./style";

export default function LoginPage() {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: LoginCredentials) => {
        setLoading(true);
        try {
            await login(values);
            notification.success({
                message: "เข้าสู่ระบบสำเร็จ",
                description: "ยินดีต้อนรับเข้าสู่ระบบ",
                placement: "topRight",
            });
            setTimeout(() => {
                window.location.href = "/";
            }, 1000);
        } catch (error: unknown) {
            notification.error({
                message: "เข้าสู่ระบบไม่สำเร็จ",
                description: (error as { message: string }).message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
                placement: "topRight",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <UIPageHeader title="เข้าสู่ระบบ" subtitle="ยินดีต้อนรับ" />
            <PageContainer>
                <PageSection>
                    <LoginContainer>
                        <StyledCard>
                            <LoginTitle>เข้าสู่ระบบ</LoginTitle>
                            
                            <FormContainer>
                                <Form
                                    name="login"
                                    onFinish={onFinish}
                                    layout="vertical"
                                    requiredMark={false}
                                >
                                    <FormItemWrapper>
                                        <Form.Item
                                            name="username"
                                            rules={[
                                                { required: true, message: "กรุณากรอกชื่อผู้ใช้" },
                                                { pattern: /^[a-zA-Z0-9\-_@.]*$/, message: "กรุณากรอกภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษ (- _ @ .)" }
                                            ]}
                                        >
                                            <StyledInput
                                                prefix={<UserOutlined />}
                                                placeholder="ชื่อผู้ใช้"
                                                autoComplete="username"
                                            />
                                        </Form.Item>
                                    </FormItemWrapper>

                                    <FormItemWrapper>
                                        <Form.Item
                                            name="password"
                                            rules={[
                                                { required: true, message: "กรุณากรอกรหัสผ่าน" },
                                                { pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/, message: "กรุณากรอกภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษเท่านั้น" }
                                            ]}
                                        >
                                            <StyledPasswordInput
                                                prefix={<LockOutlined />}
                                                placeholder="รหัสผ่าน"
                                                autoComplete="current-password"
                                            />
                                        </Form.Item>
                                    </FormItemWrapper>

                                    <Form.Item style={{ marginBottom: 0 }}>
                                        <GradientButton
                                            type="primary"
                                            htmlType="submit"
                                            loading={loading}
                                            block
                                        >
                                            เข้าสู่ระบบ
                                        </GradientButton>
                                    </Form.Item>
                                </Form>
                            </FormContainer>
                        </StyledCard>
                    </LoginContainer>
                </PageSection>
            </PageContainer>
        </>
    );
}

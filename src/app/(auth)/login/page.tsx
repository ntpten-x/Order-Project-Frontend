"use client";

import React, { useState, useEffect, useRef } from "react";
import { Form, notification, InputRef } from "antd";
import { UserOutlined, LockOutlined, SafetyOutlined } from "@ant-design/icons";
import { useAuth } from "../../../contexts/AuthContext";
import { LoginCredentials } from "../../../types/api/auth";
import {
    LoginContainer,
    FloatingOrb,
    StyledCard,
    LogoContainer,
    LogoIcon,
    LoginTitle,
    LoginSubtitle,
    FormContainer,
    FormItemWrapper,
    StyledInput,
    StyledPasswordInput,
    GradientButton,
    SecureBadge,
} from "./style";

export default function LoginPage() {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const usernameRef = useRef<InputRef>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            usernameRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const onFinish = async (values: LoginCredentials) => {
        setLoading(true);
        try {
            await login(values);
            notification.success({
                message: "เข้าสู่ระบบสำเร็จ",
                description: "ยินดีต้อนรับเข้าสู่ระบบ",
                placement: "topRight",
            });
        } catch (error: unknown) {
            notification.error({
                message: "เข้าสู่ระบบไม่สำเร็จ",
                description: (error as { message?: string })?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
                placement: "topRight",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginContainer>
            <FloatingOrb />

            <StyledCard>
                <LogoContainer>
                    <LogoIcon>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </LogoIcon>
                </LogoContainer>

                <LoginTitle>ยินดีต้อนรับ</LoginTitle>
                <LoginSubtitle>เข้าสู่ระบบเพื่อจัดการร้านค้าของคุณ</LoginSubtitle>

                <FormContainer>
                    <Form name="login" onFinish={onFinish} layout="vertical" requiredMark={false} autoComplete="on">
                        <FormItemWrapper>
                            <Form.Item
                                name="username"
                                rules={[{ required: true, message: "กรุณากรอกชื่อผู้ใช้" }]}
                            >
                                <StyledInput
                                    ref={usernameRef}
                                    prefix={<UserOutlined />}
                                    placeholder="ชื่อผู้ใช้"
                                    autoComplete="username"
                                    aria-label="ชื่อผู้ใช้"
                                />
                            </Form.Item>
                        </FormItemWrapper>

                        <FormItemWrapper>
                            <Form.Item
                                name="password"
                                rules={[
                                    { required: true, message: "กรุณากรอกรหัสผ่าน" },
                                    {
                                        pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]*$/,
                                        message: "กรุณากรอกภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษเท่านั้น",
                                    },
                                ]}
                            >
                                <StyledPasswordInput
                                    prefix={<LockOutlined />}
                                    placeholder="รหัสผ่าน"
                                    autoComplete="current-password"
                                    aria-label="รหัสผ่าน"
                                />
                            </Form.Item>
                        </FormItemWrapper>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <GradientButton type="primary" htmlType="submit" loading={loading} block>
                                เข้าสู่ระบบ
                            </GradientButton>
                        </Form.Item>
                    </Form>
                </FormContainer>

                <SecureBadge>
                    <SafetyOutlined />
                    <span>การเชื่อมต่อที่ปลอดภัย</span>
                </SecureBadge>
            </StyledCard>
        </LoginContainer>
    );
}

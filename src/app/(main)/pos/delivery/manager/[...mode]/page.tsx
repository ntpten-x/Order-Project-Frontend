'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Switch, Modal, Typography, Button } from 'antd';
import { useRouter } from 'next/navigation';
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";
import {
    DeleteOutlined,
    SaveOutlined,
    CarOutlined,
    CheckCircleFilled
} from '@ant-design/icons';
import Image from "next/image";
import { globalStyles, pageStyles } from '../../../../../../theme/pos/delivery/style';
import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import { useGlobalLoading } from "../../../../../../contexts/pos/GlobalLoadingContext";

const { Title, Text } = Typography;

// ============ REUSABLE COMPONENTS ============

const ManagePageStyles = () => (
    <>
        <style>{globalStyles}</style>
        <style jsx global>{`
            .ant-form-item-label > label {
                font-size: 15px;
                font-weight: 500;
                color: #334155;
            }
            .ant-input-lg, .ant-input-number-lg {
                border-radius: 12px;
                padding: 10px 16px;
                font-size: 16px;
                border-color: #E2E8F0;
            }
            .ant-input-lg:hover, .ant-input-number-lg:hover {
                border-color: #0891B2;
            }
            .ant-input-lg:focus, .ant-input-number-lg:focus {
                border-color: #0891B2;
                box-shadow: 0 0 0 2px rgba(8, 145, 178, 0.1);
            }
            .ant-card-bordered {
                border-color: #E2E8F0;
            }
        `}</style>
    </>
);

// Preview Component
const DeliveryPreview = ({ name, logo }: { name?: string, logo?: string }) => {
    // Determine active status for preview (always active visually to look good)
    // Determine active status for preview (always active visually to look good)
    
    return (
        <div style={{ 
            background: 'white', 
            borderRadius: 24, 
            padding: 24,
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            border: '1px solid #F1F5F9',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <Title level={5} style={{ color: '#94A3B8', marginBottom: 20, fontWeight: 600, width: '100%', textAlign: 'left' }}>
                ตัวอย่างการแสดงผล
            </Title>
            
            <div style={{ 
                width: '100%',
                background: 'white',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                maxWidth: 400
            }}>
                 {/* Icon */}
                 <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginRight: 16,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 4px 10px rgba(8, 145, 178, 0.1)'
                }}>
                    {logo ? (
                        <Image 
                            src={logo} 
                            alt={name || 'Logo'} 
                            fill
                            sizes="56px"
                            style={{ objectFit: 'contain', padding: 8 }} 
                            onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <CarOutlined style={{ fontSize: 24, color: '#0891B2' }} />
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 16, color: '#1E293B' }}>
                            {name || 'ชื่อบริการส่ง'}
                        </Text>
                        <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />
                    </div>
                </div>
            </div>
            
            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                    นี่คือลักษณะที่จะแสดงในรายการ
                </Text>
            </div>
        </div>
    );
};

interface ActionButtonsProps {
    isEdit: boolean;
    loading: boolean;
    onCancel: () => void;
}

const ActionButtons = ({ isEdit, loading, onCancel }: ActionButtonsProps) => (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 12, 
        marginTop: 40,
        borderTop: '1px solid #F1F5F9',
        paddingTop: 24
    }}>
        <Button 
            size="large" 
            onClick={onCancel}
            style={{ 
                borderRadius: 12, 
                height: 48,
                padding: '0 32px',
                border: '1px solid #E2E8F0',
                color: '#64748B',
                fontWeight: 600
            }}
        >
            ยกเลิก
        </Button>
        <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
            style={{ 
                borderRadius: 12, 
                height: 48,
                padding: '0 32px',
                background: '#0891B2',
                boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)',
                fontWeight: 600,
                border: 'none'
            }}
        >
            {isEdit ? 'บันทึกการแก้ไข' : 'สร้างบริการส่ง'}
        </Button>
    </div>
);

// ============ MAIN PAGE ============

export default function DeliveryManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deliveryName, setDeliveryName] = useState<string>('');
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [csrfToken, setCsrfToken] = useState<string>("");
    const { showLoading, hideLoading } = useGlobalLoading();

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === 'edit' && !!id;
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await getCsrfTokenCached();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchDelivery = useCallback(async () => {
        setLoading(true);
        showLoading();
        try {
            const response = await fetch(`/api/pos/delivery/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลบริการส่งได้');
            const data = await response.json();
            form.setFieldsValue({
                delivery_name: data.delivery_name,
                delivery_prefix: data.delivery_prefix,
                logo: data.logo,
                is_active: data.is_active,
            });
            setDeliveryName(data.delivery_name || '');
            setLogoUrl(data.logo || '');
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลบริการส่งได้');
            router.push('/pos/delivery');
        } finally {
            setLoading(false);
            hideLoading();
        }
    }, [id, form, router, showLoading, hideLoading]);

    useEffect(() => {
        if (isEdit) {
            fetchDelivery();
        } else {
            hideLoading();
        }
    }, [isEdit, id, fetchDelivery, hideLoading]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/pos/delivery/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตบริการส่งได้');
                }
                
                message.success('อัปเดตบริการส่งสำเร็จ');
            } else {
                const response = await fetch(`/api/pos/delivery/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างบริการส่งได้');
                }
                
                message.success('สร้างบริการส่งสำเร็จ');
            }
            router.push('/pos/delivery');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตบริการส่งได้' : 'ไม่สามารถสร้างบริการส่งได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบบริการส่ง',
            content: `คุณต้องการลบบริการส่ง "${deliveryName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            maskClosable: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/delivery/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                     if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบบริการส่งได้');
                    }
                    message.success('ลบบริการส่งสำเร็จ');
                    router.push('/pos/delivery');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบบริการส่งได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/delivery');

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }
    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div className="manage-page" style={pageStyles.container}>
            <ManagePageStyles />

            <UIPageHeader
                title={isEdit ? "แก้ไขบริการส่ง" : "เพิ่มบริการส่ง"}
                subtitle={isEdit ? "แก้ไขข้อมูลบริการส่ง" : "สร้างบริการส่งใหม่"}
                onBack={handleBack}
                actions={
                    isEdit ? (
                        <Button danger onClick={handleDelete} icon={<DeleteOutlined />}>
                            ลบ
                        </Button>
                    ) : null
                }
            />

            <PageContainer maxWidth={1000}>
                <PageSection style={{ background: "transparent", border: "none" }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Form */}
                    <div className="md:col-span-2">
                        <div style={{ 
                            background: 'white', 
                            borderRadius: 24, 
                            padding: 32,
                            boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                        }}>
                             {loading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                                    <Spin size="large" />
                                </div>
                            ) : (
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={onFinish}
                                    requiredMark={false}
                                    autoComplete="off"
                                    initialValues={{ is_active: true }}
                                    onValuesChange={(changedValues) => {
                                        if (changedValues.delivery_name !== undefined) {
                                            setDeliveryName(changedValues.delivery_name);
                                        }
                                        if (changedValues.logo !== undefined) {
                                            setLogoUrl(changedValues.logo);
                                        }
                                    }}
                                >
                                    <div style={{ marginBottom: 24 }}>
                                        <Text strong style={{ fontSize: 18, color: '#1E293B', display: 'block', marginBottom: 16 }}>
                                            ข้อมูลทั่วไป
                                        </Text>
                                        
                                        <div className="grid grid-cols-1 gap-6">
                                            <Form.Item
                                                name="delivery_name"
                                                label="ชื่อบริการส่ง *"
                                                rules={[
                                                    { required: true, message: 'กรุณากรอกชื่อบริการส่ง' },
                                                    { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                                ]}
                                            >
                                                <Input 
                                                    size="large" 
                                                    placeholder="เช่น Grab, Lineman, Shopee Food" 
                                                    maxLength={100}
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="delivery_prefix"
                                                label="รหัสย่อ (Prefix)"
                                                rules={[
                                                    { max: 10, message: 'ความยาวต้องไม่เกิน 10 ตัวอักษร' }
                                                ]}
                                                normalize={(value) => (value || '').toUpperCase()}
                                                extra="ใช้สำหรับสร้างรหัสออเดอร์ (เช่น GF-123)"
                                            >
                                                <Input 
                                                    size="large" 
                                                    placeholder="เช่น GR, LM" 
                                                    maxLength={10}
                                                    style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 24, borderTop: '1px solid #F1F5F9', paddingTop: 24 }}>
                                        <Text strong style={{ fontSize: 18, color: '#1E293B', display: 'block', marginBottom: 16 }}>
                                            การแสดงผล
                                        </Text>

                                        <Form.Item
                                            name="logo"
                                            label="รูป (URL)"
                                            rules={[
                                                { 
                                                    validator: async (_, value) => {
                                                        if (!value) return;
                                                        if (value.startsWith('data:image')) return;
                                                        try {
                                                            new URL(value);
                                                            return;
                                                        } catch {
                                                            throw new Error('กรุณากรอก URL ที่ถูกต้อง');
                                                        }
                                                    }
                                                }
                                            ]}
                                        >
                                            <Input 
                                                size="large" 
                                                placeholder="https://example.com/logo.png" 
                                                allowClear
                                            />
                                        </Form.Item>

                                        {/* Logo Preview */}
                                        {logoUrl && (
                                            <div style={{ 
                                                marginTop: -16, 
                                                marginBottom: 24, 
                                                padding: 16, 
                                                background: '#F8FAFC', 
                                                borderRadius: 12,
                                                border: '1px dashed #E2E8F0'
                                            }}>
                                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                                                    ตัวอย่างรูป
                                                </Text>
                                                <div style={{ 
                                                    width: 80, 
                                                    height: 80, 
                                                    borderRadius: 12, 
                                                    overflow: 'hidden',
                                                    background: 'white',
                                                    border: '1px solid #E2E8F0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative'
                                                }}>
                                                    <Image 
                                                        src={logoUrl} 
                                                        alt="Logo Preview" 
                                                        fill
                                                        sizes="80px"
                                                        style={{ objectFit: 'contain', padding: 8 }}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                         <Form.Item
                                            name="is_active"
                                            label="สถานะการใช้งาน"
                                            valuePropName="checked"
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Switch 
                                                checkedChildren="เปิดใช้งาน" 
                                                unCheckedChildren="ปิดใช้งาน"
                                                style={{ background: form.getFieldValue('is_active') ? '#10B981' : undefined }}
                                            />
                                        </Form.Item>
                                    </div>

                                    <ActionButtons 
                                        isEdit={isEdit}
                                        loading={submitting}
                                        onCancel={handleBack}
                                    />
                                </Form>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="md:col-span-1 hidden md:block">
                        <div style={{ position: 'sticky', top: 24 }}>
                            <DeliveryPreview 
                                name={deliveryName} 
                                logo={logoUrl}
                            />
                        </div>
                    </div>
                </div>
                </PageSection>
            </PageContainer>
        </div>
    );
}

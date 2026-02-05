'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Switch, Modal, Button, Card, Row, Col, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";
import { 
    DeleteOutlined, 
    SaveOutlined, 
    UnorderedListOutlined,
    CheckCircleFilled,
    AppstoreOutlined
} from '@ant-design/icons';
import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import { pageStyles } from '../../../../../../theme/pos/productsUnit/style';

const { Title, Text } = Typography;

// ============ HEADER COMPONENT ============

// ============ PREVIEW CARD COMPONENT ============

const UnitPreviewCard = ({ displayName, unitName, isActive }: { displayName: string, unitName: string, isActive: boolean }) => (
    <div style={{ 
        background: 'white', 
        borderRadius: 24, 
        padding: 24,
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        textAlign: 'center',
        border: '1px solid #F1F5F9',
        height: '100%'
    }}>
        <Title level={5} style={{ color: '#94A3B8', marginBottom: 20, fontWeight: 600 }}>ตัวอย่างการแสดงผล</Title>
        
        <div style={{ 
            borderRadius: 20, 
            border: `1px solid ${isActive ? '#E2E8F0' : '#F1F5F9'}`,
            padding: 16,
            background: isActive ? 'white' : 'rgba(255,255,255,0.6)',
            boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            maxWidth: 320,
            margin: '0 auto 24px'
        }}>
             <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: isActive 
                    ? 'linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)' 
                    : '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <UnorderedListOutlined style={{ 
                    fontSize: 24, 
                    color: isActive ? '#0891B2' : '#94A3B8' 
                }} />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 16, color: isActive ? '#1E293B' : '#64748B' }}>
                        {displayName || 'ชื่อหน่วย'}
                    </Text>
                    {isActive && <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />}
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                    {unitName || 'Unit Name'}
                </Text>
            </div>
        </div>
        
        <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>สถานะ</Text>
                <div style={{ 
                    padding: '4px 12px', 
                    borderRadius: 20, 
                    background: isActive ? '#ECFDF5' : '#FEF2F2',
                    color: isActive ? '#10B981' : '#EF4444',
                    fontSize: 12,
                    fontWeight: 600
                }}>
                    {isActive ? 'พร้อมใช้งาน' : 'ปิดใช้งาน'}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>ประเภท</Text>
                <Text strong style={{ fontSize: 13, color: '#1E293B' }}>หน่วยนับสินค้า</Text>
            </div>
        </div>
    </div>
);


export default function ProductsUnitManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [unitName, setUnitName] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [csrfToken, setCsrfToken] = useState<string>("");

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === 'edit' && !!id;
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ["Admin", "Manager"] });

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await getCsrfTokenCached();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchUnit = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/productsUnit/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหน่วยสินค้าได้');
            const data = await response.json();
            form.setFieldsValue({
                unit_name: data.unit_name,
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setUnitName(data.unit_name || '');
            setIsActive(data.is_active);
        } catch (error: unknown) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลหน่วยสินค้าได้');
            router.push('/pos/productsUnit');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchUnit();
        }
    }, [isEdit, id, fetchUnit]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            const endpoint = isEdit ? `/api/pos/productsUnit/update/${id}` : `/api/pos/productsUnit/create`;
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(values),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || (isEdit ? 'ไม่สามารถอัปเดตหน่วยสินค้าได้' : 'ไม่สามารถสร้างหน่วยสินค้าได้'));
            }
            
            message.success(isEdit ? 'อัปเดตหน่วยสินค้าสำเร็จ' : 'สร้างหน่วยสินค้าสำเร็จ');
            router.push('/pos/productsUnit');
        } catch (error: unknown) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถสร้าง/แก้ไขหน่วยสินค้าได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยสินค้า',
            content: `คุณต้องการลบหน่วย "${displayName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/productsUnit/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบหน่วยสินค้าได้');
                    message.success('ลบหน่วยสินค้าสำเร็จ');
                    router.push('/pos/productsUnit');
                } catch (error: unknown) {
                    console.error(error);
                    message.error('ไม่สามารถลบหน่วยสินค้าได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/productsUnit');

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }
    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div className="manage-page" style={pageStyles.container}>
            <UIPageHeader
                title={isEdit ? "แก้ไขหน่วยสินค้า" : "เพิ่มหน่วยสินค้า"}
                subtitle={isEdit ? "แก้ไขข้อมูลหน่วยสินค้า" : "สร้างหน่วยสินค้าใหม่"}
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
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', background: 'rgba(255,255,255,0.8)', borderRadius: 24, backdropFilter: 'blur(10px)' }}>
                        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
                    </div>
                ) : (
                    <Row gutter={[24, 24]}>
                        {/* Form Column */}
                        <Col xs={24} lg={14} xl={15}>
                            <Card 
                                bordered={false} 
                                style={{ 
                                    borderRadius: 24, 
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    overflow: 'hidden' 
                                }}
                                styles={{ body: { padding: 32 } }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                    <AppstoreOutlined style={{ fontSize: 20, color: '#0891B2' }} />
                                    <Title level={5} style={{ margin: 0 }}>ข้อมูลหน่วยสินค้า</Title>
                                </div>
                                
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={onFinish}
                                    requiredMark={false}
                                    autoComplete="off"
                                    initialValues={{ is_active: true }}
                                    onValuesChange={(changedValues) => {
                                        if (changedValues.display_name !== undefined) setDisplayName(changedValues.display_name);
                                        if (changedValues.unit_name !== undefined) setUnitName(changedValues.unit_name);
                                        if (changedValues.is_active !== undefined) setIsActive(changedValues.is_active);
                                    }}
                                >
                                    <Form.Item
                                        name="unit_name"
                                        label={<span style={{ fontWeight: 600, color: '#475569' }}>Unit Name (English)</span>}
                                        rules={[
                                            { required: true, message: 'กรุณากรอกชื่อหน่วย' },
                                            { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรุณากรอกภาษาอังกฤษเท่านั้น' },
                                            { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                        ]}
                                    >
                                        <Input 
                                            size="large" 
                                            placeholder="e.g. Box, Kg, Liter" 
                                            style={{ borderRadius: 12, height: 48, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                            maxLength={100}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="display_name"
                                        label={<span style={{ fontWeight: 600, color: '#475569' }}>ชื่อที่แสดง (ภาษาไทย)</span>}
                                        rules={[
                                            { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                                            { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                        ]}
                                    >
                                        <Input 
                                            size="large" 
                                            placeholder="เช่น กล่อง, กิโลกรัม, ลิตร" 
                                            style={{ borderRadius: 12, height: 48, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                            maxLength={100}
                                        />
                                    </Form.Item>

                                    <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: 16, marginTop: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Text strong style={{ fontSize: 15, display: 'block' }}>สถานะการใช้งาน</Text>
                                                <Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อให้แสดงในหน้าขายสินค้า</Text>
                                            </div>
                                            <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                <Switch 
                                                    style={{ background: isActive ? '#10B981' : undefined }}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
                                        <Button 
                                            size="large"
                                            onClick={handleBack}
                                            style={{ flex: 1, borderRadius: 12, height: 48, fontWeight: 600 }}
                                        >
                                            ยกเลิก
                                        </Button>
                                        <Button 
                                            type="primary"
                                            htmlType="submit"
                                            loading={submitting}
                                            icon={<SaveOutlined />}
                                            style={{ 
                                                flex: 2, 
                                                borderRadius: 12, 
                                                height: 48, 
                                                fontWeight: 600,
                                                background: '#0891B2',
                                                boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
                                            }}
                                        >
                                            บันทึกข้อมูล
                                        </Button>
                                    </div>
                                </Form>
                            </Card>
                        </Col>

                        {/* Preview Column */}
                        <Col xs={24} lg={10} xl={9}>
                            <UnitPreviewCard 
                                displayName={displayName} 
                                unitName={unitName} 
                                isActive={isActive} 
                            />
                        </Col>
                    </Row>
                )}
                </PageSection>
            </PageContainer>
        </div>
    );
}

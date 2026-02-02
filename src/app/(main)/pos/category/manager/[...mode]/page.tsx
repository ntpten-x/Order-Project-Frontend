'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Switch, Modal, Button, Card, Row, Col, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeftOutlined, 
    DeleteOutlined, 
    SaveOutlined, 
    TagsOutlined,
    CheckCircleFilled,
    AppstoreOutlined
} from '@ant-design/icons';
import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import { pageStyles } from '../../../../../../theme/pos/category/style';

const { Title, Text, Paragraph } = Typography;

// ============ HEADER COMPONENT ============

interface HeaderProps {
    isEdit: boolean;
    onBack: () => void;
    onDelete?: () => void;
}

const PageHeader = ({ isEdit, onBack, onDelete }: HeaderProps) => (
    <div style={{
        ...pageStyles.header,
        minHeight: 180, // Slightly taller for detail page
    }}>
        <div style={pageStyles.headerDecoCircle1} />
        <div style={pageStyles.headerDecoCircle2} />
        
        <div style={pageStyles.headerContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Button 
                    type="text" 
                    icon={<ArrowLeftOutlined style={{ fontSize: 20, color: 'white' }} />} 
                    onClick={onBack}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: 'white'
                    }}
                />
                <div>
                    <Text style={{ 
                        color: 'rgba(255,255,255,0.85)', 
                        fontSize: 13,
                        display: 'block',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        {isEdit ? 'แก้ไขข้อมูล' : 'สร้างรายการใหม่'}
                    </Text>
                    <Title level={4} style={{ 
                        color: 'white', 
                        margin: 0,
                        fontWeight: 700,
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {isEdit ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
                    </Title>
                </div>
            </div>
            
            {isEdit && onDelete && (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={onDelete}
                    style={{
                        background: '#FEF2F2',
                        color: '#EF4444',
                        borderRadius: 12,
                        height: 40,
                        padding: '0 16px',
                        fontWeight: 600
                    }}
                >
                    <span className="hidden sm:inline">ลบหมวดหมู่</span>
                </Button>
            )}
        </div>
    </div>
);

// ============ PREVIEW CARD COMPONENT ============

const CategoryPreviewCard = ({ displayName, categoryName, isActive }: { displayName: string, categoryName: string, isActive: boolean }) => (
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
                    ? 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)' 
                    : '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <TagsOutlined style={{ 
                    fontSize: 24, 
                    color: isActive ? '#7C3AED' : '#94A3B8' 
                }} />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 16, color: isActive ? '#1E293B' : '#64748B' }}>
                        {displayName || 'ชื่อหมวดหมู่'}
                    </Text>
                    {isActive && <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />}
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                    {categoryName || 'Category Name'}
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
                <Text strong style={{ fontSize: 13, color: '#1E293B' }}>สินค้าทั่วไป</Text>
            </div>
        </div>
    </div>
);


export default function CategoryManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [categoryName, setCategoryName] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [csrfToken, setCsrfToken] = useState<string>("");

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

    const fetchCategory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/category/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            const data = await response.json();
            form.setFieldsValue({
                category_name: data.category_name,
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setCategoryName(data.category_name || '');
            setIsActive(data.is_active);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            router.push('/pos/category');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchCategory();
        }
    }, [isEdit, id, fetchCategory]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            const endpoint = isEdit ? `/api/pos/category/update/${id}` : `/api/pos/category/create`;
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
                throw new Error(errorData.error || errorData.message || (isEdit ? 'ไม่สามารถอัปเดตหมวดหมู่ได้' : 'ไม่สามารถสร้างหมวดหมู่ได้'));
            }
            
            message.success(isEdit ? 'อัปเดตหมวดหมู่สำเร็จ' : 'สร้างหมวดหมู่สำเร็จ');
            router.push('/pos/category');
        } catch (error: any) {
            console.error(error);
            message.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบหมวดหมู่',
            content: `คุณต้องการลบหมวดหมู่ "${displayName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/category/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบหมวดหมู่ได้');
                    message.success('ลบหมวดหมู่สำเร็จ');
                    router.push('/pos/category');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบหมวดหมู่ได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/category');

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }
    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div className="manage-page" style={pageStyles.container}>
            {/* Header */}
            <PageHeader 
                isEdit={isEdit}
                onBack={handleBack}
                onDelete={isEdit ? handleDelete : undefined}
            />
            
            <div style={{ 
                maxWidth: 1000, 
                margin: '-60px auto 40px', 
                padding: '0 16px', 
                position: 'relative', 
                zIndex: 10 
            }}>
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
                                    <AppstoreOutlined style={{ fontSize: 20, color: '#7C3AED' }} />
                                    <Title level={5} style={{ margin: 0 }}>ข้อมูลหมวดหมู่</Title>
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
                                        if (changedValues.category_name !== undefined) setCategoryName(changedValues.category_name);
                                        if (changedValues.is_active !== undefined) setIsActive(changedValues.is_active);
                                    }}
                                >
                                    <Form.Item
                                        name="category_name"
                                        label={<span style={{ fontWeight: 600, color: '#475569' }}>Category Name (English)</span>}
                                        rules={[
                                            { required: true, message: 'กรุณากรอกชื่อหมวดหมู่' },
                                            { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรุณากรอกภาษาอังกฤษเท่านั้น' },
                                            { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                        ]}
                                    >
                                        <Input 
                                            size="large" 
                                            placeholder="e.g. Beverage, Food" 
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
                                            placeholder="เช่น เครื่องดื่ม, อาหาร" 
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
                                                background: '#7C3AED',
                                                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
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
                            <CategoryPreviewCard 
                                displayName={displayName} 
                                categoryName={categoryName} 
                                isActive={isActive} 
                            />
                        </Col>
                    </Row>
                )}
            </div>
        </div>
    );
}

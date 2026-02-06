'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Switch, Modal, Typography, Button, Select } from 'antd';
import { useRouter } from 'next/navigation';
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../../components/ui/page/PageHeader";
import {
    DeleteOutlined,
    SaveOutlined,
    TableOutlined,
    CheckCircleFilled
} from '@ant-design/icons';
import { globalStyles, pageStyles } from '../../../../../../theme/pos/tables/style';
import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import { useGlobalLoading } from "../../../../../../contexts/pos/GlobalLoadingContext";
import { TableStatus } from "../../../../../../types/api/pos/tables";

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
            .ant-input-lg, .ant-input-number-lg, .ant-select-selector {
                border-radius: 12px !important;
                padding: 8px 11px !important;
                font-size: 16px !important;
                border-color: #E2E8F0 !important;
            }
            .ant-select-lg .ant-select-selector {
                 padding: 0 11px !important;
                 height: 48px !important;
                 align-items: center;
            }
            .ant-input-lg:hover, .ant-input-number-lg:hover, .ant-select-selector:hover {
                border-color: #7C3AED !important;
            }
            .ant-input-lg:focus, .ant-input-number-lg:focus, .ant-select-focused .ant-select-selector {
                border-color: #7C3AED !important;
                box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1) !important;
            }
        `}</style>
    </>
);

// Preview Component
const TablePreview = ({ name }: { name?: string }) => {
    
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
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginRight: 16,
                    position: 'relative',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <TableOutlined style={{ fontSize: 22, color: '#10B981' }} />
                    </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 16, color: '#1E293B' }}>
                            {name || 'ชื่อโต๊ะ'}
                        </Text>
                        <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />
                    </div>
                </div>
            </div>
            
            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                    นี่คือลักษณะที่จะแสดงในรายการ (สถานะว่าง)
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
                background: '#7C3AED',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                fontWeight: 600,
                border: 'none'
            }}
        >
            {isEdit ? 'บันทึกการแก้ไข' : 'สร้างโต๊ะ'}
        </Button>
    </div>
);

// ============ MAIN PAGE ============

export default function TablesManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [tableName, setTableName] = useState<string>('');
    const [csrfToken, setCsrfToken] = useState<string>("");
    const { showLoading, hideLoading } = useGlobalLoading();

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

    const fetchTable = useCallback(async () => {
        setLoading(true);
        showLoading();
        try {
            const response = await fetch(`/api/pos/tables/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลโต๊ะได้');
            const data = await response.json();
            form.setFieldsValue({
                table_name: data.table_name,
                status: data.status,
                is_active: data.is_active,
            });
            setTableName(data.table_name || '');
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลโต๊ะได้');
            router.push('/pos/tables');
        } finally {
            setLoading(false);
            hideLoading();
        }
    }, [id, form, router, showLoading, hideLoading]);

    useEffect(() => {
        if (isEdit) {
            fetchTable();
        } else {
            hideLoading();
            // Set default values for create mode
            form.setFieldsValue({
                status: TableStatus.Available,
                is_active: true
            });
        }
    }, [isEdit, id, fetchTable, hideLoading, form]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/pos/tables/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตโต๊ะได้');
                }
                
                message.success('อัปเดตโต๊ะสำเร็จ');
            } else {
                const response = await fetch(`/api/pos/tables/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างโต๊ะได้');
                }
                
                message.success('สร้างโต๊ะสำเร็จ');
            }
            router.push('/pos/tables');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตโต๊ะได้' : 'ไม่สามารถสร้างโต๊ะได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบโต๊ะ',
            content: `คุณต้องการลบโต๊ะ "${tableName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            maskClosable: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/tables/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                     if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบโต๊ะได้');
                    }
                    message.success('ลบโต๊ะสำเร็จ');
                    router.push('/pos/tables');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบโต๊ะได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/tables');

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
                title={isEdit ? "แก้ไขข้อมูลโต๊ะ" : "เพิ่มโต๊ะ"}
                subtitle={isEdit ? "แก้ไขชื่อหรือสถานะของโต๊ะอาหาร" : "สร้างโต๊ะใหม่ในร้านของคุณ"}
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
                                    initialValues={{ 
                                        is_active: true,
                                        status: TableStatus.Available
                                    }}
                                    onValuesChange={(changedValues) => {
                                        if (changedValues.table_name !== undefined) {
                                            setTableName(changedValues.table_name);
                                        }
                                    }}
                                >
                                    <div style={{ marginBottom: 24 }}>
                                        <Text strong style={{ fontSize: 18, color: '#1E293B', display: 'block', marginBottom: 16 }}>
                                            ข้อมูลทั่วไป
                                        </Text>
                                        
                                        <div className="grid grid-cols-1 gap-6">
                                            <Form.Item
                                                name="table_name"
                                                label="ชื่อโต๊ะ *"
                                                rules={[
                                                    { required: true, message: 'กรุณากรอกชื่อโต๊ะ' },
                                                    { max: 50, message: 'ความยาวต้องไม่เกิน 50 ตัวอักษร' }
                                                ]}
                                            >
                                                <Input 
                                                    size="large" 
                                                    placeholder="เช่น T-01, VIP-1" 
                                                    maxLength={50}
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="status"
                                                label="สถานะเริ่มต้น"
                                                rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
                                            >
                                                <Select
                                                    size="large"
                                                    dropdownMatchSelectWidth
                                                    getPopupContainer={(trigger) => trigger?.parentElement || document.body}
                                                >
                                                    <Select.Option value={TableStatus.Available}>ว่าง (Available)</Select.Option>
                                                    <Select.Option value={TableStatus.Unavailable}>ไม่ว่าง (Unavailable)</Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 24, borderTop: '1px solid #F1F5F9', paddingTop: 24 }}>
                                        <Text strong style={{ fontSize: 18, color: '#1E293B', display: 'block', marginBottom: 16 }}>
                                            การตั้งค่าอื่นๆ
                                        </Text>

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
                            <TablePreview 
                                name={tableName} 
                            />
                        </div>
                    </div>
                </div>
                </PageSection>
            </PageContainer>
        </div>
    );
}

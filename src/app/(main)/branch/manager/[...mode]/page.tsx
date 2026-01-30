'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, Button, Spin, Switch, App, Row, Col } from 'antd';
import { useRouter } from 'next/navigation';
import { 
    ManagePageStyles, 
    pageStyles, 
    PageHeader 
} from './style';
import { branchService } from "../../../../../services/branch.service";
import { useAuth } from "../../../../../contexts/AuthContext";
import { getCsrfTokenCached } from '../../../../../utils/pos/csrf';

const { TextArea } = Input;

export default function BranchManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const { message, modal } = App.useApp();

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === 'edit' && !!id;

    // Fetch Branch Data if Edit
    const fetchBranch = useCallback(async () => {
        setLoading(true);
        try {
            const data = await branchService.getById(id!);
            form.setFieldsValue({
                branch_name: data.branch_name,
                branch_code: data.branch_code,
                address: data.address,
                phone: data.phone,
                tax_id: data.tax_id,
                is_active: data.is_active,
            });
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลสาขาได้');
            router.push('/branch');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (!authLoading && user) {
            if (user.role !== 'Admin') {
                router.push('/');
                return;
            }
            if (isEdit) {
                fetchBranch();
            }
        }
    }, [authLoading, user, isEdit, fetchBranch, router]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            const csrfToken = await getCsrfTokenCached();
            if (isEdit) {
                await branchService.update(id!, values, undefined, csrfToken);
                message.success('อัปเดตสาขาสำเร็จ');
            } else {
                await branchService.create(values, undefined, csrfToken);
                message.success('สร้างสาขาสำเร็จ');
            }
            router.push('/branch');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as Error).message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        modal.confirm({
            title: 'ยืนยันการลบสาขา',
            content: `คุณต้องการลบสาขานี้หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                try {
                    const csrfToken = await getCsrfTokenCached();
                    await branchService.delete(id, undefined, csrfToken);
                    message.success('ลบสาขาสำเร็จ');
                    router.push('/branch');
                } catch (error) {
                    message.error('ไม่สามารถลบสาขาได้');
                }
            },
        });
    };

    const handleBack = () => router.push('/branch');

    if (authLoading || (isEdit && loading)) {
         return (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fc' }}>
                 <Spin size="large" />
             </div>
         );
    }

    return (
        <div style={pageStyles.container}>
            <ManagePageStyles />
            
            {/* Header */}
            <PageHeader 
                isEdit={isEdit}
                onBack={handleBack}
                onDelete={isEdit ? handleDelete : undefined}
            />
            
            {/* Form */}
            <div className="manage-form-card" style={pageStyles.formCard}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    autoComplete="off"
                    initialValues={{ is_active: true }}
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="branch_name"
                                label="ชื่อสาขา *"
                                rules={[{ required: true, message: 'กรุณากรอกชื่อสาขา' }]}
                            >
                                <Input size="large" placeholder="ระบุชื่อสาขา" maxLength={100} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                             <Form.Item
                                name="branch_code"
                                label="รหัสสาขา *"
                                rules={[
                                    { required: true, message: 'กรุณากรอกรหัสสาขา' },
                                    { pattern: /^[A-Za-z0-9]+$/, message: 'รหัสสาขาต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข' }
                                ]}
                            >
                                <Input size="large" placeholder="เช่น B001" maxLength={20} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="address"
                        label="ที่อยู่"
                    >
                        <TextArea rows={3} placeholder="ที่อยู่สาขา" style={{ borderRadius: 12 }} />
                    </Form.Item>

                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="phone"
                                label="เบอร์โทรศัพท์"
                            >
                                <Input size="large" placeholder="02xxxxxxx" maxLength={20} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="tax_id"
                                label="เลขประจำตัวผู้เสียภาษี (Tax ID)"
                            >
                                <Input size="large" placeholder="ระบุเลขผู้เสียภาษี" maxLength={50} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="is_active"
                        label="สถานะ"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="เปิดใช้งาน" unCheckedChildren="ปิดปรับปรุง" />
                    </Form.Item>

                    <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <Button size="large" onClick={handleBack} style={{ borderRadius: 12, minWidth: 100 }}>
                            ยกเลิก
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={submitting} 
                            size="large"
                            style={{ 
                                borderRadius: 12, 
                                minWidth: 120,
                                background: '#7c3aed',
                                border: 'none'
                             }}
                        >
                            {isEdit ? 'บันทึกการแก้ไข' : 'สร้างสาขา'}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}

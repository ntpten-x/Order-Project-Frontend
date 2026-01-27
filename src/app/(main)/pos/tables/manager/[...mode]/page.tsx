'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Select, Switch, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { TableStatus } from '../../../../../../types/api/pos/tables';
import {
    ManagePageStyles,
    pageStyles,
    PageHeader,
    TablePreview,
    ActionButtons
} from './style';

import { authService } from '../../../../../../services/auth.service';
import { tablesService } from '../../../../../../services/pos/tables.service';

export default function TablesManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [tableName, setTableName] = useState<string>('');
    const [tableStatus, setTableStatus] = useState<string>('');
    const [csrfToken, setCsrfToken] = useState<string>("");

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === 'edit' && !!id;

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await authService.getCsrfToken();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchTable = useCallback(async () => {
        setLoading(true);
        try {
            if (!id) return;
            const data = await tablesService.getById(id);
            form.setFieldsValue({
                table_name: data.table_name,
                status: data.status,
                is_active: data.is_active,
            });
            setTableName(data.table_name || '');
            setTableStatus(data.status || '');
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลโต๊ะได้');
            router.push('/pos/tables');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchTable();
        }
    }, [isEdit, id, fetchTable]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                if (!id) throw new Error("ID not found");
                await tablesService.update(id, values, undefined, csrfToken);
                message.success('อัปเดตโต๊ะสำเร็จ');
            } else {
                await tablesService.create(values, undefined, csrfToken);
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
            onOk: async () => {
                try {
                    await tablesService.delete(id, undefined, csrfToken);
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

    return (
        <div className="manage-page" style={pageStyles.container}>
            <ManagePageStyles />
            
            {/* Header */}
            <PageHeader 
                isEdit={isEdit}
                onBack={handleBack}
                onDelete={isEdit ? handleDelete : undefined}
            />
            
            {/* Form Card */}
            <div className="manage-form-card" style={pageStyles.formCard}>
                {loading ? (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        padding: '60px 0' 
                    }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        autoComplete="off"
                        initialValues={{ is_active: true, status: TableStatus.Available }}
                        onValuesChange={(changedValues) => {
                            if (changedValues.table_name !== undefined) {
                                setTableName(changedValues.table_name);
                            }
                            if (changedValues.status !== undefined) {
                                setTableStatus(changedValues.status);
                            }
                        }}
                    >
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
                                placeholder="เช่น T1, A10, VIP1" 
                                maxLength={50}
                            />
                        </Form.Item>

                        <Form.Item
                            name="status"
                            label="สถานะโต๊ะ *"
                            rules={[{ required: true, message: 'กรุณาเลือกสถานะโต๊ะ' }]}
                        >
                            <Select 
                                size="large" 
                                placeholder="เลือกสถานะ"
                            >
                                <Select.Option value={TableStatus.Available}>
                                    ว่าง (Available)
                                </Select.Option>
                                <Select.Option value={TableStatus.Unavailable}>
                                    ไม่ว่าง (Unavailable)
                                </Select.Option>
                            </Select>
                        </Form.Item>

                        {/* Table Preview */}
                        <TablePreview name={tableName} status={tableStatus} />

                        <Form.Item
                            name="is_active"
                            label="สถานะการใช้งาน"
                            valuePropName="checked"
                            style={{ marginTop: 20 }}
                        >
                            <Switch 
                                checkedChildren="เปิดใช้งาน" 
                                unCheckedChildren="ปิดใช้งาน"
                            />
                        </Form.Item>

                        {/* Action Buttons */}
                        <ActionButtons 
                            isEdit={isEdit}
                            loading={submitting}
                            onCancel={handleBack}
                        />
                    </Form>
                )}
            </div>
        </div>
    );
}

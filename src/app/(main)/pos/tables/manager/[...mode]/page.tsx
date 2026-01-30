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

import { getCsrfTokenCached } from "@/utils/pos/csrf";
import { useRoleGuard } from "@/utils/pos/accessControl";
import { AccessGuardFallback } from "@/components/pos/AccessGuard";
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
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await getCsrfTokenCached();
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
            message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเนเธ•เนเธฐเนเธ”เน');
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
                message.success('เธญเธฑเธเน€เธ”เธ•เนเธ•เนเธฐเธชเธณเน€เธฃเนเธ');
            } else {
                await tablesService.create(values, undefined, csrfToken);
                message.success('เธชเธฃเนเธฒเธเนเธ•เนเธฐเธชเธณเน€เธฃเนเธ');
            }
            router.push('/pos/tables');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เนเธ•เนเธฐเนเธ”เน' : 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเนเธ•เนเธฐเนเธ”เน'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธเนเธ•เนเธฐ',
            content: `เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเนเธ•เนเธฐ "${tableName}" เธซเธฃเธทเธญเนเธกเน?`,
            okText: 'เธฅเธ',
            okType: 'danger',
            cancelText: 'เธขเธเน€เธฅเธดเธ',
            centered: true,
            onOk: async () => {
                try {
                    await tablesService.delete(id, undefined, csrfToken);
                    message.success('เธฅเธเนเธ•เนเธฐเธชเธณเน€เธฃเนเธ');
                    router.push('/pos/tables');
                } catch (error) {
                    console.error(error);
                    message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเนเธ•เนเธฐเนเธ”เน');
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
                            label="เธเธทเนเธญเนเธ•เนเธฐ *"
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเนเธ•เนเธฐ' },
                                { max: 50, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 50 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เน€เธเนเธ T1, A10, VIP1" 
                                maxLength={50}
                            />
                        </Form.Item>

                        <Form.Item
                            name="status"
                            label="เธชเธ–เธฒเธเธฐเนเธ•เนเธฐ *"
                            rules={[{ required: true, message: 'เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐเนเธ•เนเธฐ' }]}
                        >
                            <Select 
                                size="large" 
                                placeholder="เน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐ"
                            >
                                <Select.Option value={TableStatus.Available}>
                                    เธงเนเธฒเธ (Available)
                                </Select.Option>
                                <Select.Option value={TableStatus.Unavailable}>
                                    เนเธกเนเธงเนเธฒเธ (Unavailable)
                                </Select.Option>
                            </Select>
                        </Form.Item>

                        {/* Table Preview */}
                        <TablePreview name={tableName} status={tableStatus} />

                        <Form.Item
                            name="is_active"
                            label="เธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธเนเธเธฒเธ"
                            valuePropName="checked"
                            style={{ marginTop: 20 }}
                        >
                            <Switch 
                                checkedChildren="เน€เธเธดเธ”เนเธเนเธเธฒเธ" 
                                unCheckedChildren="เธเธดเธ”เนเธเนเธเธฒเธ"
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


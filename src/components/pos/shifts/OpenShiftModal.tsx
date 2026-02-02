"use client";

import React, { useState } from 'react';
import { Modal, InputNumber, Button, Typography, Form } from 'antd';
import { useShift } from '../../../contexts/pos/ShiftContext';
import { DollarOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';

const { Title, Text } = Typography;

export default function OpenShiftModal() {
    const { currentShift, loading, openShift } = useShift();
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const pathname = usePathname();

    // Show modal if not loading and no active shift
    // But don't show on the shift management page itself as it has its own UI
    const isVisible = !loading && !currentShift && pathname !== '/pos/shift';

    const handleOpenShift = async (values: { startAmount: number }) => {
        setSubmitting(true);
        try {
            await openShift(values.startAmount);
        } catch {
            // Error handled in context
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null; // Or return a spinner overlay?

    return (
        <Modal
            open={isVisible}
            title={null}
            centered
            closable={false}
            maskClosable={false}
            footer={null}
            width={400}
            className="soft-modal"
            styles={{ 
                body: { padding: 0, borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' } 
            }}
        >
            <div className="modal-header">
                <div className="icon-wrapper">
                    <DollarOutlined style={{ fontSize: 32, color: '#10b981' }} />
                </div>
                <Title level={3} style={{ margin: 0, color: '#1f1f1f', fontWeight: 700 }}>เปิดรอบการขาย</Title>
                <Text type="secondary" style={{ fontSize: 16 }}>Open Shift</Text>
            </div>

            <div style={{ padding: '0 32px 32px 32px' }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleOpenShift}
                    initialValues={{ startAmount: 0 }}
                >
                    <Form.Item
                        name="startAmount"
                        label={<span style={{ fontSize: 16, fontWeight: 500, color: '#4b5563' }}>ระบุเงินทอนเริ่มต้น (บาท)</span>}
                        rules={[{ required: true, message: 'กรุณาระบุจำนวนเงิน' }]}
                    >
                        <InputNumber<number>
                            style={{ width: '100%', height: '80px', borderRadius: 16, border: '2px solid #e5e7eb' }}
                            size="large"
                            min={0}
                            precision={2}
                            placeholder="0.00"
                            autoFocus
                            controls={false}
                            inputMode="decimal"
                            className="huge-input"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                            onKeyDown={(e) => {
                                if ([8, 46, 9, 27, 13, 190, 110].includes(e.keyCode) ||
                                    (e.ctrlKey === true || e.metaKey === true) ||
                                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                                    if ((e.keyCode === 190 || e.keyCode === 110) && ((e.target as HTMLInputElement).value?.includes('.') )) {
                                        e.preventDefault();
                                    }
                                    return;
                                }
                                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </Form.Item>

                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        block 
                        size="large" 
                        loading={submitting}
                        style={{ 
                            height: 56, 
                            borderRadius: 16, 
                            fontSize: 18, 
                            fontWeight: 600,
                            background: '#10b981',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                            border: 'none',
                            marginTop: 16
                        }}
                    >
                        ยืนยันเปิดกะ
                    </Button>
                </Form>
            </div>

            <style jsx global>{`
                .soft-modal .ant-modal-content {
                    padding: 0 !important;
                }
                .modal-header {
                    background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
                    padding: 40px 24px 24px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    text-align: center;
                }
                .icon-wrapper {
                    width: 72px;
                    height: 72px;
                    background: #d1fae5;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 8px;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
                }
                .huge-input input {
                    font-size: 36px !important;
                    font-weight: 700 !important;
                    text-align: center !important;
                    color: #10b981 !important;
                    height: 100% !important;
                }
                .huge-input:focus-within {
                    border-color: #10b981 !important;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important;
                }
            `}</style>
        </Modal>
    );
}

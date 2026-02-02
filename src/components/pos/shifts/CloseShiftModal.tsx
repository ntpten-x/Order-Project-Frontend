"use client";

import React, { useState } from 'react';
import { Modal, InputNumber, Button, Typography, Form, Descriptions } from 'antd';
import { useShift } from '../../../contexts/pos/ShiftContext';
import { DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface CloseShiftModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess?: () => void;
}

export default function CloseShiftModal({ open, onCancel, onSuccess }: CloseShiftModalProps) {
    const { currentShift, closeShift } = useShift();
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const handleCloseShift = async (values: { endAmount: number }) => {
        setSubmitting(true);
        try {
            await closeShift(values.endAmount);
            onCancel();
            form.resetFields();
            if (onSuccess) onSuccess();
        } catch {
            // Error handled in context
        } finally {
            setSubmitting(false);
        }
    };

    if (!currentShift) return null;

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title={null}
            centered
            footer={null}
            width={480}
            className="soft-modal"
            styles={{ 
                body: { padding: 0, borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' },
                mask: { backdropFilter: 'blur(5px)' }
            }}
        >
             <div className="modal-header-close">
                <div className="icon-wrapper-close">
                    <DollarOutlined style={{ fontSize: 32, color: '#ef4444' }} />
                </div>
                <Title level={3} style={{ margin: 0, color: '#1f1f1f', fontWeight: 700 }}>ปิดรอบการขาย</Title>
                <Text type="secondary" style={{ fontSize: 16 }}>Close Shift</Text>
            </div>

            <div style={{ padding: '0 32px 32px 32px' }}>
                <div className="info-card">
                    <div className="info-row">
                        <Text type="secondary">เวลาเปิดกะ</Text>
                        <Text strong>{dayjs(currentShift.open_time).format('DD/MM/YYYY HH:mm')}</Text>
                    </div>
                    <div className="info-divider" />
                    <div className="info-row">
                        <Text type="secondary">เงินทอนเริ่มต้น</Text>
                        <Text strong>{Number(currentShift.start_amount).toLocaleString()} บาท</Text>
                    </div>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCloseShift}
                >
                    <Form.Item
                        name="endAmount"
                        label={<span style={{ fontSize: 16, fontWeight: 500, color: '#4b5563' }}>ยอดเงินสดที่นับได้ (Cash Counted)</span>}
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
                            className="huge-input-close"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                            onKeyDown={(e) => {
                                if ([8, 46, 9, 27, 13, 190, 110].includes(e.keyCode) ||
                                    (e.ctrlKey === true || e.metaKey === true) ||
                                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                                    if ((e.keyCode === 190 || e.keyCode === 110) && (e.currentTarget.value.includes('.') )) {
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

                    <div className="flex gap-4" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <Button 
                            block 
                            size="large" 
                            onClick={onCancel} 
                            disabled={submitting}
                            style={{ 
                                height: 56, 
                                borderRadius: 16, 
                                fontSize: 16, 
                                fontWeight: 600,
                                background: '#f3f4f6',
                                border: 'none',
                                color: '#4b5563'
                            }}
                        >
                            ยกเลิก
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            block 
                            size="large" 
                            loading={submitting}
                            style={{ 
                                height: 56, 
                                borderRadius: 16, 
                                fontSize: 16, 
                                fontWeight: 600,
                                background: '#ef4444',
                                border: 'none',
                                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                            }}
                        >
                            ยืนยันปิดกะ
                        </Button>
                    </div>
                </Form>
            </div>

            <style jsx global>{`
                .modal-header-close {
                    background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%);
                    padding: 32px 24px 24px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    text-align: center;
                }
                .icon-wrapper-close {
                    width: 64px;
                    height: 64px;
                    background: #fee2e2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 8px;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
                }
                .info-card {
                    background: #f8fafc;
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 24px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .info-divider {
                    height: 1px;
                    background: #e2e8f0;
                    margin: 12px 0;
                }
                .huge-input-close input {
                    font-size: 36px !important;
                    font-weight: 700 !important;
                    text-align: center !important;
                    color: #ef4444 !important;
                    height: 100% !important;
                }
                .huge-input-close:focus-within {
                    border-color: #ef4444 !important;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
                }
            `}</style>
        </Modal>
    );
}

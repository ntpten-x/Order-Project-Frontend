
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
            title={
                <div className="text-center">
                    <Title level={3} style={{ marginBottom: 0 }}>เปิดกะการขาย (Open Shift)</Title>
                    <Text type="secondary">กรุณาระบุเงินทอนเริ่มต้น</Text>
                </div>
            }
            centered
            closable={false}
            maskClosable={false}
            footer={null}
            styles={{ body: { padding: '20px 0' } }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleOpenShift}
                initialValues={{ startAmount: 0 }}
            >
                <Form.Item
                    name="startAmount"
                    label="เงินทอนเริ่มต้น (บาท)"
                    rules={[{ required: true, message: 'กรุณาระบุจำนวนเงิน' }]}
                >
                    <InputNumber<number>
                        style={{ width: '100%', fontSize: '24px', height: '60px', display: 'flex', alignItems: 'center' }}
                        size="large"
                        prefix={<DollarOutlined style={{ fontSize: '24px' }} />}
                        min={0}
                        precision={2}
                        placeholder="0.00"
                        autoFocus
                        controls={false}
                        inputMode="decimal"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                        onKeyDown={(e) => {
                            // Allow: backspace, delete, tab, escape, enter, .
                            if ([8, 46, 9, 27, 13, 190, 110].includes(e.keyCode) ||
                                // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                (e.ctrlKey === true || e.metaKey === true) ||
                                // Allow: home, end, left, right
                                (e.keyCode >= 35 && e.keyCode <= 39)) {
                                
                                // Prevent multiple dots
                                if ((e.keyCode === 190 || e.keyCode === 110) && (e.currentTarget.value.includes('.') )) {
                                    e.preventDefault();
                                }
                                return;
                            }
                            // Block any character that is not a number
                            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                e.preventDefault();
                            }
                        }}
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        block 
                        size="large" 
                        loading={submitting}
                        className="bg-emerald-500 hover:bg-emerald-600 border-none h-12 text-lg"
                    >
                        ยืนยันเปิดกะ
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}

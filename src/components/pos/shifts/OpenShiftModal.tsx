
import React, { useState } from 'react';
import { Modal, InputNumber, Button, Typography, Form } from 'antd';
import { useShift } from '../../../contexts/pos/ShiftContext';
import { DollarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function OpenShiftModal() {
    const { currentShift, loading, openShift } = useShift();
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    // Show modal if not loading and no active shift
    const isVisible = !loading && !currentShift;

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
                    <InputNumber
                        style={{ width: '100%' }}
                        size="large"
                        prefix={<DollarOutlined />}
                        min={0}
                        precision={2}
                        placeholder="0.00"
                        autoFocus
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

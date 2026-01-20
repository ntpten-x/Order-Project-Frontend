
import React, { useState } from 'react';
import { Modal, InputNumber, Button, Typography, Form, Descriptions } from 'antd';
import { useShift } from '../../../contexts/pos/ShiftContext';
import { DollarOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface CloseShiftModalProps {
    open: boolean;
    onCancel: () => void;
}

export default function CloseShiftModal({ open, onCancel }: CloseShiftModalProps) {
    const { currentShift, closeShift } = useShift();
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const handleCloseShift = async (values: { endAmount: number }) => {
        setSubmitting(true);
        try {
            await closeShift(values.endAmount);
            onCancel();
            form.resetFields();
        } catch (error) {
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
            title={
                <div className="text-center">
                    <Title level={3} style={{ marginBottom: 0 }}>ปิดกะการขาย (Close Shift)</Title>
                    <Text type="secondary">กรุณานับเงินในลิ้นชักและระบุยอดที่นับได้</Text>
                </div>
            }
            centered
            footer={null}
        >
            <Descriptions column={1} bordered className="mb-6">
                <Descriptions.Item label="เวลาเปิดกะ">{dayjs(currentShift.open_time).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                <Descriptions.Item label="เงินทอนเริ่มต้น">{Number(currentShift.start_amount).toLocaleString()} บาท</Descriptions.Item>
            </Descriptions>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleCloseShift}
            >
                <Form.Item
                    name="endAmount"
                    label="ยอดเงินที่นับได้จริง (Cash Counted)"
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

                <div className="flex gap-4">
                    <Button block size="large" onClick={onCancel} disabled={submitting}>
                        ยกเลิก
                    </Button>
                    <Button 
                        type="primary" 
                        danger
                        htmlType="submit" 
                        block 
                        size="large" 
                        loading={submitting}
                    >
                        ยืนยันปิดกะ
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}

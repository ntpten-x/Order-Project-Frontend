"use client";

import React, { useState } from 'react';
import { Input, Button, message, Tag, Space, Typography } from 'antd';
import { GiftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { usePromotions } from '../../hooks/pos/usePromotions';
import { useCart } from '../../contexts/pos/CartContext';
import { PromotionEligibility } from '../../types/api/pos/promotions';

const { Text } = Typography;

interface PromotionCodeInputProps {
    onApply?: (eligibility: PromotionEligibility) => void;
    onRemove?: () => void;
    appliedPromotion?: PromotionEligibility | null;
}

export default function PromotionCodeInput({
    onApply,
    onRemove,
    appliedPromotion,
}: PromotionCodeInputProps) {
    const [code, setCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const { validatePromotion } = usePromotions();
    const { cartItems, getSubtotal, orderMode } = useCart();

    const handleValidate = async () => {
        if (!code.trim()) {
            message.warning('กรุณากรอกรหัสโปรโมชัน');
            return;
        }

        setIsValidating(true);
        try {
            const orderItems = cartItems.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                price:
                    orderMode === 'DELIVERY'
                        ? Number(item.product.price_delivery ?? item.product.price)
                        : Number(item.product.price),
            }));

            const eligibility = await validatePromotion({
                code: code.trim(),
                orderItems,
                totalAmount: getSubtotal(),
            });

            if (eligibility.eligible) {
                message.success(`ใช้โปรโมชันได้! ลด ${eligibility.discountAmount.toFixed(2)} บาท`);
                onApply?.(eligibility);
                setCode('');
            } else {
                message.error(eligibility.message || 'ไม่สามารถใช้โปรโมชันนี้ได้');
            }
        } catch (error: unknown) {
            message.error((error as Error).message || 'ไม่สามารถตรวจสอบโปรโมชันได้');
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemove = () => {
        setCode('');
        onRemove?.();
    };

    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
                <Text strong>รหัสโปรโมชัน</Text>
            </div>
            {appliedPromotion && appliedPromotion.eligible ? (
                <div style={{
                    padding: 12,
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text>ใช้โปรโมชันแล้ว</Text>
                        <Tag color="success">
                            ลด {appliedPromotion.discountAmount.toFixed(2)} บาท
                        </Tag>
                    </Space>
                    <Button
                        type="link"
                        danger
                        size="small"
                        onClick={handleRemove}
                    >
                        <CloseCircleOutlined /> ลบ
                    </Button>
                </div>
            ) : (
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        placeholder="กรอกรหัสโปรโมชัน"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onPressEnter={handleValidate}
                        prefix={<GiftOutlined style={{ color: '#f5576c' }} />}
                        style={{ borderRadius: '8px 0 0 8px' }}
                    />
                    <Button
                        type="primary"
                        onClick={handleValidate}
                        loading={isValidating}
                        style={{ borderRadius: '0 8px 8px 0' }}
                    >
                        ใช้
                    </Button>
                </Space.Compact>
            )}
        </div>
    );
}

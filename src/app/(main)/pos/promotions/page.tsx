"use client";

import React, { useState } from 'react';
import { Typography, Tag, Button, Empty, Input, Card, Space, Badge } from 'antd';
import {
    GiftOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    CalendarOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { usePromotions } from '../../../../hooks/pos/usePromotions';
import { PromotionType } from '../../../../types/api/pos/promotions';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import { useDebouncedValue } from '../../../../utils/useDebouncedValue';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

const { Text, Title } = Typography;
dayjs.locale('th');

const promotionTypeLabels: Record<PromotionType, string> = {
    [PromotionType.BuyXGetY]: 'ซื้อ X แถม Y',
    [PromotionType.PercentageOff]: 'ลดเปอร์เซ็นต์',
    [PromotionType.FixedAmountOff]: 'ลดจำนวนเงิน',
    [PromotionType.FreeShipping]: 'ฟรีค่าจัดส่ง',
    [PromotionType.Bundle]: 'ชุดโปรโมชัน',
    [PromotionType.MinimumPurchase]: 'ซื้อขั้นต่ำ',
};

export default function PromotionsPage() {
    const router = useRouter();
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearch = useDebouncedValue(searchValue.trim(), 400);
    const { promotions, isLoading, refetch } = usePromotions();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });

    const filteredPromotions = promotions.filter(p => {
        if (!debouncedSearch) return true;
        const search = debouncedSearch.toLowerCase();
        return (
            p.name.toLowerCase().includes(search) ||
            p.promotion_code.toLowerCase().includes(search) ||
            (p.description && p.description.toLowerCase().includes(search))
        );
    });

    const activePromotions = filteredPromotions.filter(p => p.is_active);
    const expiredPromotions = filteredPromotions.filter(p => {
        if (!p.end_date) return false;
        return dayjs(p.end_date).isBefore(dayjs());
    });

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: 20,
                padding: '32px 24px',
                marginBottom: 24,
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <GiftOutlined style={{ fontSize: 28, color: 'white' }} />
                        </div>
                        <div>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, display: 'block' }}>
                                จัดการโปรโมชัน
                            </Text>
                            <Title level={3} style={{ color: 'white', margin: 0, fontWeight: 700 }}>
                                Promotions
                            </Title>
                        </div>
                    </div>
                    <Space>
                        <Input
                            allowClear
                            placeholder="ค้นหาโปรโมชัน..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            style={{ width: 240, borderRadius: 10 }}
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => refetch()}
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => router.push('/pos/promotions/manager/add')}
                            style={{ background: 'white', color: '#f5576c' }}
                        >
                            เพิ่มโปรโมชัน
                        </Button>
                    </Space>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <Card>
                    <div style={{ textAlign: 'center' }}>
                        <Badge count={filteredPromotions.length} showZero>
                            <GiftOutlined style={{ fontSize: 32, color: '#f5576c' }} />
                        </Badge>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">ทั้งหมด</Text>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ textAlign: 'center' }}>
                        <Badge count={activePromotions.length} showZero>
                            <CheckCircleFilled style={{ fontSize: 32, color: '#52c41a' }} />
                        </Badge>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">เปิดใช้งาน</Text>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ textAlign: 'center' }}>
                        <Badge count={expiredPromotions.length} showZero>
                            <CloseCircleFilled style={{ fontSize: 32, color: '#ff4d4f' }} />
                        </Badge>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">หมดอายุ</Text>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Promotions List */}
            {isLoading ? (
                <Card loading={true} />
            ) : filteredPromotions.length === 0 ? (
                <Card>
                    <Empty description="ยังไม่มีโปรโมชัน" />
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
                    {filteredPromotions.map((promotion) => {
                        const isExpired = promotion.end_date && dayjs(promotion.end_date).isBefore(dayjs());
                        const isActive = promotion.is_active && !isExpired;

                        return (
                            <Card
                                key={promotion.id}
                                style={{
                                    borderRadius: 12,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    border: isActive ? '2px solid #52c41a' : '1px solid #f0f0f0',
                                }}
                                actions={[
                                    <Button
                                        key="edit"
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => router.push(`/pos/promotions/manager/edit/${promotion.id}`)}
                                    >
                                        แก้ไข
                                    </Button>,
                                ]}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                                <Text strong style={{ fontSize: 16 }}>
                                                    {promotion.name}
                                                </Text>
                                                {isActive ? (
                                                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                                                ) : (
                                                    <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                                                )}
                                            </div>
                                            <Tag color="purple" style={{ marginBottom: 8 }}>
                                                {promotion.promotion_code}
                                            </Tag>
                                            <Tag color={isActive ? 'success' : 'default'}>
                                                {promotionTypeLabels[promotion.promotion_type]}
                                            </Tag>
                                        </div>
                                    </div>

                                    {promotion.description && (
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                            {promotion.description}
                                        </Text>
                                    )}

                                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#8c8c8c', marginTop: 12 }}>
                                        {promotion.start_date && (
                                            <div>
                                                <CalendarOutlined /> เริ่ม: {dayjs(promotion.start_date).format('DD/MM/YYYY')}
                                            </div>
                                        )}
                                        {promotion.end_date && (
                                            <div>
                                                <CalendarOutlined /> สิ้นสุด: {dayjs(promotion.end_date).format('DD/MM/YYYY')}
                                            </div>
                                        )}
                                    </div>

                                    {promotion.usage_limit && (
                                        <div style={{ marginTop: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                ใช้แล้ว: {promotion.usage_count || 0} / {promotion.usage_limit}
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

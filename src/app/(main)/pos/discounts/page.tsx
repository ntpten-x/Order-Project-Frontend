'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Tag, Button, Input, Card, Space } from 'antd';
import { 
    PercentageOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    StopOutlined,
    DollarOutlined,
    SearchOutlined,
    GiftOutlined
} from '@ant-design/icons';
import { Discounts, DiscountType } from "../../../../types/api/pos/discounts";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { pageStyles, globalStyles } from '../../../../theme/pos/discounts/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from "../../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import UIEmptyState from "../../../../components/ui/states/EmptyState";

const { Text, Title } = Typography;

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    total: number;
    fixed: number;
    percent: number;
    active: number;
    inactive: number;
}

const StatsCard = ({ total, fixed, percent, active, inactive }: StatsCardProps) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div style={{ 
            background: 'white', 
            padding: '12px 14px', 
            borderRadius: 16, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            border: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: 10
        }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <GiftOutlined style={{ fontSize: 20, color: '#F59E0B' }} />
            </div>
            <div style={{ minWidth: 0 }}>
                <Text style={{ color: '#64748B', display: 'block', fontSize: 11 }}>ทั้งหมด</Text>
                <Title level={4} style={{ margin: 0, color: '#1E293B', fontWeight: 700, fontSize: 18 }}>{total}</Title>
            </div>
        </div>

        <div style={{ 
            background: 'white', 
            padding: '12px 14px', 
            borderRadius: 16, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            border: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: 10
        }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarOutlined style={{ fontSize: 20, color: '#0EA5E9' }} />
            </div>
            <div style={{ minWidth: 0 }}>
                <Text style={{ color: '#64748B', display: 'block', fontSize: 11 }}>แบบบาท</Text>
                <Title level={4} style={{ margin: 0, color: '#1E293B', fontWeight: 700, fontSize: 18 }}>{fixed}</Title>
            </div>
        </div>

        <div style={{ 
            background: 'white', 
            padding: '12px 14px', 
            borderRadius: 16, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            border: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: 10
        }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PercentageOutlined style={{ fontSize: 20, color: '#8B5CF6' }} />
            </div>
            <div style={{ minWidth: 0 }}>
                <Text style={{ color: '#64748B', display: 'block', fontSize: 11 }}>แบบ %</Text>
                <Title level={4} style={{ margin: 0, color: '#1E293B', fontWeight: 700, fontSize: 18 }}>{percent}</Title>
            </div>
        </div>

        <div style={{ 
            background: 'white', 
            padding: '12px 14px', 
            borderRadius: 16, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            border: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: 10
        }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircleFilled style={{ fontSize: 20, color: '#10B981' }} />
            </div>
            <div style={{ minWidth: 0 }}>
                <Text style={{ color: '#64748B', display: 'block', fontSize: 11 }}>ใช้งาน</Text>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <Title level={4} style={{ margin: 0, color: '#1E293B', fontWeight: 700, fontSize: 18 }}>{active}</Title>
                    {inactive > 0 && <Text type="secondary" style={{ fontSize: 11 }}>(ปิด {inactive})</Text>}
                </div>
            </div>
        </div>
    </div>
);

// ============ DISCOUNT CARD COMPONENT ============

interface DiscountCardProps {
    discount: Discounts;
    onEdit: (discount: Discounts) => void;
    onDelete: (discount: Discounts) => void;
}

const DiscountCard = React.memo(({ discount, onEdit, onDelete }: DiscountCardProps) => {
    const isFixed = discount.discount_type === DiscountType.Fixed;
    
    return (
        <Card
            hoverable
            onClick={() => onEdit(discount)}
            style={{ 
                borderRadius: 20, 
                border: 'none', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s',
                overflow: 'hidden',
                background: 'white',
                opacity: discount.is_active ? 1 : 0.7
            }}
            styles={{ body: { padding: 16 } }}
        >
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: isFixed 
                        ? 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)'
                        : 'linear-gradient(135deg, #F3E8FF 0%, #D8B4FE 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isFixed ? '0 4px 12px rgba(14, 165, 233, 0.2)' : '0 4px 12px rgba(139, 92, 246, 0.2)'
                }}>
                    {isFixed ? (
                        <DollarOutlined style={{ fontSize: 24, color: '#0369A1' }} />
                    ) : (
                        <PercentageOutlined style={{ fontSize: 24, color: '#7E22CE' }} />
                    )}
                </div>
                <div style={{ 
                    padding: '4px 10px', 
                    borderRadius: 20, 
                    background: discount.is_active ? '#ECFDF5' : '#F1F5F9',
                    color: discount.is_active ? '#059669' : '#64748B',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                }}>
                    {discount.is_active ? <CheckCircleFilled /> : <StopOutlined />}
                    {discount.is_active ? 'Active' : 'Inactive'}
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0, marginBottom: 4, color: '#1E293B' }} ellipsis>
                    {discount.display_name}
                </Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>Code:</Text>
                    <Tag style={{ margin: 0, borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                        {discount.discount_name}
                    </Tag>
                </div>
            </div>

            <div style={{ 
                background: '#F8FAFC', 
                borderRadius: 12, 
                padding: '10px 12px', 
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                    มูลค่าส่วนลด
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>
                    {isFixed ? `฿${discount.discount_amount.toLocaleString()}` : `${discount.discount_amount}% OFF`}
                </Text>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    block
                    onClick={(e) => { e.stopPropagation(); onEdit(discount); }}
                    style={{ 
                        borderRadius: 10, 
                        background: '#FFF7ED', 
                        color: '#F59E0B',
                        fontWeight: 600
                    }}
                >
                    แก้ไข
                </Button>
                <Button 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    onClick={(e) => { e.stopPropagation(); onDelete(discount); }}
                    style={{ 
                        borderRadius: 10, 
                        background: '#FEF2F2', 
                        color: '#EF4444'
                    }}
                />
            </div>
        </Card>
    );
});
DiscountCard.displayName = 'DiscountCard';

export default function POSDiscountsPage() {
    return <POSDiscountsContent />;
}

function POSDiscountsContent() {
    const router = useRouter();
    const [discounts, setDiscounts] = useState<Discounts[]>([]);
    const [filteredDiscounts, setFilteredDiscounts] = useState<Discounts[]>([]);
    const [searchValue, setSearchValue] = useState("");
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ["Admin", "Manager"] });


    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    const fetchDiscounts = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/discounts');
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลส่วนลดได้');
            const data = await response.json();
            setDiscounts(data);
            setFilteredDiscounts(data);
        }, 'กำลังโหลดข้อมูลส่วนลด...');
    }, [execute]);

    useEffect(() => {
        if (isAuthorized) {
            fetchDiscounts();
        }
    }, [isAuthorized, fetchDiscounts]);

    // Client-side filtering
    useEffect(() => {
        if (searchValue.trim()) {
            const lower = searchValue.trim().toLowerCase();
            const filtered = discounts.filter(d => 
                d.display_name?.toLowerCase().includes(lower) || 
                d.discount_name?.toLowerCase().includes(lower) ||
                d.description?.toLowerCase().includes(lower)
            );
            setFilteredDiscounts(filtered);
        } else {
            setFilteredDiscounts(discounts);
        }
    }, [searchValue, discounts]);

    useRealtimeList(
        socket,
        { create: RealtimeEvents.discounts.create, update: RealtimeEvents.discounts.update, delete: RealtimeEvents.discounts.delete },
        setDiscounts
    );

    const handleAdd = () => {
        showLoading("กำลังเปิดหน้าจัดการส่วนลด...");
        router.push('/pos/discounts/manager/add');
    };

    const handleEdit = (discount: Discounts) => {
        showLoading("กำลังเปิดหน้าแก้ไขส่วนลด...");
        router.push(`/pos/discounts/manager/edit/${discount.id}`);
    };

    const handleDelete = (discount: Discounts) => {
        Modal.confirm({
            title: 'ยืนยันการลบส่วนลด',
            content: `คุณต้องการลบส่วนลด "${discount.display_name || discount.discount_name}" หรือไม่?`,
            okText: 'ลบรายการ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            styles: { body: { borderRadius: 16 } },
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/discounts/delete/${discount.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบส่วนลดได้');
                    message.success('ลบส่วนลดสำเร็จ');
                }, "กำลังลบส่วนลด...");
            },
        });
    };

    if (isChecking) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;

    const activeDiscounts = discounts.filter(d => d.is_active);
    const inactiveDiscounts = discounts.filter(d => !d.is_active);
    const fixedDiscounts = discounts.filter(d => d.discount_type === DiscountType.Fixed);
    const percentageDiscounts = discounts.filter(d => d.discount_type === DiscountType.Percentage);

    return (
        <div className="discount-page px-4 md:px-6" style={{ ...pageStyles.container, paddingTop: 16, paddingBottom: 24, background: '#F8FAFC', minHeight: '100vh' }}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="ส่วนลด"
                subtitle={`${discounts.length} รายการ`}
                icon={<PercentageOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            allowClear
                            placeholder="ค้นหา..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            style={{ minWidth: 200 }}
                        />
                        <Button icon={<ReloadOutlined />} onClick={fetchDiscounts} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            เพิ่มส่วนลด
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsCard
                        total={discounts.length}
                        fixed={fixedDiscounts.length}
                        percent={percentageDiscounts.length}
                        active={activeDiscounts.length}
                        inactive={inactiveDiscounts.length}
                    />

                    <PageSection title="รายการส่วนลด">
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: 16,
                        }}>
                            {filteredDiscounts.length > 0 ? (
                                filteredDiscounts.map((discount) => (
                                    <DiscountCard
                                        key={discount.id}
                                        discount={discount}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))
                            ) : (
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <UIEmptyState
                                        title={
                                            searchValue.trim()
                                                ? "ไม่พบส่วนลดที่ค้นหา"
                                                : "ยังไม่มีรายการส่วนลด"
                                        }
                                        description={
                                            searchValue.trim()
                                                ? "ลองเปลี่ยนคำค้นหาใหม่"
                                                : "เพิ่มส่วนลดแรกเพื่อเริ่มใช้งาน"
                                        }
                                        action={
                                            !searchValue.trim() ? (
                                                <Button
                                                    type="primary"
                                                    icon={<PlusOutlined />}
                                                    onClick={handleAdd}
                                                >
                                                    เพิ่มส่วนลด
                                                </Button>
                                            ) : null
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}

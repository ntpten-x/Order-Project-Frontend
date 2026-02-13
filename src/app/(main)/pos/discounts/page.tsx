'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Input, Space, Segmented, Tag, Switch } from 'antd';
import {
    PercentageOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { Discounts, DiscountType } from '../../../../types/api/pos/discounts';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useRealtimeList } from '../../../../utils/pos/realtime';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { pageStyles, globalStyles } from '../../../../theme/pos/discounts/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type TypeFilter = 'all' | DiscountType.Fixed | DiscountType.Percentage;

interface StatsCardProps {
    total: number;
    active: number;
    inactive: number;
    fixed: number;
    percentage: number;
}

interface DiscountCardProps {
    discount: Discounts;
    onEdit: (discount: Discounts) => void;
    onDelete: (discount: Discounts) => void;
    onToggleActive: (discount: Discounts, next: boolean) => void;
    updatingStatusId: string | null;
}

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

const formatDiscountValue = (discount: Discounts) => {
    const amount = Number(discount.discount_amount || 0);
    if (discount.discount_type === DiscountType.Percentage) {
        return `${amount}%`;
    }
    return `${amount.toLocaleString('th-TH')} บาท`;
};

const StatsCard = ({ total, active, inactive, fixed, percentage }: StatsCardProps) => (
    <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 8,
        padding: 14
    }}>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', display: 'block' }}>{total}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ทั้งหมด</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#d97706', display: 'block' }}>{active}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ใช้งาน</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c', display: 'block' }}>{inactive}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ปิดใช้งาน</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0369a1', display: 'block' }}>{fixed}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ลดเป็นบาท</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#7e22ce', display: 'block' }}>{percentage}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ลดเปอร์เซ็นต์</Text>
        </div>
    </div>
);

const DiscountCard = ({ discount, onEdit, onDelete, onToggleActive, updatingStatusId }: DiscountCardProps) => {
    const isFixed = discount.discount_type === DiscountType.Fixed;

    return (
        <div
            className="discount-card"
            style={{
                ...pageStyles.discountCard(discount.is_active),
                borderRadius: 16,
            }}
            onClick={() => onEdit(discount)}
        >
            <div style={pageStyles.discountCardInner}>
                <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: isFixed
                        ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                        : 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isFixed
                        ? '0 4px 10px rgba(3, 105, 161, 0.18)'
                        : '0 4px 10px rgba(126, 34, 206, 0.18)'
                }}>
                    {isFixed ? (
                        <DollarOutlined style={{ fontSize: 22, color: '#0369a1' }} />
                    ) : (
                        <PercentageOutlined style={{ fontSize: 22, color: '#7e22ce' }} />
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text
                            strong
                            style={{
                                fontSize: 16,
                                color: '#0f172a'
                            }}
                            ellipsis={{ tooltip: discount.display_name }}
                        >
                            {discount.display_name}
                        </Text>
                        <Tag color={discount.is_active ? 'green' : 'default'}>
                            {discount.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <Text
                        type="secondary"
                        style={{ fontSize: 13, display: 'block', color: '#334155' }}
                        ellipsis={{ tooltip: discount.discount_name }}
                    >
                        {discount.discount_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                        มูลค่าส่วนลด {formatDiscountValue(discount)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                        สร้างเมื่อ {formatDate(discount.create_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={discount.is_active}
                        loading={updatingStatusId === discount.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            onToggleActive(discount, checked);
                        }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(discount);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#d97706',
                            background: '#fff7ed',
                            width: 36,
                            height: 36
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(discount);
                        }}
                        style={{
                            borderRadius: 10,
                            background: '#fef2f2',
                            width: 36,
                            height: 36
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default function DiscountsPage() {
    const router = useRouter();
    const [discounts, setDiscounts] = useState<Discounts[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const cached = readCache<Discounts[]>('pos:discounts', 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setDiscounts(cached);
        }
    }, []);

    const fetchDiscounts = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/discounts');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลส่วนลดได้');
            }
            const payload = await response.json();
            const data = Array.isArray(payload) ? payload : payload?.data;
            if (!Array.isArray(data)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
            setDiscounts(data);
        }, 'กำลังโหลดข้อมูลส่วนลด...');
    }, [execute]);

    useEffect(() => {
        if (isAuthorized) {
            fetchDiscounts();
        }
    }, [isAuthorized, fetchDiscounts]);

    useRealtimeList(
        socket,
        { create: RealtimeEvents.discounts.create, update: RealtimeEvents.discounts.update, delete: RealtimeEvents.discounts.delete },
        setDiscounts
    );

    useEffect(() => {
        if (discounts.length > 0) {
            writeCache('pos:discounts', discounts);
        }
    }, [discounts]);

    const filteredDiscounts = useMemo(() => {
        let result = discounts;

        if (statusFilter === 'active') {
            result = result.filter((item) => item.is_active);
        } else if (statusFilter === 'inactive') {
            result = result.filter((item) => !item.is_active);
        }

        if (typeFilter !== 'all') {
            result = result.filter((item) => item.discount_type === typeFilter);
        }

        const keyword = searchText.trim().toLowerCase();
        if (keyword) {
            result = result.filter((item) =>
                item.display_name.toLowerCase().includes(keyword) ||
                item.discount_name.toLowerCase().includes(keyword) ||
                (item.description || '').toLowerCase().includes(keyword)
            );
        }

        return result;
    }, [discounts, searchText, statusFilter, typeFilter]);

    const handleAdd = () => {
        showLoading('กำลังเปิดหน้าจัดการส่วนลด...');
        router.push('/pos/discounts/manager/add');
    };

    const handleEdit = (discount: Discounts) => {
        showLoading('กำลังเปิดหน้าแก้ไขส่วนลด...');
        router.push(`/pos/discounts/manager/edit/${discount.id}`);
    };

    const handleDelete = (discount: Discounts) => {
        Modal.confirm({
            title: 'ยืนยันการลบส่วนลด',
            content: `คุณต้องการลบส่วนลด "${discount.display_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/discounts/delete/${discount.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบส่วนลดได้');
                    }
                    setDiscounts((prev) => prev.filter((item) => item.id !== discount.id));
                    message.success(`ลบส่วนลด "${discount.display_name}" สำเร็จ`);
                }, 'กำลังลบส่วนลด...');
            },
        });
    };

    const handleToggleActive = async (discount: Discounts, next: boolean) => {
        setUpdatingStatusId(discount.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/discounts/update/${discount.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ is_active: next })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะส่วนลดได้');
            }

            const updated = await response.json();
            setDiscounts((prev) => prev.map((item) => item.id === discount.id ? updated : item));
            message.success(next ? 'เปิดใช้งานส่วนลดแล้ว' : 'ปิดใช้งานส่วนลดแล้ว');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะส่วนลดได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    const activeCount = discounts.filter((d) => d.is_active).length;
    const inactiveCount = discounts.filter((d) => !d.is_active).length;
    const fixedCount = discounts.filter((d) => d.discount_type === DiscountType.Fixed).length;
    const percentageCount = discounts.filter((d) => d.discount_type === DiscountType.Percentage).length;

    return (
        <div className="discount-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="ส่วนลด"
                subtitle={`ทั้งหมด ${discounts.length} รายการ`}
                icon={<PercentageOutlined />}
                actions={
                    <Space size={8} wrap>
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
                        active={activeCount}
                        inactive={inactiveCount}
                        fixed={fixedCount}
                        percentage={percentageCount}
                    />

                    <PageSection title="ค้นหาและตัวกรอง">
                        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr', alignItems: 'center' }}>
                            <Input
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                allowClear
                                placeholder="ค้นหาจากชื่อแสดง ชื่อระบบ หรือคำอธิบาย..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <Segmented<StatusFilter>
                                options={[
                                    { label: `ทั้งหมด (${discounts.length})`, value: 'all' },
                                    { label: `ใช้งาน (${activeCount})`, value: 'active' },
                                    { label: `ปิดใช้งาน (${inactiveCount})`, value: 'inactive' }
                                ]}
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value)}
                            />
                            <Segmented<TypeFilter>
                                options={[
                                    { label: `ทุกประเภท (${discounts.length})`, value: 'all' },
                                    { label: `ลดเป็นบาท (${fixedCount})`, value: DiscountType.Fixed },
                                    { label: `ลด % (${percentageCount})`, value: DiscountType.Percentage }
                                ]}
                                value={typeFilter}
                                onChange={(value) => setTypeFilter(value)}
                            />
                        </div>
                    </PageSection>

                    <PageSection
                        title="รายการส่วนลด"
                        extra={<span style={{ fontWeight: 600 }}>{filteredDiscounts.length}</span>}
                    >
                        {filteredDiscounts.length > 0 ? (
                            filteredDiscounts.map((discount) => (
                                <DiscountCard
                                    key={discount.id}
                                    discount={discount}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleActive={handleToggleActive}
                                    updatingStatusId={updatingStatusId}
                                />
                            ))
                        ) : (
                            <UIEmptyState
                                title={
                                    searchText.trim()
                                        ? 'ไม่พบส่วนลดตามคำค้น'
                                        : 'ยังไม่มีส่วนลด'
                                }
                                description={
                                    searchText.trim()
                                        ? 'ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ/ประเภท'
                                        : 'เพิ่มส่วนลดแรกเพื่อเริ่มใช้งาน'
                                }
                                action={
                                    !searchText.trim() ? (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                            เพิ่มส่วนลด
                                        </Button>
                                    ) : null
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}

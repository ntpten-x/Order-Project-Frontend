'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { message, Modal, Typography, Button, Input, Space, Segmented, Tag, Switch, Avatar } from 'antd';
import {
    CarOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ShopOutlined
} from '@ant-design/icons';
import { Delivery } from '../../../../types/api/pos/delivery';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useRealtimeList } from '../../../../utils/pos/realtime';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { useDebouncedValue } from '../../../../utils/useDebouncedValue';
import { pageStyles, globalStyles } from '../../../../theme/pos/delivery/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import type { CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT, parseCreatedSort } from '../../../../lib/list-sort';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';

interface StatsCardProps {
    totalDelivery: number;
    activeDelivery: number;
    inactiveDelivery: number;
}

interface DeliveryCardProps {
    delivery: Delivery;
    onEdit: (delivery: Delivery) => void;
    onDelete: (delivery: Delivery) => void;
    onToggleActive: (delivery: Delivery, next: boolean) => void;
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

const StatsCard = ({ totalDelivery, activeDelivery, inactiveDelivery }: StatsCardProps) => (
    <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 8,
        padding: 14
    }}>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', display: 'block' }}>{totalDelivery}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ทั้งหมด</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0891B2', display: 'block' }}>{activeDelivery}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ใช้งาน</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c', display: 'block' }}>{inactiveDelivery}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ปิดใช้งาน</Text>
        </div>
    </div>
);

const DeliveryCard = ({ delivery, onEdit, onDelete, onToggleActive, updatingStatusId }: DeliveryCardProps) => {
    return (
        <div
            className="delivery-card"
            style={{
                ...pageStyles.deliveryCard(delivery.is_active),
                borderRadius: 16,
            }}
            onClick={() => onEdit(delivery)}
        >
            <div style={pageStyles.deliveryCardInner}>
                <Avatar
                    shape="square"
                    size={52}
                    src={delivery.logo || undefined}
                    icon={<CarOutlined />}
                    style={{
                        borderRadius: 14,
                        background: delivery.is_active
                            ? 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)'
                            : '#f1f5f9',
                        color: delivery.is_active ? '#0891B2' : '#94a3b8',
                        boxShadow: delivery.is_active ? '0 4px 10px rgba(8, 145, 178, 0.18)' : 'none'
                    }}
                />

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text
                            strong
                            style={{
                                fontSize: 16,
                                color: '#0f172a'
                            }}
                            ellipsis={{ tooltip: delivery.delivery_name }}
                        >
                            {delivery.delivery_name}
                        </Text>
                        <Tag color={delivery.is_active ? 'green' : 'default'}>
                            {delivery.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>

                    <Text type="secondary" style={{ fontSize: 13, display: 'block', color: '#334155' }}>
                        Prefix: {delivery.delivery_prefix || '-'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                        อัปเดตล่าสุด {formatDate(delivery.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={delivery.is_active}
                        loading={updatingStatusId === delivery.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            onToggleActive(delivery, checked);
                        }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(delivery);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#0891B2',
                            background: '#ecfeff',
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
                            onDelete(delivery);
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

export default function DeliveryPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isUrlReadyRef = useRef(false);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const debouncedSearch = useDebouncedValue(searchText, 300);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        if (isUrlReadyRef.current) return;

        const qParam = searchParams.get('q') || '';
        const statusParam = searchParams.get('status');
        const sortParam = searchParams.get('sort_created');
        const nextStatus: StatusFilter =
            statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';

        setSearchText(qParam);
        setStatusFilter(nextStatus);
        setCreatedSort(parseCreatedSort(sortParam));
        isUrlReadyRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!isUrlReadyRef.current) return;

        const params = new URLSearchParams();
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (createdSort !== DEFAULT_CREATED_SORT) params.set('sort_created', createdSort);

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [router, pathname, debouncedSearch, statusFilter, createdSort]);

    useEffect(() => {
        if (createdSort !== DEFAULT_CREATED_SORT) return;
        const cached = readCache<Delivery[]>('pos:delivery-providers', 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setDeliveries(cached);
        }
    }, [createdSort]);

    const fetchDeliveries = useCallback(async () => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set('limit', '200');
            params.set('sort_created', createdSort);
            const response = await fetch(`/api/pos/delivery?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลช่องทางจัดส่งได้');
            }
            const payload = await response.json();
            const data = Array.isArray(payload) ? payload : payload?.data;
            if (!Array.isArray(data)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
            setDeliveries(data);
        }, 'กำลังโหลดข้อมูลช่องทางจัดส่ง...');
    }, [execute, createdSort]);

    useEffect(() => {
        if (isAuthorized) {
            fetchDeliveries();
        }
    }, [isAuthorized, fetchDeliveries]);

    useRealtimeList(
        socket,
        { create: RealtimeEvents.delivery.create, update: RealtimeEvents.delivery.update, delete: RealtimeEvents.delivery.delete },
        setDeliveries
    );

    useEffect(() => {
        if (createdSort === DEFAULT_CREATED_SORT && deliveries.length > 0) {
            writeCache('pos:delivery-providers', deliveries);
        }
    }, [deliveries, createdSort]);

    const filteredDeliveries = useMemo(() => {
        let result = deliveries;

        if (statusFilter === 'active') {
            result = result.filter((item) => item.is_active);
        } else if (statusFilter === 'inactive') {
            result = result.filter((item) => !item.is_active);
        }

        const keyword = debouncedSearch.trim().toLowerCase();
        if (keyword) {
            result = result.filter((item) =>
                item.delivery_name.toLowerCase().includes(keyword) ||
                (item.delivery_prefix || '').toLowerCase().includes(keyword)
            );
        }

        return result;
    }, [deliveries, debouncedSearch, statusFilter]);

    const handleAdd = () => {
        showLoading('กำลังเปิดหน้าจัดการช่องทางจัดส่ง...');
        router.push('/pos/delivery/manager/add');
    };

    const handleEdit = (delivery: Delivery) => {
        showLoading('กำลังเปิดหน้าแก้ไขช่องทางจัดส่ง...');
        router.push(`/pos/delivery/manager/edit/${delivery.id}`);
    };

    const handleDelete = (delivery: Delivery) => {
        Modal.confirm({
            title: 'ยืนยันการลบช่องทางจัดส่ง',
            content: `คุณต้องการลบช่องทางจัดส่ง "${delivery.delivery_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/delivery/delete/${delivery.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบช่องทางจัดส่งได้');
                    }
                    setDeliveries((prev) => prev.filter((item) => item.id !== delivery.id));
                    message.success(`ลบช่องทางจัดส่ง "${delivery.delivery_name}" สำเร็จ`);
                }, 'กำลังลบช่องทางจัดส่ง...');
            },
        });
    };

    const handleToggleActive = async (delivery: Delivery, next: boolean) => {
        setUpdatingStatusId(delivery.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/delivery/update/${delivery.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ is_active: next })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะช่องทางจัดส่งได้');
            }

            const updated = await response.json();
            setDeliveries((prev) => prev.map((item) => item.id === delivery.id ? updated : item));
            message.success(next ? 'เปิดใช้งานช่องทางจัดส่งแล้ว' : 'ปิดใช้งานช่องทางจัดส่งแล้ว');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะช่องทางจัดส่งได้');
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

    const activeDeliveries = deliveries.filter((d) => d.is_active).length;
    const inactiveDeliveries = deliveries.filter((d) => !d.is_active).length;

    return (
        <div className="delivery-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="ช่องทางจัดส่ง"
                subtitle={`ทั้งหมด ${deliveries.length} รายการ`}
                icon={<CarOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ShopOutlined />} onClick={() => router.push('/pos/orders')}>
                            ไปหน้าออเดอร์
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={fetchDeliveries} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            เพิ่มช่องทางจัดส่ง
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsCard
                        totalDelivery={deliveries.length}
                        activeDelivery={activeDeliveries}
                        inactiveDelivery={inactiveDeliveries}
                    />

                    <PageSection title="ค้นหาและตัวกรอง">
                        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr', alignItems: 'center' }}>
                            <Input
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                allowClear
                                placeholder="ค้นหาจากชื่อช่องทาง หรือ prefix..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <Segmented<StatusFilter>
                                options={[
                                    { label: `ทั้งหมด (${deliveries.length})`, value: 'all' },
                                    { label: `ใช้งาน (${activeDeliveries})`, value: 'active' },
                                    { label: `ปิดใช้งาน (${inactiveDeliveries})`, value: 'inactive' }
                                ]}
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value)}
                            />
                            <Segmented<CreatedSort>
                                options={[
                                    { label: 'เก่าก่อน', value: 'old' },
                                    { label: 'ใหม่ก่อน', value: 'new' },
                                ]}
                                value={createdSort}
                                onChange={(value) => setCreatedSort(value)}
                            />
                        </div>
                    </PageSection>

                    <PageSection
                        title="รายการช่องทางจัดส่ง"
                        extra={<span style={{ fontWeight: 600 }}>{filteredDeliveries.length}</span>}
                    >
                        {filteredDeliveries.length > 0 ? (
                            filteredDeliveries.map((delivery) => (
                                <DeliveryCard
                                    key={delivery.id}
                                    delivery={delivery}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleActive={handleToggleActive}
                                    updatingStatusId={updatingStatusId}
                                />
                            ))
                        ) : (
                            <UIEmptyState
                                title={
                                    debouncedSearch.trim()
                                        ? 'ไม่พบช่องทางจัดส่งตามคำค้น'
                                        : 'ยังไม่มีช่องทางจัดส่ง'
                                }
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ'
                                        : 'เพิ่มช่องทางจัดส่งแรกเพื่อเริ่มใช้งาน'
                                }
                                action={
                                    !debouncedSearch.trim() ? (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                            เพิ่มช่องทางจัดส่ง
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

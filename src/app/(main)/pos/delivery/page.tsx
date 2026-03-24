'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Pagination, message, Modal, Space, Switch, Tag, Typography } from 'antd';
import {
    CarOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { Delivery } from '../../../../types/api/pos/delivery';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { pageStyles, globalStyles } from '../../../../theme/pos/delivery/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import PageState from '../../../../components/ui/states/PageState';
import type { CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';
import { ModalSelector } from '../../../../components/ui/select/ModalSelector';
import { SearchInput } from '../../../../components/ui/input/SearchInput';
import { SearchBar } from '../../../../components/ui/page/SearchBar';
import { resolveImageSource } from '../../../../utils/image/source';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import SmartAvatar from '../../../../components/ui/image/SmartAvatar';
import { useListState } from '../../../../hooks/pos/useListState';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';


const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type DeliveryCachePayload = {
    items: Delivery[];
    total: number;
};

const DELIVERY_CACHE_KEY = 'pos:delivery:list:default-v2';
const DELIVERY_CACHE_TTL_MS = 60 * 1000;

interface DeliveryCardProps {
    delivery: Delivery;
    canOpenManager: boolean;
    canToggleStatus: boolean;
    canDelete: boolean;
    onEdit: (delivery: Delivery) => void;
    onDelete: (delivery: Delivery) => void;
    onToggleActive: (delivery: Delivery, next: boolean) => void;
    updatingStatusId: string | null;
    deletingId: string | null;
}

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const DeliveryCard = ({
    delivery,
    canOpenManager,
    canToggleStatus,
    canDelete,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
}: DeliveryCardProps) => {
    const logoSource = resolveImageSource(delivery.logo);

    return (
        <div
            className="delivery-card"
            style={{
                ...pageStyles.deliveryCard(delivery.is_active),
                borderRadius: 18,
                cursor: canOpenManager ? 'pointer' : 'default',
            }}
            onClick={() => {
                if (!canOpenManager) return;
                onEdit(delivery);
            }}
        >
            <div style={pageStyles.deliveryCardInner}>
                <SmartAvatar
                    src={delivery.logo}
                    alt={delivery.delivery_name}
                    shape="square"
                    size={56}
                    icon={<CarOutlined />}
                    imageStyle={{ objectFit: 'contain' }}
                    style={{
                        borderRadius: 16,
                        background: delivery.is_active
                            ? 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)'
                            : '#f1f5f9',
                        color: delivery.is_active ? '#0891B2' : '#94a3b8',
                        boxShadow: delivery.is_active ? '0 6px 14px rgba(8, 145, 178, 0.16)' : 'none',
                        border: logoSource ? '1px solid #dbeafe' : undefined,
                    }}
                />

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: delivery.delivery_name }}>
                            {delivery.delivery_name}
                        </Text>
                        <Tag color={delivery.is_active ? 'green' : 'default'} style={{ borderRadius: 999 }}>
                            {delivery.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                        {delivery.delivery_prefix ? (
                            <Tag color="cyan" style={{ margin: 0, borderRadius: 999 }}>
                                {delivery.delivery_prefix}
                            </Tag>
                        ) : null}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                        อัปเดตล่าสุด {formatDate(delivery.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={delivery.is_active}
                        loading={updatingStatusId === delivery.id}
                        disabled={!canToggleStatus || deletingId === delivery.id}
                        onClick={(checked, event) => {
                            if (!canToggleStatus) return;
                            event?.stopPropagation();
                            onToggleActive(delivery, checked);
                        }}
                    />
                    {canOpenManager ? (
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
                                height: 36,
                            }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            loading={deletingId === delivery.id}
                            icon={deletingId === delivery.id ? undefined : <DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(delivery);
                            }}
                            style={{
                                borderRadius: 10,
                                background: '#fef2f2',
                                width: 36,
                                height: 36,
                            }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default function DeliveryPage() {
    const router = useRouter();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
    const requestRef = useRef<AbortController | null>(null);
    const cacheHydratedRef = useRef(false);
    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        total,
        setTotal,
        searchText,
        setSearchText,
        debouncedSearch,
        createdSort,
        setCreatedSort,
        filters,
        updateFilter,
        getQueryParams,
        isUrlReady,
    } = useListState({
        defaultPageSize: 10,
        defaultFilters: {
            status: 'all' as StatusFilter,
        },
    });

    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canViewDelivery = can('delivery.page', 'view');
    const canSearchDelivery = can('delivery.search.feature', 'view');
    const canFilterDelivery = can('delivery.filter.feature', 'view');
    const canOpenDeliveryManager = can('delivery.manager.feature', 'access');
    const canCreateDelivery = can('delivery.page', 'create') && can('delivery.create.feature', 'create') && canOpenDeliveryManager;
    const canEditDelivery = can('delivery.page', 'update') && can('delivery.edit.feature', 'update') && canOpenDeliveryManager;
    const canToggleDeliveryStatus = can('delivery.page', 'update') && can('delivery.status.feature', 'update') && canOpenDeliveryManager;
    const canDeleteDelivery = can('delivery.page', 'delete') && can('delivery.delete.feature', 'delete') && canOpenDeliveryManager;
    const canOpenDeliveryEditWorkspace = canOpenDeliveryManager && (canEditDelivery || canToggleDeliveryStatus || canDeleteDelivery);
    const currentRoleName = String(user?.role ?? '').trim().toLowerCase();

    const isDefaultListView = useMemo(
        () =>
            page === 1 &&
            pageSize === 10 &&
            createdSort === DEFAULT_CREATED_SORT &&
            !debouncedSearch.trim() &&
            filters.status === 'all',
        [createdSort, debouncedSearch, filters.status, page, pageSize]
    );

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        return () => {
            requestRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!isUrlReady || !isAuthorized || !isDefaultListView || cacheHydratedRef.current) {
            return;
        }

        cacheHydratedRef.current = true;
        const cached = readCache<DeliveryCachePayload>(DELIVERY_CACHE_KEY, DELIVERY_CACHE_TTL_MS);
        if (!cached) return;

        setDeliveries(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<DeliveryCachePayload>(DELIVERY_CACHE_KEY, {
            items: deliveries,
            total,
        });
    }, [deliveries, isDefaultListView, loading, total]);

    useEffect(() => {
        if (!canSearchDelivery && searchText) {
            setSearchText('');
        }
    }, [canSearchDelivery, searchText, setSearchText]);

    useEffect(() => {
        if (!canFilterDelivery && filters.status !== 'all') {
            updateFilter('status', 'all');
        }
    }, [canFilterDelivery, filters.status, updateFilter]);

    useEffect(() => {
        if (!canFilterDelivery && createdSort !== DEFAULT_CREATED_SORT) {
            setCreatedSort(DEFAULT_CREATED_SORT);
        }
    }, [canFilterDelivery, createdSort, setCreatedSort]);

    const fetchDeliveries = useCallback(
        async (options?: { background?: boolean }) => {
            if (!isAuthorized) return;

            requestRef.current?.abort();
            const controller = new AbortController();
            requestRef.current = controller;
            const background = options?.background === true;

            if (background) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            try {
                const params = getQueryParams();
                if (!canSearchDelivery) {
                    params.delete('q');
                }
                if (!canFilterDelivery) {
                    params.delete('status');
                    params.delete('sort_created');
                }

                const response = await fetch(`/api/pos/delivery?${params.toString()}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลช่องทางจัดส่งได้');
                }

                const payload = await response.json();
                if (controller.signal.aborted) return;

                setDeliveries(payload.data || []);
                setTotal(payload.total || 0);
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงข้อมูลช่องทางจัดส่งได้'));
            } finally {
                if (requestRef.current === controller) {
                    requestRef.current = null;
                }
                if (!controller.signal.aborted) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [canFilterDelivery, canSearchDelivery, getQueryParams, isAuthorized, setTotal]
    );

    useEffect(() => {
        if (isUrlReady && isAuthorized) {
            void fetchDeliveries({ background: hasCachedSnapshot });
        }
    }, [fetchDeliveries, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.delivery.create,
            RealtimeEvents.delivery.update,
            RealtimeEvents.delivery.delete,
        ],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => {
            void fetchDeliveries({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreateDelivery) {
            message.error('คุณไม่มีสิทธิ์เพิ่มช่องทางจัดส่ง');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการช่องทางจัดส่ง...');
        router.push('/pos/delivery/manager/add');
    };

    const handleEdit = (delivery: Delivery) => {
        if (!canOpenDeliveryEditWorkspace) {
            message.error('คุณไม่มีสิทธิ์แก้ไขช่องทางจัดส่ง');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขช่องทางจัดส่ง...');
        router.push(`/pos/delivery/manager/edit/${delivery.id}`);
    };

    const handleDelete = (delivery: Delivery) => {
        if (!canDeleteDelivery) {
            message.error('คุณไม่มีสิทธิ์ลบช่องทางจัดส่ง');
            return;
        }

        Modal.confirm({
            title: 'ยืนยันการลบช่องทางจัดส่ง',
            content: `คุณต้องการลบช่องทางจัดส่ง ${delivery.delivery_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                setDeletingId(delivery.id);
                try {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/delivery/delete/${delivery.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken,
                        },
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบช่องทางจัดส่งได้');
                    }

                    const shouldMoveToPreviousPage = page > 1 && deliveries.length === 1;
                    setDeliveries((prev) => prev.filter((item) => item.id !== delivery.id));
                    setTotal((prev) => Math.max(prev - 1, 0));

                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchDeliveries({ background: true });
                    }

                    message.success(`ลบช่องทางจัดส่ง "${delivery.delivery_name}" สำเร็จ`);
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบช่องทางจัดส่งได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (delivery: Delivery, next: boolean) => {
        if (!canToggleDeliveryStatus) {
            message.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะช่องทางจัดส่ง');
            return;
        }

        setUpdatingStatusId(delivery.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/delivery/update/${delivery.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({ is_active: next }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะช่องทางจัดส่งได้');
            }

            const updated = await response.json();
            setDeliveries((prev) => prev.map((item) => (item.id === delivery.id ? updated : item)));
            message.success(next ? 'เปิดใช้งานช่องทางจัดส่งแล้ว' : 'ปิดใช้งานช่องทางจัดส่งแล้ว');
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะช่องทางจัดส่งได้');
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

    if (permissionLoading) {
        return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;
    }

    return (
        <div className="delivery-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="ช่องทางจัดส่ง"
                icon={<CarOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchDeliveries({ background: deliveries.length > 0 })} />
                        {canCreateDelivery ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มช่องทางจัดส่ง
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>


                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหา"
                            value={searchText}
                            onChange={setSearchText}
                            disabled={!canSearchDelivery}
                        />
                        <Space wrap size={10} style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Space wrap size={10}>
                                <ModalSelector<StatusFilter>
                                    title="เลือกสถานะการใช้งาน"
                                    options={[
                                        { label: 'ทั้งหมด', value: 'all' },
                                        { label: 'ใช้งาน', value: 'active' },
                                        { label: 'ปิดใช้งาน', value: 'inactive' },
                                    ]}
                                    value={filters.status}
                                    onChange={(value) => updateFilter('status', value)}
                                    style={{ minWidth: 150 }}
                                    disabled={!canFilterDelivery}
                                />
                                <ModalSelector<CreatedSort>
                                    title="เลือกรูปแบบการเรียงลำดับ"
                                    options={[
                                        { label: 'เก่าก่อน', value: 'old' },
                                        { label: 'ใหม่ก่อน', value: 'new' },
                                    ]}
                                    value={createdSort}
                                    onChange={setCreatedSort}
                                    style={{ minWidth: 150 }}
                                    disabled={!canFilterDelivery}
                                />
                            </Space>
                        </Space>
                    </SearchBar>

                    {!canSearchDelivery || !canFilterDelivery ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="บาง control ถูกล็อกตามสิทธิ์"
                            description={`Search ${canSearchDelivery ? 'พร้อมใช้งาน' : 'ถูกปิด'} | Filter/Sort ${canFilterDelivery ? 'พร้อมใช้งาน' : 'ถูกปิด'}`}
                        />
                    ) : null}

                    <PageSection
                        title="รายการช่องทางจัดส่ง"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{total} รายการ</span>

                            </Space>
                        }
                    >
                        {loading && deliveries.length === 0 ? (
                            <PageState status="loading" title="กำลังโหลดข้อมูลช่องทางจัดส่ง..." />
                        ) : error && deliveries.length === 0 ? (
                            <PageState
                                status="error"
                                title="โหลดข้อมูลช่องทางจัดส่งไม่สำเร็จ"
                                error={error}
                                onRetry={() => void fetchDeliveries()}
                            />
                        ) : deliveries.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {deliveries.map((delivery) => (
                                    <DeliveryCard
                                        key={delivery.id}
                                        delivery={delivery}
                                        canOpenManager={canOpenDeliveryEditWorkspace}
                                        canToggleStatus={canToggleDeliveryStatus}
                                        canDelete={canDeleteDelivery}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                        updatingStatusId={updatingStatusId}
                                        deletingId={deletingId}
                                    />
                                ))}

                                <div className="pos-pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16, position: 'relative', width: '100%', borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                                    <div className="pos-pagination-total" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
                                        <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
                                            ทั้งหมด {total} รายการ
                                        </Text>
                                    </div>
                                    <Pagination
                                        current={page}
                                        total={total}
                                        pageSize={pageSize}
                                        onChange={(nextPage) => setPage(nextPage)}
                                        showSizeChanger={false}
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบช่องทางจัดส่งตามคำค้น' : 'ยังไม่มีช่องทางจัดส่ง'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อค้นหารายการที่ต้องการ'
                                        : canCreateDelivery
                                            ? 'เพิ่มผู้ให้บริการเดลิเวอรี่เพื่อให้พนักงานเลือกใช้งานได้ทันที'
                                            : 'บัญชีนี้ดูรายการเดลิเวอรี่ได้ แต่ยังไม่มีสิทธิ์สร้าง provider ใหม่'
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}

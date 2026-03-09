'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    CreditCardOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { PaymentMethod } from '../../../../types/api/pos/paymentMethod';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { pageStyles, globalStyles } from '../../../../theme/pos/paymentMethod/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import PageState from '../../../../components/ui/states/PageState';
import ListPagination, { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { ModalSelector } from '../../../../components/ui/select/ModalSelector';
import { SearchInput } from '../../../../components/ui/input/SearchInput';
import { SearchBar } from '../../../../components/ui/page/SearchBar';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type PaymentMethodCachePayload = {
    items: PaymentMethod[];
    total: number;
};

const PAYMENT_METHOD_CACHE_KEY = 'pos:payment-method:list:default-v3';
const PAYMENT_METHOD_CACHE_TTL_MS = 60 * 1000;

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const getPaymentMethodVisual = (paymentMethod: PaymentMethod) => {
    const code = paymentMethod.payment_method_name.toLowerCase();

    if (code.includes('cash')) {
        return {
            icon: <WalletOutlined style={{ fontSize: 22, color: paymentMethod.is_active ? '#4d7c0f' : '#94a3b8' }} />,
            background: paymentMethod.is_active ? 'linear-gradient(135deg, #d9f99d 0%, #bef264 100%)' : '#f1f5f9',
            tagColor: 'green' as const,
        };
    }

    if (code.includes('promptpay')) {
        return {
            icon: <CreditCardOutlined style={{ fontSize: 22, color: paymentMethod.is_active ? '#0f172a' : '#94a3b8' }} />,
            background: paymentMethod.is_active ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' : '#f1f5f9',
            tagColor: 'blue' as const,
        };
    }

    return {
        icon: <CreditCardOutlined style={{ fontSize: 22, color: paymentMethod.is_active ? '#d97706' : '#94a3b8' }} />,
        background: paymentMethod.is_active ? 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)' : '#f1f5f9',
        tagColor: 'orange' as const,
    };
};

interface PaymentMethodCardProps {
    paymentMethod: PaymentMethod;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (paymentMethod: PaymentMethod) => void;
    onDelete: (paymentMethod: PaymentMethod) => void;
    onToggleActive: (paymentMethod: PaymentMethod, next: boolean) => void;
    updatingStatusId: string | null;
    deletingId: string | null;
}

const PaymentMethodCard = ({
    paymentMethod,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
}: PaymentMethodCardProps) => {
    const visual = getPaymentMethodVisual(paymentMethod);

    return (
        <div
            className="payment-method-card"
            style={{
                ...pageStyles.paymentMethodCard(paymentMethod.is_active),
                borderRadius: 16,
                cursor: canUpdate ? 'pointer' : 'default',
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(paymentMethod);
            }}
        >
            <div style={pageStyles.paymentMethodCardInner}>
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: visual.background,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    {visual.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: paymentMethod.display_name }}>
                            {paymentMethod.display_name}
                        </Text>
                        <Tag color={paymentMethod.is_active ? 'green' : 'default'} style={{ borderRadius: 999 }}>
                            {paymentMethod.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        อัปเดตล่าสุด {formatDate(paymentMethod.create_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={paymentMethod.is_active}
                        loading={updatingStatusId === paymentMethod.id}
                        disabled={!canUpdate || deletingId === paymentMethod.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canUpdate) return;
                            onToggleActive(paymentMethod, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(paymentMethod);
                            }}
                            style={{
                                borderRadius: 10,
                                color: '#047857',
                                background: '#d1fae5',
                                width: 36,
                                height: 36,
                            }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            loading={deletingId === paymentMethod.id}
                            icon={deletingId === paymentMethod.id ? undefined : <DeleteOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(paymentMethod);
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

export default function PaymentMethodPage() {
    const router = useRouter();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
    const requestRef = useRef<AbortController | null>(null);
    const cacheHydratedRef = useRef(false);
    const {
        searchText,
        setSearchText,
        debouncedSearch,
        page,
        setPage,
        pageSize,
        setPageSize,
        createdSort,
        setCreatedSort,
        filters,
        updateFilter,
        total,
        setTotal,
        getQueryParams,
        isUrlReady,
    } = useListState<{ status: StatusFilter }>({
        defaultPageSize: 10,
        defaultFilters: { status: 'all' },
    });

    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreatePaymentMethod = can('payment_method.page', 'create');
    const canUpdatePaymentMethod = can('payment_method.page', 'update');
    const canDeletePaymentMethod = can('payment_method.page', 'delete');
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
        void getCsrfTokenCached();
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
        const cached = readCache<PaymentMethodCachePayload>(PAYMENT_METHOD_CACHE_KEY, PAYMENT_METHOD_CACHE_TTL_MS);
        if (!cached) return;

        setPaymentMethods(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<PaymentMethodCachePayload>(PAYMENT_METHOD_CACHE_KEY, {
            items: paymentMethods,
            total,
        });
    }, [isDefaultListView, loading, paymentMethods, total]);

    const fetchPaymentMethods = useCallback(
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
                const response = await fetch(`/api/pos/paymentMethod?${params.toString()}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลวิธีการชำระเงินได้');
                }

                const payload = await response.json();
                if (controller.signal.aborted) return;

                setPaymentMethods(payload.data || []);
                setTotal(payload.total || 0);
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงข้อมูลวิธีการชำระเงินได้'));
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
        [getQueryParams, isAuthorized, setTotal]
    );

    useEffect(() => {
        if (isUrlReady && isAuthorized) {
            void fetchPaymentMethods({ background: hasCachedSnapshot });
        }
    }, [fetchPaymentMethods, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.paymentMethods.create,
            RealtimeEvents.paymentMethods.update,
            RealtimeEvents.paymentMethods.delete,
        ],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => {
            void fetchPaymentMethods({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreatePaymentMethod) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มวิธีการชำระเงิน');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการวิธีการชำระเงิน...');
        router.push('/pos/paymentMethod/manager/add');
    };

    const handleEdit = (paymentMethod: PaymentMethod) => {
        if (!canUpdatePaymentMethod) {
            message.warning('คุณไม่มีสิทธิ์แก้ไขวิธีการชำระเงิน');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขวิธีการชำระเงิน...');
        router.push(`/pos/paymentMethod/manager/edit/${paymentMethod.id}`);
    };

    const handleDelete = (paymentMethod: PaymentMethod) => {
        if (!canDeletePaymentMethod) {
            message.warning('คุณไม่มีสิทธิ์ลบวิธีการชำระเงิน');
            return;
        }

        Modal.confirm({
            title: 'ยืนยันการลบวิธีการชำระเงิน',
            content: `คุณต้องการลบ ${paymentMethod.display_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                setDeletingId(paymentMethod.id);
                try {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/paymentMethod/delete/${paymentMethod.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken,
                        },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบวิธีการชำระเงินได้');
                    }

                    const shouldMoveToPreviousPage = page > 1 && paymentMethods.length === 1;
                    setPaymentMethods((prev) => prev.filter((item) => item.id !== paymentMethod.id));
                    setTotal((prev) => Math.max(prev - 1, 0));
                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchPaymentMethods({ background: true });
                    }
                    message.success(`ลบวิธีการชำระเงิน "${paymentMethod.display_name}" สำเร็จ`);
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบวิธีการชำระเงินได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (paymentMethod: PaymentMethod, next: boolean) => {
        if (!canUpdatePaymentMethod) {
            message.warning('คุณไม่มีสิทธิ์เปลี่ยนสถานะวิธีการชำระเงิน');
            return;
        }

        setUpdatingStatusId(paymentMethod.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/paymentMethod/update/${paymentMethod.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({ is_active: next }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะวิธีการชำระเงินได้');
            }

            const updated = await response.json();
            setPaymentMethods((prev) => prev.map((item) => (item.id === paymentMethod.id ? updated : item)));
            void fetchPaymentMethods({ background: true });
            message.success(next ? 'เปิดใช้งานวิธีการชำระเงินแล้ว' : 'ปิดใช้งานวิธีการชำระเงินแล้ว');
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะวิธีการชำระเงินได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    if (permissionLoading) {
        return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;
    }

    return (
        <div className="payment-method-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="วิธีการชำระเงิน"
                icon={<CreditCardOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchPaymentMethods({ background: paymentMethods.length > 0 })}>
                        </Button>
                        {canCreatePaymentMethod ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มวิธีการชำระเงิน
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
                        />
                        <Space wrap size={10} style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Space wrap size={10}>
                                <ModalSelector<StatusFilter>
                                    title="เลือกสถานะ"
                                    options={[
                                        { label: 'ทั้งหมด', value: 'all' },
                                        { label: 'ใช้งาน', value: 'active' },
                                        { label: 'ปิดใช้งาน', value: 'inactive' },
                                    ]}
                                    value={filters.status}
                                    onChange={(value) => updateFilter('status', value)}
                                    style={{ minWidth: 120 }}
                                />
                                <ModalSelector<CreatedSort>
                                    title="เรียงลำดับ"
                                    options={[
                                        { label: 'เก่าก่อน', value: 'old' },
                                        { label: 'ใหม่ก่อน', value: 'new' },
                                    ]}
                                    value={createdSort}
                                    onChange={setCreatedSort}
                                    style={{ minWidth: 120 }}
                                />
                            </Space>
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการวิธีการชำระเงิน"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{total} รายการ</span>
                            </Space>
                        }
                    >
                        {loading && paymentMethods.length === 0 ? (
                            <PageState status="loading" title="กำลังโหลดข้อมูลวิธีการชำระเงิน..." />
                        ) : error && paymentMethods.length === 0 ? (
                            <PageState
                                status="error"
                                title="โหลดข้อมูลวิธีการชำระเงินไม่สำเร็จ"
                                error={error}
                                onRetry={() => void fetchPaymentMethods()}
                            />
                        ) : paymentMethods.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {paymentMethods.map((paymentMethod) => (
                                    <PaymentMethodCard
                                        key={paymentMethod.id}
                                        paymentMethod={paymentMethod}
                                        canUpdate={canUpdatePaymentMethod}
                                        canDelete={canDeletePaymentMethod}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                        updatingStatusId={updatingStatusId}
                                        deletingId={deletingId}
                                    />
                                ))}

                                <div style={{ marginTop: 12 }}>
                                    <ListPagination
                                        page={page}
                                        pageSize={pageSize}
                                        total={total}
                                        loading={loading || refreshing}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                        activeColor="#047857"
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบวิธีการชำระเงินตามคำค้น' : 'ยังไม่มีวิธีการชำระเงิน'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง แล้วค้นหาอีกครั้ง'
                                        : 'เพิ่มช่องทางชำระเงินแรกเพื่อให้หน้า POS พร้อมใช้งานจริง'
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}

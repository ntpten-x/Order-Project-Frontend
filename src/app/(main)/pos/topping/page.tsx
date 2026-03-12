'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import { TagsOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import { Category } from '../../../../types/api/pos/category';
import { Topping } from '../../../../types/api/pos/topping';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
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
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';
import { pageStyles, globalStyles } from '../../../../theme/pos/topping/style';
import { formatCurrency } from '../../../../utils/format.utils';
import { isSupportedImageSource, normalizeImageSource } from '../../../../utils/image/source';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type CategoryFilter = 'all' | string;
type ToppingCachePayload = { items: Topping[]; total: number };

const TOPPING_CACHE_KEY = 'pos:topping:list:default-v3';
const TOPPING_CACHE_TTL_MS = 60 * 1000;

interface ToppingCardProps {
    topping: Topping;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (topping: Topping) => void;
    onDelete: (topping: Topping) => void;
    onToggleActive: (topping: Topping, next: boolean) => void;
    updatingStatusId: string | null;
    deletingId: string | null;
}

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const parseListResponse = <T,>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)) {
        return (payload as { data: T[] }).data;
    }
    return [];
};

const ToppingCard = ({
    topping,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
}: ToppingCardProps) => {
    const imageSrc = normalizeImageSource(topping.img);
    const hasImage = isSupportedImageSource(imageSrc);
    const deliveryPrice = Number(topping.price_delivery ?? topping.price ?? 0);

    return (
        <div
            className="topping-card"
            style={{ ...pageStyles.unitCard(topping.is_active), borderRadius: 16, cursor: canUpdate ? 'pointer' : 'default' }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(topping);
            }}
        >
            <div style={pageStyles.unitCardInner}>
                <div
                    style={{
                        width: 58,
                        height: 58,
                        borderRadius: 16,
                        background: topping.is_active ? 'linear-gradient(135deg, #fef3c7 0%, #fdba74 100%)' : '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        boxShadow: topping.is_active ? '0 4px 10px rgba(234, 88, 12, 0.16)' : 'none',
                    }}
                >
                    {hasImage ? (
                        <img src={imageSrc} alt={topping.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <TagsOutlined style={{ fontSize: 24, color: topping.is_active ? '#ea580c' : '#94a3b8' }} />
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: topping.display_name }}>
                            {topping.display_name}
                        </Text>
                        <Tag color={topping.is_active ? 'green' : 'default'} style={{ borderRadius: 999 }}>
                            {topping.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, marginBottom: 6 }}>
                        <Tag color="orange" style={{ borderRadius: 999, marginInlineEnd: 0 }}>
                            POS {formatCurrency(Number(topping.price || 0))}
                        </Tag>
                        <Tag color="blue" style={{ borderRadius: 999, marginInlineEnd: 0 }}>
                            Delivery {formatCurrency(deliveryPrice)}
                        </Tag>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {(topping.categories || []).length > 0 ? (
                            topping.categories?.map((category) => (
                                <Tag key={category.id} color="gold" style={{ borderRadius: 999, marginInlineEnd: 0 }}>
                                    {category.display_name}
                                </Tag>
                            ))
                        ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                ยังไม่กำหนดหมวดหมู่
                            </Text>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                        อัปเดตล่าสุด {formatDate(topping.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={topping.is_active}
                        loading={updatingStatusId === topping.id}
                        disabled={!canUpdate || deletingId === topping.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canUpdate) return;
                            onToggleActive(topping, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(topping);
                            }}
                            style={{ borderRadius: 10, color: '#ea580c', background: '#fff7ed', width: 36, height: 36 }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            loading={deletingId === topping.id}
                            icon={deletingId === topping.id ? undefined : <DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(topping);
                            }}
                            style={{ borderRadius: 10, background: '#fef2f2', width: 36, height: 36 }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default function ToppingPage() {
    const router = useRouter();
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
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
    } = useListState<{ status: StatusFilter; category_id: CategoryFilter }>({
        defaultPageSize: 10,
        defaultFilters: { status: 'all', category_id: 'all' },
    });

    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateTopping = can('topping.page', 'create');
    const canUpdateTopping = can('topping.page', 'update');
    const canDeleteTopping = can('topping.page', 'delete');
    const isDefaultListView = useMemo(
        () =>
            page === 1 &&
            pageSize === 10 &&
            createdSort === DEFAULT_CREATED_SORT &&
            !debouncedSearch.trim() &&
            filters.status === 'all' &&
            filters.category_id === 'all',
        [createdSort, debouncedSearch, filters.category_id, filters.status, page, pageSize]
    );
    const categoryOptions = useMemo(
        () => [
            { label: 'ทุกหมวดหมู่', value: 'all' as CategoryFilter },
            ...categories.map((category) => ({
                label: category.is_active ? category.display_name : `${category.display_name} (ปิดใช้งาน)`,
                value: category.id as CategoryFilter,
            })),
        ],
        [categories]
    );

    useEffect(() => {
        void getCsrfTokenCached();
    }, []);

    useEffect(() => () => requestRef.current?.abort(), []);

    useEffect(() => {
        if (!isUrlReady || !isAuthorized || !isDefaultListView || cacheHydratedRef.current) return;

        cacheHydratedRef.current = true;
        const cached = readCache<ToppingCachePayload>(TOPPING_CACHE_KEY, TOPPING_CACHE_TTL_MS);
        if (!cached) return;

        setToppings(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<ToppingCachePayload>(TOPPING_CACHE_KEY, { items: toppings, total });
    }, [isDefaultListView, loading, total, toppings]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch('/api/pos/category', { cache: 'no-store' });
            if (!response.ok) return;
            setCategories(parseListResponse<Category>(await response.json()));
        } catch {
            // keep page usable even if category selector cannot be refreshed
        }
    }, []);

    const fetchToppings = useCallback(async (options?: { background?: boolean }) => {
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
            const response = await fetch(`/api/pos/topping?${params.toString()}`, {
                cache: 'no-store',
                signal: controller.signal,
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลท็อปปิ้งได้');
            }

            const payload = await response.json();
            if (controller.signal.aborted) return;

            setToppings(payload.data || []);
            setTotal(payload.total || 0);
        } catch (fetchError) {
            if (controller.signal.aborted) return;
            setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงข้อมูลท็อปปิ้งได้'));
        } finally {
            if (requestRef.current === controller) requestRef.current = null;
            if (!controller.signal.aborted) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [getQueryParams, isAuthorized, setTotal]);

    useEffect(() => {
        if (isUrlReady && isAuthorized) {
            void fetchCategories();
            void fetchToppings({ background: hasCachedSnapshot });
        }
    }, [fetchCategories, fetchToppings, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.topping.create,
            RealtimeEvents.topping.update,
            RealtimeEvents.topping.delete,
            RealtimeEvents.categories.create,
            RealtimeEvents.categories.update,
            RealtimeEvents.categories.delete,
        ],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => {
            void fetchCategories();
            void fetchToppings({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreateTopping) {
            message.error('คุณไม่มีสิทธิ์เพิ่มท็อปปิ้ง');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการท็อปปิ้ง...');
        router.push('/pos/topping/manager/add');
    };

    const handleEdit = (topping: Topping) => {
        if (!canUpdateTopping) {
            message.error('คุณไม่มีสิทธิ์แก้ไขท็อปปิ้ง');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขท็อปปิ้ง...');
        router.push(`/pos/topping/manager/edit/${topping.id}`);
    };

    const handleDelete = (topping: Topping) => {
        if (!canDeleteTopping) {
            message.error('คุณไม่มีสิทธิ์ลบท็อปปิ้ง');
            return;
        }
        Modal.confirm({
            title: 'ยืนยันการลบท็อปปิ้ง',
            content: `คุณต้องการลบท็อปปิ้ง ${topping.display_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                setDeletingId(topping.id);
                try {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/topping/delete/${topping.id}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-Token': csrfToken },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบท็อปปิ้งได้');
                    }

                    const shouldMoveToPreviousPage = page > 1 && toppings.length === 1;
                    setToppings((prev) => prev.filter((item) => item.id !== topping.id));
                    setTotal((prev) => Math.max(prev - 1, 0));
                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchToppings({ background: true });
                    }
                    message.success(`ลบท็อปปิ้ง "${topping.display_name}" สำเร็จ`);
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบท็อปปิ้งได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (topping: Topping, next: boolean) => {
        if (!canUpdateTopping) {
            message.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะท็อปปิ้ง');
            return;
        }
        setUpdatingStatusId(topping.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/topping/update/${topping.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                body: JSON.stringify({ is_active: next }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะท็อปปิ้งได้');
            }

            const updated = await response.json();
            setToppings((prev) => prev.map((item) => (item.id === topping.id ? updated : item)));
            message.success(next ? 'เปิดใช้งานท็อปปิ้งแล้ว' : 'ปิดใช้งานท็อปปิ้งแล้ว');
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะท็อปปิ้งได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    if (permissionLoading) return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;

    return (
        <div className="topping-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="ท็อปปิ้ง"
                icon={<TagsOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchToppings({ background: toppings.length > 0 })} />
                        {canCreateTopping ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มท็อปปิ้ง
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <SearchBar>
                        <SearchInput placeholder="ค้นหาท็อปปิ้ง" value={searchText} onChange={setSearchText} />
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
                                <ModalSelector<CategoryFilter>
                                    title="เลือกหมวดหมู่"
                                    options={categoryOptions}
                                    value={filters.category_id}
                                    onChange={(value) => updateFilter('category_id', value)}
                                    style={{ minWidth: 150 }}
                                />
                            </Space>
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการท็อปปิ้ง"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{total} รายการ</span>
                            </Space>
                        }
                    >
                        {loading && toppings.length === 0 ? (
                            <PageState status="loading" title="กำลังโหลดข้อมูลท็อปปิ้ง..." />
                        ) : error && toppings.length === 0 ? (
                            <PageState status="error" title="โหลดข้อมูลท็อปปิ้งไม่สำเร็จ" error={error} onRetry={() => void fetchToppings()} />
                        ) : toppings.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {toppings.map((topping) => (
                                    <ToppingCard
                                        key={topping.id}
                                        topping={topping}
                                        canUpdate={canUpdateTopping}
                                        canDelete={canDeleteTopping}
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
                                        activeColor="#ea580c"
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบท็อปปิ้งตามคำค้น' : 'ยังไม่มีท็อปปิ้ง'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่/สถานะ'
                                        : 'เพิ่มท็อปปิ้งรายการแรกเพื่อให้ทีมงานเลือกใช้งานได้รวดเร็ว'
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}

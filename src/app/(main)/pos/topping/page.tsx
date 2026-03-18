'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, message, Modal, Space, Switch, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, ShopOutlined, TagsOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import { Category } from '../../../../types/api/pos/category';
import { Topping } from '../../../../types/api/pos/topping';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import SmartImage from '../../../../components/ui/image/SmartImage';
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
import { formatPrice } from '../../../../utils/products/productDisplay.utils';
import { isSupportedImageSource, normalizeImageSource } from '../../../../utils/image/source';
import { TOPPING_CAPABILITIES, TOPPING_ROLE_BLUEPRINT } from '../../../../lib/rbac/topping-capabilities';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type CategoryFilter = 'all' | string;
type ToppingCachePayload = { items: Topping[]; total: number };

const TOPPING_CACHE_KEY = 'pos:topping:list:default-v4';
const TOPPING_CACHE_TTL_MS = 60 * 1000;

interface ToppingCardProps {
    topping: Topping;
    canOpenManager: boolean;
    canToggleStatus: boolean;
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

function ToppingCard({
    topping,
    canOpenManager,
    canToggleStatus,
    canDelete,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
}: ToppingCardProps) {
    const imageSrc = normalizeImageSource(topping.img);
    const hasImage = isSupportedImageSource(imageSrc);

    return (
        <div
            className="topping-card"
            style={{ ...pageStyles.unitCard(topping.is_active), borderRadius: 16, cursor: canOpenManager ? 'pointer' : 'default' }}
            onClick={() => {
                if (!canOpenManager) return;
                onEdit(topping);
            }}
        >
            <div style={pageStyles.unitCardInner}>
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 14,
                        border: '1px solid #F1F5F9',
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#F8FAFC',
                        flexShrink: 0,
                    }}
                >
                    {hasImage ? (
                        <SmartImage
                            src={imageSrc}
                            alt={topping.display_name}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="64px"
                        />
                    ) : (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)',
                            }}
                        >
                            <ShopOutlined style={{ fontSize: 20, color: '#EA580C' }} />
                        </div>
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
                    <Space size={6} wrap>
                        <Tag style={{ margin: 0, border: 'none', background: '#ecfdf5', color: '#047857' }}>
                            {formatPrice(Number(topping.price || 0))}
                        </Tag>
                        {Number(topping.price_delivery ?? topping.price ?? 0) !== Number(topping.price ?? 0) ? (
                            <Tag style={{ margin: 0, border: 'none', background: '#fdf2f8', color: '#be185d' }}>
                                Delivery {formatPrice(Number(topping.price_delivery ?? 0))}
                            </Tag>
                        ) : null}
                        {topping.categories?.map((category) => (
                            <Tag key={category.id} style={{ margin: 0, border: 'none', background: '#eff6ff', color: '#1d4ed8' }}>
                                {category.display_name}
                            </Tag>
                        ))}
                        {topping.topping_groups?.map((group) => (
                            <Tag key={group.id} style={{ margin: 0, border: 'none', background: '#f5f3ff', color: '#6d28d9' }}>
                                กลุ่ม {group.display_name}
                            </Tag>
                        ))}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        อัปเดตล่าสุด {formatDate(topping.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={topping.is_active}
                        loading={updatingStatusId === topping.id}
                        disabled={!canToggleStatus || deletingId === topping.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canToggleStatus) return;
                            onToggleActive(topping, checked);
                        }}
                    />
                    {canOpenManager ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(topping);
                            }}
                            style={{
                                borderRadius: 10,
                                color: '#4F46E5',
                                background: '#EEF2FF',
                                width: 36,
                                height: 36,
                            }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            loading={deletingId === topping.id}
                            icon={deletingId === topping.id ? undefined : <DeleteOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(topping);
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
}

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
    const canViewTopping = can('topping.page', 'view');
    const canSearchTopping = can('topping.search.feature', 'view');
    const canFilterTopping = can('topping.filter.feature', 'view');
    const canOpenToppingManager = can('topping.manager.feature', 'access');
    const canCreateTopping = can('topping.page', 'create') && can('topping.create.feature', 'create') && canOpenToppingManager;
    const canEditToppingCatalog = can('topping.page', 'update') && can('topping.catalog.feature', 'update') && canOpenToppingManager;
    const canEditToppingPricing = can('topping.page', 'update') && can('topping.pricing.feature', 'update') && canOpenToppingManager;
    const canToggleToppingStatus = can('topping.page', 'update') && can('topping.status.feature', 'update') && canOpenToppingManager;
    const canDeleteTopping = can('topping.page', 'delete') && can('topping.delete.feature', 'delete') && canOpenToppingManager;
    const canOpenToppingEditWorkspace =
        canOpenToppingManager && (canEditToppingCatalog || canEditToppingPricing || canToggleToppingStatus || canDeleteTopping);
    const currentRoleName = String(user?.role ?? '').trim().toLowerCase();
    const selectedRoleBlueprint = useMemo(
        () => TOPPING_ROLE_BLUEPRINT.find((item) => item.roleName.toLowerCase() === currentRoleName) ?? null,
        [currentRoleName]
    );
    const capabilityMatrix = useMemo(
        () => TOPPING_CAPABILITIES.map((item) => ({ ...item, enabled: can(item.resourceKey, item.action) })),
        [can]
    );
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

    useEffect(() => {
        if (!canSearchTopping && searchText) setSearchText('');
    }, [canSearchTopping, searchText, setSearchText]);

    useEffect(() => {
        if (!canFilterTopping && filters.status !== 'all') updateFilter('status', 'all');
    }, [canFilterTopping, filters.status, updateFilter]);

    useEffect(() => {
        if (!canFilterTopping && filters.category_id !== 'all') updateFilter('category_id', 'all');
    }, [canFilterTopping, filters.category_id, updateFilter]);

    useEffect(() => {
        if (!canFilterTopping && createdSort !== DEFAULT_CREATED_SORT) setCreatedSort(DEFAULT_CREATED_SORT);
    }, [canFilterTopping, createdSort, setCreatedSort]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch('/api/pos/category', { cache: 'no-store' });
            if (!response.ok) return;
            setCategories(parseListResponse<Category>(await response.json()));
        } catch {
            // Keep topping page usable even if category selector cannot refresh.
        }
    }, []);

    const fetchToppings = useCallback(async (options?: { background?: boolean }) => {
        if (!isAuthorized) return;

        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        const background = options?.background === true;

        if (background) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const params = getQueryParams();
            if (!canSearchTopping) {
                params.delete('q');
            }
            if (!canFilterTopping) {
                params.delete('status');
                params.delete('category_id');
                params.delete('sort_created');
            }

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
    }, [canFilterTopping, canSearchTopping, getQueryParams, isAuthorized, setTotal]);

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
            RealtimeEvents.toppingGroups.create,
            RealtimeEvents.toppingGroups.update,
            RealtimeEvents.toppingGroups.delete,
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
        if (!canOpenToppingEditWorkspace) {
            message.error('คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการท็อปปิ้ง');
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
        if (!canToggleToppingStatus) {
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
    if (!isAuthorized || !canViewTopping) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }
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
                        <Button onClick={() => router.push('/pos/toppingGroup')}>จัดการกลุ่มท็อปปิ้ง</Button>
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
                    <Alert
                        type={selectedRoleBlueprint?.roleName === 'Employee' ? 'info' : 'success'}
                        showIcon
                        message={selectedRoleBlueprint?.title || 'Topping permissions'}
                        description={
                            selectedRoleBlueprint
                                ? `${selectedRoleBlueprint.summary} | ทำได้: ${selectedRoleBlueprint.allowed.join(', ')}${selectedRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedRoleBlueprint.denied.join(', ')}` : ''}`
                                : 'หน้าท็อปปิ้งจะแสดงเฉพาะส่วนที่ role นี้มี capability จริง'
                        }
                    />

                    {(!canSearchTopping || !canFilterTopping || !canOpenToppingManager) ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Some topping controls are restricted by policy"
                            description="ระบบจะซ่อนหรือปิด search, filter, manager workspace และ action ต่าง ๆ ตาม capability ของ role นี้"
                        />
                    ) : null}

                    <PageSection
                        title="Topping Capability Matrix"
                        extra={<Tag color="blue">{capabilityMatrix.filter((item) => item.enabled).length}/{capabilityMatrix.length} enabled</Tag>}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                            {capabilityMatrix.map((item) => (
                                <div
                                    key={item.resourceKey}
                                    style={{
                                        borderRadius: 18,
                                        padding: 16,
                                        border: item.enabled ? '1px solid rgba(234, 88, 12, 0.22)' : '1px solid rgba(148, 163, 184, 0.24)',
                                        background: item.enabled ? 'linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)' : '#ffffff',
                                        boxShadow: item.enabled ? '0 14px 32px rgba(234, 88, 12, 0.08)' : '0 10px 24px rgba(15, 23, 42, 0.04)',
                                    }}
                                >
                                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                        <Space wrap>
                                            <Tag color={item.enabled ? 'orange' : 'default'}>{item.enabled ? 'Enabled' : 'Locked'}</Tag>
                                            <Tag color={item.securityLevel === 'governance' ? 'red' : item.securityLevel === 'sensitive' ? 'gold' : 'cyan'}>
                                                {item.securityLevel}
                                            </Tag>
                                        </Space>
                                        <Text strong>{item.title}</Text>
                                        <Text type="secondary">{item.description}</Text>
                                    </Space>
                                </div>
                            ))}
                        </div>
                    </PageSection>

                    <SearchBar>
                        <SearchInput placeholder="ค้นหาท็อปปิ้ง" value={searchText} onChange={setSearchText} disabled={!canSearchTopping} />
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
                                    disabled={!canFilterTopping}
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
                                    disabled={!canFilterTopping}
                                />
                                <ModalSelector<CategoryFilter>
                                    title="เลือกหมวดหมู่"
                                    options={categoryOptions}
                                    value={filters.category_id}
                                    onChange={(value) => updateFilter('category_id', value)}
                                    style={{ minWidth: 160 }}
                                    disabled={!canFilterTopping}
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
                                        canOpenManager={canOpenToppingEditWorkspace}
                                        canToggleStatus={canToggleToppingStatus}
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

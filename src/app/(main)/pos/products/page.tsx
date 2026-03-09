'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message, Modal, Typography, Tag, Button, Alert, Space, Switch } from 'antd';
import Image from '../../../../components/ui/image/SmartImage';
import {
    ShopOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { Products } from '../../../../types/api/pos/products';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { useListState } from '../../../../hooks/pos/useListState';
import { pageStyles, globalStyles } from '../../../../theme/pos/products/style';
import { useCategories } from '../../../../hooks/pos/useCategories';
import { useProductsUnit } from '../../../../hooks/pos/useProductsUnit';
import { formatPrice } from '../../../../utils/products/productDisplay.utils';
import { checkProductSetupState, getSetupMissingMessage } from '../../../../utils/products/productSetup.utils';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
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
import { resolveImageSource } from '../../../../utils/image/source';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type CachedProducts = {
    items: Products[];
    total: number;
    active_total: number | null;
};

const PRODUCTS_CACHE_KEY = 'pos:products:list:default-v5';
const PRODUCTS_CACHE_TTL_MS = 60 * 1000;

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

interface ProductCardProps {
    product: Products;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (product: Products) => void;
    onDelete: (product: Products) => void;
    onToggleActive: (product: Products, next: boolean) => void;
    updatingStatusId: string | null;
    deletingId: string | null;
}

const ProductCard = ({
    product,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
}: ProductCardProps) => (
    <div
        className="product-card"
        style={{
            ...pageStyles.productCard(product.is_active),
            borderRadius: 16,
            cursor: canUpdate ? 'pointer' : 'default',
        }}
        onClick={() => {
            if (!canUpdate) return;
            onEdit(product);
        }}
    >
        <div className="product-card-inner" style={pageStyles.productCardInner}>
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
                {product.img_url ? (
                    <Image
                        src={resolveImageSource(product.img_url) || undefined}
                        alt={product.display_name}
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
                            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                        }}
                    >
                        <ShopOutlined style={{ fontSize: 20, color: '#4F46E5' }} />
                    </div>
                )}
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: product.display_name }}>
                        {product.display_name}
                    </Text>
                    <Tag color={product.is_active ? 'green' : 'default'} style={{ borderRadius: 999 }}>
                        {product.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                    </Tag>
                </div>
                <Space size={6} wrap>
                    <Tag style={{ margin: 0, border: 'none', background: '#ecfdf5', color: '#047857' }}>
                        {formatPrice(Number(product.price || 0))}
                    </Tag>
                    {Number(product.price_delivery ?? product.price ?? 0) !== Number(product.price ?? 0) ? (
                        <Tag style={{ margin: 0, border: 'none', background: '#fdf2f8', color: '#be185d' }}>
                            Delivery {formatPrice(Number(product.price_delivery ?? 0))}
                        </Tag>
                    ) : null}
                    {product.category?.display_name ? (
                        <Tag style={{ margin: 0, border: 'none', background: '#eff6ff', color: '#1d4ed8' }}>
                            {product.category.display_name}
                        </Tag>
                    ) : null}
                    {product.unit?.display_name ? (
                        <Tag style={{ margin: 0, border: 'none', background: '#ecfeff', color: '#0f766e' }}>
                            {product.unit.display_name}
                        </Tag>
                    ) : null}
                </Space>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                    อัปเดตล่าสุด {formatDate(product.update_date)}
                </Text>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Switch
                    size="small"
                    checked={product.is_active}
                    loading={updatingStatusId === product.id}
                    disabled={!canUpdate || deletingId === product.id}
                    onClick={(checked, event) => {
                        event?.stopPropagation();
                        if (!canUpdate) return;
                        onToggleActive(product, checked);
                    }}
                />
                {canUpdate ? (
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit(product);
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
                        loading={deletingId === product.id}
                        icon={deletingId === product.id ? undefined : <DeleteOutlined />}
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete(product);
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

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Products[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
    const [activeProductsTotal, setActiveProductsTotal] = useState<number | null>(null);
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
        isUrlReady,
    } = useListState<{ status: StatusFilter; category_id: string }>({
        defaultPageSize: 10,
        defaultFilters: { status: 'all', category_id: 'all' },
    });
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateProducts = can('products.page', 'create');
    const canUpdateProducts = can('products.page', 'update');
    const canDeleteProducts = can('products.page', 'delete');
    const {
        data: categories = [],
        isLoading: isLoadingCategories,
        refetch: refetchCategories,
    } = useCategories();
    const {
        data: units = [],
        isLoading: isLoadingUnits,
        refetch: refetchUnits,
    } = useProductsUnit();
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

    const refreshSetupMetadata = useCallback(() => {
        void refetchCategories();
        void refetchUnits();
    }, [refetchCategories, refetchUnits]);

    const setupState = useMemo(() => {
        const baseState = checkProductSetupState(categories, units);
        if (baseState.isReady) {
            return baseState;
        }

        const hasCategoriesFromProducts = products.some((item) => Boolean(item.category_id));
        const hasUnitsFromProducts = products.some((item) => Boolean(item.unit_id));
        return {
            hasCategories: baseState.hasCategories || hasCategoriesFromProducts,
            hasUnits: baseState.hasUnits || hasUnitsFromProducts,
            isReady: (baseState.hasCategories || hasCategoriesFromProducts) && (baseState.hasUnits || hasUnitsFromProducts),
            missingFields: [
                !(baseState.hasCategories || hasCategoriesFromProducts) && 'หมวดหมู่สินค้า',
                !(baseState.hasUnits || hasUnitsFromProducts) && 'หน่วยสินค้า',
            ].filter(Boolean) as string[],
        };
    }, [categories, products, units]);

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
        const cached = readCache<CachedProducts>(PRODUCTS_CACHE_KEY, PRODUCTS_CACHE_TTL_MS);
        if (!cached) return;

        setProducts(cached.items || []);
        setTotal(cached.total || 0);
        setActiveProductsTotal(cached.active_total ?? null);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<CachedProducts>(PRODUCTS_CACHE_KEY, {
            items: products,
            total,
            active_total: activeProductsTotal,
        });
    }, [activeProductsTotal, isDefaultListView, loading, products, total]);

    const buildListParams = useCallback(() => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(pageSize));
        params.set('sort_created', createdSort);
        if (debouncedSearch.trim()) {
            params.set('q', debouncedSearch.trim());
        }
        if (filters.status === 'active') {
            params.set('is_active', 'true');
        } else if (filters.status === 'inactive') {
            params.set('is_active', 'false');
        }
        if (filters.category_id !== 'all') {
            params.set('category_id', filters.category_id);
        }
        return params;
    }, [createdSort, debouncedSearch, filters.category_id, filters.status, page, pageSize]);

    const buildActiveCountParams = useCallback(() => {
        const params = new URLSearchParams();
        if (filters.category_id !== 'all') {
            params.set('category_id', filters.category_id);
        }
        return params;
    }, [filters.category_id]);

    const fetchProducts = useCallback(
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
                const listParams = buildListParams();
                const activeCountParams = buildActiveCountParams();
                const activeCountQuery = activeCountParams.toString();
                const activeCountUrl = activeCountQuery
                    ? `/api/pos/products/active-count?${activeCountQuery}`
                    : '/api/pos/products/active-count';

                const [listResponse, activeCountResponse] = await Promise.all([
                    fetch(`/api/pos/products?${listParams.toString()}`, {
                        cache: 'no-store',
                        signal: controller.signal,
                    }),
                    fetch(activeCountUrl, {
                        cache: 'no-store',
                        signal: controller.signal,
                    }),
                ]);

                if (!listResponse.ok) {
                    const errorData = await listResponse.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลสินค้าได้');
                }
                if (!activeCountResponse.ok) {
                    const errorData = await activeCountResponse.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงจำนวนสินค้าที่ใช้งานอยู่ได้');
                }

                const listPayload = await listResponse.json();
                const activePayload = await activeCountResponse.json();
                if (controller.signal.aborted) return;

                setProducts(listPayload.data || []);
                setTotal(listPayload.total || 0);
                setActiveProductsTotal(typeof activePayload.total === 'number' ? activePayload.total : null);
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงข้อมูลสินค้าได้'));
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
        [buildActiveCountParams, buildListParams, isAuthorized, setTotal]
    );

    useEffect(() => {
        if (!isAuthorized) return;
        refreshSetupMetadata();
    }, [isAuthorized, refreshSetupMetadata]);

    useEffect(() => {
        if (isUrlReady && isAuthorized) {
            void fetchProducts({ background: hasCachedSnapshot });
        }
    }, [fetchProducts, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.products.create,
            RealtimeEvents.products.update,
            RealtimeEvents.products.delete,
        ],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => {
            void fetchProducts({ background: true });
        },
    });

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.categories.create,
            RealtimeEvents.categories.update,
            RealtimeEvents.categories.delete,
            RealtimeEvents.productsUnit.create,
            RealtimeEvents.productsUnit.update,
            RealtimeEvents.productsUnit.delete,
        ],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => {
            refreshSetupMetadata();
            void fetchProducts({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreateProducts) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มสินค้า');
            return;
        }
        if (!setupState.isReady) {
            message.warning(getSetupMissingMessage(categories, units));
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการสินค้า...');
        router.push('/pos/products/manage/add');
    };

    const handleEdit = (product: Products) => {
        if (!canUpdateProducts) {
            message.warning('คุณไม่มีสิทธิ์แก้ไขสินค้า');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขสินค้า...');
        router.push(`/pos/products/manage/edit/${product.id}`);
    };

    const handleDelete = (product: Products) => {
        if (!canDeleteProducts) {
            message.warning('คุณไม่มีสิทธิ์ลบสินค้า');
            return;
        }

        Modal.confirm({
            title: 'ยืนยันการลบสินค้า',
            content: `คุณต้องการลบสินค้า "${product.display_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                setDeletingId(product.id);
                try {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/products/delete/${product.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken,
                        },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบสินค้าได้');
                    }

                    const shouldMoveToPreviousPage = page > 1 && products.length === 1;
                    setProducts((prev) => prev.filter((item) => item.id !== product.id));
                    setTotal((prev) => Math.max(prev - 1, 0));
                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchProducts({ background: true });
                    }
                    message.success(`ลบสินค้า "${product.display_name}" สำเร็จ`);
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบสินค้าได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (product: Products, next: boolean) => {
        if (!canUpdateProducts) {
            message.warning('คุณไม่มีสิทธิ์เปลี่ยนสถานะสินค้า');
            return;
        }

        setUpdatingStatusId(product.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/products/update/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({ is_active: next }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะสินค้าได้');
            }

            const updated = await response.json();
            setProducts((prev) => prev.map((item) => (item.id === product.id ? updated : item)));
            void fetchProducts({ background: true });
            message.success(next ? 'เปิดใช้งานสินค้าแล้ว' : 'ปิดใช้งานสินค้าแล้ว');
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะสินค้าได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    const isMetadataLoading = isLoadingCategories || isLoadingUnits;

    if (!isMetadataLoading && !setupState.isReady && products.length === 0) {
        return (
            <div className="products-page" style={pageStyles.container}>
                <style>{globalStyles}</style>

                <UIPageHeader
                    title="สินค้า"
                    subtitle="ตั้งค่าระบบก่อนเพิ่มสินค้า"
                    icon={<ShopOutlined />}
                    actions={
                        <Space size={10} wrap>
                            <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchProducts({ background: false })}>
                                รีเฟรช
                            </Button>
                            <Button type="primary" icon={<PlusOutlined />} disabled>
                                เพิ่มสินค้า
                            </Button>
                        </Space>
                    }
                />

                <PageContainer>
                    <PageStack>
                        <UIEmptyState
                            title="ยังไม่พร้อมเพิ่มสินค้า"
                            description={getSetupMissingMessage(categories, units)}
                            action={
                                <Space size={10} wrap>
                                    {!setupState.hasCategories ? (
                                        <Button type="primary" onClick={() => router.push('/pos/category')}>
                                            เพิ่มหมวดหมู่
                                        </Button>
                                    ) : null}
                                    {!setupState.hasUnits ? (
                                        <Button type="primary" onClick={() => router.push('/pos/productsUnit')}>
                                            เพิ่มหน่วยสินค้า
                                        </Button>
                                    ) : null}
                                </Space>
                            }
                        />
                    </PageStack>
                </PageContainer>
            </div>
        );
    }

    return (
        <div className="products-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="สินค้า"
                icon={<ShopOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchProducts({ background: products.length > 0 })}>
                        </Button>
                        {canCreateProducts ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!setupState.isReady}>
                                เพิ่มสินค้า
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    {!isMetadataLoading && !setupState.isReady ? (
                        <PageSection title="ข้อมูลอ้างอิงยังไม่ครบ">
                            <Alert
                                type="warning"
                                showIcon
                                message="ยังเพิ่มสินค้าใหม่ไม่ได้"
                                description={getSetupMissingMessage(categories, units)}
                                action={
                                    <Space wrap size={8}>
                                        {!setupState.hasCategories ? (
                                            <Button size="small" onClick={() => router.push('/pos/category')}>
                                                จัดการหมวดหมู่
                                            </Button>
                                        ) : null}
                                        {!setupState.hasUnits ? (
                                            <Button size="small" onClick={() => router.push('/pos/productsUnit')}>
                                                จัดการหน่วยสินค้า
                                            </Button>
                                        ) : null}
                                    </Space>
                                }
                            />
                        </PageSection>
                    ) : null}

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
                                <ModalSelector<string>
                                    title="เลือกหมวดหมู่"
                                    options={[
                                        { label: 'ทุกหมวดหมู่', value: 'all' },
                                        ...categories.map((category) => ({ label: category.display_name, value: category.id })),
                                    ]}
                                    value={filters.category_id}
                                    onChange={(value) => updateFilter('category_id', value)}
                                    style={{ minWidth: 140 }}
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
                        title="รายการสินค้า"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{total} รายการ</span>
                            </Space>
                        }
                    >
                        {loading && products.length === 0 ? (
                            <PageState status="loading"/>
                        ) : error && products.length === 0 ? (
                            <PageState
                                status="error"
                                title="โหลดข้อมูลสินค้าไม่สำเร็จ"
                                error={error}
                                onRetry={() => void fetchProducts()}
                            />
                        ) : products.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        canUpdate={canUpdateProducts}
                                        canDelete={canDeleteProducts}
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
                                        activeColor="#4F46E5"
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบสินค้าตามคำค้น' : 'ยังไม่มีสินค้า'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง แล้วค้นหาอีกครั้ง'
                                        : 'เพิ่มสินค้าแรกเพื่อเริ่มใช้งานการขายในหน้า POS'
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}

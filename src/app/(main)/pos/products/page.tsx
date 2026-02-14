'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useRealtimeList, useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { readCache, writeCache } from '../../../../utils/pos/cache';
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
import { useDebouncedValue } from '../../../../utils/useDebouncedValue';
import type { CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT, parseCreatedSort } from '../../../../lib/list-sort';
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { StatsGroup } from "../../../../components/ui/card/StatsGroup";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import { SearchBar } from "../../../../components/ui/page/SearchBar";

const { Text } = Typography;

const PAGE_SIZE = 50;

type StatusFilter = 'all' | 'active' | 'inactive';

type CachedProducts = {
    items: Products[];
    total: number;
    page: number;
    last_page: number;
    active_total?: number;
};

interface ProductCardProps {
    product: Products;
    onEdit: (product: Products) => void;
    onDelete: (product: Products) => void;
    onToggleActive: (product: Products, next: boolean) => void;
    updatingStatusId: string | null;
}

const ProductCard = ({ product, onEdit, onDelete, onToggleActive, updatingStatusId }: ProductCardProps) => {
    return (
        <div
            className="product-card"
            style={{
                ...pageStyles.productCard(product.is_active),
                borderRadius: 16,
            }}
            onClick={() => onEdit(product)}
        >
            <div className="product-card-inner" style={pageStyles.productCardInner}>
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    border: '1px solid #F1F5F9',
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#F8FAFC',
                    flexShrink: 0,
                }}>
                    {product.img_url ? (
                        <Image
                            src={product.img_url}
                            alt={product.display_name || product.product_name}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="64px"
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)'
                        }}>
                            <ShopOutlined style={{ fontSize: 20, color: '#4F46E5' }} />
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: product.display_name }}>
                            {product.display_name}
                        </Text>
                        <Tag color={product.is_active ? 'green' : 'default'}>
                            {product.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 6 }} ellipsis={{ tooltip: product.product_name }}>
                        {product.product_name}
                    </Text>
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
                    </Space>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={product.is_active}
                        loading={updatingStatusId === product.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            onToggleActive(product, checked);
                        }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(product);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#4F46E5',
                            background: '#EEF2FF',
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
                            onDelete(product);
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

export default function ProductsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isUrlReadyRef = useRef(false);
    const [products, setProducts] = useState<Products[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [activeProductsTotal, setActiveProductsTotal] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const debouncedSearch = useDebouncedValue(searchText, 300);

    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();

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

    const refreshSetupMetadata = useCallback(() => {
        void refetchCategories();
        void refetchUnits();
    }, [refetchCategories, refetchUnits]);

    const setupState = useMemo(() => {
        const baseState = checkProductSetupState(categories, units);
        if (baseState.isReady) return baseState;

        // Fallback: if products already reference category/unit, setup should be treated as ready immediately.
        const hasCategoriesFromProducts = products.some((item) => Boolean(item.category_id));
        const hasUnitsFromProducts = products.some((item) => Boolean(item.unit_id));

        const hasCategories = baseState.hasCategories || hasCategoriesFromProducts;
        const hasUnits = baseState.hasUnits || hasUnitsFromProducts;
        const isReady = hasCategories && hasUnits;

        return {
            ...baseState,
            hasCategories,
            hasUnits,
            isReady,
            missingFields: [
                !hasCategories && "หมวดหมู่สินค้า",
                !hasUnits && "หน่วยสินค้า",
            ].filter(Boolean) as string[],
        };
    }, [categories, units, products]);

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        if (isUrlReadyRef.current) return;

        const pageParam = Number(searchParams.get('page') || '1');
        const qParam = searchParams.get('q') || '';
        const statusParam = searchParams.get('status');
        const categoryParam = searchParams.get('category_id');
        const sortParam = searchParams.get('sort_created');

        const nextStatus: StatusFilter =
            statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';

        setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
        setSearchText(qParam);
        setStatusFilter(nextStatus);
        setCategoryFilter(categoryParam || 'all');
        setCreatedSort(parseCreatedSort(sortParam));
        isUrlReadyRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!isUrlReadyRef.current) return;
        const params = new URLSearchParams();
        if (page > 1) params.set('page', String(page));
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (categoryFilter !== 'all') params.set('category_id', categoryFilter);
        if (createdSort !== DEFAULT_CREATED_SORT) params.set('sort_created', createdSort);

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [router, pathname, page, debouncedSearch, statusFilter, categoryFilter, createdSort]);

    useEffect(() => {
        if (createdSort !== DEFAULT_CREATED_SORT) return;
        const cached = readCache<CachedProducts>('pos:products:v3', 10 * 60 * 1000);
        if (cached?.items) {
            setProducts(cached.items);
            setTotalProducts(cached.total || cached.items.length);
            setPage(cached.page || 1);
            setLastPage(cached.last_page || 1);
            setActiveProductsTotal(typeof cached.active_total === 'number' ? cached.active_total : null);
        }
    }, [createdSort]);

    const fetchProducts = useCallback(async () => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', PAGE_SIZE.toString());
            if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
            if (statusFilter === 'active') params.set('is_active', 'true');
            if (statusFilter === 'inactive') params.set('is_active', 'false');
            if (categoryFilter !== 'all') params.set('category_id', categoryFilter);
            params.set('sort_created', createdSort);

            const activeParams = new URLSearchParams();
            activeParams.set('page', '1');
            activeParams.set('limit', '1');
            activeParams.set('is_active', 'true');
            if (categoryFilter !== 'all') activeParams.set('category_id', categoryFilter);
            activeParams.set('sort_created', createdSort);

            const [listResponse, activeResponse] = await Promise.all([
                fetch(`/api/pos/products?${params.toString()}`),
                fetch(`/api/pos/products?${activeParams.toString()}`),
            ]);

            if (!listResponse.ok) {
                const errorData = await listResponse.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลสินค้าได้');
            }
            if (!activeResponse.ok) {
                const errorData = await activeResponse.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงจำนวนสินค้าได้');
            }

            const listData = await listResponse.json();
            const activeData = await activeResponse.json();

            const list: Products[] = Array.isArray(listData.data) ? listData.data : [];
            const total = typeof listData.total === 'number' ? listData.total : list.length;
            const currentPage = typeof listData.page === 'number' ? listData.page : page;
            const last = typeof listData.last_page === 'number' ? listData.last_page : 1;
            const activeTotal = typeof activeData.total === 'number' ? activeData.total : null;

            setProducts(list);
            setTotalProducts(total);
            setPage(currentPage);
            setLastPage(last);
            setActiveProductsTotal(activeTotal);

            if (!debouncedSearch.trim() && statusFilter === 'all' && categoryFilter === 'all' && createdSort === DEFAULT_CREATED_SORT && page === 1) {
                writeCache('pos:products:v3', {
                    items: list,
                    total,
                    page: currentPage,
                    last_page: last,
                    active_total: activeTotal ?? undefined,
                });
            }
        }, 'กำลังโหลดข้อมูลสินค้า...');
    }, [execute, page, debouncedSearch, statusFilter, categoryFilter, createdSort]);

    useEffect(() => {
        if (!isAuthorized) return;
        refreshSetupMetadata();
    }, [isAuthorized, refreshSetupMetadata]);

    useEffect(() => {
        if (!isAuthorized) return;
        fetchProducts();
    }, [isAuthorized, fetchProducts]);

    useRealtimeRefresh({
        socket,
        events: [RealtimeEvents.products.create, RealtimeEvents.products.update, RealtimeEvents.products.delete],
        onRefresh: fetchProducts,
        enabled: isAuthorized,
        debounceMs: 400,
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
        onRefresh: refreshSetupMetadata,
        enabled: isAuthorized,
        debounceMs: 200,
    });

    useRealtimeList(
        socket,
        { create: RealtimeEvents.categories.create, update: RealtimeEvents.categories.update, delete: RealtimeEvents.categories.delete },
        () => fetchProducts()
    );

    const fetchMoreProducts = useCallback(async () => {
        if (isLoadingMore || page >= lastPage) return;

        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const params = new URLSearchParams();
            params.set('page', nextPage.toString());
            params.set('limit', PAGE_SIZE.toString());
            if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
            if (statusFilter === 'active') params.set('is_active', 'true');
            if (statusFilter === 'inactive') params.set('is_active', 'false');
            if (categoryFilter !== 'all') params.set('category_id', categoryFilter);
            params.set('sort_created', createdSort);

            const response = await fetch(`/api/pos/products?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'โหลดข้อมูลเพิ่มไม่สำเร็จ');
            }

            const data = await response.json();
            const incoming: Products[] = Array.isArray(data.data) ? data.data : [];
            const total = typeof data.total === 'number' ? data.total : totalProducts;
            const currentPage = typeof data.page === 'number' ? data.page : nextPage;
            const last = typeof data.last_page === 'number' ? data.last_page : lastPage;

            setProducts((prev) => {
                const map = new Map(prev.map((item) => [item.id, item]));
                incoming.forEach((item) => map.set(item.id, item));
                return Array.from(map.values());
            });
            setTotalProducts(total);
            setPage(currentPage);
            setLastPage(last);
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'โหลดข้อมูลเพิ่มไม่สำเร็จ');
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, page, lastPage, debouncedSearch, statusFilter, categoryFilter, createdSort, totalProducts]);

    const handleAdd = () => {
        showLoading('กำลังเปิดหน้าจัดการสินค้า...');
        router.push('/pos/products/manage/add');
    };

    const handleEdit = (product: Products) => {
        showLoading('กำลังเปิดหน้าแก้ไขสินค้า...');
        router.push(`/pos/products/manage/edit/${product.id}`);
    };

    const handleDelete = (product: Products) => {
        Modal.confirm({
            title: 'ยืนยันการลบสินค้า',
            content: `คุณต้องการลบสินค้า "${product.display_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/products/delete/${product.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบสินค้าได้');
                    setProducts((prev) => prev.filter((item) => item.id !== product.id));
                    setTotalProducts((prev) => Math.max(prev - 1, 0));
                    message.success(`ลบสินค้า "${product.display_name}" สำเร็จ`);
                }, 'กำลังลบสินค้า...');
            },
        });
    };

    const handleToggleActive = async (product: Products, next: boolean) => {
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
            setProducts((prev) => prev.map((item) => item.id === product.id ? updated : item));
            message.success(next ? 'เปิดใช้งานสินค้าแล้ว' : 'ปิดใช้งานสินค้าแล้ว');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะสินค้าได้');
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

    const activeCount = activeProductsTotal ?? products.filter((item) => item.is_active).length;
    const inactiveCount = Math.max((totalProducts || products.length) - activeCount, 0);
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
                        <Space size={8} wrap>
                            <Button icon={<ReloadOutlined />} onClick={fetchProducts} />
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
                                        <Button type="primary" onClick={() => router.push('/pos/category')}>เพิ่มหมวดหมู่</Button>
                                    ) : null}
                                    {!setupState.hasUnits ? (
                                        <Button type="primary" onClick={() => router.push('/pos/productsUnit')}>เพิ่มหน่วยสินค้า</Button>
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
                subtitle={`ทั้งหมด ${totalProducts || products.length} รายการ`}
                icon={<ShopOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ReloadOutlined />} onClick={fetchProducts} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!setupState.isReady}>
                            เพิ่มสินค้า
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    {!isMetadataLoading && !setupState.isReady && products.length > 0 ? (
                        <PageSection title="ต้องตั้งค่าก่อนเพิ่มสินค้า">
                            <Alert
                                message="ข้อมูลอ้างอิงยังไม่ครบ"
                                description={getSetupMissingMessage(categories, units)}
                                type="warning"
                                showIcon
                            />
                        </PageSection>
                    ) : null}

                    <StatsGroup
                        stats={[
                            { label: 'ทั้งหมด', value: totalProducts || products.length, color: '#0f172a' },
                            { label: 'ใช้งาน', value: activeCount, color: '#0f766e' },
                            { label: 'ปิดใช้งาน', value: inactiveCount, color: '#b91c1c' },
                        ]}
                    />

                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหาจากชื่อสินค้า ชื่อแสดง หรือคำค้นอื่น..."
                            value={searchText}
                            onChange={(val) => {
                                setPage(1);
                                setSearchText(val);
                            }}
                        />
                        <ModalSelector<StatusFilter>
                            title="เลือกสถานะ"
                            options={[
                                { label: 'ทุกสถานะ', value: 'all' },
                                { label: 'ใช้งาน', value: 'active' },
                                { label: 'ปิดใช้งาน', value: 'inactive' },
                            ]}
                            value={statusFilter}
                            onChange={(value) => {
                                setPage(1);
                                setStatusFilter(value);
                            }}
                            style={{ minWidth: 120 }}
                        />
                        <ModalSelector<string>
                            title="เลือกหมวดหมู่"
                            options={[
                                { label: 'ทุกหมวดหมู่', value: 'all' },
                                ...categories.map(c => ({ label: c.display_name, value: c.id }))
                            ]}
                            value={categoryFilter}
                            onChange={(value) => {
                                setPage(1);
                                setCategoryFilter(value);
                            }}
                            style={{ minWidth: 120 }}
                        />
                        <ModalSelector<CreatedSort>
                            title="เรียงลำดับ"
                            options={[
                                { label: 'เก่าก่อน', value: 'old' },
                                { label: 'ใหม่ก่อน', value: 'new' },
                            ]}
                            value={createdSort}
                            onChange={(value) => {
                                setPage(1);
                                setCreatedSort(value);
                            }}
                            style={{ minWidth: 120 }}
                        />
                    </SearchBar>

                    <PageSection
                        title="รายการสินค้า"
                        extra={<span style={{ fontWeight: 600 }}>{products.length}</span>}
                    >
                        {products.length > 0 ? (
                            <>
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                        updatingStatusId={updatingStatusId}
                                    />
                                ))}

                                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                                    {page < lastPage ? (
                                        <Button onClick={fetchMoreProducts} loading={isLoadingMore} style={{ borderRadius: 12 }}>
                                            โหลดเพิ่ม
                                        </Button>
                                    ) : (
                                        <Text type="secondary" style={{ fontSize: 12 }}>ไม่มีข้อมูลเพิ่มเติม</Text>
                                    )}
                                </div>
                            </>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบสินค้าตามคำค้น' : 'ยังไม่มีสินค้า'}
                                description={debouncedSearch.trim() ? 'ลองเปลี่ยนคำค้น หรือตัวกรอง' : 'เพิ่มสินค้าแรกเพื่อเริ่มใช้งาน'}
                                action={
                                    !debouncedSearch.trim() ? (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!setupState.isReady}>
                                            เพิ่มสินค้า
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

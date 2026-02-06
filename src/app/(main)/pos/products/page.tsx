'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { message, Modal, Typography, Tag, Button, Input, Alert, Space, Tooltip } from 'antd';
import Image from "next/image";
import { 
    ShopOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    SearchOutlined
} from '@ant-design/icons';
import { Products } from "../../../../types/api/pos/products";
import { Category } from "../../../../types/api/pos/category";
import { ProductsUnit } from "../../../../types/api/pos/productsUnit";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeList, useRealtimeRefresh } from "../../../../utils/pos/realtime";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { pageStyles, globalStyles } from '../../../../theme/pos/products/style';
import { useCategories } from '../../../../hooks/pos/useCategories';
import { useProductsUnit } from '../../../../hooks/pos/useProductsUnit';
import { formatPrice } from '../../../../utils/products/productDisplay.utils';
import { checkProductSetupState, getSetupMissingMessage } from '../../../../utils/products/productSetup.utils';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../../components/ui/states/EmptyState";

const { Text } = Typography;

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
}

const StatsCard = ({ totalProducts, activeProducts, inactiveProducts }: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#4F46E5' }}>{totalProducts}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, height: 24, background: '#f0f0f0', alignSelf: 'center' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#10B981' }}>{activeProducts}</span>
            <Text style={pageStyles.statLabel}>ใช้งาน</Text>
        </div>
        <div style={{ width: 1, height: 24, background: '#f0f0f0', alignSelf: 'center' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#F59E0B' }}>{inactiveProducts}</span>
            <Text style={pageStyles.statLabel}>ไม่ใช้งาน</Text>
        </div>
    </div>
);

// ============ PRODUCT CARD COMPONENT ============

interface ProductCardProps {
    product: Products;
    index: number;
    onEdit: (product: Products) => void;
    onDelete: (product: Products) => void;
}

const ProductCard = ({ product, index, onEdit, onDelete }: ProductCardProps) => {
    return (
        <div
            className="product-card"
            style={{
                ...pageStyles.productCard(product.is_active),
                animationDelay: `${index * 0.03}s`
            }}
            onClick={() => onEdit(product)}
        >
            <div className="product-card-inner" style={pageStyles.productCardInner}>
                {/* Image */}
                <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    border: '1px solid #F1F5F9',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#F8FAFC'
                }}>
                    {product.img_url ? (
                        <Image 
                            src={product.img_url} 
                            alt={product.display_name || product.product_name}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="72px"
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
                            <ShopOutlined style={{ fontSize: 24, color: '#6366F1', opacity: 0.8 }} />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, padding: '0 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ fontSize: 16, color: '#1E293B', flex: 1 }}
                            ellipsis
                        >
                            {product.display_name}
                        </Text>
                         {product.is_active ? (
                            <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#94A3B8', fontSize: 14 }} />
                        )}
                    </div>
                    
                    <Text 
                        type="secondary" 
                        style={{ fontSize: 13, display: 'block', marginBottom: 8, color: '#64748B' }}
                        ellipsis
                    >
                        {product.product_name}
                    </Text>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Tag 
                            style={{ 
                                borderRadius: 6, 
                                margin: 0,
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#059669',
                                background: '#ECFDF5',
                                border: 'none',
                                padding: '0 8px'
                            }}
                        >
                            {formatPrice(Number(product.price))}
                        </Tag>
                        {Number(product.price_delivery ?? product.price) !== Number(product.price) && (
                            <Tag
                                style={{
                                    borderRadius: 6,
                                    margin: 0,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#db2777',
                                    background: '#fdf2f8',
                                    border: 'none',
                                    padding: '0 8px'
                                }}
                            >
                                Delivery {formatPrice(Number(product.price_delivery ?? product.price))}
                            </Tag>
                        )}
                        {product.category?.display_name && (
                            <Tag 
                                style={{ 
                                    borderRadius: 6, 
                                    margin: 0,
                                    fontSize: 10,
                                    color: '#4F46E5',
                                    background: '#EEF2FF',
                                    border: 'none'
                                }}
                            >
                                {product.category.display_name}
                            </Tag>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(product);
                        }}
                        style={{
                            borderRadius: 12,
                            color: '#4F46E5',
                            background: '#F5F3FF',
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
                            borderRadius: 12,
                            background: '#FEF2F2',
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
    const [products, setProducts] = useState<Products[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [activeProductsTotal, setActiveProductsTotal] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchText, setSearchText] = useState("");
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ["Admin", "Manager"] });
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const initialLoadRef = useRef(false);
    
    // Metadata State
    const [categories, setCategories] = useState<Category[]>([]);
    const [units, setUnits] = useState<ProductsUnit[]>([]);

    // Fetch initial metadata
    const { data: initialCategories = [], isLoading: isLoadingCategories } = useCategories();
    const { data: initialUnits = [], isLoading: isLoadingUnits } = useProductsUnit();

    // Sync initial metadata to local state
    useEffect(() => {
        if (initialCategories.length > 0) setCategories(initialCategories);
    }, [initialCategories]);

    useEffect(() => {
        if (initialUnits.length > 0) setUnits(initialUnits);
    }, [initialUnits]);


    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    // Initial Cache Read
    useEffect(() => {
        const cachedV2 = readCache<{
            items: Products[];
            total?: number;
            last_page?: number;
            active_total?: number;
        }>("pos:products:v2", 10 * 60 * 1000);

        if (cachedV2?.items && Array.isArray(cachedV2.items)) {
            setProducts(cachedV2.items);
            setTotalProducts(typeof cachedV2.total === "number" ? cachedV2.total : cachedV2.items.length);
            setPage(1);
            setLastPage(typeof cachedV2.last_page === "number" ? cachedV2.last_page : 1);
            setActiveProductsTotal(typeof cachedV2.active_total === "number" ? cachedV2.active_total : null);
            return;
        }

        const cached = readCache<Products[]>("pos:products", 10 * 60 * 1000);
        if (cached && Array.isArray(cached)) {
            setProducts(cached);
            setTotalProducts(cached.length);
            setPage(1);
            setLastPage(1);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        execute(async () => {
            // Fetch paginated products (server-side search)
            const params = new URLSearchParams();
            params.set("page", "1");
            params.set("limit", PAGE_SIZE.toString());
            if (searchText.trim()) params.set("q", searchText.trim());

            const activeParams = new URLSearchParams(params);
            activeParams.set("limit", "1");
            activeParams.set("is_active", "true");

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

            const data = await listResponse.json();
            const activeData = await activeResponse.json();
            const list: Products[] = data.data || [];
            const total = typeof data.total === "number" ? data.total : list.length;
            const currentPage = typeof data.page === "number" ? data.page : 1;
            const last = typeof data.last_page === "number" ? data.last_page : 1;

            setProducts(list);
            setTotalProducts(total);
            setPage(currentPage);
            setLastPage(last);
            setActiveProductsTotal(typeof activeData.total === "number" ? activeData.total : null);

            if (!searchText.trim()) {
                writeCache("pos:products:v2", {
                    items: list,
                    total,
                    last_page: last,
                    active_total: typeof activeData.total === "number" ? activeData.total : undefined,
                });
            }
        }, 'กำลังโหลดข้อมูลสินค้า...');
    }, [execute, searchText]);

    useEffect(() => {
        if (!isAuthorized) return;

        if (!initialLoadRef.current) {
            initialLoadRef.current = true;
            fetchProducts();
            return;
        }

        const timer = setTimeout(() => {
            fetchProducts();
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [isAuthorized, fetchProducts, searchText]);

    useRealtimeRefresh({
        socket,
        events: [RealtimeEvents.products.create, RealtimeEvents.products.update, RealtimeEvents.products.delete],
        onRefresh: fetchProducts,
        enabled: isAuthorized,
        debounceMs: 400,
    });

    const fetchMoreProducts = useCallback(async () => {
        if (isLoadingMore) return;
        if (page >= lastPage) return;

        setIsLoadingMore(true);
        try {
            const q = searchText.trim();
            const nextPage = page + 1;
            const params = new URLSearchParams();
            params.set("page", nextPage.toString());
            params.set("limit", PAGE_SIZE.toString());
            if (q) params.set("q", q);

            const response = await fetch(`/api/pos/products?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "โหลดข้อมูลเพิ่มเติมไม่สำเร็จ");
            }

            const data = await response.json();
            const incoming: Products[] = data.data || [];
            const total = typeof data.total === "number" ? data.total : totalProducts;
            const currentPage = typeof data.page === "number" ? data.page : nextPage;
            const last = typeof data.last_page === "number" ? data.last_page : lastPage;

            setProducts((prev) => {
                if (incoming.length === 0) return prev;
                const indexById = new Map(prev.map((p, idx) => [p.id, idx]));
                const next = [...prev];
                for (const item of incoming) {
                    const idx = indexById.get(item.id);
                    if (idx === undefined) {
                        next.push(item);
                    } else {
                        next[idx] = item;
                    }
                }
                return next;
            });

            setTotalProducts(total);
            setPage(currentPage);
            setLastPage(last);
        } catch (err) {
            message.error(err instanceof Error ? err.message : "โหลดข้อมูลเพิ่มเติมไม่สำเร็จ");
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, page, lastPage, searchText, totalProducts]);

    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry?.isIntersecting) return;
                fetchMoreProducts();
            },
            { root: null, rootMargin: "400px 0px", threshold: 0 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [fetchMoreProducts]);


    // Real-time Metadata Updates
    useRealtimeList(
        socket,
        { create: RealtimeEvents.categories.create, update: RealtimeEvents.categories.update, delete: RealtimeEvents.categories.delete },
        setCategories
    );

    useRealtimeList(
        socket,
        { create: RealtimeEvents.productsUnit.create, update: RealtimeEvents.productsUnit.update, delete: RealtimeEvents.productsUnit.delete },
        setUnits
    );

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleAdd = () => {
        showLoading("กำลังเปิดหน้าจัดการสินค้า...");
        router.push('/pos/products/manage/add');
    };

    const handleEdit = (product: Products) => {
        showLoading("กำลังเปิดหน้าแก้ไขสินค้า...");
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
            maskClosable: true,
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/products/delete/${product.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบสินค้าได้');
                    }
                    message.success(`ลบสินค้า "${product.display_name}" สำเร็จ`);
                }, "กำลังลบสินค้า...");
            },
        });
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    const activeCount = activeProductsTotal ?? products.filter((p) => p.is_active).length;
    const inactiveCount = Math.max((totalProducts || products.length) - activeCount, 0);

    // Initial Setup Check using Utility
    const setupState = checkProductSetupState(categories, units);
    const hasMetadata = setupState.isReady;
    const isMetadataLoading = isLoadingCategories || isLoadingUnits;

    if (!isMetadataLoading && !hasMetadata && products.length === 0) {
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
                            <Tooltip title="ต้องเพิ่มหมวดหมู่สินค้าและหน่วยสินค้าก่อน">
                                <Button type="primary" icon={<PlusOutlined />} disabled>
                                    เพิ่มสินค้า
                                </Button>
                            </Tooltip>
                        </Space>
                    }
                />

                <PageContainer>
                    <PageStack>
                        <UIEmptyState
                            title="ยังไม่พร้อมเพิ่มสินค้า"
                            description={getSetupMissingMessage(categories, units)}
                            action={
                                <Space size={12} wrap>
                                    {!setupState.hasCategories && (
                                        <Button type="primary" onClick={() => router.push("/pos/category")}>
                                            เพิ่มหมวดหมู่สินค้า
                                        </Button>
                                    )}
                                    {!setupState.hasUnits && (
                                        <Button type="primary" onClick={() => router.push("/pos/productsUnit")}>
                                            เพิ่มหน่วยสินค้า
                                        </Button>
                                    )}
                                    <Tooltip title="ต้องเพิ่มหมวดหมู่สินค้าและหน่วยสินค้าก่อน">
                                        <Button type="primary" icon={<PlusOutlined />} disabled>
                                            เพิ่มสินค้า
                                        </Button>
                                    </Tooltip>
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
            <style jsx global>{`
                .search-input-placeholder-white input::placeholder {
                    color: rgba(255, 255, 255, 0.6) !important;
                }
                .search-input-placeholder-white input {
                    color: white !important;
                }
                .product-card {
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                    content-visibility: auto;
                    contain-intrinsic-size: 160px 120px;
                }
            `}</style>
            
            {/* Header */}
            <UIPageHeader
                title="สินค้า"
                subtitle={`${totalProducts || products.length} รายการ`}
                icon={<ShopOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            allowClear
                            placeholder="ค้นหาสินค้า (ชื่อ, หมวดหมู่)..."
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ minWidth: 240 }}
                        />
                        <Button icon={<ReloadOutlined />} onClick={fetchProducts} />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            disabled={!hasMetadata}
                        >
                            เพิ่มสินค้า
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    {!isMetadataLoading && !hasMetadata && products.length > 0 && (
                        <PageSection title="ต้องตั้งค่าก่อนเพิ่มสินค้า">
                            <Alert
                                message="ยังตั้งค่าระบบไม่ครบ"
                                description={getSetupMissingMessage(categories, units)}
                                type="warning"
                                showIcon
                                action={
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {!setupState.hasCategories && (
                                            <Button size="small" type="primary" ghost onClick={() => router.push("/pos/category")}> 
                                                เพิ่มหมวดหมู่
                                            </Button>
                                        )}
                                        {!setupState.hasUnits && (
                                            <Button size="small" type="primary" ghost onClick={() => router.push("/pos/productsUnit")}> 
                                                เพิ่มหน่วยสินค้า
                                            </Button>
                                        )}
                                    </div>
                                }
                            />
                        </PageSection>
                    )}

                    <StatsCard
                        totalProducts={totalProducts || products.length}
                        activeProducts={activeCount}
                        inactiveProducts={inactiveCount}
                    />

                    <PageSection
                        title="รายการสินค้า"
                        extra={
                            <span style={{ fontWeight: 600 }}>
                                {totalProducts ? `${products.length}/${totalProducts}` : products.length}
                            </span>
                        }
                    >
                        {products.length > 0 ? (
                            <>
                                {products.map((product, index) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        index={index}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}

                                <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 4px" }}>
                                    {page < lastPage ? (
                                        <Button
                                            onClick={fetchMoreProducts}
                                            loading={isLoadingMore}
                                            style={{ borderRadius: 12 }}
                                        >
                                            โหลดเพิ่ม
                                        </Button>
                                    ) : (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            ไม่มีสินค้าเพิ่มเติม
                                        </Text>
                                    )}
                                </div>
                                <div ref={loadMoreRef} style={{ height: 1 }} />
                            </>
                        ) : (
                            <UIEmptyState
                                title={
                                    searchText.trim()
                                        ? "ไม่พบสินค้าที่ค้นหา"
                                        : "ยังไม่มีสินค้า"
                                }
                                description={
                                    searchText.trim()
                                        ? "ลองค้นหาด้วยคำอื่นหรือล้างการค้นหา"
                                        : "เพิ่มสินค้ารายการแรกเพื่อเริ่มต้นขาย"
                                }
                                action={
                                    !searchText.trim() ? (
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={handleAdd}
                                            disabled={!hasMetadata}
                                        >
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

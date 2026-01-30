'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography, Tag, Button, Empty, Input, Alert } from 'antd';
import Image from "next/image";
import { 
    ShopOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled
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
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { pageStyles, globalStyles } from '../../../../theme/pos/products/style';
import { useCategories } from '@/hooks/pos/useCategories';
import { useProductsUnit } from '@/hooks/pos/useProductsUnit';
import { formatPrice } from '@/utils/products/productDisplay.utils';
import { checkProductSetupState, getSetupMissingMessage } from '@/utils/products/productSetup.utils';

const { Text, Title } = Typography;

// ============ HEADER COMPONENT ============

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
    disabledAdd?: boolean;
}

const PageHeader = ({ onRefresh, onAdd, searchValue, onSearchChange, disabledAdd }: HeaderProps) => (
    <div style={pageStyles.header}>
        <div style={pageStyles.headerDecoCircle1} />
        <div style={pageStyles.headerDecoCircle2} />
        
        <div style={pageStyles.headerContent}>
            <div style={pageStyles.headerLeft}>
                <div style={pageStyles.headerIconBox}>
                    <ShopOutlined style={{ fontSize: 24, color: 'white' }} />
                </div>
                <div>
                    <Text style={{ 
                        color: 'rgba(255,255,255,0.85)', 
                        fontSize: 13,
                        display: 'block'
                    }}>
                        จัดการข้อมูล
                    </Text>
                    <Title level={4} style={{ 
                        color: 'white', 
                        margin: 0,
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                    }}>
                        สินค้า
                    </Title>
                </div>
        </div>
        <div style={pageStyles.headerActions}>
            <Input
                allowClear
                placeholder="ค้นหาสินค้า..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ width: 240, borderRadius: 10 }}
            />
            <Button
                type="text"
                icon={<ReloadOutlined style={{ color: 'white' }} />}
                    onClick={onRefresh}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        height: 40,
                        width: 40
                    }}
                />
                {!disabledAdd && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={onAdd}
                        style={{
                            background: 'white',
                            color: '#1890ff',
                            borderRadius: 12,
                            height: 40,
                            fontWeight: 600,
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                    >
                        เพิ่มสินค้า
                    </Button>
                )}
            </div>
        </div>
    </div>
);

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
}

const StatsCard = ({ totalProducts, activeProducts, inactiveProducts }: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#1890ff' }}>{totalProducts}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#52c41a' }}>{activeProducts}</span>
            <Text style={pageStyles.statLabel}>ใช้งาน</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#ff4d4f' }}>{inactiveProducts}</span>
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
        >
            <div style={pageStyles.productCardInner}>
                {/* Image */}
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    border: '2px solid #f0f0f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {product.img_url ? (
                        <Image 
                            src={product.img_url} 
                            alt={product.product_name}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="64px"
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ShopOutlined style={{ fontSize: 24, color: '#1890ff', opacity: 0.5 }} />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ fontSize: 16, color: '#1a1a2e' }}
                            ellipsis={{ tooltip: product.display_name }}
                        >
                            {product.display_name}
                        </Text>
                        {product.is_active ? (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                        )}
                    </div>
                    <Text 
                        type="secondary" 
                        style={{ fontSize: 13, display: 'block', marginBottom: 6 }}
                        ellipsis={{ tooltip: product.product_name }}
                    >
                        {product.product_name}
                    </Text>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Tag 
                            color="green" 
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {formatPrice(Number(product.price))}
                        </Tag>
                        <Tag 
                            color="blue" 
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {product.category?.display_name || '-'}
                        </Tag>
                        <Tag 
                            color="cyan" 
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {product.unit?.display_name || '-'}
                        </Tag>
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
                            borderRadius: 10,
                            color: '#1890ff',
                            background: '#e6f7ff'
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
                            background: '#fff2f0'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

// ============ EMPTY STATE COMPONENT ============

const EmptyState = ({ onAdd, showAdd = true }: { onAdd: () => void, showAdd?: boolean }) => (
    <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
            <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 15 }}>
                    ยังไม่มีสินค้า
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    เริ่มต้นเพิ่มสินค้าแรกของคุณ
                </Text>
            </div>
        }
        style={{
            padding: '60px 20px',
            background: 'white',
            borderRadius: 20,
            margin: '0 16px'
        }}
    >
        {showAdd && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
                เพิ่มสินค้า
            </Button>
        )}
    </Empty>
);

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Products[]>([]);
    const [searchValue, setSearchValue] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });
    
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

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchValue.trim());
        }, 400);
        return () => clearTimeout(handler);
    }, [searchValue]);

    useEffect(() => {
        if (debouncedSearch) return;
        const cached = readCache<Products[]>("pos:products", 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setProducts(cached);
        }
    }, [debouncedSearch]);

    const fetchProducts = useCallback(async (query?: string) => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set("page", "1");
            params.set("limit", "200");
            if (query) params.set("q", query);
            const response = await fetch(`/api/pos/products?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลสินค้าได้');
            }
            const data = await response.json();
            setProducts(data.data || []);
        }, 'กำลังโหลดข้อมูลสินค้า...');
    }, [execute]);

    useEffect(() => {
        if (isAuthorized) {
            fetchProducts(debouncedSearch || undefined);
        }
    }, [isAuthorized, fetchProducts, debouncedSearch]);

    const normalizedQuery = debouncedSearch.trim().toLowerCase();
    const shouldIncludeProduct = useCallback((item: Products) => {
        if (!normalizedQuery) return true;
        const haystack = `${item.display_name || ""} ${item.product_name || ""} ${item.description || ""}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    }, [normalizedQuery]);

    useRealtimeList(
        socket,
        { create: "products:create", update: "products:update", delete: "products:delete" },
        setProducts,
        (item) => item.id,
        shouldIncludeProduct
    );

    // Real-time Metadata Updates
    useRealtimeList(
        socket,
        { create: "category:create", update: "category:update", delete: "category:delete" },
        setCategories,
        (item) => item.id
    );

    useRealtimeList(
        socket,
        { create: "productsUnit:create", update: "productsUnit:update", delete: "productsUnit:delete" },
        setUnits,
        (item) => item.id
    );

    useEffect(() => {
        if (!debouncedSearch && products.length > 0) {
            writeCache("pos:products", products);
        }
    }, [products, debouncedSearch]);

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
        return (
            <div style={{ 
                display: 'flex', 
                height: '100vh', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column', 
                gap: 16 
            }}>
                <Spin size="large" />
                <Text type="secondary">กำลังตรวจสอบสิทธิ์การใช้งาน...</Text>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div style={{ 
                display: 'flex', 
                height: '100vh', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column', 
                gap: 16 
            }}>
                <Spin size="large" />
                <Text type="danger">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ...</Text>
            </div>
        );
    }

    const activeProducts = products.filter(p => p.is_active);
    const inactiveProducts = products.filter(p => !p.is_active);

    // Initial Setup Check using Utility
    const setupState = checkProductSetupState(categories, units);
    const hasMetadata = setupState.isReady;
    const isMetadataLoading = isLoadingCategories || isLoadingUnits;

    if (!isMetadataLoading && !hasMetadata && products.length === 0) {
        return (
            <div className="products-page" style={pageStyles.container}>
                <style>{globalStyles}</style>
                <PageHeader 
                    onRefresh={() => fetchProducts(debouncedSearch || undefined)}
                    onAdd={handleAdd}
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    disabledAdd={!hasMetadata}
                />
                <div style={{ ...pageStyles.listContainer, padding: '40px 20px' }}>
                    <div style={{ 
                        background: '#fff', 
                        borderRadius: 24, 
                        padding: '80px 24px', 
                        textAlign: 'center',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                    }}>
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            imageStyle={{ height: 120 }}
                            description={
                                <div style={{ marginTop: 20 }}>
                                    <Title level={4} style={{ marginBottom: 8 }}>ยังไม่พร้อมเพิ่มสินค้า</Title>
                                    <Text type="secondary" style={{ fontSize: 16 }}>{getSetupMissingMessage(categories, units)}</Text>
                                </div>
                            }
                        >
                            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                                {!setupState.hasCategories && (
                                    <Button 
                                        type="primary" 
                                        size="large"
                                        onClick={() => router.push("/pos/category")}
                                        style={{ height: 45, borderRadius: 12, background: '#1890ff', border: 'none' }}
                                    >
                                        เพิ่มหมวดหมู่สินค้า
                                    </Button>
                                )}
                                {!setupState.hasUnits && (
                                    <Button 
                                        type="primary" 
                                        size="large"
                                        onClick={() => router.push("/pos/productsUnit")}
                                        style={{ height: 45, borderRadius: 12, background: '#52c41a', border: 'none' }}
                                    >
                                        เพิ่มหน่วยสินค้า
                                    </Button>
                                )}
                            </div>
                        </Empty>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="products-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={() => fetchProducts(debouncedSearch || undefined)}
                onAdd={handleAdd}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                disabledAdd={!hasMetadata}
            />

            {!isMetadataLoading && !hasMetadata && products.length > 0 && (
                <div style={{ margin: '0 16px 20px' }}>
                    <Alert
                        message="ตั้งค่าไม่สมบูรณ์"
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
                </div>
            )}
            
            {/* Stats Card */}
            <StatsCard 
                totalProducts={products.length}
                activeProducts={activeProducts.length}
                inactiveProducts={inactiveProducts.length}
            />

            {/* Products List */}
            <div style={pageStyles.listContainer}>
                {products.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <ShopOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการสินค้า
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {products.length} รายการ
                            </div>
                        </div>

                        {products.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                index={index}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </>
                ) : (
                    <EmptyState onAdd={handleAdd} showAdd={hasMetadata} />
                )}
            </div>
        </div>
    );
}

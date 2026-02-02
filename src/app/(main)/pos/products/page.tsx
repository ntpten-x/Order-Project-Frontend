'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Tag, Button, Empty, Input, Alert } from 'antd';
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
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { pageStyles, globalStyles } from '../../../../theme/pos/products/style';
import { useCategories } from '../../../../hooks/pos/useCategories';
import { useProductsUnit } from '../../../../hooks/pos/useProductsUnit';
import { formatPrice } from '../../../../utils/products/productDisplay.utils';
import { checkProductSetupState, getSetupMissingMessage } from '../../../../utils/products/productSetup.utils';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';

const { Text, Title } = Typography;

// ============ HEADER COMPONENT ============

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
    onSearch: (value: string) => void;
    disabledAdd?: boolean;
}

const PageHeader = ({ onRefresh, onAdd, onSearch, disabledAdd }: HeaderProps) => (
    <div style={pageStyles.header}>
        <div style={pageStyles.headerDecoCircle1} />
        <div style={pageStyles.headerDecoCircle2} />
        
        <div className="products-header-content" style={pageStyles.headerContent}>
            <div className="products-header-left" style={pageStyles.headerLeft}>
                <div style={pageStyles.headerIconBox}>
                    <ShopOutlined style={{ fontSize: 24, color: 'white' }} />
                </div>
                <div>
                    <Text style={{ 
                        color: 'rgba(255,255,255,0.85)', 
                        fontSize: 13,
                        display: 'block',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        จัดการข้อมูล
                    </Text>
                    <Title level={4} style={{ 
                        color: 'white', 
                        margin: 0,
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        สินค้า
                    </Title>
                </div>
            </div>
            
            <div className="products-header-actions" style={pageStyles.headerActions}>
                <Button
                    type="text"
                    icon={<ReloadOutlined style={{ color: 'white' }} />}
                    onClick={onRefresh}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 12,
                        height: 40,
                        width: 40,
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.3)'
                    }}
                />
                {!disabledAdd && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={onAdd}
                        style={{
                            background: 'white',
                            color: '#4F46E5',
                            borderRadius: 12,
                            height: 40,
                            fontWeight: 600,
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            flexShrink: 0
                        }}
                    >
                        <span className="products-add-btn-text">เพิ่มสินค้า</span>
                    </Button>
                )}
            </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: 24, padding: '0 4px' }}>
            <Input 
                prefix={<SearchOutlined style={{ color: '#fff', opacity: 0.7 }} />}
                placeholder="ค้นหาสินค้า (ชื่อ, บาร์โค้ด)..."
                onChange={(e) => onSearch(e.target.value)}
                bordered={false}
                style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 14,
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: 15,
                }}
                className="search-input-placeholder-white"
            />
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

// ============ EMPTY STATE COMPONENT ============

const EmptyState = ({ onAdd, showAdd = true, isSearch }: { onAdd: () => void, showAdd?: boolean, isSearch?: boolean }) => (
    <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
            <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 15 }}>
                     {isSearch ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้า'}
                </Text>
                <br />
                {!isSearch && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        เริ่มต้นเพิ่มสินค้าแรกของคุณ
                    </Text>
                )}
            </div>
        }
        style={{
            padding: '60px 20px',
            background: 'white',
            borderRadius: 24,
            margin: '24px 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
        }}
    >
        {showAdd && !isSearch && (
            <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={onAdd}
                size="large"
                style={{ 
                    background: '#4F46E5', 
                    borderRadius: 12,
                    height: 48,
                    padding: '0 32px',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                    border: 'none'
                }}
            >
                เพิ่มสินค้า
            </Button>
        )}
    </Empty>
);

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Products[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Products[]>([]);
    const [searchText, setSearchText] = useState("");
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

    // Initial Cache Read
    useEffect(() => {
        const cached = readCache<Products[]>("pos:products", 10 * 60 * 1000);
        if (cached && Array.isArray(cached)) {
            setProducts(cached);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        execute(async () => {
            // Fetch all products for client-side filtering support
            const params = new URLSearchParams();
            params.set("limit", "500");
            
            const response = await fetch(`/api/pos/products?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลสินค้าได้');
            }
            const data = await response.json();
            const list = data.data || [];
            setProducts(list);
            writeCache("pos:products", list);
        }, 'กำลังโหลดข้อมูลสินค้า...');
    }, [execute]);

    useEffect(() => {
        if (isAuthorized) {
            fetchProducts();
        }
    }, [isAuthorized, fetchProducts]);

    useRealtimeList(
        socket,
        { create: "products:create", update: "products:update", delete: "products:delete" },
        setProducts
    );

     // Client-side filtering
     useEffect(() => {
        if (searchText) {
            const lower = searchText.toLowerCase();
            const filtered = products.filter((p: Products) => 
                (p.display_name?.toLowerCase().includes(lower)) || 
                (p.product_name?.toLowerCase().includes(lower))
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [products, searchText]);


    // Real-time Metadata Updates
    useRealtimeList(
        socket,
        { create: "category:create", update: "category:update", delete: "category:delete" },
        setCategories
    );

    useRealtimeList(
        socket,
        { create: "productsUnit:create", update: "productsUnit:update", delete: "productsUnit:delete" },
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
                    onRefresh={fetchProducts}
                    onAdd={handleAdd}
                    onSearch={handleSearch}
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
                            description={
                                <div style={{ marginTop: 20 }}>
                                    <Title level={4} style={{ marginBottom: 8, color: '#334155' }}>ยังไม่พร้อมเพิ่มสินค้า</Title>
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
                                        style={{ height: 45, borderRadius: 12, background: '#4F46E5', border: 'none' }}
                                    >
                                        เพิ่มหมวดหมู่สินค้า
                                    </Button>
                                )}
                                {!setupState.hasUnits && (
                                    <Button 
                                        type="primary" 
                                        size="large"
                                        onClick={() => router.push("/pos/productsUnit")}
                                        style={{ height: 45, borderRadius: 12, background: '#10B981', border: 'none' }}
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
                }
            `}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchProducts}
                onAdd={handleAdd}
                onSearch={handleSearch}
                disabledAdd={!hasMetadata}
            />

            {!isMetadataLoading && !hasMetadata && products.length > 0 && (
                <div style={{ margin: '0 16px 20px', position: 'relative', zIndex: 10 }}>
                    <Alert
                        message="ตั้งค่าไม่สมบูรณ์"
                        description={getSetupMissingMessage(categories, units)}
                        type="warning"
                        showIcon
                        style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(251, 146, 60, 0.1)' }}
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
            <div style={{ marginTop: -32, padding: '0 16px', position: 'relative', zIndex: 10 }}>
                <StatsCard 
                    totalProducts={products.length}
                    activeProducts={activeProducts.length}
                    inactiveProducts={inactiveProducts.length}
                />
            </div>

            {/* Products List */}
            <div style={pageStyles.listContainer}>
                {filteredProducts.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <div style={{ 
                                width: 4, 
                                height: 16, 
                                background: '#4F46E5', 
                                borderRadius: 2 
                            }} />
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                                รายการสินค้า
                            </span>
                            <div style={{
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                padding: '2px 10px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 700,
                                marginLeft: 'auto'
                            }}>
                                {filteredProducts.length}
                            </div>
                        </div>

                        {filteredProducts.map((product, index) => (
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
                    <EmptyState onAdd={handleAdd} showAdd={hasMetadata} isSearch={!!searchText} />
                )}
            </div>
             {/* Bottom padding */}
             <div style={{ height: 40 }} />
        </div>
    );
}

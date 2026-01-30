'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography, Tag, Button, Empty } from 'antd';
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
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { pageStyles, globalStyles } from '../../../../theme/pos/products/style';

const { Text, Title } = Typography;

// ============ HEADER COMPONENT ============

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
}

const PageHeader = ({ onRefresh, onAdd }: HeaderProps) => (
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
                            ฿{Number(product.price).toLocaleString()}
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

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
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
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            เพิ่มสินค้า
        </Button>
    </Empty>
);

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Products[]>([]);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });


    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    const fetchProducts = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/products');
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
            fetchProducts();
        }
    }, [isAuthorized, fetchProducts]);

    useRealtimeList(
        socket,
        { create: "products:create", update: "products:update", delete: "products:delete" },
        setProducts
    );

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

    return (
        <div className="products-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchProducts}
                onAdd={handleAdd}
            />
            
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
                    <EmptyState onAdd={handleAdd} />
                )}
            </div>
        </div>
    );
}

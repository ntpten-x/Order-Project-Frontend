'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { Products } from "../../../../types/api/pos/products";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    ProductsPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    ProductCard,
    EmptyState
} from './style';

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

export default function ProductsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [products, setProducts] = useState<Products[]>([]);
    const { execute } = useAsyncAction();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const [csrfToken, setCsrfToken] = useState<string>("");

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await authService.getCsrfToken();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchProducts = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/products');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลสินค้าได้');
            }
            const data = await response.json();
            setProducts(data);
        }, 'กำลังโหลดข้อมูลสินค้า...');
    }, [execute]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                setIsAuthorized(false);
                setTimeout(() => {
                    router.replace('/login');
                }, 1000); 
            } else if (user.role !== 'Admin') {
                setIsAuthorized(false);
                message.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
                setTimeout(() => {
                    router.replace('/pos');
                }, 1000); 
            } else {
                setIsAuthorized(true);
                fetchProducts();
            }
        }
    }, [user, authLoading, router, fetchProducts]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        if (!socket) return;

        socket.on('products:create', (newItem: Products) => {
            setProducts((prev) => [...prev, newItem]);
        });

        socket.on('products:update', (updatedItem: Products) => {
            setProducts((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on('products:delete', ({ id }: { id: string }) => {
            setProducts((prev) => prev.filter((item) => item.id !== id));
        });

        return () => {
            socket.off('products:create');
            socket.off('products:update');
            socket.off('products:delete');
        };
    }, [socket]);

    const handleAdd = () => {
        showLoading();
        router.push('/pos/products/manage/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (product: Products) => {
        showLoading();
        router.push(`/pos/products/manage/edit/${product.id}`);
        setTimeout(() => hideLoading(), 1000);
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

    if (authLoading || isAuthorized === null) {
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

    if (isAuthorized === false) {
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
            <ProductsPageStyles />
            
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
